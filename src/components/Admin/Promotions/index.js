import React, { useState, useEffect } from "react";
import {
  Tag,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Loader2,
  Calendar,
  Percent,
  TrendingUp,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import ConfirmDialog from "../../common/ConfirmDialog";
import PromotionForm from "./PromotionForm";
import { API_URL, API_HOST } from "../../../config/api";

// Helper function to get fetch options with credentials
const getFetchOptions = (options = {}) => ({
  ...options,
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
    ...options.headers,
  },
});

const AdminPromotions = () => {
  const [loading, setLoading] = useState(false);

  // Promotions state
  const [promotions, setPromotions] = useState([]);
  const [stats, setStats] = useState({
    totalPromotions: 0,
    activePromotions: 0,
    totalServices: 0,
    totalUsage: 0,
  });
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    type: "all",
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
  const [currentPromotion, setCurrentPromotion] = useState(null);
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
      const response = await fetch(
        `${API_URL}/promotions/admin/stats`,
        getFetchOptions()
      );
      if (!response.ok) throw new Error("Failed to fetch stats");

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  // Fetch promotions
  const fetchPromotions = async () => {
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
        `${API_URL}/promotions/admin/promotions?${params}`
      );
      if (!response.ok) throw new Error("Failed to fetch promotions");

      const data = await response.json();
      setPromotions(data.promotions || []);

      // Ensure pagination is set correctly
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Error fetching promotions:", error);
      toast.error("Không thể tải danh sách khuyến mãi");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchStats();
  }, []);

  // Fetch promotions when filters change
  useEffect(() => {
    fetchPromotions();
  }, [filters]);

  // Handle Add
  const handleAdd = () => {
    setCurrentPromotion(null);
    setFormMode("add");
    setShowForm(true);
  };

  // Handle View
  const handleView = (promotion) => {
    setCurrentPromotion(promotion);
    setFormMode("view");
    setShowForm(true);
  };

  // Handle Edit
  const handleEdit = (promotion) => {
    setCurrentPromotion(promotion);
    setFormMode("edit");
    setShowForm(true);
  };

  // Handle Delete
  const handleDelete = (promotionId) => {
    const promotion = promotions.find((p) => p.id === promotionId);
    if (!promotion) return;

    // Check if promotion has been used
    if (promotion.used_count > 0) {
      toast.error(
        `Không thể xóa khuyến mãi đã được sử dụng ${promotion.used_count} lần!`
      );
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: "Xác nhận xóa khuyến mãi",
      message: `Bạn có chắc chắn muốn xóa khuyến mãi "${promotion.title}"?\n\n⚠️ Lưu ý: Tất cả liên kết với dịch vụ sẽ bị xóa theo.`,
      type: "danger",
      confirmText: "Xóa",
      cancelText: "Hủy",
      onConfirm: async () => {
        try {
          const response = await fetch(
            `${API_URL}/promotions/${promotionId}`,
            getFetchOptions({
              method: "DELETE",
            })
          );

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Failed to delete promotion");
          }

          await fetchPromotions();
          await fetchStats();
          toast.success("Đã xóa khuyến mãi thành công!");
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        } catch (error) {
          console.error("Error deleting promotion:", error);
          toast.error(error.message || "Có lỗi xảy ra khi xóa khuyến mãi!");
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }
      },
    });
  };

  // Handle Form Close
  const handleFormClose = () => {
    setShowForm(false);
    setCurrentPromotion(null);
  };

  // Handle Form Save
  const handleFormSave = async () => {
    setShowForm(false);
    setCurrentPromotion(null);
    await fetchPromotions();
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

  // Format discount
  const formatDiscount = (discount, type) => {
    return type === "percentage"
      ? `${discount}%`
      : `${discount.toLocaleString()}đ`;
  };

  // Get status badge
  const getStatusBadge = (promotion) => {
    if (promotion.is_expired) {
      return (
        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
          Hết hạn
        </span>
      );
    }
    if (promotion.status === "inactive") {
      return (
        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
          Inactive
        </span>
      );
    }
    if (promotion.is_expiring_soon) {
      return (
        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
          Sắp hết hạn
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
        Active
      </span>
    );
  };

  // If form is shown, render form
  if (showForm) {
    return (
      <PromotionForm
        promotion={currentPromotion}
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
      <div className="bg-gradient-to-r from-orange-600 to-red-600 -mx-8 -mt-8 px-8 py-12 mb-8">
        <div className="max-w-screen-xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                <Tag className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Quản lý Khuyến mãi
                </h1>
                <p className="text-orange-100 mt-1">
                  Quản lý tất cả khuyến mãi và ưu đãi
                </p>
              </div>
            </div>
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 bg-white text-orange-600 px-6 py-3 rounded-xl font-medium hover:bg-orange-50 transition-colors shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Thêm khuyến mãi
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm mb-1">
                    Tổng khuyến mãi
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {stats.totalPromotions}
                  </p>
                </div>
                <div className="bg-white/10 p-3 rounded-lg">
                  <Tag className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm mb-1">Đang hoạt động</p>
                  <p className="text-3xl font-bold text-white">
                    {stats.activePromotions}
                  </p>
                </div>
                <div className="bg-white/10 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm mb-1">
                    Dịch vụ áp dụng
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {stats.totalServices}
                  </p>
                </div>
                <div className="bg-white/10 p-3 rounded-lg">
                  <Percent className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm mb-1">Lượt sử dụng</p>
                  <p className="text-3xl font-bold text-white">
                    {stats.totalUsage}
                  </p>
                </div>
                <div className="bg-white/10 p-3 rounded-lg">
                  <Users className="w-6 h-6 text-white" />
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
              placeholder="Tìm kiếm theo tiêu đề hoặc mô tả..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value, page: 1 })
              }
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* Type Filter */}
            <select
              value={filters.type}
              onChange={(e) =>
                setFilters({ ...filters, type: e.target.value, page: 1 })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">Tất cả loại</option>
              <option value="percentage">Phần trăm (%)</option>
              <option value="fixed">Số tiền cố định (đ)</option>
            </select>

            {/* Sort */}
            <select
              value={filters.sort_by}
              onChange={(e) =>
                setFilters({ ...filters, sort_by: e.target.value, page: 1 })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="created_desc">Mới nhất</option>
              <option value="created_asc">Cũ nhất</option>
              <option value="title_asc">Tên A-Z</option>
              <option value="title_desc">Tên Z-A</option>
              <option value="discount_desc">Giảm giá cao nhất</option>
              <option value="discount_asc">Giảm giá thấp nhất</option>
              <option value="end_date_asc">Sắp hết hạn</option>
              <option value="end_date_desc">Còn hạn lâu nhất</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!loading && promotions.length === 0 && (
          <div className="text-center py-12">
            <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Không tìm thấy khuyến mãi nào
            </h3>
            <p className="text-gray-500 mb-6">
              Hãy thêm khuyến mãi mới hoặc thay đổi bộ lọc
            </p>
            <button
              onClick={handleAdd}
              className="inline-flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-orange-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Thêm khuyến mãi
            </button>
          </div>
        )}

        {/* Promotions Grid */}
        {!loading && promotions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {promotions.map((promotion) => (
              <div
                key={promotion.id}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 text-white">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg line-clamp-1">
                        {promotion.title}
                      </h3>
                    </div>
                    {getStatusBadge(promotion)}
                  </div>
                  <div className="text-3xl font-bold">
                    {formatDiscount(promotion.discount, promotion.type)}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {promotion.description}
                  </p>

                  {/* Info */}
                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {formatDate(promotion.start_date)} -{" "}
                        {formatDate(promotion.end_date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>
                        Đã dùng: {promotion.used_count || 0}
                        {promotion.usage_limit
                          ? ` / ${promotion.usage_limit}`
                          : ""}
                      </span>
                    </div>
                    {promotion.service_count > 0 && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Tag className="w-4 h-4" />
                        <span>{promotion.service_count} dịch vụ</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleView(promotion)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Xem
                    </button>
                    <button
                      onClick={() => handleEdit(promotion)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(promotion.id)}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      disabled={promotion.used_count > 0}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && promotions.length > 0 && pagination.total > 0 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t">
            <p className="text-sm text-gray-600">
              Hiển thị {(pagination.page - 1) * pagination.limit + 1} -{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              trong tổng số {pagination.total} khuyến mãi
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
                <span className="px-4 py-2 bg-orange-50 text-orange-600 rounded-lg font-medium">
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

export default AdminPromotions;
