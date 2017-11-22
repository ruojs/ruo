## 数据库

`ruo` 数据库层使用 [Sequelize](http://docs.sequelizejs.com/) 库，`ruo` 只是在此基础上，
约定了数据库配置文件和 `Model` 定义文件的位置。所以，只需要两步即可进行数据库操作：数据库配置和 `Model` 定义。

### 数据库配置

`ruo` 配置文件统一放在项目根目录的 `config` 目录下，数据库配置文件必须命名为 `model.js`，完整支持的配置项如下：

```
'use strict';

module.exports = {
  database: 'your_database_name',
  username: 'your_database_username',
  password: 'your_database_password',
  host: 'your_database_ip',
  dialect: 'mysql',
  pool: {
    max: 5,
    min: 0,
    idle: 10000,
  },
  timezone: '+08:00'
};
```

参数详细含义可以参照 `Sequelize` 官方[文档](http://docs.sequelizejs.com/class/lib/sequelize.js~Sequelize.html#instance-constructor-constructor)。需要注意的是，`Sequelize` 默认采用标准时区，一般应修改为东八区 `+08:00`。

### Model 定义

`Model` 定义文件统一放在项目根目录的 `model` 目录下，示例如下，定义了三个 `Model`：

```
├── model
│   ├── Comment.js
│   ├── Order.js
│   ├── User.js
```

`model/User.js` 代码如下：
```
const Sequelize = require('sequelize');

module.exports = {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  name: {
    type: Sequelize.STRING(20),
    allowNull: false,
  },
}, {
  tableName: 'user',
};
```

和单独使用 `Sequelize` 定义 `Model` 完全一致。

### 引用 Model

所有定义在 `model` 目录下的模型定义，都可以通过 `ruo.models` 来引用，例如：

```
ruo.models.User
ruo.models.UserComment
```

命名采用大写开头的驼峰风格

#### 执行事物和 sql 查询

`Sequelize` 实例的 [query](http://docs.sequelizejs.com/class/lib/sequelize.js~Sequelize.html#instance-method-query) 和 [transaction](http://docs.sequelizejs.com/class/lib/sequelize.js~Sequelize.html#instance-method-transaction) 两个方法会被绑定到全局对象 `ruo`，便于直接执行 sql，例如： 

```
ruo.query('SELECT 1+1 FROM user')
ruo.transaction(transaction => {
    // do your transaction
})
```

### TODO

- [ ] 支持配置多个数据库链接
