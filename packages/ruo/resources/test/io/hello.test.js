const {expect} = require('chai')

describe('io hello', () => {
  it('should echo sent request', (done) => {
    const message = {message: 'world'}
    socket.emit('hello', message)
    socket.on('hello', (data) => {
      expect(data).to.eql(message)
      done()
    })
  })
})
