const axios = require('axios');

/**
 * 直接调用百度接口识别 PDF 里的手写文字
 * 优点：无需本地安装 PDF 转换库，兼容性 100%
 */
async function processPdfAndOcr(pdfBuffer) {
    const AK = process.env.OCR_AK;
    const SK = process.env.OCR_SK;

    try {
        // 1. 获取百度 OCR Access Token
        const tokenRes = await axios.get(
            `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${AK}&client_secret=${SK}`
        );
        const accessToken = tokenRes.data.access_token;

        // 2. 将 PDF Buffer 转为 Base64 字符串
        const base64Pdf = pdfBuffer.toString('base64');

        // 3. 调用百度手写体识别接口
        // 注意：使用 pdf_file 参数，百度会自动处理 PDF
        const res = await axios.post(
            `https://aip.baidubce.com/rest/2.0/ocr/v1/handwriting?access_token=${accessToken}`,
            new URLSearchParams({
                pdf_file: base64Pdf,
            }).toString(),
            { 
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            }
        );

        // 4. 检查百度返回的状态
        if (res.data.error_code) {
            console.error("百度接口返回错误:", res.data);
            throw new Error(`OCR 识别失败: ${res.data.error_msg}`);
        }

        // 5. 提取并拼接识别结果
        if (res.data.words_result) {
            return res.data.words_result.map(item => item.words).join('\n');
        } else {
            return "未能识别到有效文字";
        }
    } catch (error) {
        console.error("OCR 处理链路异常:", error.message);
        throw error;
    }
}

module.exports = { processPdfAndOcr };