/*
 * RapidContext <http://www.rapidcontext.com/>
 * Copyright (c) 2007-2012 Per Cederberg. All rights reserved.
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

// Create default RapidContext object
if (typeof(RapidContext) == "undefined") {
    RapidContext = {};
}

/**
 * @name RapidContext.Util
 * @namespace Provides utility functions for basic objects, arrays,
 *     DOM nodes and CSS. Mostly these functions extend or improve
 *     upon what is already available in MochiKit (with the goal of
 *     being included there where reasonable).
 */
if (typeof(RapidContext.Util) == "undefined") {
    RapidContext.Util = {};
}


// JSON object for browsers missing it

if (typeof(JSON) == "undefined") {
    var JSON = {};
}
if (!JSON.parse) {
    JSON.parse = MochiKit.Base.evalJSON;
}
if (!JSON.stringify) {
    JSON.stringify = MochiKit.Base.serializeJSON;
}


// General utility functions

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
 * Creates a dictionary object from a list of keys and values.
 * Optionally a list of key-value pairs can be provided instead. As
 * a third option, a single (non-array) value can be assigned to all
 * the keys.<p>
 *
 * If a key is specified twice, only the last value will be used.
 * Note that this function is the reverse of MochiKit.Base.items(),
 * MochiKit.Base.keys() and MochiKit.Base.values().
 *
 * @param {Array} keysOrItems the list of keys or items
 * @param {Array} [values] the list of values (optional if key-value
 *            pairs are specified in first argument)
 *
 * @return {Object} an object with properties for each key-value pair
 *
 * @example
 * RapidContext.Util.dict(['a','b'], [1, 2])
 *     --> { a: 1, b: 2 }
 *
 * @example
 * RapidContext.Util.dict([['a', 1], ['b', 2]])
 *     --> { a: 1, b: 2 }
 *
 * @example
 * RapidContext.Util.dict(['a','b'], true)
 *     --> { a: true, b: true }
 */
RapidContext.Util.dict = function (itemsOrKeys, values) {
    var o = {};
    if (!MochiKit.Base.isArrayLike(itemsOrKeys)) {
        throw new TypeError("First argument must be array-like");
    }
    if (MochiKit.Base.isArrayLike(values) && itemsOrKeys.length !== values.length) {
        throw new TypeError("Both arrays must be of same length");
    }
    for (var i = 0; i < itemsOrKeys.length; i++) {
        var k = itemsOrKeys[i];
        if (k === null || k === undefined) {
            throw new TypeError("Key at index " + i + " is null or undefined");
        } else if (MochiKit.Base.isArrayLike(k)) {
            o[k[0]] = k[1];
        } else if (MochiKit.Base.isArrayLike(values)) {
            o[k] = values[i];
        } else {
            o[k] = values;
        }
    }
    return o;
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
 * Filters an object by removing a list of keys. A list of key names
 * (or an object whose property names will be used as keys) must be
 * specified as an argument. A new object containing the source
 * object values for the specified keys will be returned. The source
 * object will be modified by removing all the specified keys.
 *
 * @param {Object} src the source object to select and modify
 * @param {Array/Object} keys the list of keys to remove, or an
 *            object with the keys to remove
 *
 * @return {Object} a new object containing the matching keys and
 *             values found in the source object
 *
 * @example
 * var o = { a: 1, b: 2 };
 * RapidContext.Util.mask(o, ['a', 'c']);
 *     --> { a: 1 } and also sets o == { b: 2 }
 *
 * @example
 * var o = { a: 1, b: 2 };
 * RapidContext.Util.mask(o, { a: null, c: null });
 *     --> { a: 1 } and also sets o == { b: 2 }
 */
RapidContext.Util.mask = function (src, keys) {
    var res = {};
    if (!MochiKit.Base.isArrayLike(keys)) {
        keys = MochiKit.Base.keys(keys);
    }
    for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (k in src) {
            res[k] = src[k];
            delete src[k];
        }
    }
    return res;
};

/**
 * Converts a string to a title-cased string. All word boundaries
 * are replaced with a single space and the subsequent character is
 * capitalized.<p>
 *
 * All underscore ("_"), hyphen ("-") and lower-upper character
 * pairs are recognized as word boundaries. Note that this function
 * does not change the capitalization of other characters in the
 * string.
 *
 * @param {String} str the string to convert
 *
 * @return {String} the converted string
 *
 * @example
 * RapidContext.Util.toTitleCase("a short heading")
 *     --> "A Short Heading"
 *
 * @example
 * RapidContext.Util.toTitleCase("camelCase")
 *     --> "Camel Case"
 *
 * @example
 * RapidContext.Util.toTitleCase("bounding-box")
 *     --> "Bounding Box"
 *
 * @example
 * RapidContext.Util.toTitleCase("UPPER_CASE_VALUE")
 *     --> "UPPER CASE VALUE"
 */
RapidContext.Util.toTitleCase = function (str) {
    str = MochiKit.Format.strip(str.replace(/[_-]+/g, " "));
    str = str.replace(/[a-z][A-Z]/g, function (match) {
        return match.charAt(0) + " " + match.charAt(1);
    });
    str = str.replace(/(^|\s)[a-z]/g, function (match) {
        return match.toUpperCase();
    });
    return str;
};

/**
 * Returns the name of a function. This is often useful for debugging
 * or logging purposes. If the function is anonymous or the
 * JavaScript environment doesn't provide function <code>name</code>
 * properties, any registered function name or undefined will be
 * returned.
 *
 * @param {Function} func the function to name
 *
 * @return {String} the function name, or undefined if not available
 *
 * @see RapidContext.Util.registerFunctionNames
 */
RapidContext.Util.functionName = function (func) {
    if (func == null) {
        return null;
    } else if (func.name != null && func.name != "") {
        return func.name;
    } else {
        return func.displayName;
    }
};

/**
 * Registers function names for debugging or logging. This is useful
 * when using anonymous functions or inside JavaScript environments
 * that do not provide function <code>name</code> properties. This
 * function will add the specified name as a <code>displayName</code>
 * property to any function that doesn't already have a name. This
 * function will also process any properties or prototype properties
 * recursively adding names like <code>name.[property name]</code>.
 *
 * @param {Object} obj the function or object to register
 * @param {String} name the function or object (class) name
 * @param {Array} [stack] the object stack to avoid circular recursion
 *
 * @see RapidContext.Util.functionName
 */
RapidContext.Util.registerFunctionNames = function (obj, name, stack) {
   if (typeof(obj) === "function" &&
       (obj.name == null || obj.name == "") &&
       typeof(obj.displayName) === "undefined") {
       obj.displayName = name;
   }
   stack = stack || [];
   if (obj != null && name != null &&
       (typeof(obj) === "object" || typeof(obj) === "function") &&
       obj !== Object.prototype && obj !== Function.prototype &&
       typeof(obj.nodeType) !== "number" &&
       MochiKit.Base.findIdentical(stack, obj) < 0) {

       stack.push(obj);
       for (var prop in obj) {
           var str = name + "." + prop;
           RapidContext.Util.registerFunctionNames(obj[prop], str, stack);
       }
       var str = name + ".prototype";
       RapidContext.Util.registerFunctionNames(obj.prototype, str, stack);
       stack.pop();
   }
};

/**
 * Returns the current execution stack trace. The stack trace is an
 * array of function names with the innermost function at the lowest
 * index (0). Due to limitations in the JavaScript API:s, the stack
 * trace will be cut if recursion is detected. The stack trace will
 * also be cut if the call depth exceeds the maximum depth or if any
 * function in the chain has an injected stack trace.
 *
 * @param {Number} [maxDepth] the maximum call depth, defaults to 20
 *
 * @return {Array} the stack trace array of function names
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
 * Injects a stack trace for a function. This method is useful for
 * creating a fake stack trace in anonymous or callback functions. A
 * null value can be used to clear any previously injected stack
 * trace for the calling function.
 *
 * @param {Array} stackTrace the stack trace, or null to clear
 * @param {Function} [func] the function to modify, or null for the
 *            currently executing function (i.e. the caller)
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
 * Resolves a relative URI to an absolute URI. This function will
 * return absolute URI:s directly and traverse any "../" directory
 * paths in the specified URI. The base URI provided must be
 * absolute.
 *
 * @param {String} uri the relative URI to resolve
 * @param {String} [base] the absolute base URI, defaults to the
 *            the current document base URI
 *
 * @return {String} the resolved absolute URI
 */
RapidContext.Util.resolveURI = function (uri, base) {
    base = base || document.baseURI || document.getElementsByTagName("base")[0].href;
    if (uri.indexOf(":") > 0) {
        return uri;
    } else if (uri.indexOf("#") == 0) {
        var pos = base.lastIndexOf("#");
        if (pos >= 0) {
            base = base.substring(0, pos);
        }
        return base + uri;
    } else if (uri.indexOf("/") == 0) {
        var pos = base.indexOf("/", base.indexOf("://") + 3);
        base = base.substring(0, pos);
        return base + uri;
    } else if (uri.indexOf("../") == 0) {
        var pos = base.lastIndexOf("/");
        base = base.substring(0, pos);
        uri = uri.substring(3);
        return RapidContext.Util.resolveURI(uri, base);
    } else {
        var pos = base.lastIndexOf("/");
        base = base.substring(0, pos + 1);
        return base + uri;
    }
};


// DateTime utility functions

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


// DOM utility functions

RapidContext.Util.NS = {
    XHTML: "http://www.w3.org/1999/xhtml",
    XLINK: "http://www.w3.org/1999/xlink",
    SVG: "http://www.w3.org/2000/svg",
    XUL: "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul"
};
RapidContext.Util.NS.HTML = [undefined, null, '', RapidContext.Util.NS.XHTML];

/**
 * Returns true if the specified object looks like a DOM node.
 * Otherwise, false will be returned. Any non-null object with a
 * nodeType > 0 will be considered a DOM node by this function.
 *
 * @param {Object} obj the object to check
 *
 * @return {Boolean} true if the object looks like a DOM node, or
 *         false otherwise
 */
RapidContext.Util.isDOM = function (obj) {
    return obj != null &&
           typeof(obj.nodeType) === "number" &&
           obj.nodeType > 0;
};

/**
 * Returns true if the specified object looks like an HTML or XHTML
 * DOM node. Otherwise, false will be returned. Any non-null object
 * with a nodeType > 0 will be considered a DOM node, but only those
 * with a matching namespaceURI will be considered HTML DOM nodes.
 *
 * @param {Object} obj the object to check
 *
 * @return {Boolean} true if the object looks like an HTML DOM node,
 *         or false otherwise
 */
RapidContext.Util.isHTML = function (obj) {
    var ns = RapidContext.Util.NS.HTML;
    return RapidContext.Util.isDOM(obj) &&
           MochiKit.Base.findIdentical(ns, obj.namespaceURI) >= 0;
};

/**
 * Creates a programmers debug representation of a DOM node. This
 * method is similar to MochiKit.DOM.emitHtml, except for that it
 * does not recurse into child nodes.
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
        if (node.specified) {
            return " " + node.name + '="' +
                   MochiKit.DOM.escapeHTML(node.value) + '"';
        } else {
            return "";
        }
    } else if (node.nodeType === 3) { // Node.TEXT_NODE
        return MochiKit.DOM.escapeHTML(node.nodeValue);
    } else {
        return node.toString();
    }
};

/**
 * Returns an array with DOM node attribute name and value pairs.
 * The name and value pairs are also stored in arrays with two
 * elements.
 *
 * @param {Object} node the HTML DOM node
 *
 * @return {Array} an array containing attribute name and value
 *             pairs (as arrays)
 */
RapidContext.Util.attributeArray = function (node) {
    var res = [];
    node = MochiKit.DOM.getElement(node);
    for (var i = 0; node != null && i < node.attributes.length; i++) {
        var a = node.attributes[i];
        if (a.specified) {
            res.push([a.name, a.value]);
        }
    }
    return res;
};

/**
 * Returns an immediate child node from a parent DOM node. This
 * function handles the index range checks and finds the immediate
 * child node if a descendant node is specified.
 *
 * @param {Node} parent the parent HTML DOM node
 * @param {Number/Node} indexOrNode the child index or a descendant
 *            node
 *
 * @return {Node} the child HTML DOM node, or
 *         null if no matching node was found
 */
RapidContext.Util.childNode = function (parent, indexOrNode) {
    parent = MochiKit.DOM.getElement(parent);
    if (typeof(indexOrNode) == "number") {
        if (indexOrNode < 0 || indexOrNode >= parent.childNodes.length) {
            return null;
        } else {
            return parent.childNodes[indexOrNode];
        }
    } else {
        var node = MochiKit.DOM.getElement(indexOrNode);
        while (node != null && node !== parent && node.parentNode !== parent) {
            node = node.parentNode;
        }
        return (node == null || node === parent) ? null : node;
    }
};

/**
 * Creates a DOM node with a namespace.
 *
 * @param {String} ns the DOM namespace
 * @param {String} tag the DOM tag name
 * @param {Object} [attrs] the node attributes, or null for none
 * @param {Object} [...] the nodes or text to add as children
 *
 * @return {Object} the DOM node created
 */
RapidContext.Util.createDOMExt = function (ns, tag, attrs/*, ...*/) {
    var doc = MochiKit.DOM.currentDocument();
    var node = (ns) ? doc.createElementNS(ns, tag) : doc.createElement(tag);
    MochiKit.DOM.updateNodeAttributes(node, attrs);
    var children = MochiKit.Base.extend([], arguments, 3);
    MochiKit.DOM.appendChildNodes(node, children);
    return node;
};

/**
 * Creates a DOM text node from the specified text. This is a
 * convenience function for currentDocument().createTextNode, in
 * order to be compatible with the withDocument() function.
 *
 * @param {String} text the text content
 *
 * @return {Object} the DOM text node created
 */
RapidContext.Util.createTextNode = function (text) {
    return MochiKit.DOM.currentDocument().createTextNode(text);
};

/**
 * Returns a function for creating a specific kind of DOM nodes. The
 * returned function will optionally require a sequence of non-null
 * arguments that will be added as attributes to the node creation.
 * The returned function will otherwise work similar to the
 * createDOMExt() function, taking attributes and child nodes.
 *
 * @param {String} ns the DOM namespace, or null for HTML
 * @param {String} tag the DOM tag name
 * @param {Array} [args] the array with required arguments, or null
 *            for no required arguments
 * @param {Object} [attrs] the default node attributes, or null for
 *            none
 * @param {Object} [...] the default nodes or text to add as children
 *
 * @return {Function} the function that creates the DOM nodes
 */
RapidContext.Util.createDOMFuncExt = function (ns, tag, args, attrs/*, ...*/) {
    args = args || [];
    attrs = attrs || {};
    var children = MochiKit.Base.extend([], arguments, 4);
    return function (/*arg1, ..., argN, attrs, ...*/) {
        var myAttrs = MochiKit.Base.update({}, attrs);
        for (var pos = 0; pos < args.length; pos++) {
            if (arguments[pos] == null) {
                throw new Error("Argument '" + args[pos] + "' cannot be null");
            }
            myAttrs[args[pos]] = arguments[pos];
        }
        MochiKit.Base.update(myAttrs, arguments[args.length]);
        var myChildren = MochiKit.Base.extend([], children);
        MochiKit.Base.extend(myChildren, arguments, args.length + 1);
        return RapidContext.Util.createDOMExt(ns, tag, myAttrs, myChildren);
    }
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

/**
 * Blurs (unfocuses) a specified DOM node and all relevant child
 * nodes. This function will recursively blur all A, BUTTON, INPUT,
 * TEXTAREA and SELECT child nodes found.
 *
 * @param {Object} node the HTML DOM node
 */
RapidContext.Util.blurAll = function (node) {
    node.blur();
    var tags = ["A", "BUTTON", "INPUT", "TEXTAREA", "SELECT"];
    for (var i = 0; i < tags.length; i++) {
        var nodes = node.getElementsByTagName(tags[i]);
        for (var j = 0; j < nodes.length; j++) {
            nodes[j].blur();
        }
    }
};

/**
 * Registers algebraic constraints for the element width, height
 * and/or aspect ratio. The constraints may either be fixed numeric
 * values, functions or algebraic formulas (in a string).<p>
 *
 * The formulas will be converted to JavaScript functions, replacing
 * any "%" character with a reference to the corresponding parent
 * dimension value (i.e. the parent element width, height or aspect
 * ratio). It is also possible to directly reference the parent
 * values as "w" or "h".<p>
 *
 * Constraint functions must take two arguments (parent width and
 * height) and return a number. The returned number is set as the new
 * element width or height (in pixels). Any returned value will also
 * be bounded by the parent element size to avoid calculation errors.
 *
 * @param {Object} node the HTML DOM node
 * @param {Number/Function/String} [width] the width constraint
 * @param {Number/Function/String} [height] the height constraint
 * @param {Number/Function/String} [aspect] the aspect ratio constraint
 *
 * @see RapidContext.Util.resizeElements
 *
 * @example
 * RapidContext.Util.registerSizeConstraints(node, "50%-20", "100%");
 *     // Sets width to 50%-20 px and height to 100% of parent dimension
 *
 * RapidContext.Util.registerSizeConstraints(otherNode, null, null, 1.0);
 *     // Ensures a square aspect ratio
 *
 * RapidContext.Util.resizeElements(node, otherNode);
 *     // Evaluates the size constraints for both nodes
 */
RapidContext.Util.registerSizeConstraints = function (node, width, height, aspect) {
    node = MochiKit.DOM.getElement(node);
    var sc = node.sizeConstraints = { w: null, h: null, a: null };
    if (typeof(width) == "number") {
        sc.w = function (w, h) { return width; }
    } else if (typeof(width) == "function") {
        sc.w = width;
    } else if (typeof(width) == "string") {
        var code = "return " + width.replace(/%/g, "*0.01*w") + ";";
        sc.w = new Function("w", "h", code);
    }
    if (typeof(height) == "number") {
        sc.h = function (w, h) { return height; }
    } else if (typeof(height) == "function") {
        sc.h = height;
    } else if (typeof(height) == "string") {
        var code = "return " + height.replace(/%/g, "*0.01*h") + ";";
        sc.h = new Function("w", "h", code);
    }
    if (typeof(aspect) == "number") {
        sc.a = function (w, h) { return aspect; }
    } else if (typeof(aspect) == "function") {
        sc.a = aspect;
    } else if (typeof(aspect) == "string") {
        var code = "return " + aspect.replace(/%/g, "*0.01*w/h") + ";";
        sc.a = new Function("w", "h", code);
    }
};

/**
 * Resizes one or more DOM nodes using their registered size
 * constraints and their parent element sizes. The resize operation
 * will only modify those elements that have constraints, but will
 * perform a depth-first recursion over all element child nodes as
 * well.<p>
 *
 * Partial constraints are accepted, in which case only the width
 * or the height is modified. Aspect ratio constraints are applied
 * after the width and height constraints. The result will always
 * be bounded by the parent element width or height.
 *
 * @param {Object} [...] the HTML DOM nodes to resize
 *
 * @see RapidContext.Util.registerSizeConstraints
 *
 * @example
 * RapidContext.Util.resizeElements(node);
 *     // Evaluates the size constraints for a node and all child nodes
 */
RapidContext.Util.resizeElements = function (/* ... */) {
    var args = MochiKit.Base.flattenArray(arguments);
    for (var i = 0; i < args.length; i++) {
        var node = MochiKit.DOM.getElement(args[i]);
        if (node != null && node.nodeType === 1 && // Node.ELEMENT_NODE
            node.parentNode != null && node.sizeConstraints != null) {

            var ref = { w: node.parentNode.w, h: node.parentNode.h };
            if (ref.w == null && ref.h == null) {
                ref = MochiKit.Style.getElementDimensions(node.parentNode, true);
            }
            var dim = RapidContext.Util._evalConstraints(node.sizeConstraints, ref);
            MochiKit.Style.setElementDimensions(node, dim);
            node.w = dim.w;
            node.h = dim.h;
        }
        if (node != null && typeof(node.resizeContent) == "function") {
            node.resizeContent();
        } else {
            node = node.firstChild;
            while (node != null) {
                if (node.nodeType === 1) { // Node.ELEMENT_NODE
                    RapidContext.Util.resizeElements(node);
                }
                node = node.nextSibling;
            }
        }
    }
};

/**
 * Evaluates the size constraint functions with a refeence dimension
 * object. This is an internal function used to encapsulate the
 * function calls and provide logging on errors.
 *
 * @param {Object} sc the size constraints object
 * @param {Object} ref the MochiKit.Style.Dimensions maximum
 *            reference values
 *
 * @return {Object} the MochiKit.Style.Dimensions with evaluated size
 *         constraint values (some may be null)
 */
RapidContext.Util._evalConstraints = function (sc, ref) {
    var log = MochiKit.Logging.logError;
    var w, h, a;
    if (typeof(sc.w) == "function") {
        try {
            w = Math.max(0, Math.min(ref.w, sc.w(ref.w, ref.h)));
        } catch (e) {
            log("Error evaluating width size constraint; " +
                "w: " + ref.w + ", h: " + ref.h, e);
        }
    }
    if (typeof(sc.h) == "function") {
        try {
            h = Math.max(0, Math.min(ref.h, sc.h(ref.w, ref.h)));
        } catch (e) {
            log("Error evaluating height size constraint; " +
                "w: " + ref.w + ", h: " + ref.h, e);
        }
    }
    if (typeof(sc.a) == "function") {
        try {
            a = sc.a(ref.w, ref.h);
            w = w || ref.w;
            h = h || ref.h;
            if (h * a > ref.w) {
                h = ref.w / a;
            }
            if (w / a > ref.h) {
                w = ref.h * a;
            }
            if (w > h * a) {
                w = h * a;
            } else {
                h = w / a;
            }
        } catch (e) {
            log("Error evaluating aspect size constraint; " +
                "w: " + ref.w + ", h: " + ref.h, e);
        }
    }
    if (w != null) {
        w = Math.floor(w);
    }
    if (h != null) {
        h = Math.floor(h);
    }
    return new MochiKit.Style.Dimensions(w, h);
};
