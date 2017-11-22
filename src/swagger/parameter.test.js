const {expect} = require('chai')
const pathToRegexp = require('path-to-regexp')

const Parameter = require('./parameter')

describe('swagger/parameter', () => {
  const path = '/pet/{petId}'
  const commonParent = {parent: {regexp: pathToRegexp(path.replace(/\{/g, ':').replace(/\}/g, ''))}}

  it('should only allow particular type of parameters', () => {
    let parameterObject

    parameterObject = new Parameter({in: 'body'}, commonParent, [])
    expect(() => parameterObject.getValue({body: {key: 'value'}})).to.not.throw()

    parameterObject = new Parameter({in: 'unknown'}, commonParent, [])
    expect(() => parameterObject.getValue({})).to.throw('Invalid \'in\' value')
  })

  it('should handle parameter in body', () => {
    const parameterObject = new Parameter({in: 'body'}, commonParent, [])
    const {value} = parameterObject.getValue({body: {key: 'value'}})
    expect(value).to.eql({key: 'value'})
  })

  it('should handle parameter in formData', () => {
    const parameterObject = new Parameter({in: 'formData', name: 'key'}, commonParent, [])
    expect(() => parameterObject.getValue({})).to.throw('req.body must be provided')

    const {value} = parameterObject.getValue({body: {key: 'value'}})
    expect(value).to.eql('value')
  })

  it('should handle file parameter in formData', () => {
    const parameterObject = new Parameter({in: 'formData', type: 'file', name: 'key'}, commonParent, [])
    expect(() => parameterObject.getValue({})).to.throw('req.files must be provided')

    const {value} = parameterObject.getValue({files: {key: 'value'}})
    expect(value).to.eql('value')
  })

  it('should handle parameter in request header', () => {
    const parameterObject = new Parameter({in: 'header', name: 'key'}, commonParent, [])
    expect(() => parameterObject.getValue({})).to.throw('req.headers must be provided')

    const {value} = parameterObject.getValue({headers: {key: 'value'}})
    expect(value).to.eql('value')
  })

  it('should handle parameter inside url path', () => {
    const parameterObject = new Parameter({in: 'path', name: 'petId'}, commonParent, [])
    expect(() => parameterObject.getValue({})).to.throw('req.url must be provided')

    const {value} = parameterObject.getValue({url: '/pet/123'})
    expect(value).to.eql('123')
  })

  it('should handle parameter in request querystring', () => {
    const parameterObject = new Parameter({in: 'query', name: 'key'}, commonParent, [])
    expect(() => parameterObject.getValue({})).to.throw('req.query must be provided')

    const {value} = parameterObject.getValue({query: {key: 'value'}})
    expect(value).to.eql('value')
  })
})
