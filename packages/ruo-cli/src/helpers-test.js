const {expect} = require('chai')

const {filterByFn} = require('./helpers')

describe('filterByFn', () => {
  const fn = (obj) => obj && obj['x-private'] === true
  const filter = filterByFn.bind(null, fn)

  it('should skip primitive types', () => {
    expect(filter(123)).to.deep.equal(123)
    expect(filter('123')).to.deep.equal('123')
    expect(filter(null)).to.deep.equal(null)
    expect(filter([1, 2, '3'])).to.deep.equal([1, 2, '3'])
    expect(filter({foo: 'bar'})).to.deep.equal({foo: 'bar'})
  })

  it('should ignore top level element', () => {
    expect(filter({
      'x-private': true,
      foo: 'bar'
    })).to.eql({
      'x-private': true,
      foo: 'bar'
    })
  })

  it('should remove object property', () => {
    expect(filter({
      foo1: {
        bar: 'bar'
      },
      foo2: {
        'x-private': false,
        bar: 'bar'
      },
      foo3: {
        'x-private': true,
        bar: 'bar'
      }
    })).to.eql({
      foo1: {
        bar: 'bar'
      },
      foo2: {
        'x-private': false,
        bar: 'bar'
      }
    })
  })

  it('should remove array element', () => {
    expect(filter([
      'bar',
      123,
      [1, 2, 3],
      null,
      undefined,
      {bar: 'bar1'},
      {bar: 'bar2', 'x-private': true},
      {bar: 'bar3', 'x-private': false}
    ])).to.eql([
      'bar',
      123,
      [1, 2, 3],
      null,
      undefined,
      {bar: 'bar1'},
      {bar: 'bar3', 'x-private': false}
    ])
  })

  it('should remove nest object element', () => {
    expect(filter({
      foo1: {
        foo11: 'bar',
        foo12: {
          'x-private': true
        }
      },
      foo2: [
        {bar: 'bar1'},
        123,
        'bar',
        {
          'x-private': true,
          bar: 'bar'
        },
        null,
        {
          foo21: 'bar',
          foo22: {
            'x-private': true,
            bar: 'bar'
          }
        }
      ]
    })).to.eql({
      foo1: {
        foo11: 'bar'
      },
      foo2: [
        {bar: 'bar1'},
        123,
        'bar',
        null,
        {
          foo21: 'bar'
        }
      ]
    })
  })
})
