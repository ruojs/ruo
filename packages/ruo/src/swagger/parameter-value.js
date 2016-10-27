const _ = require('lodash')
const JsonRefs = require('json-refs')
const ZSchema = require('z-schema')

const helpers = require('./helpers')
const formatValidators = require('./format-validators')

const validator = new ZSchema({
  breakOnFirstError: false,
  ignoreUnknownFormats: true,
  reportPathAsArray: true,
  assumeAdditional: true
})
// Add the custom validators
_.each(formatValidators, function (handler, name) {
  ZSchema.registerFormat(name, handler)
})

class ParameterValue {
  constructor (parameterObject, raw) {
    let pPath = JsonRefs.pathFromPtr(parameterObject.ptr)
    let processed = false
    let schema = parameterObject.schema
    let error
    let isValid
    let processedValue

    this.parameterObject = parameterObject
    this.raw = raw

    // Use Object.defineProperty for 'value' to allow for lazy processing of the raw value
    Object.defineProperties(this, {
      error: {
        enumerable: true,
        get: function () {
          // Always call this.valid to ensure we validate the value prior to returning any values
          if (this.valid === true) {
            return undefined
          }

          return error
        }
      },
      valid: {
        enumerable: true,
        get: function () {
          let result = {
            errors: [],
            warnings: []
          }
          let skipValidation = false
          let value
          let vError

          if (_.isUndefined(isValid)) {
            isValid = true
            value = this.value

            if (_.isUndefined(error)) {
              try {
                // Validate requiredness
                if (parameterObject.required === true && _.isUndefined(value)) {
                  vError = new Error('Value is required but was not provided')

                  vError.code = 'REQUIRED'

                  throw vError
                }

                // Cases we do not want to do schema validation:
                //
                //   * The schema explicitly allows empty values and the value is empty
                //   * The schema allow optional values and the value is undefined
                //   * The schema defines a file parameter
                //   * The schema is for a string type with date/date-time format and the value is a date
                //   * The schema is for a string type and the value is a Buffer
                if ((_.isUndefined(parameterObject.required) || parameterObject.required === false) &&
                    _.isUndefined(value)) {
                  skipValidation = true
                } else if (schema.allowEmptyValue === true && value === '') {
                  skipValidation = true
                } else if (parameterObject.type === 'file') {
                  skipValidation = true
                } else if (schema.type === 'string') {
                  if (['date', 'date-time'].indexOf(schema.format) > -1 && _.isDate(value)) {
                    skipValidation = true
                  } else if (schema.type === 'string' && _.isFunction(value.readUInt8)) {
                    skipValidation = true
                  }
                }

                if (!skipValidation) {
                  // Validate against JSON Schema
                  result = helpers.validateAgainstSchema(validator, parameterObject.schema, value)
                }

                if (result.errors.length > 0) {
                  vError = new Error('Value failed JSON Schema validation')

                  vError.code = 'SCHEMA_VALIDATION_FAILED'
                  vError.errors = result.errors

                  throw vError
                }
              } catch (err) {
                err.failedValidation = true
                err.path = pPath

                error = err
                isValid = false
              }
            } else {
              isValid = false
            }
          }

          return isValid
        }
      },
      value: {
        enumerable: true,
        get: function () {
          if (!processed) {
            if (schema.type === 'file') {
              processedValue = raw
            } else {
              // Convert/Coerce the raw value from the request object
              try {
                processedValue = helpers.convertValue(schema, {
                  collectionFormat: parameterObject.collectionFormat
                }, raw)
              } catch (err) {
                error = err
              }

              // If there is still no value and there are no errors, use the default value if available (no coercion)
              if (_.isUndefined(processedValue) && _.isUndefined(error)) {
                if (schema.type === 'array') {
                  if (_.isArray(schema.items)) {
                    processedValue = _.reduce(schema.items, function (items, item) {
                      items.push(item.default)

                      return items
                    }, [])

                    // If none of the items have a default value reset the processed value to 'undefined'
                    if (_.every(processedValue, _.isUndefined)) {
                      processedValue = undefined
                    }
                  } else if (!_.isUndefined(schema.items) && !_.isUndefined(schema.items.default)) {
                    processedValue = [schema.items.default]
                  }
                } else if (!_.isUndefined(schema.default)) {
                  processedValue = schema.default
                }
              }
            }

            processed = true
          }

          return processedValue
        }
      }
    })
  }
}

module.exports = ParameterValue
