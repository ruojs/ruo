const debug = require('debug')('ruo')
const Router = require('router')

const {wrapRoute, wrapMiddleware} = require('../utility')

module.exports = (api) => {
  const router = Router()

  for (let path in api.paths) {
    for (let method in api.paths[path]) {
      let handler = api.paths[path][method].__handler__
      if (typeof handler === 'object') {
        // array of middlewares
        handler = handler.map((func, index) => {
          return index === handler.length - 1 ? wrapRoute(func) : wrapMiddleware(func)
        })
      } else {
        handler = wrapRoute(handler)
      }
      const endpoint = path.replace(/\{/g, ':').replace(/\}/g, '')
      debug('mount handler', method, endpoint)
      router[method](endpoint, handler)
    }
  }

  return router
}
