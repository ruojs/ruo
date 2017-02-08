const _ = require('lodash')
const Session = require('express-session')
const ioredis = require('ioredis')
const Router = require('router')
const RedisStore = require('connect-redis')(Session)

module.exports = (session) => {
  const router = Router()
  if (session) {
    session = _.clone(session)

    session.store = new RedisStore({
      prefix: session.prefix,
      client: ioredis(session.redis)
    })
    delete session.prefix
    delete session.redis
    router.use(Session(session))
  }
  return router
}
