import CCapture from './CCapture.js/CCapture';
import 'mdn-polyfills/HTMLCanvasElement.prototype.toBlob';
import JSZip = require('jszip');
export { showDialog } from './modals';
declare const GIF: "gif";
export declare const WEBM: "webm";
export declare const MP4: "mp4";
declare const JPEGZIP: "jpegzip";
declare const PNGZIP: "pngzip";
declare type onExport = (blob: Blob, filename: string) => void;
declare type CAPTURE_TYPE = typeof GIF | typeof WEBM | typeof MP4 | typeof JPEGZIP | typeof PNGZIP;
export declare type WEBM_OPTIONS = {
    format?: typeof WEBM;
    fps?: number;
    name?: string;
    quality?: number;
    onExportProgress?: (progress: number) => void;
    onExport?: onExport;
    onExportFinish?: () => void;
    onError?: (error: any) => void;
};
export declare type MP4_OPTIONS = {
    format?: typeof MP4;
    fps?: number;
    name?: string;
    quality?: number;
    ffmpegOptions?: {
        [key: string]: string;
    };
    onExportProgress?: (progress: number) => void;
    onExport?: onExport;
    onExportFinish?: () => void;
    onError?: (error: any) => void;
};
export declare type GIF_OPTIONS = {
    fps?: number;
    name?: string;
    quality?: number;
    onExportProgress?: (progress: number) => void;
    onExport?: onExport;
    onExportFinish?: () => void;
    onError?: (error: any) => void;
};
export declare type PNG_OPTIONS = {
    name?: string;
    dpi?: number;
    onExportProgress?: (progress: number) => void;
    onExport?: onExport;
    onExportFinish?: () => void;
    onError?: (error: any) => void;
};
export declare type JPEG_OPTIONS = {
    name?: string;
    quality?: number;
    dpi?: number;
    onExportProgress?: (progress: number) => void;
    onExport?: onExport;
    onExportFinish?: () => void;
    onError?: (error: any) => void;
};
export declare type ACTIVE_CAPTURE = {
    name: string;
    capturer: CCapture | JSZip;
    numFrames: number;
    type: CAPTURE_TYPE;
    zipOptions?: PNG_OPTIONS | JPEG_OPTIONS;
    zipPromises?: Promise<void>[];
    ffmpegOptions?: {
        [key: string]: string;
    };
    onExportProgress?: (progress: number) => void;
    onExport?: onExport;
    onExportFinish?: () => void;
    onError?: (error: any) => void;
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
export declare function bindKeyToVideoRecord(key: string, options?: WEBM_OPTIONS | MP4_OPTIONS): void;
export declare function bindKeyToGIFRecord(key: string, options?: GIF_OPTIONS): void;
export declare function bindKeyToPNGFramesRecord(key: string, options?: PNG_OPTIONS): void;
export declare function bindKeyToJPEGFramesRecord(key: string, options?: JPEG_OPTIONS): void;
export declare function bindKeyToPNGSnapshot(key: string, options?: PNG_OPTIONS): void;
export declare function bindKeyToJPEGSnapshot(key: string, options?: JPEG_OPTIONS): void;
export declare function beginVideoRecord(options?: WEBM_OPTIONS | MP4_OPTIONS): {
    name: string;
    capturer: any;
    numFrames: number;
    type: "webm" | "mp4";
    ffmpegOptions: {
        [key: string]: string;
    } | undefined;
    onExportProgress: ((progress: number) => void) | ((progress: number) => void) | undefined;
    onExport: onExport | undefined;
    onExportFinish: (() => void) | (() => void) | undefined;
    onError: ((error: any) => void) | ((error: any) => void) | undefined;
} | undefined;
export declare function beginGIFRecord(options?: GIF_OPTIONS): {
    name: string;
    capturer: any;
    numFrames: number;
    type: CAPTURE_TYPE;
    onExport: onExport | undefined;
    onExportFinish: (() => void) | undefined;
    onError: ((error: any) => void) | undefined;
} | undefined;
export declare function beginPNGFramesRecord(options?: PNG_OPTIONS): {
    name: string;
    zipOptions: {
        dpi: number | undefined;
    };
    zipPromises: never[];
    capturer: JSZip;
    numFrames: number;
    type: CAPTURE_TYPE;
    onExportProgress: ((progress: number) => void) | undefined;
    onExport: onExport | undefined;
    onExportFinish: (() => void) | undefined;
    onError: ((error: any) => void) | undefined;
} | undefined;
export declare function beginJPEGFramesRecord(options?: JPEG_OPTIONS): {
    name: string;
    zipOptions: {
        dpi: number | undefined;
        quality: number | undefined;
    };
    zipPromises: never[];
    capturer: JSZip;
    numFrames: number;
    type: CAPTURE_TYPE;
    onExportProgress: ((progress: number) => void) | undefined;
    onExport: onExport | undefined;
    onExportFinish: (() => void) | undefined;
    onError: ((error: any) => void) | undefined;
} | undefined;
export declare function takePNGSnapshot(options?: PNG_OPTIONS): Promise<void>;
export declare function takeJPEGSnapshot(options?: JPEG_OPTIONS): Promise<void>;
export declare function recordFrame(capture?: ACTIVE_CAPTURE | ACTIVE_CAPTURE[]): void;
export declare function stopRecord(capture?: ACTIVE_CAPTURE | ACTIVE_CAPTURE[]): Promise<void>;
export declare function isRecording(): boolean;
export declare function browserSupportsWEBM(): boolean;
export declare function browserSupportsMP4(): boolean;
export declare function browserSupportsGIF(): boolean;
