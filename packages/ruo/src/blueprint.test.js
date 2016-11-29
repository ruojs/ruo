const expect = require('chai').expect

const {modelToJsonSchema} = require('./blueprint')

describe('blueprint', () => {
  it('should convert waterline model definition to json schema', () => {
    expect(modelToJsonSchema({
      id: {
        type: 'integer',
        primaryKey: true,
        autoIncrement: true
      },
      status: {
        type: 'string',
        enum: ['enabled', 'disabled', 'forbidden', 'deleted'],
        required: true
      },
      disabled: {
        type: 'boolean'
      },
      createdAt: {
        type: 'datetime',
        required: true
      }
    })).to.eql({
      type: 'object',
      required: ['status', 'createdAt'],
      properties: {
        id: {
          type: 'integer'
        },
        status: {
          type: 'string',
          enum: ['enabled', 'disabled', 'forbidden', 'deleted']
        },
        disabled: {
          type: 'boolean'
        },
        createdAt: {
          type: 'string',
          format: 'date-time'
        }
      }
    })
  })
})
