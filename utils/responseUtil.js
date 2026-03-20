/**
 * 统一响应格式，所有API返回结果遵循此规范
 * 便于其他后端模块解析，减少联调成本
 */
const responseUtil = {
  success: (data = null, msg = '操作成功', code = 200) => {
    return {
      code,
      msg,
      data,
      success: true,
      timestamp: new Date().getTime()
    };
  },
  error: (msg = '操作失败', code = 500, data = null) => {
    return {
      code,
      msg,
      data,
      success: false,
      timestamp: new Date().getTime()
    };
  },
  pending: (msg = '处理中', code = 202, data = null) => {
    return {
      code,
      msg,
      data,
      success: false,
      timestamp: new Date().getTime()
    };
  }
};

module.exports = responseUtil;