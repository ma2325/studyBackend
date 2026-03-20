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

// --- 2. 搜索接口：AI 知识点提取 + 向量搜索 + 科目过滤 ---
router.get('/search', async (req, res) => {
    try {
        const { queryText, subject } = req.query; // queryText 是原始题目，subject 是可选过滤项
        if (!queryText) return res.status(400).json({ code: 400, msg: "请输入题目内容" });

        const aiRes = await axios.post('https://api.siliconflow.cn/v1/chat/completions', {
            model: "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B",
            messages: [
                { 
                    role: "system", 
                    content: "你是一个学习助手。请从题目中提取核心知识点，总长度严禁超过 100 字，直接输出关键词，用逗号分隔。" 
                },
                { role: "user", content: queryText }
            ]
        }, {
            headers: { 'Authorization': `Bearer ${SILICON_FLOW_API_KEY}` }
        });

        const keywords = aiRes.data.choices[0].message.content;
        console.log(`AI 提取知识点: ${keywords}`);

        const queryVector = await getEmbedding(keywords);

        const dbPath = path.join(__dirname, '../data/sample-lancedb');
        const db = await lancedb.connect(dbPath);
        const table = await db.openTable("course_materials");

        let queryChain = table.search(queryVector).limit(20);

        // 如果用户指定了科目，进行过滤
        if (subject) {
            queryChain = queryChain.where(`subject = '${subject}'`);
        }

        const rawResults = await queryChain.toArray();

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
            summary[item.file_name].pages.push(item.page_num);
            
            if (summary[item.file_name].snippets.length < 3) {
                summary[item.file_name].snippets.push(item.text.substring(0, 150) + "...");
            }
        });

        // 排序并转换格式
        const finalResults = Object.values(summary).sort((a, b) => a.bestScore - b.bestScore);

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

module.exports = router;