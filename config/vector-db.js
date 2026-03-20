/**
 * 向量数据库配置（LanceDB）
 * 支持本地/云端部署模式
 */
module.exports = {
  type: process.env.VECTOR_DB_TYPE || 'local', // local/cloud
  local: {
    path: process.env.VECTOR_DB_PATH || './storage/index/vector', // 本地存储路径
    dimensions: 1024, // 向量维度
    metric: 'cosine' // 相似度计算方式：cosine/euclidean
  },
  cloud: {
    url: process.env.VECTOR_DB_CLOUD_URL || '',
    apiKey: process.env.VECTOR_DB_API_KEY || '',
    namespace: process.env.VECTOR_DB_NAMESPACE || 'zhisu'
  }
};