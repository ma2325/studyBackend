const responseUtil = require('../utils/responseUtil');
const logUtil = require('../utils/logUtil');

/**
 * 全局错误处理中间件
 * 捕获所有同步/异步错误，统一返回格式，记录错误日志
 */
const errorHandler = (err, req, res, next) => {
  // 记录错误日志
  logUtil.error(`[${req.method}] ${req.originalUrl} | ${err.message}`, err.stack);
  // 区分业务错误和系统错误
  const code = err.code || 500;
  const msg = err.message || '服务器内部错误';
  res.status(code).json(responseUtil.error(msg, code));
};

module.exports = errorHandler;