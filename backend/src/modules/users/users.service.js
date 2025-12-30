/**
 * Users Service
 * Business logic for user operations
 */
const usersRepository = require("./users.repository");

/**
 * Get all users
 */
const getAllUsers = async () => {
  const users = await usersRepository.findAll();
  return users.map(formatUser);
};

/**
 * Get user by ID
 */
const getUserById = async (id) => {
  const user = await usersRepository.findById(id);
  if (!user) return null;
  return formatUser(user);
};

/**
 * Get user profile with stats
 */
const getUserProfile = async (id) => {
  const user = await usersRepository.findProfileById(id);
  if (!user) return null;

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role_name,
    status: user.status,
    full_name: user.full_name,
    phone_number: user.phone_number,
    birth_date: user.birth_date,
    gender: user.gender,
    address: user.address,
    avatar: user.avatar,
    bio: user.bio,
    created_at: user.created_at,
    stats: {
      totalBookings: parseInt(user.total_bookings) || 0,
      completedBookings: parseInt(user.completed_bookings) || 0,
      upcomingBookings: parseInt(user.upcoming_bookings) || 0,
      totalReviews: parseInt(user.total_reviews) || 0,
    },
    preferences: {
      favoriteDestinations: user.favorite_destinations || [],
      travelStyle: user.travel_style || "Chưa cập nhật",
      budget: user.budget || "Chưa cập nhật",
    },
  };
};

/**
 * Update user profile
 */
const updateProfile = async (userId, profileData) => {
  return await usersRepository.updateProfile(userId, profileData);
};

/**
 * Update user (admin)
 */
const updateUser = async (userId, userData) => {
  // Update profile if profile data exists
  if (userData.full_name !== undefined) {
    await usersRepository.updateProfile(userId, userData);
  }
  // Update user table
  return await usersRepository.updateUser(userId, userData);
};

/**
 * Update user status
 */
const updateUserStatus = async (userId, status) => {
  const validStatuses = ["active", "inactive", "banned"];
  if (!validStatuses.includes(status)) {
    throw new Error("INVALID_STATUS");
  }
  return await usersRepository.updateStatus(userId, status);
};

/**
 * Delete user (soft delete)
 */
const deleteUser = async (userId) => {
  return await usersRepository.softDelete(userId);
};

/**
 * Get all roles
 */
const getAllRoles = async () => {
  return await usersRepository.findAllRoles();
};

/**
 * Get admin stats
 */
const getAdminStats = async () => {
  return await usersRepository.getAdminStats();
};

/**
 * Get users with filters (admin)
 */
const getUsersWithFilters = async (filters) => {
  return await usersRepository.findWithFilters(filters);
};

/**
 * Format user object for response
 */
const formatUser = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  role_id: user.role_id,
  role: user.role || user.role_name || "user",
  status: user.status,
  is_verified: user.is_verified,
  full_name: user.full_name,
  phone_number: user.phone_number,
  birth_date: user.birth_date,
  gender: user.gender,
  address: user.address,
  avatar: user.avatar,
  bio: user.bio,
  created_at: user.created_at,
  updated_at: user.updated_at,
});

module.exports = {
  getAllUsers,
  getUserById,
  getUserProfile,
  updateProfile,
  updateUser,
  updateUserStatus,
  deleteUser,
  getAllRoles,
  getAdminStats,
  getUsersWithFilters,
};
