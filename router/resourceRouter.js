const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const lancedb = require('@lancedb/lancedb');
const PDFParser = require("pdf2json");
// 引入数据库工具（核心：替换模拟逻辑）
const { db, genid } = require("../db/dbUtils");
const { processPdfVectorization } = require('./materialRouter');
/**
 * 分页 SQL 包装工具
 * @param {string} sql 原始 SQL
 * @param {number} page 当前页
 * @param {number} pageSize 每页大小
 * @returns {string} 拼接了 LIMIT 的 SQL
 */
const wrapPaginationSql = (sql, page, pageSize) => {
    const p = Math.max(1, parseInt(page) || 1);
    const s = Math.max(1, parseInt(pageSize) || 10);
    const offset = (p - 1) * s;
    // 强制转换为数字字符串，确保安全
    return `${sql} LIMIT ${Number(s)} OFFSET ${Number(offset)}`;
};

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
    console.log("收到请求 Body:", req.body);
    console.log("收到文件 File:", req.file);
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
      if (fileType === 'pdf') {
    const subject = req.body.subject || "未分类";
    // 异步执行，不阻塞接口返回
    processPdfVectorization(file.path, file.originalname, subject, resourceId);
}
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
      const subject = req.body.subject || "未分类"; // 建议提到循环外获取一次即可
      
      // 参数校验
      if (!userId || !files || files.length === 0) {
        return res.json(responseUtil.error('缺少参数：userId/resourceFiles', 400));
      }

      const results = [];
      
      // 遍历处理每一个上传的文件
      for (const file of files) {
        try {
          // 1. 生成信息
          const resourceId = genid();
          const fileExt = file.originalname.split('.').pop().toLowerCase();
          const fileType = ['pdf', 'pptx', 'ppt'].includes(fileExt) ? fileExt : 'other';
          
          // 2. 计算 MD5
          const fileBuffer = fs.readFileSync(file.path);
          const md5Hash = crypto.createHash('md5');
          md5Hash.update(fileBuffer);
          const fileHash = md5Hash.digest('hex');

          // 3. 定义插入 SQL
          const insertSql = `
            INSERT INTO resource (
              resource_id, user_id, file_name, file_type, file_size, 
              file_hash, privacy_level, parse_status, storage_path
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          // 确定初始解析状态：PDF 设为 0 (解析中)，其他设为 1 (成功)
          const initialStatus = (fileType === 'pdf') ? 0 : 1;

          // 4. 写入数据库
          await db.execute(insertSql, [
            resourceId,
            userId,
            file.originalname,
            fileType,
            file.size,
            fileHash,
            0, // 默认隐私等级
            initialStatus,
            file.path
          ]);

          // 🌟 5. 关键逻辑：如果是 PDF，立即触发异步向量化解析
          if (fileType === 'pdf') {
            console.log(`[批量上传] 检测到 PDF，开始后台解析: ${file.originalname}`);
            // 注意：不加 await，让它异步跑
            processPdfVectorization(file.path, file.originalname, subject, resourceId);
          }

          // 收集成功结果
          results.push({
            fileName: file.originalname,
            resourceId,
            success: true,
            status: fileType === 'pdf' ? 'parsing' : 'completed'
          });

        } catch (innerErr) {
          console.error(`文件 ${file.originalname} 处理失败:`, innerErr);
          results.push({
            fileName: file.originalname,
            resourceId: '',
            success: false,
            error: innerErr.message
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
      console.error("批量上传接口崩溃：", err);
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
  },
  
  /**
   * 获取用户资源列表接口
   * 支持分页、类型过滤、关键词搜索
   */
  getResourceList: async (req, res, next) => {
    try {
      const { userId, page = 1, pageSize = 10, fileType, keyword } = req.query;

      if (!userId) {
        return res.json(responseUtil.error('userId不能为空', 400));
      }

      const currentPage = parseInt(page);
      const size = parseInt(pageSize);
      const offset = (currentPage - 1) * size;

      // 1. 构建查询条件 (适配现有的软删除 is_delete)
      let whereSql = "WHERE user_id = ? AND is_delete = 0";
      let params = [userId];

      // 类型过滤 (ppt, video, audio, note, pdf)
      if (fileType) {
        whereSql += " AND file_type = ?";
        params.push(fileType);
      }

      // 关键词搜索 (模糊匹配文件名)
      if (keyword) {
        whereSql += " AND file_name LIKE ?";
        params.push(`%${keyword}%`);
      }

      // 2. 查询总记录数 (用于分页计算)
      const countSql = `SELECT COUNT(*) as total FROM resource ${whereSql}`;
      const countRes = await db.execute(countSql, params);
      const total = countRes[0].total;

      // 3. 查询分页数据 (适配 README 定义的返回字段)
      const baseListSql = `
        SELECT 
          resource_id as resourceId, 
          file_name as title, 
          file_type as type, 
          file_size as fileSize, 
          create_time as createTime
        FROM resource 
        ${whereSql}
        ORDER BY create_time DESC
      `;
      console.log("SQL参数检查:", [...params, size, offset]);
      console.log('分页参数:', { size, offset, params });

      // 4. 使用工具函数拼接分页 (解决占位符失效问题)
      const listSql = wrapPaginationSql(baseListSql, page, pageSize);

      // 【关键】此时 SQL 里的 ? 只有 whereSql 里的那些，所以只传 params
      const list = await db.execute(listSql, params);

      // 4. 封装返回结果
      return res.json(responseUtil.success({
        total: total,
        pages: Math.ceil(total / size),
        list: list.map(item => ({
          resourceId: item.resourceId,
          title: item.title,
          type: item.type === 'pptx' ? 'ppt' : item.type, // 兼容性转换
          coverUrl: null, // 预留封面图字段
          fileSize: (item.fileSize / 1024 / 1024).toFixed(2) + 'MB', // 格式化大小
          createTime: item.createTime ? item.createTime.toISOString() : null
        }))
      }, "查询成功"));

    } catch (err) {
      console.error("获取资源列表失败：", err);
      next(err);
    }
  }
};

// 挂载路由
router.post('/upload', resourceAuth, singleUpload, resourceController.uploadAndParseResource);
router.post('/upload/batch', resourceAuth, multiUpload, resourceController.batchUploadAndParse);
router.get('/list', resourceAuth, resourceController.getResourceList);
router.get('/info', resourceAuth, resourceController.getResourceInfo);
router.get('/index', resourceAuth, resourceController.getResourceIndex);
router.delete('/delete', resourceAuth, resourceController.deleteResource);

module.exports = router;