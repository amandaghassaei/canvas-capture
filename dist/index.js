"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopRecord = exports.recordFrame = exports.takePNGSnapshot = exports.beginGifRecord = exports.beginVideoRecord = void 0;
// @ts-ignore
var ccapture_js_1 = require("ccapture.js");
var modals_1 = require("./modals");
var VERBOSE = true;
var WORKERS_PATH = '/';
var capturer = null;
function beginVideoRecord(options) {
    clearCapturer();
    // Create a capturer that exports a WebM video
    capturer = new ccapture_js_1.default({
        format: 'webm',
        name: options.name || 'WEBM_Capture',
        framerate: options.fps || 60,
        quality: options.quality || 63,
        verbose: VERBOSE,
    });
    startRecord();
}
exports.beginVideoRecord = beginVideoRecord;
function beginGifRecord(options) {
    clearCapturer();
    // Create a capturer that exports a WebM video
    capturer = new ccapture_js_1.default({
        format: 'gif',
        name: options.name || 'GIF_Capture',
        framerate: options.fps || 60,
        workersPath: WORKERS_PATH,
        verbose: VERBOSE,
    });
    startRecord();
}
exports.beginGifRecord = beginGifRecord;
function takePNGSnapshot(canvas, options) {
    clearCapturer();
    // Create a capturer that exports a WebM video
    capturer = new ccapture_js_1.default({
        format: 'png',
        name: options.name || 'PNG_Capture',
        verbose: VERBOSE,
    });
    capturer.start();
    capturer.capture(canvas);
    stopRecord();
}
exports.takePNGSnapshot = takePNGSnapshot;
function recordFrame(canvas) {
    if (!capturer) {
        throw new Error('No valid capturer inited.');
    }
    capturer.capture(canvas);
}
exports.recordFrame = recordFrame;
function startRecord() {
    capturer.start();
    // For video and gif records, we should also throw up an indicator to show that we're in record mode.
    modals_1.showDot(true);
}
function stopRecord() {
    if (!capturer) {
        throw new Error('No valid capturer inited.');
    }
    capturer.stop();
    capturer.save();
    capturer = null;
}
exports.stopRecord = stopRecord;
function clearCapturer() {
    if (capturer) {
        capturer.stop();
        capturer = null;
        modals_1.showDot(false);
    }
}
window.addEventListener('resize', function () {
    if (capturer) {
        modals_1.showAlert("Don't resize window while recording canvas!!");
    }
});
//# sourceMappingURL=index.js.map