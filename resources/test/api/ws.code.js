module.exports = {
  async get (req, res) {
    res.join('room1').broadcast(req.query, 'room1')
  },
  async post (req, res) {
    res.send(req.body)
  },
  async put (req, res) {
    res.join('same room').broadcast(req.body, `session ${req.session.id}`)
  }
}
