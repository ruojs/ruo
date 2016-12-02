const joinPath = require('path').join

const _ = require('lodash')
const glob = require('glob')
const debug = require('debug')('ruo')
const {resolveRefs: resolve} = require('json-refs')
const pascalcase = require('uppercamelcase')

const rc = require('./rc')
const {Swagger} = require('./swagger')
const utility = require('./utility')
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
  _.forEach(models, (model) => {
    if (model.blueprint) {
      const modelName = exports.getModelName(model.identity)
      definition.definitions[modelName] = exports.modelToJsonSchema(model.definition)
    }
  })
  await validateAsync(definition)

  const pathDefs = definition.paths
  // read api implementation and bind them into definition
  glob.sync(`**/*${rc.suffix.code}`, {cwd: rc.target}).sort().forEach((file) => {
    const codePath = joinPath(rc.target, file)
    debug('require', codePath)
    const mod = require(codePath)
    if (rc.shadow) {
      _.forEach(mod, (handlers, path) => {
        exports.bindHandlers(pathDefs, handlers, path)
      })
    } else {
      const path = utility.fromCode(file)
      exports.bindHandlers(pathDefs, mod, path)
    }
  })

  // generate blueprint api definition and implementation
  _.forEach(models, (model) => {
    if (model.blueprint) {
      const actions = exports.getBlueprintActions(model)
      const blueprintDefinitions = exports.getBlueprintDefinitions(model)
      const blueprintHandlers = exports.getBlueprintHandlers(model)
      _.forEach(actions, (pathAndMethod, action) => {
        if (model.blueprint[action]) {
          if (!_.has(pathDefs, pathAndMethod)) {
            _.set(pathDefs, pathAndMethod, blueprintDefinitions[action])
          }
          if (!_.has(pathDefs, pathAndMethod.concat('__handler__'))) {
            _.set(pathDefs, pathAndMethod.concat('__handler__'), blueprintHandlers[action])
          }
        }
      })
    }
  })

  const definitionResolved = (await resolve(definition)).resolved
  return new Swagger(definitionResolved)
}

exports.bindHandlers = (pathDefs, handlers, path) => {
  _.forEach(handlers, (handler, method) => {
    // bind handler only when api is defined
    const operationDef = _.get(pathDefs, [path, method])
    if (operationDef) {
      operationDef.__handler__ = handler
    }
  })
}

exports.getModelName = (identity) => {
  return `${pascalcase(identity)}Model`
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

exports.getBlueprintActions = (model) => {
  const resource = model.identity
  return {
    create: [`/${resource}`, 'post'],
    find: [`/${resource}`, 'get'],
    findOne: [`/${resource}/{id}`, 'get'],
    update: [`/${resource}/{id}`, 'put'],
    destroy: [`/${resource}/{id}`, 'delete']
  }
}

exports.getBlueprintDefinitions = (model) => {
  const resource = model.identity
  const modelName = exports.getModelName(model.identity)
  const blueprint = model.blueprint
  return {
    create: {
      tags: [resource],
      security: blueprint.create,
      summary: `create ${resource}`,
      parameters: [{
        name: resource,
        in: 'body',
        schema: {
          $ref: `#/definitions/${modelName}`
        }
      }],
      responses: {
        201: {
          schema: {
            $ref: `#/definitions/${modelName}`
          }
        },
        default: {
          schema: {
            $ref: '#/definitions/Error'
          }
        }
      }
    },
    find: {
      tags: [resource],
      security: blueprint.find,
      summary: `find ${resource}`,
      parameters: [{
        name: resource,
        in: 'body',
        schema: {
          type: 'object',
          properties: {
            $ref: `#/definitions/${modelName}/properties`
          }
        }
      }],
      responses: {
        200: {
          schema: {
            type: 'array',
            items: {
              $ref: `#/definitions/${modelName}`
            }
          }
        },
        default: {
          schema: {
            $ref: '#/definitions/Error'
          }
        }
      }
    },
    findOne: {
      tags: [resource],
      security: blueprint.findOne,
      summary: `get ${resource} by id`,
      responses: {
        200: {
          schema: {
            $ref: `#/definitions/${modelName}`
          }
        },
        default: {
          schema: {
            $ref: '#/definitions/Error'
          }
        }
      }
    },
    update: {
      tags: [resource],
      security: blueprint.update,
      summary: `update ${resource} by id`,
      parameters: [{
        name: resource,
        in: 'body',
        schema: {
          type: 'object',
          properties: {
            $ref: `#/definitions/${modelName}/properties`
          }
        }
      }],
      responses: {
        200: {
          schema: {
            $ref: `#/definitions/${modelName}`
          }
        },
        default: {
          schema: {
            $ref: '#/definitions/Error'
          }
        }
      }
    },
    destroy: {
      tags: [resource],
      security: blueprint.destroy,
      summary: `delete ${resource} by id`,
      responses: {
        200: {
          schema: {
            $ref: `#/definitions/${modelName}`
          }
        },
        default: {
          schema: {
            $ref: '#/definitions/Error'
          }
        }
      }
    }
  }
}

exports.getBlueprintHandlers = (model) => {
  return {
    *create (req, res) {
      res.status(201).send(yield model.create(req.body))
    },
    *find (req, res) {
      res.send(yield model.find(req.query))
    },
    *findOne (req, res) {
      res.send(yield model.findOne({id: req.params.id}))
    },
    *update (req, res) {
      res.send((yield model.update({id: req.params.id}, req.body))[0])
    },
    *destroy (req, res) {
      res.send((yield model.destroy({id: req.params.id}))[0])
    }
  }
}
