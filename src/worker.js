'use strict;'

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
