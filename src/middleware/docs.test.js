describe('docs', () => {
  it('should return API documentations', async () => {
    await api.get('/doc/').expect(200)
  })
})
