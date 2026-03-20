const express = require('express');
const router = express.Router();

// 🌟 适配：注释不存在的依赖，模拟核心方法
// const { fetchBilibiliResource, fetchZhihuResource } = require('../services/thirdPartyService');
// const responseUtil = require('../utils/responseUtil');
// const resourceAuth = require('../middlewares/resourceAuth');

/**
 * 模拟响应工具类
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
 * 模拟资源认证中间件
 */
const resourceAuth = (req, res, next) => {
  next();
};

/**
 * 整合B站资源接口
 * POST /api/third-party/bilibili
 */
router.post('/bilibili', resourceAuth, async (req, res, next) => {
  try {
    const { userId, url, title } = req.body;
    if (!userId || !url) {
      return res.json(responseUtil.error('缺少参数：userId/url', 400));
    }

    // 🌟 适配：模拟B站资源整合结果
    // const result = await fetchBilibiliResource(userId, url, title);
    const result = {
      resourceId: `bilibili_${Date.now()}`,
      userId,
      url,
      title: title || '模拟B站视频标题',
      createTime: new Date().toISOString()
    };

    return res.json(responseUtil.success(result));
  } catch (err) {
    next(err);
  }
});

/**
 * 整合知乎资源接口
 * POST /api/third-party/zhihu
 */
router.post('/zhihu', resourceAuth, async (req, res, next) => {
  try {
    const { userId, url, title } = req.body;
    if (!userId || !url) {
      return res.json(responseUtil.error('缺少参数：userId/url', 400));
    }

    // 🌟 适配：模拟知乎资源整合结果
    // const result = await fetchZhihuResource(userId, url, title);
    const result = {
      resourceId: `zhihu_${Date.now()}`,
      userId,
      url,
      title: title || '模拟知乎文章标题',
      createTime: new Date().toISOString()
    };

    return res.json(responseUtil.success(result));
  } catch (err) {
    next(err);
  }
});

/**
 * 获取第三方资源列表接口
 * GET /api/third-party/list
 */
router.get('/list', resourceAuth, async (req, res, next) => {
  try {
    const { userId, type } = req.query;
    if (!userId) {
      return res.json(responseUtil.error('缺少参数：userId', 400));
    }

    // 🌟 适配：模拟第三方资源列表
    // const { getThirdPartyList } = require('../services/thirdPartyService');
    // const list = await getThirdPartyList(userId, type);
    const list = [
      {
        resourceId: `bilibili_${Date.now() - 1000}`,
        type: 'bilibili',
        url: 'https://www.bilibili.com/video/123456',
        title: '模拟B站视频'
      },
      {
        resourceId: `zhihu_${Date.now() - 2000}`,
        type: 'zhihu',
        url: 'https://www.zhihu.com/article/123456',
        title: '模拟知乎文章'
      }
    ].filter(item => !type || item.type === type);

    return res.json(responseUtil.success(list));
  } catch (err) {
    next(err);
  }
});

module.exports = router;