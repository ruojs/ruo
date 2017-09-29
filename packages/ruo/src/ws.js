const express = require('express')
const Redis = require('ioredis')
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
      const redis = options.session.redis
      const client = Array.isArray(redis) ? new Redis.Cluster(redis, {scaleReads: 'slave'}) : new Redis(redis)
      io.adapter(ioRedis({
        key: `${rc.name}:socket.io`,
        pubClient: client,
        subClient: client,
        subEvent: 'messageBuffer'
      }))
    }
    io.use(ioSession(createSession(options.session)))
  }

  io.on('connection', (socket) => {
    const session = socket.handshake.session
    // join sid and userId to allow send message to particular socket
    socket.join(`session ${session.id}`)
    // TODO: custom userId field?
    socket.join(`user ${session.userId}`)

    socket.on('req', (message) => {
      let [envelope, {method = 'GET', url, headers = {}, query, body}] = message
      headers = _.assign({'content-type': 'application/json'}, socket.handshake.headers, headers)
      const req = new MockReq({
        method,
        url,
        headers,
        // arbitrary properties:
        session,
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

    // NOTE: we cant listen to `join` event because normally sensitive message will broadcasted and `join` action
    // should have some sort of authentications.
  })

  // bind websocket similar api to request and response object
  function extendMiddleware (req, res, next) {
    req.io = io
    res.join = function (room) {
      return this
    }
    res.broadcast = function (body, room) {
      const res = {
        status: this.statusCode,
        statusMessage: this.statusMessage,
        headers: this.headers,
        body
      }
      req.io.to(room).emit(`${req.method} ${api.basePathPrefix + req.path}`, res)
      return this
    }
    next()
  }

  return wsapp
}

module.exports = createWebSocketApplication
