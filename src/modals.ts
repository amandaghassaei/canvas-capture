import MicroModal from 'micromodal';
import { css } from './micromodal.css';

// Params.
export const PARAMS = {
	SHOW_ALERTS: true,
	SHOW_DIALOGS: true,
	SHOW_REC_DOT: true,
};

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

const ALERT_MODAL_ID = 'alert';
const alertModal = initModalHTML(ALERT_MODAL_ID, 'Warning');
document.getElementsByTagName('body')[0].appendChild(alertModal);

const DIALOG_MODAL_ID = 'dialog';
const dialogModal = initModalHTML(DIALOG_MODAL_ID, 'Saving...');
document.getElementsByTagName('body')[0].appendChild(dialogModal);

export function showAlert(message: string) {
	if (!PARAMS.SHOW_ALERTS) {
		console.warn(message);
		return;
	}
	(document.getElementById(`modal-${ALERT_MODAL_ID}-content`) as HTMLElement).innerHTML = message;
	MicroModal.show(`modal-${ALERT_MODAL_ID}`);
}

export function showDialog(title: string, message: string) {
	(document.getElementById(`modal-${DIALOG_MODAL_ID}-title`) as HTMLElement).innerHTML = title;
	(document.getElementById(`modal-${DIALOG_MODAL_ID}-content`) as HTMLElement).innerHTML = message;
	MicroModal.show(`modal-${DIALOG_MODAL_ID}`);
	setTimeout(() => {
		MicroModal.close(`modal-${DIALOG_MODAL_ID}`);
	}, 7000);
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