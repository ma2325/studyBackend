const fs = require('fs');
const path = require('path');
const { ensureDir, getLocalPath } = require('./fileUtil');

// 日志级别
const LOG_LEVELS = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  DEBUG: 'DEBUG'
};

// 日志存储目录
const logDir = getLocalPath('logs');
ensureDir(logDir);

/**
 * 生成日志文件名（按天分割）
 * @returns {string} 文件名
 */
const getLogFileName = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}.log`;
};

/**
 * 写入日志到文件
 * @param {string} level 日志级别
 * @param {string} message 日志内容
 */
const writeLog = (level, message) => {
  const timestamp = new Date().toISOString();
  const logContent = `[${timestamp}] [${level}] ${message}\n`;
  
  // 1. 控制台输出
  if (level === LOG_LEVELS.ERROR) {
    console.error(logContent.trim());
  } else if (level === LOG_LEVELS.WARN) {
    console.warn(logContent.trim());
  } else {
    console.log(logContent.trim());
  }

  // 2. 文件写入
  const logPath = path.join(logDir, getLogFileName());
  fs.appendFileSync(logPath, logContent, 'utf8');
};

/**
 * 信息日志
 * @param {string} message 日志内容
 */
const info = (message) => {
  writeLog(LOG_LEVELS.INFO, message);
};

/**
 * 警告日志
 * @param {string} message 日志内容
 */
const warn = (message) => {
  writeLog(LOG_LEVELS.WARN, message);
};

/**
 * 错误日志
 * @param {string} message 日志内容
 */
const error = (message) => {
  writeLog(LOG_LEVELS.ERROR, message);
};

/**
 * 调试日志（仅开发环境）
 * @param {string} message 日志内容
 */
const debug = (message) => {
  if (process.env.NODE_ENV === 'development') {
    writeLog(LOG_LEVELS.DEBUG, message);
  }
};

module.exports = {
  info,
  warn,
  error,
  debug,
  LOG_LEVELS
};