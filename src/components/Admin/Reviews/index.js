import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Search,
  Eye,
  Ban,
  CheckCircle,
  Trash2,
  Loader2,
  Star,
  TrendingUp,
  Shield,
} from "lucide-react";
import toast from "react-hot-toast";
import ConfirmDialog from "../../common/ConfirmDialog";
import ReviewForm from "./ReviewForm";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const AdminReviews = () => {
  const [loading, setLoading] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    totalReviews: 0,
    activeReviews: 0,
    bannedReviews: 0,
    avgRating: 0,
  });
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    service_type: "all",
    min_rating: "",
    max_rating: "",
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
  const [currentReview, setCurrentReview] = useState(null);

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "danger",
    confirmText: "Xác nhận",
    cancelText: "Hủy",
    onConfirm: () => {},
    showInput: false,
    inputPlaceholder: "",
    inputLabel: "",
  });

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/reviews/admin/stats`);
      if (!response.ok) throw new Error("Failed to fetch stats");

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  // Fetch reviews
  const fetchReviews = async () => {
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
        `${API_URL}/api/reviews/admin/reviews?${params}`
      );
      if (!response.ok) throw new Error("Failed to fetch reviews");

      const data = await response.json();
      setReviews(data.reviews || []);

      // Ensure pagination is set correctly
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast.error("Không thể tải danh sách đánh giá");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchStats();
  }, []);

  // Fetch reviews when filters change
  useEffect(() => {
    fetchReviews();
  }, [filters]);

  // Handle View
  const handleView = (review) => {
    setCurrentReview(review);
    setShowForm(true);
  };

  // Handle Ban
  const handleBan = (reviewId) => {
    const review = reviews.find((r) => r.id === reviewId);
    if (!review) return;

    setConfirmDialog({
      isOpen: true,
      title: "Khóa đánh giá",
      message:
        "Bạn có chắc chắn muốn khóa đánh giá này?\n\nĐánh giá sẽ không hiển thị với người dùng.",
      type: "warning",
      confirmText: "Khóa",
      cancelText: "Hủy",
      onConfirm: async () => {
        try {
          const response = await fetch(
            `${API_URL}/api/reviews/admin/reviews/${reviewId}/status`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ status: "banned" }),
            }
          );

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Failed to ban review");
          }

          await fetchReviews();
          await fetchStats();
          toast.success("Đã khóa đánh giá thành công!");
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        } catch (error) {
          console.error("Error banning review:", error);
          toast.error(error.message || "Có lỗi xảy ra khi khóa đánh giá!");
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }
      },
    });
  };

  // Handle Unban
  const handleUnban = (reviewId) => {
    const review = reviews.find((r) => r.id === reviewId);
    if (!review) return;

    setConfirmDialog({
      isOpen: true,
      title: "Mở khóa đánh giá",
      message:
        "Bạn có chắc chắn muốn mở khóa đánh giá này?\n\nĐánh giá sẽ hiển thị lại với người dùng.",
      type: "info",
      confirmText: "Mở khóa",
      cancelText: "Hủy",
      onConfirm: async () => {
        try {
          const response = await fetch(
            `${API_URL}/api/reviews/admin/reviews/${reviewId}/status`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ status: "active" }),
            }
          );

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Failed to unban review");
          }

          await fetchReviews();
          await fetchStats();
          toast.success("Đã mở khóa đánh giá thành công!");
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        } catch (error) {
          console.error("Error unbanning review:", error);
          toast.error(error.message || "Có lỗi xảy ra khi mở khóa đánh giá!");
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }
      },
    });
  };

  // Handle Delete
  const handleDelete = (reviewId) => {
    const review = reviews.find((r) => r.id === reviewId);
    if (!review) return;

    setConfirmDialog({
      isOpen: true,
      title: "Xác nhận xóa đánh giá",
      message: `Bạn có chắc chắn muốn xóa đánh giá của "${review.username}"?\n\n⚠️ Lưu ý: Hành động này không thể hoàn tác.`,
      type: "danger",
      confirmText: "Xóa",
      cancelText: "Hủy",
      onConfirm: async () => {
        try {
          const response = await fetch(
            `${API_URL}/api/reviews/admin/reviews/${reviewId}`,
            {
              method: "DELETE",
            }
          );

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Failed to delete review");
          }

          await fetchReviews();
          await fetchStats();
          toast.success("Đã xóa đánh giá thành công!");
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        } catch (error) {
          console.error("Error deleting review:", error);
          toast.error(error.message || "Có lỗi xảy ra khi xóa đánh giá!");
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }
      },
    });
  };

  // Handle Form Close
  const handleFormClose = () => {
    setShowForm(false);
    setCurrentReview(null);
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

  // Get service type label
  const getServiceTypeLabel = (review) => {
    if (review.tour_id) return "Tour";
    if (review.hotel_id) return "Khách sạn";
    if (review.flight_id) return "Chuyến bay";
    if (review.transport_id) return "Vận chuyển";
    if (review.destination_id) return "Điểm đến";
    if (review.blog_id) return "Bài viết";
    return "Không xác định";
  };

  // Get status badge
  const getStatusBadge = (status) => {
    return status === "active" ? (
      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
        Active
      </span>
    ) : (
      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
        Banned
      </span>
    );
  };

  // If form is shown, render form
  if (showForm) {
    return (
      <ReviewForm
        review={currentReview}
        onClose={handleFormClose}
        onStatusChange={async () => {
          await fetchReviews();
          await fetchStats();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with gradient */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 -mx-8 -mt-8 px-8 py-12 mb-8">
        <div className="max-w-screen-xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Quản lý Đánh giá
                </h1>
                <p className="text-purple-100 mt-1">
                  Quản lý tất cả đánh giá và phản hồi
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm mb-1">Tổng đánh giá</p>
                  <p className="text-3xl font-bold text-white">
                    {stats.totalReviews}
                  </p>
                </div>
                <div className="bg-white/10 p-3 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm mb-1">Đang hiển thị</p>
                  <p className="text-3xl font-bold text-white">
                    {stats.activeReviews}
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
                  <p className="text-purple-100 text-sm mb-1">Đã khóa</p>
                  <p className="text-3xl font-bold text-white">
                    {stats.bannedReviews}
                  </p>
                </div>
                <div className="bg-white/10 p-3 rounded-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm mb-1">Đánh giá TB</p>
                  <p className="text-3xl font-bold text-white">
                    {(stats.avgRating || 0).toFixed(1)}{" "}
                    <Star className="w-5 h-5 inline text-yellow-300" />
                  </p>
                </div>
                <div className="bg-white/10 p-3 rounded-lg">
                  <Star className="w-6 h-6 text-white" />
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
              placeholder="Tìm kiếm theo nội dung hoặc tên người dùng..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value, page: 1 })
              }
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Active</option>
              <option value="banned">Banned</option>
            </select>

            {/* Service Type Filter */}
            <select
              value={filters.service_type}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  service_type: e.target.value,
                  page: 1,
                })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">Tất cả dịch vụ</option>
              <option value="tour">Tour</option>
              <option value="hotel">Khách sạn</option>
              <option value="flight">Chuyến bay</option>
              <option value="transport">Vận chuyển</option>
              <option value="destination">Điểm đến</option>
              <option value="blog">Bài viết</option>
            </select>

            {/* Rating Range */}
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="5"
                step="0.5"
                placeholder="Rating từ"
                value={filters.min_rating}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    min_rating: e.target.value,
                    page: 1,
                  })
                }
                className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <span>-</span>
              <input
                type="number"
                min="0"
                max="5"
                step="0.5"
                placeholder="Rating đến"
                value={filters.max_rating}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    max_rating: e.target.value,
                    page: 1,
                  })
                }
                className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Sort */}
            <select
              value={filters.sort_by}
              onChange={(e) =>
                setFilters({ ...filters, sort_by: e.target.value, page: 1 })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="created_desc">Mới nhất</option>
              <option value="created_asc">Cũ nhất</option>
              <option value="rating_desc">Rating cao nhất</option>
              <option value="rating_asc">Rating thấp nhất</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!loading && reviews.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Không tìm thấy đánh giá nào
            </h3>
            <p className="text-gray-500 mb-6">
              Hãy thay đổi bộ lọc để xem kết quả khác
            </p>
          </div>
        )}

        {/* Reviews List */}
        {!loading && reviews.length > 0 && (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  {/* User Info & Rating */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-purple-100 text-purple-700 w-10 h-10 rounded-full flex items-center justify-center font-semibold">
                        {review.username?.[0]?.toUpperCase() || "U"}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {review.username || "Người dùng"}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>{getServiceTypeLabel(review)}</span>
                          <span>•</span>
                          <span>{formatDate(review.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < (review.rating || 0)
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-sm font-medium text-gray-700">
                        {(review.rating || 0).toFixed(1)}
                      </span>
                    </div>

                    {/* Comment */}
                    <p className="text-gray-700 mb-3">{review.comment}</p>

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {review.likes_count > 0 && (
                        <span>{review.likes_count} lượt thích</span>
                      )}
                      {getStatusBadge(review.status)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleView(review)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Xem chi tiết"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    {review.status === "active" ? (
                      <button
                        onClick={() => handleBan(review.id)}
                        className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                        title="Khóa đánh giá"
                      >
                        <Ban className="w-5 h-5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUnban(review.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Mở khóa đánh giá"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(review.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Xóa đánh giá"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && reviews.length > 0 && pagination.total > 0 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t">
            <p className="text-sm text-gray-600">
              Hiển thị {(pagination.page - 1) * pagination.limit + 1} -{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              trong tổng số {pagination.total} đánh giá
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
                <span className="px-4 py-2 bg-purple-50 text-purple-600 rounded-lg font-medium">
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
        showInput={confirmDialog.showInput}
        inputPlaceholder={confirmDialog.inputPlaceholder}
        inputLabel={confirmDialog.inputLabel}
      />
    </div>
  );
};

export default AdminReviews;
