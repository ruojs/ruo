const _ = require('lodash')

const TYPE_MAPPING = {
  string: ['string'],
  text: ['string'],
  integer: ['integer'],
  float: ['number'],
  date: ['string', 'date'],
  time: ['string'],
  datetime: ['string', 'date-time'],
  boolean: ['boolean'],
  binary: ['file'], // TODO: or ['string', 'binary'] ?
  array: ['array'],
  json: ['object'] // TODO: or [['object', 'array', 'string', 'number', 'boolean', 'null']]
}

const VALIDATION_MAPPING = {
  max: 'maximum',
  min: 'minimum',
  maxLength: 'maxLength',
  minLength: 'minLength',
  regex: 'pattern',
  enum: 'enum'
}

// convert model definition to json schema
exports.modelToJsonSchema = (model) => {
  const schema = {type: 'object', required: [], properties: {}}

  _.forEach(model, (modelField, name) => {
    if (modelField.required) {
      schema.required.push(name)
    }

    const type = TYPE_MAPPING[modelField.type]
    const schemaField = schema.properties[name] = {
      type: type[0]
    }
    if (type[1]) {
      schemaField.format = type[1]
    }

    _.forEach(VALIDATION_MAPPING, (to, from) => {
      if (modelField[from]) {
        schemaField[to] = modelField[from]
      }
    })
  })

  return schema
}
