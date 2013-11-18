/**
 * Creates a new login app.
 */
function LoginApp() {
}

/**
 * Starts the app and initializes the UI.
 */
LoginApp.prototype.start = function () {
    // Create procedure callers
    this.proc = RapidContext.Procedure.mapAll({
        sessionInfo: "System.Session.Current",
        sessionLogin: "System.Session.Authenticate",
        sessionLogout: "System.Session.Terminate",
        userSearch: "System.User.Search",
    });

    // Signal handlers
    MochiKit.Signal.connect(this.ui.loginForm, "onsubmit", this, "_loginAuth");

    // Init UI
    var user = RapidContext.App.user();
    if (user && user.id) {
        $(this.ui.loginName).text(user.name || user.id);
        $(this.ui.loginWarning).removeClass("hidden");
    }
    this.ui.loginDialog.show();
    this.ui.loginUser.focus();
}

/**
 * Stops the app.
 */
LoginApp.prototype.stop = function () {
    for (var name in this.proc) {
        MochiKit.Signal.disconnectAll(this.proc[name]);
    }
}

/**
 * Shows the login authentication dialog.
 */
LoginApp.prototype._loginAuth = function () {
    if (this.ui.loginForm.validate()) {
        this.ui.loginAuth.setAttrs({ disabled: true, icon: "LOADING" });
        var data = this.ui.loginForm.valueMap();
        this.login(data.user, data.password);
    } else {
        this.ui.loginUser.focus();
    }
    this.ui.loginDialog.resizeToContent();
};

/**
 * Handles the login call sequence.
 */
LoginApp.prototype.login = function (login, password) {
    var self = this;
    var d = MochiKit.Async.wait(0);
    var user = RapidContext.App.user();
    if (user && user.id) {
        d.addCallback(function () {
            return self.proc.sessionLogout(null);
        });
    }
    d.addCallback(function () {
        return self.proc.sessionInfo();
    });
    if (/@/.test(login)) {
        var s;
        d.addCallback(function (session) {
            s = session;
            return self.proc.userSearch($.trim(login).toLowerCase());
        });
        d.addCallback(function (user) {
            if (user == null) {
                throw new Error("no user with that email address");
            }
            login = user.id;
            return s;
        });
    }
    d.addCallback(function (session) {
        var realm = RapidContext.App.status().realm;
        var hash = CryptoJS.MD5(login + ":" + realm + ":" + password);
        hash = CryptoJS.MD5(hash.toString() + ":" + session.nonce).toString();
        return self.proc.sessionLogin(login, session.nonce, hash);
    });
    d.addBoth(function (res) {
        self.ui.loginAuth.setAttrs({ disabled: false, icon: "OK" });
        if (res instanceof Error) {
            var msg = res.message;
            msg = msg.charAt(0).toUpperCase() + msg.substr(1);
            $(self.ui.loginError).removeClass("hidden").text(msg);
            $(self.ui.loginWarning).addClass("hidden");
            self.ui.loginDialog.resizeToContent();
        } else {
            window.location.reload();
        }
    });
};
