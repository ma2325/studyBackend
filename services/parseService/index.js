/**
 * 多格式资源解析服务入口
 * 统一导出PPT/PDF/音视频解析方法，便于控制器调用
 */
const { parsePpt } = require('./pptParser');
const { parsePdf } = require('./pdfParser');
const { parseAudioVideo } = require('./audioVideoParser');

/**
 * 统一解析入口，根据文件类型自动选择解析方法
 * @param {string} fileType 文件类型：ppt/pdf/audio-video/text
 * @param {string} filePath 文件本地路径
 * @param {string} resourceId 资源ID
 * @returns {Promise<Array>} 解析后的结构化数据
 */
const parseResource = async (fileType, filePath, resourceId) => {
  switch (fileType) {
    case 'ppt':
      return await parsePpt(filePath, resourceId);
    case 'pdf':
      return await parsePdf(filePath, resourceId);
    case 'audio-video':
      return await parseAudioVideo(filePath, resourceId);
    case 'text':
      return await parseText(filePath);
    default:
      throw new Error(`不支持的文件类型：${fileType}`);
  }
};

/**
 * 纯文本解析（兜底）
 * @param {string} filePath 文件路径
 * @returns {Promise<Array>} 解析结果
 */
const parseText = async (filePath) => {
  const fs = require('fs');
  const text = fs.readFileSync(filePath, 'utf8');
  return [{ text: text.trim(), position: { line: 1 } }];
};

module.exports = {
  parseResource,
  parsePpt,
  parsePdf,
  parseAudioVideo,
  parseText
};

/**
 * 隐私管理服务入口
 * 统一导出PII识别、隐私分级方法
 */
const { recognizePii } = require('./piiRecognition');
const { classifyPrivacyLevel } = require('./privacyClassify');

/**
 * 隐私检测全流程：识别PII + 分级判定
 * @param {string} content 待检测文本内容
 * @param {string} fileType 文件类型
 * @param {number} userPrivacyMark 用户手动标记（可选）
 * @returns {Promise<{hasPii: boolean, piiList: Array, privacyLevel: number}>}
 */
const detectPrivacy = async (content, fileType, userPrivacyMark) => {
  const piiResult = await recognizePii(content);
  const privacyLevel = await classifyPrivacyLevel(piiResult, fileType, userPrivacyMark);
  return {
    hasPii: piiResult.hasPii,
    piiList: piiResult.piiList,
    privacyLevel
  };
};

module.exports = {
  recognizePii,
  classifyPrivacyLevel,
  detectPrivacy
};