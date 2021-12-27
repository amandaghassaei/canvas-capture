export { showDialog } from './modals';
export declare function init(_canvas: HTMLCanvasElement, options?: {
    verbose?: boolean;
    showAlerts?: boolean;
    showDialogs?: boolean;
    showRecDot?: boolean;
    recDotCSS?: {
        [key: string]: string;
    };
}): void;
export declare function setVerbose(state: boolean): void;
declare type WEBM_OPTIONS = {
    format?: 'webm';
    fps?: number;
    name?: string;
    quality?: number;
};
declare type MP4_OPTIONS = {
    format?: 'mp4';
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
export declare function bindKeyToVideoRecord(key: string, options: WEBM_OPTIONS | MP4_OPTIONS): void;
export declare function bindKeyToGIFRecord(key: string, options?: GIF_OPTIONS): void;
export declare function bindKeyToPNGSnapshot(key: string, options?: PNG_OPTIONS): void;
export declare function bindKeyToJPEGSnapshot(key: string, options?: JPEG_OPTIONS): void;
export declare function beginVideoRecord(options: WEBM_OPTIONS | MP4_OPTIONS): any;
export declare function beginGIFRecord(options?: GIF_OPTIONS): any;
export declare function takePNGSnapshot(options?: PNG_OPTIONS): void;
export declare function takeJPEGSnapshot(options?: JPEG_OPTIONS): void;
export declare function recordFrame(): void;
export declare function stopRecord(): void;
export declare function isRecording(): boolean;
export declare function browserSupportsWEBM(): boolean;
export declare function browserSupportsMP4(): boolean;
export declare function browserSupportsGIF(): boolean;
