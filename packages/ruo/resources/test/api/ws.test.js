const {expect} = require('chai')

describe('ws', () => {
  it('should echo sent request body', async () => {
    const message = {message: 'world'}
    const res = await socket.request({url: '/ws', method: 'POST', body: message})
    expect(res).to.eql(message)
  })
})
