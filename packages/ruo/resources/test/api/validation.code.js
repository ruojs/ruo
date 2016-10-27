module.exports = {
  async get (req, res) {
    res.send({message: 'ok'})
  },
  async post (req, res) {
    res.send(req.body)
  }
}
