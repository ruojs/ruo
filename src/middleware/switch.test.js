const {expect} = require('chai')
const Switch = require('./switch')()

describe('switch', () => {
  it('should switch on test', (done) => {
    const req = {
      get: function() {
        return JSON.stringify({
          test: true
        })
      }
    }
    const res = {}
    Switch(req, res, () => {
      expect(req.isSwitchOn('test')).to.equal(true)
      done()
    })
  })

  it('should switch off test', (done) => {
    const req = {
      get: function () {}
    }
    const res = {}
    Switch(req, res, () => {
      expect(req.isSwitchOn('test')).to.equal(false)
      done()
    })
  })
})