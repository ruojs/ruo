const parseUrl = require('url').parse

const _ = require('lodash')
const {resolveRefs: resolve} = require('json-refs')

const Path = require('./path')
const parseAsync = require('./parse')
const validateAsync = require('./definition-validator')

class Swagger {
  static async createAsync (dynamicDefinition) {
    const definition = await parseAsync({dynamicDefinition})
    await validateAsync(definition)
    const definitionResolved = (await resolve(definition)).resolved
    return new Swagger(definitionResolved)
  }

  constructor (definition) {
    this.definition = definition
    _.assign(this, definition)

    let basePathPrefix = definition.basePath || '/'
    // Remove trailing slash from the basePathPrefix so we do not end up with double slashes
    if (basePathPrefix.charAt(basePathPrefix.length - 1) === '/') {
      basePathPrefix = basePathPrefix.substring(0, basePathPrefix.length - 1)
    }
    this.basePathPrefix = basePathPrefix

    this.pathObjects = _.map(definition.paths, (pathDef, path) => {
      return new Path(path, pathDef, this, ['paths', path])
    })
  }

  getPath (url) {
    return _.find(this.pathObjects, (pathObject) => {
      return _.isArray(pathObject.regexp.exec(url))
    })
  }

  getOperation (req) {
    const url = parseUrl(req.url).pathname
    const method = req.method

    const path = this.getPath(url)
    if (!path) {
      return undefined
    }

    return path.getOperation(method)
  }
}

exports.Swagger = Swagger
exports.parseAsync = parseAsync
