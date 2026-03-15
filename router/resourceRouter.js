const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 🌟 适配：注释不存在的依赖，模拟核心方法
// const resourceController = require('../controllers/resourceController');
// const { singleUpload, multiUpload } = require('../middlewares/fileUpload');
// const resourceAuth = require('../middlewares/resourceAuth');

/**
 * 模拟文件上传中间件（替代fileUpload）
 */
const upload = multer({
  dest: path.join(__dirname, '../storage/temp'),
  limits: { fileSize: 100 * 1024 * 1024 }
});
const singleUpload = upload.single('resourceFile');
const multiUpload = upload.array('resourceFiles', 10);

/**
 * 模拟资源认证中间件
 */
const resourceAuth = (req, res, next) => {
  next();
};

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
 * 模拟资源控制器方法（替代resourceController）
 */
const resourceController = {
  // 单文件上传
  uploadAndParseResource: async (req, res, next) => {
    try {
      const { userId, userPrivacyMark } = req.body;
      const file = req.file;
      if (!userId || !file) {
        return res.json(responseUtil.error('缺少参数：userId/resourceFile', 400));
      }
      // 模拟解析结果
      const resourceId = `res_${Date.now()}`;
      const result = {
        resourceId,
        fileName: file.originalname,
        fileType: file.originalname.endsWith('.pdf') ? 'pdf' : 'ppt',
        privacyLevel: userPrivacyMark || 0,
        parseStatus: 'success'
      };
      res.json(responseUtil.success(result));
    } catch (err) {
      next(err);
    }
  },

  // 批量上传
  batchUploadAndParse: async (req, res, next) => {
    try {
      const { userId } = req.body;
      const files = req.files;
      if (!userId || !files) {
        return res.json(responseUtil.error('缺少参数：userId/resourceFiles', 400));
      }
      // 模拟批量结果
      const results = files.map(file => ({
        fileName: file.originalname,
        resourceId: `res_${Date.now()}_${file.originalname}`,
        success: true
      }));
      res.json(responseUtil.success({
        total: files.length,
        successCount: results.length,
        details: results
      }));
    } catch (err) {
      next(err);
    }
  },

  // 获取资源信息
  getResourceInfo: async (req, res, next) => {
    try {
      const { userId, resourceId } = req.query;
      if (!userId || !resourceId) {
        return res.json(responseUtil.error('缺少参数：userId/resourceId', 400));
      }
      // 模拟资源信息
      const result = {
        resourceId,
        userId,
        fileName: 'test.pptx',
        fileType: 'ppt',
        privacyLevel: 0,
        createTime: new Date().toISOString()
      };
      res.json(responseUtil.success(result));
    } catch (err) {
      next(err);
    }
  },

  // 获取资源索引
  getResourceIndex: async (req, res, next) => {
    try {
      const { userId, resourceId } = req.query;
      if (!userId || !resourceId) {
        return res.json(responseUtil.error('缺少参数：userId/resourceId', 400));
      }
      // 模拟索引信息
      const result = {
        resourceId,
        keywordIndex: [{ indexId: 'idx_1', keywords: ['测试', 'PPT'], position: { page: 1 } }],
        semanticIndex: []
      };
      res.json(responseUtil.success(result));
    } catch (err) {
      next(err);
    }
  },

  // 删除资源
  deleteResource: async (req, res, next) => {
    try {
      const { userId, resourceId } = req.body;
      if (!userId || !resourceId) {
        return res.json(responseUtil.error('缺少参数：userId/resourceId', 400));
      }
      // 模拟删除成功
      res.json(responseUtil.success(null, '资源删除成功'));
    } catch (err) {
      next(err);
    }
  }
};

// 挂载路由
router.post('/upload', resourceAuth, singleUpload, resourceController.uploadAndParseResource);
router.post('/upload/batch', resourceAuth, multiUpload, resourceController.batchUploadAndParse);
router.get('/info', resourceAuth, resourceController.getResourceInfo);
router.get('/index', resourceAuth, resourceController.getResourceIndex);
router.delete('/delete', resourceAuth, resourceController.deleteResource);

module.exports = router;