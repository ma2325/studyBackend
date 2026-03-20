const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { db, genid } = require("../db/dbUtils"); // 引入数据库工具

/**
 * 管理员注册（真实数据库版）
 * POST /api/v1/simple_admin/register
 */
router.post('/register', async (req, res) => {
  const { account, password, nickname } = req.body;

  // 1. 参数校验
  if (!account || !password) {
    return res.status(400).json({
      code: 400,
      msg: "账号或密码不能为空",
      success: false
    });
  }

  try {
    // 2. 检查账号是否已存在
    const checkSql = "SELECT id FROM admin WHERE account = ? AND is_delete = 0";
    const existUser = await db.getOne(checkSql, [account]);
    if (existUser) {
      return res.status(409).json({
        code: 409,
        msg: "该账号已被注册",
        success: false
      });
    }

    // 3. SHA256加密密码
    const hash = crypto.createHash('sha256');
    hash.update(password);
    const hashPwd = hash.digest('hex');

    // 4. 插入新账号
    const insertSql = `
      INSERT INTO admin (account, password, nickname) 
      VALUES (?, ?, ?)
    `;
    const insertParams = [account, hashPwd, nickname || '默认管理员'];
    const insertResult = await db.execute(insertSql, insertParams);

    res.status(200).json({
      code: 200,
      msg: "注册成功",
      success: true,
      data: {
        adminId: insertResult.insertId,
        account
      }
    });

  } catch (err) {
    console.error("注册失败：", err);
    res.status(500).json({
      code: 500,
      msg: "服务器内部错误",
      success: false
    });
  }
});

/**
 * 管理员登录（真实数据库版）
 * POST /api/v1/simple_admin/login
 */
router.post('/login', async (req, res) => {
  const { account, password } = req.body;

  // 1. 参数校验
  if (!account || !password) {
    return res.status(400).json({
      code: 400,
      msg: "账号或密码不能为空",
      success: false
    });
  }

  // 2. 加密密码
  const hash = crypto.createHash('sha256');
  hash.update(password);
  const hashPwd = hash.digest('hex');

  try {
    // 3. 查询账号密码是否匹配
    const loginSql = `
      SELECT id, account, nickname FROM admin 
      WHERE account = ? AND password = ? AND is_delete = 0
    `;
    const user = await db.getOne(loginSql, [account, hashPwd]);

    if (user) {
      // 登录成功
      res.status(200).json({
        code: 200,
        msg: "登录成功",
        success: true,
        data: {
          adminId: user.id,
          account: user.account,
          nickname: user.nickname
        }
      });
    } else {
      // 账号/密码错误
      res.status(401).json({
        code: 401,
        msg: "账号或密码错误",
        success: false
      });
    }

  } catch (err) {
    console.error("登录失败：", err);
    res.status(500).json({
      code: 500,
      msg: "服务器内部错误",
      success: false
    });
  }
});

module.exports = router;