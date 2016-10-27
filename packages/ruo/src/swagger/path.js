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
    return _.find(this.operationObjects, (operationObject) => {
      if (operationObject.method === method.toLowerCase()) {
        return operationObject
      }
    })
  }
}

module.exports = Path
