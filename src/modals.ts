import MicroModal from 'micromodal';

function initModalHTML(modalID: string, title: string, content: string = '') {
	const modalString = `<div id="modal-${modalID}" aria-hidden="true">
		<div tabindex="-1" data-micromodal-close>
			<div role="dialog" aria-modal="true" aria-labelledby="modal-${modalID}-title" >
			<header>
				<h2 id="modal-${modalID}-title">
				${title}
				</h2>
				<button aria-label="Close modal" data-micromodal-close></button>
			</header>
			<div id="modal-${modalID}-content">
				${content}
			</div>
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


export function showAlert(message: string) {
	(document.getElementById(`modal-${ALERT_MODAL_ID}-content`) as HTMLDivElement).innerHTML = message;
	MicroModal.show(`modal-${ALERT_MODAL_ID}`);
}

export function showRecordOptionsModal() {

}

// Create record red dot vis to overlay when recording is happening.
const dot = document.createElement('div');
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
};
Object.assign(dot.style, dotCSS);
document.getElementsByTagName('body')[0].appendChild(dot);

export function showDot(visible: boolean) {
	if (visible) {
		dot.style.display = "inline-block";
	} else {
		dot.style.display = "none";
	}
}