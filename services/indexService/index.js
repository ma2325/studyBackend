/**
 * 双路索引服务入口
 * 统一导出语义索引、关键词索引构建方法
 */
const { buildSemanticIndex, getDbInstance } = require('./semanticIndex');
const { buildKeywordIndex, readKeywordIndex } = require('./keywordIndex');

/**
 * 双路索引构建全流程
 * @param {string} userId 用户ID
 * @param {object} resource 资源模型对象
 * @param {Array} parsedData 解析后的结构化数据
 * @returns {Promise<{semantic: boolean, keyword: boolean}>} 构建结果
 */
const buildDualIndex = async (userId, resource, parsedData) => {
  // 1. 构建关键词索引
  const keywordIndexList = await buildKeywordIndex(userId, resource, parsedData);
  
  // 2. 构建语义索引（复用关键词索引的基础数据）
  const semanticResult = await buildSemanticIndex(userId, keywordIndexList);

  return {
    semantic: semanticResult,
    keyword: true
  };
};

module.exports = {
  buildSemanticIndex,
  buildKeywordIndex,
  buildDualIndex,
  readKeywordIndex,
  getDbInstance
};