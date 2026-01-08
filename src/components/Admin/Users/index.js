import React, { useState, useEffect } from "react";
import {
  Users as UsersIcon,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Loader2,
  Shield,
  UserCheck,
  Ban,
  BookOpen,
} from "lucide-react";
import toast from "react-hot-toast";
import ConfirmDialog from "../../common/ConfirmDialog";
import UserForm from "./UserForm";
import { API_URL, API_HOST } from "../../../config/api";


const AdminUsers = () => {
  const [loading, setLoading] = useState(false);

  // Users state
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    bannedUsers: 0,
    totalBookings: 0,
  });
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    role: "all",
    page: 1,
    limit: 10,
    sort_by: "created_desc",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 0,
  });

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formMode, setFormMode] = useState("add"); // 'add' | 'edit' | 'view'

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "danger",
    confirmText: "Xác nhận",
    cancelText: "Hủy",
    onConfirm: () => {},
  });

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/users/admin/stats`);
      if (!response.ok) throw new Error("Failed to fetch stats");

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      // Only add params if they have meaningful values
      Object.keys(filters).forEach((key) => {
        const value = filters[key];

        // Skip empty, null, undefined, "all"
        if (
          value === "" ||
          value === null ||
          value === undefined ||
          value === "all"
        ) {
          return;
        }

        params.append(key, value);
      });

      const response = await fetch(
        `${API_URL}/users/admin/users?${params}`
      );
      if (!response.ok) throw new Error("Failed to fetch users");

      const data = await response.json();
      setUsers(data.users || []);

      // Ensure pagination is set correctly
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchStats();
  }, []);

  // Fetch users when filters change
  useEffect(() => {
    fetchUsers();
  }, [filters]);

  // Handle Add
  const handleAdd = () => {
    setCurrentUser(null);
    setFormMode("add");
    setShowForm(true);
  };

  // Handle View
  const handleView = (user) => {
    setCurrentUser(user);
    setFormMode("view");
    setShowForm(true);
  };

  // Handle Edit
  const handleEdit = (user) => {
    setCurrentUser(user);
    setFormMode("edit");
    setShowForm(true);
  };

  // Handle Delete
  const handleDelete = (userId) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    setConfirmDialog({
      isOpen: true,
      title: "Xác nhận xóa người dùng",
      message: `Bạn có chắc chắn muốn xóa người dùng "${user.username}"?\n\n⚠️ Lưu ý: Hành động này không thể hoàn tác.`,
      type: "danger",
      confirmText: "Xóa",
      cancelText: "Hủy",
      onConfirm: async () => {
        try {
          const response = await fetch(
            `${API_URL}/users/admin/users/${userId}`,
            {
              method: "DELETE",
            }
          );

          if (!response.ok) {
            const data = await response.json();

            if (data.hasBookings) {
              // Show secondary dialog for "Ban" option
              setConfirmDialog({
                isOpen: true,
                title: "Không thể xóa người dùng",
                message: `❌ Người dùng có ${data.bookingCount} đơn đặt hàng.\n\nBạn có muốn chuyển trạng thái sang BANNED?`,
                type: "warning",
                confirmText: "Đặt Banned",
                cancelText: "Hủy",
                onConfirm: async () => {
                  await handleBan(userId);
                  setConfirmDialog({ ...confirmDialog, isOpen: false });
                },
              });
              return;
            }

            throw new Error(data.error || "Failed to delete user");
          }

          await fetchUsers();
          await fetchStats();
          toast.success("Đã xóa người dùng thành công!");
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        } catch (error) {
          console.error("Error deleting user:", error);
          toast.error(error.message || "Có lỗi xảy ra khi xóa người dùng!");
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }
      },
    });
  };

  // Handle Ban
  const handleBan = async (userId) => {
    try {
      const response = await fetch(
        `${API_URL}/users/admin/users/${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "banned" }),
        }
      );

      if (!response.ok) throw new Error("Failed to ban user");

      await fetchUsers();
      await fetchStats();
      toast.success("Đã chuyển trạng thái sang Banned!");
    } catch (error) {
      console.error("Error banning user:", error);
      toast.error("Có lỗi xảy ra khi cập nhật trạng thái!");
    }
  };

  // Handle Form Close
  const handleFormClose = () => {
    setShowForm(false);
    setCurrentUser(null);
  };

  // Handle Form Save
  const handleFormSave = async () => {
    setShowForm(false);
    setCurrentUser(null);
    await fetchUsers();
    await fetchStats();
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return (
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
            Active
          </span>
        );
      case "inactive":
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
            Inactive
          </span>
        );
      case "banned":
        return (
          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
            Banned
          </span>
        );
      default:
        return null;
    }
  };

  // Get role badge
  const getRoleBadge = (role) => {
    return role === "admin" ? (
      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded flex items-center gap-1">
        <Shield className="w-3 h-3" />
        Admin
      </span>
    ) : (
      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded flex items-center gap-1">
        <UsersIcon className="w-3 h-3" />
        User
      </span>
    );
  };

  // If form is shown, render form
  if (showForm) {
    return (
      <UserForm
        user={currentUser}
        onClose={handleFormClose}
        onSave={handleFormSave}
        viewMode={formMode === "view"}
        editMode={formMode === "edit"}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with gradient */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 -mx-8 -mt-8 px-8 py-12 mb-8">
        <div className="max-w-screen-xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                <UsersIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Quản lý Người dùng
                </h1>
                <p className="text-indigo-100 mt-1">
                  Quản lý tất cả người dùng và quyền hạn
                </p>
              </div>
            </div>
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 bg-white text-indigo-600 px-6 py-3 rounded-xl font-medium hover:bg-indigo-50 transition-colors shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Thêm người dùng
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-sm mb-1">
                    Tổng người dùng
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {stats.totalUsers}
                  </p>
                </div>
                <div className="bg-white/10 p-3 rounded-lg">
                  <UsersIcon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-sm mb-1">Đang hoạt động</p>
                  <p className="text-3xl font-bold text-white">
                    {stats.activeUsers}
                  </p>
                </div>
                <div className="bg-white/10 p-3 rounded-lg">
                  <UserCheck className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-sm mb-1">Đã khóa</p>
                  <p className="text-3xl font-bold text-white">
                    {stats.bannedUsers}
                  </p>
                </div>
                <div className="bg-white/10 p-3 rounded-lg">
                  <Ban className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-sm mb-1">Tổng đơn hàng</p>
                  <p className="text-3xl font-bold text-white">
                    {stats.totalBookings}
                  </p>
                </div>
                <div className="bg-white/10 p-3 rounded-lg">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        {/* Filters */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email, số điện thoại..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value, page: 1 })
              }
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap gap-4">
            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value, page: 1 })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="banned">Banned</option>
            </select>

            {/* Role Filter */}
            <select
              value={filters.role}
              onChange={(e) =>
                setFilters({ ...filters, role: e.target.value, page: 1 })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>

            {/* Sort */}
            <select
              value={filters.sort_by}
              onChange={(e) =>
                setFilters({ ...filters, sort_by: e.target.value, page: 1 })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="created_desc">Mới nhất</option>
              <option value="created_asc">Cũ nhất</option>
              <option value="username_asc">Tên A-Z</option>
              <option value="username_desc">Tên Z-A</option>
              <option value="email_asc">Email A-Z</option>
              <option value="email_desc">Email Z-A</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!loading && users.length === 0 && (
          <div className="text-center py-12">
            <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Không tìm thấy người dùng nào
            </h3>
            <p className="text-gray-500 mb-6">
              Hãy thêm người dùng mới hoặc thay đổi bộ lọc
            </p>
            <button
              onClick={handleAdd}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Thêm người dùng
            </button>
          </div>
        )}

        {/* Users Table */}
        {!loading && users.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Người dùng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vai trò
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Đơn hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Đánh giá
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold">
                            {user.username?.[0]?.toUpperCase() || "U"}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.username}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.booking_count || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.review_count || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleView(user)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Xóa"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && users.length > 0 && pagination.total > 0 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t">
            <p className="text-sm text-gray-600">
              Hiển thị {(pagination.page - 1) * pagination.limit + 1} -{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              trong tổng số {pagination.total} người dùng
            </p>
            {pagination.total_pages > 1 && (
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setFilters({ ...filters, page: filters.page - 1 })
                  }
                  disabled={filters.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Trước
                </button>
                <span className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg font-medium">
                  {pagination.page} / {pagination.total_pages}
                </span>
                <button
                  onClick={() =>
                    setFilters({ ...filters, page: filters.page + 1 })
                  }
                  disabled={filters.page === pagination.total_pages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Sau
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ConfirmDialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
      />
    </div>
  );
};

export default AdminUsers;
