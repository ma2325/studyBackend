const fs = require('fs');
const path = require('path');
const { storage } = require('../config');
const { ensureDir, calculateFileHash, encryptFile, getLocalPath } = require('../utils/fileUtil');
const ResourceModel = require('../models/ResourceModel');

/**
 * 端云分流存储：根据隐私等级决定存储位置
 * @param {ResourceModel} resource 资源模型
 * @param {string} sourcePath 源文件路径
 * @returns {Promise<{type: string, path: string}>} 存储结果
 */
const splitStorage = async (resource, sourcePath) => {
  // 极其敏感数据：本地加密存储
  if (resource.privacyLevel === 2) {
    const targetDir = getLocalPath(`original/${resource.userId}/sensitive`);
    ensureDir(targetDir);
    const targetPath = path.join(targetDir, `${resource.resourceId}_encrypted`);
    
    // 加密文件
    await encryptFile(sourcePath, targetPath);
    
    // 删除临时文件
    fs.unlinkSync(sourcePath);

    return {
      type: 'local',
      path: targetPath
    };
  }

  // 非敏感数据：优先云端，本地兜底
  if (storage.cloudOss.enable) {
    // 云端OSS存储逻辑（示例）
    // await uploadToOss(sourcePath, resource.resourceId);
    return {
      type: 'cloud',
      path: `oss://${storage.cloudOss.bucket}/${resource.resourceId}`
    };
  } else {
    // 本地非加密存储
    const targetDir = getLocalPath(`original/${resource.userId}/normal`);
    ensureDir(targetDir);
    const targetPath = path.join(targetDir, resource.fileName);
    fs.renameSync(sourcePath, targetPath);
    
    return {
      type: 'local',
      path: targetPath
    };
  }
};

/**
 * 增量同步：记录资源哈希，避免重复解析
 * @param {ResourceModel} resource 资源模型
 * @returns {Promise<boolean>} 同步结果
 */
const syncResource = async (resource) => {
  // 1. 创建同步记录目录
  const syncDir = getLocalPath(`sync/${resource.userId}`);
  ensureDir(syncDir);
  const syncPath = path.join(syncDir, 'resource_sync.json');

  // 2. 读取现有同步记录
  let syncRecords = {};
  if (fs.existsSync(syncPath)) {
    syncRecords = JSON.parse(fs.readFileSync(syncPath, 'utf8'));
  }

  // 3. 更新同步记录（resourceId -> {hash, updateTime}）
  syncRecords[resource.resourceId] = {
    hash: resource.fileHash,
    updateTime: resource.updateTime,
    privacyLevel: resource.privacyLevel,
    storageType: resource.storageType
  };

  // 4. 保存同步记录
  fs.writeFileSync(syncPath, JSON.stringify(syncRecords, null, 2));

  return true;
};

/**
 * 检查资源是否需要增量更新
 * @param {string} userId 用户ID
 * @param {string} resourceId 资源ID
 * @param {string} newHash 新文件哈希
 * @returns {Promise<boolean>} 是否需要更新
 */
const needIncrementalUpdate = async (userId, resourceId, newHash) => {
  const syncPath = getLocalPath(`sync/${userId}/resource_sync.json`);
  if (!fs.existsSync(syncPath)) {
    return true;
  }
  const syncRecords = JSON.parse(fs.readFileSync(syncPath, 'utf8'));
  const oldRecord = syncRecords[resourceId];
  return !oldRecord || oldRecord.hash !== newHash;
};

/**
 * 获取资源同步信息
 * @param {string} userId 用户ID
 * @param {string} resourceId 资源ID
 * @returns {Promise<ResourceModel|null>} 资源模型
 */
const getResource = async (userId, resourceId) => {
  const resourcePath = getLocalPath(`sync/${userId}/resource_${resourceId}.json`);
  if (!fs.existsSync(resourcePath)) {
    return null;
  }
  const rawData = JSON.parse(fs.readFileSync(resourcePath, 'utf8'));
  return new ResourceModel(rawData);
};

/**
 * 保存资源元数据
 * @param {ResourceModel} resource 资源模型
 * @returns {Promise<boolean>} 保存结果
 */
const saveResourceMeta = async (resource) => {
  const metaDir = getLocalPath(`sync/${resource.userId}`);
  ensureDir(metaDir);
  const metaPath = path.join(metaDir, `resource_${resource.resourceId}.json`);
  fs.writeFileSync(metaPath, JSON.stringify(resource.toJSON(), null, 2));
  return true;
};

module.exports = {
  splitStorage,
  syncResource,
  needIncrementalUpdate,
  getResource,
  saveResourceMeta
};