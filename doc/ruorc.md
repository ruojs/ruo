## ruorc

`ruo` 项目根目录下可以创建 `.ruorc` 文件，用于配置项目开发相关的配置。`JSON` 格式，支持的配置项如下：

- `name`  项目名，默认 `ruo`
- `exec` 脚本解释器，当前只支持 `node`

- `root` 当前工作目录 `process.cwd()`，无法修改
- `source` 项目源代码目录，`root` 相对路径，默认为 `root`
- `target` 编译后的代码输出目录，`root` 相对路径，默认为 `root`
- `templatePath` 用于生成接口实现和测试代码模板的路径

- `suffix` 指定文件后缀风格，详见 [suffix](#suffix)
- `shadow` api 路径组织方式，详见 [shadow](#shadow)

- `specPath` 输出 json 格式的文档定义路径，默认为 `/`，当访问该路径时将输出完整的文档定义

- `env` 默认为 `development`，可以用 `process.env.NODE_ENV` 代替
- `lint` 配置代码风格检测目录，详见 [lint](#lint)
- `test` 测试配置，详见 [test](#test)
- `cover` 覆盖率测试配置，详见 [cover](#cover)
- `watch` 配置开发时，额外需要监听的目录，`root` 相对路径，数组类型

`.ruorc` 中的配置项，可以通过 `ruo.rc` 引用，其中 `ruo.rc.root` 属于只读配置。

## suffix

配置接口相关代码文件名后缀规则，默认配置如下：

```
"suffix": {
    "code": ".code.js",
    "test": ".test.js",
    "spec": ".spec.yaml"
}
```

此时，api 实现文件命名风格为 `xxx.code.js`，测试文件命名风格为 `xxx.test.js`，接口定义文件命名风格为 `xxx.spec.yaml`。`ruo` 在加载 api 相关代码时，通过该配置规则，匹配文件。

其他代码，诸如 ``Serivce` 层代码，只需要对应的测试文件使用 `suffix.test` 定义的规则即可。一个完整的示例如下：

```
|- api
  |- hello.code.js
  |- hello.spec.yaml
  |- hello.test.js
|- lib
  |- functions.js
  |- functions.test.js
app.js
app-test.js
```

其中 `hello.code.js` 会作为接口实现代码加载，`hello.spec.yaml` 会作为接口定义加载，其他的 `xxx.test.js` 会在执行测试 `ruo test` 被执行。

## `shadow` 

- `false` 文件路径和 api 访问路径一致（默认值）
- `true` 文件路径和 api 访问路径无关

无论哪种方式，`ruo` 的代码、测试、文档三个文件始终是放在相同目录下。

#### 文件路径和 api 访问路径一致

当 `shadow=false` 时（默认配置），文件路径和 api 访问路径一致，以实现一个 `GET /hello` 接口为例，文件布局如下：

```
├── api
│   ├── hello.code.js  // 接口实现代码
│   ├── hello.spec.yaml  // 接口定义文件
│   ├── hello.test.js  // 接口测试文件
```

`helle.code.js` 代码示例：

```
module.exports = {
  get: function (req, res) {
    res.send('hello ruo')
  }
}
```

可以通过定义 `post delete put` 等方法，实现 `POST/DELETE/PUT /hello` 接口。当 `ruo` 加载文件时，文件路径 `/hello.code.js`，会转化为 api 访问路径 `/hello`

#### 文件路径和 api 路径无关

当 `shadow=true` 时，文件路径和 api 路径无关，此时实现 `GET /hello` 接口示例代码如下：

```
// hello.code.js
exports['/hello'] = {
  get: function (req, res) {
    res.send('hello ruo')
  }
}
```

此时 `hello.code.js` 可以在 `api` 目录下的任意路径（对应的`hello.test.js` `hello.spec.yaml` 仍然需要和 `hello.code.js` 保持相同路径）

## lint

风格检查阶段可以自己配置需要 lint 的目录，默认配置如下

```
"lint": {
  "include": [
    'src/**/*.js'
  ]
}
```

目前支持 `include` 属性

## test

目前支持配置 mocha 启动脚本，示例如下

```
"test": {
    "bootload": "./resource/mocha-bootload.js"
}
```

可以在 `mocha-bootload.js` 定义初始化脚本，例如可以指定一个启动脚本如下

```
const supertest = require('supertest');
const chai = require('chai');
const chai_as_promised = require('chai-as-promised');

chai.use(chai_as_promised);

before(() => {
  global.api = supertest(`http://localhost:${config.port}`);
});
```

## cover

和 test 一致，示例如下
```
"cover": {
    "bootload": "./resource/mocha-bootload.js"
}
```
