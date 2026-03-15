// 全局配置，区分端侧/云端环境，适配本地索引与端云分流
module.exports = {
  server: {
    port: process.env.PORT || 3001, // 后端1号服务端口
    env: process.env.NODE_ENV || 'development'
  },
  storage: {
    localRoot: './storage', // 本地存储根目录
    cloudOss: { // 云端OSS配置（仅非敏感数据）
      enable: process.env.CLOUD_OSS_ENABLE || false,
      accessKey: process.env.OSS_ACCESS_KEY || '',
      secretKey: process.env.OSS_SECRET_KEY || '',
      bucket: process.env.OSS_BUCKET || 'zhisu-non-sensitive'
    },
    encrypt: { // 本地敏感文件加密配置
      enable: true,
      algorithm: 'aes-256-cbc',
      key: process.env.LOCAL_ENCRYPT_KEY || 'zhisu_local_encrypt_key_2026'
    }
  },
  asr: { // ASR语音转写配置（本地/云端）
    type: process.env.ASR_TYPE || 'local', // local/aliyun/tencent
    localModel: './models/asr-model', // 本地ASR模型路径
    cloudApi: process.env.ASR_CLOUD_API || ''
  },
  // 与其他后端模块的交互地址
  remote: {
    searchService: 'http://localhost:3002', // 后端2号（拍题检索）
    planService: 'http://localhost:3003',   // 后端3号（复习规划）
    feynmanService: 'http://localhost:3004' // 后端4号（费曼+端云）
  }
};