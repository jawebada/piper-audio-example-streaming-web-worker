'use strict;'

function readAudioFile(audioFile) {
    const fileReader = new FileReader()
    return new Promise((resolve, reject) => {
        fileReader.onerror = () => {
            fileReader.abort()
            reject(new DOMException('failed to read file'))
        }
        fileReader.onload = () => {
            resolve(fileReader.result)
        }
        fileReader.readAsArrayBuffer(audioFile)
    })
}

export async function decodeAudioFile(audioFile) { 
    const audioBuffer = await readAudioFile(audioFile)
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    return audioContext.decodeAudioData(audioBuffer)
}
