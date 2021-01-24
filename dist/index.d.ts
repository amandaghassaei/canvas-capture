export declare function beginVideoRecord(options: {
    fps?: number;
    name?: string;
    quality?: string;
}): void;
export declare function beginGifRecord(options: {
    fps?: number;
    name?: string;
}): void;
export declare function takePNGSnapshot(canvas: HTMLCanvasElement, options: {
    name?: string;
}): void;
export declare function recordFrame(canvas: HTMLCanvasElement): void;
export declare function stopRecord(): void;
