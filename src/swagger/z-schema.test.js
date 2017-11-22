const {expect} = require('chai')

const ZSchema = require('./z-schema')

const validator = new ZSchema()

describe('swagger/z-schema', () => {
  it('should validate full-date format', () => {
    const schema = {
      'type': 'object',
      'properties': {
        'startedAt': {
          'type': 'integer',
          'format': 'int32'
        },
        'endedAt': {
          'type': 'string',
          'format': 'date'
        }
      }
    }

    let valid

    valid = validator.validate({
      startedAt: 0,
      endedAt: '2016-01-13'
    }, schema)
    expect(valid).to.be.ok

    valid = validator.validate({
      startedAt: NaN,
      endedAt: '2016-01-13'
    }, schema)
    expect(valid).to.be.not.ok
  })
})
