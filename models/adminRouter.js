const express = require('express');
const router = express.Router();
const crypto = require('crypto');

const sequelize = require('../orm/sequelize');
const { DataTypes } = require('sequelize');
const AdminModel = require('../orm/models/Admin');
const Admin = AdminModel(sequelize, DataTypes);

/**
 * @api {post} /api/v1/simple_admin/register 简单注册账号
 * @apiName SimpleAdminRegister
 * @apiGroup Admin
 * @apiDescription 直接通过账号和密码进行注册。
 *
 * @apiParam {String} account 管理员账号（唯一）
 * @apiParam {String} password 管理员密码（将进行 SHA256 加密）
 *
 * @apiSuccess {Number} code 状态码 200 表示注册成功
 * @apiSuccess {String} msg 返回信息
 */
router.post('/register', async (req, res) => {
    let { account, password } = req.body;

    // 1. 参数合法性校验
    if (!account || !password) {
        return res.status(400).send({
            code: 400,
            error: "账号或密码不能为空"
        });
    }

    try {
        // 2. 检查账号是否已存在
        const count = await Admin.count({
            where: { account: account }
        });

        if (count > 0) {
            return res.status(409).send({
                code: 409,
                error: "该账号已被注册"
            });
        }

        // 3. 对密码进行 SHA256 加密
        const hash = crypto.createHash('sha256');
        hash.update(password);
        const hashpwd = hash.digest('hex');

        // 4. 将新账号插入数据库
        await Admin.create({
            account: account,
            password: hashpwd
        });

        res.status(200).send({
            code: 200,
            msg: "注册成功"
        });

    } catch (e) {
        console.error("Register Error:", e);
        res.status(500).send({
            code: 500,
            error: "服务器内部错误"
        });
    }
});

/**
 * @api {post} /api/v1/simple_admin/login 简单登录账号
 * @apiName SimpleAdminLogin
 * @apiGroup Admin
 * @apiDescription 使用账号和密码登录，仅校验账号密码是否正确。
 *
 * @apiParam {String} account 管理员账号
 * @apiParam {String} password 管理员密码
 *
 * @apiSuccess {Number} code 状态码 200 表示登录成功
 * @apiSuccess {String} msg 返回信息
 * @apiSuccess {Object} data 管理员信息
 * @apiSuccess {String} data.account 管理员账号
 */
router.post('/login', async (req, res) => {
    let { account, password } = req.body;

    // 1. 参数合法性校验
    if (!account || !password) {
        return res.status(400).send({
            code: 400,
            error: "账号或密码不能为空"
        });
    }

    // 2. 对输入的密码进行 SHA256 加密，以便与数据库比对
    const hash = crypto.createHash('sha256');
    hash.update(password);
    const hashpwd = hash.digest('hex');

    try {
        // 3. 在数据库中查找匹配的账号和密码
        const AdminContent = await Admin.findOne({
            attributes: ['account'], // 安全起见，不查询返回 password 字段
            where: {
                account: account,
                password: hashpwd
            },
            raw: true
        });

        // 4. 判断是否找到用户
        if (AdminContent != null) {
            // 登录成功：仅返回账号信息，不生成 Token
            res.status(200).send({
                code: 200,
                msg: "登录成功",
                data: {
                    account: AdminContent.account
                }
            });
        } else {
            // 登录失败
            res.status(401).send({
                code: 401, // 401 Unauthorized 更适合账号密码错误的情况
                error: "账号或密码错误"
            });
        }

    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).send({
            code: 500,
            error: "服务器内部错误"
        });
    }
});

module.exports = router;