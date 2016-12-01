const {expect} = require('chai')

const globals = require('./globals')

describe('globals', () => {
  it('should load model, service and middleware', async () => {
    const {models, services, middlewares} = await globals.initialize()
    expect(models).to.be.a('object')
    expect(services).to.be.a('object')
    expect(middlewares).to.be.a('object')
    expect(middlewares.basic).to.be.a('function')
  })
})
