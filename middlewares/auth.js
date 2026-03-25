const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // 格式: Bearer TOKEN

    if (!token) return res.status(401).json({ code: 401, msg: "未登录或Token缺失" });

    // 这里的 'your_jwt_secret' 必须和你登录接口加密时用的 secret 一致
    jwt.verify(token, process.env.JWT_SECRET || 'study_secret_key', (err, user) => {
        if (err) return res.status(403).json({ code: 403, msg: "Token已过期或非法" });
        req.user = user; 
        next();
    });
};