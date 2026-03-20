const path = require('path');
const { v4: uuidv4 } = require('uuid');
const ResourceModel = require('../models/ResourceModel');
const { parsePpt, parsePdf, parseAudioVideo } = require('../services/parseService');
const { recognizePii, classifyPrivacyLevel } = require('../services/privacyService');
const { buildSemanticIndex, buildKeywordIndex } = require('../services/indexService');
const { syncResource, splitStorage } = require('../services/syncService');
const { calculateFileHash, encryptFile, ensureDir, getLocalPath } = require('../utils/fileUtil');
const responseUtil = require('../utils/responseUtil');

/**
 * 资源上传与解析接口
 * @param {req} req 请求对象：userId、file、userPrivacyMark（可选）
 * @param {res} res 响应对象
 */
const uploadAndParseResource = async (req, res, next) => {
  try {
    const { userId, userPrivacyMark } = req.body;
    const file = req.file;
    if (!userId || !file) {
      return res.json(responseUtil.error('缺少必要参数：userId/文件', 400));
    }

    // 1. 基础信息初始化
    const fileHash = await calculateFileHash(file.path);
    const resourceId = `${userId}_${Date.now()}_${fileHash.slice(0, 8)}`;
    const fileType = file.mimetype.includes('ppt') ? 'ppt' : 
                     file.mimetype.includes('pdf') ? 'pdf' :
                     file.mimetype.includes('audio') || file.mimetype.includes('video') ? 'audio-video' : 'text';

    // 2. 资源模型初始化
    const resource = new ResourceModel({
      resourceId,
      userId,
      fileName: file.originalname,
      fileType,
      fileSize: file.size,
      fileHash,
      parseStatus: 'processing'
    });

    // 3. 多格式资源解析
    let parsedData = [];
    switch (fileType) {
      case 'ppt':
        parsedData = await parsePpt(file.path, resourceId);
        break;
      case 'pdf':
        parsedData = await parsePdf(file.path, resourceId);
        break;
      case 'audio-video':
        parsedData = await parseAudioVideo(file.path, resourceId);
        break;
      default:
        parsedData = [{ text: fs.readFileSync(file.path, 'utf8') }];
    }
    resource.updateInfo({ parseStatus: 'success', parsedData });

    // 4. 隐私分级判定（PII识别+分级）
    const content = parsedData.map(item => item.text).join('\n');
    const piiResult = await recognizePii(content);
    const privacyLevel = await classifyPrivacyLevel(piiResult, fileType, userPrivacyMark);
    resource.updateInfo({ privacyLevel });

    // 5. 端云分流存储（极其敏感：本地加密；其他：按需云端）
    const storageResult = await splitStorage(resource, file.path);
    resource.updateInfo({
      storageType: storageResult.type,
      storagePath: storageResult.path
    });

    // 6. 双路索引构建（语义+关键词）
    const indexList = await buildKeywordIndex(userId, resource, parsedData);
    await buildSemanticIndex(userId, indexList);

    // 7. 增量同步（更新本地索引哈希）
    await syncResource(resource);

    // 8. 返回结果（仅返回资源基础信息，不返回敏感数据）
    return res.json(responseUtil.success({
      resourceId: resource.resourceId,
      fileName: resource.fileName,
      fileType: resource.fileType,
      privacyLevel: resource.privacyLevel,
      parseStatus: resource.parseStatus,
      createTime: resource.createTime
    }));

  } catch (err) {
    next(err);
  }
};

/**
 * 获取资源基础信息接口
 * @param {req} req 请求对象：userId、resourceId
 * @param {res} res 响应对象
 */
const getResourceInfo = async (req, res, next) => {
  try {
    const { userId, resourceId } = req.query;
    if (!userId || !resourceId) {
      return res.json(responseUtil.error('缺少必要参数：userId/resourceId', 400));
    }
    // 从本地存储获取资源信息（实际可结合本地数据库）
    const resource = await syncResource.getResource(userId, resourceId);
    if (!resource) {
      return res.json(responseUtil.error('资源不存在', 404));
    }
    return res.json(responseUtil.success(resource));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  uploadAndParseResource,
  getResourceInfo
};

/**
 * 批量上传与解析资源
 * @param {req} req 请求对象
 * @param {res} res 响应对象
 * @param {next} next 下一步中间件
 */
const batchUploadAndParseResource = async (req, res, next) => {
  try {
    const { userId, userPrivacyMark } = req.body;
    const files = req.files;
    if (!userId || !files || files.length === 0) {
      return res.json(responseUtil.error('缺少必要参数：userId/文件', 400));
    }

    // 批量处理每个文件
    const results = [];
    for (const file of files) {
      try {
        // 复用单文件处理逻辑
        const fileResult = await handleSingleFile(userId, file, userPrivacyMark);
        results.push({
          fileName: file.originalname,
          success: true,
          data: fileResult
        });
      } catch (err) {
        results.push({
          fileName: file.originalname,
          success: false,
          error: err.message
        });
      }
    }

    return res.json(responseUtil.success({
      total: files.length,
      successCount: results.filter(item => item.success).length,
      failCount: results.filter(item => !item.success).length,
      details: results
    }));

  } catch (err) {
    next(err);
  }
};

/**
 * 获取资源索引信息
 * @param {req} req 请求对象
 * @param {res} res 响应对象
 * @param {next} next 下一步中间件
 */
const getResourceIndex = async (req, res, next) => {
  try {
    const { userId, resourceId } = req.query;
    if (!userId || !resourceId) {
      return res.json(responseUtil.error('缺少必要参数：userId/resourceId', 400));
    }

    // 获取关键词索引
    const { readKeywordIndex } = require('../services/indexService');
    const keywordIndex = await readKeywordIndex(userId, resourceId);

    // 获取语义索引（简化版）
    // const { getDbInstance } = require('../services/indexService/semanticIndex');
    // const semanticIndex = await getSemanticIndex(userId, resourceId);

    return res.json(responseUtil.success({
      resourceId,
      keywordIndex: keywordIndex.map(item => ({
        indexId: item.indexId,
        knowledgeId: item.knowledgeId,
        keywords: item.keywords,
        position: item.position
      })),
      semanticIndex: [] // 占位，实际项目中补充
    }));

  } catch (err) {
    next(err);
  }
};

/**
 * 删除资源
 * @param {req} req 请求对象
 * @param {res} res 响应对象
 * @param {next} next 下一步中间件
 */
const deleteResource = async (req, res, next) => {
  try {
    const { userId, resourceId } = req.body;
    if (!userId || !resourceId) {
      return res.json(responseUtil.error('缺少必要参数：userId/resourceId', 400));
    }

    // 1. 删除本地文件
    const { getResource } = require('../services/syncService');
    const resource = await getResource(userId, resourceId);
    if (resource && fs.existsSync(resource.storagePath)) {
      fs.unlinkSync(resource.storagePath);
    }

    // 2. 删除索引文件
    const indexPaths = [
      getLocalPath(`index/keyword/${userId}/${resourceId}.json`),
      getLocalPath(`index/vector/${userId}/${resourceId}`)
    ];
    indexPaths.forEach(path => {
      if (fs.existsSync(path)) {
        fs.rmSync(path, { recursive: true, force: true });
      }
    });

    // 3. 删除同步记录
    const syncPath = getLocalPath(`sync/${userId}/resource_sync.json`);
    if (fs.existsSync(syncPath)) {
      let syncRecords = JSON.parse(fs.readFileSync(syncPath, 'utf8'));
      delete syncRecords[resourceId];
      fs.writeFileSync(syncPath, JSON.stringify(syncRecords, null, 2));
    }

    return res.json(responseUtil.success(null, '资源删除成功'));

  } catch (err) {
    next(err);
  }
};

// 工具方法：处理单个文件（复用单文件逻辑）
const handleSingleFile = async (userId, file, userPrivacyMark) => {
  const fileHash = await calculateFileHash(file.path);
  const resourceId = `${userId}_${Date.now()}_${fileHash.slice(0, 8)}`;
  const fileType = getFileType(file.mimetype);

  // 初始化资源模型
  const resource = new ResourceModel({
    resourceId,
    userId,
    fileName: file.originalname,
    fileType,
    fileSize: file.size,
    fileHash,
    parseStatus: 'processing'
  });

  // 解析资源
  const { parseResource } = require('../services/parseService');
  const parsedData = await parseResource(fileType, file.path, resourceId);
  resource.updateInfo({ parseStatus: 'success', parsedData });

  // 隐私分级
  const content = parsedData.map(item => item.text).join('\n');
  const { detectPrivacy } = require('../services/privacyService');
  const privacyResult = await detectPrivacy(content, fileType, userPrivacyMark);
  resource.updateInfo({ privacyLevel: privacyResult.privacyLevel });

  // 端云分流存储
  const { splitStorage } = require('../services/syncService');
  const storageResult = await splitStorage(resource, file.path);
  resource.updateInfo({
    storageType: storageResult.type,
    storagePath: storageResult.path
  });

  // 构建双路索引
  const { buildDualIndex } = require('../services/indexService');
  await buildDualIndex(userId, resource, parsedData);

  // 增量同步
  const { syncResource, saveResourceMeta } = require('../services/syncService');
  await syncResource(resource);
  await saveResourceMeta(resource);

  return {
    resourceId: resource.resourceId,
    fileName: resource.fileName,
    fileType: resource.fileType,
    privacyLevel: resource.privacyLevel,
    parseStatus: resource.parseStatus
  };
};

// 辅助方法：根据mimetype判断文件类型
const getFileType = (mimetype) => {
  if (mimetype.includes('ppt')) return 'ppt';
  if (mimetype.includes('pdf')) return 'pdf';
  if (mimetype.includes('audio') || mimetype.includes('video')) return 'audio-video';
  return 'text';
};

// 导出新增方法
module.exports = {
  uploadAndParseResource,
  batchUploadAndParseResource,
  getResourceInfo,
  getResourceIndex,
  deleteResource
};