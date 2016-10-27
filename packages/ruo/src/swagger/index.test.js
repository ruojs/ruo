const {expect} = require('chai')

const {Swagger} = require('.')
const sampleDef = require('./sample-definition.json')

describe('validator', () => {
  const validator = new Swagger(sampleDef)

  it('should generate path objects', () => {
    expect(validator.pathObjects.length).to.eql(Object.keys(sampleDef.paths).length)
  })

  it('should get path object via url', () => {
    let url
    let pathObject

    url = Object.keys(sampleDef.paths)[0]
    pathObject = validator.getPath(url)
    expect(pathObject.path).to.eql(url)

    url = '/not/exist/path'
    pathObject = validator.getPath(url)
    expect(pathObject).to.eql(undefined)
  })

  it('should get operation object via request object', () => {
    let req
    let operationObject

    const url = Object.keys(sampleDef.paths)[0]
    const method = Object.keys(sampleDef.paths[url])[0]
    req = {
      method,
      url
    }
    operationObject = validator.getOperation(req)
    expect(operationObject.method).to.eql(method)

    req = {
      method: 'post',
      url: '/not/exist/path'
    }
    operationObject = validator.getOperation(req)
    expect(operationObject).to.eql(undefined)
  })
})
