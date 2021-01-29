# canvas-capture
A small wrapper around CCapture.js to record the canvas as video or gif

This is still in progress and has not been tested.  will update README when this is ready to go.

## Installation

To install this package run:

```npm install canvas-capture```

To use, you can bind hotkeys to start/stop recording:

```js
import {
	init,
	bindKeyToVideoRecord,
	bindKeyToGIFRecord,
	bindKeyToPNGSnapshot,
	bindKeyToJPEGSnapshot,
	recordFrame,
	isRecording,
} from 'canvas-capture';

// Initialize and pass in canvas.
init(document.getElementById('glcanvas'));

// Bind key presses to begin/end recordings.
bindKeyToVideoRecord('v', { name: 'myVideo', quality: 0.6 }); // Options are optional.
bindKeyToGIFRecord('g');
// These take a single snapshot.
bindKeyToPNGSnapshot('p'); 
bindKeyToJPEGSnapshot('j', { name: 'myJpeg', quality: 0.8 }); // Options are optional.

function loop() {
	requestAnimationFrame(loop);

	// Render something...

	// You need to do this only if you are recording a video or gif.
	if (isRecording()) recordFrame();
}

loop();
```

Alternatively, you can call `beginXXXRecord` and `takeXXXSnapshot` directly:

```js
import {
	init,
	beginVideoRecord,
	beginGIFRecord,
	takePNGSnapshot,
	takeJPEGSnapshot,
	recordFrame,
	stopRecord,
} from 'canvas-capture';

// Initialize and pass in canvas.
init(document.getElementById('glcanvas'));

beginGIFRecord({ fps: 10, name: 'MyGif' }); // Options are optional.
.... // Draw something.
recordFrame();
.... // Draw something.
recordFrame();
stopRecording();


// Now you may start another recording.
beginVideoRecord();
recordFrame();
....
stopRecording();

// Or you can call `takeXXXSnapshot` to take a single snapshot,
// no need to call `recordFrame` or `stopRecord`.
takePNGSnapshot({ name: 'myPng' }); // Options are optional.
takeJPEGSnapshot()

```

Available options for each capture type - this can be passed in as an optional argument to `bindKeyTo...`, `beginXXXRecord`, or `takeXXXSnapshot`:

```ts
videoOptions = {
	name: string, // Defaults to 'WEBM_Capture'.
	fps: number, // The speed of the output video, defaults to 60.
	quality: number, // A number between 0 and 1, defaults to 1.
}
gifOptions = {
	name: string, // Defaults to 'GIF_Capture'.
	fps: number, // The speed of the output gif, defaults to 60.
}
pngOptions = {
	name: string, // Defaults to 'PNG_Capture'.
}
jpegOptions = {
	name: string, // Defaults to 'JPEG_Capture'.
	quality, // A number between 0 and 1, defaults to 1.
}
```

You can set the verbosity of the console output by:

```js
import {
	setVerbose,
} from 'canvas-capture';

setVerbose(false); // By default the verbosity is set to VERBOSE = true.
```

You'll also need to copy worker.js to the index of your app - sorry this is kind of annoying for now!  Hopefully CCapture will import this itself in the future.

## Development

Pull requests welcome!

Install development dependencies by running:

```npm install```

To build `src` to `dist` run:

```npm run build```

Please note there is some weirdness around importing CCapture with npm.  I'm currently grabbing CCapture from a branch at `github.com/amandaghassaei/ccapture.js.git#npm-fix`.  I'm not proud of the changes I had to make to get this to work, but it's fine for now.  Also, in order to get the constructor to work correctly, I had to call `window.CCapture()` from within `index.ts`.  You'll also see I had to assign the default export from CCapture to an unused temp variable to get everything to work:

```js
import CCapture from 'ccapture.js';
const temp = CCapture; // This is an unused variable, but critically necessary.

....

const capturer = new window.CCapture({
	format: 'webm',
	name: 'WEBM_Capture',
	framerate: 60,
	quality: 63,
	verbose: VERBOSE,
});
```

Hopefully this will all be fixed in the future, see notes here:

https://github.com/spite/ccapture.js/issues/78