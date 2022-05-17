
const parser = require('ruo-swagger-parser')
const parseUrl = require('url').parse
const fs = require('fs')

const _ = require('lodash')

const Path = require('./path')
const rc = require('../rc')

class Swagger {
  static async createAsync (dynamicDefinition) {
    const root = rc.target
    const cachePath = root + '/spec/swagger.json'
    if (rc.useSwaggerCache && fs.existsSync(cachePath)) {
      const cached = JSON.parse(fs.readFileSync(cachePath, 'utf8'))
      return new Swagger(_.merge(cached, dynamicDefinition))
    }
    const definition = await parser(root,
      '**/*' + rc.suffix.spec,
      rc.suffix.spec,
      'api',
      rc.shadow
    )
    return new Swagger(_.merge(definition, dynamicDefinition))
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
    // The / at the end will match successfully in the express routing rule base
    
    url = url.replace(new RegExp(`${this.basePathPrefix}/{1,2}`), `${this.basePathPrefix}/`)
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
