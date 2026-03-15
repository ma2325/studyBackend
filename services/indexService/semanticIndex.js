const lancedb = require('vectordb');
const { vectorDb } = require('../../config');
const { ensureDir, getLocalPath } = require('../../utils/fileUtil');
const IndexModel = require('../../models/IndexModel');

// 初始化本地LanceDB连接
const initLanceDb = async () => {
  const dbDir = getLocalPath('index/vector');
  ensureDir(dbDir);
  const db = await lancedb.connect(dbDir);
  // 创建/打开向量表（按用户分表，保证隐私隔离）
  const createTable = async (userId) => {
    const tableName = `semantic_index_${userId}`;
    let table;
    try {
      table = await db.openTable(tableName);
    } catch (err) {
      // 表不存在则创建，字段与IndexModel一致
      table = await db.createTable(tableName, [
        { name: 'indexId', type: 'string' },
        { name: 'resourceId', type: 'string' },
        { name: 'knowledgeId', type: 'string' },
        { name: 'chunkId', type: 'string' },
        { name: 'semanticVector', type: 'fixed_size_list', dimensions: 1024, elementType: 'float32' },
        { name: 'keywords', type: 'list', elementType: 'string' },
        { name: 'position', type: 'map', keyType: 'string', valueType: 'int32' },
        { name: 'createTime', type: 'timestamp' }
      ]);
    }
    return table;
  };
  return { db, createTable };
};

// 全局DB实例
let dbInstance = null;
const getDbInstance = async () => {
  if (!dbInstance) {
    dbInstance = await initLanceDb();
  }
  return dbInstance;
};

/**
 * 构建语义向量索引
 * @param {string} userId 用户ID
 * @param {Array<IndexModel>} indexList 索引模型列表
 * @returns {Promise<boolean>} 构建结果
 */
const buildSemanticIndex = async (userId, indexList) => {
  try {
    const { createTable } = await getDbInstance();
    const table = await createTable(userId);
    // 转换为LanceDB可插入格式
    const data = indexList.map(index => {
      const positionMap = new Map();
      for (const [k, v] of Object.entries(index.position)) {
        positionMap.set(k, v);
      }
      return {
        indexId: index.indexId,
        resourceId: index.resourceId,
        knowledgeId: index.knowledgeId,
        chunkId: index.chunkId,
        semanticVector: index.semanticVector,
        keywords: index.keywords,
        position: positionMap,
        createTime: new Date(index.createTime)
      };
    });
    // 批量插入
    await table.add(data);
    return true;
  } catch (err) {
    throw new Error(`语义索引构建失败：${err.message}`);
  }
};

module.exports = { buildSemanticIndex, getDbInstance };