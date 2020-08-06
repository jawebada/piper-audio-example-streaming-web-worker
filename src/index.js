'use strict;'

import { 
  countingIdProvider,
  WebWorkerStreamingClient
} from 'piper-js/web-worker'

const qmPluginsServer = new Worker('worker.bundle.js')
const piperClient = new WebWorkerStreamingClient(qmPluginsServer, countingIdProvider(0))

const audioFileChooser = document.querySelector('#audioFileChooser')
const audioInfo = document.querySelector('#audioInfo')
const processingProgress = document.querySelector('#processingProgress')
const onsetsList = document.querySelector('#onsetsList')

function resetDisplay() {
  audioInfo.innerHTML = ''
  processingProgress.value = 0
  onsetsList.innerHTML = ''
}

function displayAudioProperties(audioBuffer) {
  audioInfo.innerHTML = `Sample rate: ${audioBuffer.sampleRate} Hz, channels: ${audioBuffer.numberOfChannels}, duration: ${audioBuffer.duration} s`
}

function updateProgress(progress) {
  processingProgress.max = progress.totalBlockCount
  processingProgress.value = progress.processedBlockCount
}

function displayOnsets(onsetFeatures) {
  const onsetsString = onsetFeatures.map((o) => o.timestamp.s + o.timestamp.n / 1E9).join(', ')
  onsetsList.innerHTML = `<h3>Onset Positions:</h3><p>${onsetsString}</p>`
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

async function processFile() {
  resetDisplay()

  const file = audioFileChooser.files[0]

  const audioBuffer = await decodeAudioFile(file)
  displayAudioProperties(audioBuffer)

  const onsetFeatures = await extractOnsetFeatures(audioBuffer)
  displayOnsets(onsetFeatures)
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
