/**
 * Auth Middleware
 * JWT token verification and authorization
 */
const jwt = require("jsonwebtoken");
const config = require("../config/app.config");
const response = require("../utils/response.util");

/**
 * Authenticate JWT token from cookies
 */
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return response.unauthorized(res, "Không tìm thấy token xác thực");
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("❌ JWT Verify Error:", err.message);
    return response.forbidden(res, "Token không hợp lệ hoặc đã hết hạn");
  }
};

/**
 * Check if user has required role
 * @param {...string} roles - Allowed roles
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return response.unauthorized(res, "Vui lòng đăng nhập");
    }

    if (!roles.includes(req.user.role)) {
      return response.forbidden(res, "Bạn không có quyền truy cập");
    }

    next();
  };
};

/**
 * Optional auth - doesn't fail if no token
 */
const optionalAuth = (req, res, next) => {
  const token = req.cookies.token;

  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      req.user = decoded;
    } catch (err) {
      // Token invalid but we don't fail
      req.user = null;
    }
  }

  next();
};

module.exports = {
  authenticateToken,
  requireRole,
  optionalAuth,
};
