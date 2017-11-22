const path = require('path')

const mock = require('mock-fs')
const expect = require('chai').expect

const {loadStaticConfig} = require('./rc')

const location = path.join(process.cwd(), '.ruorc')

describe('rc', () => {
  afterEach(() => {
    mock.restore()
  })

  it('should use default settings if nothing provided', () => {
    mock({
      [location]: JSON.stringify({})
    })
    const config = loadStaticConfig()
    expect(config.name).to.eql('ruo')
    expect(config.shadow).to.eql(false)
  })

  it('should default target the same as source', () => {
    mock({
      [location]: JSON.stringify({})
    })
    const config = loadStaticConfig()
    expect(config.source).to.eql(config.target)
  })

  it('should expand to absolute path', () => {
    mock({
      [location]: JSON.stringify({
        source: 'src',
        target: 'dist'
      })
    })
    const config = loadStaticConfig()
    expect(config.source).to.eql(path.join(process.cwd(), 'src'))
    expect(config.target).to.eql(path.join(process.cwd(), 'dist'))
  })

  it('should setup env variable', () => {
    mock({
      [location]: JSON.stringify({})
    })
    const config = loadStaticConfig()
    expect(config.env).to.eql('test')
  })
})
