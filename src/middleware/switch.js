const rc = require('../rc')

module.exports = () => {
  const enabled = rc.env === 'test' || rc.env === 'development'

  return (req, res, next) => {
    const switchs = enabled ? JSON.parse(req.get('x-switch') || '{}') : {}

    req.isSwitchOff = (feature) => {
      return switchs[feature] !== undefined && switchs[feature] === false
    }

    req.isSwitchOn = (feature) => {
      return switchs[feature] !== undefined && switchs[feature] === true
    }

    next()
  }
}
