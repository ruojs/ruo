const {expect} = require('chai')

const getAjv = require('./z-schema')

const validator = getAjv()

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

    valid = validator.validate(schema, {
      startedAt: 0,
      endedAt: '2016-01-13'
    })
    expect(valid).to.be.ok

    valid = validator.validate(schema, {
      startedAt: NaN,
      endedAt: '2016-01-13'
    })
    expect(valid).to.be.not.ok
  })
})
