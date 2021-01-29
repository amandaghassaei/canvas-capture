"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showDot = exports.showAlert = void 0;
var micromodal_1 = require("micromodal");
var micromodal_css_1 = require("./micromodal.css");
// Add modal styling.
var style = document.createElement('style');
style.textContent = micromodal_css_1.css;
document.head.append(style);
function initModalHTML(modalID, title, content) {
    if (content === void 0) { content = ''; }
    var modalString = "<div class=\"modal micromodal-slide\" id=\"modal-" + modalID + "\" aria-hidden=\"true\">\n\t\t<div class=\"modal__overlay\" tabindex=\"-1\" data-micromodal-close>\n\t\t<div class=\"modal__container\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"modal-" + modalID + "-title\">\n\t\t\t<header class=\"modal__header\">\n\t\t\t\t<h2 class=\"modal__title\" id=\"modal-" + modalID + "-title\">\n\t\t\t\t\t" + title + "\n\t\t\t\t</h2>\n\t\t\t\t<button class=\"modal__close\" aria-label=\"Close modal\" data-micromodal-close></button>\n\t\t\t</header>\n\t\t\t<main class=\"modal__content\">\n\t\t\t\t<p id=\"modal-" + modalID + "-content\">\n\t\t\t\t\t" + content + "\n\t\t\t\t</p>\n\t\t\t</main>\n\t\t\t<footer class=\"modal__footer\">\n\t\t\t\t<button class=\"modal__btn modal__btn-primary\">Continue</button>\n\t\t\t\t<button class=\"modal__btn\" data-micromodal-close aria-label=\"Close this dialog window\">Close</button>\n\t\t\t</footer>\n\t\t</div>\n\t\t</div>\n\t</div>";
    // This is a trick to create an element from string.
    var temp = document.createElement('div');
    temp.innerHTML = modalString;
    return temp.firstChild;
}
;
var ALERT_MODAL_ID = 'alert';
var alertModal = initModalHTML(ALERT_MODAL_ID, 'Warning');
document.getElementsByTagName('body')[0].appendChild(alertModal);
function showAlert(message) {
    document.getElementById("modal-" + ALERT_MODAL_ID + "-content").innerHTML = message;
    micromodal_1.default.show("modal-" + ALERT_MODAL_ID);
}
exports.showAlert = showAlert;
// export function showRecordOptionsModal() {
// }
// Create record red dot vis to overlay when recording is happening.
var dot = document.createElement('div');
dot.id = 'recordingDot';
var dotCSS = {
    background: "red",
    width: "20px",
    height: "20px",
    "border-radius": "50%",
    display: "none",
    position: "absolute",
    top: "0",
    right: "0",
    "z-index": "10",
    margin: "20px",
};
Object.assign(dot.style, dotCSS);
document.getElementsByTagName('body')[0].appendChild(dot);
function showDot(visible) {
    if (visible) {
        dot.style.display = "inline-block";
    }
    else {
        dot.style.display = "none";
    }
}
exports.showDot = showDot;
//# sourceMappingURL=modals.js.map