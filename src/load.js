/**
 * Load middleware, service and api implementations
 */
const fs = require('fs')
const joinPath = require('path').join

const debug = require('debug')('ruo')
const moder = require('moder')
const _ = require('lodash')
const glob = require('glob')

const rc = require('./rc')
const {fromCode, isTest, wrapMiddleware} = require('./utility')
const {Swagger} = require('./swagger')

async function load (dynamicDefinition = {}, globals = {}) {
  globals.raw = {};
  // load model, service and middlewares
  ['model', 'service', 'middleware'].forEach((type) => {
    const name = type + 's'
    globals[name] = {}
    try {
      const dir = joinPath(rc.target, type)
      fs.statSync(dir)
      const modules = moder(dir, {
        lazy: false,
        filter: isTest
      })
      debug(type, Object.keys(modules))
      globals[name] = modules
    } catch (err) {
      if (err.code !== 'ENOENT') {
        throw err
      }
    }
  })

  // wrap normal middlewares
  globals.raw.middlewares = {}
  _.forEach(globals.middlewares, (middleware, name) => {
    globals.raw.middlewares[name] = middleware
    globals.middlewares[name] = function () {
      return wrapMiddleware(middleware.apply(undefined, arguments))
    }
  })
  // alias
  globals.mws = globals.middlewares

  // load swagger definitions
  globals.api = await Swagger.createAsync(dynamicDefinition)

  // read api implementation and bind them into definition
  const pathDefs = globals.api.definition.paths
  glob.sync(`**/*${rc.suffix.code}`, {cwd: rc.target}).sort().forEach((file) => {
    const codePath = joinPath(rc.target, file)
    debug('require', codePath)
    const mod = require(codePath)
    if (rc.shadow) {
      _.forEach(mod, (handlers, path) => {
        bindHandlers(pathDefs, handlers, path)
      })
    } else {
      const path = fromCode(file)
      bindHandlers(pathDefs, mod, path)
    }
  })

  return globals
}

function bindHandlers (pathDefs, handlers, path) {
  _.forEach(handlers, (handler, method) => {
    // bind handler only when api is defined
    const operationDef = _.get(pathDefs, [path, method])
    if (operationDef) {
      operationDef.__handler__ = handler
    }
  })
}

module.exports = load
