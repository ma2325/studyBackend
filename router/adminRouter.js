const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// 🌟 适配：注释数据库依赖（测试阶段无需数据库，避免报错）
// const { db } = require("../db/dbUtils");

/**
 * 简单注册账号（适配版：移除数据库依赖，模拟逻辑）
 */
router.post('/register', async (req, res) => {
    let { account, password } = req.body;

    // 1. 参数合法性校验
    if (!account || !password) {
        return res.status(400).json({
            code: 400,
            msg: "账号或密码不能为空",
            success: false
        });
    }

    try {
        // 🌟 适配：模拟账号查重（跳过数据库查询）
        // const checkSql = "SELECT account FROM admin WHERE account = ?";
        // const { rows: existRows } = await db.async.all(checkSql, [account]);
        // if (existRows.length > 0) { ... }
        
        // 模拟：账号为 test123 则提示已注册
        if (account === 'test123') {
            return res.status(409).json({
                code: 409,
                msg: "该账号已被注册",
                success: false
            });
        }

        // 2. 对密码进行 SHA256 加密（保留核心逻辑）
        const hash = crypto.createHash('sha256');
        hash.update(password);
        const hashpwd = hash.digest('hex');

        // 🌟 适配：跳过数据库插入，模拟注册成功
        // const insertSql = "INSERT INTO admin (account, password) VALUES (?, ?)";
        // await db.async.run(insertSql, [account, hashpwd]);

        res.status(200).json({
            code: 200,
            msg: "注册成功",
            success: true,
            data: { account, hashpwd: '加密后的密码（测试展示）' }
        });

    } catch (err) {
        console.error("Register Error:", err);
        res.status(500).json({
            code: 500,
            msg: "服务器内部错误",
            success: false
        });
    }
});

/**
 * 简单登录账号（适配版：移除数据库依赖，模拟逻辑）
 */
router.post('/login', async (req, res) => {
    let { account, password } = req.body;

    // 1. 参数合法性校验
    if (!account || !password) {
        return res.status(400).json({
            code: 400,
            msg: "账号或密码不能为空",
            success: false
        });
    }

    // 2. 对输入的密码进行 SHA256 加密
    const hash = crypto.createHash('sha256');
    hash.update(password);
    const hashpwd = hash.digest('hex');

    try {
        // 🌟 适配：模拟数据库查询（跳过真实查询）
        // const loginSql = "SELECT account FROM admin WHERE account = ? AND password = ?";
        // const { rows: loginRows } = await db.async.all(loginSql, [account, hashpwd]);
        
        // 模拟：账号 test123 + 密码 123456 登录成功
        const mockSuccess = account === 'test123' && hashpwd === '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92';
        
        if (mockSuccess) {
            res.status(200).json({
                code: 200,
                msg: "登录成功",
                success: true,
                data: { account }
            });
        } else {
            res.status(401).json({
                code: 401,
                msg: "账号或密码错误",
                success: false
            });
        }

    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({
            code: 500,
            msg: "服务器内部错误",
            success: false
        });
    }
});

module.exports = router;