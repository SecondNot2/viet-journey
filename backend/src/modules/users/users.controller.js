/**
 * Users Controller
 * Handle HTTP requests for user operations
 */
const usersService = require("./users.service");
const response = require("../../shared/utils/response.util");

/**
 * GET /api/users
 * List all users
 */
const getUsers = async (req, res) => {
  try {
    const users = await usersService.getAllUsers();
    return response.success(res, users);
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    return response.serverError(res, "Internal server error");
  }
};

/**
 * GET /api/users/profile
 * Get current user profile
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await usersService.getUserProfile(userId);

    if (!profile) {
      return response.notFound(res, "Không tìm thấy người dùng");
    }

    return response.success(res, profile);
  } catch (error) {
    console.error("❌ Error fetching profile:", error);
    return response.serverError(res, "Lỗi khi lấy thông tin người dùng");
  }
};

/**
 * GET /api/users/:id
 * Get user by ID
 */
const getUserById = async (req, res) => {
  try {
    const user = await usersService.getUserById(req.params.id);

    if (!user) {
      return response.notFound(res, "User not found");
    }

    return response.success(res, user);
  } catch (error) {
    console.error("❌ Error fetching user:", error);
    return response.serverError(res, "Internal server error");
  }
};

/**
 * PUT /api/users/:id
 * Update user
 */
const updateUser = async (req, res) => {
  try {
    await usersService.updateUser(req.params.id, req.body);
    return response.success(res, null, "User updated successfully");
  } catch (error) {
    console.error("❌ Error updating user:", error);
    return response.serverError(res, "Internal server error");
  }
};

/**
 * PUT /api/users/:id/status
 * Update user status
 */
const updateUserStatus = async (req, res) => {
  try {
    await usersService.updateUserStatus(req.params.id, req.body.status);
    return response.success(res, null, "User status updated successfully");
  } catch (error) {
    console.error("❌ Error updating user status:", error);

    if (error.message === "INVALID_STATUS") {
      return response.badRequest(res, "Invalid status");
    }

    return response.serverError(res, "Internal server error");
  }
};

/**
 * DELETE /api/users/:id
 * Soft delete user
 */
const deleteUser = async (req, res) => {
  try {
    await usersService.deleteUser(req.params.id);
    return response.success(res, null, "User deleted successfully");
  } catch (error) {
    console.error("❌ Error deleting user:", error);
    return response.serverError(res, "Internal server error");
  }
};

/**
 * GET /api/users/roles
 * Get all roles
 */
const getRoles = async (req, res) => {
  try {
    const roles = await usersService.getAllRoles();
    return response.success(res, roles);
  } catch (error) {
    console.error("❌ Error fetching roles:", error);
    return response.serverError(res, "Internal server error");
  }
};

// ========================================
// ADMIN ENDPOINTS
// ========================================

/**
 * GET /api/users/admin/stats
 */
const getAdminStats = async (req, res) => {
  try {
    const stats = await usersService.getAdminStats();
    return response.success(res, stats);
  } catch (error) {
    console.error("❌ Error fetching admin stats:", error);
    return response.serverError(res, "Failed to fetch stats");
  }
};

/**
 * GET /api/users/admin/users
 */
const getAdminUsers = async (req, res) => {
  try {
    const result = await usersService.getUsersWithFilters(req.query);
    return res.json(result); // Legacy format for admin panel
  } catch (error) {
    console.error("❌ Error fetching admin users:", error);
    return response.serverError(res, "Failed to fetch users");
  }
};

/**
 * GET /api/users/admin/roles
 */
const getAdminRoles = async (req, res) => {
  try {
    const roles = await usersService.getAllRoles();
    return res.json(roles); // Legacy format
  } catch (error) {
    console.error("❌ Error fetching roles:", error);
    return response.serverError(res, "Failed to fetch roles");
  }
};

/**
 * PUT /api/users/admin/users/:id
 */
const updateAdminUser = async (req, res) => {
  try {
    await usersService.updateUser(req.params.id, req.body);
    return response.success(res, null, "User updated successfully");
  } catch (error) {
    console.error("❌ Error updating user:", error);
    return response.serverError(res, "Failed to update user");
  }
};

module.exports = {
  getUsers,
  getProfile,
  getUserById,
  updateUser,
  updateUserStatus,
  deleteUser,
  getRoles,
  getAdminStats,
  getAdminUsers,
  getAdminRoles,
  updateAdminUser,
};
