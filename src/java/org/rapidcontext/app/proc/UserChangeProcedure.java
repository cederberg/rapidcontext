/*
 * RapidContext <https://www.rapidcontext.com/>
 * Copyright (c) 2007-2019 Per Cederberg. All rights reserved.
 *
 * This program is free software: you can redistribute it and/or
 * modify it under the terms of the BSD license.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 *
 * See the RapidContext LICENSE for more details.
 */

package org.rapidcontext.app.proc;

import java.util.logging.Logger;

import org.rapidcontext.core.data.Array;
import org.rapidcontext.core.proc.Bindings;
import org.rapidcontext.core.proc.CallContext;
import org.rapidcontext.core.proc.Procedure;
import org.rapidcontext.core.proc.ProcedureException;
import org.rapidcontext.core.storage.StorageException;
import org.rapidcontext.core.type.User;

/**
 * The built-in user modification procedure.
 *
 * @author   Per Cederberg
 * @version  1.0
 */
public class UserChangeProcedure implements Procedure {

    /**
     * The class logger.
     */
    private static final Logger LOG =
        Logger.getLogger(UserChangeProcedure.class.getName());

    /**
     * The procedure name constant.
     */
    public static final String NAME = "System.User.Change";

    /**
     * The default bindings.
     */
    private Bindings defaults = new Bindings();

    /**
     * Creates a new user modification procedure.
     *
     * @throws ProcedureException if the initialization failed
     */
    public UserChangeProcedure() throws ProcedureException {
        defaults.set("id", Bindings.ARGUMENT, "",
                     "The unique user id");
        defaults.set("name", Bindings.ARGUMENT, "",
                     "The user real name");
        defaults.set("email", Bindings.ARGUMENT, "",
                     "The user email address");
        defaults.set("description", Bindings.ARGUMENT, "",
                     "The user description");
        defaults.set("enabled", Bindings.ARGUMENT, "",
                     "The enabled flag (0 or 1)");
        defaults.set("password", Bindings.ARGUMENT, "",
                     "The new password, or blank for unchanged");
        defaults.set("roles", Bindings.ARGUMENT, "",
                     "The list of roles (separated by spaces)");
        defaults.seal();
    }

    /**
     * Returns the procedure name.
     *
     * @return the procedure name
     */
    public String getName() {
        return NAME;
    }

    /**
     * Returns the procedure description.
     *
     * @return the procedure description
     */
    public String getDescription() {
        return "Creates or updates a user.";
    }

    /**
     * Returns the bindings for this procedure. If this procedure
     * requires any special data, adapter connection or input
     * argument binding, those bindings should be set (but possibly
     * to null or blank values).
     *
     * @return the bindings for this procedure
     */
    public Bindings getBindings() {
        return defaults;
    }

    /**
     * Executes a call of this procedure in the specified context
     * and with the specified call bindings. The semantics of what
     * the procedure actually does, is up to each implementation.
     * Note that the call bindings are normally inherited from the
     * procedure bindings with arguments bound to their call values.
     *
     * @param cx             the procedure call context
     * @param bindings       the call bindings to use
     *
     * @return the result of the call, or
     *         null if the call produced no result
     *
     * @throws ProcedureException if the call execution caused an
     *             error
     */
    public Object call(CallContext cx, Bindings bindings)
        throws ProcedureException {

        // Validate arguments
        String id = bindings.getValue("id", "").toString().trim();
        if (id.length() <= 0) {
            throw new ProcedureException("user id cannot be blank");
        } else if (!id.matches("^[a-zA-Z0-9_/]*$")) {
            throw new ProcedureException("user id contains invalid character");
        }
        CallContext.checkWriteAccess("user/" + id);
        User user = User.find(cx.getStorage(), id);
        String name = bindings.getValue("name", "").toString();
        String email = bindings.getValue("email", "").toString();
        String descr = bindings.getValue("description", "").toString();
        String str = bindings.getValue("enabled", "").toString();
        boolean enabled = (!str.equals("") && !str.equals("false") && !str.equals("0"));
        String pwd = bindings.getValue("password").toString();
        if ((user == null || pwd.length() > 0) && pwd.length() < 5) {
            throw new ProcedureException("password must be at least 5 characters");
        }
        String[] roles = null;
        Object obj = bindings.getValue("roles");
        if (obj instanceof Array) {
            Array list = (Array) obj;
            roles = new String[list.size()];
            for (int i = 0; i < list.size(); i++) {
                roles[i] = list.get(i).toString();
            }
        } else {
            roles = obj.toString().split("[ ,]+");
        }

        // Create or modify user
        String res = null;
        if (user == null) {
            user = new User(id);
            res = user.id() + " created";
        } else {
            res = user.id() + " modified";
        }
        user.setName(name);
        user.setEmail(email);
        user.setDescription(descr);
        user.setEnabled(enabled);
        if (pwd.length() > 0) {
            user.setPassword(pwd);
        }
        user.setRoles(roles);
        try {
            LOG.info("updating " + user);
            User.store(cx.getStorage(), user);
        } catch (StorageException e) {
            throw new ProcedureException(e.getMessage());
        }
        return res;
    }
}
