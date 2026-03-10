先登陆mysql，并创建database study后，运行以下代码创建示例数据库
```
    use study;
    cd ...
    source study_backup.sql;
```
终端运行
```
    npm install
```
直接跑app.js
## 🛠️ Admin 模块接口文档

### 1. 测试环境准备
* **本地服务地址**: `http://localhost:3000`
* **请求数据格式**: `application/json`

---

### 2. 接口列表

#### 2.1 注册接口
* **请求路径**: `/admin/register`
* **请求方式**: `POST`
* **功能描述**: 直接通过账号和密码进行注册。

**请求参数 (Body):**
| 参数名 | 类型 | 必填 | 说明 |
| :--- | :--- | :--- | :--- |
| `account` | String | 是 | 管理员账号（唯一） |
| `password` | String | 是 | 管理员密码（后端将进行 SHA256 加密） |

**响应示例 (成功 - 200):**
```json
{
  "code": 200,
  "msg": "注册成功"
}
```
响应示例 (失败 - 409 账号已存在):
```JSON
{
  "code": 409,
  "error": "该账号已被注册"
}
```
2.2 登录接口
请求路径: /admin/login

请求方式: POST

功能描述: 验证账号密码，登录管理员账号。

请求参数 (Body):
| 参数名 | 类型 | 必填 | 说明 |
| :--- | :--- | :--- | :--- |
| account | String | 是 | 管理员账号 |
| password | String | 是 | 管理员密码 |

响应示例 (成功 - 200):

```JSON
{
  "code": 200,
  "msg": "登录成功",
  "data": {
    "account": "admin_username"
  }
}
```
响应示例 (失败 - 401 密码错误或账号不存在):

```JSON
{
  "code": 401,
  "error": "账号或密码错误"
}
```