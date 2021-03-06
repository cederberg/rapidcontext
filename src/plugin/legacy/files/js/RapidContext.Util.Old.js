/*
 * RapidContext <https://www.rapidcontext.com/>
 * Copyright (c) 2007-2012 Per Cederberg. All rights reserved.
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

if (typeof(RapidContext) == "undefined") {
    RapidContext = {};
}
if (typeof(RapidContext.Util) == "undefined") {
    RapidContext.Util = {};
}

RapidContext.Util._logOnce = function(level, message) {
    var func = arguments.callee.caller;
    if (func.loggedMsg == null) {
        func.loggedMsg = {};
    }
    if (func.loggedMsg[message] !== true) {
        func.loggedMsg[message] = true
        MochiKit.Logging.logger.baseLog(level, message);
    }
};

/**
 * Returns the current execution stack trace. The stack trace is an array of
 * function names with the innermost function at the lowest index (0). Due to
 * limitations in the JavaScript API:s, the stack trace will be cut if
 * recursion is detected. The stack trace will also be cut if the call depth
 * exceeds the maximum depth or if any function in the chain has an injected
 * stack trace.
 *
 * @param {Number} [maxDepth] the maximum call depth, defaults to 20
 *
 * @return {Array} the stack trace array of function names
 *
 * @deprecated This function will be removed in the future. Custom code for
 *     logging and determining stack traces is obsolete, since `console.log`
 *     now provides a better solution.
 *
 * @see RapidContext.Util.functionName
 * @see RapidContext.Util.injectStackTrace
 */
RapidContext.Util.stackTrace = function (maxDepth) {
    var func = arguments.callee.caller;
    var visited = [];
    var res = [];
    maxDepth = maxDepth || 20;
    while (func != null) {
        if (MochiKit.Base.findIdentical(visited, func) >= 0) {
            res.push("...recursion...");
            break;
        }
        if (func.$stackTrace != null) {
            res = res.concat(func.$stackTrace);
            break;
        }
        var name = RapidContext.Util.functionName(func);
        if (name === null) {
            // Skip stack trace when null (but not when undefined)
        } else {
            res.push(name || "<anonymous>");
        }
        visited.push(func);
        if (visited.length >= maxDepth) {
            res.push("...");
            break;
        }
        func = func.caller;
    }
    return res;
};

/**
 * Injects a stack trace for a function. This method is useful for creating a
 * fake stack trace in anonymous or callback functions. A `null` value can be
 * used to clear any previously injected stack trace for the calling function.
 *
 * @param {Array} stackTrace the stack trace, or `null` to clear
 * @param {Function} [func] the function to modify, or `null` for the
 *            currently executing function (i.e. the caller)
 *
 * @deprecated This function will be removed in the future. Custom code for
 *     logging and determining stack traces is obsolete, since `console.log`
 *     now provides a better solution.
 */
RapidContext.Util.injectStackTrace = function (stackTrace, func) {
    func = func || arguments.callee.caller;
    if (func != null) {
        if (stackTrace) {
            func.$stackTrace = stackTrace;
        } else {
            delete func.$stackTrace;
        }
    }
};

/**
 * Checks if the specified value corresponds to false. This function
 * will equate false, undefined, null, 0, "", [], "false" and "null"
 * with a boolean false value.
 *
 * @param {Object} value the value to check
 *
 * @return {Boolean} true if the value corresponds to false, or
 *         false otherwise
 *
 * @deprecated Use MochiKit.Base.bool instead.
 */
RapidContext.Util.isFalse = function (value) {
    var msg = "RapidContext.Util.isFalse is deprecated. Use " +
              "MochiKit.Base.bool instead.";
    RapidContext.Util._logOnce('DEBUG', msg);
    return !MochiKit.Base.bool(value);
};

/**
 * Returns the first argument that is not undefined.
 *
 * @param {Object} [...] the values to check
 *
 * @return {Object} the first non-undefined argument, or
 *         undefined if all arguments were undefined
 *
 * @example
 * RapidContext.Util.defaultValue(undefined, window.noSuchProp, 1)
 *     --> 1
 *
 * @example
 * RapidContext.Util.defaultValue(0, 1)
 *     --> 0
 *
 * @example
 * RapidContext.Util.defaultValue(null, 1)
 *     --> null
 *
 * @example
 * RapidContext.Util.defaultValue()
 *     --> undefined
 */
RapidContext.Util.defaultValue = function (/* ... */) {
    for (var i = 0; i < arguments.length; i++) {
        if (typeof(arguments[i]) != "undefined") {
            return arguments[i];
        }
    }
    return arguments[0];
};

/**
 * Creates a new object by copying keys and values from another
 * object. A list of key names (or an object whose property names
 * will be used as keys) must be specified as an argument. The
 * returned object will only contain properties that were defined in
 * the source object, keeping the source object values. The source
 * object will be left unmodified.
 *
 * @param {Object} src the source object to select values from
 * @param {Array/Object} keys the list of keys to select, or an
 *            object with the keys to select
 *
 * @return {Object} a new object containing the matching keys and
 *             values found in the source object
 *
 * @example
 * RapidContext.Util.select({ a: 1, b: 2 }, ['a', 'c']);
 *     --> { a: 1 }
 *
 * @example
 * RapidContext.Util.select({ a: 1, b: 2 }, { a: true, c: true });
 *     --> { a: 1 }
 */
RapidContext.Util.select = function (src, keys) {
    var res = {};
    if (!MochiKit.Base.isArrayLike(keys)) {
        keys = MochiKit.Base.keys(keys);
    }
    for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (k in src) {
            res[k] = src[k];
        }
    }
    return res;
};

/**
 * Finds the index of an object in a list having a specific property
 * value. The value will be compared using MochiKit.Base.compare.
 *
 * @param {Array} lst the Array-like object to search
 * @param {String} key the property key name
 * @param {Object} value the property value to search for
 * @param {Number} [start] the search start index, defaults to 0
 * @param {Number} [end] the search end index, defaults to lst.length
 *
 * @return {Number} the array index found, or
 *         -1 if not found
 */
RapidContext.Util.findProperty = function (lst, key, value, start, end) {
    if (typeof(end) == "undefined" || end === null) {
        end = (lst == null) ? 0 : lst.length;
    }
    if (typeof(start) == "undefined" || start === null) {
        start = 0;
    }
    var cmp = MochiKit.Base.compare;
    for (var i = start; lst != null && i < end; i++) {
        if (lst[i] != null && cmp(lst[i][key], value) === 0) {
            return i;
        }
    }
    return -1;
};

/**
 * Returns a truncated copy of a string or an array. If the string
 * or array is shorter than the specified maximum length, the object
 * will be returned unmodified. If an optional tail string or array
 * is specified, additional elements will be removed from the object
 * to append it to the end.
 *
 * @param {String/Array} obj the string or array to truncate
 * @param {Number} maxLength the maximum length
 * @param {String/Array} tail the optional tail to use on truncation
 *
 * @return {String/Array} the truncated string or array
 *
 * @deprecated Use MochiKit.Text.truncate instead.
 */
RapidContext.Util.truncate = function (obj, maxLength, tail) {
    var msg = "RapidContext.Util.truncate is deprecated. Use " +
              "MochiKit.Text.truncate instead.";
    RapidContext.Util._logOnce('DEBUG', msg);
    return MochiKit.Text.truncate(obj, maxLength, tail);
};

/**
 * Formats a number using two digits, i.e. pads with a leading zero
 * character if the number is only one digit.
 *
 * @param {Number} value the number to format
 *
 * @return {String} the formatted number string
 *
 * @function
 */
RapidContext.Util.twoDigitNumber = MochiKit.Format.numberFormatter("00");

RapidContext.Util._MILLIS_PER_SECOND = 1000;
RapidContext.Util._MILLIS_PER_MINUTE = 60 * 1000;
RapidContext.Util._MILLIS_PER_HOUR = 60 * 60 * 1000;
RapidContext.Util._MILLIS_PER_DAY = 24 * 60 * 60 * 1000;
RapidContext.Util._MILLIS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

/**
 * Creates a new time period object from a number of milliseconds.
 *
 * @param {Number} millis the number of milliseconds in the period
 *
 * @return {Object} new time duration object
 */
RapidContext.Util._toDuration = function (millis) {
    return {
        days: Math.floor(millis / RapidContext.Util._MILLIS_PER_DAY),
        hours: Math.floor(millis / RapidContext.Util._MILLIS_PER_HOUR) % 24,
        minutes: Math.floor(millis / RapidContext.Util._MILLIS_PER_MINUTE) % 60,
        seconds: Math.floor(millis / RapidContext.Util._MILLIS_PER_SECOND) % 60,
        millis: millis % 1000
    };
};

/**
 * Converts a number of milliseconds to an approximate time period.
 *
 * @param {Number} millis the number of milliseconds
 *
 * @return {String} the string representation of the period
 */
RapidContext.Util.toApproxPeriod = function (millis) {
    var p = RapidContext.Util._toDuration(millis);
    if (p.days >= 10) {
        return p.days + " days";
    } else if (p.days >= 1) {
        return p.days + " days " + p.hours + " hours";
    } else if (p.hours >= 1) {
        return p.hours + ":" + MochiKit.Text.padLeft("" + p.minutes, 2, "0") + " hours";
    } else if (p.minutes >= 1) {
        return p.minutes + ":" + MochiKit.Text.padLeft("" + p.seconds, 2, "0") + " minutes";
    } else if (p.seconds >= 1) {
        return p.seconds + " seconds";
    } else {
        return p.millis + " milliseconds";
    }
};

/**
 * Creates a programmers debug representation of a DOM node. This method is
 * similar to `MochiKit.DOM.emitHtml`, except for that it does not recurse into
 * child nodes.
 *
 * @param {Object} node the HTML DOM node
 *
 * @return {String} a debug representation of the DOM node
 */
RapidContext.Util.reprDOM = function (node) {
    if (node == null) {
        return "null";
    } else if (typeof(node) === 'string') {
        return node;
    } else if (node.nodeType === 1) { // Node.ELEMENT_NODE
        var res = "<" + node.tagName.toLowerCase();
        var attrs = MochiKit.Base.map(RapidContext.Util.reprDOM, node.attributes);
        res += attrs.join("");
        if (node.hasChildNodes()) {
            res += " ["  + node.childNodes.length + " child nodes]";
        }
        res += "/>";
        return res;
    } else if (node.nodeType === 2) { // Node.ATTRIBUTE_NODE
        return " " + node.name + '="' +
               MochiKit.DOM.escapeHTML(node.value) + '"';
    } else if (node.nodeType === 3) { // Node.TEXT_NODE
        return MochiKit.DOM.escapeHTML(node.nodeValue);
    } else {
        return node.toString();
    }
};

/**
 * Returns the margin sizes for an HTML DOM node. The margin sizes
 * for all four sides will be returned.
 *
 * @param {Object} node the HTML DOM node
 *
 * @return {Object} an object with "t", "b", "l" and "r" properties,
 *         each containing either an integer value or null
 */
RapidContext.Util.getMarginBox = function (node) {
    var getStyle = MochiKit.Style.getStyle;
    var px = RapidContext.Util.toPixels;
    return { t: px(getStyle(node, "margin-top")),
             b: px(getStyle(node, "margin-bottom")),
             l: px(getStyle(node, "margin-left")),
             r: px(getStyle(node, "margin-right")) };
};

/**
 * Returns the border widths for an HTML DOM node. The widths for
 * all four sides will be returned.
 *
 * @param {Object} node the HTML DOM node
 *
 * @return {Object} an object with "t", "b", "l" and "r" properties,
 *         each containing either an integer value or null
 */
RapidContext.Util.getBorderBox = function (node) {
    var getStyle = MochiKit.Style.getStyle;
    var px = RapidContext.Util.toPixels;
    return { t: px(getStyle(node, "border-width-top")),
             b: px(getStyle(node, "border-width-bottom")),
             l: px(getStyle(node, "border-width-left")),
             r: px(getStyle(node, "border-width-right")) };
};

/**
 * Returns the padding sizes for an HTML DOM node. The sizes for all
 * four sides will be returned.
 *
 * @param {Object} node the HTML DOM node
 *
 * @return {Object} an object with "t", "b", "l" and "r" properties,
 *         each containing either an integer value or null
 */
RapidContext.Util.getPaddingBox = function (node) {
    var getStyle = MochiKit.Style.getStyle;
    var px = RapidContext.Util.toPixels;
    return { t: px(getStyle(node, "padding-top")),
             b: px(getStyle(node, "padding-bottom")),
             l: px(getStyle(node, "padding-left")),
             r: px(getStyle(node, "padding-right")) };
};

/**
 * Converts a style pixel value to the corresponding integer. If the
 * string ends with "px", those characters will be silently removed.
 *
 * @param {String} value the style string value to convert
 *
 * @return {Number} the numeric value, or
 *         null if the conversion failed
 */
RapidContext.Util.toPixels = function (value) {
    value = parseInt(value);
    return isNaN(value) ? null : value;
};

/**
 * Returns the scroll offset for an HTML DOM node.
 *
 * @param {Object} node the HTML DOM node
 *
 * @return {Object} a MochiKit.Style.Coordinates object with "x" and
 *         "y" properties containing the element scroll offset
 */
RapidContext.Util.getScrollOffset = function (node) {
    node = MochiKit.DOM.getElement(node);
    var x = node.scrollLeft || 0;
    var y = node.scrollTop || 0;
    return new MochiKit.Style.Coordinates(x, y);
};

/**
 * Sets the scroll offset for an HTML DOM node.
 *
 * @param {Object} node the HTML DOM node
 * @param {Object} offset the MochiKit.Style.Coordinates containing
 *            the new scroll offset "x" and "y" values
 */
RapidContext.Util.setScrollOffset = function (node, offset) {
    node = MochiKit.DOM.getElement(node);
    node.scrollLeft = offset.x;
    node.scrollTop = offset.y;
};

/**
 * Resets the scroll offsets to zero for for an HTML DOM node.
 * Optionally all child node offsets can also be reset.
 *
 * @param {Object} node the HTML DOM node
 * @param {Boolean} [recursive] the recursive flag, defaults to
 *            false
 */
RapidContext.Util.resetScrollOffset = function (node, recursive) {
    node = MochiKit.DOM.getElement(node);
    node.scrollLeft = 0;
    node.scrollTop = 0;
    if (recursive) {
        node = node.firstChild;
        while (node != null) {
            if (node.nodeType === 1) { // Node.ELEMENT_NODE
                RapidContext.Util.resetScrollOffset(node, true);
            }
            node = node.nextSibling;
        }
    }
};

/**
 * Adjusts the scroll offsets for an HTML DOM node to ensure optimal
 * visibility for the specified coordinates box. This function will
 * scroll the node both vertially and horizontally to ensure that
 * the top left corner of the box is always visible and that as much
 * of the box extent as possible is visible.
 *
 * @param {Object} node the HTML DOM node
 * @param {Object} box the coordinates box with optional properties
 *            {l, t, r, b} or {x, y, w, h}
 */
RapidContext.Util.adjustScrollOffset = function (node, box) {
    node = MochiKit.DOM.getElement(node);
    var dim = MochiKit.Style.getElementDimensions(node);
    var xMin = RapidContext.Util.defaultValue(box.l, box.x, NaN);
    var xMax = RapidContext.Util.defaultValue(box.r, xMin + box.w, NaN);
    var yMin = RapidContext.Util.defaultValue(box.t, box.y, NaN);
    var yMax = RapidContext.Util.defaultValue(box.b, yMin + box.h, NaN);
    if (!isNaN(xMax) && node.scrollLeft + dim.w < xMax) {
        node.scrollLeft = xMax - dim.h;
    }
    if (!isNaN(xMin) && node.scrollLeft > xMin) {
        node.scrollLeft = xMin;
    }
    if (!isNaN(yMax) && node.scrollTop + dim.h < yMax) {
        node.scrollTop = yMax - dim.h;
    }
    if (!isNaN(yMin) && node.scrollTop > yMin) {
        node.scrollTop = yMin;
    }
};
