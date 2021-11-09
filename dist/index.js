"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRecording = exports.stopRecord = exports.recordFrame = exports.takeJPEGSnapshot = exports.takePNGSnapshot = exports.beginGIFRecord = exports.beginVideoRecord = exports.bindKeyToJPEGSnapshot = exports.bindKeyToPNGSnapshot = exports.bindKeyToGIFRecord = exports.bindKeyToVideoRecord = exports.setVerbose = exports.init = exports.showDialog = void 0;
// @ts-ignore
var ccapture_js_1 = require("ccapture.js");
var file_saver_1 = require("file-saver");
var modals_1 = require("./modals");
var gif_worker_1 = require("./gif.worker");
// Export showDialog method in case it is useful.
var modals_2 = require("./modals");
Object.defineProperty(exports, "showDialog", { enumerable: true, get: function () { return modals_2.showDialog; } });
// Make is so we don't have to specify workersPath for CCapture.
var workersBlob = new Blob([gif_worker_1.workerString]);
var workersPath = URL.createObjectURL(workersBlob);
var VERBOSE = true;
var capturer = null;
// This is an unused variable,
// but needed for proper import of CCapture at the moment.
// See https://github.com/spite/ccapture.js/issues/78
var temp = ccapture_js_1.default;
var hotkeys = {
    webm: null,
    gif: null,
    png: null,
    jpeg: null,
};
var isRecordingVideo = false;
var isRecordingGIF = false;
var canvas = null;
var numFrames = 0;
function init(_canvas, options) {
    canvas = _canvas;
    if (options && options.verbose !== undefined)
        setVerbose(options.verbose);
    if (options && options.showAlerts !== undefined)
        modals_1.PARAMS.SHOW_ALERTS = options.showAlerts;
    if (options && options.showDialogs !== undefined)
        modals_1.PARAMS.SHOW_DIALOGS = options.showDialogs;
    if (options && options.showRecDot !== undefined)
        modals_1.PARAMS.SHOW_REC_DOT = options.showRecDot;
    if (modals_1.PARAMS.SHOW_REC_DOT) {
        modals_1.initDotWithCSS(options === null || options === void 0 ? void 0 : options.recDotCSS);
    }
    canvas.addEventListener('resize', function () {
        if (capturer) {
            modals_1.showAlert("Don't resize while recording canvas!");
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
        console.warn('No canvas supplied, please call CanvasCapture.init() and pass in canvas element.');
        return false;
    }
    return true;
}
var recOptions = {
    webm: undefined,
    gif: undefined,
    png: undefined,
    jpeg: undefined,
};
// Pressing key once will start record, press again to stop.
function bindKeyToVideoRecord(key, options) {
    recOptions.webm = options;
    Object.keys(hotkeys).forEach(function (keyName) {
        if (hotkeys[keyName] === key) {
            hotkeys[keyName] = null;
        }
    });
    hotkeys.webm = key;
}
exports.bindKeyToVideoRecord = bindKeyToVideoRecord;
function bindKeyToGIFRecord(key, options) {
    recOptions.gif = options;
    Object.keys(hotkeys).forEach(function (keyName) {
        if (hotkeys[keyName] === key) {
            hotkeys[keyName] = null;
        }
    });
    hotkeys.gif = key;
}
exports.bindKeyToGIFRecord = bindKeyToGIFRecord;
// Snapshots just take a single shot.
function bindKeyToPNGSnapshot(key, options) {
    recOptions.png = options;
    Object.keys(hotkeys).forEach(function (keyName) {
        if (hotkeys[keyName] === key) {
            hotkeys[keyName] = null;
        }
    });
    hotkeys.png = key;
}
exports.bindKeyToPNGSnapshot = bindKeyToPNGSnapshot;
function bindKeyToJPEGSnapshot(key, options) {
    recOptions.jpeg = options;
    Object.keys(hotkeys).forEach(function (keyName) {
        if (hotkeys[keyName] === key) {
            hotkeys[keyName] = null;
        }
    });
    hotkeys.jpeg = key;
}
exports.bindKeyToJPEGSnapshot = bindKeyToJPEGSnapshot;
window.addEventListener('keydown', function (e) {
    if (hotkeys.webm && e.key === hotkeys.webm) {
        if (isRecordingVideo)
            stopRecord();
        else
            beginVideoRecord(recOptions.webm);
    }
    if (hotkeys.gif && e.key === hotkeys.gif) {
        if (isRecordingGIF)
            stopRecord();
        else
            beginGIFRecord(recOptions.gif);
    }
    if (hotkeys.png && e.key === hotkeys.png) {
        takePNGSnapshot(recOptions.png);
    }
    if (hotkeys.jpeg && e.key === hotkeys.jpeg) {
        takeJPEGSnapshot(recOptions.jpeg);
    }
});
function beginVideoRecord(options) {
    if (isRecordingGIF) {
        console.warn('You are currently recording a gif, stop recording gif before starting new video record.');
        return;
    }
    if (isRecordingVideo) {
        console.warn('You are currently recording a video, stop recording current video before starting new video record.');
        return;
    }
    // CCapture seems to expect a quality between 0 and 100.
    var quality = 100;
    if (options && options.quality) {
        quality = options.quality * 100;
    }
    // Create a capturer that exports a WebM video.
    // @ts-ignore
    capturer = new window.CCapture({
        format: 'webm',
        name: (options === null || options === void 0 ? void 0 : options.name) || 'WEBM_Capture',
        framerate: (options === null || options === void 0 ? void 0 : options.fps) || 60,
        quality: quality,
        verbose: VERBOSE,
    });
    isRecordingVideo = true;
    startRecord();
}
exports.beginVideoRecord = beginVideoRecord;
function beginGIFRecord(options) {
    if (isRecordingVideo) {
        console.warn('You are currently recording a video, stop recording video before starting new gif record.');
        return;
    }
    if (isRecordingGIF) {
        console.warn('You are currently recording a gif, stop recording current gif before starting new gif record.');
        return;
    }
    // CCapture seems to expect a quality between 0 and 100.
    var quality = 100;
    if (options && options.quality) {
        quality = options.quality * 100;
    }
    // Create a capturer that exports a GIF.
    // @ts-ignore
    capturer = new window.CCapture({
        format: 'gif',
        name: (options === null || options === void 0 ? void 0 : options.name) || 'GIF_Capture',
        framerate: (options === null || options === void 0 ? void 0 : options.fps) || 60,
        workersPath: workersPath,
        quality: quality,
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
    canvas.toBlob(function (blob) {
        if (!blob) {
            modals_1.showAlert('Problem saving PNG, please try again!');
            return;
        }
        file_saver_1.saveAs(blob, ((options === null || options === void 0 ? void 0 : options.name) || 'PNG_Capture') + ".png");
    }, 'image/png');
}
exports.takePNGSnapshot = takePNGSnapshot;
function takeJPEGSnapshot(options) {
    if (!checkCanvas()) {
        return;
    }
    // Quality is a number between 0 and 1 https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob
    canvas.toBlob(function (blob) {
        if (!blob) {
            modals_1.showAlert('Problem saving JPEG, please try again!');
            return;
        }
        file_saver_1.saveAs(blob, ((options === null || options === void 0 ? void 0 : options.name) || 'JPEG_Capture') + ".jpg");
    }, 'image/jpeg', (options === null || options === void 0 ? void 0 : options.quality) || 1);
}
exports.takeJPEGSnapshot = takeJPEGSnapshot;
function recordFrame() {
    if (!checkCanvas()) {
        return;
    }
    if (!capturer) {
        console.warn('No valid capturer inited, please call CanvasCapture.beginVideoRecord() or CanvasCapture.beginGIFRecord() first.');
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
        console.warn('No valid capturer inited, please call CanvasCapture.beginVideoRecord() or CanvasCapture.beginGIFRecord() first.');
        return;
    }
    if (numFrames === 0) {
        console.warn('No frames recorded, call CanvasCapture.recordFrame()');
        return;
    }
    capturer.stop();
    capturer.save();
    capturer = null;
    if (isRecordingGIF) {
        // Tell the user that gifs take a sec to process.
        if (modals_1.PARAMS.SHOW_DIALOGS)
            modals_1.showDialog('Processing...', 'GIF is processing and may take a minute to save.  You can close this window in the meantime.', { autoCloseDelay: 7000 });
    }
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