const {expect} = require('chai')
const sinon = require('sinon')

const utility = require('./utility')

describe('utility', () => {
  it('should generator or async middleware call subsequence middleware', async () => {
    let next
    let middleware

    const generator = function *(req, res) { return yield delay(1) }
    next = sinon.spy()
    middleware = utility.wrapMiddleware(generator)
    middleware({}, {}, next)
    await delay(10)
    expect(next).to.be.called

    const asyncawait = async function (req, res) { return await delay(1) }
    next = sinon.spy()
    middleware = utility.wrapMiddleware(asyncawait)
    middleware({}, {}, next)
    await delay(10)
    expect(next).to.be.called
  })

  it('should generator or async router dont call next', async () => {
    let next
    let middleware

    const generator = function *(req, res) { return yield delay(1) }
    next = sinon.spy()
    middleware = utility.wrapRoute(generator)
    middleware({}, {}, next)
    await delay(10)
    expect(next).to.not.be.called

    const asyncawait = async function (req, res) { return await delay(1) }
    next = sinon.spy()
    middleware = utility.wrapRoute(asyncawait)
    middleware({}, {}, next)
    await delay(10)
    expect(next).to.not.be.called
  })

  it('should utility from uri to location', () => {
    expect(utility.toCode('/demo/hello')).to.eql('api/demo/hello.code.js')
    expect(utility.toTest('/demo/hello')).to.eql('api/demo/hello.test.js')
    expect(utility.toSpec('/demo/hello')).to.eql('api/demo/hello.spec.yaml')
  })
  it('should utility from location to uri', () => {
    expect(utility.fromCode('api/demo/hello.code.js')).to.eql('/demo/hello')
    expect(utility.fromTest('api/demo/hello.test.js')).to.eql('/demo/hello')
    expect(utility.fromSpec('api/demo/hello.spec.yaml')).to.eql('/demo/hello')
  })
  it('should detect location pattern', () => {
    expect(utility.isCode('api/demo/hello.code.js')).to.eql(true)
    expect(utility.isTest('api/demo/hello.test.js')).to.eql(true)
    expect(utility.isSpec('api/demo/hello.spec.yaml')).to.eql(true)

    expect(utility.isCode('api/demo/hello.test.js')).to.eql(false)
    expect(utility.isCode('api/demo/hello.code.yaml')).to.eql(false)
  })
})

function delay (timeout) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(timeout)
    }, timeout)
  })
}
