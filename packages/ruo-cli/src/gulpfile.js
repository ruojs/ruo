const fs = require('fs')
const path = require('path')
const spawn = require('child_process').spawn

const gulp = require('gulp')
const plugins = require('gulp-load-plugins')()
const del = require('del')
const debug = require('debug')('ruo-cli')
const chalk = require('chalk')
const _ = require('lodash')
const glob = require('glob')
const merge = require('merge-stream')
const {config} = require('ruo')

const helpers = require('./helpers')

// if source equals to target, project don't require compilation and related tasks
const isGeneratorStyle = config.source === config.target
const RUO_DIR = path.join(__dirname, '..')
const BABELRC = JSON.parse(fs.readFileSync(`${RUO_DIR}/.babelrc`, 'utf8'))
BABELRC.plugins = BABELRC.plugins.map((name) => {
  return require.resolve(`babel-plugin-${name}`)
})

gulp.task('clean', () => {
  if (!isGeneratorStyle) {
    del.sync(config.target)
  }
})

gulp.task('t', ['test'])
gulp.task('test', () => {
  const MOCHA_OPTIONS = '--colors --timeout 20000'.split(' ')
  if (isGeneratorStyle) {
    MOCHA_OPTIONS.push('-r')
    MOCHA_OPTIONS.push('co-mocha')
  }
  if (config.test.bootload) {
    MOCHA_OPTIONS.push(config.test.bootload)
  }
  const TEST_FILES = glob.sync(`${config.target}/**/*${config.suffix.test}`)
  let args = ['./node_modules/.bin/_mocha']
  args = args.concat(MOCHA_OPTIONS)

  // gulp test -g oauth -g dist/api/xxx-test.js => ['/path/to/node', '/path/to/gulp', 'test', '-g', 'oauth', '-f', 'dist/api/xxx-test.js']

  switch (process.argv.length) {
    case 3:
      args = args.concat(TEST_FILES)
      break
    case 5:
      if (process.argv[3] === '-f') {
        // gulp test -f dist/api/xxx-test.js
        args.push(process.argv[4])
      } else {
        // gulp test -g oauth
        args.push('-g')
        args.push(process.argv[4])
        args = args.concat(TEST_FILES)
      }
      break
    case 7:
      // gulp test --grep oauth -f dist/api/accounts-test.js
      args.push(process.argv[4])
      args.push('-g')
      args.push(process.argv[6])
      break
  }

  helpers.execute('node', args, {NODE_ENV: 'test'})
})
gulp.task('c', ['cover'])
gulp.task('cover', ['build'], () => {
  const MOCHA_OPTIONS = `--colors --timeout 20000 ${config.cover.bootload}`.split(' ')
  const TEST_FILES = glob.sync(`${config.target}/**/*${config.suffix.test}`)
  let args = ['cover', '--report', 'text', '--report', 'html', '-i', `${config.target}/**/*.js`, '-x', `${config.target}/**/*${config.suffix.test}`, './node_modules/.bin/_mocha', '--']
  args = args.concat(MOCHA_OPTIONS).concat(TEST_FILES)
  helpers.execute(`${RUO_DIR}/node_modules/.bin/istanbul`, args, {NODE_ENV: 'test'})
})

const LINT_FILES = config.lint.include
gulp.task('lint', () => {
  return gulp.src(LINT_FILES)
    .pipe(plugins.eslint())
    .pipe(plugins.debug({title: 'lint'}))
    .pipe(plugins.eslint.format())
    .pipe(plugins.eslint.failAfterError())
})

function copy (paths, cached) {
  let stream = gulp.src(paths, {base: config.source})
  if (cached) {
    stream = stream.pipe(plugins.changed(config.target))
  }
  return stream
    .pipe(plugins.debug({title: 'copy'}))
    .pipe(gulp.dest(config.target))
}
function compile (paths, type, cached) {
  let stream = gulp.src(paths, {base: config.source})
  if (cached) {
    stream = stream.pipe(plugins.changed(config.target))
  }
  return stream
    .pipe(plugins.debug({title: type}))
    .pipe(plugins.babel(BABELRC))
    .on('error', function (err) {
      console.log(err.stack); // eslint-disable-line
      type === 'build' && process.exit(1)
    })
    .pipe(gulp.dest(config.target))
}
function cleanup (srcPath) {
  // Simulating the {base: 'src'} used with gulp.src in the scripts task
  let filePathFromSrc = path.relative(path.resolve(config.source), srcPath)
  // Concatenating the 'build' absolute path used by gulp.dest in the scripts task
  let destFilePath = path.resolve(config.target, filePathFromSrc)
  del.sync(destFilePath)
}
gulp.task('build', ['clean'], () => {
  if (!isGeneratorStyle) {
    return merge(
      copy(`${config.source}/**/*.!(js)`),
      compile(`${config.source}/**/*.js`, 'build'))
  }
})
gulp.task('cached-build', () => {
  if (!isGeneratorStyle) {
    return merge(
      copy(`${config.source}/**/*.!(js)`, true),
      compile(`${config.source}/**/*.js`, 'build', true))
  }
})
gulp.task('build-watch', ['cached-build'], () => {
  if (!isGeneratorStyle) {
    gulp.watch(`${config.source}/**/*`, (event) => {
      debug('build watch', event)

      if (event.type === 'deleted') {
        return cleanup(event.path)
      }

      let ext = path.extname(event.path)
      if (ext === '.js') {
        compile(event.path, 'change')
      } else {
        copy(event.path)
      }
    })
  }
})

let serveEnv = {
  NODE_ENV: 'development',
  DEBUG: config.name
}
function serve () {
  let env = ''
  for (let key in serveEnv) {
    env = `${env} ${key}=${serveEnv[key]}`
  }
  const watches = config.watch.map((s) => '-w ' + s).join(' ')
  const args = `-e js,yaml ${watches} -w ${config.target} --exec ${env} ${config.exec}`.split(' ')
  debug('serve args', args)
  let app = spawn(`${RUO_DIR}/node_modules/.bin/nodemon`, args, {
    stdio: ['pipe', 1, 2, 'ipc']
  })
  app.on('message', function (event) {
    if (event.type === 'start') {
      console.log( // eslint-disable-line
        chalk.gray('  Type "debug <DEBUG_ENTRY>\\n" at any time to change environment variable')
      )
    }
  })
  return app
}
gulp.task('serve', ['build-watch'], () => {
  let app = serve()

  process.stdin.resume()
  process.stdin.setEncoding('utf8')
  process.stdin.on('data', function (chunk) {
    try {
      const chunks = chunk.trim().split(' ')
      const envKey = chunks[0].toUpperCase()
      const envValue = chunks[1]
      debug('chunks', chunks)
      if (envKey === 'DEBUG') {
        _.merge(serveEnv, {
          [envKey]: envValue
        })
        app.send('quit')
        app = serve()
      }
    } catch (err) {
      console.log(err.stack); // eslint-disable-line
    }
  })
})
gulp.task('default', ['serve'])
