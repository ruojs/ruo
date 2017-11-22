module.exports = {
  async post (req, res) {
    res.send({
      query: req.query,
      body: req.body
    })
  }
}
