/*
 * RapidContext JDBC plug-in <http://www.rapidcontext.com/>
 * Copyright (c) 2007-2009 Per Cederberg. All rights reserved.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

package org.rapidcontext.app.plugin.jdbc;

import java.sql.PreparedStatement;

import org.rapidcontext.core.env.AdapterException;
import org.rapidcontext.core.proc.ProcedureException;

/**
 * A JDBC SQL query procedure. This procedure encapsulates the code
 * for executing a parameterized SQL query and returning the results
 * in a structured format.
 *
 * @author   Per Cederberg
 * @version  1.0
 */
public class JdbcQueryProcedure extends JdbcProcedure {

    /**
     * Creates a new JDBC query procedure.
     *
     * @throws ProcedureException if the initialization failed
     */
    public JdbcQueryProcedure() throws ProcedureException {
        super();
    }

    /**
     * Executes an SQL query on the specified connection.
     *
     * @param con            the JDBC connection to use
     * @param stmt           the SQL prepared statement
     * @param flags          the processing and mapping flags
     *
     * @return the query results, or
     *         null for statements
     *
     * @throws ProcedureException if the SQL couldn't be executed
     *             correctly
     */
    protected Object execute(JdbcConnection con,
                             PreparedStatement stmt,
                             String flags)
        throws ProcedureException {

        try {
            return con.executeQuery(stmt, flags);
        } catch (AdapterException e) {
            throw new ProcedureException(e.getMessage());
        }
    }
}
