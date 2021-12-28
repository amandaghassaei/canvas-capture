// @ts-ignore
import CCapture from 'ccapture.js'
import { saveAs } from 'file-saver';
// @ts-ignore
import { changeDpiBlob } from 'changedpi';
import { initDotWithCSS, PARAMS, showAlert, showDialog, showDot } from './modals';
import { createFFmpeg, fetchFile, FFmpeg } from '@ffmpeg/ffmpeg';

// Make it so we don't have to specify workersPath for CCapture gif recorder.
// This is not a large file, so no need to separate from lib.
// @ts-ignore
import gifWorkerString from 'raw-loader!ccapture.js/src/gif.worker.js';
const gifWorkersPath = URL.createObjectURL(new Blob([gifWorkerString]));

let ffmpeg: FFmpeg;

// Export showDialog method in case it is useful.
export { showDialog } from './modals';

let VERBOSE = true;

const activeCaptures: {
	name: string,
	capturer: CCapture,
	numFrames: number,
	type: 'gif' | 'webm' | 'mp4',
	onMP4ConversionProgress?: (progress: number) => void,
	ffmpegOptions?: { [key: string]: string },
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
	ffmpegCorePath?: string,
	verbose?: boolean,
	showAlerts?: boolean,
	showDialogs?: boolean,
	showRecDot?: boolean,
	recDotCSS?: {[key: string]: string},
}) {
	canvas = _canvas;
	ffmpeg = createFFmpeg({
		// Use public address if you don't want to host your own.
		corePath: options?.ffmpegCorePath || 'https://unpkg.com/@ffmpeg/core@0.10.0/dist/ffmpeg-core.js',
		log: true,
	  });
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
type WEBM_OPTIONS = {
	format?: 'webm',
	fps?: number,
	name?: string,
	quality?: number, // A number 0-1.
};
type MP4_OPTIONS = {
	format?: 'mp4',
	fps?: number,
	name?: string,
	quality?: number, // A number 0-1.
	// onMP4ConversionProgress?: (progress: { ratio: number }) => void,
	ffmpegOptions?: { [key: string]: string },
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
	mp4?: MP4_OPTIONS,
	webm?: WEBM_OPTIONS,
	gif?: GIF_OPTIONS,
	png?: PNG_OPTIONS,
	jpeg?: JPEG_OPTIONS,
} = {
	mp4: undefined,
	webm: undefined,
	gif: undefined,
	png: undefined,
	jpeg: undefined,
};

// Pressing key once will start record, press again to stop.
export function bindKeyToVideoRecord(key: string, options: WEBM_OPTIONS | MP4_OPTIONS) {
	if (options.format === 'webm') {
		recOptions.webm = options as WEBM_OPTIONS;
		Object.keys(hotkeys).forEach(keyName => {
			if (hotkeys[keyName] === key) {
				hotkeys[keyName] = null;
			}
		});
		hotkeys.webm = key;
	} else {
		recOptions.mp4 = options as MP4_OPTIONS;
		Object.keys(hotkeys).forEach(keyName => {
			if (hotkeys[keyName] === key) {
				hotkeys[keyName] = null;
			}
		});
		hotkeys.mp4 = key;
	}
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
	if (hotkeys.mp4 && e.key === hotkeys.mp4) {
		const MP4s = activeMP4Captures();
		if (MP4s.length) stopRecord();
		else {
			if (!browserSupportsMP4()) {
				showAlert(`This browser does not support MP4 video recording, please try again in Chrome.`);
				return;
			}
			beginVideoRecord(recOptions.mp4!);
		}
	}
	if (hotkeys.webm && e.key === hotkeys.webm) {
		const WEBMs = activeWEBMCaptures();
		if (WEBMs.length) stopRecord();
		else {
			if (!browserSupportsWEBM()) {
				showAlert(`This browser does not support WEBM video recording, please try again in Chrome.`);
				return;
			}
			beginVideoRecord(recOptions.webm!);
		}
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

export function beginVideoRecord(options: WEBM_OPTIONS | MP4_OPTIONS) {
	const format = options?.format || 'mp4';
	if (format === 'mp4') {
		if (!browserSupportsMP4()) {
			showAlert(`This browser does not support MP4 video recording, please try again in Chrome.`);
			return false;
		}
	} else if (format === 'webm') {
		if (!browserSupportsWEBM()) {
			showAlert(`This browser does not support WEBM video recording, please try again in Chrome.`);
			return false;
		}
	} else {
		showAlert(`invalid video format ${format}.`);
		return false;
	}
	if (activeCaptures.length) {
		showAlert(`CCapture.js only supports one video/gif capture at a time.`);
		return false;
	}
	// CCapture seems to expect a quality between 0 and 100.
	let quality = 100;
	if (options && options.quality) {
		quality = options.quality * 100;
	}
	const name = options?.name || 'Video_Capture';
	// Create a capturer that exports a WebM video.
	// @ts-ignore
	const capturer = new window.CCapture( {
		format: 'webm',
		name,
		framerate: options?.fps || 60,
		quality,
		verbose: VERBOSE,
	});
	capturer.start();
	activeCaptures.push({
		name,
		capturer,
		numFrames: 0,
		type: format,
		// onMP4ConversionProgress: (options as MP4_OPTIONS)?.onMP4ConversionProgress,
		ffmpegOptions: (options as MP4_OPTIONS)?.ffmpegOptions,
	});
	// For video and gif records, we should also throw up an indicator to show that we're in record mode.
	showDot(isRecording());
	return capturer;
}

export function beginGIFRecord(options?: GIF_OPTIONS) {
	if (activeCaptures.length) {
		showAlert(`CCapture.js only supports one video/gif capture at a time.`);
		return false;
	}
	// CCapture seems to expect a quality between 0 and 100.
	let quality = 100;
	if (options && options.quality) {
		quality = options.quality * 100;
	}
	const name = options?.name || 'GIF_Capture';
	// Create a capturer that exports a GIF.
	// @ts-ignore
	const capturer = new window.CCapture({
		format: 'gif',
		name,
		framerate: options?.fps || 60,
		workersPath: gifWorkersPath,
		quality,
		verbose: VERBOSE,
	});
	capturer.start();
	activeCaptures.push({
		name,
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
	const {
		name,
		capturer,
		numFrames,
		type,
		onMP4ConversionProgress,
		ffmpegOptions,
	} = activeCaptures[index];
	capturer.stop();

	// Remove ref to capturer.
	activeCaptures.splice(index, 1);

	if (numFrames === 0) {
		showAlert('No frames recorded, call CanvasCapture.recordFrame().');
		return;
	}

	if (type === 'mp4') {
		capturer.save((blob: Blob) => {
			convertWEBMtoMP4({
				name,
				blob,
				onProgress: onMP4ConversionProgress,
				ffmpegOptions,
			});
		});
	} else {
		capturer.save();
	}

	if (type === 'gif') {
		// Tell the user that gifs take a sec to process.
		if (PARAMS.SHOW_DIALOGS) showDialog(
			'Processing...',
			'GIF is processing and may take a minute to save.  You can close this window in the meantime.',
			{ autoCloseDelay: 7000 },
		);
	}
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

function activeMP4Captures() {
	const mp4Captures: CCapture[] = [];
	for (let i = 0; i < activeCaptures.length; i++) {
		if (activeCaptures[i].type === 'mp4') {
			mp4Captures.push(activeCaptures[i].capturer);
		}
	}
	return mp4Captures;
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

let ffmpegLoaded = false;
async function convertWEBMtoMP4(options: {
	name: string,
	blob: Blob,
	onProgress?: (progress: number) => void,
	ffmpegOptions?: { [key: string]: string },
}) {
	if (!ffmpegLoaded) {
		try {
			await ffmpeg.load();
			ffmpegLoaded = true;
		} catch (e) {
			showAlert('MP4 export not supported in this browser, try again in the latest version of Chrome.');
			return;
		}
	}
	const { name, blob, onProgress, ffmpegOptions } = options;
	// Convert blob to Uint8 array.
	const data = await fetchFile(blob);
	// Write data to MEMFS, need to use Uint8Array for binary data.
	ffmpeg.FS('writeFile', `${name}.webm`, data);
	// Convert to MP4.
	// This is not working yet.
	// https://github.com/ffmpegwasm/ffmpeg.wasm/issues/112
	// if (onProgress) ffmpeg.setProgress(({ ratio }) => {
	// 	onProgress(ratio);
	// });
	// -vf "crop=trunc(iw/2)*2:trunc(ih/2)*2" ensures the dimensions of the mp4 are divisible by 2.
	// -c:v libx264 -preset slow -crf 22 encodes as h.264 with better compression settings.
	// -pix_fmt yuv420p makes it compatible with the web browser.
	// -an creates a video with no audio.
	const defaultFFMPEGOptions = {
		'-c:v': 'libx264',
		'-preset': 'slow',
		'-crf': '22',
		'-pix_fmt': 'yuv420p',
	};
	const combinedOptions: { [key: string]: string } = {...defaultFFMPEGOptions, ...(ffmpegOptions || {})};
	const _ffmpegOptions: string[] = [];
	Object.keys(combinedOptions).forEach(key => {
		_ffmpegOptions.push(key, combinedOptions[key]);
	});
	await ffmpeg.run(
		'-i', `${name}.webm`,
		..._ffmpegOptions,
		'-vf', 'crop=trunc(iw/2)*2:trunc(ih/2)*2',
		'-an',
		`${name}.mp4`,
	);
	const output = await ffmpeg.FS('readFile', `${name}.mp4`);
	const outputBlob = new Blob([output], { type: 'video/mp4' });
	saveAs(outputBlob, `${name}.mp4`);
	// Delete files in MEMFS.
	ffmpeg.FS('unlink', `${name}.webm`);
	ffmpeg.FS('unlink', `${name}.mp4`);
}

function browserSupportsWEBP() {
	checkCanvas();
	const url = canvas!.toDataURL('image/webp', { quality: 1 });
	if (typeof url !== "string" || !url.match(/^data:image\/webp;base64,/i)) {
		return false;
	}
	return true;
}

function browserSupportsSharedArrayBuffer() {
	try {
		const test = new SharedArrayBuffer(1024);
	} catch {
		return false;
	}
	return true;
}

function browserSupportsWebWorkers() {
	return !!window.Worker;
}

export function browserSupportsWEBM() {
	return browserSupportsWEBP();
}

export function browserSupportsMP4() {
	return browserSupportsWEBP() && browserSupportsSharedArrayBuffer();
}

export function browserSupportsGIF() {
	return browserSupportsWebWorkers();
}