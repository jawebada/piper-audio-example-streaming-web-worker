'use strict;'

import { 
  countingIdProvider,
  WebWorkerStreamingClient
} from 'piper-js/web-worker'
import {
  OneShotExtractionRequest
} from 'piper-js/one-shot'
import {
  decodeAudioFile
} from './audio'

const worker = new Worker('worker.bundle.js')
const client = new WebWorkerStreamingClient(worker, countingIdProvider(0))

// list all available plugins in console
client.list({}).then((res) => {
  console.log('available plugins:')
  for (const p of res.available) {
    console.log(p)
  }
})

const audioFileChooser = document.querySelector('#audioFileChooser')
audioFileChooser.addEventListener('change', () => {
  const file = audioFileChooser.files[0]
  decodeAudioFile(file).then((audioBuffer) => {
    const audioInfo = document.querySelector('#audioInfo')
    audioInfo.innerHTML = "Sample rate: " + audioBuffer.sampleRate + " Hz, channels: " + audioBuffer.numberOfChannels + ", duration: " + audioBuffer.duration + " s"
  })
})
