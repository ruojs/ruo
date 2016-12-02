const rc = require('../rc')
const debug = require('debug')(rc.name)

module.exports = {
  request () {
    return (req, res, next) => {
      let payload = req.method === 'GET' || req.method === 'DELETE' ? req.query : req.body
      debug('request', req.method, req.path, payload)

      res.setHeader('x-api-version', req.state.version)

      next()
    }
  },

  response () {
    return (req, res, obj) => {
      debug('response', obj)
      return obj
    }
  },

  preHandler () {
    return (req, res, next) => {
      req.state.processing = true
      next()
    }
  },

  postHandler () {
    return (req, res, obj) => {
      req.state.processing = false
      return obj
    }
  }
}
