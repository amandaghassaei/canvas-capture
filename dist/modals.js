"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.showDot = exports.initDotWithCSS = exports.showDialog = exports.showAlert = exports.PARAMS = void 0;
var micromodal_1 = require("micromodal");
var micromodal_css_1 = require("./micromodal.css");
// Params.
exports.PARAMS = {
    SHOW_ALERTS: true,
    SHOW_DIALOGS: true,
    SHOW_REC_DOT: true,
};
// Add modal styling.
var style = document.createElement('style');
style.textContent = micromodal_css_1.css;
document.head.append(style);
function initModalHTML(modalID, title, content) {
    if (content === void 0) { content = ''; }
    var modalString = "<div class=\"modal micromodal-slide\" id=\"modal-" + modalID + "\" aria-hidden=\"true\">\n\t\t<div class=\"modal__overlay\" tabindex=\"-1\" data-micromodal-close>\n\t\t<div class=\"modal__container\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"modal-" + modalID + "-title\">\n\t\t\t<header class=\"modal__header\">\n\t\t\t\t<h2 class=\"modal__title\" id=\"modal-" + modalID + "-title\">\n\t\t\t\t\t" + title + "\n\t\t\t\t</h2>\n\t\t\t\t<button class=\"modal__close\" aria-label=\"Close modal\" data-micromodal-close></button>\n\t\t\t</header>\n\t\t\t<main class=\"modal__content\">\n\t\t\t\t<p id=\"modal-" + modalID + "-content\">\n\t\t\t\t\t" + content + "\n\t\t\t\t</p>\n\t\t\t</main>\n\t\t</div>\n\t\t</div>\n\t</div>";
    // This is a trick to create an element from string.
    var temp = document.createElement('div');
    temp.innerHTML = modalString;
    return temp.firstChild;
}
;
var alertModalInited = false;
var dialogModalInited = false;
var ALERT_MODAL_ID = 'alert';
var alertModal = initModalHTML(ALERT_MODAL_ID, 'Warning');
var DIALOG_MODAL_ID = 'dialog';
var dialogModal = initModalHTML(DIALOG_MODAL_ID, 'Saving...');
function showAlert(message) {
    if (!exports.PARAMS.SHOW_ALERTS) {
        console.warn(message);
        return;
    }
    if (!alertModalInited) {
        alertModalInited = true;
        document.getElementsByTagName('body')[0].appendChild(alertModal);
    }
    document.getElementById("modal-" + ALERT_MODAL_ID + "-content").innerHTML = message;
    micromodal_1.default.show("modal-" + ALERT_MODAL_ID);
}
exports.showAlert = showAlert;
function showDialog(title, message, options) {
    if (!dialogModalInited) {
        dialogModalInited = true;
        document.getElementsByTagName('body')[0].appendChild(dialogModal);
    }
    document.getElementById("modal-" + DIALOG_MODAL_ID + "-title").innerHTML = title;
    document.getElementById("modal-" + DIALOG_MODAL_ID + "-content").innerHTML = message;
    micromodal_1.default.show("modal-" + DIALOG_MODAL_ID);
    var autoCloseDelay = (options === null || options === void 0 ? void 0 : options.autoCloseDelay) !== undefined ? options.autoCloseDelay : -1;
    if (autoCloseDelay > 0) {
        setTimeout(function () {
            micromodal_1.default.close("modal-" + DIALOG_MODAL_ID);
        }, autoCloseDelay);
    }
}
exports.showDialog = showDialog;
// Create record red dot vis to overlay when recording is happening.
var dot = document.createElement('div');
function initDotWithCSS(css) {
    dot.id = 'recordingDot';
    var dotCSS = __assign({ background: "red", width: "20px", height: "20px", "border-radius": "50%", display: "none", position: "absolute", top: "0", right: "0", "z-index": "10", margin: "20px" }, css);
    Object.assign(dot.style, dotCSS);
    document.getElementsByTagName('body')[0].appendChild(dot);
}
exports.initDotWithCSS = initDotWithCSS;
function showDot(visible) {
    if (!exports.PARAMS.SHOW_REC_DOT)
        return;
    if (visible) {
        dot.style.display = "inline-block";
    }
    else {
        dot.style.display = "none";
    }
}
exports.showDot = showDot;
//# sourceMappingURL=modals.js.map