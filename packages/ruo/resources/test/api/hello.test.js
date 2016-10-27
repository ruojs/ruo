const ENDPOINT = '/hello'

describe(ENDPOINT, () => {
  describe('get', () => {
    it('should respond with 200 success', async () => {
      await api.get(ENDPOINT)
        .query({
          string: 'string value'
        })
        .type('json')
        .expect(200)
    })

    it('should respond with default error', async () => {
      await api.get(ENDPOINT)
        .type('json')
        .expect(400)
    })
  })
})
