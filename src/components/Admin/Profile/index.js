import React, { useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  Shield,
  Edit2,
  CheckCircle,
  XCircle,
  Activity,
  Key,
  UserCheck,
} from "lucide-react";

const AdminProfile = () => {
  const { user, login } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedUser = {
      ...user,
      ...formData,
    };
    login(updatedUser);
    setIsEditing(false);
  };

  if (!user) {
    return null;
  }

  return (
    <div>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 -mx-8 -mt-8 px-8 py-12 mb-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-4">
            Thông tin cá nhân
          </h1>
          <p className="text-emerald-50 text-lg">
            Quản lý thông tin và theo dõi hoạt động của bạn
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
              <div className="p-6 text-center">
                <div className="relative inline-block">
                  <img
                    className="h-24 w-24 rounded-full border-4 border-white shadow-md mx-auto"
                    src={user.avatar}
                    alt={user.fullName}
                  />
                  <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></span>
                </div>
                <h3 className="mt-4 text-xl font-bold text-gray-900">
                  {user.fullName}
                </h3>
                <p className="text-emerald-600 font-medium">Quản trị viên</p>
                <div className="mt-6 flex justify-center space-x-2">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isEditing
                        ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    }`}
                  >
                    {isEditing ? (
                      <>
                        <XCircle className="w-4 h-4 mr-2" />
                        Hủy chỉnh sửa
                      </>
                    ) : (
                      <>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Chỉnh sửa
                      </>
                    )}
                  </button>
                </div>
              </div>
              <div className="border-t border-gray-100 px-6 py-4">
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <Calendar className="w-4 h-4 text-gray-400 mr-3" />
                    <span className="text-gray-600">Tham gia: </span>
                    <span className="ml-auto text-gray-900">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Clock className="w-4 h-4 text-gray-400 mr-3" />
                    <span className="text-gray-600">Hoạt động: </span>
                    <span className="ml-auto text-gray-900">Hôm nay</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Personal Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h4 className="text-lg font-semibold text-gray-900">
                  Thông tin cá nhân
                </h4>
              </div>
              <div className="p-6">
                {isEditing ? (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Họ và tên
                      </label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) =>
                          setFormData({ ...formData, fullName: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Số điện thoại
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                      />
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button
                        type="submit"
                        className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Lưu thay đổi
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center">
                      <User className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Họ và tên</p>
                        <p className="text-gray-900">{user.fullName}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Mail className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="text-gray-900">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Phone className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Số điện thoại</p>
                        <p className="text-gray-900">{user.phone}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Activity Stats */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h4 className="text-lg font-semibold text-gray-900">
                  Thống kê hoạt động
                </h4>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center">
                      <Activity className="w-8 h-8 text-emerald-600" />
                      <div className="ml-4">
                        <p className="text-sm text-gray-500">
                          Tổng số hoạt động
                        </p>
                        <p className="text-2xl font-semibold text-gray-900">
                          247
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center">
                      <Key className="w-8 h-8 text-emerald-600" />
                      <div className="ml-4">
                        <p className="text-sm text-gray-500">
                          Đăng nhập gần đây
                        </p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {user.lastLogin
                            ? new Date(user.lastLogin).toLocaleDateString()
                            : "Chưa có"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center">
                      <UserCheck className="w-8 h-8 text-emerald-600" />
                      <div className="ml-4">
                        <p className="text-sm text-gray-500">Trạng thái</p>
                        <p className="text-2xl font-semibold text-emerald-600">
                          Đang hoạt động
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center">
                      <Shield className="w-8 h-8 text-emerald-600" />
                      <div className="ml-4">
                        <p className="text-sm text-gray-500">Vai trò</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          Quản trị viên
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
