const parseUrl = require('url').parse

const _ = require('lodash')
const JsonRefs = require('json-refs')

const helpers = require('./helpers')
const ParameterValue = require('./parameter-value')

const parameterLocations = ['body', 'formData', 'header', 'path', 'query']

class Parameter {
  constructor (definition, parent, pathToDefinition) {
    this.definition = definition
    this.parent = parent
    this.pathToDefinition = pathToDefinition
    _.assign(this, definition)

    this.pathObject = parent.parent
    this.ptr = JsonRefs.pathToPtr(pathToDefinition)
    this.schema = helpers.computeParameterSchema(definition)
  }

  getValue (req) {
    if (_.isUndefined(req)) {
      throw new TypeError('req is required')
    } else if (parameterLocations.indexOf(this.in) === -1) {
      throw new Error('Invalid \'in\' value: ' + this.in)
    }

    // We do not need to explicitly check the type of req

    const that = this
    const type = this.schema.type
    let pathMatch
    let value

    switch (this.in) {
      case 'body':
        value = req.body
        break
      case 'formData':
      // For formData, either the value is a file or a property of req.body.  req.body as a whole can never be the
      // value since the JSON Schema for formData parameters does not allow a type of 'object'.
        if (type === 'file') {
          if (_.isUndefined(req.files)) {
            throw new Error('req.files must be provided for \'formData\' parameters of type \'file\'')
          }

          value = req.files[this.name]
        } else {
          if (_.isUndefined(req.body)) {
            throw new Error('req.body must be provided for \'formData\' parameters')
          }
          value = req.body[this.name]
        }
        break
      case 'header':
        if (_.isUndefined(req.headers)) {
          throw new Error('req.headers must be provided for \'header\' parameters')
        }

        value = helpers.getHeaderValue(req.headers, this.name)
        break
      case 'path':
        if (_.isUndefined(req.url)) {
          throw new Error('req.url must be provided for \'path\' parameters')
        }

        pathMatch = this.pathObject.regexp.exec(parseUrl(req.url).pathname)

        if (pathMatch) {
          // decode URI component here to avoid issues with encoded slashes
          const index = _.findIndex(this.pathObject.regexp.keys, (key) => key.name === that.name) + 1
          value = decodeURIComponent(pathMatch[index])
        }
        break
      case 'query':
        if (_.isUndefined(req.query)) {
          throw new Error('req.query must be provided for \'query\' parameters')
        }

        value = _.get(req.query, this.name)

        break

      // no default
    }

    return new ParameterValue(this, value)
  }

  setValue (req, value) {
    switch (this.in) {
      case 'formData':
        const type = this.schema.type
        const contentType = helpers.getContentType(req.headers)
        if (type !== 'file' &&
            (contentType === 'application/x-www-form-urlencoded' || contentType === 'multipart/form-data')) {
          req.body[this.name] = value
        }
        break
      case 'query':
        if (value != null) {
          _.set(req.query, this.name, value)
        }
        break

      // no default
    }
  }
}

module.exports = Parameter
