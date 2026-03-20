const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
// 引入数据库工具（核心：替换模拟逻辑）
const { db, genid } = require("../db/dbUtils");

/**
 * 真实文件上传中间件（保留原有逻辑，优化路径）
 */
const upload = multer({
  dest: path.join(__dirname, '../storage/temp'),
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB限制
});
const singleUpload = upload.single('resourceFile');
const multiUpload = upload.array('resourceFiles', 10);

/**
 * 资源认证中间件（测试阶段放行，后续可补充token校验）
 */
const resourceAuth = (req, res, next) => {
  next();
};

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
 * 资源控制器（接入数据库版）
 */
const resourceController = {
  // 单文件上传（写入数据库）
  uploadAndParseResource: async (req, res, next) => {
    try {
      const { userId, userPrivacyMark } = req.body;
      const file = req.file;
      
      // 参数校验
      if (!userId || !file) {
        return res.json(responseUtil.error('缺少参数：userId/resourceFile', 400));
      }

      // 1. 生成唯一资源ID
      const resourceId = genid();
      // 2. 获取文件基础信息
      const fileExt = file.originalname.split('.').pop().toLowerCase();
      const fileType = ['pdf', 'pptx', 'ppt'].includes(fileExt) ? fileExt : 'other';
      // 3. 计算文件MD5（用于去重）
      const md5Hash = crypto.createHash('md5');
      md5Hash.update(fs.readFileSync(file.path));
      const fileHash = md5Hash.digest('hex');

      // 4. 写入数据库（resource表）
      const insertSql = `
        INSERT INTO resource (
          resource_id, user_id, file_name, file_type, file_size, 
          file_hash, privacy_level, parse_status, storage_path
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const insertParams = [
        resourceId,
        userId,
        file.originalname,
        fileType,
        file.size,
        fileHash,
        userPrivacyMark || 0,
        1, // 解析状态：成功
        file.path // 本地存储路径
      ];
      await db.execute(insertSql, insertParams);

      // 5. 返回结果（保持原有格式）
      const result = {
        resourceId,
        fileName: file.originalname,
        fileType: fileType === 'pptx' ? 'ppt' : fileType, // 兼容原有返回格式
        privacyLevel: userPrivacyMark || 0,
        parseStatus: 'success'
      };
      res.json(responseUtil.success(result));

    } catch (err) {
      console.error("文件上传失败：", err);
      next(err);
    }
  },

  // 批量上传（写入数据库）
  batchUploadAndParse: async (req, res, next) => {
    try {
      const { userId } = req.body;
      const files = req.files;
      
      // 参数校验
      if (!userId || !files || files.length === 0) {
        return res.json(responseUtil.error('缺少参数：userId/resourceFiles', 400));
      }

      // 批量插入数据库
      const results = [];
      for (const file of files) {
        try {
          // 生成唯一ID
          const resourceId = genid();
          // 文件信息
          const fileExt = file.originalname.split('.').pop().toLowerCase();
          const fileType = ['pdf', 'pptx', 'ppt'].includes(fileExt) ? fileExt : 'other';
          // MD5哈希
          const md5Hash = crypto.createHash('md5');
          md5Hash.update(fs.readFileSync(file.path));
          const fileHash = md5Hash.digest('hex');

          // 插入数据库
          const insertSql = `
            INSERT INTO resource (
              resource_id, user_id, file_name, file_type, file_size, 
              file_hash, privacy_level, parse_status, storage_path
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          await db.execute(insertSql, [
            resourceId,
            userId,
            file.originalname,
            fileType,
            file.size,
            fileHash,
            0, // 默认通用等级
            1,
            file.path
          ]);

          // 收集结果
          results.push({
            fileName: file.originalname,
            resourceId,
            success: true
          });
        } catch (err) {
          results.push({
            fileName: file.originalname,
            resourceId: '',
            success: false,
            error: err.message
          });
        }
      }

      // 返回批量结果
      res.json(responseUtil.success({
        total: files.length,
        successCount: results.filter(item => item.success).length,
        details: results
      }));

    } catch (err) {
      console.error("批量上传失败：", err);
      next(err);
    }
  },

  // 获取资源信息（从数据库读取）
  getResourceInfo: async (req, res, next) => {
    try {
      const { userId, resourceId } = req.query;
      
      // 参数校验
      if (!userId || !resourceId) {
        return res.json(responseUtil.error('缺少参数：userId/resourceId', 400));
      }

      // 从数据库查询资源
      const querySql = `
        SELECT resource_id, user_id, file_name, file_type, privacy_level, create_time 
        FROM resource 
        WHERE resource_id = ? AND user_id = ? AND is_delete = 0
      `;
      const resource = await db.getOne(querySql, [resourceId, userId]);

      // 资源不存在
      if (!resource) {
        return res.json(responseUtil.error('资源不存在', 404));
      }

      // 格式化返回结果（保持原有格式）
      const result = {
        resourceId: resource.resource_id,
        userId: resource.user_id,
        fileName: resource.file_name,
        fileType: resource.file_type === 'pptx' ? 'ppt' : resource.file_type,
        privacyLevel: resource.privacy_level,
        createTime: resource.create_time.toISOString()
      };
      res.json(responseUtil.success(result));

    } catch (err) {
      console.error("获取资源信息失败：", err);
      next(err);
    }
  },

  // 获取资源索引（模拟+数据库结合，后续可扩展）
  getResourceIndex: async (req, res, next) => {
    try {
      const { userId, resourceId } = req.query;
      
      // 参数校验
      if (!userId || !resourceId) {
        return res.json(responseUtil.error('缺少参数：userId/resourceId', 400));
      }

      // 先验证资源是否存在
      const checkSql = `
        SELECT id FROM resource 
        WHERE resource_id = ? AND user_id = ? AND is_delete = 0
      `;
      const resource = await db.getOne(checkSql, [resourceId, userId]);
      if (!resource) {
        return res.json(responseUtil.error('资源不存在', 404));
      }

      // 模拟索引数据（后续可从解析表读取真实索引）
      const result = {
        resourceId,
        keywordIndex: [{ indexId: 'idx_1', keywords: ['测试', 'PPT'], position: { page: 1 } }],
        semanticIndex: []
      };
      res.json(responseUtil.success(result));

    } catch (err) {
      console.error("获取资源索引失败：", err);
      next(err);
    }
  },

  // 删除资源（软删除，更新is_delete字段）
  deleteResource: async (req, res, next) => {
    try {
      const { userId, resourceId } = req.body;
      
      // 参数校验
      if (!userId || !resourceId) {
        return res.json(responseUtil.error('缺少参数：userId/resourceId', 400));
      }

      // 软删除：更新is_delete=1
      const deleteSql = `
        UPDATE resource 
        SET is_delete = 1, update_time = CURRENT_TIMESTAMP 
        WHERE resource_id = ? AND user_id = ?
      `;
      const result = await db.execute(deleteSql, [resourceId, userId]);

      // 验证是否删除成功
      if (result.affectedRows > 0) {
        res.json(responseUtil.success(null, '资源删除成功'));
      } else {
        res.json(responseUtil.error('资源不存在或无权限删除', 404));
      }

    } catch (err) {
      console.error("删除资源失败：", err);
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