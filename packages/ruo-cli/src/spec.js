const {parseAsync} = require('ruo')

module.exports = () => {
  parseAsync().then((spec) => {
    console.log(JSON.stringify(spec, null, 2)); // eslint-disable-line
  }).catch((err) => {
    console.log(err.stack); // eslint-disable-line
  })
}
