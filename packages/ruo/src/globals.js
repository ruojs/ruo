/**
 * Load security, middleware, service and api implementations
 */
const fs = require('fs')
const path = require('path')

const debug = require('debug')('ruo')
const moder = require('moder')
const _ = require('lodash')
const Sequelize = require('sequelize')

const rc = require('./rc')
const {isTest, wrapMiddleware} = require('./utility')

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
      return wrapMiddleware(middleware.apply(undefined, arguments))
    }
  })

  // initialize models
  if (modelConfig) {
    const sequelize = new Sequelize(modelConfig.database, modelConfig.username, modelConfig.password, {
      host: modelConfig.host,
      dialect: modelConfig.dialect,
      pool: modelConfig.pool,
      timezone: modelConfig.timezone,
      define: {
        timestamps: false,
        freezeTableName: true
      },
      logging: false
    })

    _.forEach(globals.models, (model, modelName) => {
      model.unshift(modelName)
      sequelize.define.apply(sequelize, model)
    })
    globals.DataTypes = Sequelize.DataTypes
    globals.QueryTypes = Sequelize.QueryTypes
    globals.models = sequelize.models
    globals.query = sequelize.query.bind(sequelize)
  }

  return globals
}
