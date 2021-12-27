import * as CanvasCapture from '../../';

// Initialize and pass in canvas.
const canvas = document.getElementById('my-canvas') as HTMLCanvasElement
CanvasCapture.init(canvas, {
	showAlerts: true,
	showDialogs: true,
});

// Bind key presses to begin/end recordings.
const WEBM_OPTIONS = {
	name: 'demo-webm',
	quality: 1,
	fps: 60,
};
CanvasCapture.bindKeyToVideoRecord('v', WEBM_OPTIONS);
const GIF_OPTIONS = {
	name: 'demo-gif',
	quality: 1,
	fps: 60,
};
CanvasCapture.bindKeyToGIFRecord('g', GIF_OPTIONS);
// These take a single snapshot.
const PNG_OPTONS = {
	name: 'demo-png',
	dpi: 72,
};
CanvasCapture.bindKeyToPNGSnapshot('p', PNG_OPTONS);
const JPEG_OPTIONS = {
	name: 'demo-jpg',
	quality: 1,
	dpi: 72,
};
CanvasCapture.bindKeyToJPEGSnapshot('j', JPEG_OPTIONS);

// Simple canvas draw setup.
const context = canvas.getContext("2d")!;
let angle = 0;

const image = document.createElement("img");
image.src = 'monalisa.png';

function loop() {
	requestAnimationFrame(loop);

	// Wait until is loaded.
	if (image.width) {
		// Draw black background
		context.beginPath();
		context.fillStyle = 'black';
		context.fillRect(0, 0, canvas.width, canvas.height);
		// Renter rotated image.
		context.save();
		context.translate(canvas.width / 2, canvas.height / 2);
		context.rotate(angle);
		context.drawImage(image, -image.width / 2, -image.height / 2);
		context.restore();
		// Increase rotation.
		angle += 0.05;
	}

	// You need to do this only if you are recording a video or gif.
	if (CanvasCapture.isRecording()) CanvasCapture.recordFrame();
}

// Start animation loop.
loop();

// Wire up ui.
document.getElementById("savePNG")!.addEventListener('click', (e) => {
	e.preventDefault();
	CanvasCapture.takePNGSnapshot(PNG_OPTONS);
});
document.getElementById("saveJPG")!.addEventListener('click', (e) => {
	e.preventDefault();
	CanvasCapture.takeJPEGSnapshot(JPEG_OPTIONS);
});
const startRecordWEBM = document.getElementById('startWEBM')!;
startRecordWEBM.addEventListener('click', (e) => {
	e.preventDefault();
	CanvasCapture.beginVideoRecord(WEBM_OPTIONS);
	startRecordWEBM.style.display = 'none';
	stopRecordWEBM.style.display = 'block';
});
const stopRecordWEBM = document.getElementById('stopWEBM')!;
stopRecordWEBM.addEventListener('click', (e) => {
	e.preventDefault();
	CanvasCapture.stopRecord();
	stopRecordWEBM.style.display = 'none';
	startRecordWEBM.style.display = 'block';
});
stopRecordWEBM.style.display = 'none';
const startRecordGIF = document.getElementById('startGIF')!;
startRecordGIF.addEventListener('click', (e) => {
	e.preventDefault();
	CanvasCapture.beginGIFRecord(GIF_OPTIONS);
	startRecordGIF.style.display = 'none';
	stopRecordGIF.style.display = 'block';
});
const stopRecordGIF = document.getElementById('stopGIF')!;
stopRecordGIF.addEventListener('click', (e) => {
	e.preventDefault();
	CanvasCapture.stopRecord();
	stopRecordGIF.style.display = 'none';
	startRecordGIF.style.display = 'block';
});
stopRecordGIF.style.display = 'none';