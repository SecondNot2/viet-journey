/**
 * Application Configuration
 * Cấu hình chung cho ứng dụng
 */
const config = {
  // Server
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",

  // JWT - Required in production!
  jwtSecret: (() => {
    const secret = process.env.JWT_SECRET;
    if (!secret && process.env.NODE_ENV === "production") {
      throw new Error("❌ JWT_SECRET is required in production!");
    }
    return secret;
  })(),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",

  // CORS
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",")
    : ["http://localhost:3000", "http://127.0.0.1:3000"],

  // Upload
  uploadLimit: "50mb",
  uploadDir: "public/uploads",

  // Pagination defaults
  defaultPageSize: 10,
  maxPageSize: 100,
};

module.exports = config;
