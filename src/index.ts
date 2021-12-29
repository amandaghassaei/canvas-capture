import CCapture from 'ccapture.js'
import { saveAs } from 'file-saver';
// @ts-ignore
import { changeDpiBlob } from 'changedpi';
import { PARAMS } from './params';
import { initDotWithCSS, showAlert, showDialog, showDot } from './modals';
import { createFFmpeg, fetchFile, FFmpeg } from '@ffmpeg/ffmpeg';

// Make it so we don't have to specify workersPath for CCapture gif recorder.
// This is not a large file, so no need to separate from lib.
// @ts-ignore
import gifWorkerString from 'raw-loader!ccapture.js/src/gif.worker.js';
import JSZip = require('jszip');
const gifWorkersPath = URL.createObjectURL(new Blob([gifWorkerString]));

let ffmpeg: FFmpeg;

// Export showDialog method in case it is useful.
export { showDialog } from './modals';

const GIF = 'gif';
export const WEBM = 'webm';
export const MP4 = 'mp4';
const JPEGZIP = 'jpegzip';
const PNGZIP = 'pngzip';
const JPEG = 'jpeg';
const PNG = 'png';
type CAPTURE_TYPE =
	typeof GIF | typeof WEBM | typeof MP4 |
	typeof JPEGZIP | typeof PNGZIP;

// Save options for hotkey controls.
type WEBM_OPTIONS = {
	format?: typeof WEBM,
	fps?: number,
	name?: string,
	quality?: number, // A number 0-1.
};
type MP4_OPTIONS = {
	format?: typeof MP4,
	fps?: number,
	name?: string,
	quality?: number, // A number 0-1.
	// onFFMPEGProgress?: (progress: { ratio: number }) => void,
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

export type ACTIVE_CAPTURE = {
	name: string,
	capturer: CCapture | JSZip,
	numFrames: number,
	type: CAPTURE_TYPE,
	zipOptions?: PNG_OPTIONS | JPEG_OPTIONS, // Only used for frame zip record.
	onFFMPEGProgress?: (progress: number) => void,
	ffmpegOptions?: { [key: string]: string },
};
const activeCaptures: ACTIVE_CAPTURE[] = [];

// This is an unused variable,
// but needed for proper import of CCapture at the moment.
// See https://github.com/spite/ccapture.js/issues/78
const temp = CCapture;

type HOTKEY_TYPE =
	typeof GIF | typeof WEBM | typeof MP4 |
	typeof JPEGZIP | typeof PNGZIP |
	typeof JPEG | typeof PNG;

const hotkeyOptions:
{
	[MP4]?: MP4_OPTIONS,
	[WEBM]?: WEBM_OPTIONS,
	[GIF]?: GIF_OPTIONS,
	[PNGZIP]?: PNG_OPTIONS,
	[JPEGZIP]?: JPEG_OPTIONS,
	[PNG]?: PNG_OPTIONS,
	[JPEG]?: JPEG_OPTIONS,
} = {};

const hotkeys: {
	[MP4]?: string,
	[WEBM]?: string,
	[GIF]?: string,
	[PNGZIP]?: string,
	[JPEGZIP]?: string,
	[PNG]?: string,
	[JPEG]?: string,
} = {};

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
	PARAMS.VERBOSE = !!state;
}

function checkCanvas() {
	if (canvas === null) {
		showAlert('No canvas supplied, please call CanvasCapture.init() and pass in canvas element.');
		return false;
	}
	return true;
}

function setHotkey(key: string, type: HOTKEY_TYPE) {
	// Unbind other hotkeys attached to same key.
	Object.keys(hotkeys).forEach(keyName => {
		if (hotkeys[keyName as HOTKEY_TYPE] === key) {
			delete hotkeys[keyName as HOTKEY_TYPE];
		}
	});
	hotkeys[type] = key;
}

// Pressing key once will start record, press again to stop.
export function bindKeyToVideoRecord(key: string, options: WEBM_OPTIONS | MP4_OPTIONS) {
	if (options.format === WEBM) {
		hotkeyOptions.webm = options as WEBM_OPTIONS;
		setHotkey(key, WEBM);
	} else {
		hotkeyOptions.mp4 = options as MP4_OPTIONS;
		setHotkey(key, MP4);
	}
}
export function bindKeyToGIFRecord(key: string, options?: GIF_OPTIONS) {
	hotkeyOptions.gif = options;
	setHotkey(key, GIF);
}
export function bindKeyToPNGFrames(key: string, options?: PNG_OPTIONS) {
	hotkeyOptions.pngzip = options;
	setHotkey(key, PNGZIP);
}
export function bindKeyToJPEGFrames(key: string, options?: JPEG_OPTIONS) {
	hotkeyOptions.jpegzip = options;
	setHotkey(key, JPEGZIP);
}
// Snapshots just take a single shot.
export function bindKeyToPNGSnapshot(key: string, options?: PNG_OPTIONS) {
	hotkeyOptions.png = options;
	setHotkey(key, PNG);
}
export function bindKeyToJPEGSnapshot(key: string, options?: JPEG_OPTIONS) {
	hotkeyOptions.jpeg = options;
	setHotkey(key, JPEG);
}

window.addEventListener('keydown', (e: KeyboardEvent) => {
	if (hotkeys.mp4 && e.key === hotkeys.mp4) {
		const MP4s = activeCapturesOfType(MP4);
		if (MP4s.length) stopRecord(MP4s);
		else {
			if (!browserSupportsMP4()) {
				showAlert(`This browser does not support MP4 video recording, please try again in Chrome.`);
				return;
			}
			beginVideoRecord(hotkeyOptions.mp4!);
		}
	}
	if (hotkeys.webm && e.key === hotkeys.webm) {
		const WEBMs = activeCapturesOfType(WEBM);
		if (WEBMs.length) stopRecord(WEBMs);
		else {
			if (!browserSupportsWEBM()) {
				showAlert(`This browser does not support WEBM video recording, please try again in Chrome.`);
				return;
			}
			beginVideoRecord(hotkeyOptions.webm!);
		}
	}
	if (hotkeys.gif && e.key === hotkeys.gif) {
		const GIFs = activeCapturesOfType(GIF);
		if (GIFs.length) stopRecord(GIFs);
		else beginGIFRecord(hotkeyOptions.gif);
	}
	if (hotkeys.pngzip && e.key === hotkeys.pngzip) {
		const pngzips = activeCapturesOfType(PNGZIP);
		if (pngzips.length) stopRecord(pngzips);
		else beginPNGFramesRecord(hotkeyOptions.pngzip);
	}
	if (hotkeys.jpegzip && e.key === hotkeys.jpegzip) {
		const jpgzips = activeCapturesOfType(JPEGZIP);
		if (jpgzips.length) stopRecord(jpgzips);
		else beginJPEGFramesRecord(hotkeyOptions.jpegzip);
	}
	if (hotkeys.png && e.key === hotkeys.png) {
		takePNGSnapshot(hotkeyOptions.png);
	}
	if (hotkeys.jpeg && e.key === hotkeys.jpeg) {
		takeJPEGSnapshot(hotkeyOptions.jpeg);
	}
});

function startCapture(capture: ACTIVE_CAPTURE) {
	activeCaptures.push(capture);
	if (capture.type !== PNGZIP && capture.type !== JPEGZIP) (capture.capturer as CCapture).start();
	// For multi-frame records, we should also throw up an indicator to show that we're in record mode.
	showDot(isRecording());
}

export function beginVideoRecord(options: WEBM_OPTIONS | MP4_OPTIONS) {
	const format = options?.format || MP4; // Default to MP4 record.
	if (format === MP4) {
		if (!browserSupportsMP4()) {
			showAlert(`This browser does not support MP4 video recording, please try again in Chrome.`);
			return;
		}
	} else if (format === WEBM) {
		if (!browserSupportsWEBM()) {
			showAlert(`This browser does not support WEBM video recording, please try again in Chrome.`);
			return;
		}
	} else {
		showAlert(`invalid video format ${format}.`);
		return;
	}
	if (activeVideoGifCaptures().length) {
		showAlert(`CCapture.js only supports one video/gif capture at a time.`);
		return;
	}
	
	let quality = 1;
	if (options && options.quality) {
		quality = options.quality;
	}
	const name = options?.name || 'Video_Capture';
	// Create a capturer that exports a WebM video.
	// @ts-ignore
	const capturer = new (window.CCapture as CCapture)({
		format: 'webm',
		name,
		framerate: options?.fps || 60,
		quality: quality * 100, // CCapture seems to expect a quality between 0 and 100.
		verbose: PARAMS.VERBOSE,
	});
	const capture = {
		name,
		capturer,
		numFrames: 0,
		type: format,
		// onFFMPEGProgress: (options as MP4_OPTIONS)?.onFFMPEGProgress,
		ffmpegOptions: (options as MP4_OPTIONS)?.ffmpegOptions,
	};
	startCapture(capture);
	return capture;
}

export function beginGIFRecord(options?: GIF_OPTIONS) {
	if (activeVideoGifCaptures().length) {
		showAlert(`CCapture.js only supports one video/gif capture at a time.`);
		return;
	}
	// CCapture seems to expect a quality between 0 and 100.
	let quality = 100;
	if (options && options.quality) {
		quality = options.quality * 100;
	}
	const name = options?.name || 'GIF_Capture';
	// Create a capturer that exports a GIF.
	// @ts-ignore
	const capturer = new (window.CCapture as CCapture)({
		format: 'gif',
		name,
		framerate: options?.fps || 60,
		workersPath: gifWorkersPath,
		quality,
		verbose: PARAMS.VERBOSE,
	});
	const capture = {
		name,
		capturer,
		numFrames: 0,
		type: GIF as CAPTURE_TYPE,
	};
	startCapture(capture);
	return capture;
}

export function beginPNGFramesRecord(options?: PNG_OPTIONS) {
	const name = options?.name || 'PNG_Frames_Capture';
	const capture = {
		name,
		zipOptions: options,
		capturer: new JSZip(),
		numFrames: 0,
		type: PNGZIP as CAPTURE_TYPE,
	};
	startCapture(capture);
	return capture;
}

export function beginJPEGFramesRecord(options?: JPEG_OPTIONS) {
	const name = options?.name || 'JPEG_Frames_Capture';
	const capture = {
		name,
		zipOptions: options,
		capturer: new JSZip(),
		numFrames: 0,
		type: JPEGZIP as CAPTURE_TYPE,
	};
	startCapture(capture);
	return capture;
}

export function takePNGSnapshot(options?: PNG_OPTIONS, callback: (blob: Blob, filename: string) => void = saveAs) {
	const name = options?.name || 'PNG_Capture';
	if (!checkCanvas()) {
		return;
	}
	canvas!.toBlob((blob) => {
		if (!blob) {
			showAlert('Problem saving PNG, please try again!');
			return;
		}
		if (options?.dpi) {
			changeDpiBlob(blob, options?.dpi).then((blob: Blob) => {
				callback(blob, `${name}.png`);
			});
		} else {
			callback(blob, `${name}.png`);
		}
	}, 'image/png');
}

export function takeJPEGSnapshot(options?: JPEG_OPTIONS, callback: (blob: Blob, filename: string) => void = saveAs) {
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
			changeDpiBlob(blob, options?.dpi).then((blob: Blob) => {
				callback(blob, `${name}.jpg`);
			});
		} else {
			callback(blob, `${name}.jpg`);
		}
	}, 'image/jpeg', options?.quality || 1);
}

export function recordFrame(capture?: ACTIVE_CAPTURE | ACTIVE_CAPTURE[]) {
	if (!checkCanvas()) {
		return;
	}
	if (activeCaptures.length === 0) {
		showAlert('No valid capturer inited, please call CanvasCapture.beginVideoRecord(), CanvasCapture.beginGIFRecord(), CanvasCapture.beginPNGFramesRecord(), or CanvasCapture.beginJPEGFramesRecord() first.');
		return;
	}

	let captures = activeCaptures;
	if (capture) {
		if (!Array.isArray(capture)) {
			captures = [capture];
		} else {
			captures = capture;
		}
	}

	for (let i = 0; i < captures.length; i++) {
		const { capturer, type, zipOptions, numFrames } = captures[i];
		if (type === JPEGZIP || type === PNGZIP) {
			// Name should correspond to current frame.
			const frameName = `frame_${numFrames + 1}`;
			const options = { ...(zipOptions || {}) };
			options.name = frameName;
			if (type === JPEGZIP) {
				takeJPEGSnapshot(options, (blob, filename) => {
					(capturer as JSZip).file(filename, blob);
				});
			} else if (type === PNGZIP) {
				takePNGSnapshot(options, (blob, filename) => {
					(capturer as JSZip).file(filename, blob);
				});
			}
		} else {
			(capturer as CCapture).capture(canvas!);
		}
		captures[i].numFrames = numFrames + 1
	}
}

function stopRecordAtIndex(index: number) {
	const {
		name,
		capturer,
		numFrames,
		type,
		onFFMPEGProgress,
		ffmpegOptions,
	} = activeCaptures[index];
	// Remove ref to capturer.
	activeCaptures.splice(index, 1);

	if (type !== PNGZIP && type !== JPEGZIP) (capturer as CCapture).stop();

	if (numFrames === 0) {
		showAlert('No frames recorded, call CanvasCapture.recordFrame().');
		return;
	}

	if (type === MP4) {
		(capturer as CCapture).save((blob: Blob) => {
			convertWEBMtoMP4({
				name,
				blob,
				onProgress: onFFMPEGProgress,
				ffmpegOptions,
			});
		});
	} else {
		if (type !== PNGZIP && type !== JPEGZIP) (capturer as CCapture).save();
		else {
			(capturer as JSZip).generateAsync({ type: 'blob' }).then((content) => {
				saveAs(content, `${name}.zip`);
			});
			showDialog(
				'Processing...',
				'Frames are being zipped and may take a minute to save.  You can close this dialog in the meantime.',
				{ autoCloseDelay: 7000 },
			);
		}
	}

	if (type === GIF) {
		// Tell the user that gifs take a sec to process.
		showDialog(
			'Processing...',
			'GIF is processing and may take a minute to save.  You can close this dialog in the meantime.',
			{ autoCloseDelay: 7000 },
		);
	}
}

export function stopRecord(capture?: ACTIVE_CAPTURE | ACTIVE_CAPTURE[]) {
	if (activeCaptures.length === 0) {
		showAlert('No valid capturer inited, please call CanvasCapture.beginVideoRecord(), CanvasCapture.beginGIFRecord(), CanvasCapture.beginPNGFramesRecord(), or CanvasCapture.beginJPEGFramesRecord() first.');
		return;
	}

	if (capture) {
		if (!Array.isArray(capture)) {
			capture = [capture];
		}
		for (let i = 0; i < capture.length; i++) {
			const index = activeCaptures.indexOf(capture[i]);
			if (index < 0) throw new Error(`Invalid capture ${capture[i]} – may have already been stopped.`);
			stopRecordAtIndex(index);
		}
	} else {
		for (let i = activeCaptures.length - 1; i >= 0; i--) {
			stopRecordAtIndex(i);
		}
	}

	showDot(isRecording());
}

function activeCapturesOfType(type: CAPTURE_TYPE) {
	const captures: ACTIVE_CAPTURE[] = [];
	for (let i = 0; i < activeCaptures.length; i++) {
		if (activeCaptures[i].type === type) {
			captures.push(activeCaptures[i]);
		}
	}
	return captures;
}

function activeVideoGifCaptures() {
	return activeCapturesOfType(WEBM).concat(activeCapturesOfType(MP4)).concat(activeCapturesOfType(GIF));
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
	// Tell the user that mp4s take a sec to process.
	showDialog(
		'Processing...',
		'MP4 is processing and may take a minute to save.  You can close this dialog in the meantime.',
		{ autoCloseDelay: 7000 },
	);
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
	// OnProgress callback is not working yet.
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
	// Also web workers?
	// && browserSupportsWebWorkers()
	return browserSupportsWEBP() && browserSupportsSharedArrayBuffer();
}

export function browserSupportsGIF() {
	return browserSupportsWebWorkers();
}