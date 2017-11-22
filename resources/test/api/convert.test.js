const {expect} = require('chai')

const ENDPOINT = '/convert'

describe(ENDPOINT, () => {
  describe('get', () => {
    it('should convert querystring and form data type', async () => {
      const {body} = await api.post(ENDPOINT)
        .query({
          string: 'string value',
          number: '123'
        })
        .type('form')
        .send({
          boolean: 'true',
          numberArray: ['1', '2', 3],
          stringArray: ['a', 'b']
        })
        .expect(200)

      expect(body.query).to.eql({
        string: 'string value',
        number: 123
      })
      expect(body.body).to.eql({
        boolean: true,
        numberArray: [1, 2, 3],
        stringArray: ['a', 'b']
      })
    })
  })
})
