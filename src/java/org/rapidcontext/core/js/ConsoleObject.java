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

package org.rapidcontext.core.js;

import java.util.logging.Level;
import java.util.logging.Logger;

import org.apache.commons.lang.StringUtils;

/**
 * A JavaScript console object. This class provides a subset of the standard
 * JavaScript console object for logging.
 *
 * @author   Per Cederberg
 * @version  1.0
 */
public class ConsoleObject {

    /**
     * The class logger.
     */
    private static final Logger LOG =
        Logger.getLogger(ConsoleObject.class.getName());

    /**
     * The procedure name.
     */
    private String procName;

    /**
     * Creates a new console object for the specified procedure.
     *
     * @param procName       the procedure name
     */
    public ConsoleObject(String procName) {
        this.procName = procName;
    }

    /**
     * Logs an error message.
     *
     * @param args           the log message arguments
     */
    public void error(Object ...args) {
        logInternal(Level.SEVERE, args);
    }

    /**
     * Logs a warning message.
     *
     * @param args           the log message arguments
     */
    public void warn(Object ...args) {
        logInternal(Level.WARNING, args);
    }

    /**
     * Logs an info message.
     *
     * @param args           the log message arguments
     */
    public void info(Object ...args) {
        logInternal(Level.INFO, args);
    }

    /**
     * Logs a debug message.
     *
     * @param args           the log message arguments
     */
    public void log(Object ...args) {
        logInternal(Level.FINE, args);
    }

    /**
     * Logs a message.
     *
     * @param level          the log level
     * @param args           the log message arguments
     */
    private void logInternal(Level level, Object ...args) {
        for (int i = 0; i < args.length; i++) {
            args[i] = JsSerializer.unwrap(args[i]);
        }
        LOG.log(level, procName + ": " + StringUtils.join(args, " "));
    }
}
