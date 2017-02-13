const url = require('url')
const events = require('events')

const defaults = require('superagent-defaults')
const supertest = require('supertest')
const client = require('socket.io-client')

const {initializeClientSocket} = require('./utility')

// https://github.com/visionmedia/supertest/issues/307
events.EventEmitter.defaultMaxListeners = Infinity

const port = 10000 + parseInt(Math.random() * 10000, 10)

function createTestApplicationAsync (app, api, config) {
  return new Promise((resolve) => {
    app.listen(port)

    app = defaults(supertest(app))
    app.on('request', (request) => {
      const urlObject = url.parse(request.url)
      urlObject.pathname = api.basePathPrefix + urlObject.pathname
      request.url = url.format(urlObject)
    })
    global.api = app

    if (config.ws) {
      global.socket = client(`http://localhost:${port}`, {path: config.ws.path})
      initializeClientSocket(socket, {basePathPrefix: api.basePathPrefix})
      socket.on('connect', () => {
        resolve()
      })
    } else {
      resolve()
    }
  })
}

module.exports = createTestApplicationAsync
