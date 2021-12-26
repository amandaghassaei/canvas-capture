import * as CanvasCapture from '../../';

// Initialize and pass in canvas.
const canvas = document.getElementById('my-canvas') as HTMLCanvasElement
CanvasCapture.init(canvas);

// Bind key presses to begin/end recordings.
CanvasCapture.bindKeyToVideoRecord('v', {
	name: 'demo-video',
	quality: 1,
	fps: 60,
});
CanvasCapture.bindKeyToGIFRecord('g', {
	name: 'demo-gif',
	quality: 0.6,
	fps: 60,
});

// These take a single snapshot.
CanvasCapture.bindKeyToPNGSnapshot('p', {
	name: 'demo-png',
	dpi: 300,
}); 
CanvasCapture.bindKeyToJPEGSnapshot('j', {
	name: 'demo-jpg',
	quality: 0.8,
	dpi: 72,
});

// Simple canvas draw setup.
const context = canvas.getContext("2d");
let angle = 0;

const image = document.createElement("img");
image.src = 'monalisa.png';

function loop() {
	requestAnimationFrame(loop);

	// Render something once image is loaded.
	if (image.width) {
		// Renter rotated image.
		context.clearRect(0, 0, canvas.width, canvas.height);
		context.save();
		context.translate(canvas.width / 2, canvas.height / 2);
		context.rotate(angle);
		context.drawImage(image, -image.width / 2, -image.width / 2);
		context.restore();
		// Increase rotation.
		angle += 0.1;
	}

	// You need to do this only if you are recording a video or gif.
	if (CanvasCapture.isRecording()) CanvasCapture.recordFrame();
}

// Start animation loop.
loop();
