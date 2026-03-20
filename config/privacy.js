// 隐私分级：通用/敏感/极其敏感；PII识别关键词/规则
module.exports = {
  levels: {
    NORMAL: 0,    // 通用：公开资料、无个人信息
    SENSITIVE: 1, // 敏感：含轻微个人批注、课程名称
    HIGHLY_SENSITIVE: 2 // 极其敏感：含姓名/联系方式/私密笔记/未公开录音
  },
  piiRules: {
    // 正则匹配PII信息
    phone: /^1[3-9]\d{9}$/,
    email: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/,
    studentId: /^\d{8,12}$/,
    teacherName: /(老师|教授|讲师)\s*[赵钱孙李周吴郑王][a-zA-Z\u4e00-\u9fa5]{1,2}/,
    school: /(大学|学院|附中)\s*[a-zA-Z\u4e00-\u9fa5]{2,8}/
  },
  // 隐私分级判定权重
  classifyWeights: {
    piiCount: 0.6, // PII信息数量权重
    contentType: 0.3, // 内容类型（录音/手写笔记权重高）
    userMark: 0.1 // 用户手动标记隐私等级
  }
};