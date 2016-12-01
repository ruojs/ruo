const rc = require('./rc')
const translate = require('./translate')
const Pipeline = require('./pipeline')
const mws = require('./middleware')
const logger = require('./logger')
const initGlobalsAsync = require('./globals')
const blueprint = require('./blueprint')
const {parseAsync} = require('./swagger')
const {HttpError, ParameterError} = require('./error')
const {wrapRoute, wrapMiddleware} = require('./utility')

exports.createApplicationAsync = createApplicationAsync
exports.HttpError = HttpError
// backward compability
exports.ResponseError = HttpError
exports.ParameterError = ParameterError
exports.translate = translate
exports.parseAsync = parseAsync
exports.logger = logger
exports.rc = rc
exports.wrapRoute = wrapRoute
exports.wrapMiddleware = wrapMiddleware

async function createApplicationAsync (app, options = {}) {
  try {
    const {
      logger: {file, logstash, sentry} = {},
      dynamicDefinition = {},
      securityMiddlewares = {},
      errorHandler,
      model
    } = options

    logger.initialize({file, logstash, sentry})
    const {models, services} = await initGlobalsAsync({model})
    const api = await blueprint.initialize(dynamicDefinition, models)

    // TODO: exports.test.api
    exports.app = app
    exports.api = api
    exports.models = models
    exports.services = services

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

    //
    // Response pipeline
    //

    const pipeline = Pipeline()
    pipeline.use(mws.debug.postHandler())
    // remove response `null` fields
    pipeline.use(mws.validation.response())
    pipeline.use(mws.debug.response())
    app.use(pipeline.createMiddleware())

    //
    // Request pipeline
    //

    // binding request context
    app.use(mws.context(rc.target + '/context'))
    // setup swagger documentation
    app.use(mws.docs(api.definition))
    app.use(mws.switch())
    // request & response logging
    app.use(mws.debug.request())
    // request validation
    app.use(mws.validation.request())
    // security handler
    app.use(mws.security(api, securityMiddlewares))
    // dynamic swagger defined route
    app.use(mws.debug.preHandler())
    app.use(mws.api(api))
    // 404
    app.use(() => {
      throw new HttpError('NotFound')
    })
    // error handling
    app.use(mws.errorHandler(api, errorHandler))

    return app
  } catch (err) {
    console.log(err.stack) // eslint-disable-line
    process.exit(1)
  }
}

process.on('unhandledRejection', function (reason, p) {
  let err = new Error('Unhandled Promise rejection')
  err.reason = reason
  err.promise = p
  logger.error('Unhandled Rejection at: Promise ', p, ' reason: ', reason)
  logger.error(reason.message, reason.stack)
  throw err
})
