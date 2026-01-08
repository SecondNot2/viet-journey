import React, { useState } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  Chrome,
  UserCircle,
  CheckCircle,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { API_URL } from "../../../config/api";

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Client-side validation
      if (!formData.username.trim()) {
        throw new Error("Vui lòng nhập tên đăng nhập");
      }

      if (formData.username.length < 3) {
        throw new Error("Tên đăng nhập phải có ít nhất 3 ký tự");
      }

      if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
        throw new Error(
          "Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới"
        );
      }

      if (!formData.fullName.trim()) {
        throw new Error("Vui lòng nhập họ tên");
      }

      if (!formData.email.trim()) {
        throw new Error("Vui lòng nhập email");
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error("Email không hợp lệ");
      }

      if (
        formData.phone &&
        !/^[0-9]{10,11}$/.test(formData.phone.replace(/\s/g, ""))
      ) {
        throw new Error("Số điện thoại phải có 10-11 chữ số");
      }

      if (!formData.password) {
        throw new Error("Vui lòng nhập mật khẩu");
      }

      if (formData.password.length < 6) {
        throw new Error("Mật khẩu phải có ít nhất 6 ký tự");
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error("Mật khẩu xác nhận không khớp");
      }

      if (!formData.agreeToTerms) {
        throw new Error("Vui lòng đồng ý với điều khoản sử dụng");
      }

      // Gửi request đăng ký
      const response = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          full_name: formData.fullName.trim(),
          phone_number: formData.phone.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Đăng ký thất bại");
      }

      // Hiển thị thông báo thành công
      setSuccess("Đăng ký thành công! Đang tự động đăng nhập...");

      // Tự động đăng nhập sau khi đăng ký
      const loginResponse = await fetch(`${API_URL}/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username: formData.username.trim(),
          password: formData.password,
          remember: true,
        }),
      });

      const loginData = await loginResponse.json();

      if (!loginResponse.ok) {
        // Nếu auto-login thất bại, redirect về login page
        setSuccess("Đăng ký thành công! Vui lòng đăng nhập.");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
        return;
      }

      // Lưu thông tin đăng nhập
      localStorage.setItem("user", JSON.stringify(loginData.user));
      localStorage.setItem("token", loginData.token);

      // Đăng nhập người dùng qua context
      login(loginData.user);

      // Chuyển hướng về trang chủ
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 to-emerald-700 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">VietJourney</h1>
          <p className="text-emerald-100">Tạo tài khoản để trải nghiệm</p>
        </div>

        {/* Register Form */}
        <div className="mt-8 bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
              Đăng Ký Tài Khoản
            </h2>

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">{success}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-500"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Username Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên đăng nhập
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserCircle className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm"
                  placeholder="username"
                  required
                  pattern="[a-zA-Z0-9_]+"
                  title="Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới"
                />
              </div>
            </div>

            {/* Full Name Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Họ và tên
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm"
                  placeholder="Nguyễn Văn A"
                  required
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm"
                  placeholder="your.email@example.com"
                  required
                />
              </div>
            </div>

            {/* Phone Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số điện thoại
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm"
                  placeholder="0912345678"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Xác nhận mật khẩu
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.agreeToTerms}
                onChange={(e) =>
                  setFormData({ ...formData, agreeToTerms: e.target.checked })
                }
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                required
              />
              <label className="ml-2 block text-sm text-gray-700">
                Tôi đồng ý với{" "}
                <Link
                  to="/terms"
                  className="text-emerald-600 hover:text-emerald-500"
                >
                  Điều khoản dịch vụ
                </Link>{" "}
                và{" "}
                <Link
                  to="/privacy"
                  className="text-emerald-600 hover:text-emerald-500"
                >
                  Chính sách bảo mật
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
              >
                {loading ? "Đang đăng ký..." : "Đăng Ký"}
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Hoặc</span>
              </div>
            </div>

            {/* Social Register */}
            <div className="flex justify-center">
              <button
                type="button"
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                <Chrome className="h-5 w-5 mr-2 text-red-500" />
                Google
              </button>
            </div>

            {/* Login Link */}
            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                Đã có tài khoản?{" "}
                <Link
                  to="/login"
                  className="font-medium text-emerald-600 hover:text-emerald-500"
                >
                  Đăng nhập ngay
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
