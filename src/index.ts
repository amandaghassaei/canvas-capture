// @ts-ignore
import CCapture from 'ccapture.js'
import { saveAs } from 'file-saver';
import { showAlert, showDot } from './modals';
const workersPath = require('./gif.worker.js');
console.log(workersPath);

let VERBOSE = true;

let capturer: CCapture | null = null;

// This is an unused variable,
// but needed for propper import of CCapture at the moment.
// See https://github.com/spite/ccapture.js/issues/78
const temp = CCapture;

const hotkeys: { [key: string]: string | null} = {
	webm: null,
	gif: null,
	png: null,
	jpeg: null,
};

let isRecordingVideo = false;
let isRecordingGIF = false;

let canvas: HTMLCanvasElement | null = null;

let numFrames = 0;

export function init(_canvas: HTMLCanvasElement) {
	canvas = _canvas;
	canvas.addEventListener('resize', function(){
		if (capturer) {
			showAlert("Don't resize while recording canvas!!");
		}
	});
}

export function setVerbose(state: boolean) {
	VERBOSE = !!state;
}

function checkCanvas() {
	if (canvas === null) {
		showAlert('No canvas supplied, please call CanvasCapture.init() and pass in canvas element.');
		return false;
	}
	return true;
}

// Save options for hotkey controls.
type VIDEO_OPTIONS = {
	fps?: number,
	name?: string,
	quality?: number,
};
type GIF_OPTIONS = {
	fps?: number,
	name?: string,
};
type PNG_OPTIONS = {
	name?: string,
};
type JPEG_OPTIONS = {
	name?: string,
	quality?: number, // A number 0-1.
};
const recOptions:
{
	webm?: VIDEO_OPTIONS,
	gif?: GIF_OPTIONS,
	png?: PNG_OPTIONS,
	jpeg?: JPEG_OPTIONS,
} = {
	webm: undefined,
	gif: undefined,
	png: undefined,
	jpeg: undefined,
};

// Pressing key once will start record, press again to stop.
export function bindKeyToVideoRecord(key: string, options?: VIDEO_OPTIONS) {
	recOptions.webm = options;
	Object.keys(hotkeys).forEach(keyName => {
		if (hotkeys[keyName] === key) {
			hotkeys[keyName] = null;
		}
	});
	hotkeys.webm = key;
}
export function bindKeyToGIFRecord(key: string, options?: GIF_OPTIONS) {
	recOptions.gif = options;
	Object.keys(hotkeys).forEach(keyName => {
		if (hotkeys[keyName] === key) {
			hotkeys[keyName] = null;
		}
	});
	hotkeys.gif = key;
}
// Snapshots just take a single shot.
export function bindKeyToPNGSnapshot(key: string, options?: PNG_OPTIONS) {
	recOptions.png = options;
	Object.keys(hotkeys).forEach(keyName => {
		if (hotkeys[keyName] === key) {
			hotkeys[keyName] = null;
		}
	});
	hotkeys.png = key;
}
export function bindKeyToJPEGSnapshot(key: string, options?: JPEG_OPTIONS) {
	recOptions.jpeg = options;
	Object.keys(hotkeys).forEach(keyName => {
		if (hotkeys[keyName] === key) {
			hotkeys[keyName] = null;
		}
	});
	hotkeys.jpeg = key;
}

window.addEventListener('keydown', (e: KeyboardEvent) => {
	if (hotkeys.webm && e.key === hotkeys.webm) {
		if (isRecordingVideo) stopRecord();
		else beginVideoRecord(recOptions.webm);
	}
	if (hotkeys.gif && e.key === hotkeys.gif) {
		if (isRecordingGIF) stopRecord();
		else beginGIFRecord(recOptions.gif);
	}
	if (hotkeys.png && e.key === hotkeys.png) {
		takePNGSnapshot(recOptions.png);
	}
	if (hotkeys.jpeg && e.key === hotkeys.jpeg) {
		takeJPEGSnapshot(recOptions.jpeg);
	}
});

export function beginVideoRecord(options?: VIDEO_OPTIONS) {
	if (isRecordingGIF) {
		showAlert('You are currently recording a gif, stop recording gif before starting new video record.');
		return;
	}
	if (isRecordingVideo) {
		showAlert('You are currently recording a video, stop recording current video before starting new video record.');
		return;
	}
	let quality = 100;
	if (options && options.quality) {
		quality = options.quality * 100;
	}
	// Create a capturer that exports a WebM video
	// @ts-ignore
	capturer = new window.CCapture( {
		format: 'webm',
		name: options?.name || 'WEBM_Capture',
		framerate: options?.fps || 60,
		quality,
		verbose: VERBOSE,
	});
	isRecordingVideo = true;
	startRecord();
}

export function beginGIFRecord(options?: GIF_OPTIONS) {
	if (isRecordingVideo) {
		showAlert('You are currently recording a video, stop recording video before starting new gif record.');
		return;
	}
	if (isRecordingGIF) {
		showAlert('You are currently recording a gif, stop recording current gif before starting new gif record.');
		return;
	}
	// Create a capturer that exports a WebM video
	// @ts-ignore
	capturer = new window.CCapture({
		format: 'gif',
		name: options?.name || 'GIF_Capture',
		framerate: options?.fps || 60,
		workersPath,
		verbose: VERBOSE,
	});
	isRecordingGIF = true;
	startRecord();
}

export function takePNGSnapshot(options?: PNG_OPTIONS) {
	if (!checkCanvas()) {
		return;
	}
	canvas!.toBlob((blob) => {
		if (!blob) {
			showAlert('Problem saving PNG, please try again!');
			return;
		}
		saveAs(blob, `${options?.name || 'PNG_Capture'}.png`);
	}, 'image/png');
}

export function takeJPEGSnapshot(options?: JPEG_OPTIONS) {
	if (!checkCanvas()) {
		return;
	}
	canvas!.toBlob((blob) => {
		if (!blob) {
			showAlert('Problem saving JPEG, please try again!');
			return;
		}
		saveAs(blob, `${options?.name || 'JPEG_Capture'}.jpg`);
	}, 'image/jpeg', options?.quality || 1);
}

export function recordFrame() {
	if (!checkCanvas()) {
		return;
	}
	if (!capturer) {
		showAlert('No valid capturer inited, please call CanvasCapture.beginVideoRecord() or CanvasCapture.beginGIFRecord() first.');
		return;
	}
	capturer.capture(canvas);
	numFrames++;
}

function startRecord() {
	capturer.start();
	// For video and gif records, we should also throw up an indicator to show that we're in record mode.
	showDot(true);
	numFrames = 0;
}

export function stopRecord() {
	if (!capturer) {
		showAlert('No valid capturer inited, please call CanvasCapture.beginVideoRecord() or CanvasCapture.beginGIFRecord() first.');
		return;
	}
	if (numFrames === 0) {
		showAlert('No frames recorded, call CanvasCapture.recordFrame()');
		return;
	}
	capturer.stop();
	capturer.save();
	capturer = null;
	isRecordingGIF = false;
	isRecordingVideo = false;
	showDot(false);
}

export function isRecording() {
	return isRecordingVideo || isRecordingGIF;
}
