const rc = require('../rc')

module.exports = () => {
  const enabled = rc.env === 'test' || rc.env === 'development'

  return (req, res, next) => {
    const hasSwitch = req.get('x-switch')
    const switches = enabled && hasSwitch ? JSON.parse(hasSwitch) : {}

    req.isSwitchOff = (feature) => {
      return switches[feature] === false
    }

    req.isSwitchOn = (feature) => {
      return switches[feature] === true
    }

    next()
  }
}
