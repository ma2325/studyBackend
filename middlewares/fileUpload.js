const multer = require('multer');
const path = require('path');
const { ensureDir, getLocalPath } = require('../utils/fileUtil');
const { storage } = require('../config');

// 临时上传目录
const uploadTempDir = getLocalPath('temp');
ensureDir(uploadTempDir);

// multer存储配置
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadTempDir);
  },
  filename: (req, file, cb) => {
    // 文件名：时间戳_原始名
    const fileName = `${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`;
    cb(null, fileName);
  }
});

// 文件类型过滤（仅允许支持的资源类型）
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
    'application/pdf',
    'audio/mpeg', 'audio/wav', 'video/mp4', 'video/mov',
    'text/plain', 'application/json'
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`不支持的文件类型：${file.mimetype}`), false);
  }
};

// 上传中间件：单文件/多文件
const upload = multer({
  storage: multerStorage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 } // 单文件最大100MB
});

module.exports = {
  singleUpload: upload.single('resourceFile'),
  multiUpload: upload.array('resourceFiles', 10) // 一次最多上传10个文件
};