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

  // 1. Fetch user & profile
  const { data: user, error } = await supabase
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
  if (!user) return null;

  // 2. Calculate stats
  // Total bookings
  const { count: totalBookings } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("user_id", id);

  // Completed bookings
  const { count: completedBookings } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("user_id", id)
    .eq("status", "completed");

  // Upcoming bookings
  const { count: upcomingBookings } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("user_id", id)
    .or("status.eq.confirmed,status.eq.pending");

  // Total reviews
  const { count: totalReviews } = await supabase
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("user_id", id);

  // Total Tours Booked
  const { count: totalTours } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("user_id", id)
    .not("tour_id", "is", null);

  // Total Hotels Booked
  const { count: totalHotels } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("user_id", id)
    .not("hotel_id", "is", null);

  // Stats object
  const stats = {
    total_bookings: totalBookings || 0,
    completed_bookings: completedBookings || 0,
    upcoming_bookings: upcomingBookings || 0,
    total_reviews: totalReviews || 0,
    total_tours: totalTours || 0,
    total_hotels: totalHotels || 0,
  };

  // 3. Fetch recent activity data
  const { data: recentBookings } = await supabase
    .from("bookings")
    .select(
      `
      id, created_at, status,
      tours (title),
      hotels (name),
      flight_schedules (
        flight_routes (from_location, to_location)
      )
    `
    )
    .eq("user_id", id)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: recentReviews } = await supabase
    .from("reviews")
    .select(
      `
      id, created_at, rating,
      tours (title),
      hotels (name)
    `
    )
    .eq("user_id", id)
    .order("created_at", { ascending: false })
    .limit(5);

  return formatFullProfile({
    ...user,
    ...stats,
    recent_bookings: recentBookings || [],
    recent_reviews: recentReviews || [],
  });
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
  total_bookings: user.total_bookings,
  completed_bookings: user.completed_bookings,
  upcoming_bookings: user.upcoming_bookings,
  total_reviews: user.total_reviews,
  total_tours: user.total_tours,
  total_hotels: user.total_hotels,
  recent_bookings: user.recent_bookings,
  recent_reviews: user.recent_reviews,
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
