const expect = require('chai').expect

const blueprint = require('./blueprint')

const accountModel = {
  identity: 'account',
  blueprint: {
    find: [{auth: []}]
  },

  attributes: {
    id: {
      type: 'integer',
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: 'string',
      email: true,
      required: true
    },
    password: {
      type: 'string',
      required: true,
      minLength: 8,
      notRegex: /^\d+$/
    },
    toJSON () {
      const obj = this.toObject()
      delete obj.password
      return obj
    }
  }
}

describe('blueprint', () => {
  it('should convert waterline model definition to json schema', () => {
    expect(blueprint.modelToJsonSchema({
      id: {
        type: 'integer',
        primaryKey: true,
        autoIncrement: true
      },
      status: {
        type: 'string',
        enum: ['enabled', 'disabled', 'forbidden', 'deleted'],
        required: true
      },
      disabled: {
        type: 'boolean'
      },
      createdAt: {
        type: 'datetime',
        required: true
      }
    })).to.eql({
      type: 'object',
      required: ['status', 'createdAt'],
      properties: {
        id: {
          type: 'integer'
        },
        status: {
          type: 'string',
          enum: ['enabled', 'disabled', 'forbidden', 'deleted']
        },
        disabled: {
          type: 'boolean'
        },
        createdAt: {
          type: 'string',
          format: 'date-time'
        }
      }
    })
  })

  it('should convert waterline model definition to swagger parameters', () => {
    expect(blueprint.modelToParameter({
      id: {
        type: 'integer',
        primaryKey: true,
        autoIncrement: true
      },
      status: {
        type: 'string',
        enum: ['enabled', 'disabled', 'forbidden', 'deleted'],
        required: true
      },
      disabled: {
        type: 'boolean'
      },
      createdAt: {
        type: 'datetime',
        required: true
      }
    })).to.eql([{
      name: 'id',
      required: false,
      type: 'integer',
      in: 'query'
    }, {
      name: 'status',
      required: true,
      type: 'string',
      enum: ['enabled', 'disabled', 'forbidden', 'deleted'],
      in: 'query'
    }, {
      name: 'disabled',
      required: false,
      type: 'boolean',
      in: 'query'
    }, {
      name: 'createdAt',
      required: true,
      type: 'string',
      format: 'date-time',
      in: 'query'
    }])
  })

  it('should generate classic RESTful endpoints', () => {
    const actions = blueprint.getBlueprintActions(accountModel)
    expect(actions).to.eql({
      create: ['/account', 'post'],
      find: ['/account', 'get'],
      findOne: ['/account/{id}', 'get'],
      update: ['/account/{id}', 'put'],
      destroy: ['/account/{id}', 'delete']
    })
  })

  it('should generate api definitions', () => {
    const definitions = blueprint.getBlueprintDefinitions(accountModel)
    expect(definitions.find.security).to.eql([{auth: []}])
    expect(definitions.create.security).to.eql(undefined)
  })

  it('should generate api implementations', () => {
    const handlers = blueprint.getBlueprintHandlers(accountModel)
    expect(Object.keys(handlers)).to.eql(['create', 'find', 'findOne', 'update', 'destroy'])
  })
})
