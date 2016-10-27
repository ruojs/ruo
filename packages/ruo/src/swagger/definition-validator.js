const ZSchema = require('z-schema')
const _ = require('lodash')
const resolve = require('json-refs').resolveRefs

const swaggerSchema = require('./swagger-schema.json')

module.exports = validateAsync

async function validateAsync (definition) {
  let valid
  // resolve definition before validation
  definition = (await resolve(definition)).resolved

  const validator = new ZSchema()
  valid = validator.validate(definition, swaggerSchema)
  if (!valid) {
    let validateResult = validator.getLastErrors()
    console.error(JSON.stringify(validateResult, null, '  ')); // eslint-disable-line
    throw new Error(`InvalidSchema: '${validateResult[0].message}' at ${validateResult[0].path}`)
  }

  let paths = definition.paths
  for (let uri in paths) {
    for (let method in paths[uri]) {
      let operation = paths[uri][method]

      // require responses.default.schema
      if (!operation.responses.default || !operation.responses.default.schema) {
        throw new Error(`InvalidSchema ${uri}.${method}.responses.default.schema required`)
      }

      // validate examples
      for (let statusCode in operation.responses) {
        let response = operation.responses[statusCode]
        valid = validateExample(response, `${uri}.${method}.responses.${statusCode}`)
      }

      if (operation.parameters && operation.parameters.length && operation.parameters[0].in === 'body') {
        let parameter = operation.parameters[0]
        valid = validateExample(parameter, `${uri}.${method}.parameters.0`)
      }
    }
  }
}

function validateExample (target, messagePrefix) {
  let examples
  if (target['x-examples'] && typeof target['x-examples'] !== 'object') {
    return true
  }

  examples = target['x-examples']
  if (!examples) {
    try {
      examples = schemaToJson(target.schema)
    } catch (err) {
      if (err.message === 'FileType') {
        // skip file type validation
        return true
      }
      throw err
    }
  }

  const validator = new ZSchema({assumeAdditional: true})
  let valid = validator.validate(examples, target.schema)
  if (!valid) {
    let validateResult = validator.getLastErrors()
    console.error('examples', examples); // eslint-disable-line
    console.error('schema', target.schema); // eslint-disable-line
    console.error(JSON.stringify(validateResult, null, '  ')); // eslint-disable-line
    throw new Error(`InvalidSchemaExample: '${messagePrefix} ${validateResult[0].message}' at ${validateResult[0].path}`); // eslint-disable-line
  }
}

function schemaToJson (schema) {
  if (schema.example !== undefined) {
    return schema.example
  }

  let json
  switch (schema.type) {
    case 'file':
      throw new Error('FileType')
    case 'array':
      json = []
      if (schema.items) {
        json.push(schemaToJson(schema.items))
      }
      break
    case 'number':
      json = 4.2
      break
    case 'integer':
      json = 42
      break
    case 'string':
      json = schema.enum ? schema.enum[0] : 'stringValue'
      break
    case 'boolean':
      json = true
      break
    case 'object':
    default:
      json = {}
      if (schema.properties) {
        _.forEach(schema.properties, (value, key) => {
          json[key] = schemaToJson(value)
        })
      }
      break
  }
  return json
}
