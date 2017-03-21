const fs = require('fs')
const path = require('path')

const _ = require('lodash')
const inquirer = require('inquirer')
const mkdirp = require('mkdirp')
const handlebars = require('handlebars')
const debug = require('debug')('ruo-cli')
const {rc, parseAsync, translate} = require('ruo')

const templatePath = rc.templatePath || path.join(__dirname, 'template')
const EXAMPLE_SPEC = fs.readFileSync(path.join(templatePath, 'spec.hbs'), 'utf8')

let spec
let root = rc.source

async function main () {
  spec = await parseAsync({root})

  // 用来记录哪些文件没有被创建
  // xxxx-sepc.yaml最先生成，不记录
  let questions = {
    code: [],
    test: []
  }
  let uris = _.map(spec.paths, (d, uri) => uri.trim())

  uris.forEach((uri) => {
    // 添加code.js文件
    if (!fs.existsSync(toCode(uri))) {
      questions['code'].push({
        name: toCode(uri),
        value: uri
      })
    }
    // 添加test.js文件
    if (!fs.existsSync(toTest(uri))) {
      questions['test'].push({
        name: toTest(uri),
        value: uri
      })
    }
    debug('questions', questions)
  })

  await ask(questions)
}

// 第一次询问
async function ask (questions) {
  let question = [{
    type: 'list',
    name: 'type',
    message: 'What do you want?',
    choices: [{
      name: 'Generate New Api',
      value: 'spec'
    }]
  }]

  // 判断如果文件列表不为空则添加相关选项
  if (questions.code.length) {
    question[0].choices.push({
      name: 'Generate Code File',
      value: 'code'
    })
  }
  if (questions.test.length) {
    question[0].choices.push({
      name: 'Generate Test File',
      value: 'test'
    })
  }

  // 如果文件列表都为空则直接询问新API URI
  if (question[0].choices.length === 1) {
    return await askSpec()
  }

  const answers = await inquirer.prompt(question)
  let type = answers.type
  if (type === 'spec') {
    return await askSpec()
  }
  return await askCodeOrTest(type, questions[type])
}

async function askSpec () {
  const answers = await inquirer
    .prompt([{
      type: 'input',
      name: 'uri',
      message: 'What is the API URI?',
      validate: (uri) => {
        let location = toSpec(uri)
        if (!uri) {
          return 'URI can\'t be empty'
        }
        if (fs.existsSync(location)) {
          return `Spec file ${location} already exist`
        }
        return true
      }
    }])
  let uri = path.join('/', answers.uri, '.')

  generateSpecFile(uri)
  // 更新spec文件
  spec = await parseAsync({root})
  // 生成Code和Test文件
  generateTestFile(uri)
  generateCodeFile(uri)
  process.exit(0)
}

async function askCodeOrTest (type, choices) {
  if (!choices.length) {
    return console.log('Nothing todo'); // eslint-disable-line
  }

  let _choices = choices.concat()
  let question = [{
    type: 'list',
    name: 'uri',
    message: `What kind of ${type} file do you want?`,
    choices: _choices,
    default: true
  }]
  question[0]['choices'].push({
    name: `Don't create ${type} file for me`,
    value: false
  })
  const answers = await inquirer.prompt(question)
  let uri = answers.uri
  if (!uri) {
    process.exit(0)
    return false
  }

  if (type === 'code') {
    generateCodeFile(uri)
  } else {
    generateTestFile(uri)
  }

  choices = removeChoice(choices, uri)
  return askCodeOrTest(type, choices)
}

function generateSpecFile (uri) {
  let location = toSpec(uri)
  if (!fs.existsSync(location)) {
    write(location, EXAMPLE_SPEC)
  }
}

function generateCodeFile (uri) {
  let source = fs.readFileSync(path.join(templatePath, 'code.hbs'), 'utf8')
  let template = handlebars.compile(source)
  let result = template(spec.paths[uri])
  write(toCode(uri), result)
}

function generateTestFile (uri) {
  let source = fs.readFileSync(path.join(templatePath, 'test.hbs'), 'utf8')
  let template = handlebars.compile(source)
  let result = template({
    uri: uri,
    methods: spec.paths[uri]
  })
  write(toTest(uri), result)
}

function removeChoice (choices, uri) {
  _.remove(choices, function (choice) {
    return choice.value === uri
  })
  return choices
}

function write (location, content) {
  mkdirp.sync(path.dirname(location))
  fs.writeFileSync(location, content, 'utf8')
  console.log(`Write content to ${location}`); // eslint-disable-line
}

function toCode () {
  return root + '/' + translate.toCode.apply(null, arguments)
}
function toTest () {
  return root + '/' + translate.toTest.apply(null, arguments)
}
function toSpec () {
  return root + '/' + translate.toSpec.apply(null, arguments)
}

module.exports = (projectRoot) => {
  debug('projectRoot', projectRoot)
  main().catch((err) => {
    console.error(err.stack); // eslint-disable-line
    throw err
  })
}
