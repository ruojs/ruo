const {expect} = require('chai')

describe('index', () => {
  it('should return 404 NotFound if request a not exist api', async () => {
    const {body} = await api.get('/not/exist/path')
      .expect(404)
    expect(body.name).to.eql('NotFound')
  })
})
