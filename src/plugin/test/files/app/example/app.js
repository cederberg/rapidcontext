/**
 * Creates a new app instance.
 */
function ExampleApp() {
    // Set instance variables here:
    this.interval = null;
    this.progress = 0;
}

/**
 * Starts the app and initializes the UI.
 */
ExampleApp.prototype.start = function() {

    // Create procedure callers
    this.proc = RapidContext.Procedure.mapAll({
        appList: "System.App.List"
    });

    // Attach signal handlers
    RapidContext.UI.connectProc(this.proc.appList, this.ui.appLoading, this.ui.appReload);
    MochiKit.Signal.connect(this.proc.appList, "oncall", this.ui.appTable, "clear");
    MochiKit.Signal.connect(this.proc.appList, "onsuccess", this.ui.appTable, "setData");
    MochiKit.Signal.connect(this.ui.popupTrigger, "onmouseover", this.ui.popupMenu, "show");
    MochiKit.Signal.connect(this.ui.popupField, "onfocus", this, "autocomplete");
    MochiKit.Signal.connect(this.ui.popupField, "onchange", this, "autocomplete");
    MochiKit.Signal.connect(this.ui.popupField, "onpopupselect", this, "autoselect");
    MochiKit.Signal.connect(this.ui.dialogButton, "onclick", this.ui.dialog, "show");
    MochiKit.Signal.connect(this.ui.dialogClose, "onclick", this.ui.dialog, "hide");
    MochiKit.Signal.connect(this.ui.iconShowAll, "onchange", this, "toggleIcons");

    // Initialize data
    this.proc.appList();
    this.initIcons();
    this.interval = setInterval(MochiKit.Base.method(this, "updateProgress"), 500);
};

/**
 * Stops the app.
 */
ExampleApp.prototype.stop = function() {
    // Usually not much to do here
    clearInterval(this.interval);
};

/**
 * Handle autocomplete events.
 */
ExampleApp.prototype.autocomplete = function () {
    var items = ["Apple", "Banana", "Blueberry", "Mango", "Kiwi", "Orange", "Strawberry"];
    var value = this.ui.popupField.getValue().toLowerCase();
    for (var i = 0; i < items.length; i++) {
        if (items[i].toLowerCase().indexOf(value) < 0) {
            items.splice(i--, 1);
        }
    }
    this.ui.popupField.showPopup({}, items);
};

/**
 * Handle autocomplete selections.
 */
ExampleApp.prototype.autoselect = function () {
    var popup = this.ui.popupField.popup();
    var value = popup.selectedChild().value;
    popup.hide();
    this.ui.popupField.setAttrs({ value: value });
}

/**
 * Animate the progress bar.
 */
ExampleApp.prototype.updateProgress = function () {
    this.progress += 0.5
    if (this.progress >= 110) {
        this.progress = 0;
        this.ui.progressBar.setAttrs({ min: 0, max: 100 });
    }
    this.ui.progressBar.setValue(Math.floor(this.progress));
}

/**
 * Creates the icon table content dynamically.
 */
ExampleApp.prototype.initIcons = function () {
    var TD = MochiKit.DOM.TD;
    var TR = MochiKit.DOM.TR;
    var Icon = RapidContext.Widget.Icon;
    var rows = [];
    for (var k in Icon) {
        var v = Icon[k];
        if (typeof(v) == "object" && k == k.toUpperCase() && k != "DEFAULT") {
            var cells = [];
            cells.push(TD({ "class": "label" }, k));
            cells.push(TD({ "class": "white" }, Icon({ ref: k })));
            cells.push(TD({ "class": "grey extra hidden" }, Icon({ ref: k })));
            cells.push(TD({ "class": "black extra hidden" }, Icon({ ref: k })));
            cells.push(TD({ "class": "white extra hidden" }, Icon({ ref: k, disabled: true })));
            cells.push(TD({ "class": "grey extra hidden" }, Icon({ ref: k, disabled: true })));
            cells.push(TD({ "class": "black extra hidden" }, Icon({ ref: k, disabled: true })));
            rows.push(cells);
        }
    }
    var len = Math.ceil(rows.length / 3);
    var col1 = rows.slice(0, len);
    var col2 = rows.slice(len, len + len);
    var col3 = rows.slice(len + len);
    for (var i = 0; i < len; i++) {
        var tr = TR({}, col1[i]);
        if (col2[i]) {
            MochiKit.DOM.appendChildNodes(tr, TD({ "class": "space" }), col2[i]);
        }
        if (col3[i]) {
            MochiKit.DOM.appendChildNodes(tr, TD({ "class": "space" }), col3[i]);
        }
        MochiKit.DOM.appendChildNodes(tr, TD({ "class": "end" }));
        this.ui.iconTable.appendChild(tr);
    }
    this.ui.iconTable.resizeContent = MochiKit.Base.noop;
};

/**
 * Handles show all icon backgrounds checkbox.
 */
ExampleApp.prototype.toggleIcons = function () {
    $(this.ui.iconTable).find(".extra").toggleClass("hidden");
};
