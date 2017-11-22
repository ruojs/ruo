const events = require('events')

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const sinonChai = require('sinon-chai')

const ruo = require('../src')
const createServer = require('./test/app')

// https://github.com/visionmedia/supertest/issues/307
events.EventEmitter.defaultMaxListeners = Infinity

chai.should()
chai.use(sinonChai)
chai.use(chaiAsPromised)

before(() => {
  return createServer()
    .then(() => ruo.createTestApplicationAsync())
})
