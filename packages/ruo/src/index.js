const express = require('express')
const Router = require('router')

const config = require('./config')
const rc = require('./rc')
const utility = require('./utility')
const Pipeline = require('./pipeline')
const mws = require('./middleware')
const logger = require('./logger')
const globals = require('./globals')
const blueprint = require('./blueprint')
const {parseAsync} = require('./swagger')
const {HttpError, ParameterError} = require('./error')

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

async function createApplicationAsync (app, options) {
  if (!app) {
    app = express()
    exports.config = config

    return await _createApplicationAsync(app, config)
  }

  return await _createApplicationAsync(app, options)
}

async function _createApplicationAsync (app, options = {}) {
  try {
    const {
      logger: {name, file, logstash, sentry} = {},
      swagger = {},
      errorHandler,
      model
    } = options

    logger.initialize({name, file, logstash, sentry})
    const {raw, models, services, securitys, middlewares} = await globals.initialize({model})
    exports.app = app
    exports.raw = raw
    exports.models = models
    exports.services = services
    exports.securitys = securitys
    exports.middlewares = exports.mws = middlewares

    const api = await blueprint.initialize(swagger, models)
    exports.api = api
    if (rc.env === 'test') {
      exports.test = require('./supertest').initialize(app, api)
    }
    exports.restMiddleware = () => getRestMiddleware(api, securitys, errorHandler)

    app.use((req, res, next) => {
      req.state = {
        version: api.definition.info.version
      }
      const operation = api.getOperation(req)
      req.swagger = {
        operation: operation
      }
      next()
    })

    return app
  } catch (err) {
    console.log(err.stack) // eslint-disable-line
    process.exit(1)
  }
}

function getRestMiddleware (api, securitys, errorHandler) {
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
  router.use(api.basePathPrefix, mws.errorHandler(api, errorHandler))

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
