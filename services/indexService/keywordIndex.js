const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { ensureDir, getLocalPath } = require('../../utils/fileUtil');
const IndexModel = require('../../models/IndexModel');

/**
 * 构建关键词倒排索引（本地JSON文件存储，轻量版）
 * 生产环境可替换为Elasticsearch/MySQL
 * @param {string} userId 用户ID
 * @param {object} resource 资源模型对象
 * @param {Array} parsedData 解析后的结构化数据
 * @returns {Promise<Array<IndexModel>>} 索引模型列表
 */
const buildKeywordIndex = async (userId, resource, parsedData) => {
  // 1. 创建索引存储目录
  const indexDir = getLocalPath(`index/keyword/${userId}`);
  ensureDir(indexDir);
  const indexPath = path.join(indexDir, `${resource.resourceId}.json`);

  // 2. 提取关键词并构建索引
  const indexList = [];
  for (let i = 0; i < parsedData.length; i++) {
    const chunk = parsedData[i];
    const chunkId = `${resource.resourceId}_chunk_${i}`;
    
    // 简单关键词提取（可替换为jieba分词等）
    const keywords = extractKeywords(chunk.text);
    
    // 构建索引模型
    const indexModel = new IndexModel({
      indexId: uuidv4(),
      resourceId: resource.resourceId,
      userId,
      knowledgeId: `knowledge_${uuidv4().slice(0, 8)}`, // 临时生成，后续与后端2号对齐
      chunkId,
      semanticVector: new Float32Array(1024).fill(0), // 占位，语义索引单独处理
      keywords,
      position: chunk.position || { page: i + 1 }
    });
    indexList.push(indexModel);
  }

  // 3. 保存索引到本地文件
  fs.writeFileSync(indexPath, JSON.stringify(indexList.map(item => item.toJSON()), null, 2));

  return indexList;
};

/**
 * 简单关键词提取（基于停用词过滤+长度筛选）
 * @param {string} text 文本内容
 * @returns {Array<string>} 关键词列表
 */
const extractKeywords = (text) => {
  // 基础停用词表
  const stopWords = ['的', '了', '是', '我', '你', '他', '我们', '你们', '他们', '在', '有', '就', '不', '和', '也', '这', '那'];
  return text
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, ' ') // 过滤特殊字符
    .split(/\s+/)
    .filter(word => word.length >= 2 && !stopWords.includes(word)) // 筛选长度≥2且非停用词
    .filter((value, index, self) => self.indexOf(value) === index); // 去重
};

/**
 * 读取关键词索引
 * @param {string} userId 用户ID
 * @param {string} resourceId 资源ID
 * @returns {Array<IndexModel>} 索引列表
 */
const readKeywordIndex = async (userId, resourceId) => {
  const indexPath = getLocalPath(`index/keyword/${userId}/${resourceId}.json`);
  if (!fs.existsSync(indexPath)) {
    return [];
  }
  const rawData = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  return rawData.map(item => new IndexModel(item));
};

module.exports = {
  buildKeywordIndex,
  readKeywordIndex,
  extractKeywords
};