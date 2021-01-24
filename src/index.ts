// @ts-ignore
import CCapture from 'ccapture.js';
import { showAlert, showDot } from './modals';

const VERBOSE = true;
const WORKERS_PATH = '/';

let capturer: CCapture | null = null;

export function beginVideoRecord(options: {
	fps?: number,
	name?: string,
	quality?: string,
}) {
	clearCapturer();
	// Create a capturer that exports a WebM video
	capturer = new CCapture( {
		format: 'webm',
		name: options.name || 'WEBM_Capture',
		framerate: options.fps || 60,
		quality: options.quality || 63,
		verbose: VERBOSE,
	});
	startRecord();
}

export function beginGifRecord(options: {
	fps?: number,
	name?: string,
}) {
	clearCapturer();
	// Create a capturer that exports a WebM video
	capturer = new CCapture({
		format: 'gif',
		name: options.name || 'GIF_Capture',
		framerate: options.fps || 60,
		workersPath: WORKERS_PATH,
		verbose: VERBOSE,
	});
	startRecord();
}

export function takePNGSnapshot(canvas: HTMLCanvasElement, options: {
	name?: string,
}) {
	clearCapturer();
	// Create a capturer that exports a WebM video
	capturer = new CCapture({
		format: 'png',
		name: options.name || 'PNG_Capture',
		verbose: VERBOSE,
	});
	capturer.start();
	capturer.capture(canvas);
	stopRecord();
}

export function recordFrame(canvas: HTMLCanvasElement) {
	if (!capturer) {
		throw new Error('No valid capturer inited.');
	}
	capturer.capture(canvas);
}

function startRecord() {
	capturer.start();
	// For video and gif records, we should also throw up an indicator to show that we're in record mode.
	showDot(true);
}

export function stopRecord() {
	if (!capturer) {
		throw new Error('No valid capturer inited.');
	}
	capturer.stop();
	capturer.save();
	capturer = null;
}

function clearCapturer() {
	if (capturer) {
		capturer.stop();
		capturer = null;
		showDot(false);
	}
}

window.addEventListener('resize', function(){
	if (capturer) {
		showAlert("Don't resize window while recording canvas!!");
	}
});
