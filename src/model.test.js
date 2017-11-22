const {expect} = require('chai')
const Sequelize = require('sequelize')

const createModelAsync = require('./model')

describe('model', () => {
  it('should create new models success', async () => {
    let modelConfig = {
      database: 'your_database_name',
      username: 'your_database_username',
      password: 'your_database_password',
      host: 'your_database_host',
      dialect: 'mysql', //
      charset: 'utf8mb4',
      pool: {
        max: 5,
        min: 0,
        idle: 10000
      },
      timezone: '+08:00'
    }

    let userModel = {
      id: {
        primaryKey: true,
        type: Sequelize.INTEGER,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(20),
        allowNull: false
      }
    }
    let models = {
      user: [userModel]
    }

    let toMount = {}
    await createModelAsync(modelConfig, models, toMount)

    expect(typeof toMount.models.user).to.equal('object')
    expect(typeof toMount.query).to.equal('function')
    expect(typeof toMount.transaction).to.equal('function')

    models = {
      user: userModel
    }
    await createModelAsync(modelConfig, models, toMount)
    expect(typeof toMount.models.user).to.equal('object')
  })
})
