// db/dbUtils.js
require('dotenv').config(); // 加载.env环境变量
const mysql = require('mysql2/promise'); // 使用promise版mysql2（支持async/await）
const { v4: uuidv4 } = require('uuid'); // 生成唯一业务ID

// 数据库连接配置（从.env读取，兜底值适配本地开发）
const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: process.env.MYSQL_PORT || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '你的MySQL密码', // 🌟 替换为你的真实密码
  database: process.env.MYSQL_DB || 'study_backend', // 已创建的数据库名
  charset: 'utf8mb4', // 兼容中文/emoji
  connectionLimit: 10, // 连接池大小（避免频繁创建连接）
  waitForConnections: true // 连接不足时等待
};

// 创建数据库连接池（核心：推荐连接池而非单连接）
const pool = mysql.createPool(dbConfig);

// 测试数据库连接（启动时验证）
const testDbConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ MySQL数据库连接成功！");
    connection.release(); // 释放连接回池
    return true;
  } catch (err) {
    console.error("❌ MySQL数据库连接失败：", err.message);
    return false;
  }
};

// 生成业务唯一ID（资源ID/第三方资源ID等）
const genid = () => {
  return uuidv4().replace(/-/g, ''); // 去掉横线，生成32位无分隔符ID
};

// 封装通用数据库操作方法（简化路由层调用）
const db = {
  /**
   * 通用查询（返回数组）
   * @param {string} sql SQL语句
   * @param {Array} params 参数数组
   * @returns {Array} 查询结果
   */
  query: async (sql, params = []) => {
    try {
      const [rows] = await pool.execute(sql, params);
      return rows;
    } catch (err) {
      console.error("🔴 DB查询错误：", err.message, "SQL：", sql, "参数：", params);
      throw err; // 抛给上层处理
    }
  },

  /**
   * 执行增/删/改（返回影响行数/自增ID）
   * @param {string} sql SQL语句
   * @param {Array} params 参数数组
   * @returns {Object} 执行结果（affectedRows/insertId等）
   */
  execute: async (sql, params = []) => {
    try {
      const [result] = await pool.execute(sql, params);
      return result;
    } catch (err) {
      console.error("🔴 DB执行错误：", err.message, "SQL：", sql, "参数：", params);
      throw err;
    }
  },

  /**
   * 获取单条数据（返回对象/NULL）
   * @param {string} sql SQL语句
   * @param {Array} params 参数数组
   * @returns {Object|null} 单条结果
   */
  getOne: async (sql, params = []) => {
    const rows = await db.query(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }
};

// 初始化时测试连接
testDbConnection();

// 导出核心方法（供路由/控制器调用）
module.exports = {
  db,
  genid,
  pool // 暴露连接池（特殊场景使用）
};