const joinPath = require('path').join

const _ = require('lodash')
const glob = require('glob')
const debug = require('debug')('ruo')
const {resolveRefs: resolve} = require('json-refs')

const rc = require('./rc')
const {Swagger} = require('./swagger')
const translate = require('./translate')
const parseAsync = require('./swagger/parse')
const validateAsync = require('./swagger/definition-validator')

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

exports.initialize = async (dynamicDefinition, models) => {
  const definition = await parseAsync({dynamicDefinition})
  // load model definitions
  const modelsDef = definition['x-models'] = {}
  _.forEach(models, (model) => {
    modelsDef[model.identity] = exports.modelToJsonSchema(model.definition)
  })
  await validateAsync(definition)

  // generate blueprint api definition and implementation
  _.forEach(models, (model) => {
    if (model.blueprint) {
      exports.createBlueprint(definition.paths, model)
    }
  })

  // read api implementation and bind them into definition
  glob.sync(`**/*${rc.suffix.code}`, {cwd: rc.target}).sort().forEach((file) => {
    const codePath = joinPath(rc.target, file)
    debug('require', codePath)
    const mod = require(codePath)
    if (rc.shadow) {
      _.forEach(mod, (handlers, path) => {
        exports.bindHandlers(definition, handlers, path)
      })
    } else {
      const path = translate.fromCode(file)
      exports.bindHandlers(definition, mod, path)
    }
  })

  const definitionResolved = (await resolve(definition)).resolved
  return new Swagger(definitionResolved)
}

exports.bindHandlers = (definition, handlers, path) => {
  _.forEach(handlers, (handler, method) => {
    // bind handler only when api is defined
    const operationDef = _.get(definition.paths, [path, method])
    if (operationDef) {
      operationDef.__handler__ = handler
    }
  })
}

// convert model definition to json schema
exports.modelToJsonSchema = (definition) => {
  const schema = {type: 'object', required: [], properties: {}}

  _.forEach(definition, (defField, name) => {
    if (defField.required) {
      schema.required.push(name)
    }

    const type = TYPE_MAPPING[defField.type]
    const schemaField = schema.properties[name] = {
      type: type[0]
    }
    if (type[1]) {
      schemaField.format = type[1]
    }

    _.forEach(VALIDATION_MAPPING, (to, from) => {
      if (defField[from]) {
        schemaField[to] = defField[from]
      }
    })
  })

  if (schema.required.length === 0) {
    delete schema.required
  }

  return schema
}

exports.createBlueprint = (paths, model) => {
  const resource = model.identity

  // POST /resource
  _.set(paths, [`/${resource}`, 'post'], {
    tags: [resource],
    summary: `create ${resource}`,
    parameters: [{
      name: resource,
      in: 'body',
      schema: {
        $ref: `#/x-models/${resource}`
      }
    }],
    responses: {
      201: {
        schema: {
          $ref: `#/x-models/${resource}`
        }
      },
      default: {
        schema: {
          $ref: '#/definitions/Error'
        }
      }
    },
    __handler__: function *create (req, res) {
      res.status(201).send(yield model.create(req.body))
    }
  })

  // GET /resource
  _.set(paths, [`/${resource}`, 'get'], {
    tags: [resource],
    summary: `find ${resource}`,
    parameters: [{
      name: resource,
      in: 'body',
      schema: {
        type: 'object',
        properties: {
          $ref: `#/x-models/${resource}/properties`
        }
      }
    }],
    responses: {
      200: {
        schema: {
          type: 'array',
          items: {
            $ref: `#/x-models/${resource}`
          }
        }
      },
      default: {
        schema: {
          $ref: '#/definitions/Error'
        }
      }
    },
    __handler__: function *find (req, res) {
      res.send(yield model.find(req.query))
    }
  })

  // GET /resource/{id}
  _.set(paths, [`/${resource}/{id}`, 'get'], {
    tags: [resource],
    summary: `get ${resource} by id`,
    responses: {
      200: {
        schema: {
          $ref: `#/x-models/${resource}`
        }
      },
      default: {
        schema: {
          $ref: '#/definitions/Error'
        }
      }
    },
    __handler__: function *findOne (req, res) {
      res.send(yield model.findOne({id: req.params.id}))
    }
  })

  // PUT /resource/{id}
  _.set(paths, [`/${resource}/{id}`, 'put'], {
    tags: [resource],
    summary: `update ${resource} by id`,
    parameters: [{
      name: resource,
      in: 'body',
      schema: {
        type: 'object',
        properties: {
          $ref: `#/x-models/${resource}/properties`
        }
      }
    }],
    responses: {
      200: {
        schema: {
          $ref: `#/x-models/${resource}`
        }
      },
      default: {
        schema: {
          $ref: '#/definitions/Error'
        }
      }
    },
    __handler__: function *update (req, res) {
      res.send((yield model.update({id: req.params.id}, req.body))[0])
    }
  })

  // DELETE /resource/{id}
  _.set(paths, [`/${resource}/{id}`, 'delete'], {
    tags: [resource],
    summary: `delete ${resource} by id`,
    responses: {
      200: {
        schema: {
          $ref: `#/x-models/${resource}`
        }
      },
      default: {
        schema: {
          $ref: '#/definitions/Error'
        }
      }
    },
    __handler__: function *destroy (req, res) {
      res.send((yield model.destroy({id: req.params.id}))[0])
    }
  })

  return paths
}
