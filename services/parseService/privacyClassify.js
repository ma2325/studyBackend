const { levels, classifyWeights } = require('../../config/privacy');

/**
 * 隐私分级判定核心逻辑
 * 基于PII识别结果、文件类型、用户标记综合判定
 * @param {object} piiResult PII识别结果 {hasPii: boolean, piiList: Array, piiCount: number}
 * @param {string} fileType 文件类型：ppt/pdf/audio-video/text
 * @param {number} userPrivacyMark 用户手动标记（0/1/2，可选）
 * @returns {Promise<number>} 隐私等级 0/1/2
 */
const classifyPrivacyLevel = async (piiResult, fileType, userPrivacyMark) => {
  // 如果用户手动标记，优先使用用户标记
  if (userPrivacyMark !== undefined && [0, 1, 2].includes(userPrivacyMark)) {
    return userPrivacyMark;
  }

  let score = 0;

  // 1. PII信息数量权重（0.6）
  const piiScore = piiResult.piiCount > 0 ? 
    (piiResult.piiCount <= 2 ? 0.3 : piiResult.piiCount <= 5 ? 0.6 : 1) : 0;
  score += piiScore * classifyWeights.piiCount;

  // 2. 内容类型权重（0.3）：音视频/手写笔记权重更高
  const typeScore = ['audio-video', 'text'].includes(fileType) ? 0.8 : 0.2;
  score += typeScore * classifyWeights.contentType;

  // 3. 用户标记权重（0.1，默认0）
  score += 0 * classifyWeights.userMark;

  // 根据总分判定等级
  if (score >= 0.7) {
    return levels.HIGHLY_SENSITIVE;
  } else if (score >= 0.3) {
    return levels.SENSITIVE;
  } else {
    return levels.NORMAL;
  }
};

module.exports = { classifyPrivacyLevel };