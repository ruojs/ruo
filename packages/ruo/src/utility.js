const path = require('path')

const co = require('co')
const _ = require('lodash')

const rc = require('./rc')

//
// Async handling utilitys
//

exports.wrapRoute = (fn) => {
  fn = co.wrap(fn)
  return function () {
    return fn.apply(undefined, arguments)
      .catch(arguments[arguments.length - 1])
  }
}

exports.wrapMiddleware = (fn) => {
  fn = co.wrap(fn)
  return function () {
    const next = arguments[arguments.length - 1]
    return fn.apply(undefined, arguments)
      .then(next.bind(null, null))
      .catch(next)
  }
}

//
// Transform between local file location and API URI.
//

const DEST_PREFIX = 'api'
const SUFFIX_CODE = rc.suffix.code
const SUFFIX_TEST = rc.suffix.test
const SUFFIX_SPEC = rc.suffix.spec

// '/demo/hello' => 'api/demo/hello${suffix}'
function to (suffix, uri, destPrefix) {
  destPrefix = destPrefix || DEST_PREFIX
  const pathObj = path.parse(path.join(destPrefix, uri))
  return path.join(pathObj.dir, pathObj.base + suffix)
}

// 'api/demo/hello${suffix}' => '/demo/hello'
function from (suffix, location, destPrefix) {
  destPrefix = destPrefix || DEST_PREFIX
  return location.slice(destPrefix.length, -suffix.length)
}

function is (suffix, location) {
  const index = location.indexOf(suffix)
  if (index === -1) {
    return false
  }

  return index === (location.length - suffix.length)
}

// '/demo/hello' => '/demo/hello.code.js'
exports.toCode = to.bind(null, SUFFIX_CODE)
// '/demo/hello' => '/demo/hello.test.js'
exports.toTest = to.bind(null, SUFFIX_TEST)
// '/demo/hello' => '/demo/hello.spec.yaml'
exports.toSpec = to.bind(null, SUFFIX_SPEC)

// 'api/demo/hello.code.js' => '/demo/hello'
exports.fromCode = from.bind(null, SUFFIX_CODE)
// 'api/demo/hello.test.js' => '/demo/hello'
exports.fromTest = from.bind(null, SUFFIX_TEST)
// 'api/demo/hello.spec.yaml' => '/demo/hello'
exports.fromSpec = from.bind(null, SUFFIX_SPEC)

exports.isCode = is.bind(null, SUFFIX_CODE)
exports.isTest = is.bind(null, SUFFIX_TEST)
exports.isSpec = is.bind(null, SUFFIX_SPEC)

exports.forEachOperation = (definition, fn) => {
  _.forEach(definition.paths, (pathDef, path) => {
    _.forEach(pathDef, (operationDef, method) => {
      fn(path, method, operationDef)
    })
  })
}

function createRouter (onReply) {
  let seq = 0
  const map = {}

  function reply (message) {
    const callback = map[message[0].seq]
    if (callback) {
      callback(message[1])
    }
  }

  function route (body, callback) {
    seq++
    const envelope = {seq}
    const message = [envelope, body]
    map[seq] = callback
    return message
  }

  onReply(reply)

  return route
}

exports.initializeClientSocket = (socket, {basePath = ''} = {}) => {
  const route = createRouter((reply) => {
    socket.on('rep', reply)
  })
  socket.request = (req, callback) => {
    req.url = basePath + req.url
    return new Promise((resolve) => {
      socket.emit('req', route(req, (res) => {
        resolve(res)
        callback && callback(res)
      }))
    })
  }
}
