## Pipeline

`ruo` 中利用 `pipeline` 组合多个中间件，修改响应数据。暂时只用于监听 `res.json` 中的数据。

需要注意的是，此处的中间件，并不是 `express` 中间件，二者写法有区别。

### 定义一个 Pipeline 中间件

如果希望可以记录每次响应的 json `res.json(data)` 数据，示例如下：

```
const Pipeline = require('./pipeline')
const pipeline = Pipeline()

function logResponseJson (req, res, jsonResponse) => {
  debug('response', JSON.stringify(jsonResponse))
  return jsonResponse
}

pipeline.use(logResponseJson) // 多个中间，可以通过多次 `use` 调用串联

app.use(pipeline.createMiddleware())  // app is an express instance
```

每个 `pipiline` 中间件只有三个参数，分别是 `req, res, jsonResponse`，其中 `jsonResponse` 是 `res.json()` 的参数。中间件必须返回 `jsonResponse` 以便将可能修改的 `json` 响应值传递到下一个 `pipeline` 中间件。
