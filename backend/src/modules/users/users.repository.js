/**
 * Users Repository (Supabase)
 * Database operations for user data
 */
const db = require("../../shared/database/db");

/**
 * Find all users
 */
const findAll = async () => {
  const supabase = db.getClient();
  const { data, error } = await supabase
    .from("users")
    .select(
      `
      id, username, email, role_id, status, is_verified, created_at, updated_at,
      roles (name),
      userprofiles (full_name, phone_number, avatar)
    `
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data.map(formatUserWithProfile);
};

/**
 * Find user by ID
 */
const findById = async (id) => {
  const supabase = db.getClient();
  const { data, error } = await supabase
    .from("users")
    .select(
      `
      id, username, email, role_id, status, is_verified, created_at, updated_at,
      roles (name),
      userprofiles (*)
    `
    )
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data ? formatUserWithProfile(data) : null;
};

/**
 * Find user by username
 */
const findByUsername = async (username) => {
  const supabase = db.getClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
};

/**
 * Find user by email
 */
const findByEmail = async (email) => {
  const supabase = db.getClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
};

/**
 * Find user profile by ID
 */
const findProfileById = async (id) => {
  const supabase = db.getClient();
  const { data, error } = await supabase
    .from("users")
    .select(
      `
      id, username, email, status, created_at,
      roles (name),
      userprofiles (*)
    `
    )
    .eq("id", id)
    .single();

  if (error) throw error;
  return data ? formatFullProfile(data) : null;
};

/**
 * Update user profile
 */
const updateProfile = async (userId, profileData) => {
  const supabase = db.getClient();

  const { error } = await supabase
    .from("userprofiles")
    .update({
      ...profileData,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) throw error;
  return true;
};

/**
 * Update user
 */
const updateUser = async (userId, userData) => {
  const supabase = db.getClient();

  const { error } = await supabase
    .from("users")
    .update({
      ...userData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) throw error;
  return true;
};

/**
 * Update user status
 */
const updateStatus = async (userId, status) => {
  const supabase = db.getClient();

  const { error } = await supabase
    .from("users")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) throw error;
  return true;
};

/**
 * Soft delete user
 */
const softDelete = async (userId) => {
  return updateStatus(userId, "inactive");
};

/**
 * Find all roles
 */
const findAllRoles = async () => {
  const supabase = db.getClient();
  const { data, error } = await supabase.from("roles").select("*");
  if (error) throw error;
  return data;
};

/**
 * Get admin stats
 */
const getAdminStats = async () => {
  const supabase = db.getClient();

  const { count: totalUsers } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true });

  const { count: activeUsers } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  return {
    totalUsers: totalUsers || 0,
    activeUsers: activeUsers || 0,
  };
};

/**
 * Find users with filters
 */
const findWithFilters = async ({ page = 1, limit = 10, status, search }) => {
  const supabase = db.getClient();
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let query = supabase.from("users").select(
    `
      id, username, email, role_id, status, is_verified, created_at,
      roles (name),
      userprofiles (full_name, avatar)
    `,
    { count: "exact" }
  );

  if (status) {
    query = query.eq("status", status);
  }

  if (search) {
    query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + parseInt(limit) - 1);

  if (error) throw error;

  return {
    users: data.map(formatUserWithProfile),
    total: count,
    page: parseInt(page),
    totalPages: Math.ceil(count / parseInt(limit)),
  };
};

// Helper functions
const formatUserWithProfile = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  role_id: user.role_id,
  role_name: user.roles?.name || "user",
  status: user.status,
  is_verified: user.is_verified,
  full_name: user.userprofiles?.full_name,
  phone_number: user.userprofiles?.phone_number,
  avatar: user.userprofiles?.avatar,
  created_at: user.created_at,
  updated_at: user.updated_at,
});

const formatFullProfile = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  role_name: user.roles?.name || "user",
  status: user.status,
  full_name: user.userprofiles?.full_name,
  phone_number: user.userprofiles?.phone_number,
  birth_date: user.userprofiles?.birth_date,
  gender: user.userprofiles?.gender,
  address: user.userprofiles?.address,
  avatar: user.userprofiles?.avatar,
  bio: user.userprofiles?.bio,
  created_at: user.created_at,
});

module.exports = {
  findAll,
  findById,
  findByUsername,
  findByEmail,
  findProfileById,
  updateProfile,
  updateUser,
  updateStatus,
  softDelete,
  findAllRoles,
  getAdminStats,
  findWithFilters,
};
