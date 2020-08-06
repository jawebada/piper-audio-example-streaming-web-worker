## Summary

I was looking into how to compile [VAMP audio analysis
plugins](https://vamp-plugins.org/) into
[WebAssembly](https://developer.mozilla.org/en-US/docs/WebAssembly) modules
when I stumbled upon [Piper Audio](https://github.com/piper-audio/). The Piper
Audio documentation was sparse, which is why I created this minimal example.

## Code

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
