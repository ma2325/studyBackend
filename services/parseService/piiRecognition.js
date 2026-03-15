const { piiRules } = require('../../config/privacy');

/**
 * PII敏感信息识别服务
 * @param {string} content 待识别文本内容
 * @returns {Promise<{hasPii: boolean, piiList: Array, piiCount: number}>} 识别结果
 */
const recognizePii = async (content) => {
  const piiList = [];
  // 遍历所有PII规则匹配
  for (const [type, reg] of Object.entries(piiRules)) {
    const matches = content.match(new RegExp(reg, 'g'));
    if (matches && matches.length > 0) {
      piiList.push({
        type,
        values: [...new Set(matches)] // 去重
      });
    }
  }
  return {
    hasPii: piiList.length > 0,
    piiList,
    piiCount: piiList.reduce((total, item) => total + item.values.length, 0)
  };
};

module.exports = { recognizePii };