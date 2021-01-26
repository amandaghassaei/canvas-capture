import 'webm-writer';
import '@/../node_modules/ccapture.js/src/download.js';
import '@/../node_modules/ccapture.js/src/gif.js';
import '@/../node_modules/ccapture.js/src/gif.worker.js';
import '@/../node_modules/ccapture.js/src/tar.js';
import '@/../node_modules/ccapture.js/src/Whammy.js';
export declare function init(_canvas: HTMLCanvasElement): void;
export declare function setVerbose(state: boolean): void;
export declare function bindKeyToVideoRecord(key: string): void;
export declare function bindKeyToGIFRecord(key: string): void;
export declare function bindKeyToPNGSnapshot(key: string): void;
export declare function beginVideoRecord(options?: {
    fps?: number;
    name?: string;
    quality?: string;
}): void;
export declare function beginGIFRecord(options?: {
    fps?: number;
    name?: string;
}): void;
export declare function takePNGSnapshot(options?: {
    name?: string;
}): void;
export declare function recordFrame(): void;
export declare function stopRecord(): void;
export declare function isRecording(): boolean;
