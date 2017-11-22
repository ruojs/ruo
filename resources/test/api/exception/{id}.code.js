const {HttpError} = require('../../../../src')

module.exports = {
  async get (req, res) {
    if (req.query.message === 'BadRequest') {
      throw new HttpError('BadRequest')
    }

    if (req.query.message === 'UnknownException') {
      throw new HttpError('UnknownException')
    }

    res.send({message: 'ok'})
  }
}
