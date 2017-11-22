const {expect} = require('chai')
const _ = require('lodash')

const validateAsync = require('./definition-validator')
const SPEC_TEMPLATE = {
  swagger: '2.0',
  info: {version: '0.0.0', title: 'Example RESTful API'},
  host: 'localhost:8088'
}

describe('swagger/definition-validator', () => {
  it('should verify paths exist', async () => {
    await expect(validateAsync(SPEC_TEMPLATE)).to.be.rejectedWith('Missing required property: paths')

    let definition = _.clone(SPEC_TEMPLATE)
    definition.paths = {}
    await expect(validateAsync(definition)).to.not.be.rejected
  })

  it('should verify responses exist', async () => {
    let definition = _.clone(SPEC_TEMPLATE)
    definition.paths = {
      '/path': {
        get: {
        }
      }
    }
    await expect(validateAsync(definition)).to.be.rejectedWith('Missing required property: responses')
  })

  it('should verify responses status code exist', async () => {
    let definition = _.clone(SPEC_TEMPLATE)
    definition.paths = {
      '/path': {
        get: {
          responses: {

          }
        }
      }
    }
    await expect(validateAsync(definition)).to.be.rejectedWith('Too few properties defined')
  })

  it('should verify security being array', async () => {
    let definition

    definition = _.clone(SPEC_TEMPLATE)
    definition.paths = {
      '/path': {
        get: {
          security: {},
          responses: {
            default: {
              schema: {}
            }
          }
        }
      }
    }
    await expect(validateAsync(definition)).to.be.rejectedWith('Expected type array but found type object')

    definition = _.clone(SPEC_TEMPLATE)
    definition.paths = {
      '/path': {
        get: {
          security: [],
          responses: {
            default: {
              schema: {}
            }
          }
        }
      }
    }
    await expect(validateAsync(definition)).to.not.be.rejected
  })

  it('should verify responses.default.schema exist', async () => {
    let definition

    definition = _.clone(SPEC_TEMPLATE)
    definition.paths = {
      '/path': {
        get: {
          responses: {
            200: {

            }
          }
        }
      }
    }
    await expect(validateAsync(definition)).to.be.rejectedWith('responses.default.schema required')

    definition = _.clone(SPEC_TEMPLATE)
    definition.paths = {
      '/path': {
        get: {
          responses: {
            default: {
              schema: {}
            }
          }
        }
      }
    }
    await expect(validateAsync(definition)).to.not.be.rejected
  })

  it('should verify parameter and response x-examples', async () => {
    let definition

    definition = _.clone(SPEC_TEMPLATE)
    definition.paths = {
      '/path': {
        get: {
          responses: {
            default: {
              'x-examples': {
                field: 42
              },
              schema: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string'
                  }
                }
              }
            }
          }
        }
      }
    }
    await expect(validateAsync(definition)).to.be.rejectedWith('InvalidSchemaExample')

    definition = _.clone(SPEC_TEMPLATE)
    definition.paths = {
      '/path': {
        get: {
          responses: {
            default: {
              'x-examples': {
                field: 'stringValue'
              },
              schema: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string'
                  }
                }
              }
            }
          }
        }
      }
    }
    await expect(validateAsync(definition)).to.not.be.rejected
  })
})
