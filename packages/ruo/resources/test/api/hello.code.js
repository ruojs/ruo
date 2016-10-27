module.exports = {
  async get (req, res) {
    // delayed response
    res.send({message: await delay()})
  }
}

function delay () {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('hello world')
    }, 10)
  })
}
