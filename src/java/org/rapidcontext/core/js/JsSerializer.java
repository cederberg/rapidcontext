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

import java.util.Date;
import java.util.logging.Level;
import java.util.logging.Logger;

import org.apache.commons.lang.StringUtils;
import org.mozilla.javascript.ConsString;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.ContextFactory;
import org.mozilla.javascript.NativeArray;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.Undefined;
import org.mozilla.javascript.UniqueTag;
import org.mozilla.javascript.WrappedException;
import org.mozilla.javascript.Wrapper;
import org.rapidcontext.core.data.Array;
import org.rapidcontext.core.data.Dict;
import org.rapidcontext.core.data.TextEncoding;
import org.rapidcontext.core.storage.StorableObject;

/**
 * An object serializer and unserializer for the JavaScript object
 * notation (JSON) format. This class also provides methods for
 * wrapping dictionary and array object for access inside the
 * JavaScript engine. The object mapping to JavaScript is not exact,
 * and may omit serialization of data in some cases. The following
 * basic requirements must be met in order to serialize an object:
 *
 * <ul>
 *   <li>No circular references are permitted.
 *   <li>String, Integer, Boolean, Array or Dict objects are supported.
 * </ul>
 *
 * @author   Per Cederberg
 * @version  1.0
 */
public class JsSerializer {

    /**
     * The class logger.
     */
    private static final Logger LOG =
        Logger.getLogger(JsSerializer.class.getName());

    /**
     * Serializes an object into a JavaScript literal (JSON). The
     * string returned can be used as a constant inside JavaScript
     * code or returned via a JSON API. If the indentation flag is
     * set, the JSON data will be indented and formatted. Otherwise
     * a minimal string will be returned.
     *
     * @param obj            the object to convert, or null
     * @param indent         the indentation flag
     *
     * @return a JavaScript literal
     */
    public static String serialize(Object obj, boolean indent) {
        StringBuilder buffer = new StringBuilder();
        serialize(unwrap(obj), indent ? 0 : -1, buffer);
        if (indent) {
            buffer.append("\n");
        }
        return buffer.toString();
    }

    /**
     * Serializes an object into a JavaScript literal (JSON). The
     * string returned can be used as a constant inside JavaScript
     * code or returned via a JSON API. If the indentation flag is
     * set, the JSON data will be indented and formatted. Otherwise
     * a minimal string will be created. The serialized result will
     * be written into the specified string buffer.
     *
     * @param obj            the object to convert, or null
     * @param indent         the indentation level, or -1 for none
     * @param buffer         the string buffer to append into
     */
    private static void serialize(Object obj, int indent, StringBuilder buffer) {
        if (obj == null) {
            buffer.append("null");
        } else if (obj instanceof Dict) {
            serialize((Dict) obj, indent, buffer);
        } else if (obj instanceof Array) {
            serialize((Array) obj, indent, buffer);
        } else if (obj instanceof Boolean) {
            buffer.append(obj.toString());
        } else if (obj instanceof Number) {
            serialize((Number) obj, buffer);
        } else if (obj instanceof Date) {
            buffer.append("\"@" + ((Date) obj).getTime() + "\"");
        } else if (obj instanceof Class) {
            buffer.append(TextEncoding.encodeJson(((Class<?>) obj).getName()));
        } else if (obj instanceof StorableObject) {
            serialize(((StorableObject) obj).serialize(), indent, buffer);
        } else {
            buffer.append(TextEncoding.encodeJson(obj.toString()));
        }
    }

    /**
     * Serializes a dictionary into a JavaScript literal (JSON). The
     * string returned can be used as a constant inside JavaScript
     * code or returned via a JSON API. If the indentation flag is
     * set, the JSON data will be indented and formatted. Otherwise
     * a minimal string will be created. The serialized result will
     * be written into the specified string buffer.
     *
     * @param dict           the dictionary to convert
     * @param indent         the indentation level, or -1 for none
     * @param buffer         the string buffer to append into
     */
    private static void serialize(Dict dict, int indent, StringBuilder buffer) {
        int indentNext = (indent < 0) ? indent : indent + 1;
        String prefix = "";
        String infix = ":";
        if (indent >= 0) {
            prefix = "\n" + StringUtils.repeat("  ", indent + 1);
            infix += " ";
        }
        String[] keys = dict.keys();
        buffer.append("{");
        for (int i = 0; i < keys.length; i++) {
            if (i > 0) {
                buffer.append(",");
            }
            buffer.append(prefix);
            buffer.append(TextEncoding.encodeJson(keys[i]));
            buffer.append(infix);
            serialize(dict.get(keys[i]), indentNext, buffer);
        }
        if (keys.length > 0 && indent >= 0) {
            buffer.append("\n");
            buffer.append(StringUtils.repeat("  ", indent));
        }
        buffer.append("}");
    }

    /**
     * Serializes an array into a JavaScript literal (JSON). The
     * string returned can be used as a constant inside JavaScript
     * code or returned via a JSON API. If the indentation flag is
     * set, the JSON data will be indented and formatted. Otherwise
     * a minimal string will be created. The serialized result will
     * be written into the specified string buffer.
     *
     * @param arr            the array to convert
     * @param indent         the indentation level, or -1 for none
     * @param buffer         the string buffer to append into
     */
    private static void serialize(Array arr, int indent, StringBuilder buffer) {
        int indentNext = (indent < 0) ? indent : indent + 1;
        String prefix = "";
        if (indent >= 0) {
            prefix = "\n" + StringUtils.repeat("  ", indent + 1);
        }
        buffer.append("[");
        for (int i = 0; i < arr.size(); i++) {
            if (i > 0) {
                buffer.append(",");
            }
            buffer.append(prefix);
            serialize(arr.get(i), indentNext, buffer);
        }
        if (arr.size() > 0 && indent >= 0) {
            buffer.append("\n");
            buffer.append(StringUtils.repeat("  ", indent));
        }
        buffer.append("]");
    }

    /**
     * Serializes a number into a JavaScript literal (JSON). The
     * string returned can be used as a constant inside JavaScript
     * code or returned via a JSON API. The serialized result will
     * be written into the specified string buffer.
     *
     * @param num            the number to convert, or null
     * @param buffer         the string buffer to append into
     */
    private static void serialize(Number num, StringBuilder buffer) {
        int     i = num.intValue();
        double  d = num.doubleValue();

        if (i == d) {
            buffer.append(i);
        } else {
            // TODO: proper number formatting should be used
            buffer.append(num);
        }
    }

    /**
     * Unserializes a JavaScript literal into a Java object. I.e.
     * this method converts a JSON object into the corresponding
     * String, Number, Boolean, Dict and/or Array objects.
     *
     * @param str            the string to convert, or null
     *
     * @return the corresponding Java object
     *
     * @throws JsException if the unserialization failed
     */
    public static Object unserialize(String str) throws JsException {
        Context  cx;
        Object   obj;
        String   msg;

        cx = ContextFactory.getGlobal().enterContext();
        try {
            str = "(" + str + ")";
            obj = cx.evaluateString(cx.initStandardObjects(),
                                    str,
                                    "unserialize",
                                    1,
                                    null);
            return unwrap(obj);
        } catch (WrappedException e) {
            msg = "Caught unserialization exception for text: " + str;
            LOG.log(Level.WARNING, msg, e);
            throw new JsException(msg, e.getWrappedException());
        } catch (Exception e) {
            msg = "Caught unserialization exception for text: " + str;
            LOG.log(Level.WARNING, msg, e);
            throw new JsException(msg, e);
        } finally {
            Context.exit();
        }
    }

    /**
     * Wraps a Java object for JavaScript access. This method only
     * handles String, Number, Boolean and Data instances.
     *
     * @param obj            the object to wrap
     * @param scope          the parent scope
     *
     * @return the wrapped object
     *
     * @see org.rapidcontext.core.data.Array
     * @see org.rapidcontext.core.data.Dict
     */
    public static Object wrap(Object obj, Scriptable scope) {
        if (obj instanceof Dict) {
            return new DictWrapper((Dict) obj, scope);
        } else if (obj instanceof Array) {
            return new ArrayWrapper((Array) obj, scope);
        } else {
            return obj;
        }
    }

    /**
     * Removes all JavaScript classes and replaces them with the
     * corresponding Java objects. This method will use instances of
     * Dict and Array to replace native JavaScript objects and arrays.
     * Also, it will replace both JavaScript "null" and "undefined"
     * with null. Any Dict or Array object encountered will be
     * traversed and copied recursively. Other objects will be
     * returned as-is.
     *
     * @param obj            the object to unwrap
     *
     * @return the unwrapped object
     *
     * @see org.rapidcontext.core.data.Array
     * @see org.rapidcontext.core.data.Dict
     */
    public static Object unwrap(Object obj) {
        if (obj == null || obj == UniqueTag.NULL_VALUE) {
            return null;
        } else if (obj instanceof Undefined || obj == UniqueTag.NOT_FOUND) {
            return null;
        } else if (obj instanceof Wrapper) {
            return ((Wrapper) obj).unwrap();
        } else if (obj instanceof ConsString) {
            return obj.toString();
        } else if (obj instanceof NativeArray) {
            NativeArray nativeArr = (NativeArray) obj;
            int length = (int) nativeArr.getLength();
            Array arr = new Array(length);
            for (int i = 0; i < length; i++) {
                arr.set(i, unwrap(nativeArr.get(i, nativeArr)));
            }
            return arr;
        } else if (obj instanceof Scriptable) {
            Scriptable scr = (Scriptable) obj;
            Object[] keys = scr.getIds();
            Dict dict = new Dict(keys.length);
            for (int i = 0; i < keys.length; i++) {
                String str = keys[i].toString();
                Object value = null;
                if (keys[i] instanceof Integer) {
                    value = scr.get(((Integer) keys[i]).intValue(), scr);
                } else {
                    value = scr.get(str, scr);
                }
                if (str != null && str.length() > 0) {
                    dict.set(str, unwrap(value));
                }
            }
            return dict;
        } else {
            return obj;
        }
    }
}
