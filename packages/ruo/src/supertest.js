const url = require('url')
const events = require('events')

const defaults = require('superagent-defaults')
const supertest = require('supertest')

// https://github.com/visionmedia/supertest/issues/307
events.EventEmitter.defaultMaxListeners = Infinity

exports.initialize = function (app, api) {
  const test = {}

  app = defaults(supertest(app))
  app.on('request', (request) => {
    const urlObject = url.parse(request.url)
    urlObject.pathname = api.basePathPrefix + urlObject.pathname
    request.url = url.format(urlObject)
  })
  test.app = app

  return test
}
