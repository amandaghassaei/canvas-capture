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
