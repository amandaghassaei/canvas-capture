// @ts-ignore
import CCapture from 'ccapture.js'
import { showAlert, showDot } from './modals';

let VERBOSE = true;
const WORKERS_PATH = '/';

let capturer: CCapture | null = null;
const temp = CCapture;

let videoRecKey: string | null = null;
let gifRecKey: string | null = null;
let pngRecKey: string | null = null;

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

window.addEventListener('keydown', (e: KeyboardEvent) => {
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
export function bindKeyToVideoRecord(key: string) {
	if (key === gifRecKey) {
		gifRecKey = null;
	}
	if (key === pngRecKey) {
		pngRecKey = null;
	}
	videoRecKey = key;
}
export function bindKeyToGIFRecord(key: string) {
	if (key === videoRecKey) {
		videoRecKey = null;
	}
	if (key === pngRecKey) {
		pngRecKey = null;
	}
	gifRecKey = key;
}
export function bindKeyToPNGSnapshot(key: string) {
	if (key === gifRecKey) {
		gifRecKey = null;
	}
	if (key === videoRecKey) {
		videoRecKey = null;
	}
	pngRecKey = key;
}

export function beginVideoRecord(options?: {
	fps?: number,
	name?: string,
	quality?: string,
}) {
	if (isRecordingGIF) {
		showAlert('You are currently recording a gif, stop recording gif before starting new video record.');
		return;
	}
	if (isRecordingVideo) {
		showAlert('You are currently recording a video, stop recording current video before starting new video record.');
		return;
	}
	// Create a capturer that exports a WebM video
	// @ts-ignore
	capturer = new window.CCapture( {
		format: 'webm',
		name: options?.name || 'WEBM_Capture',
		framerate: options?.fps || 60,
		quality: options?.quality || 63,
		verbose: VERBOSE,
	});
	isRecordingVideo = true;
	startRecord();
}

export function beginGIFRecord(options?: {
	fps?: number,
	name?: string,
}) {
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
		workersPath: WORKERS_PATH,
		verbose: VERBOSE,
	});
	isRecordingGIF = true;
	startRecord();
}

export function takePNGSnapshot(options?: {
	name?: string,
}) {
	if (!checkCanvas()) {
		return;
	}
	if (isRecordingVideo) {
		showAlert('You are currently recording a video, stop recording video before starting new png snapshot.');
		return;
	}
	if (isRecordingGIF) {
		showAlert('You are currently recording a gif, stop recording gif before starting new png snapshot.');
		return;
	}
	// Create a capturer that exports a WebM video
	// @ts-ignore
	capturer = new window.CCapture({
		format: 'png',
		name: options?.name || 'PNG_Capture',
		verbose: VERBOSE,
	});
	capturer.start();
	capturer.capture(canvas);
	stopRecord();
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
