const {expect} = require('chai')

const Operation = require('./operation')
const sampleDef = require('./sample-definition.json')

describe('swagger/operation', () => {
  const path = '/pet/findByStatus'
  const method = 'get'
  const operationDef = sampleDef.paths[path][method]
  const operationObject = new Operation(method, operationDef, {parent: {}}, ['paths', path, method])

  it('should create parameter object', () => {
    expect(operationObject.parameterObjects.length).to.eql(operationDef.parameters.length)
  })

  it('should validate content type', () => {
    let error

    error = operationObject.validateContentType('application/json', ['application/json'])
    expect(error).to.eql(undefined)

    error = operationObject.validateContentType('application/json', ['application/xml'])
    expect(error).to.not.eql(undefined)
    expect(error.type).to.not.eql('INVALID_CONTENT_TYPE')
  })

  it('should validate request by request object', () => {
    let results
    let error

    results = operationObject.validateRequest({
      query: {status: ['available']}
    })
    expect(results.errors.length).to.eql(0)

    results = operationObject.validateRequest({
      query: {status: ['invalid type']}
    })
    expect(results.errors.length).to.eql(1)
    error = results.errors[0]
    expect(error.code).to.eql('INVALID_REQUEST_PARAMETER')
    expect(error.in).to.eql('query')
    expect(error.name).to.eql('status')
    expect(error.path).to.eql(['paths', path, method, 'parameters', '0'])
  })

  it('should validate response by response object and response data', () => {
    let errors

    errors = operationObject.validateResponse({
      statusCode: 200
    }, [{
      name: 'someName',
      photoUrls: ['http://examples.com/abc.png']
    }])
    expect(errors).to.eql(undefined)

    errors = operationObject.validateResponse({
      statusCode: 200
    }, [{
      photoUrls: ['http://examples.com/abc.png']
    }])
    expect(errors).to.not.eql(undefined)
    expect(errors.length).to.eql(1)
    expect(errors[0].code).to.eql('OBJECT_MISSING_REQUIRED_PROPERTY')
  })

  it('should convert value based on schema', () => {
    const operationObject = new Operation('get', {
      parameters: [
        {
          name: 'integer',
          in: 'query',
          type: 'integer'
        },
        {
          name: 'number',
          in: 'formData',
          type: 'number'
        },
        {
          name: 'boolean',
          in: 'formData',
          type: 'boolean'
        },
        {
          name: 'header-integer',
          in: 'header',
          type: 'integer'
        }
      ]
    }, {parent: {}}, [])
    const req = {
      query: {integer: '123'},
      body: {number: '1.23', boolean: 'true'},
      headers: {'header-integer': '123', 'content-type': 'application/x-www-form-urlencoded'}
    }
    operationObject.validateRequest(req)
    expect(req.query.integer).to.eql(123)
    expect(req.body.number).to.eql(1.23)
    expect(req.body.boolean).to.eql(true)
    expect(req.headers['header-integer']).to.eql('123')
  })

  it('should only validate content type if req.body not empty', () => {
    let req
    let result
    const operationObject = new Operation('put', {}, {parent: {consumes: ['application/octet-stream']}}, [])

    req = {
      body: {number: '1.23', boolean: 'true'},
      headers: {'content-type': 'application/x-www-form-urlencoded'}
    }
    result = operationObject.validateRequest(req)
    expect(result.errors.length).to.eql(1)
    expect(result.errors[0].code).to.eql('INVALID_CONTENT_TYPE')

    req = {
      body: {},
      headers: {'content-type': 'application/x-www-form-urlencoded'}
    }
    result = operationObject.validateRequest(req)
    expect(result.errors.length).to.eql(0)
  })
})
