const {expect} = require('chai')

const {createRouter} = require('../../../src').utility

describe('ws', () => {
  it('should echo sent request body', (done) => {
    const route = createRouter((reply) => {
      socket.on('rep', reply)
    })
    const message = {message: 'world'}
    socket.emit('req', route({url: '/ws', method: 'POST', body: message}, (data) => {
      expect(data).to.eql(message)
      done()
    }))
  })
})
