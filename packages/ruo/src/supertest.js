const url = require('url')

const defaults = require('superagent-defaults')
const supertest = require('supertest')

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
