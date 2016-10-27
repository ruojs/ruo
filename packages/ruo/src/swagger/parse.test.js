const {expect} = require('chai')

const parseAsync = require('./parse')

describe('swagger/parse', () => {
  it('should parse definition from directory', async () => {
    const definition = await parseAsync()
    expect(definition.paths).to.be.a('object')
    expect(Object.keys(definition.paths)).to.not.eql(0)
    expect(definition.definitions).to.be.a('object')
    expect(Object.keys(definition.definitions)).to.not.eql(0)
    expect(definition.parameters).to.be.a('object')
    expect(Object.keys(definition.parameters)).to.not.eql(0)
    expect(definition['x-pages']).to.be.a('object')
    expect(Object.keys(definition['x-pages'])).to.not.eql(0)
    expect(definition['x-errors']).to.be.a('object')
    expect(Object.keys(definition['x-errors'])).to.not.eql(0)
  })
})
