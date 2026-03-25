const express = require('express');
const router = express.Router();
const noteController = require('../controllers/NoteController');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// 1. 上传
router.post('/upload', upload.single('file'), noteController.uploadAndRecognize);

// 💡 先定义固定路径 list，再定义参数路径 :note_id
router.get('/detail/:note_id', noteController.getNoteDetail); 
router.delete('/:note_id', noteController.deleteNote);

module.exports = router;