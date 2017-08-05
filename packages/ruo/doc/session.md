## Session

在 `ruo` 中添加会话功能，非常简单，只需添加配置项 `config.session`，完整支持的配置项详见 [express-session-options](https://github.com/expressjs/session#options)。示例如下：

```
'use strict';

module.exports = {
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,

  prefix: 'project:sess:',
  redis: {
    host: '127.0.0.1',
    port:6379
  }
};
```

示例中的配置项包含了 `redis`，会将 `session.store` 设置为 `connect-redis`，建议生产环境必须添加该配置项。
