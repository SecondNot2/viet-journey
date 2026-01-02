/**
 * Auth Service (Supabase)
 * Business logic for authentication
 */
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../../shared/database/db");
const config = require("../../shared/config/app.config");

const JWT_SECRET = config.jwtSecret;
const SALT_ROUNDS = 10;

/**
 * Register new user
 */
const register = async ({ username, email, password, full_name }) => {
  const supabase = db.getClient();

  // Check existing user
  const { data: existingUsers } = await supabase
    .from("users")
    .select("id")
    .or(`username.eq.${username},email.eq.${email}`);

  if (existingUsers && existingUsers.length > 0) {
    throw { code: "USER_EXISTS", message: "Username hoặc email đã tồn tại" };
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // Insert user
  const { data: newUser, error: userError } = await supabase
    .from("users")
    .insert({
      username,
      email,
      password: hashedPassword,
      role_id: 2, // Default user role
      status: "active",
      is_verified: false,
    })
    .select()
    .single();

  if (userError) throw userError;

  // Create profile
  await supabase.from("userprofiles").insert({
    user_id: newUser.id,
    full_name: full_name || username,
  });

  return { id: newUser.id, username, email };
};

/**
 * Login user
 */
const login = async ({ username, password, remember = false }) => {
  const supabase = db.getClient();

  // Find user by username or email
  const { data: users, error } = await supabase
    .from("users")
    .select(
      `
      id, username, email, password, status,
      roles (name)
    `
    )
    .or(`username.eq."${username}",email.eq."${username}"`)
    .limit(1);

  if (error) throw error;
  if (!users || users.length === 0) {
    throw { code: "INVALID_CREDENTIALS", message: "Tài khoản không tồn tại" };
  }

  const user = users[0];

  // Check status
  if (user.status === "banned") {
    throw { code: "ACCOUNT_BANNED", message: "Tài khoản đã bị khóa" };
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw { code: "INVALID_CREDENTIALS", message: "Mật khẩu không đúng" };
  }

  // Generate JWT
  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.roles?.name || "user",
    },
    JWT_SECRET,
    { expiresIn: remember ? "7d" : "1d" }
  );

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.roles?.name || "user",
    },
  };
};

/**
 * Change password
 */
const changePassword = async (userId, { currentPassword, newPassword }) => {
  const supabase = db.getClient();

  // Get current password
  const { data: users } = await supabase
    .from("users")
    .select("password")
    .eq("id", userId)
    .single();

  if (!users) {
    throw { code: "USER_NOT_FOUND", message: "Không tìm thấy người dùng" };
  }

  // Verify current password
  const isValid = await bcrypt.compare(currentPassword, users.password);
  if (!isValid) {
    throw { code: "INVALID_PASSWORD", message: "Mật khẩu hiện tại không đúng" };
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  // Update password
  const { error } = await supabase
    .from("users")
    .update({ password: hashedPassword, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) throw error;

  return true;
};

module.exports = {
  register,
  login,
  changePassword,
};
