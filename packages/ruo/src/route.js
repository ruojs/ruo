const joinPath = require('path').join

const debug = require('debug')('ruo')
const glob = require('glob')
const _ = require('lodash')

const config = require('./config')
const translate = require('./translate')
const {wrapRoute, wrapMiddleware} = require('./utility')

module.exports = route

function route (app, api) {
  if (config.shadow) {
    glob.sync(`**/*${config.suffix.code}`, {cwd: config.target}).forEach((file) => {
      const handlers = require(joinPath(config.target, file))
      _.forEach(handlers, (handler, endpoint) => {
        addHandler(app, api, endpoint, handler)
      })
    })
  } else {
    for (let endpoint in api.paths) {
      const codePath = translate.toCode(endpoint, config.target + '/api')
      debug('require', codePath)
      const handler = require(codePath)
      addHandler(app, api, endpoint, handler)
    }
  }
}

function addHandler (app, api, endpoint, handler) {
  for (let method in api.paths[endpoint]) {
    if (typeof handler[method] === 'object') {
      // array of middlewares
      handler[method] = handler[method].map((func, index) => {
        return index === handler[method].length - 1 ? wrapRoute(func) : wrapMiddleware(func)
      })
    } else {
      handler[method] = wrapRoute(handler[method])
    }
    app[method](`${api.basePathPrefix}${endpoint}`, handler[method])
  }
}
