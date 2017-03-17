const Sequelize = require('sequelize')
const _ = require('lodash')

async function createModelAsync (modelConfig, models, globals) {
  // initialize models
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

  _.forEach(models, (model, modelName) => {
    model.unshift(modelName)
    sequelize.define.apply(sequelize, model)
  })
  globals.models = sequelize.models
  globals.query = sequelize.query.bind(sequelize)
  globals.transaction = sequelize.transaction.bind(sequelize)
  return globals
}

module.exports = createModelAsync
