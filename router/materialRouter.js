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
const crypto = require('crypto');
const { db, genid } = require("../db/dbUtils");
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
            headers: { 'Authorization': `Bearer ${SILICON_FLOW_API_KEY}` },
            timeout:10000
        });
        return response.data.data[0].embedding;
    } catch (error) {
        console.error("Embedding 失败原因:", error.response?.data || error.message);
        throw new Error("AI 向量化失败");
    }
}
// --- 工具函数：AI 结合检索内容答疑 ---
async function generateAiAnswer(queryText, finalResults) {
    if (!finalResults || finalResults.length === 0) return "未能从课本中找到相关参考内容。";

    const context = finalResults.slice(0, 2).map(res => 
        `【${res.fileName} P${res.pages.join(',')}】: ${res.snippets.join(' ')}`
    ).join('\n');

    try {
        const response = await axios.post('https://api.siliconflow.cn/v1/chat/completions', {
            model: "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B",
            messages: [
                { 
                    role: "system", 
                    content: `你是一个专业的解题助教。请结合提供的课本内容，按照以下结构回答学生：
                    1. 【直接答案】：简洁明了地给出题目的结论或公式。
                    2. 【深度解析】：结合课本原文，解释为什么是这个答案。如果是计算题，请列出推导过程（如 $2^k-1$）。
                    3. 【实践应用】：如果是在编程或算法实践中，说明对应的操作（如调用 size() 函数），如果本题不涉及计算机编程，可不输出该点。
                    
                    要求：
                    
                    - 优先使用 Markdown 格式和 LaTeX 数学公式（如 $2^k-1$）。
                    - 语气要专业且富有启发性。` 
                },
                { 
                    role: "user", 
                    content: `【课本参考】：\n${context}\n\n【题目】：\n${queryText}` 
                }
            ]
        }, { 
            headers: { 'Authorization': `Bearer ${SILICON_FLOW_API_KEY}` },
            timeout: 45000 // 🌟 DeepSeek-R1 比较慢，给 45 秒
        });
        let fullContent = response.data.choices[0].message.content;

        // 强制截断思考过程
        if (fullContent.includes("</think>")) {
            fullContent = fullContent.split("</think>").pop();
        }

        return fullContent.trim();
    } catch (error) {
        return "解析生成异常，请参考原文定位。";
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
        headers: { 'Authorization': `Bearer ${SILICON_FLOW_API_KEY}` },
        timeout: 15000 // 🌟 15秒超时
    });

   // 修改 performSearch 中的 keywords 处理逻辑
let rawContent = aiRes.data.choices[0].message.content;
let keywords = "";

if (rawContent.includes("</think>")) {
    const parts = rawContent.split("</think>");
    keywords = parts[parts.length - 1].trim();
} else {
    keywords = rawContent.trim();
}
    const queryVector = await getEmbedding(keywords);

    const dbPath = path.join(__dirname, '../data/sample-lancedb');
    const db = await lancedb.connect(dbPath);
    const table = await db.openTable("course_materials");

    let queryChain = table.search(queryVector).limit(20);
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
        if (!summary[item.file_name].pages.includes(item.page_num)) {
            summary[item.file_name].pages.push(item.page_num);
        }
        if (summary[item.file_name].snippets.length < 3) {
            summary[item.file_name].snippets.push(item.text.substring(0, 150) + "...");
        }
    });

    // 排序并转换格式
    const finalResults = Object.values(summary).sort((a, b) => a.bestScore - b.bestScore);
    const aiAnswer = await generateAiAnswer(queryText, finalResults);
    return { keywords, finalResults, aiAnswer };
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
        const { keywords, finalResults,aiAnswer } = await performSearch(queryText, subject);

        res.json({
            code: 200,
            msg: "语义搜索完成",
            aiKeywords: keywords,
            aiAnswer: aiAnswer,
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

        console.time("⏱️ OCR识别耗时");
        const imageBuffer = await fsExtra.readFile(req.file.path);
        const base64Image = imageBuffer.toString('base64');
        const ocrResponse = await axios.post('https://api.siliconflow.cn/v1/chat/completions', {
            model: "PaddlePaddle/PaddleOCR-VL-1.5", 
            messages: [{
                role: "user",
                content: [
                    { type: "text", text: "识别图中中文题目，只返回文字。" },
                    { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
                ]
            }]
        }, { 
            headers: { 'Authorization': `Bearer ${SILICON_FLOW_API_KEY}` },
            timeout: 20000 // 🌟 OCR 给 20 秒
        });
        console.timeEnd("⏱️ OCR识别耗时");

        const extractedText = ocrResponse.data.choices[0].message.content.trim();

        // 执行核心搜索
        const { keywords, finalResults, aiAnswer } = await performSearch(extractedText, subject);

        res.json({
            code: 200,
            msg: "识图搜索成功",
            extractedText,
            aiKeywords: keywords,
            aiAnswer,
            data: finalResults
        });

    } catch (error) {
        console.error("❌ 识图搜索链路崩溃:", error.message);
        res.status(500).json({ code: 500, msg: "搜索超时或接口异常", detail: error.message });
    } finally {
        // 🌟 核心修复：无论 try 还是 catch，最后都删掉图片
        if (req.file && fs.existsSync(req.file.path)) {
            await fsExtra.remove(req.file.path);
            console.log("🧹 临时文件已自动清理");
        }
    }
});

//导出解析函数
const processPdfVectorization = async (filePath, originalName, subject, resourceId) => {
    console.log(`[AI服务] 开始处理 PDF 向量化: ${originalName}, ID: ${resourceId}`);
    try {
        const pdfParser = new PDFParser(null, 1);

        pdfParser.on("pdfParser_dataReady", async (pdfData) => {
            try {
                const rawText = pdfParser.getRawTextContent();
                const pages = rawText.split('----------------Page (').filter(p => p.trim().length > 0);
                
                const lancedbRecords = []; // 用于 LanceDB
                const mysqlChunks = [];   // 用于 MySQL

                for (let i = 0; i < pages.length; i++) {
                    const text = pages[i].trim();
                    if (!text) continue;

                    const vector = await getEmbedding(text.substring(0, 1000));
                    const pageNum = i + 1;
                    const chunkHash = crypto.createHash('md5').update(text).digest('hex');

                    // 1. 准备 LanceDB 数据 (字段名必须与第一次创建时完全一致)
                    lancedbRecords.push({
                        id: `${resourceId}-${i}`,
                        vector: vector,
                        text: text,
                        file_name: originalName,
                        subject: subject,
                        resource_id: resourceId,
                        page_num: pageNum
                    });

                    // 2. 准备 MySQL 数据 (对应你的 material_chunk 表)
                    mysqlChunks.push([
                        genid(),       // chunk 唯一ID
                        resourceId,    // 关联的资源ID
                        pageNum,       // 页码
                        text,          // content_text
                        subject,       // 科目
                        chunkHash      // 用于去重的哈希
                    ]);
                }

                // --- 写入 LanceDB ---
                const dbPath = path.join(__dirname, '../data/sample-lancedb');
                const ldb = await lancedb.connect(dbPath);
                const tableName = "course_materials";
                const tableNames = await ldb.tableNames();

                if (!tableNames.includes(tableName)) {
                    await ldb.createTable(tableName, lancedbRecords);
                } else {
                    const table = await ldb.openTable(tableName);
                    await table.add(lancedbRecords);
                }

                // --- 写入 MySQL (批量插入) ---
                const chunkSql = `
    INSERT INTO material_chunk 
    (id, resource_id, page_num, content_text, subject, chunk_hash) 
    VALUES (?, ?, ?, ?, ?, ?)
`;

for (const chunk of mysqlChunks) {
    // chunk 本身就是一个数组 [id, resourceId, pageNum, text, subject, chunkHash]
    await db.execute(chunkSql, chunk);
}

                // --- 更新主表状态 ---
                await db.execute('UPDATE resource SET parse_status = 2 WHERE resource_id = ?', [resourceId]);
                
                // --- 清理临时文件 (建议等一切成功后再删) ---
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                
                console.log(`✅ [AI服务] 资源 ${resourceId} 解析、向量化并存入 MySQL 完成`);

            } catch (err) {
                console.error("❌ [AI内部解析失败]:", err);
                await db.execute('UPDATE resource SET parse_status = 3 WHERE resource_id = ?', [resourceId]);
            }
        });

        pdfParser.loadPDF(filePath);
    } catch (err) {
        console.error("❌ [AI服务启动失败]:", err);
    }
};


// 在 materialRouter.js 的最末尾修改为：
// materialRouter.js 末尾
module.exports = { 
    materialRouter: router, // 改个名字，方便区分
    processPdfVectorization 
};