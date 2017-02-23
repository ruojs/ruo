const http = require('http')

const express = require('express')
const Router = require('router')

const rc = require('./rc')
const utility = require('./utility')
const Pipeline = require('./pipeline')
const mws = require('./middleware')
const logger = require('./logger')
const globals = require('./globals')
const blueprint = require('./blueprint')
const {parseAsync} = require('./swagger')
const {HttpError, ParameterError} = require('./error')
const createWebSocketApplication = require('./ws')
const createSession = require('./session')
const createTestApplicationAsync = require('./supertest')

exports.createApplicationAsync = createApplicationAsync
// backward compability
exports.ResponseError = exports.HttpError = HttpError
exports.ParameterError = ParameterError
exports.translate = exports.utility = utility
exports.parseAsync = parseAsync
exports.logger = logger
exports.rc = rc
exports.wrapRoute = utility.wrapRoute
exports.wrapMiddleware = utility.wrapMiddleware

async function createApplicationAsync (app, config = {}) {
  try {
    if (!app) {
      app = express()
      config = require('./config')
      exports.config = config
    }

    logger.initialize(config.logger)
    const server = http.createServer(app)
    const {
      raw,
      models,
      DataTypes,
      QueryTypes,
      query,
      services,
      securitys,
      middlewares
    } = await globals.initialize({model: config.model})

    exports.app = app
    exports.raw = raw
    exports.models = models
    exports.DataTypes = DataTypes
    exports.QueryTypes = QueryTypes
    exports.query = query
    exports.services = services
    exports.securitys = securitys
    exports.middlewares = exports.mws = middlewares

    const api = await blueprint.initialize(config.swagger, models)
    exports.api = api
    exports.createTestApplicationAsync = () => createTestApplicationAsync(app, api, config)
    exports.getRestMiddleware = exports.restMiddleware = () => getRestMiddleware(api, securitys, config)

    if (config.session) {
      app.use(createSession(config.session))
    }

    if (config.ws) {
      const wsapp = createWebSocketApplication(server, api, config.ws)
      app.wsapp = wsapp
      exports.wsapp = wsapp
      // TODO: find a better way to mount handle in the end
      setImmediate(() => {
        wsapp.use(exports.getRestMiddleware())
      })
    }

    app.listen = function listen () {
      return server.listen.apply(server, arguments)
    }

    return app
  } catch (err) {
    console.log(err.stack) // eslint-disable-line
    process.exit(1)
  }
}

function getRestMiddleware (api, securitys, config) {
  const router = Router()

  //
  // Response pipeline
  //

  const pipeline = Pipeline()
  pipeline.use(mws.debug.postHandler())
  // remove response `null` fields
  pipeline.use(mws.validation.response())
  pipeline.use(mws.debug.response())
  router.use(pipeline.createMiddleware())

  //
  // Request pipeline
  //

  router.use((req, res, next) => {
    req.state = {
      version: api.definition.info.version
    }
    const operation = api.getOperation(req)
    req.swagger = {
      operation: operation
    }
    next()
  })
  // binding request context
  router.use(mws.context(rc.target + '/context'))
  // setup swagger documentation
  router.use(mws.docs(api.definition))
  router.use(mws.switch())
  // request & response logging
  router.use(mws.debug.request())
  // request validation
  router.use(mws.validation.request())
  // security handler
  router.use(mws.security(api, securitys))
  // dynamic swagger defined route
  router.use(mws.debug.preHandler())
  router.use(api.basePathPrefix, mws.api(api))

  // 404
  router.use(api.basePathPrefix, () => {
    throw new HttpError('NotFound')
  })

  // error handling
  router.use(api.basePathPrefix, mws.errorHandler(api, config.errorHandler))

  return router
}

process.on('unhandledRejection', function (reason, p) {
  let err = new Error('Unhandled Promise rejection')
  err.reason = reason
  err.promise = p
  logger.error('Unhandled Rejection at: Promise ', p, ' reason: ', reason)
  logger.error(reason.message, reason.stack)
  throw err
})
