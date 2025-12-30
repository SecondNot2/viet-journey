/**
 * Users Routes
 * API endpoints for user operations
 */
const express = require("express");
const router = express.Router();
const usersController = require("./users.controller");
const {
  authenticateToken,
} = require("../../shared/middleware/auth.middleware");

// Admin routes (must be before /:id to avoid conflicts)
router.get("/admin/stats", usersController.getAdminStats);
router.get("/admin/users", usersController.getAdminUsers);
router.get("/admin/roles", usersController.getAdminRoles);
router.put("/admin/users/:id", usersController.updateAdminUser);

// Roles route
router.get("/roles", usersController.getRoles);

// Profile route (protected)
router.get("/profile", authenticateToken, usersController.getProfile);

// Public routes
router.get("/", usersController.getUsers);
router.get("/:id", usersController.getUserById);

// Protected routes
router.put("/:id", usersController.updateUser);
router.put("/:id/status", usersController.updateUserStatus);
router.delete("/:id", usersController.deleteUser);

module.exports = router;
