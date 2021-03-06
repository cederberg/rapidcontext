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

package org.rapidcontext.core.proc;

import java.util.ArrayList;

/**
 * The default procedure call interceptor. This interceptor provides
 * the standard implementation for all methods (necessary since it
 * is the last link in the interceptor chain). All actual procedure
 * calls will be delegated to the actual procedure implementation,
 * and resource reservation will be delegated to the call context.
 *
 * @author   Per Cederberg
 * @version  1.0
 */
public class DefaultInterceptor extends Interceptor {

    /**
     * Creates a new default interceptor.
     */
    public DefaultInterceptor() {
        super(null);
    }

    /**
     * Reserves all adapter connections needed for executing the
     * specified procedure. All connections needed by imported
     * procedures will also be reserved recursively.
     *
     * @param cx             the procedure context
     * @param proc           the procedure definition
     *
     * @throws ProcedureException if the connections couldn't be
     *             reserved
     */
    public void reserve(CallContext cx, Procedure proc)
    throws ProcedureException {

        if (cx.getCallStack().contains(proc)) {
            return;
        }
        Bindings bindings = proc.getBindings();
        cx.getCallStack().push(proc, bindings);
        try {
            String[] names = bindings.getNames();
            for (int i = 0; i < names.length; i++) {
                if (bindings.getType(names[i]) == Bindings.CONNECTION) {
                    String value = (String) bindings.getValue(names[i], null);
                    cx.connectionReserve(value);
                } else if (bindings.getType(names[i]) == Bindings.PROCEDURE) {
                    String value = (String) bindings.getValue(names[i]);
                    cx.reserve(cx.getLibrary().getProcedure(value));
                }
            }
        } finally {
            cx.getCallStack().pop();
        }
    }

    /**
     * Releases all reserved adapter connections. The connections
     * will either be committed or rolled back, depending on the
     * commit flag.
     *
     * @param cx             the procedure context
     * @param commit         the commit (or rollback) flag
     */
    public void releaseAll(CallContext cx, boolean commit) {
        cx.connectionReleaseAll(commit);
    }

    /**
     * Calls a procedure with the specified bindings.
     *
     * @param cx             the procedure context
     * @param proc           the procedure definition
     * @param bindings       the procedure bindings
     *
     * @return the result of the call, or
     *         null if the call produced no result
     *
     * @throws ProcedureException if the call execution caused an
     *             error
     */
    public Object call(CallContext cx, Procedure proc, Bindings bindings)
        throws ProcedureException {

        if (cx.isTracing()) {
            return traceCall(cx, proc, bindings);
        } else {
            return proc.call(cx, bindings);
        }
    }

    /**
     * Calls a procedure with the specified bindings while logging
     * both call parameters and response data.
     *
     * @param cx             the procedure context
     * @param proc           the procedure definition
     * @param bindings       the procedure bindings
     *
     * @return the result of the call, or
     *         null if the call produced no result
     *
     * @throws ProcedureException if the call execution caused an
     *             error
     */
    private Object traceCall(CallContext cx, Procedure proc, Bindings bindings)
        throws ProcedureException {

        try {
            String[] names = bindings.getNames();
            ArrayList<Object> args = new ArrayList<>(names.length);
            for (int i = 0; i < names.length; i++) {
                if (bindings.getType(names[i]) == Bindings.ARGUMENT) {
                    args.add(bindings.getValue(names[i], null));
                }
            }
            cx.logCall(proc.getName(), args.toArray());
            Object obj = proc.call(cx, bindings);
            cx.logResponse(obj);
            return obj;
        } catch (ProcedureException e) {
            cx.logError(e);
            throw e;
        }
    }
}
