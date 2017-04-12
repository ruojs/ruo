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

function createWebSocketApplication (server, api, options) {
  if (!options) {
    return
  }

  const io = require('socket.io')(server, {path: options.path})
  const wsapp = express()
  wsapp.io = io
  wsapp.extendMiddleware = extendMiddleware

  if (options.session) {
    if (options.session.redis) {
      io.adapter(ioRedis({
        key: `${rc.name}:socket.io`,
        pubClient: ioredis(options.session.redis),
        subClient: ioredis(options.session.redis),
        subEvent: 'messageBuffer'
      }))
    }
    io.use(ioSession(createSession(options.session)))
  }

  io.on('connection', (socket) => {
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
        io,
        socket
      })

      const res = MockRes(req, envelope, api.basePathPrefix)

      wsapp(req, res, (err) => {
        if (err) {
          return logger.error(err.stack)
        }

        logger.warn('WebSocket no matching handler')
      })
    })
  })

  // bind websocket similar api to request and response object
  function extendMiddleware (req, res, next) {
    req.io = io
    let currentRoom
    res.join = (room) => {
      currentRoom = room
    }
    res.broadcast = (body, room) => {
      room = room || currentRoom
      const res = {
        status: this.statusCode,
        statusMessage: this.statusMessage,
        headers: this.headers,
        body
      }
      req.io.to(room).emit(`${req.method} ${api.basePathPrefix + req.url}`, res)
    }
    next()
  }

  return wsapp
}

module.exports = createWebSocketApplication
