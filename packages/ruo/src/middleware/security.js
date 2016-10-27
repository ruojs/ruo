const _ = require('lodash')

const {wrapMiddleware, forEachOperation} = require('../utility')

const BINDING_KEY = '__security_middleware__'

module.exports = (api, securityMiddlewares) => {
  const definition = api.definition
  // pre-bind operation to security middleware
  forEachOperation(definition, (path, method, operationDef) => {
    let securitys = operationDef.security || []
    const globalSecurity = definition.security || []
    securitys = securitys.concat(globalSecurity)

    const securityDefinitions = definition.securityDefinitions
    let securityHandlers = securitys.map((security) => {
      security = Object.keys(security)[0]
      return securityDefinitions[security]['x-securityHandler']
    })
    securityHandlers = _.uniq(securityHandlers)
    operationDef[BINDING_KEY] = securityHandlers
  })

  // wrap security middlewares
  _.forEach(securityMiddlewares, (middleware, name) => {
    securityMiddlewares[name] = wrapMiddleware(middleware)
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
        return done()
      }
      // return last authentication failure
      if (index === securityHandlers.length) {
        return done(err)
      }
      let securityHandler = securityMiddlewares[securityHandlers[index]]
      index = index + 1
      securityHandler(req, res, next)
    }
    next()
  }
}
