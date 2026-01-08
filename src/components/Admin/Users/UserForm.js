import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Save,
  Loader2,
  User,
  Mail,
  Phone,
  Calendar,
} from "lucide-react";
import toast from "react-hot-toast";
import { API_URL, API_HOST } from "../../../config/api";


const UserForm = ({ user, onClose, onSave, viewMode, editMode }) => {
  const isAddMode = !user && !viewMode;
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role_id: 2, // Default to 'user' role
    status: "active",
    is_verified: false,
    full_name: "",
    phone_number: "",
    birth_date: "",
    gender: "male",
    address: "",
    bio: "",
  });

  const [errors, setErrors] = useState({});

  // Load roles
  useEffect(() => {
    fetchRoles();
  }, []);

  // Load data for edit/view mode
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        email: user.email || "",
        password: "", // Don't show password
        role_id: user.role_id || 2,
        status: user.status || "active",
        is_verified: user.is_verified || false,
        full_name: user.full_name || "",
        phone_number: user.phone_number || "",
        birth_date: user.birth_date || "",
        gender: user.gender || "male",
        address: user.address || "",
        bio: user.bio || "",
      });
    }
  }, [user]);

  // Fetch roles
  const fetchRoles = async () => {
    try {
      const response = await fetch(`${API_URL}/users/admin/roles`);
      if (!response.ok) throw new Error("Failed to fetch roles");

      const data = await response.json();
      setRoles(data);
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = "Vui lòng nhập tên người dùng";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Vui lòng nhập email";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email không hợp lệ";
    }

    if (isAddMode && !formData.password) {
      newErrors.password = "Vui lòng nhập mật khẩu";
    }

    if (isAddMode && formData.password && formData.password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Vui lòng kiểm tra lại thông tin!");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        is_verified: formData.is_verified ? 1 : 0,
      };

      // Don't send password if empty (for edit mode)
      if (!isAddMode && !formData.password) {
        delete payload.password;
      }

      const url = isAddMode
        ? `${API_URL}/users`
        : `${API_URL}/users/admin/users/${user.id}`;

      const method = isAddMode ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save user");
      }

      toast.success(
        isAddMode
          ? "Tạo người dùng thành công!"
          : "Cập nhật người dùng thành công!"
      );

      onSave();
    } catch (error) {
      console.error("Error saving user:", error);
      toast.error(error.message || "Có lỗi xảy ra khi lưu người dùng!");
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 -mx-8 -mt-8 px-8 py-8 mb-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="bg-white/10 backdrop-blur-sm p-2 rounded-lg hover:bg-white/20 transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-white" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {viewMode
                    ? "Chi tiết người dùng"
                    : isAddMode
                    ? "Thêm người dùng mới"
                    : "Chỉnh sửa người dùng"}
                </h1>
                <p className="text-indigo-100 mt-1">
                  {viewMode
                    ? "Xem thông tin chi tiết người dùng"
                    : isAddMode
                    ? "Tạo tài khoản người dùng mới"
                    : "Cập nhật thông tin người dùng"}
                </p>
              </div>
            </div>
            {!viewMode && (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 bg-white text-indigo-600 px-6 py-3 rounded-xl font-medium hover:bg-indigo-50 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Lưu người dùng
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Account Info */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Thông tin tài khoản
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên người dùng <span className="text-red-500">*</span>
                </label>
                {viewMode ? (
                  <p className="text-gray-900">{formData.username}</p>
                ) : (
                  <>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) =>
                          setFormData({ ...formData, username: e.target.value })
                        }
                        className={`w-full pl-10 pr-4 py-3 border ${
                          errors.username ? "border-red-500" : "border-gray-300"
                        } rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                        placeholder="Nhập tên người dùng"
                      />
                    </div>
                    {errors.username && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.username}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                {viewMode ? (
                  <p className="text-gray-900">{formData.email}</p>
                ) : (
                  <>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className={`w-full pl-10 pr-4 py-3 border ${
                          errors.email ? "border-red-500" : "border-gray-300"
                        } rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                        placeholder="Nhập email"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.email}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Password (only for add/edit) */}
              {!viewMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mật khẩu{" "}
                    {isAddMode && <span className="text-red-500">*</span>}
                  </label>
                  <>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className={`w-full px-4 py-3 border ${
                        errors.password ? "border-red-500" : "border-gray-300"
                      } rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                      placeholder={
                        isAddMode ? "Nhập mật khẩu" : "Để trống nếu không đổi"
                      }
                    />
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.password}
                      </p>
                    )}
                  </>
                </div>
              )}

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vai trò
                </label>
                {viewMode ? (
                  <p className="text-gray-900">
                    {roles.find((r) => r.id === formData.role_id)?.name ||
                      "User"}
                  </p>
                ) : (
                  <select
                    value={formData.role_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        role_id: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name === "admin" ? "Admin" : "User"}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trạng thái
                </label>
                {viewMode ? (
                  <span
                    className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                      formData.status === "active"
                        ? "bg-green-100 text-green-700"
                        : formData.status === "banned"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {formData.status === "active"
                      ? "Active"
                      : formData.status === "banned"
                      ? "Banned"
                      : "Inactive"}
                  </span>
                ) : (
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="banned">Banned</option>
                  </select>
                )}
              </div>

              {/* Is Verified */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Xác thực
                </label>
                {viewMode ? (
                  <span
                    className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                      formData.is_verified
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {formData.is_verified ? "Đã xác thực" : "Chưa xác thực"}
                  </span>
                ) : (
                  <div className="flex items-center h-[50px]">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_verified}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            is_verified: e.target.checked,
                          })
                        }
                        className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Đã xác thực email
                      </span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Personal Info */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Thông tin cá nhân
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Họ và tên
                </label>
                {viewMode ? (
                  <p className="text-gray-900">
                    {formData.full_name || "Chưa cập nhật"}
                  </p>
                ) : (
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData({ ...formData, full_name: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Nhập họ và tên"
                  />
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số điện thoại
                </label>
                {viewMode ? (
                  <p className="text-gray-900">
                    {formData.phone_number || "Chưa cập nhật"}
                  </p>
                ) : (
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      value={formData.phone_number}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          phone_number: e.target.value,
                        })
                      }
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Nhập số điện thoại"
                    />
                  </div>
                )}
              </div>

              {/* Birth Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày sinh
                </label>
                {viewMode ? (
                  <p className="text-gray-900">
                    {formData.birth_date
                      ? formatDate(formData.birth_date)
                      : "Chưa cập nhật"}
                  </p>
                ) : (
                  <div className="relative">
                    <input
                      type="date"
                      value={formData.birth_date}
                      onChange={(e) =>
                        setFormData({ ...formData, birth_date: e.target.value })
                      }
                      className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                  </div>
                )}
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giới tính
                </label>
                {viewMode ? (
                  <p className="text-gray-900">
                    {formData.gender === "male"
                      ? "Nam"
                      : formData.gender === "female"
                      ? "Nữ"
                      : "Khác"}
                  </p>
                ) : (
                  <select
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData({ ...formData, gender: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                )}
              </div>

              {/* Address */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Địa chỉ
                </label>
                {viewMode ? (
                  <p className="text-gray-900">
                    {formData.address || "Chưa cập nhật"}
                  </p>
                ) : (
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Nhập địa chỉ"
                  />
                )}
              </div>

              {/* Bio */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiểu sử
                </label>
                {viewMode ? (
                  <p className="text-gray-900">
                    {formData.bio || "Chưa cập nhật"}
                  </p>
                ) : (
                  <textarea
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Nhập tiểu sử..."
                  />
                )}
              </div>
            </div>
          </div>

          {/* View mode metadata */}
          {viewMode && user && (
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Thông tin khác
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Số đơn hàng</p>
                  <p className="text-gray-900 font-medium">
                    {user.booking_count || 0}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Số đánh giá</p>
                  <p className="text-gray-900 font-medium">
                    {user.review_count || 0}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Ngày tạo</p>
                  <p className="text-gray-900 font-medium">
                    {formatDate(user.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Cập nhật lần cuối</p>
                  <p className="text-gray-900 font-medium">
                    {formatDate(user.updated_at)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions for non-view mode */}
          {!viewMode && (
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Lưu người dùng
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default UserForm;
