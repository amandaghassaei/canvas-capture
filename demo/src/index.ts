import * as CanvasCapture from '../../';

// Initialize and pass in canvas.
const canvas = document.getElementById('my-canvas') as HTMLCanvasElement
CanvasCapture.init(canvas, {
	showRecDot: true,
	showAlerts: true,
	showDialogs: true,
	verbose: false,
});

// Bind key presses to begin/end recordings.
const MP4_OPTIONS = {
	name: 'demo-mp4',
	format: CanvasCapture.MP4,
	quality: 1,
	fps: 60,
	onMP4ConversionProgress: ({ ratio }: { ratio: number }) => console.log(ratio),
	onExportProgress: (progress: number) => console.log(`MP4 export progress: ${progress}.`),
	onExportFinish: () => console.log(`Finished MP4 export.`),
};
CanvasCapture.bindKeyToVideoRecord('v', MP4_OPTIONS);
const WEBM_OPTIONS = {
	name: 'demo-webm',
	format: CanvasCapture.WEBM,
	quality: 1,
	fps: 60,
	onExportProgress: (progress: number) => console.log(`WEBM export progress: ${progress}.`),
	onExportFinish: () => console.log(`Finished WEBM export.`),
};
CanvasCapture.bindKeyToVideoRecord('w', WEBM_OPTIONS);
const GIF_OPTIONS = {
	name: 'demo-gif',
	quality: 1,
	fps: 60,
	onExportProgress: (progress: number) => console.log(`GIF export progress: ${progress}.`),
	onExportFinish: () => console.log(`Finished GIF export.`),
};
CanvasCapture.bindKeyToGIFRecord('g', GIF_OPTIONS);
// These take a single snapshot.
const PNG_OPTONS = {
	name: 'demo-png',
	dpi: 72,
	onExportProgress: (progress: number) => console.log(`PNG frames export progress: ${progress}.`),
	onExportFinish: () => console.log(`Finished PNG frames zip.`),
};
CanvasCapture.bindKeyToPNGSnapshot('p', PNG_OPTONS);
CanvasCapture.bindKeyToPNGFrames('o', PNG_OPTONS);
const JPEG_OPTIONS = {
	name: 'demo-jpg',
	quality: 1,
	dpi: 72,
	onExportProgress: (progress: number) => console.log(`JPEG frames export progress: ${progress}.`),
	onExportFinish: () => console.log(`Finished JPEG frames zip.`),
};
CanvasCapture.bindKeyToJPEGSnapshot('j', JPEG_OPTIONS);
CanvasCapture.bindKeyToJPEGFrames('h', JPEG_OPTIONS);

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
		angle += 0.02;
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
const startRecordPNGFrames = document.getElementById('startPNG')!;
let pngFramesCapture: CanvasCapture.ACTIVE_CAPTURE | undefined;
startRecordPNGFrames.addEventListener('click', (e) => {
	e.preventDefault();
	pngFramesCapture = CanvasCapture.beginPNGFramesRecord(PNG_OPTONS);
	startRecordPNGFrames.style.display = pngFramesCapture ? 'none' : 'inline';
	stopRecordPNGFrames.style.display = pngFramesCapture ? 'inline' : 'none';
});
const stopRecordPNGFrames = document.getElementById('stopPNG')!;
stopRecordPNGFrames.addEventListener('click', (e) => {
	e.preventDefault();
	CanvasCapture.stopRecord(pngFramesCapture);
	pngFramesCapture = undefined;
	stopRecordPNGFrames.style.display = 'none';
	startRecordPNGFrames.style.display = 'inline';
});
stopRecordPNGFrames.style.display = 'none';

document.getElementById("saveJPG")!.addEventListener('click', (e) => {
	e.preventDefault();
	CanvasCapture.takeJPEGSnapshot(JPEG_OPTIONS);
});
const startRecordJPGFrames = document.getElementById('startJPG')!;
let jpgFramesCapture: CanvasCapture.ACTIVE_CAPTURE | undefined;
startRecordJPGFrames.addEventListener('click', (e) => {
	e.preventDefault();
	jpgFramesCapture = CanvasCapture.beginJPEGFramesRecord(JPEG_OPTIONS);
	startRecordJPGFrames.style.display = jpgFramesCapture ? 'none' : 'inline';
	stopRecordJPGFrames.style.display = jpgFramesCapture ? 'inline' : 'none';
});
const stopRecordJPGFrames = document.getElementById('stopJPG')!;
stopRecordJPGFrames.addEventListener('click', (e) => {
	e.preventDefault();
	CanvasCapture.stopRecord(jpgFramesCapture);
	pngFramesCapture = undefined;
	stopRecordJPGFrames.style.display = 'none';
	startRecordJPGFrames.style.display = 'inline';
});
stopRecordJPGFrames.style.display = 'none';

const startRecordMP4 = document.getElementById('startMP4')!;
let mp4Capture: CanvasCapture.ACTIVE_CAPTURE | undefined;
startRecordMP4.addEventListener('click', (e) => {
	e.preventDefault();
	mp4Capture = CanvasCapture.beginVideoRecord(MP4_OPTIONS);
	startRecordMP4.style.display = mp4Capture ? 'none' : 'inline';
	stopRecordMP4.style.display = mp4Capture ? 'inline' : 'none';
});
const stopRecordMP4 = document.getElementById('stopMP4')!;
stopRecordMP4.addEventListener('click', (e) => {
	e.preventDefault();
	CanvasCapture.stopRecord(mp4Capture);
	mp4Capture = undefined;
	stopRecordMP4.style.display = 'none';
	startRecordMP4.style.display = 'inline';
});
stopRecordMP4.style.display = 'none';

const startRecordWEBM = document.getElementById('startWEBM')!;
let webmCapture: CanvasCapture.ACTIVE_CAPTURE | undefined;
startRecordWEBM.addEventListener('click', (e) => {
	e.preventDefault();
	webmCapture = CanvasCapture.beginVideoRecord(WEBM_OPTIONS);
	startRecordWEBM.style.display = webmCapture ? 'none' : 'inline';
	stopRecordWEBM.style.display = webmCapture ? 'inline' : 'none';
});
const stopRecordWEBM = document.getElementById('stopWEBM')!;
stopRecordWEBM.addEventListener('click', (e) => {
	e.preventDefault();
	CanvasCapture.stopRecord(webmCapture);
	webmCapture = undefined;
	stopRecordWEBM.style.display = 'none';
	startRecordWEBM.style.display = 'inline';
});
stopRecordWEBM.style.display = 'none';

const startRecordGIF = document.getElementById('startGIF')!;
let gifCapture: CanvasCapture.ACTIVE_CAPTURE | undefined;
startRecordGIF.addEventListener('click', (e) => {
	e.preventDefault();
	gifCapture = CanvasCapture.beginGIFRecord(GIF_OPTIONS);
	startRecordGIF.style.display = gifCapture ? 'none' : 'inline';
	stopRecordGIF.style.display = gifCapture ? 'inline' : 'none';
});
const stopRecordGIF = document.getElementById('stopGIF')!;
stopRecordGIF.addEventListener('click', (e) => {
	e.preventDefault();
	CanvasCapture.stopRecord(gifCapture);
	gifCapture = undefined;
	stopRecordGIF.style.display = 'none';
	startRecordGIF.style.display = 'inline';
});
stopRecordGIF.style.display = 'none';

document.getElementById('WEBM-support')!.innerHTML = `(supported by this browser: ${CanvasCapture.browserSupportsWEBM()})`;
document.getElementById('MP4-support')!.innerHTML = `(supported by this browser: ${CanvasCapture.browserSupportsMP4()})`;
document.getElementById('GIF-support')!.innerHTML = `(supported by this browser: ${CanvasCapture.browserSupportsGIF()})`;
