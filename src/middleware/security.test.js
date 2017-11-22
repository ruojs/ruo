const crypto = require('crypto')

const {expect} = require('chai')

describe('security', () => {
  it('should verify security parameters by yourself', async () => {
    const {body} = await api.get('/security/basic')
      .expect(400)
    expect(body.name).to.eql('BadRequest')
  })

  it('should check if matching username and password', async () => {
    const {body} = await api.get('/security/basic')
      .auth('username', 'invalid password')
      .expect(403)
    expect(body.name).to.eql('Forbidden')
  })

  it('should return current user', async () => {
    const {body} = await api.get('/security/basic')
      .auth('username', md5('username'))
      .expect(200)
    expect(body.username).to.eql('username')
  })

  it('should fast return on first successful authentication', async () => {
    const {body} = await api.get('/security/multiple')
      .set('token', 'example-token')
      .expect(200)
    expect(body.username).to.eql('username')
  })

  it('should one failed authentication wont break request', async () => {
    const {body} = await api.get('/security/multiple')
      .set('token', 'invalid token')
      .auth('username', md5('username'))
      .expect(200)
    expect(body.username).to.eql('username')
  })

  it('should return last authentication failure message', async () => {
    const {body} = await api.get('/security/multiple')
      .set('token', 'invalid token')
      .auth('username', 'invalid password')
      .expect(403)
    expect(body.name).to.eql('Forbidden')
    expect(body.message).to.eql('Invalid username or password')
  })
})

function md5 (str) {
  return crypto.createHash('md5').update(str, 'utf8').digest('hex')
}
