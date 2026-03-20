const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { storage } = require('../config');

// 确保目录存在
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// 计算文件哈希（md5），用于增量同步、资源唯一标识
const calculateFileHash = (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', (err) => reject(err));
  });
};

// 本地文件加密（AES-256-CBC）
const encryptFile = (sourcePath, targetPath) => {
  const { algorithm, key } = storage.encrypt;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'utf8'), iv);
  const input = fs.createReadStream(sourcePath);
  const output = fs.createWriteStream(targetPath);
  // 把iv写入文件开头，用于解密
  output.write(iv);
  input.pipe(cipher).pipe(output);
  return new Promise((resolve, reject) => {
    output.on('finish', resolve);
    output.on('error', reject);
  });
};

// 本地文件解密
const decryptFile = (sourcePath, targetPath) => {
  const { algorithm, key } = storage.encrypt;
  const input = fs.createReadStream(sourcePath);
  const output = fs.createWriteStream(targetPath);
  // 读取开头的iv
  let iv = null;
  input.on('data', (data) => {
    if (!iv) {
      iv = data.slice(0, 16);
      const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key, 'utf8'), iv);
      input.pipe(decipher).pipe(output);
    }
  });
  return new Promise((resolve, reject) => {
    output.on('finish', resolve);
    output.on('error', reject);
  });
};

module.exports = {
  ensureDir,
  calculateFileHash,
  encryptFile,
  decryptFile,
  getLocalPath: (subPath) => path.join(storage.localRoot, subPath)
};