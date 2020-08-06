## Summary

I was looking into how to compile [VAMP audio analysis
plugins](https://vamp-plugins.org/) into
[WebAssembly](https://developer.mozilla.org/en-US/docs/WebAssembly) modules
when I stumbled upon [Piper Audio](https://github.com/piper-audio/). The Piper
Audio documentation was sparse, which is why I created this minimal example.

* [Demo](https://jawebada.github.com/piper-audio-example-streaming-web-worker)
* [Source Code](https://github.com/jawebada/piper-audio-example-streaming-web-worker)

## Introduction

In Machine Learning, 
[Feature Extraction](https://en.wikipedia.org/wiki/Feature_extraction)
is the attempt to transfer some form of input data (text, image, audio, etc.)
into a, supposedly, more compact and more appropriate format (features) for the
task at hand.

The [VAMP](https://vamp-plugins.org) system defines a standard plugin API for
feature extraction from audio signals. The most prominent VAMP host making use
of this API to visualise the traits of an audio signal is [Sonic
Visualiser](https://www.sonicvisualiser.org/). Both the VAMP API and Sonic
Visualiser have been developed at [the center for digital Music
(C4DM)](http://c4dm.eecs.qmul.ac.uk/), a research group of the [Queen Mary
University of London (QMUL)](https://www.qmul.ac.uk/).

[Piper Audio](https://github.com/piper-audio) is/was a

> project of C4DM to explore audio analysis using browser technology,
> Javascript, and network protocols.

It was introduced in [L. Thompson, C. Cannam, and M. Sandler, “Piper: Audio
Feature Extraction in Browser and Mobile Applications,” in Proceedings of 3rd
Web Audio Conference, London, August 2017,
2017](https://qmro.qmul.ac.uk/xmlui/handle/123456789/26163)
([Video](https://youtu.be/OpUeyRRPpCo?t=33m10s)) and comprises

* a [protocol schema](https://github.com/piper-audio/piper)
* [C++ support code for Piper including adaptation to Vamp plugin SDK](https://github.com/piper-audio/piper-vamp-cpp)
* an [adapter to turn Vamp plugins into Piper modules, usually with Emscripten](https://github.com/piper-audio/piper-vamp-js)
* [piper-js](https://github.com/piper-audio/piper-js), a library for building Piper servers and clients with Javascript
* a proof of concept demo called [ugly duckling](https://piper-audio.github.io/ugly-duckling) ([Source](https://github.com/piper-audio/ugly-duckling))
* [build scripts for a set of existing VAMP plugins](https://github.com/piper-audio/piper-vamp-js-builds)

This demo uses piper-js and the [QM Note Onset
Detector](https://vamp-plugins.org/plugin-doc/qm-vamp-plugins.html#qm-onsetdetector)
to estimate note onset times of an audio file.

## Code

The example uses [webpack](https://webpack.js.org/) to create two bundles: 

* [worker.js](https://github.com/jawebada/piper-audio-example-streaming-web-worker/blob/master/src/worker.js),
  the script executed by a [Web Worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) and
* [index.js](https://github.com/jawebada/piper-audio-example-streaming-web-worker/blob/master/src/index.js),
  which starts the web worker and a client talking to it.

### The streaming web worker server

```javascript
import {
  QMVampPlugins
} from './QMVampPluginsModule'
import {
  EmscriptenService
} from 'piper-js/emscripten'
import {
  PiperStreamingService
} from 'piper-js/streaming'
import {
  WebWorkerStreamingServer
} from 'piper-js/web-worker'

const qmService = new EmscriptenService(QMVampPlugins())
const streamingService = new PiperStreamingService(qmService)
new WebWorkerStreamingServer(self, streamingService)
```

### The streaming web worker client

```javascript
import { 
  countingIdProvider,
  WebWorkerStreamingClient
} from 'piper-js/web-worker'

const qmPluginsServer = new Worker('worker.bundle.js')
const piperClient = new WebWorkerStreamingClient(qmPluginsServer, countingIdProvider(0))

function extractOnsetFeatures(audioBuffer) {
  const extractionRequest = {
    audioData: [...Array(audioBuffer.numberOfChannels).keys()]
    .map(i => audioBuffer.getChannelData(i)),
    audioFormat: {
      sampleRate: audioBuffer.sampleRate,
      channelCount: audioBuffer.numberOfChannels,
      length: audioBuffer.length
    },
    key: 'qm-vamp-plugins:qm-onsetdetector',
    outputId: 'onsets'
  }

  const promise = new Promise((resolve, reject) => {
    const onsetFeatures = []

    // WebWorkerStreamingClient#process returns an RxJS Observable
    const streamingResponseObserver = {
      next: streamingResponse => {
        updateProgress(streamingResponse.progress)
        onsetFeatures.push(...streamingResponse.features)
      },
      error: err => reject(err),
      complete: () => resolve(onsetFeatures)
    }

    piperClient.process(extractionRequest).subscribe(streamingResponseObserver)
  })

  return promise
}
```

## Building

```
npm install
npm run build
npm run serve
```

## Licence

[QMVampPlugins module](https://github.com/jawebada/piper-audio-example-streaming-web-worker/blob/master/src/QMVampPlugins.umd.js): 

Copyright (c) 2015-2017 Queen Mary, University of London, provided under a BSD-style licence.

Example code:

Copyright (c) 2020, Jan Weil, provided under a [BSD-style licence](https://github.com/jawebada/piper-audio-example-streaming-web-worker/blob/master/LICENSE)
