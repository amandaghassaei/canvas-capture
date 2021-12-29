import MicroModal from 'micromodal';
import { css } from './micromodal.css';
import { PARAMS } from './params';

// Add modal styling.
const style = document.createElement('style');
style.textContent = css;
document.head.append(style);

function initModalHTML(modalID: string, title: string, content: string = '') {
	const modalString =
	`<div class="modal micromodal-slide" id="modal-${modalID}" aria-hidden="true">
		<div class="modal__overlay" tabindex="-1" data-micromodal-close>
		<div class="modal__container" role="dialog" aria-modal="true" aria-labelledby="modal-${modalID}-title">
			<header class="modal__header">
				<h2 class="modal__title" id="modal-${modalID}-title">
					${title}
				</h2>
				<button class="modal__close" aria-label="Close modal" data-micromodal-close></button>
			</header>
			<main class="modal__content">
				<p id="modal-${modalID}-content">
					${content}
				</p>
			</main>
		</div>
		</div>
	</div>`;
	// This is a trick to create an element from string.
	const temp = document.createElement('div');
	temp.innerHTML = modalString;
	return temp.firstChild as Node;
};

let alertModalInited = false;
let dialogModalInited = false;

const ALERT_MODAL_ID = 'alert';
const alertModal = initModalHTML(ALERT_MODAL_ID, 'Warning');

const DIALOG_MODAL_ID = 'dialog';
const dialogModal = initModalHTML(DIALOG_MODAL_ID, 'Saving...');

export function showAlert(message: string) {
	console.warn(message);
	if (!PARAMS.SHOW_ALERTS) {
		return;
	}
	if (!alertModalInited) {
		alertModalInited = true;
		document.getElementsByTagName('body')[0].appendChild(alertModal);
	}
	(document.getElementById(`modal-${ALERT_MODAL_ID}-content`) as HTMLElement).innerHTML = message;
	MicroModal.show(`modal-${ALERT_MODAL_ID}`);
}

export function showDialog(title: string, message: string, options?: {
	autoCloseDelay?: number,
}) {
	if (PARAMS.VERBOSE) console.log(title, message);
	if (!PARAMS.SHOW_DIALOGS) {
		return;
	}
	if (!dialogModalInited) {
		dialogModalInited = true;
		document.getElementsByTagName('body')[0].appendChild(dialogModal);
	}
	(document.getElementById(`modal-${DIALOG_MODAL_ID}-title`) as HTMLElement).innerHTML = title;
	(document.getElementById(`modal-${DIALOG_MODAL_ID}-content`) as HTMLElement).innerHTML = message;
	MicroModal.show(`modal-${DIALOG_MODAL_ID}`);
	const autoCloseDelay = options?.autoCloseDelay !== undefined ? options.autoCloseDelay : -1;
	if (autoCloseDelay > 0) {
		setTimeout(() => {
			MicroModal.close(`modal-${DIALOG_MODAL_ID}`);
		}, autoCloseDelay);
	}
}

// Create record red dot vis to overlay when recording is happening.
const dot = document.createElement('div');
export function initDotWithCSS(css?: {[key: string]: string}){
	dot.id = 'recordingDot';
	const dotCSS = {
		background: "red",
		width: "20px",
		height: "20px",
		"border-radius": "50%",
		display: "none",
		position: "absolute",
		top: "0",
		right: "0",
		"z-index": "10",
		margin: "20px",
		...css,
	};
	Object.assign(dot.style, dotCSS);
	document.getElementsByTagName('body')[0].appendChild(dot);
}

export function showDot(visible: boolean) {
	if (!PARAMS.SHOW_REC_DOT) return;
	if (visible) {
		dot.style.display = "inline-block";
	} else {
		dot.style.display = "none";
	}
}