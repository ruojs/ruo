# 概述
本文档为 UPYUN 管理后台开放 UAPI(user api) 对接说明文档，适用于所有 UPYUN 注册用户。如果您需要调用该接口，需要人工申请。如果您在使用中，发现问题，请及时联系[我们](mail://support@upyun.com)。非常感谢!

本文档所描述的 API 全部通过 `https` 访问，用户访问地址为：`https://api.upyun.com/`。默认 API 版本为 `1.0`，新版本的 API 通过 url 中增加版本号区别。

# API 授权
1. 联系我们获取 access_token

2. 将 access_token 放入 http head 中

以获取账号信息为例，请求如下：
```
curl -i https://api.upyun.com/accounts/profile/ -H 'Authorization:Bearer your_access_token_here'
```
响应头如下：
```
HTTP/1.1 200 OK
Server: marco/0.9
Date: Wed, 16 Sep 2015 08:30:32 GMT
Content-Type: application/json
Transfer-Encoding: chunked
Connection: keep-alive
Vary: Accept-Encoding
X-Source: C/200
Strict-Transport-Security: max-age=63072000
Access-Control-Allow-Credentials: true
Access-Control-Allow-Origin: https://www.upyun.com
X-Xss-Protection: 1; mode=block
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Age: 1
X-Cache: MISS|MISS from ctn-zj-huz-137, MISS|MISS from ctn-zj-lna-068
X-Request-Id: 8a92136387177a6fe1da0884e48f2512
```
响应主体如下(省略了其他字段)：
```json
{
  "user_id": 00001,
  "username": "your_account_name"
}
```

# 请求参数
每个接口都会说明当前接口的 HTTP 请求方法。如果是 GET 接口，则请求参数通过 query string 传入；如果是 POST 接口，则请求参数通过 http body 传入。

# 错误处理
所有的接口采用全局统一的错误码，详细的码表见这里: [UPYUN UAPI ERROR](console_error)。
例如，access_token 无效时，接口会返回：
```
{
    "error_code": 11001,
    "request": "GET /accounts/profile/",
    "message": "Invalid Access Token"
}
```
