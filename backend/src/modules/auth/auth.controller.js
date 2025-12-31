/**
 * Auth Controller
 * Handle HTTP requests for authentication
 */
const authService = require("./auth.service");
const response = require("../../shared/utils/response.util");
const {
  isValidEmail,
  isValidPhone,
  validatePassword,
} = require("../../shared/utils/validation.util");

/**
 * POST /api/auth/register
 * Register new user
 */
const register = async (req, res) => {
  try {
    const { username, email, password, full_name, phone_number } = req.body;

    // Validation
    if (!username || !email || !password) {
      return response.badRequest(
        res,
        "Vui lòng điền đầy đủ thông tin bắt buộc"
      );
    }

    if (!isValidEmail(email)) {
      return response.badRequest(res, "Email không hợp lệ");
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return response.badRequest(res, passwordCheck.message);
    }

    if (username.length < 3) {
      return response.badRequest(res, "Tên đăng nhập phải có ít nhất 3 ký tự");
    }

    // Check duplicates
    if (await authService.usernameExists(username)) {
      return response.badRequest(res, "Tên đăng nhập đã tồn tại");
    }

    if (await authService.emailExists(email)) {
      return response.badRequest(res, "Email đã được sử dụng");
    }

    if (phone_number && !isValidPhone(phone_number)) {
      return response.badRequest(res, "Số điện thoại không hợp lệ (10-11 số)");
    }

    // Register user
    const user = await authService.registerUser({
      username,
      email,
      password,
      full_name,
      phone_number,
    });

    return response.created(res, { user }, "Đăng ký tài khoản thành công!");
  } catch (error) {
    console.error("❌ Register error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      if (error.message.includes("username")) {
        return response.badRequest(res, "Tên đăng nhập đã tồn tại");
      }
      if (error.message.includes("email")) {
        return response.badRequest(res, "Email đã được sử dụng");
      }
    }

    return response.serverError(res, "Lỗi hệ thống. Vui lòng thử lại sau.");
  }
};

/**
 * POST /api/auth/login
 * User login
 */
const login = async (req, res) => {
  try {
    const { username, password, remember } = req.body;

    // Find user
    const user = await authService.findUserByCredential(username);
    if (!user) {
      return response.unauthorized(
        res,
        "Tên đăng nhập hoặc mật khẩu không đúng"
      );
    }

    // Validate password
    const isValid = await authService.validatePassword(password, user.password);
    if (!isValid) {
      return response.unauthorized(
        res,
        "Tên đăng nhập hoặc mật khẩu không đúng"
      );
    }

    // Generate token
    const token = authService.generateToken(user, remember);

    // Set cookie
    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction, // Secure in production
      sameSite: isProduction ? "strict" : "lax", // Strict CSRF protection in production
      path: "/",
      maxAge: remember ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return response.success(res, { user: userWithoutPassword, token });
  } catch (error) {
    console.error("❌ Login error:", error);
    return response.serverError(res, "Lỗi server");
  }
};

/**
 * POST /api/auth/logout
 * User logout
 */
const logout = (req, res) => {
  const isProduction = process.env.NODE_ENV === "production";
  res.clearCookie("token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    path: "/",
  });
  return response.success(res, null, "Đăng xuất thành công");
};

/**
 * PUT /api/auth/change-password
 * Change user password
 */
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return response.badRequest(res, "Vui lòng điền đầy đủ thông tin");
    }

    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.valid) {
      return response.badRequest(res, passwordCheck.message);
    }

    await authService.changePassword(userId, currentPassword, newPassword);
    return response.success(res, null, "Đổi mật khẩu thành công!");
  } catch (error) {
    console.error("❌ Change password error:", error);

    if (error.message === "USER_NOT_FOUND") {
      return response.notFound(res, "Không tìm thấy người dùng");
    }
    if (error.message === "INVALID_CURRENT_PASSWORD") {
      return response.unauthorized(res, "Mật khẩu hiện tại không đúng");
    }

    return response.serverError(res, "Lỗi hệ thống. Vui lòng thử lại sau.");
  }
};

/**
 * GET /api/auth/debug-cookies
 * Debug route
 */
const debugCookies = (req, res) => {
  return response.success(res, {
    cookies: req.cookies,
    hasToken: !!req.cookies.token,
  });
};

module.exports = {
  register,
  login,
  logout,
  changePassword,
  debugCookies,
};
