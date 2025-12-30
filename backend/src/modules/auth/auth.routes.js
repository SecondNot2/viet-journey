/**
 * Auth Routes
 * API endpoints for authentication
 */
const express = require("express");
const router = express.Router();
const authController = require("./auth.controller");
const {
  authenticateToken,
} = require("../../shared/middleware/auth.middleware");

// Public routes
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.get("/debug-cookies", authController.debugCookies);

// Protected routes
router.put(
  "/change-password",
  authenticateToken,
  authController.changePassword
);

module.exports = router;
