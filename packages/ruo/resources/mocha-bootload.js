const events = require('events')

const supertest = require('supertest')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

const createServer = require('./test/server')

// https://github.com/visionmedia/supertest/issues/307
events.EventEmitter.defaultMaxListeners = Infinity

chai.use(chaiAsPromised)

before(() => {
  return createServer()
    .then((app) => {
      global.api = supertest(app)
    })
})
