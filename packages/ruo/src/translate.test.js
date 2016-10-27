const {expect} = require('chai')

const translate = require('./translate')

describe('translate', () => {
  it('should translate from uri to location', () => {
    expect(translate.toCode('/demo/hello')).to.eql('api/demo/hello.code.js')
    expect(translate.toTest('/demo/hello')).to.eql('api/demo/hello.test.js')
    expect(translate.toSpec('/demo/hello')).to.eql('api/demo/hello.spec.yaml')
  })
  it('should translate from location to uri', () => {
    expect(translate.fromCode('api/demo/hello.code.js')).to.eql('/demo/hello')
    expect(translate.fromTest('api/demo/hello.test.js')).to.eql('/demo/hello')
    expect(translate.fromSpec('api/demo/hello.spec.yaml')).to.eql('/demo/hello')
  })
  it('should detect location pattern', () => {
    expect(translate.isCode('api/demo/hello.code.js')).to.eql(true)
    expect(translate.isTest('api/demo/hello.test.js')).to.eql(true)
    expect(translate.isSpec('api/demo/hello.spec.yaml')).to.eql(true)

    expect(translate.isCode('api/demo/hello.test.js')).to.eql(false)
    expect(translate.isCode('api/demo/hello.code.yaml')).to.eql(false)
  })
})
