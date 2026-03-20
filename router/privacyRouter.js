const express = require('express');
const router = express.Router();
// 引入数据库工具（核心）
const { db } = require("../db/dbUtils");

/**
 * 统一响应工具类
 */
const responseUtil = {
    success: (data, msg = "操作成功") => ({
        code: 200,
        msg,
        data,
        success: true,
        timestamp: Date.now()
    }),
    error: (msg, code = 500) => ({
        code,
        msg,
        success: false,
        timestamp: Date.now()
    })
};

/**
 * 资源认证中间件
 */
const resourceAuth = (req, res, next) => {
    next();
};

/**
 * PII敏感信息识别接口（写入数据库）
 * POST /api/privacy/recognize
 */
router.post('/recognize', resourceAuth, async (req, res, next) => {
  try {
    const { userId, content, resourceId } = req.body;
    
    // 参数校验（新增userId必填）
    if (!userId || !content) {
      return res.json(responseUtil.error('缺少参数：userId/content', 400));
    }

    // 1. PII识别逻辑（保留原有正则）
    const phoneRegex = /1[3-9]\d{9}/g;
    const emailRegex = /\w+@\w+\.\w+/g;
    const phones = content.match(phoneRegex) || [];
    const emails = content.match(emailRegex) || [];
    const hasPii = phones.length > 0 || emails.length > 0;
    const piiList = JSON.stringify([
      { type: 'phone', values: phones },
      { type: 'email', values: emails }
    ]);

    // 2. 写入PII记录表
    const insertSql = `
      INSERT INTO pii_record (
        resource_id, user_id, content, has_pii, pii_list
      ) VALUES (?, ?, ?, ?, ?)
    `;
    await db.execute(insertSql, [
      resourceId || '', // 可选：关联资源ID
      userId,
      content,
      hasPii ? 1 : 0,
      piiList
    ]);

    // 3. 返回结果（保持原有格式）
    const result = {
      hasPii,
      piiList: [
        { type: 'phone', values: phones },
        { type: 'email', values: emails }
      ],
      piiCount: phones.length + emails.length
    };
    return res.json(responseUtil.success(result));

  } catch (err) {
    console.error("PII识别失败：", err);
    next(err);
  }
});

/**
 * 隐私分级判定接口（更新资源表隐私等级）
 * POST /api/privacy/classify
 */
router.post('/classify', resourceAuth, async (req, res, next) => {
  try {
    const { userId, content, fileType, userPrivacyMark, resourceId } = req.body;
    
    // 参数校验
    if (!userId || !content || !fileType) {
      return res.json(responseUtil.error('缺少参数：content/fileType', 400));
    }

    // 1. 隐私分级逻辑
    const hasPii = /1[3-9]\d{9}/g.test(content) || /\w+@\w+\.\w+/g.test(content);
    const privacyLevel = userPrivacyMark ?? (hasPii ? 2 : 0);

    // 2. 如果传了resourceId，更新资源表的隐私等级
    if (resourceId) {
      const updateSql = `
        UPDATE resource 
        SET privacy_level = ?, update_time = CURRENT_TIMESTAMP 
        WHERE resource_id = ? AND user_id = ? AND is_delete = 0
      `;
      await db.execute(updateSql, [privacyLevel, resourceId, userId]);
    }

    // 3. 返回结果
    const result = {
      hasPii,
      piiList: hasPii ? [{ type: 'phone/email', values: ['敏感信息'] }] : [],
      privacyLevel
    };
    return res.json(responseUtil.success(result));

  } catch (err) {
    console.error("隐私分级失败：", err);
    next(err);
  }
});

/**
 * 获取资源隐私等级接口（从数据库读取）
 * GET /api/privacy/level
 */
router.get('/level', resourceAuth, async (req, res, next) => {
  try {
    const { userId, resourceId } = req.query;
    
    // 参数校验
    if (!userId || !resourceId) {
      return res.json(responseUtil.error('缺少参数：userId/resourceId', 400));
    }

    // 1. 从资源表查询隐私等级
    const querySql = `
      SELECT privacy_level FROM resource 
      WHERE resource_id = ? AND user_id = ? AND is_delete = 0
    `;
    const resource = await db.getOne(querySql, [resourceId, userId]);

    // 2. 资源不存在
    if (!resource) {
      return res.json(responseUtil.error('资源不存在', 404));
    }

    // 3. 返回结果
    return res.json(responseUtil.success({
      resourceId,
      privacyLevel: resource.privacy_level,
      privacyDesc: getPrivacyDesc(resource.privacy_level)
    }));

  } catch (err) {
    console.error("获取隐私等级失败：", err);
    next(err);
  }
});

/**
 * 隐私等级描述转换
 */
const getPrivacyDesc = (level) => {
  const descMap = {
    0: '通用（无敏感信息）',
    1: '敏感（含轻微个人信息）',
    2: '极其敏感（含核心个人信息）'
  };
  return descMap[level] || '未知';
};

module.exports = router;