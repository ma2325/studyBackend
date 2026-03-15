/**
 * 资源基础模型，所有资源的统一数据结构
 * 作为与后端2/3/4号的核心交互模型，约定resourceId为全局唯一标识
 */
class ResourceModel {
  constructor({
    resourceId, // 全局唯一资源ID，规则：userID_时间戳_文件哈希
    userId,     // 用户ID，做资源归属
    fileName,   // 原始文件名
    fileType,   // 文件类型：ppt/pdf/audio/video/text/third-party
    fileSize,   // 文件大小
    fileHash,   // 文件哈希（增量同步用）
    parseStatus,// 解析状态：pending/processing/success/failed
    privacyLevel, // 隐私等级：0/1/2（对应NORMAL/SENSITIVE/HIGHLY_SENSITIVE）
    storageType, // 存储类型：local/cloud（端云分流）
    storagePath, // 存储路径（本地相对路径/云端OSS地址）
    parsedData,  // 解析后结构化数据（JSON）
    createTime,  // 创建时间
    updateTime   // 更新时间
  }) {
    this.resourceId = resourceId;
    this.userId = userId;
    this.fileName = fileName;
    this.fileType = fileType;
    this.fileSize = fileSize;
    this.fileHash = fileHash;
    this.parseStatus = parseStatus || 'pending';
    this.privacyLevel = privacyLevel || 0;
    this.storageType = storageType || 'local';
    this.storagePath = storagePath;
    this.parsedData = parsedData || {};
    this.createTime = createTime || new Date().toISOString();
    this.updateTime = updateTime || new Date().toISOString();
  }

  // 资源更新方法
  updateInfo(updatedData) {
    this.updateTime = new Date().toISOString();
    Object.assign(this, updatedData);
    return this;
  }

  // 转为JSON对象
  toJSON() {
    return { ...this };
  }
}

module.exports = ResourceModel;