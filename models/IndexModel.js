/**
 * 双路索引模型，语义索引+关键词索引统一结构
 * 关联resourceId和知识点ID，为后端2号检索提供索引基础
 */
class IndexModel {
  constructor({
    indexId,     // 索引唯一ID
    resourceId,  // 关联资源ID
    userId,      // 用户ID
    knowledgeId, // 关联知识点ID（与后端2/3号统一）
    chunkId,     // 资源切分后的块ID
    semanticVector, // 1024维语义向量（Float32Array）
    keywords,    // 关键词数组：['微指令', '字段编码', '计组']
    position,    // 资源内位置：{page: 5, timeStart: 120, timeEnd: 180}
    createTime
  }) {
    this.indexId = indexId;
    this.resourceId = resourceId;
    this.userId = userId;
    this.knowledgeId = knowledgeId;
    this.chunkId = chunkId;
    this.semanticVector = semanticVector;
    this.keywords = keywords;
    this.position = position; // PPT：页码；音视频：时间戳；文本：段落
    this.createTime = createTime || new Date().toISOString();
  }

  toJSON() {
    return { ...this, semanticVector: Array.from(this.semanticVector) };
  }
}

module.exports = IndexModel;