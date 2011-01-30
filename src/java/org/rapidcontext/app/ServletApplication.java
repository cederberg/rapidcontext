/*
 * RapidContext <http://www.rapidcontext.com/>
 * Copyright (c) 2007-2010 Per Cederberg & Dynabyte AB.
 * All rights reserved.
 *
 * This program is free software: you can redistribute it and/or
 * modify it under the terms of the BSD license.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 *
 * See the RapidContext LICENSE.txt file for more details.
 */

package org.rapidcontext.app;

import java.io.File;
import java.io.IOException;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.logging.Level;
import java.util.logging.Logger;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.lang.StringUtils;
import org.rapidcontext.app.web.DownloadRequestHandler;
import org.rapidcontext.app.web.FileRequestHandler;
import org.rapidcontext.app.web.ProcedureRequestHandler;
import org.rapidcontext.app.web.StorageRequestHandler;
import org.rapidcontext.app.web.UploadRequestHandler;
import org.rapidcontext.core.data.Dict;
import org.rapidcontext.core.security.SecurityContext;
import org.rapidcontext.core.security.User;
import org.rapidcontext.core.storage.FileStorage;
import org.rapidcontext.core.storage.Path;
import org.rapidcontext.core.storage.RootStorage;
import org.rapidcontext.core.storage.StorageException;
import org.rapidcontext.core.web.Mime;
import org.rapidcontext.core.web.Request;
import org.rapidcontext.core.web.RequestHandler;
import org.rapidcontext.core.web.SessionManager;
import org.rapidcontext.util.BinaryUtil;
import org.rapidcontext.util.FileUtil;

/**
 * The main application servlet. This servlet handles all incoming
 * web requests.
 *
 * @author Per Cederberg
 * @version  1.0
 */
public class ServletApplication extends HttpServlet {

    /**
     * The class logger.
     */
    private static final Logger LOG =
        Logger.getLogger(ServletApplication.class.getName());

    /**
     * The web files storage path.
     */
    public static final Path PATH_FILES = new Path("/files/");

    /**
     * The context to use for process execution.
     */
    private ApplicationContext ctx = null;

    /**
     * The map of request handlers. Each handler is added with its
     * mapped directory or file path as key.
     */
    private LinkedHashMap handlers = new LinkedHashMap();

    /**
     * Initializes this servlet.
     *
     * @throws ServletException if the initialization failed
     */
    public void init() throws ServletException {
        super.init();
        File baseDir = new File(getServletContext().getRealPath("/"));
        File tmpDir = (File) getServletContext().getAttribute("javax.servlet.context.tempdir");
        if (tmpDir == null) {
            try {
                tmpDir = FileUtil.tempDir("rapidcontext", "");
            } catch (IOException e) {
                tmpDir = new File(baseDir, "temp");
                tmpDir.mkdir();
                tmpDir.deleteOnExit();
            }
        }
        FileUtil.setTempDir(tmpDir);
        Mime.context = getServletContext();
        handlers.put("/rapidcontext/download", new DownloadRequestHandler());
        handlers.put("/rapidcontext/upload", new UploadRequestHandler());
        handlers.put("/rapidcontext/procedure/", new ProcedureRequestHandler());
        handlers.put("/rapidcontext/storage/", new StorageRequestHandler());
        handlers.put("/", new FileRequestHandler());
        ctx = ApplicationContext.init(baseDir, baseDir, true);
        // TODO: move the doc directory into the system plug-in storage
        File docDir = new File(baseDir, "doc");
        FileStorage docStore = new FileStorage(docDir, false);
        RootStorage root = (RootStorage) ctx.getStorage();
        try {
            root.mount(docStore, PATH_FILES.child("doc", true), false, false, 0);
        } catch (StorageException e) {
            LOG.log(Level.SEVERE, "failed to mount doc storage", e);
        }
    }

    /**
     * Uninitializes this servlet.
     */
    public void destroy() {
        ApplicationContext.destroy();
        handlers.clear();
        super.destroy();
    }

    /**
     * Processes a servlet request.
     *
     * @param req            the servlet request
     * @param resp           the servlet response
     *
     * @throws ServletException if an internal error occurred when processing
     *             the request
     * @throws IOException if an IO error occurred when processing the request
     */
    protected void service(HttpServletRequest req, HttpServletResponse resp)
    throws ServletException, IOException {

        Request         request = new Request(req, resp);
        Iterator        iter = handlers.keySet().iterator();
        String          path = request.getPath();
        String          handlerPath;
        String          incompletePath;
        RequestHandler  handler;

        try {
            processAuth(request);
            while (!request.hasResponse() && iter.hasNext()) {
                handlerPath = (String) iter.next();
                incompletePath = StringUtils.removeEnd(handlerPath, "/");
                handler = (RequestHandler) handlers.get(handlerPath);
                if (path.startsWith(handlerPath)) {
                    request.setPath(path.substring(handlerPath.length()));
                    handler.process(request);
                } else if (path.equals(incompletePath)) {
                    request.sendRedirect(request.getUrl() + "/");
                }
            }
            if (!request.hasResponse()) {
                request.sendError(HttpServletResponse.SC_NOT_FOUND);
            }
            request.commit();
        } catch (IOException e) {
            LOG.info("IO error when processing request: " + request);
        }
        LOG.fine(ip(request) + "Request to " + request.getPath() +
                 " processed in " + request.getProcessTime() +
                 " millisecs");
        request.dispose();
    }

    /**
     * Processes authentication for a servlet request. Note that a
     * request response may be set if the request has been handled,
     * for instance by returning an HTTP authentication request.
     * On successful authentication, the current user will be set
     * but the request will not contain a response.
     *
     * @param request        the request to process
     */
    private void processAuth(Request request) {
        String  userName = null;
        User    user = null;
        Dict    authData;

        // Authenticate user if provided
        SecurityContext.authClear();
        try {
            if (request.hasSession()) {
                userName = SessionManager.getUser(request.getSession());
            }
            if (userName != null) {
                SecurityContext.auth(userName);
            } else if (isAuthRequired(request)) {
                authData = request.getAuthentication();
                if (authData != null) {
                    processAuthResponse(request, authData);
                }
            }
        } catch (Exception e) {
            LOG.info(ip(request) + e.getMessage());
        }

        // Check required authentication
        user = SecurityContext.currentUser();
        if (user == null && isAuthRequired(request)) {
            request.sendAuthenticationRequest(SecurityContext.REALM,
                                              SecurityContext.nonce());
        }
    }

    /**
     * Checks if authentication is required for a specific resource.
     *
     * @param request        the request to check
     *
     * @return true if the request requires authentication, or
     *         false otherwise
     */
    private boolean isAuthRequired(Request request) {
        String   path = request.getPath().toLowerCase();
        boolean  isRoot = path.equals("") || path.equals("/");

        // TODO: make this control configurable in some way, probably
        //       by checking which resources are available for
        //       anonymous users
        return (isRoot && request.getUrl().endsWith("/")) ||
               path.equals("index.html") ||
               path.startsWith("/rapidcontext/") ||
               !request.hasMethod("GET");
    }

    /**
     * Processes a Basic authentication response.
     *
     * @param request        the request to process
     * @param auth           the authentication data
     *
     * @throws Exception if the user authentication failed
     */
    private void processAuthResponse(Request request, Dict auth)
    throws Exception {
        String  uri = auth.getString("uri", request.getAbsolutePath());
        String  user = auth.getString("username", "");
        String  realm = auth.getString("realm", "");
        String  nonce = auth.getString("nonce", "");
        String  nc = auth.getString("nc", "");
        String  cnonce = auth.getString("cnonce", "");
        String  response = auth.getString("response", "");
        String  suffix;

        if (!SecurityContext.REALM.equals(realm)) {
            LOG.info(ip(request) + "Invalid authentication realm: " + realm);
            throw new SecurityException("Invalid authentication realm");
        }
        SecurityContext.verifyNonce(nonce);
        suffix = ":" + nonce + ":" + nc + ":" + cnonce + ":auth:" +
                 BinaryUtil.hashMD5(request.getMethod() + ":" + uri);
        SecurityContext.authHash(user, suffix, response);
        LOG.fine(ip(request) + "Valid authentication for " + user);
        SessionManager.setUser(request.getSession(), user);
    }

    /**
     * Returns an IP address tag suitable for logging.
     *
     * @param request        the request to use
     *
     * @return the IP address tag for logging
     */
    private String ip(Request request) {
        return "[" + request.getRemoteAddr() + "] ";
    }
}
