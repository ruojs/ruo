const {expect} = require('chai')

const Path = require('./path')
const sampleDef = require('./sample-definition.json')

describe('swagger/path', () => {
  const path = '/pet/{petId}'
  const pathDef = sampleDef.paths[path]
  const pathObject = new Path(path, pathDef, {basePathPrefix: ''}, ['paths', path])

  it('should create express regular express to match path', () => {
    expect(pathObject.regexp.test('/pet/1')).to.eql(true)
    expect(pathObject.regexp.test('/pet/abc')).to.eql(true)
    expect(pathObject.regexp.test('/pet/1/')).to.eql(true)
    expect(pathObject.regexp.test('/pet')).to.eql(false)
    expect(pathObject.regexp.test('/pet/1/2')).to.eql(false)
  })

  it('should create operation objects', () => {
    expect(pathObject.operationObjects.length).to.eql(Object.keys(pathDef).length)
  })

  it('should get operation by method', () => {
    const method = Object.keys(pathDef)[0]
    const operationObject = pathObject.getOperation(method)
    expect(operationObject.method).to.eql(method)
  })
})
