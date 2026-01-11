import React, { useState, useEffect } from "react";
import {
  MapPin,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Loader2,
  Star,
  Calendar,
  CheckCircle,
  MessageCircle,
  Award,
} from "lucide-react";
import toast from "react-hot-toast";
import ConfirmDialog from "../../common/ConfirmDialog";
import DestinationForm from "./DestinationForm";
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

const AdminDestinations = () => {
  const [loading, setLoading] = useState(false);

  // Destinations state
  const [destinations, setDestinations] = useState([]);
  const [stats, setStats] = useState({
    totalDestinations: 0,
    activeDestinations: 0,
    totalReviews: 0,
    totalRatings: 0,
  });
  const [filters, setFilters] = useState({
    search: "",
    region: "all",
    type: "all",
    status: "all",
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
  const [currentDestination, setCurrentDestination] = useState(null);
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
        `${API_URL}/destinations/admin/stats`,
        getFetchOptions()
      );
      if (!response.ok) throw new Error("Failed to fetch stats");

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  // Fetch destinations
  const fetchDestinations = async () => {
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
        `${API_URL}/destinations/admin/destinations?${params}`,
        getFetchOptions()
      );
      if (!response.ok) throw new Error("Failed to fetch destinations");

      const data = await response.json();
      setDestinations(data.destinations || []);

      // Ensure pagination is set correctly
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Error fetching destinations:", error);
      toast.error("Không thể tải danh sách điểm đến");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchDestinations();
  }, [filters]);

  // Destination handlers
  const handleAddDestination = () => {
    setCurrentDestination(null);
    setFormMode("add");
    setShowForm(true);
  };

  const handleViewDestination = (destination) => {
    setCurrentDestination(destination);
    setFormMode("view");
    setShowForm(true);
  };

  const handleEditDestination = (destination) => {
    setCurrentDestination(destination);
    setFormMode("edit");
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setCurrentDestination(null);
    setFormMode("add");
  };

  const handleDeleteDestination = (destinationId) => {
    const destination = destinations.find((d) => d.id === destinationId);
    if (!destination) return;

    setConfirmDialog({
      isOpen: true,
      title: "Xác nhận xóa điểm đến",
      message: `Bạn có chắc chắn muốn xóa điểm đến "${destination.name}"?\n\n⚠️ Lưu ý: Tất cả đánh giá liên quan sẽ bị xóa theo.`,
      type: "danger",
      confirmText: "Xóa",
      cancelText: "Hủy",
      onConfirm: async () => {
        try {
          const response = await fetch(
            `${API_URL}/destinations/admin/destinations/${destinationId}`,
            getFetchOptions({
              method: "DELETE",
            })
          );

          if (!response.ok) {
            const data = await response.json();
            if (data.hasTours) {
              setConfirmDialog({
                isOpen: true,
                title: "Không thể xóa điểm đến",
                message: `❌ Điểm đến có ${data.toursCount} tours đang hoạt động.\n\nBạn có muốn chuyển điểm đến sang trạng thái INACTIVE?`,
                type: "warning",
                confirmText: "Đặt Inactive",
                cancelText: "Hủy",
                onConfirm: async () => {
                  await handleSetInactive(destinationId);
                  setConfirmDialog({ ...confirmDialog, isOpen: false });
                },
              });
              return;
            }
            throw new Error(data.error || "Failed to delete destination");
          }

          await fetchDestinations();
          await fetchStats();
          toast.success("Đã xóa điểm đến thành công!");
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        } catch (error) {
          console.error("Error deleting destination:", error);
          toast.error(error.message || "Có lỗi xảy ra khi xóa điểm đến!");
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }
      },
    });
  };

  const handleSetInactive = async (destinationId) => {
    try {
      const response = await fetch(
        `${API_URL}/destinations/admin/destinations/${destinationId}`,
        getFetchOptions({
          method: "PUT",
          body: JSON.stringify({ status: "inactive" }),
        })
      );

      if (!response.ok) throw new Error("Failed to set inactive");

      await fetchDestinations();
      await fetchStats();
      toast.success("Đã chuyển điểm đến sang trạng thái Inactive");
    } catch (error) {
      toast.error("Có lỗi khi cập nhật trạng thái");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  // Render full-page form
  if (showForm) {
    return (
      <DestinationForm
        destination={currentDestination}
        onClose={handleCloseForm}
        onSave={() => {
          fetchDestinations();
          fetchStats();
          handleCloseForm();
        }}
        viewMode={formMode === "view"}
        editMode={formMode === "edit"}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 -mx-8 -mt-8 px-8 py-12 mb-8">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Quản lý Điểm đến
                </h1>
                <p className="text-white/80 mt-1">
                  Quản lý điểm đến du lịch trong hệ thống
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleAddDestination}
                className="flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-xl font-medium hover:bg-indigo-50 transition-all shadow-lg hover:shadow-xl"
              >
                <Plus className="w-5 h-5" />
                Thêm điểm đến
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Tổng điểm đến</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {stats.totalDestinations}
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Đang hoạt động</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {stats.activeDestinations}
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Tổng reviews</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {stats.totalReviews}
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Tổng ratings</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {stats.totalRatings}
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <Award className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div className="max-w-screen-xl mx-auto bg-white rounded-2xl shadow-sm p-6">
        {/* Filters */}
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm điểm đến..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value, page: 1 })
                }
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Region Filter */}
            <select
              value={filters.region}
              onChange={(e) =>
                setFilters({ ...filters, region: e.target.value, page: 1 })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">Tất cả miền</option>
              <option value="north">Miền Bắc</option>
              <option value="central">Miền Trung</option>
              <option value="south">Miền Nam</option>
            </select>

            {/* Type Filter */}
            <select
              value={filters.type}
              onChange={(e) =>
                setFilters({ ...filters, type: e.target.value, page: 1 })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">Tất cả loại</option>
              <option value="nature">Thiên nhiên</option>
              <option value="culture">Văn hóa</option>
              <option value="beach">Biển</option>
              <option value="mountain">Núi</option>
              <option value="city">Thành phố</option>
            </select>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value, page: 1 })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Tạm dừng</option>
              <option value="draft">Nháp</option>
            </select>

            {/* Sort */}
            <select
              value={filters.sort_by}
              onChange={(e) =>
                setFilters({ ...filters, sort_by: e.target.value })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="created_desc">Mới nhất</option>
              <option value="created_asc">Cũ nhất</option>
              <option value="name_asc">Tên A-Z</option>
              <option value="name_desc">Tên Z-A</option>
              <option value="rating_desc">Rating cao nhất</option>
              <option value="rating_asc">Rating thấp nhất</option>
            </select>
          </div>
        </div>

        {/* Destinations List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : destinations.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Không tìm thấy điểm đến nào</p>
          </div>
        ) : (
          <div className="space-y-4">
            {destinations.map((destination) => (
              <div
                key={destination.id}
                className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex gap-4">
                  {/* Destination Image */}
                  <div className="w-32 h-32 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                    {destination.image ? (
                      <img
                        src={
                          destination.image.startsWith("http")
                            ? destination.image
                            : `${API_URL}${destination.image}`
                        }
                        alt={destination.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <MapPin className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Destination Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {destination.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <MapPin className="w-4 h-4" />
                          {destination.location}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {destination.status === "active" ? (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                            Đang hoạt động
                          </span>
                        ) : destination.status === "inactive" ? (
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                            Tạm dừng
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                            Nháp
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-5 gap-4 mb-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span>
                          {destination.avg_rating?.toFixed(1) || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Award className="w-4 h-4 text-gray-400" />
                        <span>{destination.rating_count || 0} ratings</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MessageCircle className="w-4 h-4 text-gray-400" />
                        <span>{destination.review_count || 0} reviews</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>
                          {destination.region === "north"
                            ? "Bắc"
                            : destination.region === "central"
                            ? "Trung"
                            : "Nam"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{formatDate(destination.created_at)}</span>
                      </div>
                    </div>

                    {/* Description preview */}
                    {destination.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {destination.description}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewDestination(destination)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Xem
                      </button>
                      <button
                        onClick={() => handleEditDestination(destination)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDeleteDestination(destination.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && destinations.length > 0 && pagination.total > 0 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t">
            <p className="text-sm text-gray-600">
              Hiển thị {(pagination.page - 1) * pagination.limit + 1} -{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              trong tổng số {pagination.total} điểm đến
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

export default AdminDestinations;
