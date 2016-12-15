/**
 * Load security, middleware, service and api implementations
 */
const fs = require('fs')
const path = require('path')

const debug = require('debug')('ruo')
const moder = require('moder')
const _ = require('lodash')
const Waterline = require('waterline')
const pascalcase = require('uppercamelcase')
const promiseify = require('denodeify')

const rc = require('./rc')
const {isTest, wrapMiddleware} = require('./utility')

const waterline = new Waterline()
const initialize = promiseify(waterline.initialize.bind(waterline))

exports.initialize = async ({model: modelConfig} = {}) => {
  const globals = {raw: {}};
  // load model, service and security
  ['model', 'service', 'security', 'middleware'].forEach((type) => {
    const name = type + 's'
    globals[name] = {}
    try {
      const dir = path.join(rc.target, type)
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

  // wrap security middlewares
  globals.raw.securitys = {}
  _.forEach(globals.securitys, (middleware, name) => {
    // TODO: what if security middleware require arguments?
    globals.raw.securitys[name] = middleware
    globals.securitys[name] = wrapMiddleware(middleware())
  })

  // wrap normal middlewares
  globals.raw.middlewares = {}
  _.forEach(globals.middlewares, (middleware, name) => {
    globals.raw.middlewares[name] = middleware
    globals.middlewares[name] = function () {
      wrapMiddleware(middleware.apply(undefined, arguments))
    }
  })

  // initialize models
  if (modelConfig) {
    _.forEach(globals.models, (model) => {
      // FIXME: why modelrc.defaults not working?
      waterline.loadCollection(Waterline.Collection.extend(_.merge({}, modelConfig.defaults, model)))
    })
    for (let name in modelConfig.adapters) {
      modelConfig.adapters[name] = require(modelConfig.adapters[name])
    }
    const ontology = await initialize(modelConfig)
    const models = _.reduce(ontology.collections, (obj, model, name) => {
      name = pascalcase(name)
      obj[name] = model
      return obj
    }, {})
    // TODO: just pick one of the model, any better way?
    const Model = models[Object.keys(models)[0]]
    models.query = promiseify(Model.query.bind(Model))
    globals.models = models
  }

  return globals
}
