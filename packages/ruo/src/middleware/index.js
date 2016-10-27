require('moder')(__dirname, {
  naming: 'camel',
  lazy: false,
  exports,
  filter (filename) {
    return filename[0] === '.' || filename.indexOf('.test.js') !== -1
  }
})
