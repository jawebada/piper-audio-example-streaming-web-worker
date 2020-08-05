'use strict;'

import {
  QMVampPlugins
} from './QMVampPluginsModule'
import {
  EmscriptenService
} from 'piper-js/emscripten'
import {
  WebWorkerStreamingServer
} from 'piper-js/web-worker'

const service = new EmscriptenService(QMVampPlugins())
new WebWorkerStreamingServer(self, service)
