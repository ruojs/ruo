const express = require('express')
const ioredis = require('ioredis')
const ioSession = require('socket.io-express-session')
const ioRedis = require('socket.io-redis')
const MockReq = require('mock-req')
const _ = require('lodash')

const MockRes = require('./mock-res')
const rc = require('./rc')
const createSession = require('./session')
const logger = require('./logger')

function createWebSocketApplication (server, options) {
  if (!options) {
    return
  }

  const ws = require('socket.io')(server, {path: options.path})
  const app = express()

  if (options.session) {
    if (options.session.redis) {
      ws.adapter(ioRedis({
        key: `${rc.name}:socket.io`,
        pubClient: ioredis(options.session.redis),
        subClient: ioredis(options.session.redis),
        subEvent: 'messageBuffer'
      }))
    }
    ws.use(ioSession(createSession(options.session)))
  }

  ws.on('connection', (socket) => {
    socket.on('req', (message) => {
      let [envelope, {method = 'GET', url, headers = {}, query, body}] = message
      headers = _.assign({'content-type': 'application/json'}, socket.handshake.headers, headers)
      const req = new MockReq({
        method,
        url,
        headers,
        // arbitrary properties:
        session: socket.handshake.session,
        ip: socket.handshake.headers['x-forwarded-for'] || socket.handshake.address,
        query,
        body,
        ws,
        socket
      })

      const res = MockRes(req, envelope)

      app(req, res, (err) => {
        if (err) {
          return logger.error(err.stack)
        }

        logger.warn('WebSocket no matching handler')
      })
    })
  })

  return app
}

module.exports = createWebSocketApplication
