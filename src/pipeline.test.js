const {expect} = require('chai')

const Pipeline = require('./pipeline')

const pipeline = Pipeline()

describe('pipeline', () => {
  it('should return previous middleware result', () => {
    pipeline.use((req, res, obj) => {
      return obj + ' world'
    })
    pipeline.use((req, res, obj) => {
      expect(obj).to.eql('hello world')
    })
    pipeline.start({}, {}, 'hello')
  })
})
