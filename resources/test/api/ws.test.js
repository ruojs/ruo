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

  it('should able to send private message', async () => {
    const anotherSocket = await createSocket()
    const message = {message: 'world'}
    socket.request({url: '/ws', method: 'PUT', body: message})
    let count = 0
    socket.on('PUT /ws', (res) => {
      expect(res.body).to.eql(message)
      count++
    })
    anotherSocket.on('PUT /ws', (res) => {
      expect(res.body).to.eql(message)
      count++
    })
    await delay()
    expect(count).to.eql(1)
  })
})

function delay () {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('hello world')
    }, 100)
  })
}
