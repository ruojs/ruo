const pathToRegexp = require('path-to-regexp')
const _ = require('lodash')

const Operation = require('./operation')

class Path {
  constructor (path, definition, parent, pathToDefinition) {
    this.path = path
    this.definition = definition
    this.parent = parent
    this.pathToDefinition = pathToDefinition
    this.regexp = pathToRegexp(parent.basePathPrefix + path.replace(/\{/g, ':').replace(/\}/g, ''))

    this.operationObjects = _.map(definition, (operationDef, method) => {
      return new Operation(method, operationDef, this, pathToDefinition.concat(method))
    })
  }

  getOperation (method) {
    method = method.toLowerCase()
    let getOperationObject
    let object = _.find(this.operationObjects, (operationObject) => {
      if (operationObject.method === 'get') {
        getOperationObject = operationObject
      }
      if (operationObject.method === method) {
        return operationObject
      }
    })
    if (!object && getOperationObject) {
      object = getOperationObject
    }
    return object
  }
}

module.exports = Path
