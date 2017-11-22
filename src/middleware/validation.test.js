const {expect} = require('chai')

describe('validation', () => {
  let body

  it('should validate required parameter', async () => {
    await api.get('/validation?required=true').expect(200);

    ({body} = await api.get('/validation').expect(400))
    expect(body.name).to.eql('BadRequest')
    expect(body.message).to.contain('Invalid parameter (required): Value is required but was not provided')
  })

  it('should validate string and number parameter', async () => {
    await api.get('/validation?required=true&string=123&number=123').expect(200)
    await api.get('/validation?required=true&string=char&number=123').expect(200);

    ({body} = await api.get('/validation?required=true&string=123&number=char').expect(400))
    expect(body.name).to.eql('BadRequest')
    expect(body.message).to.contain('Invalid parameter (number): Expected type number but found type string')
  })

  it('should validate array parameter', async () => {
    await api.get('/validation').query({required: true, numberArray: [1, 2]}).expect(200);
    ({body} = await api.get('/validation').query({required: true, numberArray: [1, 'char']}).expect(400))
    expect(body.name).to.eql('BadRequest')
    expect(body.message).to.contain('Invalid parameter (numberArray): Expected type integer but found type string')

    await api.get('/validation').query({required: true, numberArray: ['123']}).expect(200)
  })

  it('should validate boolean parameter', async () => {
    await api.get('/validation?required=true&boolean=true').expect(200)
    await api.get('/validation?required=true&boolean=false').expect(200);

    // number are also treated as string in querystring
    ({body} = await api.get('/validation?required=true&boolean=123').expect(400))
    expect(body.name).to.eql('BadRequest')
    expect(body.message).to.contain('Invalid parameter (boolean): Expected type boolean but found type string');

    ({body} = await api.get('/validation?required=true&boolean=char').expect(400))
    expect(body.name).to.eql('BadRequest')
    expect(body.message).to.contain('Invalid parameter (boolean): Expected type boolean but found type string')
  })

  it('should validate response', async () => {
    await api.post('/validation').type('json').send({message: 'ok'}).expect(200);

    ({body} = await api.post('/validation').type('json').send({not_message: 'ok'}).expect(500))
    expect(body.name).to.eql('InternalServerError')
  })
})
