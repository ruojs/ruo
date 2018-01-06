const _ = require('lodash')
const getAjv = require('./z-schema')

const Parameter = require('./parameter')
const helpers = require('./helpers')

// addtional __data__ field can used with isSwitchOn to return addtional data in unit test
const ajv = getAjv()

class Operation {
  constructor (method, definition, parent, pathToDefinition) {
    this.method = method
    this.definition = definition
    this.parent = parent
    this.pathToDefinition = pathToDefinition
    _.assign(this, definition)

    this.parameterObjects = _.map(definition.parameters, (parameterDef, index) => {
      return new Parameter(parameterDef, this, pathToDefinition.concat(['parameters', index]))
    })

    this.consumes = this.consumes || parent.parent.consumes || []
    this.validates = {}
  }

  validateContentType (contentType, supportedTypes) {
    const rawContentType = contentType

    if (!_.isUndefined(contentType)) {
      // http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.17
      contentType = contentType.split(';')[0] // Strip the parameter(s) from the content type
    }

    // Check for exact match or mime-type only match
    if (_.indexOf(supportedTypes, rawContentType) === -1 && _.indexOf(supportedTypes, contentType) === -1) {
      return {
        code: 'INVALID_CONTENT_TYPE',
        message: 'Invalid Content-Type (' + contentType + ').  These are supported: ' +
        supportedTypes.join(', '),
        path: []
      }
    }
  }

  validateRequest (req) {
    const results = {
      errors: [],
      warnings: []
    }

    // Validate the Content-Type but only for POST and PUT (The rest do not have bodies)
    if (['post', 'put'].indexOf(this.method) > -1 && req.body && Object.keys(req.body).length) {
      const error = this.validateContentType(helpers.getContentType(req.headers), this.consumes)
      if (error) {
        results.errors.push(error)
      }
    }

    // Validate the parameters
    _.each(this.parameterObjects, (param) => {
      const paramValue = param.getValue(req)
      let vErr

      if (paramValue.valid) {
        param.setValue(req, paramValue.value)
      } else {
        vErr = {
          code: 'INVALID_REQUEST_PARAMETER',
          errors: paramValue.error.errors || [
            {
              code: paramValue.error.code,
              message: paramValue.error.message,
              path: paramValue.error.path
            }
          ],
          in: paramValue.parameterObject.in,
          // Report the actual error if there is only one error.  Otherwise, report a JSON Schema validation error.
          message: 'Invalid parameter (' + param.name + '): ' + ((paramValue.errors || []).length > 1
          ? 'Value failed JSON Schema validation' : paramValue.error.message),
          name: paramValue.parameterObject.name,
          path: paramValue.error.path
        }

        results.errors.push(vErr)
      }
    })

    return results
  }

  validateResponse (req, res, obj) {
    if (req.method.toLowerCase() === 'head') {
      return
    }

    const maybeStatusCode = res ? String(res.statusCode) : 'default'
    let responseDef = _.find(this.definition.responses, (response, responseCode) => {
      return responseCode === maybeStatusCode
    })
    let realStatusCode = maybeStatusCode
    if (!responseDef) {
      realStatusCode = 'default'
      responseDef = this.definition.responses.default
    }
    this.validates[realStatusCode] = this.validates[realStatusCode] || ajv.compile(responseDef.schema)

    if (responseDef && typeof responseDef === 'object') {
      // clone original obj
      const data = helpers.prune(JSON.parse(JSON.stringify(obj)))
      const valid = this.validates[realStatusCode](data)

      if (!valid) {
        return this.validates[realStatusCode].errors
      }
    }
  }
}

module.exports = Operation
