const rc = require('../rc')

module.exports = () => {
  const enabled = rc.env === 'test' || rc.env === 'development'

  return (req, res, next) => {
    const hasSwitch = req.get('x-switch')
    const switchs = enabled && hasSwitch ? JSON.parse(hasSwitch) : {}

    req.isSwitchOff = (feature) => {
      return switchs[feature] === false
    }

    req.isSwitchOn = (feature) => {
      return switchs[feature] === true
    }

    next()
  }
}
