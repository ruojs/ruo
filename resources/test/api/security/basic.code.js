module.exports = {
  async get (req, res) {
    res.send({
      username: req.user.username
    })
  }
}
