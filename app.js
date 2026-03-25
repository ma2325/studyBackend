const express = require('express');
const { rateLimit } = require('express-rate-limit');
const app = express();
// 🌟 优化：从环境变量读取端口，本地开发用3000，部署可灵活配置
const PORT = process.env.PORT || 3000;

// 🌟 修复：增加try-catch，避免dbUtils不存在导致服务启动失败
let db, genid;
try {
  ({ db, genid } = require("./db/dbUtils"));
  console.log("✅ 数据库工具加载成功");
} catch (err) {
  console.warn("⚠️ 数据库工具加载失败（非核心错误，服务继续运行）：", err.message);
  db = null;
  genid = () => Math.random().toString(36).substr(2, 10); // 兜底生成ID
}

const path = require('path');
const cors = require('cors'); 
const morgan = require('morgan'); 
// 🌟 新增：引入文件操作工具（后续路由/控制器会用到）
const fs = require('fs');
const noteRouter = require('./router/noteRouter');
app.use('/api/notes', noteRouter);

// 🌟 新增：提前创建必要的本地存储目录（避免运行时报错）
const createStorageDirs = () => {
  const dirs = [
    path.join(__dirname, 'storage/temp'), // 临时上传目录
    path.join(__dirname, 'storage/original'), // 原始文件存储
    path.join(__dirname, 'storage/index'), // 索引文件存储
    path.join(__dirname, 'storage/logs'), // 日志目录
    path.join(__dirname, 'storage/sync'), // 同步记录目录
    path.join(__dirname, 'storage/notes') //手写笔记存储
  ];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ 已创建目录：${dir}`);
    }
  });
};
createStorageDirs();

// app.set('view engine','ejs');//邮件（暂时保留，若不需要可注释）
// app.set('views',path.join(__dirname,'views'));

/* 全局打印请求（调试用） */
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] 请求路径: ${req.method} ${req.originalUrl}`);
  next();
});

/* API限流配置 */
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  limit: 60, // 1分钟最多60次请求
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  // 排除文件上传接口（大文件上传易触发限流）
  skip: (req) => {
    const uploadPaths = ['/api/resource/upload', '/api/resource/upload/batch'];
    return uploadPaths.some(path => req.originalUrl.includes(path));
  },
  // 🌟 新增：自定义限流响应（更贴合项目统一格式）
  handler: (req, res) => {
    res.status(429).json({
      code: 429,
      msg: "请求过于频繁，请1分钟后重试",
      success: false,
      timestamp: Date.now()
    });
  }
});

/* 跨域配置（优化） */
app.use(cors({
  origin: "*", // 开发环境允许所有域名，生产环境替换为具体域名（如http://localhost:8080）
  credentials: true,
  methods: ["DELETE", "PUT", "POST", "GET", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

// 🌟 优化：OPTIONS请求快速响应（避免预检请求报错）
app.options('*', cors());

/* 日志中间件（优化格式） */
app.use(morgan('[:date[iso]] :method :url :status :response-time ms - :res[content-length]', {
  stream: { 
    write: (msg) => {
      // 日志同时输出到控制台+文件
      console.log(`[日志] ${msg.trim()}`);
      // 写入日志文件（按天分割）
      const logDate = new Date().toISOString().split('T')[0];
      const logPath = path.join(__dirname, `storage/logs/${logDate}.log`);
      fs.appendFileSync(logPath, `${msg}\n`, 'utf8');
    } 
  }
}));

/* 数据解析中间件（优化） */
app.use(express.json({ 
  limit: '100mb',
  // 新增：忽略无效JSON，避免请求体格式错误导致服务崩溃
  strict: false 
})); 
app.use(express.urlencoded({ 
  extended: true, 
  limit: '100mb',
  parameterLimit: 10000 // 增加参数数量限制
})); 

/* 挂载限流中间件 */
app.use(limiter);

/* 🌟 核心修改：修复管理员路由挂载路径，匹配 /api/v1/simple_admin */
// 1. 管理员路由（正确挂载路径：/api/v1/simple_admin）
try {
  app.use("/api/v1/simple_admin", require("./router/adminRouter"));
  console.log("✅ 已挂载/api/v1/simple_admin路由");
} catch (err) {
  console.error("❌ /api/v1/simple_admin路由加载失败：", err.message);
  // 兜底：返回404
  app.use("/api/v1/simple_admin", (req, res) => {
    res.status(404).json({ 
      code: 404, 
      msg: "管理员路由加载失败或接口不存在", 
      success: false,
      timestamp: Date.now()
    });
  });
}

// 保留原有/admin路由（兼容旧路径，可选）
try {
  app.use("/admin", require("./router/adminRouter"));
  console.log("✅ 已挂载/admin路由（兼容旧路径）");
} catch (err) {
  console.warn("⚠️ /admin路由加载失败（兼容路径，可忽略）：", err.message);
}

// 2. 资源核心路由
try {
  app.use("/api/resource", require("./router/resourceRouter"));
  console.log("✅ 已挂载/api/resource路由");
} catch (err) {
  console.error("❌ /api/resource路由加载失败：", err.message);
  app.use("/api/resource", (req, res) => {
    res.status(500).json({ code: 500, msg: "资源路由加载失败", success: false });
  });
}

// 3. 隐私管理路由
try {
  app.use("/api/privacy", require("./router/privacyRouter"));
  console.log("✅ 已挂载/api/privacy路由");
} catch (err) {
  console.error("❌ /api/privacy路由加载失败：", err.message);
  app.use("/api/privacy", (req, res) => {
    res.status(500).json({ code: 500, msg: "隐私路由加载失败", success: false });
  });
}
app.use("/admin",require("./router/adminRouter"));
app.use("/material",require("./router/materialRouter"))

// 4. 第三方资源路由
try {
  app.use("/api/third-party", require("./router/thirdPartyRouter"));
  console.log("✅ 已挂载/api/third-party路由");
} catch (err) {
  console.error("❌ /api/third-party路由加载失败：", err.message);
  app.use("/api/third-party", (req, res) => {
    res.status(500).json({ code: 500, msg: "第三方资源路由加载失败", success: false });
  });
}

try {
  app.use("/api/feynman", require("./router/feynmanRouter"));
  console.log("✅ 已挂载/api/feynman路由");
} catch (err) {
  console.error("❌ /api/feynman路由加载失败：", err.message);
  app.use("/api/feynman", (req, res) => {
    res.status(500).json({ code: 500, msg: "费曼学习路由加载失败", success: false });
  });
}

/* 🌟 新增：根路径健康检查接口（测试服务是否启动） */
app.get("/", (req, res) => {
  res.json({
    code: 200,
    msg: "后端1号（资源整合模块）服务正常运行",
    success: true,
    data: { port: PORT, time: new Date().toLocaleString() }
  });
});

/* 全局错误处理中间件（优化） */
app.use((err, req, res, next) => {
  const errorMsg = `[错误] ${err.message}`;
  // 打印错误栈（开发环境）
  console.error(errorMsg, err.stack);
  // 写入错误日志
  const logDate = new Date().toISOString().split('T')[0];
  const errorLogPath = path.join(__dirname, `storage/logs/error_${logDate}.log`);
  fs.appendFileSync(errorLogPath, `${new Date().toISOString()} | ${errorMsg} | ${err.stack}\n`, 'utf8');
  // 统一错误响应
  res.status(err.status || 500).json({
    code: err.code || 500,
    msg: process.env.NODE_ENV === 'development' ? err.message : "服务器内部错误", // 生产环境隐藏具体错误
    success: false,
    timestamp: Date.now(),
    // 开发环境返回错误栈
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

/* 🌟 新增：404处理（所有未匹配的路由） */
app.use('*', (req, res) => {
  res.status(404).json({
    code: 404,
    msg: `接口不存在：${req.method} ${req.originalUrl}`,
    success: false,
    timestamp: Date.now()
  });
});

/* 启动服务（优化） */
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 后端1号（资源整合模块）服务启动成功！`);
  console.log(`🔗 访问地址：http://localhost:${PORT}`);
  console.log(`📝 健康检查：http://localhost:${PORT}/`);
  console.log(`⚙️ 运行环境：${process.env.NODE_ENV || 'development'}\n`);
});

/* 🌟 新增：优雅关闭服务（处理端口占用问题） */
process.on('SIGINT', () => {
  console.log("\n🛑 正在关闭服务...");
  server.close(() => {
    console.log("✅ 服务已优雅关闭");
    process.exit(0);
  });
});

module.exports = app;