const fs = require('fs')
const path = require('path')

const debug = require('debug')('ruo')
const moder = require('moder')
const _ = require('lodash')
const Waterline = require('waterline')
const pascalcase = require('uppercamelcase')
const promiseify = require('denodeify')

const config = require('./config')
const {isTest} = require('./translate')

const waterline = new Waterline()
const initialize = promiseify(waterline.initialize.bind(waterline))

module.exports = async ({model: modelConfig} = {}) => {
  let models = {}
  let services = {}
  // load models
  try {
    const modelDir = path.join(config.target, 'model')
    fs.statSync(modelDir)
    moder(modelDir, {
      lazy: false,
      filter: isTest,
      init (model) {
        // FIXME: why modelConfig.defaults not working?
        waterline.loadCollection(Waterline.Collection.extend(_.merge({}, modelConfig.defaults, model)))
      }
    })
    for (let name in modelConfig.adapters) {
      modelConfig.adapters[name] = require(modelConfig.adapters[name])
    }
    const ontology = await initialize(modelConfig)
    models = _.reduce(ontology.collections, (obj, model, name) => {
      name = pascalcase(name)
      obj[name] = model
      return obj
    }, {})
    // TODO: just pick one of the model, any better way?
    const Model = models[Object.keys(models)[0]]
    models.query = promiseify(Model.query.bind(Model))
    debug('models', Object.keys(models))
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err
    }
  }

  // load services
  try {
    const serviceDir = path.join(config.target, 'service')
    fs.statSync(serviceDir)
    services = moder(serviceDir, {
      lazy: false,
      filter: isTest
    })
    debug('services', Object.keys(services))
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err
    }
  }

  return {models, services}
}
