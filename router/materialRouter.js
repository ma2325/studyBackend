require('dotenv').config(); 
const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const lancedb = require('@lancedb/lancedb');
const PDFParser = require("pdf2json");
const axios = require('axios');
const upload = multer({ dest: 'uploads/' });
const fsExtra =require('fs-extra');

const SILICON_FLOW_API_KEY = process.env.SILICON_FLOW_API_KEY;
if (!SILICON_FLOW_API_KEY) {
    console.error("❌ 错误：未在 .env 文件中检测到 SILICON_FLOW_API_KEY");
}
// --- 工具函数：获取向量 ---
async function getEmbedding(text) {
    try {
        // 核心修复：强制截断前 500 个字符，防止超长报错
        const safeText = text.substring(0, 500).replace(/\n/g, " "); 
        
        const response = await axios.post('https://api.siliconflow.cn/v1/embeddings', {
            model: "BAAI/bge-large-zh-v1.5", 
            input: safeText
        }, {
            headers: { 'Authorization': `Bearer ${SILICON_FLOW_API_KEY}` }
        });
        return response.data.data[0].embedding;
    } catch (error) {
        console.error("Embedding 失败原因:", error.response?.data || error.message);
        throw new Error("AI 向量化失败");
    }
}

//函数搜索
// --- 工具函数：核心检索与聚合逻辑 ---
// --- 工具函数：核心检索逻辑（AI 知识点提取 + 向量搜索 + 聚合） ---
async function performSearch(queryText, subject) {
    // 1. AI 提取核心知识点
    const aiRes = await axios.post('https://api.siliconflow.cn/v1/chat/completions', {
        model: "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B",
        messages: [
            { 
                role: "system", 
                content: "你是一个学习助手。请从题目中提取核心知识点，以便学生翻阅课本进行查找，总长度严禁超过 100 字，直接输出关键词，优先给出与解题最相关的关键词。用逗号分隔。" 
            },
            { role: "user", content: queryText }
        ]
    }, {
        headers: { 'Authorization': `Bearer ${SILICON_FLOW_API_KEY}` }
    });

   // 修改 performSearch 中的 keywords 处理逻辑
let rawContent = aiRes.data.choices[0].message.content;
let keywords = "";

if (rawContent.includes("</think>")) {
    // 这种方法最保险：分割字符串，取最后一部分
    const parts = rawContent.split("</think>");
    keywords = parts[parts.length - 1].trim();
} else {
    keywords = rawContent.trim();
}
    // 2. 将提炼后的知识点向量化
    const queryVector = await getEmbedding(keywords);

    // 3. 数据库检索
    const dbPath = path.join(__dirname, '../data/sample-lancedb');
    const db = await lancedb.connect(dbPath);
    const table = await db.openTable("course_materials");

    let queryChain = table.search(queryVector).limit(20);
    if (subject) {
        queryChain = queryChain.where(`subject = '${subject}'`);
    }

    const rawResults = await queryChain.toArray();

    // 4. 结果聚合 (按文件名分组，保留你原来的 summary 逻辑)
    const summary = {};
    rawResults.forEach(item => {
        if (!summary[item.file_name]) {
            summary[item.file_name] = {
                fileName: item.file_name,
                subject: item.subject,
                pages: [],
                bestScore: item._distance, 
                snippets: [] 
            };
        }
        if (!summary[item.file_name].pages.includes(item.page_num)) {
            summary[item.file_name].pages.push(item.page_num);
        }
        if (summary[item.file_name].snippets.length < 3) {
            summary[item.file_name].snippets.push(item.text.substring(0, 150) + "...");
        }
    });

    // 排序并转换格式
    const finalResults = Object.values(summary).sort((a, b) => a.bestScore - b.bestScore);

    return { keywords, finalResults };
}

// --- 1. 上传接口：加入 Subject 逻辑 ---
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ code: 400, msg: "请上传文件" });
        
        // 从 body 拿到科目，如果没有传则默认为 "未分类"
        const subject = req.body.subject || "未分类";

        const pdfParser = new PDFParser(null, 1);
        pdfParser.on("pdfParser_dataError", errData => { throw new Error(errData.parserError); });

        pdfParser.on("pdfParser_dataReady", async (pdfData) => {
            try {
                const rawText = pdfParser.getRawTextContent();
                const pages = rawText.split('----------------Page (').filter(p => p.trim().length > 0);

                console.log(`正在处理 [${subject}] 科目: ${req.file.originalname}，共 ${pages.length} 页`);
                
                const records = [];
                for (let i = 0; i < pages.length; i++) {
                    const text = pages[i].trim();
                    // 生成向量
                    const vector = await getEmbedding(text.substring(0, 1000));
                    records.push({
                        id: `${Date.now()}-${i}`,
                        text: text,
                        vector: vector,
                        file_name: req.file.originalname,
                        subject: subject, // 存入科目字段
                        page_num: i + 1
                    });
                }

                const dbPath = path.join(__dirname, '../data/sample-lancedb');
                const db = await lancedb.connect(dbPath);
                const tableName = "course_materials";
                const tableNames = await db.tableNames();
                
                let table;
                if (!tableNames.includes(tableName)) {
                    table = await db.createTable(tableName, records);
                } else {
                    table = await db.openTable(tableName);
                    await table.add(records);
                }

                res.json({ code: 200, msg: `[${subject}] 素材入库成功`, pages: pages.length });
                fs.unlinkSync(req.file.path);
            } catch (err) {
                console.error("处理失败:", err);
                if (!res.headersSent) res.status(500).json({ code: 500, msg: err.message });
            }
        });

        pdfParser.loadPDF(req.file.path);
    } catch (error) {
        res.status(500).json({ code: 500, msg: "流程出错" });
    }
});

// --- 2. 搜索接口：文本搜索
router.get('/search', async (req, res) => {
    try {
        const { queryText, subject } = req.query;
        if (!queryText) return res.status(400).json({ code: 400, msg: "请输入题目内容" });

        // 调用核心搜索函数
        const { keywords, finalResults } = await performSearch(queryText, subject);

        res.json({
            code: 200,
            msg: "语义搜索完成",
            aiKeywords: keywords,
            data: finalResults
        });
    } catch (error) {
        console.error("搜索失败:", error);
        res.status(500).json({ code: 500, msg: "搜索失败" });
    }
});

// --- 3. 图片搜题
router.post('/ocr-search', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ code: 400, msg: "未检测到上传图片" });
        const subject = req.body.subject || ""; 

        // 1. OCR 识别图片文字
        const imageBuffer = await fsExtra.readFile(req.file.path);
        const base64Image = imageBuffer.toString('base64');
        const ocrResponse = await axios.post('https://api.siliconflow.cn/v1/chat/completions', {
            model: "PaddlePaddle/PaddleOCR-VL-1.5", 
            messages: [{
                role: "user",
                content: [
                    { type: "text", text: "请精准提取图片中的题目文字内容，直接返回文本。" },
                    { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
                ]
            }]
        }, { headers: { 'Authorization': `Bearer ${SILICON_FLOW_API_KEY}` } });

        const extractedText = ocrResponse.data.choices[0].message.content.trim();

        // 2. 调用核心搜索函数（这里会自动执行你的知识点提取逻辑）
        const { keywords, finalResults } = await performSearch(extractedText, subject);

        // 3. 清理文件
        await fsExtra.remove(req.file.path);

        res.json({
            code: 200,
            msg: "识图搜索成功",
            extractedText: extractedText,
            aiKeywords: keywords,
            data: finalResults
        });
    } catch (error) {
        if (req.file) await fsExtra.remove(req.file.path);
        console.error("识图搜索失败:", error);
        res.status(500).json({ code: 500, msg: "识图搜索链路异常" });
    }
});
module.exports = router;