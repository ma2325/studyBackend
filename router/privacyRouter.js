const express = require('express');
const router = express.Router();

// 🌟 适配：注释不存在的依赖，模拟核心方法
// const { detectPrivacy, recognizePii } = require('../services/privacyService');
// const responseUtil = require('../utils/responseUtil');
// const resourceAuth = require('../middlewares/resourceAuth');

/**
 * 模拟响应工具类（替代responseUtil）
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
 * 模拟资源认证中间件（替代resourceAuth）
 */
const resourceAuth = (req, res, next) => {
    // 测试阶段跳过认证，直接放行
    next();
};

/**
 * PII敏感信息识别接口
 * POST /api/privacy/recognize
 */
router.post('/recognize', resourceAuth, async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.json(responseUtil.error('缺少参数：content', 400));
    }

    // 🌟 适配：模拟PII识别结果（替代真实服务层逻辑）
    // const result = await recognizePii(content);
    const phoneRegex = /1[3-9]\d{9}/g;
    const emailRegex = /\w+@\w+\.\w+/g;
    const phones = content.match(phoneRegex) || [];
    const emails = content.match(emailRegex) || [];
    const result = {
      hasPii: phones.length > 0 || emails.length > 0,
      piiList: [
        { type: 'phone', values: phones },
        { type: 'email', values: emails }
      ],
      piiCount: phones.length + emails.length
    };

    return res.json(responseUtil.success(result));
  } catch (err) {
    next(err);
  }
});

/**
 * 隐私分级判定接口
 * POST /api/privacy/classify
 */
router.post('/classify', resourceAuth, async (req, res, next) => {
  try {
    const { content, fileType, userPrivacyMark } = req.body;
    if (!content || !fileType) {
      return res.json(responseUtil.error('缺少参数：content/fileType', 400));
    }

    // 🌟 适配：模拟隐私分级结果（替代真实服务层逻辑）
    // const result = await detectPrivacy(content, fileType, userPrivacyMark);
    const hasPii = /1[3-9]\d{9}/g.test(content) || /\w+@\w+\.\w+/g.test(content);
    const privacyLevel = userPrivacyMark ?? (hasPii ? 2 : 0);
    const result = {
      hasPii,
      piiList: hasPii ? [{ type: 'phone/email', values: ['敏感信息'] }] : [],
      privacyLevel
    };

    return res.json(responseUtil.success(result));
  } catch (err) {
    next(err);
  }
});

/**
 * 获取资源隐私等级接口
 * GET /api/privacy/level
 */
router.get('/level', resourceAuth, async (req, res, next) => {
  try {
    const { userId, resourceId } = req.query;
    if (!userId || !resourceId) {
      return res.json(responseUtil.error('缺少参数：userId/resourceId', 400));
    }

    // 🌟 适配：模拟资源查询结果（替代真实服务层逻辑）
    // const { getResource } = require('../services/syncService');
    // const resource = await getResource(userId, resourceId);
    const resource = {
      resourceId,
      privacyLevel: 0 // 模拟通用等级
    };

    if (!resource) {
      return res.json(responseUtil.error('资源不存在', 404));
    }
    return res.json(responseUtil.success({
      resourceId,
      privacyLevel: resource.privacyLevel,
      privacyDesc: getPrivacyDesc(resource.privacyLevel)
    }));
  } catch (err) {
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