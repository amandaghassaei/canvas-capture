import CCapture from './CCapture.js/CCapture';
import { saveAs } from 'file-saver';
// Polyfill for canvas.toBlob needed for some browsers.
import 'mdn-polyfills/HTMLCanvasElement.prototype.toBlob';
// @ts-ignore
import { changeDpiBlob } from 'changedpi';
import { PARAMS } from './params';
import { initDotWithCSS, showWarning, showDialog, showDot } from './modals';
// @ts-ignore
import { FFmpeg } from '@ffmpeg/ffmpeg';

// Make it so we don't have to specify workersPath for CCapture gif recorder.
// This is not a large file, so no need to separate from lib.
// @ts-ignore
import gifWorkerString from 'raw-loader!./CCapture.js/gif.worker.js';
// @ts-ignore
import * as JSZip from 'jszip';
const gifWorkersPath = URL.createObjectURL(new Blob([gifWorkerString]));

let ffmpegPath: string;
let ffmpeg: FFmpeg | undefined = undefined;

// Export showDialog method in case it is useful.
export { showDialog } from './modals';

const GIF = 'gif' as const;
export const WEBM = 'webm' as const;
export const MP4 = 'mp4' as const;
const JPEGZIP = 'jpegzip' as const;
const PNGZIP = 'pngzip' as const;
const JPEG = 'jpeg' as const;
const PNG = 'png' as const;
type onExport = (blob: Blob, filename: string) => void;
type CAPTURE_TYPE =
	typeof GIF | typeof WEBM | typeof MP4 |
	typeof JPEGZIP | typeof PNGZIP;

// Save options for hotkey controls.
export type WEBM_OPTIONS = {
	format?: typeof WEBM,
	fps?: number,
	name?: string,
	quality?: number, // A number 0-1.
	onExportProgress?: (progress: number) => void, // Download is immediate, so this isn't very informative.  progress is a number between 0 and 1.
	onExport?: onExport,
	onExportFinish?: () => void,
	onError?: (error: any) => void,
  /**
   * Number of intermediary frames used to calculate motion blur for each frame
   */
  motionBlurFrames?: number;
};
export type MP4_OPTIONS = {
	format?: typeof MP4,
	fps?: number,
	name?: string,
	quality?: number, // A number 0-1.
	ffmpegOptions?: { [key: string]: string },
	onExportProgress?: (progress: number) => void, // FFMPEG encoding progress, progress is a number between 0 and 1.
	onExport?: onExport,
	onExportFinish?: () => void,
	onError?: (error: any) => void,
  /**
   * Number of intermediary frames used to calculate motion blur for each frame
   */
  motionBlurFrames?: number;
};
export type GIF_OPTIONS = {
	fps?: number,
	name?: string,
	quality?: number // A number 0-1.
	onExportProgress?: (progress: number) => void, // progress is a number between 0 and 1.
	onExport?: onExport,
	onExportFinish?: () => void,
	onError?: (error: any) => void,
  /**
   * Number of intermediary frames used to calculate motion blur for each frame
   */
  motionBlurFrames?: number;
};
export type PNG_OPTIONS = {
	name?: string,
	dpi?: number, // Default is screen dpi (72).
	onExportProgress?: (progress: number) => void, // Zipping progress, only used for recording PNG frames, progress is a number between 0 and 1.
	onExport?: onExport,
	onExportFinish?: () => void,
	onError?: (error: any) => void,
};
export type JPEG_OPTIONS = {
	name?: string,
	quality?: number, // A number 0-1.
	dpi?: number, // Default is screen dpi (72).
	onExportProgress?: (progress: number) => void, // Zipping progress, only used for recording JPEG frames, progress is a number between 0 and 1.
	onExport?: onExport,
	onExportFinish?: () => void,
	onError?: (error: any) => void,
};

export type ACTIVE_CAPTURE = {
	name: string,
	capturer: CCapture | JSZip,
	numFrames: number,
	type: CAPTURE_TYPE,
	zipOptions?: PNG_OPTIONS | JPEG_OPTIONS, // Only used for frame zip record.
	zipPromises?: Promise<void>[],
	ffmpegOptions?: { [key: string]: string }, // Only used for mp4 record.
	onExportProgress?: (progress: number) => void,
	onExport?: onExport,
	onExportFinish?: () => void,
	onError?: (error: any) => void,
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

const hotkeysSinceLastCheck: { key: string}[] = [];

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
	// Use public address if you don't want to host your own.
	ffmpegPath = options?.ffmpegCorePath || 'https://unpkg.com/@ffmpeg/core@0.10.0/dist/ffmpeg-core.js'
	if (options && options.verbose !== undefined) setVerbose(options.verbose);
	if (options && options.showAlerts !== undefined) PARAMS.SHOW_ALERTS = options.showAlerts;
	if (options && options.showDialogs !== undefined) PARAMS.SHOW_DIALOGS = options.showDialogs;
	if (options && options.showRecDot !== undefined) PARAMS.SHOW_REC_DOT = options.showRecDot;
	if (PARAMS.SHOW_REC_DOT) {
		initDotWithCSS(options?.recDotCSS);
	}
	canvas.addEventListener('resize', onResize);
	window.addEventListener('keydown', onKeydown);
}

function onKeydown(e: KeyboardEvent) {
	hotkeysSinceLastCheck.push({
		key: e.key,
	});
	if (!PARAMS.IS_MANUALLY_CHECKING_HOTKEYS) {
		// Apply hotkeys immediately.
		applyHotkeys();
	}
	// Otherwise wait until checkHotkeys() is called.
}

function onResize() {
	if (activeCaptures.length) {
		const warningMsg = "Don't resize while recording canvas!";
		showWarning(warningMsg);
	}
}

export function dispose(){
	canvas?.removeEventListener('resize', onResize);
	canvas = null;
	window.removeEventListener('keydown', onKeydown);
}

export function setVerbose(state: boolean) {
	PARAMS.VERBOSE = !!state;
	if (ffmpeg) ffmpeg.setLogging(PARAMS.VERBOSE);
}

function checkCanvas() {
	if (canvas === null) {
		throw new Error('No canvas supplied, please call CanvasCapture.init() and pass in canvas element.');
	}
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
export function bindKeyToVideoRecord(key: string, options?: WEBM_OPTIONS | MP4_OPTIONS) {
	if (options?.format === WEBM) {
		hotkeyOptions.webm = options as WEBM_OPTIONS;
		setHotkey(key, WEBM);
	} else {
		// Default to MP4.
		hotkeyOptions.mp4 = options as MP4_OPTIONS;
		setHotkey(key, MP4);
	}
}
export function bindKeyToGIFRecord(key: string, options?: GIF_OPTIONS) {
	hotkeyOptions.gif = options;
	setHotkey(key, GIF);
}
export function bindKeyToPNGFramesRecord(key: string, options?: PNG_OPTIONS) {
	hotkeyOptions.pngzip = options;
	setHotkey(key, PNGZIP);
}
export function bindKeyToJPEGFramesRecord(key: string, options?: JPEG_OPTIONS) {
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

function applyHotkeys() {
	for (let i = 0; i < hotkeysSinceLastCheck.length; i++) {
		const { key } = hotkeysSinceLastCheck[i];
		if (hotkeys.mp4 && key === hotkeys[MP4]) {
			const MP4s = activeCapturesOfType(MP4);
			if (MP4s.length) stopRecord(MP4s);
			else {
				if (!browserSupportsMP4()) {
					const errorMsg = `This browser does not support MP4 video recording, please try again in Chrome.`;
					const onError = hotkeyOptions[MP4]?.onError;
					if (onError) onError(new Error(errorMsg));
					showWarning(errorMsg);
				}
				beginVideoRecord(hotkeyOptions[MP4]);
			}
		}
		if (hotkeys.webm && key === hotkeys[WEBM]) {
			const WEBMs = activeCapturesOfType(WEBM);
			if (WEBMs.length) stopRecord(WEBMs);
			else {
				if (!browserSupportsWEBM()) {
					const errorMsg = `This browser does not support WEBM video recording, please try again in Chrome.`;
					const onError = hotkeyOptions[WEBM]?.onError;
					if (onError) onError(new Error(errorMsg));
					showWarning(errorMsg);
				}
				beginVideoRecord(hotkeyOptions[WEBM]);
			}
		}
		if (hotkeys.gif && key === hotkeys[GIF]) {
			const GIFs = activeCapturesOfType(GIF);
			if (GIFs.length) stopRecord(GIFs);
			else beginGIFRecord(hotkeyOptions[GIF]);
		}
		if (hotkeys.pngzip && key === hotkeys[PNGZIP]) {
			const pngzips = activeCapturesOfType(PNGZIP);
			if (pngzips.length) stopRecord(pngzips);
			else beginPNGFramesRecord(hotkeyOptions[PNGZIP]);
		}
		if (hotkeys.jpegzip && key === hotkeys[JPEGZIP]) {
			const jpgzips = activeCapturesOfType(JPEGZIP);
			if (jpgzips.length) stopRecord(jpgzips);
			else beginJPEGFramesRecord(hotkeyOptions[JPEGZIP]);
		}
		if (hotkeys.png && key === hotkeys[PNG]) {
			takePNGSnapshot(hotkeyOptions[PNG]);
		}
		if (hotkeys.jpeg && key === hotkeys[JPEG]) {
			takeJPEGSnapshot(hotkeyOptions[JPEG]);
		}
	}
	hotkeysSinceLastCheck.length = 0;
}

function startCapture(capture: ACTIVE_CAPTURE) {
	activeCaptures.push(capture);
	if (capture.type !== PNGZIP && capture.type !== JPEGZIP) (capture.capturer as CCapture).start();
	// For multi-frame records, we should also throw up an indicator to show that we're in record mode.
	showDot(isRecording());
}

export function beginVideoRecord(options?: WEBM_OPTIONS | MP4_OPTIONS) {
	try {
		const format = options?.format || MP4; // Default to MP4 record.
		if (format === MP4) {
			if (!browserSupportsMP4()) {
				const errorMsg = `This browser does not support MP4 video recording, please try again in Chrome.`;
				showWarning(errorMsg);
				throw new Error(errorMsg);
			}
		} else if (format === WEBM) {
			if (!browserSupportsWEBM()) {
				const errorMsg = `This browser does not support WEBM video recording, please try again in Chrome.`;
				showWarning(errorMsg);
				throw new Error(errorMsg);
			}
		} else {
			throw new Error(`invalid video format ${format}.`);
		}
		if (activeVideoGifCaptures().length) {
			const errorMsg = `CCapture.js only supports one video/gif capture at a time.`;
			showWarning(errorMsg);
			throw new Error(errorMsg);
		}
		
		let quality = 1;
		if (options && options.quality) {
			quality = options.quality;
		}
		const name = options?.name || 'Video_Capture';
		// Create a capturer that exports a WebM video.
		// @ts-ignore
		const capturer = new (window.CCapture as CCapture)({
			format: WEBM,
			name,
			framerate: options?.fps || 60,
			quality: quality * 100, // CCapture seems to expect a quality between 0 and 100.
			verbose: PARAMS.VERBOSE,
			motionBlurFrames: options?.motionBlurFrames,
		});
		const capture = {
			name,
			capturer,
			numFrames: 0,
			type: format,
			ffmpegOptions: (options as MP4_OPTIONS)?.ffmpegOptions,
			onExportProgress: options?.onExportProgress,
			onExport: options?.onExport,
			onExportFinish: options?.onExportFinish,
			onError: options?.onError,
		};
		startCapture(capture);
		return capture;
	} catch (error) {
		if (options?.onError) options.onError(error);
		else throw error;
	}
}

export function beginGIFRecord(options?: GIF_OPTIONS) {
	try {
		if (activeVideoGifCaptures().length) {
			const errorMsg = `CCapture.js only supports one video/gif capture at a time.`;
			showWarning(errorMsg);
			throw new Error(errorMsg);
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
			format: GIF,
			name,
			framerate: options?.fps || 60,
			workersPath: gifWorkersPath,
			quality,
			verbose: PARAMS.VERBOSE,
			onProgress: options?.onExportProgress,
			motionBlurFrames: options?.motionBlurFrames,
		});
		const capture = {
			name,
			capturer,
			numFrames: 0,
			type: GIF as CAPTURE_TYPE,
			onExport: options?.onExport,
			onExportFinish: options?.onExportFinish,
			onError: options?.onError,
		};
		startCapture(capture);
		return capture;
	} catch (error) {
		if (options?.onError) options.onError(error);
		else throw error;
	}
}

export function beginPNGFramesRecord(options?: PNG_OPTIONS) {
	try {
		const name = options?.name || 'PNG_Frames_Capture';
		const zipOptions = { dpi: options?.dpi };
		const capture = {
			name,
			zipOptions,
			zipPromises: [],
			capturer: new JSZip(),
			numFrames: 0,
			type: PNGZIP as CAPTURE_TYPE,
			onExportProgress: options?.onExportProgress,
			onExport: options?.onExport,
			onExportFinish: options?.onExportFinish,
			onError: options?.onError,
		};
		startCapture(capture);
		return capture;
	} catch (error) {
		if (options?.onError) options.onError(error);
		else throw error;
	}
}

export function beginJPEGFramesRecord(options?: JPEG_OPTIONS) {
	try {
		const name = options?.name || 'JPEG_Frames_Capture';
		const zipOptions = { dpi: options?.dpi, quality: options?.quality };
		const capture = {
			name,
			zipOptions,
			zipPromises: [],
			capturer: new JSZip(),
			numFrames: 0,
			type: JPEGZIP as CAPTURE_TYPE,
			onExportProgress: options?.onExportProgress,
			onExport: options?.onExport,
			onExportFinish: options?.onExportFinish,
			onError: options?.onError,
		};
		startCapture(capture);
		return capture;
	} catch (error) {
		if (options?.onError) options.onError(error);
		else throw error;
	}
}

async function canvasToBlobAsync(canvas: HTMLCanvasElement, type: typeof PNG | typeof JPEG, quality?: number) {
	return new Promise((resolve: (blob: Blob | null) => void) => {
		canvas.toBlob((blob: Blob | null) => {
			resolve(blob);
		}, `image/${type}`, quality);
	});
}

async function takeImageSnapshot(filename: string, type: typeof PNG | typeof JPEG, quality?: number, options?: JPEG_OPTIONS | PNG_OPTIONS) {
	checkCanvas();
	const onExportFinish = options?.onExportFinish;
	const blob = await canvasToBlobAsync(canvas!, type, quality);
	if (!blob) {
		const errorMsg = `Problem saving ${type.toUpperCase()}, please try again!`;
		showWarning(errorMsg);
		throw new Error(errorMsg);
	}
	const onExport = options?.onExport || saveAs;
	if (options?.dpi) {
		await changeDpiBlob(blob, options?.dpi).then((blob: Blob) => {
			onExport(blob, filename);
			if (onExportFinish) onExportFinish();
		});
	} else {
		onExport(blob, filename);
		if (onExportFinish) onExportFinish();
	}
}

export async function takePNGSnapshot(options?: PNG_OPTIONS) {
	try {
		const name = options?.name || 'PNG_Capture';
		const filename = `${name}.png`;
		await takeImageSnapshot(filename, PNG, undefined, options);
	} catch (error) {
		if (options?.onError) options.onError(error);
		else throw error;
	}
}

export async function takeJPEGSnapshot(options?: JPEG_OPTIONS) {
	try {
		const name = options?.name || 'JPEG_Capture';
		const filename = `${name}.jpg`;
		// Quality is a number between 0 and 1 https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob
		await takeImageSnapshot(filename, JPEG, options?.quality || 1, options);
	} catch (error) {
		if (options?.onError) options.onError(error);
		else throw error;
	}
}

export function recordFrame(capture?: ACTIVE_CAPTURE | ACTIVE_CAPTURE[]) {
	let captures = activeCaptures;
	if (capture) {
		if (!Array.isArray(capture)) {
			captures = [capture];
		} else {
			captures = capture;
		}
	}
	try {
		checkCanvas();
		if (captures.length === 0) {
			const errorMsg = 'No valid capturer inited, please call CanvasCapture.beginVideoRecord(), CanvasCapture.beginGIFRecord(), CanvasCapture.beginPNGFramesRecord(), or CanvasCapture.beginJPEGFramesRecord() first.';
			showWarning(errorMsg);
			throw new Error(errorMsg);
		}
		for (let i = 0; i < captures.length; i++) {
			const { capturer, type, zipOptions, zipPromises, numFrames } = captures[i];
			if (type === JPEGZIP || type === PNGZIP) {
				// Name should correspond to current frame.
				const frameName = `frame_${numFrames + 1}`;
				const promise = new Promise<void>((resolve, reject) => {
					const options = {
						dpi: zipOptions?.dpi,
						quality: (zipOptions as JPEG_OPTIONS).quality,
						name: frameName,
						onExport: (blob: Blob, filename: string) => {
							(capturer as JSZip).file(filename, blob);
						},
						onExportFinish: resolve,
						onError: reject,
					};
					if (type === JPEGZIP) {
						takeJPEGSnapshot(options);
					} else {
						takePNGSnapshot(options);
					}
				});
				zipPromises!.push(promise);
			} else {
				(capturer as CCapture).capture(canvas!);
			}
			captures[i].numFrames = numFrames + 1
		}
	} catch (error) {
		let handled = true;
		for (let i = 0; i < captures.length; i++) {
			const capture = captures[i];
			if (capture.onError) capture.onError(error);
			else handled = false;
		}
		if (!captures.length || !handled) {
			throw error;
		}
	}
}

async function CCaptureSaveAsync(capturer: CCapture) {
	return new Promise((resolve: (blob: Blob) => void) => {
		capturer.save((blob: Blob) => {
			resolve(blob);
		});
	});
}

async function stopRecordAtIndex(index: number) {
	const {
		name,
		capturer,
		numFrames,
		type,
		zipPromises,
		onExportProgress,
		onExport,
		onExportFinish,
		onError,
		ffmpegOptions,
	} = activeCaptures[index];
	// Remove ref to capturer.
	activeCaptures.splice(index, 1);

	if (type !== PNGZIP && type !== JPEGZIP) (capturer as CCapture).stop();

	if (numFrames === 0) {
		const errorMsg = 'No frames recorded, call CanvasCapture.recordFrame().';
		showWarning(errorMsg);
		throw new Error(errorMsg);
	}

	switch (type) {
		case MP4:
			{
				const blob = await CCaptureSaveAsync(capturer as CCapture);
				// Tell the user that mp4s take a sec to process.
				showDialog(
					'Processing...',
					'MP4 is processing and may take a minute to save.  You can close this dialog in the meantime.',
					{ autoCloseDelay: 7000 },
				);
				await convertWEBMtoMP4({
					name,
					blob,
					onExportProgress: onExportProgress,
					onExport: onExport,
					onExportFinish: onExportFinish,
					ffmpegOptions,
				});
				break;
			}
		case WEBM:
			{
				if (onExportProgress) onExportProgress(0);
				const blob = await CCaptureSaveAsync(capturer as CCapture);
				if (onExportProgress) onExportProgress(1);// Save is nearly immediate.
				const filename = `${name}.webm`;
				if (onExport) {
					onExport(blob, filename);
				} else {
					saveAs(blob, filename);
				}
				if (onExportFinish) onExportFinish();
				break;
			}
		case GIF:
			{
				// Tell the user that gifs take a sec to process.
				showDialog(
					'Processing...',
					'GIF is processing and may take a minute to save.  You can close this dialog in the meantime.',
					{ autoCloseDelay: 7000 },
				);
				// onExportProgress callback already passed to CCapture.
				const blob = await CCaptureSaveAsync(capturer as CCapture);
				const filename = `${name}.gif`;
				if (onExport) {
					onExport(blob, filename);
				} else {
					saveAs(blob, filename);
				}
				if (onExportFinish) onExportFinish();
				break;
			}
		case PNGZIP:
		case JPEGZIP:
			{
				// Wait for all frames to finish saving.
				await Promise.all(zipPromises!);
				// Tell the user that frames take a sec to zip.
				showDialog(
					'Processing...',
					'Frames are being zipped and may take a minute to save.  You can close this dialog in the meantime.',
					{ autoCloseDelay: 7000 },
				);
				await (capturer as JSZip).generateAsync({ type: 'blob' }, (metadata: { percent: number }) => {
					if (onExportProgress) onExportProgress(metadata.percent / 100);
				}).then((blob: Blob) => {
					const filename = `${name}.zip`;
					if (onExport) {
						onExport(blob, filename);
					} else {
						saveAs(blob, filename);
					}
					if (onExportFinish) onExportFinish();
				});
				break;
			}
		default:
			throw new Error(`Need to handle saving type ${type}.`);
	}
}

export async function stopRecord(capture?: ACTIVE_CAPTURE | ACTIVE_CAPTURE[]) {
	if (capture && !Array.isArray(capture)) {
		capture = [capture];
	}
	const captures = capture || activeCaptures;
	try {
		if (activeCaptures.length === 0) {
			const errorMsg = 'No valid capturer inited, please call CanvasCapture.beginVideoRecord(), CanvasCapture.beginGIFRecord(), CanvasCapture.beginPNGFramesRecord(), or CanvasCapture.beginJPEGFramesRecord() first.';
			showWarning(errorMsg);
			throw new Error(errorMsg);
		}

		const promises: Promise<void>[] = [];
		for (let i = 0; i < captures.length; i++) {
			const index = activeCaptures.indexOf(captures[i]);
			if (index < 0) throw new Error(`Invalid capture ${captures[i]} – may have already been stopped.`);
			promises.push(stopRecordAtIndex(index));
		}
		showDot(isRecording());
		await Promise.all(promises);
	} catch (error) {
		let handled = true;
		for (let i = 0; i < captures.length; i++) {
			const capture = captures[i];
			if (capture.onError) capture.onError(error);
			else handled = false;
		}
		if (!captures.length || !handled) {
			throw error;
		}
	}
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

export function checkHotkeys() {
	PARAMS.IS_MANUALLY_CHECKING_HOTKEYS = true;
	applyHotkeys();
}

let ffmpegLoaded = false;
async function convertWEBMtoMP4(options: {
	name: string,
	blob: Blob,
	onExportProgress?: (progress: number) => void,
	onExport?: onExport,
	onExportFinish?: () => void,
	ffmpegOptions?: { [key: string]: string },
}) {
	if (!ffmpeg) {
		const createFFmpeg = require('@ffmpeg/ffmpeg/src/createFFmpeg');
		ffmpeg = createFFmpeg({
			corePath: ffmpegPath,
		});
	}
	if (!ffmpegLoaded) {
		await ffmpeg!.load().catch(() => {
			const errorMsg = 'MP4 export not supported in this browser, try again in the latest version of Chrome.';
			showWarning(errorMsg);
			throw new Error(errorMsg);
		});
		ffmpegLoaded = true;
	}
	const { name, blob, onExportProgress, onExport, onExportFinish, ffmpegOptions } = options;
	// Convert blob to Uint8 array.
	const _data = await blob.arrayBuffer();
	const data = new Uint8Array(_data);
	// Write data to MEMFS, need to use Uint8Array for binary data.
	ffmpeg!.FS('writeFile', `${name}.webm`, data);
	// Convert to MP4.
	// TODO: onProgress callback is not working quite right yet.
	// https://github.com/ffmpegwasm/ffmpeg.wasm/issues/112
	if (onExportProgress) ffmpeg!.setProgress((progress: { ratio: number }) => {
		onExportProgress(Math.max(0, Math.min(progress.ratio, 1)));
	});
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
	const filename = `${name}.mp4`;
	await ffmpeg!.run(
		'-i', `${name}.webm`,
		..._ffmpegOptions,
		'-vf', 'crop=trunc(iw/2)*2:trunc(ih/2)*2',
		'-an',
		filename,
	);
	const output = await ffmpeg!.FS('readFile', filename);
	const outputBlob = new Blob([output], { type: 'video/mp4' });
	if (onExport) {
		onExport(outputBlob, filename);
	} else {
		saveAs(outputBlob, filename);
	}
	// Delete files in MEMFS.
	ffmpeg!.FS('unlink', `${name}.webm`);
	ffmpeg!.FS('unlink', filename);
	if (onExportFinish) onExportFinish();
}

function browserSupportsWEBP() {
	const _canvas = document.createElement('canvas');
	const url = _canvas!.toDataURL('image/webp', { quality: 1 });
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
