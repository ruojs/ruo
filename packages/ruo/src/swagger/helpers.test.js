const Buffer = require('buffer').Buffer

const {expect} = require('chai')
const _ = require('lodash')

const helpers = require('./helpers')

describe('swagger/helpers', () => {
  describe('prune', () => {
    const prune = helpers.prune
    it('do not touch primitive type', () => {
      expect(prune(123)).to.deep.equal(123)
      expect(prune('123')).to.deep.equal('123')
      expect(prune(null)).to.deep.equal(null)
      expect(prune([1, 2, '3'])).to.deep.equal([1, 2, '3'])
      expect(prune({foo: 'bar'})).to.deep.equal({foo: 'bar'})
    })

    it('prune null value in object', () => {
      expect(prune({foo: 'bar', baz: null})).to.deep.equal({foo: 'bar'})
    })

    it('do not prune null in array', () => {
      expect(
        prune([null, 'foo', null, 'bar', null])
      ).to.deep.equal([null, 'foo', null, 'bar', null])
    })

    it('complex json prune', () => {
      expect(
        prune([
          null,
          {
            foo1: 'bar1',
            foo2: {
              foo3: ['bar3', null],
              foo: null
            },
            foo$: null
          },
          null
        ])
      ).to.deep.equal([
        null,
        {
          foo1: 'bar1',
          foo2: {
            foo3: ['bar3', null]
          }
        },
        null
      ])
    })
  })

  it('should return header value', () => {
    let value

    value = helpers.getHeaderValue({'content-type': 'application/json'}, 'content-type')
    expect(value).to.eql('application/json')

    value = helpers.getHeaderValue({'Content-Type': 'application/json'}, 'content-type')
    expect(value).to.eql('application/json')

    value = helpers.getHeaderValue({'content-type': 'application/json'}, 'Content-Type')
    expect(value).to.eql('application/json')

    value = helpers.getHeaderValue({'content-type': 'application/json'}, 'stuff')
    expect(value).to.eql(undefined)
  })

  it('should return content type', () => {
    let type

    type = helpers.getContentType({'content-type': 'application/json'})
    expect(type).to.eql('application/json')

    type = helpers.getContentType({'content-type': 'application/json; charset=UTF-8'})
    expect(type).to.eql('application/json')
  })

  it('should transform swagger parameter definition to json schema definition', () => {
    const schema = {
      type: 'string',
      allowEmptyValue: true,
      default: 'stringValue',
      description: 'description',
      enum: ['a', 'b'],
      maxLength: 1,
      minLength: 1,
      pattern: /./
    }
    const swaggerDef = _.assign(schema)
    const jsonSchemaDef = {
      schema
    }

    expect(helpers.computeParameterSchema(swaggerDef)).to.eql(schema)
    expect(helpers.computeParameterSchema(swaggerDef)).to.not.equal(schema)
    expect(helpers.computeParameterSchema(jsonSchemaDef)).to.equal(schema)
  })

  describe('value', () => {
    const convertValue = helpers.convertValue

    it('should contain valid schema type', () => {
      expect(() => convertValue({type: 'invalid type'})).to.throw('Invalid \'type\' value')
    })

    it('should skip schema without type definition', () => {
      const value = convertValue({}, {}, 'any value')
      expect(value).to.eql('any value')
    })

    it('should return undefined on `undefined` or `null` value', () => {
      let value

      value = convertValue({type: 'string'}, {}, undefined)
      expect(value).to.eql(undefined)

      value = convertValue({type: 'string'}, {}, null)
      expect(value).to.eql(undefined)
    })

    it('should convert buffer to string', () => {
      const value = convertValue({type: 'string'}, {}, new Buffer('stringValue'))
      expect(value).to.eql('stringValue')
    })

    it('should allow empty string value', () => {
      let value

      value = convertValue({type: 'string'}, {}, '')
      expect(value).to.eql('')
    })

    it('should recursively convert value inside array', () => {
      let value

      value = convertValue({
        type: 'array',
        items: [
          {type: 'string'},
          {type: 'number'},
          {type: 'boolean'}
        ]
      }, {}, ['stringValue', '42', 'true'])
      expect(value).to.eql(['stringValue', 42, true])

      value = convertValue({
        type: 'array',
        items: {type: 'number'}
      }, {}, ['1', '2'])
      expect(value).to.eql([1, 2])
    })

    it('should convert string `true` and `false` to Boolean', () => {
      expect(convertValue({type: 'boolean'}, {}, 'true')).to.eql(true)
      expect(convertValue({type: 'boolean'}, {}, 'false')).to.eql(false)
      expect(() => convertValue({type: 'boolean'}, {}, 'stringValue')).to.throw()
    })

    it('should convert string number to Number', () => {
      expect(convertValue({type: 'number'}, {}, '1.23')).to.eql(1.23)
      expect(() => convertValue({type: 'number'}, {}, 'stringValue')).to.throw('Expected type number but found type string')
    })

    it('should convert string integer to Number', () => {
      expect(convertValue({type: 'integer'}, {}, '123')).to.eql(123)
      expect(() => convertValue({type: 'integer'}, {}, 'stringValue')).to.throw('Expected type integer but found type string')
    })

    it('should validate string date and date-time format', () => {
      expect(convertValue({type: 'string', format: 'date'}, {}, '2016-10-10')).to.be.instanceOf(Date)

      expect(() => convertValue({type: 'string', format: 'date'}, {}, '2016.10.10')).to.throw('Object didn\'t pass validation for format')
      expect(() => convertValue({type: 'string'}, {}, 123)).to.throw('Expected type string but found type number')
    })

    it('should skip object type', () => {
      expect(convertValue({type: 'object'}, {}, {key: 'value'})).to.eql({key: 'value'})
    })
  })
})
