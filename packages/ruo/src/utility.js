const co = require('co')
const _ = require('lodash')

exports.wrapRoute = (fn) => {
  fn = toPromise(fn)
  return function () {
    return fn.apply(undefined, arguments)
      .catch(arguments[arguments.length - 1])
  }
}

exports.wrapMiddleware = (fn) => {
  fn = toPromise(fn)
  return function () {
    const next = arguments[arguments.length - 1]
    return fn.apply(undefined, arguments)
      .then(next.bind(null, null))
      .catch(next)
  }
}

exports.forEachOperation = (definition, fn) => {
  _.forEach(definition.paths, (pathDef, path) => {
    _.forEach(pathDef, (operationDef, method) => {
      fn(path, method, operationDef)
    })
  })
}

function isPromise (obj) {
  return !!obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function'
}

function toPromise (fn) {
  return isPromise(fn) ? fn : co.wrap(fn)
}
