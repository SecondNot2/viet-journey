/**
 * Database Configuration
 * Cấu hình kết nối MySQL với connection pool
 */
const mysql = require("mysql2/promise");

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "2not2",
  database: process.env.DB_NAME || "viet_journey",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Verify connection on startup
pool
  .getConnection()
  .then((connection) => {
    console.log("✅ Database connected successfully");
    connection.release();
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err.message);
  });

module.exports = { pool, dbConfig };
