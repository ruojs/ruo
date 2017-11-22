const shimmer = require('shimmer')

module.exports = Pipeline

const pipeline = Pipeline.prototype

function Pipeline () {
  if (!(this instanceof Pipeline)) {
    return new Pipeline()
  }

  this.mws = []
}

pipeline.use = function use (mw) {
  this.mws.push(mw)
}

pipeline.start = function start (req, res, obj) {
  return this.mws.reduce((o, mw) => mw(req, res, o), obj)
}

pipeline.createMiddleware = function createMiddleware () {
  const self = this
  return (req, res, next) => {
    shimmer.wrap(res, 'json', function (original) {
      return function () {
        arguments[0] = self.start(req, res, arguments[0])
        return original.apply(this, arguments)
      }
    })

    next()
  }
}
