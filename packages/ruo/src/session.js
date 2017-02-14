const _ = require('lodash')
const Session = require('express-session')
const ioredis = require('ioredis')
const RedisStore = require('connect-redis')(Session)

module.exports = function createSession (session) {
  session = _.clone(session)

  if (session.redis) {
    session.store = new RedisStore({
      prefix: session.prefix,
      client: ioredis(session.redis)
    })
    delete session.prefix
    delete session.redis
  }
  return Session(session)
}
