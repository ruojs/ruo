const _ = require('lodash')

const {forEachOperation} = require('../utility')

const BINDING_KEY = '__security_middleware__'
const HANDLER_NAME = '__name__'

module.exports = (api, middlewares) => {
  const definition = api.definition
  // pre-bind operation to security middleware
  forEachOperation(definition, (path, method, operationDef) => {
    let securitys = operationDef.security || []
    const globalSecurity = definition.security || []
    securitys = securitys.concat(globalSecurity)

    const securityDefinitions = definition.securityDefinitions
    let securityHandlers = securitys.map((security) => {
      security = Object.keys(security)[0]
      const handler = middlewares[securityDefinitions[security]['x-securityHandler']]
      handler[HANDLER_NAME] = security
      return handler
    })
    securityHandlers = _.uniq(securityHandlers)
    operationDef[BINDING_KEY] = securityHandlers
  })

  return (req, res, done) => {
    if (!req.swagger.operation) {
      return done()
    }

    let index = 0
    const securityHandlers = req.swagger.operation.definition[BINDING_KEY]
    const next = (err) => {
      // fast return on first successful authentication
      if (index !== 0 && !err) {
        req.security = securityHandlers[index - 1][HANDLER_NAME]
        return done()
      }
      // return last authentication failure
      if (index === securityHandlers.length) {
        return done(err)
      }
      // TODO: support addtional arguments for security middleware
      let securityHandler = securityHandlers[index]()
      index = index + 1
      securityHandler(req, res, next)
    }
    next()
  }
}
