// @ts-ignore
import CCapture from 'ccapture.js'
import { saveAs } from 'file-saver';
// @ts-ignore
import { changeDpiBlob } from 'changedpi';
import { initDotWithCSS, PARAMS, showAlert, showDialog, showDot } from './modals';
import { workerString } from './gif.worker';

// Export showDialog method in case it is useful.
export { showDialog } from './modals';

// Make is so we don't have to specify workersPath for CCapture.
const workersBlob = new Blob([workerString]);
const workersPath = URL.createObjectURL(workersBlob);

let VERBOSE = true;

const activeCaptures: {
	capturer: CCapture,
	numFrames: number,
	type: 'gif' | 'webm' | 'mp4',
}[] = [];

// This is an unused variable,
// but needed for proper import of CCapture at the moment.
// See https://github.com/spite/ccapture.js/issues/78
const temp = CCapture;

const hotkeys: { [key: string]: string | null} = {
	webm: null,
	gif: null,
	png: null,
	jpeg: null,
};

let canvas: HTMLCanvasElement | null = null;

export function init(_canvas: HTMLCanvasElement, options?: {
	verbose?: boolean,
	showAlerts?: boolean,
	showDialogs?: boolean,
	showRecDot?: boolean,
	recDotCSS?: {[key: string]: string},
}) {
	canvas = _canvas;
	if (options && options.verbose !== undefined) setVerbose(options.verbose);
	if (options && options.showAlerts !== undefined) PARAMS.SHOW_ALERTS = options.showAlerts;
	if (options && options.showDialogs !== undefined) PARAMS.SHOW_DIALOGS = options.showDialogs;
	if (options && options.showRecDot !== undefined) PARAMS.SHOW_REC_DOT = options.showRecDot;
	if (PARAMS.SHOW_REC_DOT) {
		initDotWithCSS(options?.recDotCSS);
	}
	canvas.addEventListener('resize', function(){
		if (activeCaptures.length) {
			showAlert("Don't resize while recording canvas!");
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
	quality?: number, // A number 0-1.
};
type GIF_OPTIONS = {
	fps?: number,
	name?: string,
	quality?: number // A number 0-1.
};
type PNG_OPTIONS = {
	name?: string,
	dpi?: number, // Default is screen dpi (72).
};
type JPEG_OPTIONS = {
	name?: string,
	quality?: number, // A number 0-1.
	dpi?: number, // Default is screen dpi (72).
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
		const WEBMs = activeWEBMCaptures();
		if (WEBMs.length) stopRecord();
		else beginVideoRecord(recOptions.webm);
	}
	if (hotkeys.gif && e.key === hotkeys.gif) {
		const GIFs = activeGIFCaptures();
		if (GIFs.length) stopRecord();
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
	if (activeCaptures.length) {
		showAlert(`CCapture.js only supports one video/gif capture at a time.`);
		return;
	}
	// CCapture seems to expect a quality between 0 and 100.
	let quality = 100;
	if (options && options.quality) {
		quality = options.quality * 100;
	}
	// Create a capturer that exports a WebM video.
	// @ts-ignore
	const capturer = new window.CCapture( {
		format: 'webm',
		name: options?.name || 'WEBM_Capture',
		framerate: options?.fps || 60,
		quality,
		verbose: VERBOSE,
	});
	capturer.start();
	activeCaptures.push({
		capturer,
		numFrames: 0,
		type: 'webm',
	});
	// For video and gif records, we should also throw up an indicator to show that we're in record mode.
	showDot(isRecording());
	return capturer;
}

export function beginGIFRecord(options?: GIF_OPTIONS) {
	if (activeCaptures.length) {
		showAlert(`CCapture.js only supports one video/gif capture at a time.`);
		return;
	}
	// CCapture seems to expect a quality between 0 and 100.
	let quality = 100;
	if (options && options.quality) {
		quality = options.quality * 100;
	}
	// Create a capturer that exports a GIF.
	// @ts-ignore
	const capturer = new window.CCapture({
		format: 'gif',
		name: options?.name || 'GIF_Capture',
		framerate: options?.fps || 60,
		workersPath,
		quality,
		verbose: VERBOSE,
	});
	capturer.start();
	activeCaptures.push({
		capturer,
		numFrames: 0,
		type: 'gif',
	});
	// For video and gif records, we should also throw up an indicator to show that we're in record mode.
	showDot(isRecording());
	return capturer;
}

export function takePNGSnapshot(options?: PNG_OPTIONS) {
	if (!checkCanvas()) {
		return;
	}
	const name = options?.name || 'PNG_Capture';
	canvas!.toBlob((blob) => {
		if (!blob) {
			showAlert('Problem saving PNG, please try again!');
			return;
		}
		if (options?.dpi) {
			changeDpiBlob(blob, options?.dpi).then((blob: Blob) =>{
				saveAs(blob, `${name}.png`);
			});
		} else {
			saveAs(blob, `${name}.png`);
		}
	}, 'image/png');
}

export function takeJPEGSnapshot(options?: JPEG_OPTIONS) {
	const name = options?.name || 'JPEG_Capture';
	if (!checkCanvas()) {
		return;
	}
	// Quality is a number between 0 and 1 https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob
	canvas!.toBlob((blob) => {
		if (!blob) {
			showAlert('Problem saving JPEG, please try again!');
			return;
		}
		if (options?.dpi) {
			changeDpiBlob(blob, options?.dpi).then((blob: Blob) =>{
				saveAs(blob, `${name}.jpg`);
			});
		} else {
			saveAs(blob, `${name}.jpg`);
		}
	}, 'image/jpeg', options?.quality || 1);
}

function getIndexOfCapturer(capturer: CCapture, methodName: string) {
	let index = -1;
	// Find capturer in activeCaptures.
	for (let i = 0; i < activeCaptures.length; i++) {
		if (activeCaptures[i].capturer == capturer) {
			index = i;
			break;
		}
	}
	if (index < 0) {
		showAlert(`Invalid capturer passed into CanvasCapture.${methodName}.`);
	}
	return index;
}

// export function recordFrame(capturer?: CCapture | CCapture[]) {
export function recordFrame() {
	if (!checkCanvas()) {
		return;
	}
	if (activeCaptures.length === 0) {
		showAlert('No valid capturer inited, please call CanvasCapture.beginVideoRecord() or CanvasCapture.beginGIFRecord() first.');
		return;
	}

	// Either record frame on passed in capturer, or on all active capturers.
	// if (capturer) {
	// 	if (!Array.isArray(capturer)) {
	// 		capturer = [capturer];
	// 	}
	// 	for (let i = 0; i < capturer.length; i++) {
	// 		const index = getIndexOfCapturer(capturer, 'recordFrame');
	// 		if (index >= 0) {
	// 			activeCaptures[index].capturer.capture(canvas);
	// 			activeCaptures[index].numFrames += 1;
	// 		}
	// 	}
	// } else {
	for (let i = 0; i < activeCaptures.length; i++) {
		activeCaptures[i].capturer.capture(canvas);
		activeCaptures[i].numFrames += 1;
	}
	// }
}

function stopRecordAtIndex(index: number) {
	const { capturer, numFrames, type } = activeCaptures[index];
	if (numFrames === 0) {
		showAlert('No frames recorded, call CanvasCapture.recordFrame().');
		return;
	}
	capturer.stop();
	capturer.save();
	
	if (type === 'gif') {
		// Tell the user that gifs take a sec to process.
		if (PARAMS.SHOW_DIALOGS) showDialog(
			'Processing...',
			'GIF is processing and may take a minute to save.  You can close this window in the meantime.',
			{ autoCloseDelay: 7000 },
		);
	}

	// Remove ref to capturer.
	activeCaptures.splice(index, 1);
}

// export function stopRecord(capturer?: CCapture | CCapture[]) {
export function stopRecord() {
	if (activeCaptures.length === 0) {
		showAlert('No valid capturer inited, please call CanvasCapture.beginVideoRecord() or CanvasCapture.beginGIFRecord() first.');
		return;
	}
	
	// // Either stop record on passed in capturer, or on all active capturers.
	// if (capturer) {
	// 	if (!Array.isArray(capturer)) {
	// 		capturer = [capturer];
	// 	}
	// 	for (let i = 0; i < capturer.length; i++) {
	// 		const index = getIndexOfCapturer(capturer[i], 'stopRecord');
	// 		if (index >= 0) {
	// 			stopRecordAtIndex(index);
	// 		}
	// 	}
	// } else {
	for (let i = activeCaptures.length - 1; i >= 0; i--) {
		stopRecordAtIndex(i);
	}
	// }

	showDot(isRecording());
}

function activeWEBMCaptures() {
	const webmCaptures: CCapture[] = [];
	for (let i = 0; i < activeCaptures.length; i++) {
		if (activeCaptures[i].type === 'webm') {
			webmCaptures.push(activeCaptures[i].capturer);
		}
	}
	return webmCaptures;
}

function activeGIFCaptures() {
	const gifCaptures: CCapture[] = [];
	for (let i = 0; i < activeCaptures.length; i++) {
		if (activeCaptures[i].type === 'gif') {
			gifCaptures.push(activeCaptures[i].capturer);
		}
	}
	return gifCaptures;
}

export function isRecording() {
	return activeCaptures.length > 0;
}