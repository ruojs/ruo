const {expect} = require('chai')

const load = require('./load')

describe('load', () => {
  it('should load model, service and security', async () => {
    const {models, services, middlewares} = await load()
    expect(models).to.be.a('object')
    expect(services).to.be.a('object')
    expect(middlewares).to.be.a('object')
    expect(middlewares.basic).to.be.a('function')
  })
})
