"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRecording = exports.stopRecord = exports.recordFrame = exports.takePNGSnapshot = exports.beginGIFRecord = exports.beginVideoRecord = exports.bindKeyToPNGSnapshot = exports.bindKeyToGIFRecord = exports.bindKeyToVideoRecord = exports.setVerbose = exports.init = void 0;
// @ts-ignore
var ccapture_js_1 = require("ccapture.js");
var modals_1 = require("./modals");
var VERBOSE = true;
var WORKERS_PATH = '/';
var capturer = null;
var temp = ccapture_js_1.default;
var videoRecKey = null;
var gifRecKey = null;
var pngRecKey = null;
var isRecordingVideo = false;
var isRecordingGIF = false;
var canvas = null;
var numFrames = 0;
function init(_canvas) {
    canvas = _canvas;
    canvas.addEventListener('resize', function () {
        if (capturer) {
            modals_1.showAlert("Don't resize while recording canvas!!");
        }
    });
}
exports.init = init;
function setVerbose(state) {
    VERBOSE = !!state;
}
exports.setVerbose = setVerbose;
function checkCanvas() {
    if (canvas === null) {
        modals_1.showAlert('No canvas supplied, please call CanvasCapture.init() and pass in canvas element.');
        return false;
    }
    return true;
}
window.addEventListener('keydown', function (e) {
    if (videoRecKey && e.key === videoRecKey) {
        beginVideoRecord();
    }
    if (gifRecKey && e.key === gifRecKey) {
        beginGIFRecord();
    }
    if (pngRecKey && e.key === pngRecKey) {
        takePNGSnapshot();
    }
});
// Pressing key once will start record, press again to stop.
function bindKeyToVideoRecord(key) {
    if (key === gifRecKey) {
        gifRecKey = null;
    }
    if (key === pngRecKey) {
        pngRecKey = null;
    }
    videoRecKey = key;
}
exports.bindKeyToVideoRecord = bindKeyToVideoRecord;
function bindKeyToGIFRecord(key) {
    if (key === videoRecKey) {
        videoRecKey = null;
    }
    if (key === pngRecKey) {
        pngRecKey = null;
    }
    gifRecKey = key;
}
exports.bindKeyToGIFRecord = bindKeyToGIFRecord;
function bindKeyToPNGSnapshot(key) {
    if (key === gifRecKey) {
        gifRecKey = null;
    }
    if (key === videoRecKey) {
        videoRecKey = null;
    }
    pngRecKey = key;
}
exports.bindKeyToPNGSnapshot = bindKeyToPNGSnapshot;
function beginVideoRecord(options) {
    if (isRecordingGIF) {
        modals_1.showAlert('You are currently recording a gif, stop recording gif before starting new video record.');
        return;
    }
    if (isRecordingVideo) {
        modals_1.showAlert('You are currently recording a video, stop recording current video before starting new video record.');
        return;
    }
    // Create a capturer that exports a WebM video
    // @ts-ignore
    capturer = new window.CCapture({
        format: 'webm',
        name: (options === null || options === void 0 ? void 0 : options.name) || 'WEBM_Capture',
        framerate: (options === null || options === void 0 ? void 0 : options.fps) || 60,
        quality: (options === null || options === void 0 ? void 0 : options.quality) || 63,
        verbose: VERBOSE,
    });
    isRecordingVideo = true;
    startRecord();
}
exports.beginVideoRecord = beginVideoRecord;
function beginGIFRecord(options) {
    if (isRecordingVideo) {
        modals_1.showAlert('You are currently recording a video, stop recording video before starting new gif record.');
        return;
    }
    if (isRecordingGIF) {
        modals_1.showAlert('You are currently recording a gif, stop recording current gif before starting new gif record.');
        return;
    }
    // Create a capturer that exports a WebM video
    // @ts-ignore
    capturer = new window.CCapture({
        format: 'gif',
        name: (options === null || options === void 0 ? void 0 : options.name) || 'GIF_Capture',
        framerate: (options === null || options === void 0 ? void 0 : options.fps) || 60,
        workersPath: WORKERS_PATH,
        verbose: VERBOSE,
    });
    isRecordingGIF = true;
    startRecord();
}
exports.beginGIFRecord = beginGIFRecord;
function takePNGSnapshot(options) {
    if (!checkCanvas()) {
        return;
    }
    if (isRecordingVideo) {
        modals_1.showAlert('You are currently recording a video, stop recording video before starting new png snapshot.');
        return;
    }
    if (isRecordingGIF) {
        modals_1.showAlert('You are currently recording a gif, stop recording gif before starting new png snapshot.');
        return;
    }
    // Create a capturer that exports a WebM video
    // @ts-ignore
    capturer = new window.CCapture({
        format: 'png',
        name: (options === null || options === void 0 ? void 0 : options.name) || 'PNG_Capture',
        verbose: VERBOSE,
    });
    capturer.start();
    capturer.capture(canvas);
    stopRecord();
}
exports.takePNGSnapshot = takePNGSnapshot;
function recordFrame() {
    if (!checkCanvas()) {
        return;
    }
    if (!capturer) {
        modals_1.showAlert('No valid capturer inited, please call CanvasCapture.beginVideoRecord() or CanvasCapture.beginGIFRecord() first.');
        return;
    }
    capturer.capture(canvas);
    numFrames++;
}
exports.recordFrame = recordFrame;
function startRecord() {
    capturer.start();
    // For video and gif records, we should also throw up an indicator to show that we're in record mode.
    modals_1.showDot(true);
    numFrames = 0;
}
function stopRecord() {
    if (!capturer) {
        modals_1.showAlert('No valid capturer inited, please call CanvasCapture.beginVideoRecord() or CanvasCapture.beginGIFRecord() first.');
        return;
    }
    if (numFrames === 0) {
        modals_1.showAlert('No frames recorded, call CanvasCapture.recordFrame()');
        return;
    }
    capturer.stop();
    capturer.save();
    capturer = null;
    isRecordingGIF = false;
    isRecordingVideo = false;
    modals_1.showDot(false);
}
exports.stopRecord = stopRecord;
function isRecording() {
    return isRecordingVideo || isRecordingGIF;
}
exports.isRecording = isRecording;
//# sourceMappingURL=index.js.map