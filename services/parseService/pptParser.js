const fs = require('fs');
const path = require('path');
const PPTX = require('node-pptx'); // 解析pptx，ppt用win32com（端侧）
const { ensureDir, getLocalPath } = require('../../utils/fileUtil');

/**
 * PPT解析（基于adm-zip，稳定通用）
 * 提取PPT中的文本内容，适配.pptx格式
 * @param {string} filePath PPT文件路径
 * @param {string} resourceId 资源ID
 * @returns {Promise<Array>} 解析后的每页文本
 */
const parsePpt = async (filePath, resourceId) => {
  const AdmZip = require('adm-zip');
  const fs = require('fs');
  const path = require('path');

  try {
    // 1. 读取PPT文件（.pptx本质是zip压缩包）
    const zip = new AdmZip(filePath);
    const zipEntries = zip.getEntries();

    // 2. 存储每页文本
    const slideTexts = [];

    // 3. 遍历PPT中的slide文件（XML格式）
    zipEntries.forEach(entry => {
      // 匹配slide文件路径（ppt/slides/slide1.xml、slide2.xml等）
      if (entry.entryName.match(/ppt\/slides\/slide\d+\.xml/)) {
        // 读取XML内容
        const xmlContent = zip.readAsText(entry);
        // 提取纯文本（移除XML标签）
        const text = xmlContent
          .replace(/<[^>]*>/g, '') // 移除所有XML标签
          .replace(/&lt;/g, '<')   // 还原转义字符
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .replace(/\s+/g, ' ')    // 合并多余空格
          .trim();
        
        // 只保留非空内容
        if (text) {
          const slideIndex = slideTexts.length + 1;
          slideTexts.push({
            slideNum: slideIndex,
            text: text,
            position: { page: slideIndex }
          });
        }
      }
    });

    // 4. 若未提取到文本，返回提示
    if (slideTexts.length === 0) {
      slideTexts.push({
        slideNum: 1,
        text: "未提取到PPT文本内容（可能是空白PPT或格式不支持）",
        position: { page: 1 }
      });
    }

    console.log(`✅ PPT解析完成：${filePath}，共${slideTexts.length}页`);
    return slideTexts;

  } catch (err) {
    console.error(`❌ PPT解析失败：${err.message}`);
    // 解析失败时返回兜底数据
    return [{
      slideNum: 1,
      text: `PPT解析失败：${err.message}`,
      position: { page: 1 }
    }];
  }
};

module.exports = { parsePpt };