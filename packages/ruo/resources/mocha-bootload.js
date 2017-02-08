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

before((done) => {
  createServer()
    .then((app) => {
      global.api = ruo.test.app
      app.listen(8088)
      global.socket = require('socket.io-client')(`http://localhost:8088`)
      socket.on('connect', () => {
        done()
      })
    })
})
