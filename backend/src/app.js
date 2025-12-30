/**
 * Express Application Setup
 * Centralized app configuration and middleware
 */
const express = require("express");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const fs = require("fs");

const config = require("./shared/config/app.config");

// Create Express app
const app = express();

// ========================================
// MIDDLEWARE
// ========================================

// CORS configuration
app.use(
  cors({
    origin: config.corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "X-Requested-With",
      "Cookie",
    ],
    exposedHeaders: ["Content-Range", "X-Content-Range", "Set-Cookie"],
  })
);

// Body parsing
app.use(cookieParser());
app.use(express.json({ limit: config.uploadLimit }));
app.use(express.urlencoded({ extended: true, limit: config.uploadLimit }));

// ========================================
// STATIC FILES
// ========================================

const staticOptions = {
  setHeaders: (res, filePath, stat) => {
    res.set("Access-Control-Allow-Origin", config.corsOrigins[0]);
    res.set("Access-Control-Allow-Methods", "GET");
    res.set("Access-Control-Allow-Headers", "Content-Type");
  },
};

app.use(express.static(path.join(__dirname, "../public"), staticOptions));
app.use(
  "/uploads",
  express.static(path.join(__dirname, "../public/uploads"), staticOptions)
);
app.use(
  "/images",
  express.static(path.join(__dirname, "../public/images"), staticOptions)
);

// Ensure directories exist
const dirs = [
  path.join(__dirname, "../public/uploads"),
  path.join(__dirname, "../public/images"),
];

dirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ========================================
// ROUTES - MODULAR ARCHITECTURE
// ========================================

// Import modules
const authModule = require("./modules/auth");
const usersModule = require("./modules/users");
const toursModule = require("./modules/tours");
const hotelsModule = require("./modules/hotels");
const flightsModule = require("./modules/flights");
const bookingsModule = require("./modules/bookings");
const destinationsModule = require("./modules/destinations");
const blogsModule = require("./modules/blogs");
const transportModule = require("./modules/transport");
const promotionsModule = require("./modules/promotions");
const reviewsModule = require("./modules/reviews");

// Register routes
app.use("/api/auth", authModule.routes);
app.use("/api/users", usersModule.routes);
app.use("/api/tours", toursModule.routes);
app.use("/api/hotels", hotelsModule.routes);
app.use("/api/flights", flightsModule.routes);
app.use("/api/bookings", bookingsModule.routes);
app.use("/api/destinations", destinationsModule.routes);
app.use("/api/blogs", blogsModule.routes);
app.use("/api/transport", transportModule.routes);
app.use("/api/promotions", promotionsModule.routes);
app.use("/api/reviews", reviewsModule.routes);

// ========================================
// ERROR HANDLING
// ========================================

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.stack);
  res.status(500).json({
    success: false,
    error: "Có lỗi xảy ra ở máy chủ",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Not found",
  });
});

module.exports = app;
