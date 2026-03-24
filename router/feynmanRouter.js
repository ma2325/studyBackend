require('dotenv').config();
const express = require('express');
const router = express.Router();
const axios = require('axios');
const path = require('path');
const lancedb = require('@lancedb/lancedb'); // 引入你现有的向量库
const { db, genid } = require("../db/dbUtils");
const responseUtil = require("../utils/responseUtil");

const SILICON_FLOW_API_KEY = process.env.SILICON_FLOW_API_KEY;

//解析 R1 模型的 JSON
function parseDeepSeekJson(rawContent) {
    try {
        let jsonStr = rawContent;
        if (jsonStr.includes("</think>")) {
            const parts = jsonStr.split("</think>");
            jsonStr = parts[parts.length - 1].trim();
        }
        jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("JSON 解析失败, 原始输出:", rawContent);
        throw new Error("AI 返回数据格式异常");
    }
}

// 获取知识点向量
async function getEmbedding(text) {
    const safeText = text.substring(0, 500).replace(/\n/g, " ");
    const response = await axios.post('https://api.siliconflow.cn/v1/embeddings', {
        model: "BAAI/bge-large-zh-v1.5",
        input: safeText
    }, { headers: { 'Authorization': `Bearer ${SILICON_FLOW_API_KEY}` } });
    return response.data.data[0].embedding;
}

/**
 * 1. 生成问题 (支持传入 resourceId 进行资料限定)
 * POST /api/feynman/generate-question
 */
router.post('/generate-question', async (req, res) => {
    try {
        const { userId, knowledgePoint, resourceId } = req.body;
        if (!userId || !knowledgePoint) {
            return res.json(responseUtil.error('缺少必填参数', 400));
        }

        let contextPrompt = "";

        // 如果传了 resourceId，查一下资源基本信息，让 AI 知道背景
        if (resourceId) {
            const resInfo = await db.getOne(`SELECT file_name, file_type FROM resource WHERE resource_id = ?`, [resourceId]);
            if (resInfo) {
                contextPrompt = `\n请结合相关课件材料（${resInfo.file_name}）的背景来提问，使其更符合当前学习上下文。`;
            }
        }

        const prompt = `你是一个苏格拉底式的导师。请针对知识点“${knowledgePoint}”生成一道概念理解题，用来验证学生的掌握程度。${contextPrompt}

【严重警告：输出格式要求】
1. 必须且只能输出合法的纯 JSON 字符串！
2. 绝对不可以使用任何 JavaScript 语法（例如 '+' 拼接）。
3. 只能包含 "question" 和 "hints" 这两个字段，严禁自作主张添加诸如 "scoring" 等其他字段！

请严格按照以下结构输出 JSON：
{
  "question": "问题的具体内容（侧重理解与应用）",
  "hints": ["提示1", "提示2"]
}`;

        const aiRes = await axios.post('https://api.siliconflow.cn/v1/chat/completions', {
            model: "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B",
            messages: [{ role: "user", content: prompt }]
        }, { headers: { 'Authorization': `Bearer ${SILICON_FLOW_API_KEY}` } });

        const resultJson = parseDeepSeekJson(aiRes.data.choices[0].message.content);
        const recordId = genid();

        const insertSql = `INSERT INTO feynman_record (record_id, user_id, resource_id, knowledge_point, question_text, hints, status) VALUES (?, ?, ?, ?, ?, ?, 0)`;
        await db.execute(insertSql, [recordId, userId, resourceId || null, knowledgePoint, resultJson.question, JSON.stringify(resultJson.hints)]);

        res.json(responseUtil.success({ recordId, question: resultJson.question, hints: resultJson.hints }));

    } catch (error) {
        console.error("生成问题失败:", error);
        res.json(responseUtil.error('生成问题失败'));
    }
});

/**
 * 2. 评估逻辑：去 LanceDB 找原文作为参考，再由 AI 评分
 * POST /api/feynman/evaluate
 */
router.post('/evaluate', async (req, res) => {
    try {
        const { userId, recordId, userAnswer } = req.body;
        if (!userId || !recordId || !userAnswer) return res.json(responseUtil.error('缺少参数', 400));

        // 1. 获取问答记录及联动的资源信息
        const record = await db.getOne(`SELECT * FROM feynman_record WHERE record_id = ? AND user_id = ?`, [recordId, userId]);
        if (!record) return res.json(responseUtil.error('记录不存在', 404));

        let groundTruthContext = "";

        // 2. 【联动逻辑】如果绑定了资源，去 LanceDB 向量库寻找该资源中针对这个知识点的原文
        if (record.resource_id) {
            const resInfo = await db.getOne(`SELECT file_name FROM resource WHERE resource_id = ?`, [record.resource_id]);
            if (resInfo) {
                try {
                    const queryVector = await getEmbedding(record.knowledge_point);
                    const dbPath = path.join(__dirname, '../data/sample-lancedb');
                    const ldb = await lancedb.connect(dbPath);
                    const tableNames = await ldb.tableNames();

                    if (tableNames.includes("course_materials")) {
                        const table = await ldb.openTable("course_materials");
                        // 检索属于该文件，且与知识点最相关的Top 3文本块
                        const rawResults = await table.search(queryVector)
                            .where(`file_name = '${resInfo.file_name}'`)
                            .limit(3)
                            .toArray();

                        groundTruthContext = rawResults.map(item => item.text).join("\n...\n");
                    }
                } catch (e) {
                    console.warn("向量库检索参考资料失败，降级为无参考评估:", e.message);
                }
            }
        }

        // 3. 构建强大的 Context-Aware Prompt
        let prompt = `你是一个严谨的阅卷老师。正在使用费曼学习法评估学生的回答。\n知识点：${record.knowledge_point}\n原问题：${record.question_text}\n学生回答：${userAnswer}\n`;

        if (groundTruthContext) {
            prompt += `\n【重要：标准参考资料】：\n${groundTruthContext}\n\n请**必须参考**上述资料的内容来评估学生的回答是否准确、有无遗漏资料中的关键点。\n`;
        }

        prompt += `
请评估逻辑完整性与语义准确性，并严格以 JSON 格式输出：
{
  "score": 75,
  "covered": ["已覆盖的知识点1"],
  "missing": [{"point": "缺失的知识点简述", "suggestion": "补充建议"}],
  "logic_flaws": [{"flaw": "逻辑断层简述", "suggestion": "补充建议"}],
  "feedback": "一句话整体评价"
}`;

        const aiRes = await axios.post('https://api.siliconflow.cn/v1/chat/completions', {
            model: "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B",
            messages: [{ role: "user", content: prompt }]
        }, { headers: { 'Authorization': `Bearer ${SILICON_FLOW_API_KEY}` } });

        const evalResult = parseDeepSeekJson(aiRes.data.choices[0].message.content);

        // 4. 更新记录（顺便把抽取的参考文本存进去，方便后续复查）
        const updateSql = `
            UPDATE feynman_record 
            SET user_answer = ?, reference_context = ?, score = ?, covered_points = ?, missing_points = ?, logic_flaws = ?, feedback = ?, status = 1 
            WHERE record_id = ?
        `;
        await db.execute(updateSql, [
            userAnswer,
            groundTruthContext || "未匹配到特定参考资料",
            evalResult.score,
            JSON.stringify(evalResult.covered),
            JSON.stringify(evalResult.missing),
            JSON.stringify(evalResult.logic_flaws),
            evalResult.feedback,
            recordId
        ]);

        res.json(responseUtil.success(evalResult));

    } catch (error) {
        console.error("评估答案失败:", error);
        res.json(responseUtil.error('答案评估失败'));
    }
});

module.exports = router;