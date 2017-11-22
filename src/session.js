const _ = require('lodash')
const Session = require('express-session')
const Redis = require('ioredis')
const RedisStore = require('connect-redis')(Session)

module.exports = function createSession (session) {
  session = _.clone(session)
  const redis = session.redis
  if (redis) {
    session.store = new RedisStore({
      prefix: session.prefix,
      client: Array.isArray(redis) ? new Redis.Cluster(redis) : new Redis(redis)
    })
    delete session.prefix
    delete session.redis
  }
  return Session(session)
}
