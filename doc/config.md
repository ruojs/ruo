## Config

`ruo` 支持四种优先级的配置方式，优先级从低到高依次是：

- 默认配置
- `process.env.NODE_ENV` 指定的环境目录配置
- `process.env.NODE_ENV` 指定的环境文件配置
- `local.js` 指定的运行时环境本地配置 

优先级高的会覆盖优先级低的，当 `process.env.NODE_ENV` 未被指定时，默认为 `development`。

### 示例

一个典型的 `ruo` 配置文件结构如下所示：

```
config
├── development
│   └── redis.js
├── development.js
├── production
│   └── redis.js
├── production.js
├── local.js
└── redis.js
```

- 默认配置

```
// config/redis.js
module.exports = {
  host: '127.0.0.1',
  port: 6379,
  db: 1,
}
```

- 环境文件配置

`config/development.js` 为开发环境下的一些不适合分割到单独文件的配置项，可能包含如下代码

```
module.exports = {
  listen: 8080
}
```

- 运行时本地配置

`config/local.js` 一些不适合放入版本库，或不同部署机器配置不同的配置项适合放入该文件。建议，本地配置尽量少使用，不便于管理。

### 引用配置

`ruo.config` 包含了所有通过配置文件加载的配置项值。最终结果，是经过优先级处理后的，所以无法同时访问开发环境和生产环境的配置项。

以上文的 redis 配置为例：通过 `ruo.config.redis` 读取存放在 `config/redis.js` 或 `config/development/redis.js` 文件中的配置项；通过 `ruo.config.listen` 可以读取在 `config/development.js` 或 `config/production.js` 中 `app` 需要监听的端口号。
