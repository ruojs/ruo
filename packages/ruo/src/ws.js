const express = require('express')
const ioredis = require('ioredis')
const ioSession = require('socket.io-express-session')
const ioRedis = require('socket.io-redis')
const MockReq = require('mock-req')
const _ = require('lodash')

const logger = require('./logger')
const rc = require('./rc')
const createSession = require('./session')

module.exports = function createServer (server, options = {}) {
  if (!options.path) {
    return
  }

  const io = require('socket.io')(server, {path: options.path})
  const app = express()

  if (options.session) {
    io.adapter(ioRedis({
      key: `${rc.name}:socket.io`,
      pubClient: ioredis(options.session.redis),
      subClient: ioredis(options.session.redis),
      subEvent: 'messageBuffer'
    }))
    io.use(ioSession(createSession(options.session)))
  }

  io.on('connection', (socket) => {
    socket.on('req', ([envelope, {method = 'GET', url, headers = {}, body}]) => {
      headers = _.assign({'content-type': 'application/json'}, socket.handshake.headers, headers)
      const req = new MockReq({
        method,
        url,
        headers,
        // arbitrary properties:
        session: socket.handshake.session,
        ip: socket.handshake.headers['x-forwarded-for'] || socket.handshake.address,
        body,
        io,
        socket
      })

      const res = {
        setHeader () {},
        getHeader () {},
        removeHeader () {},
        writeHead () {},
        join (room) {
          req.socket.join(room)
          req.session.room = room
          return this
        },
        broadcast () {
          res._broadcast = true
          return this
        },
        json (data) {
          const reply = [envelope, data]
          if (res._broadcast) {
            io.to(req.session.room).emit('rep', reply)
          } else {
            socket.emit('rep', reply)
          }
        },
        send (data) {
          this.json(data)
        }
      }

      app(req, res, () => {
        logger.info('WebSocket no response')
      })
    })
  })

  return app
}
