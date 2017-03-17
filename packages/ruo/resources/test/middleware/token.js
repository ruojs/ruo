const crypto = require('crypto')

const {HttpError} = require('../../../src')

function md5 (str) {
  return crypto.createHash('md5').update(str, 'utf8').digest('hex')
}

const TOKEN_STORAGE = {
  'example-token': {
    username: 'username',
    password: md5('username')
  }
}

module.exports = () => async (req) => {
  let token = req.header('token')

  if (TOKEN_STORAGE[token] === undefined) {
    throw new HttpError('Forbidden', 'Invalid Access Token')
  }

  const user = TOKEN_STORAGE[token]
  req.user = {
    username: user.username,
    password: user.password
  }
}
