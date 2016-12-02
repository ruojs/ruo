const {expect} = require('chai')

const globals = require('./globals')

describe('globals', () => {
  it('should load model, service and security', async () => {
    const {models, services, securitys, middlewares} = await globals.initialize()
    expect(models).to.be.a('object')
    expect(services).to.be.a('object')
    expect(middlewares).to.be.a('object')
    expect(securitys).to.be.a('object')
    expect(securitys.basic).to.be.a('function')
  })
})
