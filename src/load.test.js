const {expect} = require('chai')

const load = require('./load')

describe('load', () => {
  it('should load service and security', async () => {
    const {services, middlewares} = await load()
    expect(services).to.be.a('object')
    expect(middlewares).to.be.a('object')
    expect(middlewares.basic).to.be.a('function')
  })
})
