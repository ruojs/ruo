const {expect} = require('chai')

describe('error-handler', () => {
  it('should return global error code in common middleware', async () => {
    const {body} = await api.get('/exception')
      .expect(400)
    expect(body.name).to.eql('BadRequest')
  })

  it('should return local error code inside handler', async () => {
    const {body} = await api.get('/exception')
      .query({message: 'BadRequest'})
      .expect(400)
    expect(body.name).to.eql('/exception.get.BadRequest')
  })

  it('should return local only error code', async () => {
    const {body} = await api.get('/exception')
      .query({message: 'UnknownException'})
      .expect(500)
    expect(body.name).to.eql('/exception.get.UnknownException')
  })

  it('should return normal error code if x-errors not exist', async () => {
    const {body} = await api.delete('/exception')
      .expect(400)
    expect(body.name).to.eql('BadRequest')
  })
})
