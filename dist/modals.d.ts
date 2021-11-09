export declare const PARAMS: {
    SHOW_ALERTS: boolean;
    SHOW_DIALOGS: boolean;
    SHOW_REC_DOT: boolean;
};
export declare function showAlert(message: string): void;
export declare function showDialog(title: string, message: string, options?: {
    autoCloseDelay?: number;
}): void;
export declare function initDotWithCSS(css?: {
    [key: string]: string;
}): void;
export declare function showDot(visible: boolean): void;
