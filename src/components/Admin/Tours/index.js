import React, { useState, useEffect } from "react";
import {
  Compass,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Loader2,
  MapPin,
  Star,
  Calendar,
  CheckCircle,
  Users,
  Clock,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";
import ConfirmDialog from "../../common/ConfirmDialog";
import TourForm from "./TourForm";
import ScheduleForm from "./ScheduleForm";
import { API_URL, API_HOST } from "../../../config/api";

const AdminTours = () => {
  const [activeTab, setActiveTab] = useState("tours"); // 'tours' | 'schedules'
  const [loading, setLoading] = useState(false);

  // Tours state
  const [tours, setTours] = useState([]);
  const [selectedTour, setSelectedTour] = useState(null);
  const [stats, setStats] = useState({
    totalTours: 0,
    activeTours: 0,
    totalSchedules: 0,
    totalBookings: 0,
  });
  const [tourFilters, setTourFilters] = useState({
    search: "",
    type: "all",
    status: "all",
    difficulty: "all",
    page: 1,
    limit: 10,
    sort_by: "created_desc",
  });
  const [tourPagination, setTourPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 0,
  });

  // Form states
  const [showTourForm, setShowTourForm] = useState(false);
  const [currentTour, setCurrentTour] = useState(null);
  const [tourFormMode, setTourFormMode] = useState("add"); // 'add' | 'edit' | 'view'

  const [showScheduleForm, setShowScheduleForm] = useState(false);

  // Filter options
  const [tourTypes, setTourTypes] = useState([]);

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
      const response = await fetch(`${API_URL}/tours/admin/stats`);
      if (!response.ok) throw new Error("Failed to fetch stats");

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  // Fetch tours
  const fetchTours = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      // Only add params if they have meaningful values
      Object.keys(tourFilters).forEach((key) => {
        const value = tourFilters[key];

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

      const response = await fetch(`${API_URL}/tours/admin/tours?${params}`);
      if (!response.ok) throw new Error("Failed to fetch tours");

      const data = await response.json();
      setTours(data.tours || []);
      setTourPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching tours:", error);
      toast.error("Không thể tải danh sách tours");
    } finally {
      setLoading(false);
    }
  };

  // Fetch tour types
  const fetchTourTypes = async () => {
    try {
      const response = await fetch(`${API_URL}/tours/admin/tour-types`);
      if (!response.ok) throw new Error("Failed to fetch tour types");

      const data = await response.json();
      setTourTypes(data.types || []);
    } catch (error) {
      console.error("Error fetching tour types:", error);
    }
  };

  useEffect(() => {
    fetchTourTypes();
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === "tours") {
      fetchTours();
    }
  }, [tourFilters, activeTab]);

  // Tour handlers
  const handleAddTour = () => {
    setCurrentTour(null);
    setTourFormMode("add");
    setShowTourForm(true);
  };

  const handleViewTour = (tour) => {
    setCurrentTour(tour);
    setTourFormMode("view");
    setShowTourForm(true);
  };

  const handleEditTour = (tour) => {
    setCurrentTour(tour);
    setTourFormMode("edit");
    setShowTourForm(true);
  };

  const handleCloseTourForm = () => {
    setShowTourForm(false);
    setCurrentTour(null);
    setTourFormMode("add");
  };

  const handleDeleteTour = (tourId) => {
    const tour = tours.find((t) => t.id === tourId);
    if (!tour) return;

    setConfirmDialog({
      isOpen: true,
      title: "Xác nhận xóa tour",
      message: `Bạn có chắc chắn muốn xóa tour "${tour.title}"?\n\n⚠️ Lưu ý: Tất cả lịch trình (schedules) liên quan sẽ bị xóa theo.`,
      type: "danger",
      confirmText: "Xóa",
      cancelText: "Hủy",
      onConfirm: async () => {
        try {
          const response = await fetch(
            `${API_URL}/tours/admin/tours/${tourId}`,
            {
              method: "DELETE",
            }
          );

          if (!response.ok) {
            const data = await response.json();
            if (data.hasFutureBookings) {
              setConfirmDialog({
                isOpen: true,
                title: "Không thể xóa tour",
                message: `❌ Tour có ${data.futureBookingsCount} booking đang active.\n\nBạn có muốn chuyển tour sang trạng thái INACTIVE?`,
                type: "warning",
                confirmText: "Đặt Inactive",
                cancelText: "Hủy",
                onConfirm: async () => {
                  await handleSetInactive(tourId);
                  setConfirmDialog({ ...confirmDialog, isOpen: false });
                },
              });
              return;
            }
            throw new Error(data.error || "Failed to delete tour");
          }

          await fetchTours();
          await fetchStats();
          toast.success("Đã xóa tour thành công!");
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        } catch (error) {
          console.error("Error deleting tour:", error);
          toast.error(error.message || "Có lỗi xảy ra khi xóa tour!");
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }
      },
    });
  };

  const handleSetInactive = async (tourId) => {
    try {
      const response = await fetch(`${API_URL}/tours/admin/tours/${tourId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "inactive" }),
      });

      if (!response.ok) throw new Error("Failed to set inactive");

      await fetchTours();
      await fetchStats();
      toast.success("Đã chuyển tour sang trạng thái Inactive");
    } catch (error) {
      toast.error("Có lỗi khi cập nhật trạng thái");
    }
  };

  const handleManageSchedule = (tour) => {
    setSelectedTour(tour);
    setShowScheduleForm(true);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN").format(price) + " đ";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  // Render full-page form
  if (showTourForm) {
    return (
      <TourForm
        tour={currentTour}
        onClose={handleCloseTourForm}
        onSave={() => {
          fetchTours();
          fetchStats();
          handleCloseTourForm();
        }}
        viewMode={tourFormMode === "view"}
        editMode={tourFormMode === "edit"}
      />
    );
  }

  if (showScheduleForm) {
    return (
      <ScheduleForm
        tour={selectedTour}
        onClose={() => {
          setShowScheduleForm(false);
          setSelectedTour(null);
        }}
        onSave={() => {
          fetchStats();
          setShowScheduleForm(false);
          setSelectedTour(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Tabs */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 -mx-8 -mt-8 px-8 py-12 mb-8">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <Compass className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Quản lý Tours</h1>
                <p className="text-white/80 mt-1">
                  Quản lý tours và lịch trình trong hệ thống
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {activeTab === "tours" && (
                <button
                  onClick={handleAddTour}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-green-600 rounded-xl font-medium hover:bg-green-50 transition-all shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-5 h-5" />
                  Thêm tour
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Tổng tours</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {stats.totalTours}
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <Compass className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Đang hoạt động</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {stats.activeTours}
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
                  <p className="text-white/80 text-sm">Lịch trình</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {stats.totalSchedules}
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Tổng bookings</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {stats.totalBookings}
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("tours")}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === "tours"
                  ? "bg-white text-green-600 shadow-lg"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              <Compass className="w-5 h-5" />
              Tours
            </button>
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div className="max-w-screen-xl mx-auto bg-white rounded-2xl shadow-sm p-6">
        {activeTab === "tours" ? (
          <>
            {/* Filters */}
            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm tour..."
                    value={tourFilters.search}
                    onChange={(e) =>
                      setTourFilters({
                        ...tourFilters,
                        search: e.target.value,
                        page: 1,
                      })
                    }
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                {/* Type Filter */}
                <select
                  value={tourFilters.type}
                  onChange={(e) =>
                    setTourFilters({
                      ...tourFilters,
                      type: e.target.value,
                      page: 1,
                    })
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">Tất cả loại</option>
                  {tourTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={tourFilters.status}
                  onChange={(e) =>
                    setTourFilters({
                      ...tourFilters,
                      status: e.target.value,
                      page: 1,
                    })
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="active">Đang hoạt động</option>
                  <option value="inactive">Tạm dừng</option>
                  <option value="draft">Nháp</option>
                </select>

                {/* Difficulty Filter */}
                <select
                  value={tourFilters.difficulty}
                  onChange={(e) =>
                    setTourFilters({
                      ...tourFilters,
                      difficulty: e.target.value,
                      page: 1,
                    })
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">Tất cả độ khó</option>
                  <option value="easy">Dễ</option>
                  <option value="moderate">Trung bình</option>
                  <option value="challenging">Khó</option>
                  <option value="difficult">Rất khó</option>
                </select>

                {/* Sort */}
                <select
                  value={tourFilters.sort_by}
                  onChange={(e) =>
                    setTourFilters({ ...tourFilters, sort_by: e.target.value })
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="created_desc">Mới nhất</option>
                  <option value="created_asc">Cũ nhất</option>
                  <option value="title_asc">Tên A-Z</option>
                  <option value="title_desc">Tên Z-A</option>
                  <option value="price_asc">Giá thấp nhất</option>
                  <option value="price_desc">Giá cao nhất</option>
                  <option value="duration_asc">Thời gian ngắn</option>
                  <option value="duration_desc">Thời gian dài</option>
                  <option value="rating_desc">Rating cao nhất</option>
                </select>
              </div>
            </div>

            {/* Tours List */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-green-600" />
              </div>
            ) : tours.length === 0 ? (
              <div className="text-center py-12">
                <Compass className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Không tìm thấy tour nào</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tours.map((tour) => (
                  <div
                    key={tour.id}
                    className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex gap-4">
                      {/* Tour Image */}
                      <div className="w-32 h-32 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                        {tour.image ? (
                          <img
                            src={
                              tour.image.startsWith("http")
                                ? tour.image
                                : `${API_URL}${tour.image}`
                            }
                            alt={tour.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Compass className="w-12 h-12 text-gray-300" />
                          </div>
                        )}
                      </div>

                      {/* Tour Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {tour.title}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                              <MapPin className="w-4 h-4" />
                              {tour.location}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {tour.status === "active" ? (
                              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                Đang hoạt động
                              </span>
                            ) : tour.status === "inactive" ? (
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
                            <span>{tour.rating || "N/A"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span>{tour.duration} ngày</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span>{tour.group_size || "N/A"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <span>{tour.schedule_count || 0} lịch trình</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>{formatDate(tour.created_at)}</span>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="mb-3">
                          <span className="text-lg font-bold text-green-600">
                            {formatPrice(tour.price)}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewTour(tour)}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            Xem
                          </button>
                          <button
                            onClick={() => handleEditTour(tour)}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                            Sửa
                          </button>
                          <button
                            onClick={() => handleManageSchedule(tour)}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                            Lịch trình
                          </button>
                          <button
                            onClick={() => handleDeleteTour(tour.id)}
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
            {tourPagination.total_pages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t">
                <p className="text-sm text-gray-600">
                  Hiển thị{" "}
                  {(tourPagination.page - 1) * tourPagination.limit + 1} -{" "}
                  {Math.min(
                    tourPagination.page * tourPagination.limit,
                    tourPagination.total
                  )}{" "}
                  trong tổng số {tourPagination.total} tours
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setTourFilters({
                        ...tourFilters,
                        page: tourFilters.page - 1,
                      })
                    }
                    disabled={tourFilters.page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Trước
                  </button>
                  <span className="px-4 py-2 bg-green-50 text-green-600 rounded-lg font-medium">
                    {tourPagination.page} / {tourPagination.total_pages}
                  </span>
                  <button
                    onClick={() =>
                      setTourFilters({
                        ...tourFilters,
                        page: tourFilters.page + 1,
                      })
                    }
                    disabled={tourFilters.page === tourPagination.total_pages}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </>
        ) : null}
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

export default AdminTours;
