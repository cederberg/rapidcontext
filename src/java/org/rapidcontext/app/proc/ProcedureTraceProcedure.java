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

import org.apache.commons.lang.StringUtils;
import org.rapidcontext.core.proc.Bindings;
import org.rapidcontext.core.proc.CallContext;
import org.rapidcontext.core.proc.Procedure;
import org.rapidcontext.core.proc.ProcedureException;

/**
 * The built-in procedure trace procedure.
 *
 * @author   Per Cederberg
 * @version  1.0
 */
public class ProcedureTraceProcedure implements Procedure {

    /**
     * The procedure name constant.
     */
    public static final String NAME = "System.Procedure.Trace";

    /**
     * The default bindings.
     */
    private Bindings defaults = new Bindings();

    /**
     * Creates a new procedure write procedure.
     *
     * @throws ProcedureException if the initialization failed
     */
    public ProcedureTraceProcedure() throws ProcedureException {
        defaults.set("name", Bindings.ARGUMENT, "", "The procedure name");
        defaults.set("tracing", Bindings.ARGUMENT, "", "The enable/disable tracing flag");
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
        return "Sets the procedure call tracing flag for subsequent calls. " +
               "This is an in-memory flag only and will be reset on restarts " +
               "or similar. Requires write access to the procedure.";
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

        String name = ((String) bindings.getValue("name")).trim();
        if (name.length() == 0) {
            throw new ProcedureException("invalid procedure name");
        }
        String flag = bindings.getValue("tracing").toString().trim();
        boolean tracing = StringUtils.equalsIgnoreCase(flag, "true") ||
                          StringUtils.equalsIgnoreCase(flag, "on") ||
                          flag.equals("1");
        CallContext.checkWriteAccess("procedure/" + name);
        cx.getLibrary().setTracing(name, tracing);
        return "" + tracing;
    }
}
