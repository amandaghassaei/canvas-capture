# canvas-capture
A small wrapper around [CCapture.js](https://github.com/spite/ccapture.js) and [ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm) to record the canvas as an image (png + jpg), video (mp4 + webm), or gif

## Installation

To install this package run:

```npm install github:amandaghassaei/canvas-capture```

Currently, I'm not doing versions/releases in this repo, but you can reference a specific commit like this:

```npm install github:amandaghassaei/canvas-capture#9307b47```

You can also try adding [dist/canvas-capture.js](dist/canvas-capture.js) or [dist/canvas-capture.min.js](dist/canvas-capture.min.js) to your project and it should be available as `window.CanvasCapture` or possibly globally as `CanvasCapture`.  I have not tested this yet, please let me know if this works!

## Caveat

**Video export currently only works in Chrome.**  MP4 and WEBM video export should be possible in Firefox once [this Firefox bug is addressed](https://bugzilla.mozilla.org/show_bug.cgi?id=1559743).

This repo depends on [ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm/) to export MP4 video, not all browsers are supported:

>Only browsers with SharedArrayBuffer support can use ffmpeg.wasm, you can check [HERE](https://caniuse.com/sharedarraybuffer) for the complete list.  

In order for MP4 export to work, you need to configure your (local or remote) server correctly:

>SharedArrayBuffer is only available to pages that are [cross-origin isolated](https://developer.chrome.com/blog/enabling-shared-array-buffer/#cross-origin-isolation). So you need to host your own server with `Cross-Origin-Embedder-Policy: require-corp` and `Cross-Origin-Opener-Policy: same-origin` headers to use ffmpeg.wasm.

I've included a script for initializing a local server with the correct Cross-Origin policy at [canvas-capture/server.js](https://github.com/amandaghassaei/canvas-capture/blob/main/server.js).  This node server is currently set to serve the `demo` directory of this repo.  


## Use

There are a few ways to call CCapture. You can bind hotkeys to start/stop recording:

```js
import * as CanvasCapture from 'canvas-capture';

// Initialize and pass in canvas.
CanvasCapture.init(document.getElementById('my-canvas'));

// Bind key presses to begin/end recordings.
CanvasCapture.bindKeyToVideoRecord('v', {
  format: 'mp4', // Options are optional, more info below.
  name: 'myVideo',
  quality: 0.6,
});
CanvasCapture.bindKeyToGIFRecord('g');
// These take a single snapshot.
CanvasCapture.bindKeyToPNGSnapshot('p'); 
CanvasCapture.bindKeyToJPEGSnapshot('j', {
  name: 'myJpeg', // Options are optional, more info below.
  quality: 0.8,
});

function loop() {
   requestAnimationFrame(loop);

  // Render something...

  // You need to do this only if you are recording a video or gif.
  if (CanvasCapture.isRecording()) CanvasCapture.recordFrame();
}

loop();
```

Alternatively, you can call `beginXXXRecord` and `takeXXXSnapshot` directly:

```js
import * as CanvasCapture from 'canvas-capture';

// Initialize and pass in canvas.
CanvasCapture.init(document.getElementById('my-canvas'));

CanvasCapture.beginGIFRecord({ fps: 10 }); // Options are optional, more info below.
.... // Draw something.
CanvasCapture.recordFrame();
.... // Draw something.
CanvasCapture.recordFrame();
CanvasCapture.stopRecord();


// Now you may start another recording.
CanvasCapture.beginVideoRecord({
  format: 'mp4',
});
CanvasCapture.recordFrame();
....
CanvasCapture.stopRecord();

// Or you can call `takeXXXSnapshot` to take a single snapshot.
// No need to call `recordFrame` or `stopRecord` for these methods.
CanvasCapture.takePNGSnapshot({ name: 'MyPng' }); // Options are optional, more info below.
CanvasCapture.takeJPEGSnapshot()

```

Available options for each capture type - this can be passed in as an optional argument to `bindKeyTo...`, `beginXXXRecord`, or `takeXXXSnapshot`:

```ts
videoOptions = {
  format: 'mp4' | 'webm', // Defaults to 'mp4'.
  name: string, // Defaults to 'WEBM_Capture'.
  fps: number, // The frames per second of the output video, defaults to 60.
  quality: number, // A number between 0 and 1, defaults to 1.
  // Options for ffmpeg conversion to mp4, not needed for webm exporter.
  ffmpegOptions?: { [key: string]: string }, // Defaults to { '-c:v': 'libx264', '-preset': 'slow', '-crf': '22', '-pix_fmt': 'yuv420p' }
  // Internally the ffmpeg conversion runs with additional flags to crop to an even number of px dimensions (required for mp4) and export no audio channel.
}
gifOptions = {
  name: string, // Defaults to 'GIF_Capture'.
  fps: number, // The frames per second of the output gif, defaults to 60.
  quality: number, // A number between 0 and 1, defaults to 1.
}
pngOptions = {
  name: string, // Defaults to 'PNG_Capture'.
  dpi: number, // Defaults to screen resolution (72).
}
jpegOptions = {
  name: string, // Defaults to 'JPEG_Capture'.
  quality: number, // A number between 0 and 1, defaults to 1.
  dpi: number, // Defaults to screen resolution (72).
}
```

Note that changing the dpi of png/jpeg does not change the amount of pixels captured, just the dimensions of the resulting image.  

You can initialize `CanvasCapture` with the following options:

```js
import * as CanvasCapture from 'canvas-capture';

CanvasCapture.init(document.getElementById('my-canvas'), {
  verbose: true, // Verbosity of console output, default is true,
  showAlerts: true, // Show alert dialogs, default is false.
  showDialogs: true, // Show informational dialogs, default is false.
  showRecDot: true, // Show a red dot on the screen during records, defaults is true.
  recDotCSS: { right: '0', top: '0', margin: '10px' }, // Additional CSS for record dot.
});
```

Default CSS for the record dot is:
```js
background: "red",
width: "20px",
height: "20px",
"border-radius": "50%", // Make circle.
position: "absolute",
top: "0",
right: "0",
"z-index": "10",
margin: "20px",
```

Additionally, you can set the verbosity of the console output at any time by:

```js
CanvasCapture.setVerbose(false);
```

I've also included a helper function to show a simple modal dialog with a title and message:

```js
const options = {
  // Set the amount of time to wait before auto-closing dialog, or -1 to disable auto-close.
  autoCloseDelay: 7000, // Default is -1.
};
// title and message are strings, options are optional.
CanvasCapture.showDialog(title, message, options);
```

## Converting WEBM to MP4

[Not all browsers](https://caniuse.com/sharedarraybuffer) support mp4 export from this library.  If your browser only supports webm video, I recommend using [ffmpeg](https://ffmpeg.org/) to convert to mp4.  From the terminal run:

`
ffmpeg -i PATH/FILENAME.webm -vf "crop=trunc(iw/2)*2:trunc(ih/2)*2" -c:v libx264 -preset slow -crf 22 -pix_fmt yuv420p -an PATH/FILENAME.mp4
`

`-vf "crop=trunc(iw/2)*2:trunc(ih/2)*2"` crops the video so that its dimensions are even numbers (required for mp4)  

`-c:v libx264 -preset slow -crf 22` encodes as h.264 with better compression settings  

`-pix_fmt yuv420p` makes it compatible with the web browser  

`-an` creates a video with no audio  

If your filename has spaces in it, you can escape them with `-i PATH/filename\ with\ spaces.webm`  


## Notes

- PNG can save alpha channel of canvas, and JPEG/GIF exporters will draw alpha = 0 as black, but the video exporter creates nasty artifacts when handling alpha.  
- You cannot record GIF and video at the same time.  This appears to be a limitation of CCapture.js?  
- gif.js (a dependency of CCapture.js) has some performance limitations, be careful if capturing a lot of frames.  


## Development

Pull requests welcome!

Install development dependencies by running:

```npm install```

To build `src` to `dist` run and recompile `demo`:

```npm run build```

Please note there is some weirdness around importing CCapture with npm.  I'm currently grabbing CCapture from a branch at `github:amandaghassaei/ccapture.js#npm-fix`.  I'm not proud of the changes I had to make to get this to work ([see diff here](https://github.com/amandaghassaei/ccapture.js/commit/7ada41933411c4b1bcde4cdb09eef03758838bc7)), but it's fine for now.  Also, in order to get the constructor to work correctly, I had to call `window.CCapture()` rather than using the module import directly.  You'll also see I had to assign the default export from CCapture to an unused temp variable to get everything to work:

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
// This didn't work:
// const capturer = new CCapture({
//   format: 'webm',
//   name: 'WEBM_Capture',
//   framerate: 60,
//   quality: 63,
//   verbose: VERBOSE,
// });
```

Hopefully this will all be fixed in the future, see notes here:

https://github.com/spite/ccapture.js/issues/78  


### Demo

This repo also includes a demo for testing, currently hosted at [---](---).  

To build the `demo` folder, run:

```npm run build-demo```

To run the demo locally, run:

```node server.js```

This will boot up a local server with the correct Cross-Origin policies to support ffmpeg.wasm (a dependency for exporting mp4 video).  Navigate to the following address in your browser:

```localhost:8080```