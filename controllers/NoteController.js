const { processPdfAndOcr } = require('../utils/ocrUtil');
const { db, genid } = require("../db/dbUtils"); // 必须确保引入了 genid

// 1. 上传并识别
exports.uploadAndRecognize = async (req, res) => {
    if (!req.file) return res.status(400).json({ msg: "未选择文件" });

    // 💡 落地：生成 32 位业务 ID，不再依赖自增数字 ID
    const nId = genid(); 
    const userId = 1; // 临时写死，后续对接 req.user.id
    const fileName = Buffer.from(req.file.originalname, 'latin1').toString('utf8'); // 修复中文文件名乱码

    try {
        // 插入时包含 note_id
        const sql = 'INSERT INTO notes (note_id, user_id, file_name, status) VALUES (?, ?, ?, ?)';
        await db.execute(sql, [nId, userId, fileName, 0]);

        // 异步执行 OCR
        processPdfAndOcr(req.file.buffer).then(async (text) => {
            // 💡 更新时也使用 note_id 匹配
            await db.execute('UPDATE notes SET content = ?, status = 1 WHERE note_id = ?', [text, nId]);
            console.log(`✅ 识别成功: NoteID ${nId}`);
        }).catch(async (err) => {
            console.error("❌ OCR 失败:", err.message);
            await db.execute('UPDATE notes SET status = 2 WHERE note_id = ?', [nId]);
        });

        // 返回给前端业务 ID
        res.json({ code: 200, msg: "上传成功，正在后台识别", data: { noteId: nId } });
    } catch (error) {
        console.error("数据库报错:", error);
        res.status(500).json({ code: 500, msg: "数据库操作失败" });
    }
};

// 2. 获取笔记详情
exports.getNoteDetail = async (req, res) => {
    const { note_id } = req.params; // 💡 注意：参数名建议改为 note_id 保持统一
    
    try {
        const rows = await db.execute('SELECT * FROM notes WHERE note_id = ?', [note_id]);
        
        // 统一处理你的 dbUtils 返回结构
        const note = (rows && rows.length > 0) ? (rows[0].note_id ? rows[0] : rows) : null;

        if (note) {
            res.json({ code: 200, msg: "查询成功", data: note });
        } else {
            res.status(404).json({ code: 404, msg: "找不到该笔记" });
        }
    } catch (error) {
        res.status(500).json({ code: 500, msg: "查询详情失败" });
    }
};

// 3. 删除笔记
exports.deleteNote = async (req, res) => {
    const { note_id } = req.params;
    const userId = 1;

    try {
        const sql = "DELETE FROM notes WHERE note_id = ? AND user_id = ?";
        const result = await db.execute(sql, [note_id, userId]);
        
        // 💡 兼容不同 db 库的返回格式
        const affected = result.affectedRows !== undefined ? result.affectedRows : result;

        if (affected > 0) {
            res.json({ code: 200, msg: "删除成功" });
        } else {
            res.status(404).json({ code: 404, msg: "未找到笔记或无权删除" });
        }
    } catch (error) {
        res.status(500).json({ code: 500, msg: "删除失败" });
    }
};