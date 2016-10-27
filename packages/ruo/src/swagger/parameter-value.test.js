const Buffer = require('buffer').Buffer
const {expect} = require('chai')

const Parameter = require('./parameter')
const ParameterValue = require('./parameter-value')

describe('swagger/parameter-value', () => {
  const commonParent = {parent: {regexp: /./}}

  describe('value', () => {
    it('should file parameter get raw value', () => {
      const parameterObject = new Parameter({in: 'formData', type: 'file'}, commonParent, [])
      const value = new ParameterValue(parameterObject, 'raw data')
      expect(value.value).to.eql('raw data')
    })

    it('should convert value based on parameter type', () => {
      const parameterObject = new Parameter({in: 'formData', type: 'number'}, commonParent, [])
      const value = new ParameterValue(parameterObject, '123')
      expect(value.value).to.eql(123)
    })

    it('should use default value if nothing provided', () => {
      const parameterObject = new Parameter({in: 'formData', type: 'string', default: 'value'}, commonParent, [])
      const value = new ParameterValue(parameterObject)
      expect(value.value).to.eql('value')
    })

    it('should support default value for array parameter', () => {
      let parameterObject
      let value

      parameterObject = new Parameter({
        in: 'formData',
        type: 'array',
        items: [{type: 'string', default: 'value1'}, {type: 'string', default: 'value2'}]
      }, commonParent, [])
      value = new ParameterValue(parameterObject)
      expect(value.value).to.eql(['value1', 'value2'])

      parameterObject = new Parameter({
        in: 'formData',
        type: 'array',
        items: {type: 'string', default: 'value'}
      }, commonParent, [])
      value = new ParameterValue(parameterObject)
      expect(value.value).to.eql(['value'])
    })
  })

  describe('valid', () => {
    it('should validate if parameter is required', () => {
      const parameterObject = new Parameter({in: 'formData', type: 'string', required: true}, commonParent, [])
      const value = new ParameterValue(parameterObject)
      expect(value.valid).to.eql(false)
      expect(value.error.code).to.eql('REQUIRED')
    })

    it('should skip validation if optional parameter with undefined value', () => {
      const parameterObject = new Parameter({in: 'formData', type: 'string', required: false}, commonParent, [])
      const value = new ParameterValue(parameterObject)
      expect(value.valid).to.eql(true)
    })

    it('should skip validation if allow empty parameter and value is empty', () => {
      const parameterObject = new Parameter({in: 'formData', type: 'string', allowEmptyValue: true}, commonParent, [])
      const value = new ParameterValue(parameterObject, '')
      expect(value.valid).to.eql(true)
    })

    it('should skip validation if is file parameter', () => {
      const parameterObject = new Parameter({in: 'formData', type: 'file'}, commonParent, [])
      const value = new ParameterValue(parameterObject, 'any data')
      expect(value.valid).to.eql(true)
    })

    it('should skip validation if string parameter with date or date-time format', () => {
      const parameterObject = new Parameter({in: 'formData', type: 'string', format: 'date'}, commonParent, [])
      const value = new ParameterValue(parameterObject, '2016-10-10')
      expect(value.valid).to.eql(true)
    })

    it('should skip validation if string parameter and value is Buffer', () => {
      const parameterObject = new Parameter({in: 'formData', type: 'string'}, commonParent, [])
      const value = new ParameterValue(parameterObject, new Buffer(''))
      expect(value.valid).to.eql(true)
    })

    it('should validate value via parameter schema', () => {
      let value

      // TODO: move complex schema tests
      const parameterObject = new Parameter({
        in: 'formData',
        type: 'array',
        items: {type: 'integer', default: 'value'}
      }, commonParent, [])
      value = new ParameterValue(parameterObject, [123])
      expect(value.valid).to.eql(true)

      value = new ParameterValue(parameterObject, [1.23])
      expect(value.valid).to.eql(false)
      expect(value.error.code).to.eql('SCHEMA_VALIDATION_FAILED')
    })
  })
})
