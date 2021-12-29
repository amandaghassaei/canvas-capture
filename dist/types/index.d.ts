import CCapture from 'ccapture.js';
import JSZip = require('jszip');
export { showDialog } from './modals';
declare const GIF = "gif";
declare const WEBM = "webm";
declare const MP4 = "mp4";
declare const JPEGZIP = "jpegzip";
declare const PNGZIP = "pngzip";
declare type CAPTURE_TYPE = typeof GIF | typeof WEBM | typeof MP4 | typeof JPEGZIP | typeof PNGZIP;
declare type WEBM_OPTIONS = {
    format?: typeof WEBM;
    fps?: number;
    name?: string;
    quality?: number;
};
declare type MP4_OPTIONS = {
    format?: typeof MP4;
    fps?: number;
    name?: string;
    quality?: number;
    ffmpegOptions?: {
        [key: string]: string;
    };
};
declare type GIF_OPTIONS = {
    fps?: number;
    name?: string;
    quality?: number;
};
declare type PNG_OPTIONS = {
    name?: string;
    dpi?: number;
};
declare type JPEG_OPTIONS = {
    name?: string;
    quality?: number;
    dpi?: number;
};
export declare type ACTIVE_CAPTURE = {
    name: string;
    capturer: CCapture | JSZip;
    numFrames: number;
    type: CAPTURE_TYPE;
    zipOptions?: PNG_OPTIONS | JPEG_OPTIONS;
    onFFMPEGProgress?: (progress: number) => void;
    ffmpegOptions?: {
        [key: string]: string;
    };
};
export declare function init(_canvas: HTMLCanvasElement, options?: {
    ffmpegCorePath?: string;
    verbose?: boolean;
    showAlerts?: boolean;
    showDialogs?: boolean;
    showRecDot?: boolean;
    recDotCSS?: {
        [key: string]: string;
    };
}): void;
export declare function setVerbose(state: boolean): void;
export declare function bindKeyToVideoRecord(key: string, options: WEBM_OPTIONS | MP4_OPTIONS): void;
export declare function bindKeyToGIFRecord(key: string, options?: GIF_OPTIONS): void;
export declare function bindKeyToPNGFrames(key: string, options?: PNG_OPTIONS): void;
export declare function bindKeyToJPEGFrames(key: string, options?: JPEG_OPTIONS): void;
export declare function bindKeyToPNGSnapshot(key: string, options?: PNG_OPTIONS): void;
export declare function bindKeyToJPEGSnapshot(key: string, options?: JPEG_OPTIONS): void;
export declare function beginVideoRecord(options: WEBM_OPTIONS | MP4_OPTIONS): {
    name: string;
    capturer: any;
    numFrames: number;
    type: "webm" | "mp4";
    ffmpegOptions: {
        [key: string]: string;
    } | undefined;
} | undefined;
export declare function beginGIFRecord(options?: GIF_OPTIONS): {
    name: string;
    capturer: any;
    numFrames: number;
    type: CAPTURE_TYPE;
} | undefined;
export declare function beginPNGFramesRecord(options?: PNG_OPTIONS): {
    name: string;
    zipOptions: PNG_OPTIONS | undefined;
    capturer: JSZip;
    numFrames: number;
    type: CAPTURE_TYPE;
};
export declare function beginJPEGFramesRecord(options?: JPEG_OPTIONS): {
    name: string;
    zipOptions: JPEG_OPTIONS | undefined;
    capturer: JSZip;
    numFrames: number;
    type: CAPTURE_TYPE;
};
export declare function takePNGSnapshot(options?: PNG_OPTIONS, callback?: (blob: Blob, filename: string) => void): void;
export declare function takeJPEGSnapshot(options?: JPEG_OPTIONS, callback?: (blob: Blob, filename: string) => void): void;
export declare function recordFrame(capture?: ACTIVE_CAPTURE | ACTIVE_CAPTURE[]): void;
export declare function stopRecord(capture?: ACTIVE_CAPTURE | ACTIVE_CAPTURE[]): void;
export declare function isRecording(): boolean;
export declare function browserSupportsWEBM(): boolean;
export declare function browserSupportsMP4(): boolean;
export declare function browserSupportsGIF(): boolean;
