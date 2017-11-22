const auth = require('basic-auth')
const crypto = require('crypto')

const {HttpError} = require('../../../src')

function md5 (str) {
  return crypto.createHash('md5').update(str, 'utf8').digest('hex')
}

module.exports = () => async (req) => {
  const query = auth(req)
  if (!query) {
    throw new HttpError('BadRequest', 'Require username and password')
  }

  if (md5(query.name) !== query.pass) {
    throw new HttpError('Forbidden', 'Invalid username or password')
  }

  req.user = {
    username: query.name,
    password: query.pass
  }
}
