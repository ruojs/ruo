module.exports = {
  async get (req, res) {
    res.join('room1')
    res.broadcast(req.query)
  },
  async post (req, res) {
    res.send(req.body)
  }
}
