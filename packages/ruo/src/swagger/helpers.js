const _ = require('lodash')

const parameterSchemaProperties = [
  'allowEmptyValue',
  'default',
  'description',
  'enum',
  'exclusiveMaximum',
  'exclusiveMinimum',
  'format',
  'items',
  'maxItems',
  'maxLength',
  'maximum',
  'minItems',
  'minLength',
  'minimum',
  'multipleOf',
  'pattern',
  'type',
  'uniqueItems'
]
const collectionFormats = [undefined, 'csv', 'multi', 'pipes', 'ssv', 'tsv']
const types = ['array', 'boolean', 'integer', 'object', 'number', 'string']

// full-date from http://xml2rfc.ietf.org/public/rfc/html/rfc3339.html#anchor14
const dateRegExp = new RegExp(
  '^' +
  '\\d{4}' + // year
  '-' +
  '([0]\\d|1[012])' + // month
  '-' +
  '(0[1-9]|[12]\\d|3[01])' + // day
  '$')

// date-time from http://xml2rfc.ietf.org/public/rfc/html/rfc3339.html#anchor14
const dateTimeRegExp = new RegExp(
  '^' +
  '\\d{4}' + // year
  '-' +
  '([0]\\d|1[012])' + // month
  '-' +
  '(0[1-9]|[12]\\d|3[01])' + // day
  'T' +
  '([01]\\d|2[0-3])' + // hour
  ':' +
  '[0-5]\\d' + // minute
  ':' +
  '[0-5]\\d' + // second
  '(\\.\\d+)?' + // fractional seconds
  '(Z|(\\+|-)([01]\\d|2[0-4]):[0-5]\\d)' + // Z or time offset
  '$')

/**
 * 不过滤数组元素为null的情况，如
 * `[null, 'foo', null]`过滤后仍然为`[null, 'foo', null]`
 */
exports.prune = (data) => {
  if (_.isArray(data)) {
    _.each(data, exports.prune)
  } else if (_.isObject(data)) {
    _.each(data, function (value, key) {
      if (_.isObject(value)) {
        exports.prune(value)
      } else if (value === null || value === undefined) {
        delete data[key]
      }
    })
  }
  return data
}

exports.getHeaderValue = (headers, headerName) => {
  // Default to an empty object
  headers = headers || {}

  let lcHeaderName = headerName.toLowerCase()
  let realHeaderName = _.find(Object.keys(headers), (header) => {
    return header.toLowerCase() === lcHeaderName
  })

  return headers[realHeaderName]
}

exports.getContentType = (headers) => {
  const string = exports.getHeaderValue(headers, 'content-type') || 'application/octet-stream'
  const index = string.indexOf(';')
  const type = index !== -1 ? string.substr(0, index).trim() : string.trim()
  return type
}

exports.validateAgainstSchema = (validator, schema, value) => {
  schema = _.cloneDeep(schema) // Clone the schema as z-schema alters the provided document

  let response = {
    errors: [],
    warnings: []
  }

  if (!validator.validate(value, schema)) {
    response.errors = _.map(validator.getLastErrors(), function (err) {
      normalizeError(err)

      return err
    })
  }

  return response
}

exports.computeParameterSchema = (definition) => {
  if (_.isUndefined(definition.schema)) {
    const schema = {}

    // Build the schema from the schema-like parameter structure
    _.forEach(parameterSchemaProperties, (name) => {
      if (!_.isUndefined(definition[name])) {
        schema[name] = definition[name]
      }
    })

    return schema
  }

  return definition.schema
}

exports.validateDate = (str) => {
  return dateRegExp.test(str)
}

exports.validateDateTime = (str) => {
  return dateTimeRegExp.test(str)
}

exports.convertValue = (schema, options, value) => {
  let originalValue = value // Used in error reporting for invalid values
  let type = _.isPlainObject(schema) ? schema.type : undefined
  let pValue = value
  let pType = typeof pValue
  let err
  let isDate
  let isDateTime

  // If there is an explicit type provided, make sure it's one of the supported ones
  if (_.has(schema, 'type') && types.indexOf(type) === -1) {
    throw new TypeError('Invalid \'type\' value: ' + type)
  }

  // Since JSON Schema allows you to not specify a type and it is treated as a wildcard of sorts, we should not do any
  // coercion for these types of values.
  if (_.isUndefined(type)) {
    return value
  }

  // If there is no value, do not convert it
  if (_.isUndefined(value) || _.isNull(value)) {
    return undefined
  }

  // Convert Buffer value to String
  // (We use this type of check to identify Buffer objects.  The browser does not have a Buffer type and to avoid having
  //  import the browserify buffer module, we just do a simple check.  This is brittle but should work.)
  if (_.isFunction(value.readUInt8)) {
    value = value.toString(options.encoding)
    pValue = value
    pType = typeof value
  }

  switch (type) {
    case 'array':
      if (_.isString(value)) {
        if (collectionFormats.indexOf(options.collectionFormat) === -1) {
          throw new TypeError('Invalid \'collectionFormat\' value: ' + options.collectionFormat)
        }

        switch (options.collectionFormat) {
          case 'csv':
          case undefined:
            value = value.split(',')
            break
          case 'multi':
            value = [value]
            break
          case 'pipes':
            value = value.split('|')
            break
          case 'ssv':
            value = value.split(' ')
            break
          case 'tsv':
            value = value.split('\t')
            break

            // no default
        }
      }

      if (_.isArray(value)) {
        value = _.map(value, (item, index) => {
          return exports.convertValue(_.isArray(schema.items) ? schema.items[index] : schema.items, options, item)
        })
      }

      break
    case 'boolean':
      if (!_.isBoolean(value)) {
        if (value === 'true') {
          value = true
        } else if (value === 'false') {
          value = false
        } else {
          err = new TypeError('Not a valid boolean: ' + value)
        }
      }

      break
    case 'integer':
      if (!_.isNumber(value)) {
        if (_.isString(value) && _.trim(value).length === 0) {
          value = NaN
        }

        value = Number(value)

        if (_.isNaN(value)) {
          err = new TypeError('Not a valid integer: ' + originalValue)
        }
      }

      break
    case 'number':
      if (!_.isNumber(value)) {
        if (_.isString(value) && _.trim(value).length === 0) {
          value = NaN
        }

        value = Number(value)

        if (_.isNaN(value)) {
          err = new TypeError('Not a valid number: ' + originalValue)
        }
      }
      break
    case 'string':
      if (['date', 'date-time'].indexOf(schema.format) > -1) {
        if (_.isString(value)) {
          isDate = schema.format === 'date' && exports.validateDate(value)
          isDateTime = schema.format === 'date-time' && exports.validateDateTime(value)

          if (!isDate && !isDateTime) {
            err = new TypeError('Not a valid ' + schema.format + ' string: ' + originalValue)
            err.code = 'INVALID_FORMAT'
          } else if (isDate) {
            value = new Date(value + ' 00:00:00')
          } else {
            value = new Date(value)
          }
        }

        if (!_.isDate(value) || value.toString() === 'Invalid Date') {
          err = new TypeError('Not a valid ' + schema.format + ' string: ' + originalValue)

          err.code = 'INVALID_FORMAT'
        }
      } else if (!_.isString(value)) {
        err = new TypeError('Not a valid string: ' + value)
      }

      break

      // no default
  }

  if (!_.isUndefined(err)) {
    // Convert the error to be more like a JSON Schema validation error
    if (_.isUndefined(err.code)) {
      err.code = 'INVALID_TYPE'
      err.message = 'Expected type ' + type + ' but found type ' + pType
    } else {
      err.message = 'Object didn\'t pass validation for format ' + schema.format + ': ' + pValue
    }

    // Format and type errors resemble JSON Schema validation errors
    err.failedValidation = true
    err.path = []

    throw err
  }

  return value
}

function normalizeError (obj) {
  // Remove superfluous error details
  if (_.isUndefined(obj.schemaId)) {
    delete obj.schemaId
  }

  if (obj.inner) {
    _.each(obj.inner, function (nObj) {
      normalizeError(nObj)
    })
  }
}
