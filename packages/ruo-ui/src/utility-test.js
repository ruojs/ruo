const {expect} = require('chai')

const utility = require('./utility')

describe('utility', () => {
  describe('schemaToJson', () => {
    it('should extract object schema example', () => {
      const schema = {
        type: 'object',
        required: [],
        properties: {
          prop1: {
            type: 'string',
            example: 'stringValue'
          },
          prop2: {
            type: 'number',
            example: 4.2
          },
          prop3: {
            type: 'integer',
            example: 42
          },
          prop4: {
            type: 'boolean',
            example: true
          }
        }
      }
      expect(utility.schemaToJson(schema)).to.eql({
        prop1: 'stringValue',
        prop2: 4.2,
        prop3: 42,
        prop4: true
      })
    })

    it('should handle nest object definition', () => {
      const schema = {
        type: 'object',
        properties: {
          prop1: {
            type: 'string',
            example: 'stringValue'
          },
          prop2: {
            type: 'object',
            properties: {
              prop21: {
                type: 'number',
                example: 4.2
              },
              prop22: {
                type: 'boolean',
                example: false
              }
            }
          }
        }
      }
      expect(utility.schemaToJson(schema)).to.eql({
        prop1: 'stringValue',
        prop2: {
          prop21: 4.2,
          prop22: false
        }
      })
    })

    it('should handle array items and nest array condition', () => {
      const schema = {
        type: 'object',
        properties: {
          prop1: {
            type: 'string',
            example: 'stringValue'
          },
          prop2: {
            type: 'object',
            properties: {
              prop21: {
                type: 'array',
                items: {
                  type: 'string',
                  example: 'stringValue'
                }
              },
              prop22: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    prop221: {
                      type: 'integer',
                      number: 42
                    }
                  }
                }
              },
              prop23: {
                type: 'array',
                items: {
                  type: 'array',
                  items: {
                    type: 'string',
                    example: 'stringValue'
                  }
                }
              }
            }
          }
        }
      }
      expect(utility.schemaToJson(schema)).to.eql({
        prop1: 'stringValue',
        prop2: {
          prop21: ['stringValue'],
          prop22: [
            {prop221: 42}
          ],
          prop23: [
            ['stringValue']
          ]
        }
      })
    })

    it('should given default value based on field type', () => {
      const schema = {
        type: 'object',
        required: [],
        properties: {
          prop1: {
            type: 'string'
          },
          prop2: {
            type: 'number'
          },
          prop3: {
            type: 'integer'
          },
          prop4: {
            type: 'boolean'
          },
          prop5: {
            type: 'object'
          },
          prop6: {
            type: 'array'
          },
          prop7: {
            type: 'object',
            properties: {
              prop71: {
                type: 'string'
              }
            }
          },
          prop8: {
            type: 'array',
            items: {
              type: 'boolean'
            }
          }
        }
      }
      expect(utility.schemaToJson(schema)).to.eql({
        prop1: 'stringValue',
        prop2: 4.2,
        prop3: 42,
        prop4: true,
        prop5: {},
        prop6: [],
        prop7: {prop71: 'stringValue'},
        prop8: [true]
      })
    })

    it('should support short circuit fast return', () => {
      const schema = {
        type: 'object',
        properties: {
          prop1: {
            type: 'object',
            example: {
              hello: 'world'
            },
            properties: {
              hello: {
                type: 'string',
                example: 'not world'
              }
            }
          },
          prop2: {
            type: 'array',
            example: ['hello', 'world'],
            items: {
              type: 'string',
              example: 'blanblanblan'
            }
          }
        }
      }
      expect(utility.schemaToJson(schema)).to.eql({
        prop1: {
          hello: 'world'
        },
        prop2: [
          'hello',
          'world'
        ]
      })
    })

    it('should handle default schema as object', () => {
      const schema = {
        properties: {
          prop1: {
            type: 'string'
          }
        }
      }
      expect(utility.schemaToJson(schema)).to.eql({
        prop1: 'stringValue'
      })
    })
  })
})
