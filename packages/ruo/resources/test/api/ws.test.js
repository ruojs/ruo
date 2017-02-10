const {expect} = require('chai')

describe('ws', () => {
  it('should receive broadcast event', (done) => {
    const message = {message: 'world'}
    socket.request({url: '/ws', method: 'GET', query: message})
    socket.on('GET /ws', (res) => {
      expect(res.body).to.eql(message)
      done()
    })
  })

  it('should echo sent request body', async () => {
    const message = {message: 'world'}
    const res = await socket.request({url: '/ws', method: 'POST', body: message})
    expect(res.body).to.eql(message)
  })
})
