const express = require('express')
const ioredis = require('ioredis')
const ioSession = require('socket.io-express-session')
const Session = require('express-session')
const ioRedis = require('socket.io-redis')
const MockReq = require('mock-req')

const logger = require('./logger')
const rc = require('./rc')
const debug = require('debug')(rc.name)
const {wrapRoute} = require('./utility')

module.exports = function createServer (server, options = {}) {
  if (!options.path) {
    return
  }

  const io = require('socket.io')(server, {path: options.path})
  const app = express()

  let handlers
  try {
    handlers = require('require-all')({
      dirname: rc.target + '/io',
      filter: /(^[^.]+)\.js$/,
      recursive: true
    })
  } catch (err) {
    if (err.code === 'ENOENT') {
      handlers = {}
    } else {
      throw err
    }
  }

  if (options.session) {
    io.adapter(ioRedis({
      key: `${rc.name}:socket.io`,
      pubClient: ioredis(options.session.redis),
      subClient: ioredis(options.session.redis),
      subEvent: 'messageBuffer'
    }))
    io.use(ioSession(Session(options.session)))
  }

  io.on('connection', (socket) => {
    for (const event in handlers) {
      socket.on(event, (params) => {
        const req = new MockReq({
          method: 'POST',
          url: '/' + event,
          headers: socket.handshake.headers,
          // arbitrary properties:
          session: socket.handshake.session,
          ip: socket.handshake.headers['x-forwarded-for'] || socket.handshake.address,
          body: params,
          io,
          socket
        })
        debug('request', event, req.body)

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
            debug('response', event, data)
            if (res._broadcast) {
              io.to(req.session.room).emit(event, data)
            } else {
              socket.emit(event, data)
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
    }
  })

  // TODO: find a better way to mount handle in the end
  setImmediate(() => {
    for (const event in handlers) {
      const handler = handlers[event]
      app.use('/' + event, wrapRoute(handler))
    }
  })
  app.use((err, req, res, next) => {
    logger.error('WebSocket exception', err.stack)
  })
  return app
}
