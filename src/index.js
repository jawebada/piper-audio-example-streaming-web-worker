'use strict;'

import { 
  countingIdProvider,
  WebWorkerStreamingClient
} from 'piper-js/web-worker'
import {
  collect
} from 'piper-js/streaming'

const qmPluginsServer = new Worker('worker.bundle.js')
const piperClient = new WebWorkerStreamingClient(qmPluginsServer, countingIdProvider(0))

const audioFileChooser = document.querySelector('#audioFileChooser')
const audioInfo = document.querySelector('#audioInfo')
const processingProgress = document.querySelector('#processingProgress')
const onsetsList = document.querySelector('#onsetsList')

function resetDisplay() {
  audioInfo.innerHTML = ''
  processingProgress.value = 0
  processingProgress.max = 100
  onsetsList.innerHTML = ''
}

function displayAudioProperties(audioBuffer) {
  audioInfo.innerHTML = `Sample rate: ${audioBuffer.sampleRate} Hz<br>Channels: ${audioBuffer.numberOfChannels}<br>Duration: ${audioBuffer.duration} s`
}

function displayError(error) {
  audioInfo.innerHTML = `<em>Error: ${error}</em>`
}

function updateProgress(percent) {
  processingProgress.value = percent
}

function displayOnsets(onsetFeatureCollection) {
  const onsetsString = onsetFeatureCollection.collected.map((o) => o.timestamp.s + o.timestamp.n / 1E9).join(', ')
  onsetsList.innerHTML = `<h3>Onset Positions (seconds)</h3><p>${onsetsString}</p>`
}

function readAudioFile(audioFile) {
  const fileReader = new FileReader()
  const promise = new Promise((resolve, reject) => {
    fileReader.onerror = () => {
      fileReader.abort()
      reject(new DOMException('failed to read file'))
    }
    fileReader.onload = () => {
      resolve(fileReader.result)
    }
    fileReader.readAsArrayBuffer(audioFile)
  })
  return promise
}

async function decodeAudioFile(audioFile) { 
  const audioBuffer = await readAudioFile(audioFile)
  const audioContext = new (window.AudioContext || window.webkitAudioContext)()
  return audioContext.decodeAudioData(audioBuffer)
}

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

  let percent = 0

  return collect(piperClient.process(extractionRequest), (streamingResponse) => {
    const currentPercent = Math.round(100.0 * streamingResponse.progress.processedBlockCount / streamingResponse.progress.totalBlockCount)

    // reduce the amount of progress updates
    if (currentPercent > percent) {
      percent = currentPercent
      updateProgress(percent)
    }
  })
}

async function processFile() {
  resetDisplay()

  const file = audioFileChooser.files[0]

  try {
    const audioBuffer = await decodeAudioFile(file)
    displayAudioProperties(audioBuffer)

    const onsetFeatureCollection = await extractOnsetFeatures(audioBuffer)
    displayOnsets(onsetFeatureCollection)
  } catch (error) {
    displayError(`the file '${file.name}' could not be processed (${error})`)
  }
}

// process chosen audio files
audioFileChooser.addEventListener('change', processFile)

// list all available plugins in console
piperClient.list({}).then((res) => {
  console.log('available plugins:')
  for (const p of res.available) {
    console.log(p)
  }
})
