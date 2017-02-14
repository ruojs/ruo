const STATUS_CODES = require('http').STATUS_CODES

// Forked from https://github.com/diachedelic/mock-res/blob/93a33be9158bcf94738ff18279d305671fb3ae90/index.js
// NOTE: cant use prototype to create MockRes class because [express will override res.__proto__](https://github.com/expressjs/express/blob/abd1de73c14985c884d11fb35aff5f4b17381e23/lib/middleware/init.js#L28)
function MockRes (req, envelope, basePathPrefix) {
  const headers = {}
  let broadcast = false
  return {
    setHeader (name, value) {
      headers[name.toLowerCase()] = value
    },
    getHeader (name) {
      return headers[name.toLowerCase()]
    },
    removeHeader (name) {
      delete headers[name.toLowerCase()]
    },
    writeHead (statusCode, reason, headers) {
      if (arguments.length === 2 && typeof arguments[1] !== 'string') {
        headers = reason
        reason = undefined
      }
      this.statusCode = statusCode
      this.statusMessage = reason || STATUS_CODES[statusCode] || 'unknown'
      if (headers) {
        for (var name in headers) {
          this.setHeader(name, headers[name])
        }
      }
    },

    join (room) {
      req.socket.join(room)
      req.session.room = room
      return this
    },
    broadcast () {
      broadcast = true
      return this
    },
    json (body) {
      const res = {
        status: this.statusCode,
        statusMessage: this.statusMessage,
        headers: headers,
        body
      }
      const reply = [envelope, res]
      req.socket.emit('rep', reply)

      if (broadcast) {
        req.io.to(req.session.room).emit(`${req.method} ${basePathPrefix + req.url}`, res)
      }
    },
    send (body) {
      this.json(body)
    }
  }
}

module.exports = MockRes
