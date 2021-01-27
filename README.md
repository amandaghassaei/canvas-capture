# canvas-capture
A small wrapper around CCapture.js to record the canvas as video or gif

This is still in progress and has not been tested.  will update README when this is ready to go.

## Installation

To install this package run:

```npm install canvas-capture```

You can call it by:

```js
import {
	init,
	bindKeyToVideoRecord,
	bindKeyToGIFRecord,
	bindKeyToPNGSnapshot,
	beginVideoRecord,
	beginGIFRecord,
	takePNGSnapshot,
	recordFrame,
	stopRecord,
	isRecording,
} from 'canvas-capture';

// Initialize and pass in canvas.
init(document.getElementById('glcanvas'));

// Bind key presses to begin/end recordings.
bindKeyToGIFRecord('g');
bindKeyToVideoRecord('v');
bindKeyToPNGSnapshot('p'); // This takes a single snapshot.

function loop() {
	requestAnimationFrame(loop);

	// Render something...

	if (isRecording()) recordFrame();
}

loop();
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