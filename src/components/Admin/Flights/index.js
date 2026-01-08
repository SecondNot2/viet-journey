import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Search,
  Filter,
  Plus,
  Plane,
  Calendar,
  Clock,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Loader2,
  PauseCircle,
  AlertCircle,
  X,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import RouteForm from "./RouteForm";
import ConfirmDialog from "../../common/ConfirmDialog";
import { API_URL, API_HOST } from "../../../config/api";

// Alias for backward compatibility
const API_BASE_URL = API_URL;

const FlightManagement = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState("routes"); // 'routes' | 'schedules'

  // Routes state
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("view"); // 'view' | 'edit' | 'add'

  // Schedules state
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "danger",
    onConfirm: () => {},
    showInput: false,
    inputPlaceholder: "",
    inputLabel: "",
  });

  // Routes filters
  const [routeFilters, setRouteFilters] = useState({
    search: "",
    airline: "all",
    status: "all",
    page: 1,
    limit: 10,
    sort_by: "created_desc",
  });

  // Schedules filters
  const [scheduleFilters, setScheduleFilters] = useState({
    search: "",
    route_id: "",
    status: "all",
    from_date: "",
    to_date: "",
    page: 1,
    limit: 10,
    sort_by: "date_asc",
  });

  // Pagination
  const [routePagination, setRoutePagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 1,
  });

  const [schedulePagination, setSchedulePagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 1,
  });

  // Loading states
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Airlines for filter
  const [airlines, setAirlines] = useState([]);

  // ========================================
  // Helper Functions
  // ========================================

  const safeJSONParse = (value, fallback = []) => {
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return fallback;
      }
    }
    return fallback;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "N/A";
    return timeStr.substring(0, 5); // HH:MM
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-50 text-blue-600";
      case "boarding":
        return "bg-emerald-50 text-emerald-600";
      case "departed":
        return "bg-purple-50 text-purple-600";
      case "arrived":
        return "bg-gray-50 text-gray-600";
      case "delayed":
        return "bg-yellow-50 text-yellow-600";
      case "cancelled":
        return "bg-red-50 text-red-600";
      case "active":
        return "bg-green-50 text-green-600";
      case "inactive":
        return "bg-gray-50 text-gray-600";
      default:
        return "bg-gray-50 text-gray-600";
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      scheduled: "Đã lên lịch",
      boarding: "Đang boarding",
      departed: "Đã khởi hành",
      arrived: "Đã hạ cánh",
      delayed: "Bị hoãn",
      cancelled: "Đã hủy",
      active: "Đang hoạt động",
      inactive: "Tạm dừng",
    };
    return statusMap[status] || "Không xác định";
  };

  // ========================================
  // Fetch Data
  // ========================================

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...routeFilters,
      });

      const res = await axios.get(
        `${API_BASE_URL}/flights/admin/routes?${params}`
      );

      setRoutes(res.data.routes || []);
      setRoutePagination(res.data.pagination);
    } catch (error) {
      console.error("Error fetching routes:", error);
      toast.error("Có lỗi khi tải danh sách tuyến bay");
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...scheduleFilters,
      });

      const res = await axios.get(
        `${API_BASE_URL}/flights/admin/schedules?${params}`
      );

      setSchedules(res.data.schedules || []);
      setSchedulePagination(res.data.pagination);
    } catch (error) {
      console.error("Error fetching schedules:", error);
      toast.error("Có lỗi khi tải danh sách lịch bay");
    } finally {
      setLoading(false);
    }
  };

  const fetchAirlines = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/flights/airlines`);
      setAirlines(res.data.airlines || []);
    } catch (error) {
      console.error("Error fetching airlines:", error);
    }
  };

  // ========================================
  // Route Actions
  // ========================================

  const handleAddRoute = () => {
    setSelectedRoute(null);
    setModalMode("add");
    setIsModalOpen(true);
  };

  const handleViewRoute = (route) => {
    setSelectedRoute(route);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleEditRoute = (route) => {
    setSelectedRoute(route);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleDeleteRoute = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: "Xác nhận xóa tuyến bay",
      message:
        "Bạn có chắc chắn muốn xóa tuyến bay này?\n\nHành động này không thể hoàn tác.",
      type: "danger",
      confirmText: "Xóa",
      cancelText: "Hủy",
      onConfirm: async () => {
        try {
          await axios.delete(`${API_BASE_URL}/flights/admin/routes/${id}`);
          toast.success("Xóa tuyến bay thành công!");
          fetchRoutes();
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        } catch (error) {
          if (error.response?.data?.hasFutureSchedules) {
            const count = error.response.data.futureSchedulesCount;
            setConfirmDialog({
              isOpen: true,
              title: "Không thể xóa tuyến bay",
              message: `Tuyến bay này có ${count} lịch bay trong tương lai.\n\nBạn có muốn đặt tuyến bay thành "Inactive" thay vì xóa?`,
              type: "warning",
              confirmText: "Đặt Inactive",
              cancelText: "Hủy",
              onConfirm: () => {
                handleSetInactive(id);
                setConfirmDialog({ ...confirmDialog, isOpen: false });
              },
            });
          } else {
            toast.error(
              error.response?.data?.error || "Có lỗi khi xóa tuyến bay"
            );
            setConfirmDialog({ ...confirmDialog, isOpen: false });
          }
        }
      },
    });
  };

  const handleSetInactive = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: "Xác nhận tạm dừng tuyến bay",
      message:
        "Bạn có chắc chắn muốn tạm dừng tuyến bay này?\n\nTuyến bay sẽ chuyển sang trạng thái Inactive và không tạo lịch mới.",
      type: "warning",
      confirmText: "Tạm dừng",
      cancelText: "Hủy",
      onConfirm: async () => {
        try {
          await axios.put(`${API_BASE_URL}/flights/admin/routes/${id}`, {
            status: "inactive",
          });
          toast.success("Đã chuyển tuyến bay sang trạng thái Inactive");
          fetchRoutes();
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        } catch (error) {
          toast.error("Có lỗi khi cập nhật trạng thái");
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }
      },
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRoute(null);
    setModalMode("view");
  };

  const handleSaveRoute = async (routeData) => {
    try {
      if (routeData.id) {
        // Update existing route
        await axios.put(
          `${API_BASE_URL}/flights/admin/routes/${routeData.id}`,
          routeData
        );
      } else {
        // Create new route
        await axios.post(`${API_BASE_URL}/flights/admin/routes`, routeData);
      }
      fetchRoutes();
    } catch (error) {
      throw error;
    }
  };

  // ========================================
  // Schedule Actions
  // ========================================

  const handleViewSchedule = (schedule) => {
    setSelectedSchedule(schedule);
    setIsScheduleModalOpen(true);
  };

  const handleCancelSchedule = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: "Hủy lịch bay",
      message: "Vui lòng nhập lý do hủy lịch bay:",
      type: "danger",
      confirmText: "Hủy lịch bay",
      cancelText: "Đóng",
      showInput: true,
      inputPlaceholder: "Ví dụ: Thời tiết xấu, sự cố kỹ thuật...",
      inputLabel: "Lý do hủy *",
      onConfirm: async (reason) => {
        try {
          await axios.put(
            `${API_BASE_URL}/flights/admin/schedules/${id}/cancel`,
            { cancellation_reason: reason }
          );
          toast.success("Đã hủy lịch bay thành công!");
          fetchSchedules();
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        } catch (error) {
          toast.error(error.response?.data?.error || "Có lỗi khi hủy lịch bay");
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }
      },
    });
  };

  const handleUpdateScheduleStatus = (id, status) => {
    const statusText = {
      boarding: "Đang boarding",
      departed: "Đã khởi hành",
      arrived: "Đã hạ cánh",
      delayed: "Bị hoãn",
    };

    setConfirmDialog({
      isOpen: true,
      title: "Cập nhật trạng thái lịch bay",
      message: `Bạn có chắc chắn muốn đổi trạng thái thành "${
        statusText[status] || status
      }"?`,
      type: "info",
      confirmText: "Cập nhật",
      cancelText: "Hủy",
      onConfirm: async () => {
        try {
          await axios.put(`${API_BASE_URL}/flights/admin/schedules/${id}`, {
            status,
          });
          toast.success("Đã cập nhật trạng thái thành công!");
          fetchSchedules();
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        } catch (error) {
          toast.error(
            error.response?.data?.error || "Có lỗi khi cập nhật trạng thái"
          );
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }
      },
    });
  };

  // ========================================
  // Generate Schedules
  // ========================================

  const handleGenerateSchedules = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Tạo lịch bay tự động",
      message:
        "Tạo lịch bay cho các tuyến chưa có lịch hoặc chỉ còn ≤2 lịch khả dụng (30 ngày tới)?\n\nLưu ý: Các tuyến đã có đủ lịch sẽ được bỏ qua để tránh tạo quá nhiều lịch.",
      type: "info",
      confirmText: "Tạo lịch",
      cancelText: "Hủy",
      onConfirm: async () => {
        setGenerating(true);
        setConfirmDialog({ ...confirmDialog, isOpen: false });

        try {
          const res = await axios.post(
            `${API_BASE_URL}/flights/admin/generate-schedules`
          );

          // Hiển thị thông tin chi tiết
          const { created, routesProcessed, routesSkipped, totalRoutes } =
            res.data;

          if (created > 0) {
            toast.success(
              `✅ Đã tạo ${created} lịch bay mới!\n📊 Xử lý: ${routesProcessed}/${totalRoutes} tuyến bay\n⏭️ Bỏ qua: ${routesSkipped} tuyến (đã có đủ lịch)`,
              { duration: 5000 }
            );
          } else {
            toast.success(
              `ℹ️ Không cần tạo lịch mới\n📊 Tất cả ${totalRoutes} tuyến đều đã có đủ lịch bay`,
              { duration: 4000 }
            );
          }

          if (activeTab === "schedules") fetchSchedules();
        } catch (error) {
          toast.error(error.response?.data?.error || "Có lỗi khi tạo lịch bay");
        } finally {
          setGenerating(false);
        }
      },
    });
  };

  // ========================================
  // Effects
  // ========================================

  useEffect(() => {
    fetchAirlines();
  }, []);

  useEffect(() => {
    if (activeTab === "routes") {
      fetchRoutes();
    } else {
      fetchSchedules();
    }
  }, [
    activeTab,
    routeFilters,
    scheduleFilters,
    routeFilters.page,
    scheduleFilters.page,
  ]);

  // ========================================
  // Render
  // ========================================

  // If form is open, show only the form
  if (isModalOpen) {
    return (
      <RouteForm
        route={selectedRoute}
        onClose={handleCloseModal}
        onSave={handleSaveRoute}
        viewMode={modalMode === "view"}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Toaster position="bottom-right" />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 -mx-8 -mt-8 px-8 py-12 mb-8">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Quản lý chuyến bay
              </h1>
              <p className="text-blue-50">
                Quản lý tuyến bay và lịch bay trong hệ thống
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleGenerateSchedules}
                disabled={generating}
                className="inline-flex items-center px-4 py-2 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Tạo lịch bay
                  </>
                )}
              </button>
              {activeTab === "routes" && (
                <button
                  onClick={handleAddRoute}
                  className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-400 transition-colors"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Thêm tuyến bay
                </button>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500 rounded-xl">
                  <Plane className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Tổng tuyến bay</p>
                  <p className="text-2xl font-bold text-white">
                    {routes.length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500 rounded-xl">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Lịch bay hôm nay</p>
                  <p className="text-2xl font-bold text-white">
                    {
                      schedules.filter(
                        (s) =>
                          s.flight_date ===
                          new Date().toISOString().split("T")[0]
                      ).length
                    }
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500 rounded-xl">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Đang bay</p>
                  <p className="text-2xl font-bold text-white">
                    {
                      schedules.filter(
                        (s) =>
                          s.status === "departed" || s.status === "boarding"
                      ).length
                    }
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500 rounded-xl">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Bị hủy/Hoãn</p>
                  <p className="text-2xl font-bold text-white">
                    {
                      schedules.filter(
                        (s) =>
                          s.status === "cancelled" || s.status === "delayed"
                      ).length
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mt-6 flex gap-2">
            <button
              onClick={() => setActiveTab("routes")}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === "routes"
                  ? "bg-white text-blue-600 shadow-lg"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              <Plane className="w-5 h-5" />
              Tuyến bay (Routes)
            </button>
            <button
              onClick={() => setActiveTab("schedules")}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === "schedules"
                  ? "bg-white text-blue-600 shadow-lg"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              <Calendar className="w-5 h-5" />
              Lịch bay (Schedules)
            </button>
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div className="bg-white rounded-2xl shadow-sm">
        {/* Routes Tab */}
        {activeTab === "routes" && (
          <div className="p-6">
            {/* Filters */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Tìm kiếm tuyến bay, điểm đi/đến..."
                    value={routeFilters.search}
                    onChange={(e) =>
                      setRouteFilters({
                        ...routeFilters,
                        search: e.target.value,
                        page: 1,
                      })
                    }
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <select
                value={routeFilters.airline}
                onChange={(e) =>
                  setRouteFilters({
                    ...routeFilters,
                    airline: e.target.value,
                    page: 1,
                  })
                }
                className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả hãng bay</option>
                {airlines.map((airline) => (
                  <option key={airline} value={airline}>
                    {airline}
                  </option>
                ))}
              </select>

              <select
                value={routeFilters.status}
                onChange={(e) =>
                  setRouteFilters({
                    ...routeFilters,
                    status: e.target.value,
                    page: 1,
                  })
                }
                className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Tạm dừng</option>
              </select>

              <select
                value={routeFilters.sort_by}
                onChange={(e) =>
                  setRouteFilters({ ...routeFilters, sort_by: e.target.value })
                }
                className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
              >
                <option value="created_desc">Mới nhất</option>
                <option value="created_asc">Cũ nhất</option>
                <option value="price_asc">Giá thấp → cao</option>
                <option value="price_desc">Giá cao → thấp</option>
              </select>

              <button
                onClick={() =>
                  setRouteFilters({
                    search: "",
                    airline: "all",
                    status: "all",
                    page: 1,
                    limit: 10,
                    sort_by: "created_desc",
                  })
                }
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Đặt lại bộ lọc
              </button>
            </div>

            {/* Routes Table */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : routes.length === 0 ? (
              <div className="text-center py-12">
                <Plane className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Không có tuyến bay nào</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                          Mã chuyến bay
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                          Hãng bay
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                          Tuyến bay
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                          Giờ bay
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                          Giá cơ bản
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                          Trạng thái
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {routes.map((route) => (
                        <tr key={route.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-gray-900">
                            {route.flight_number}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {route.airline_image && (
                                <img
                                  src={`${API_BASE_URL}${route.airline_image}`}
                                  alt={route.airline}
                                  className="w-8 h-8 object-contain"
                                />
                              )}
                              <span>{route.airline}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm">
                              {route.from_location} → {route.to_location}
                            </div>
                            <div className="text-xs text-gray-500">
                              {route.duration} phút
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm">
                              {formatTime(route.departure_time)} -{" "}
                              {formatTime(route.arrival_time)}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-medium">
                            {formatCurrency(route.base_price)}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                route.status
                              )}`}
                            >
                              {getStatusText(route.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleViewRoute(route)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Xem chi tiết"
                              >
                                <Eye className="w-5 h-5 text-gray-500" />
                              </button>
                              <button
                                onClick={() => handleEditRoute(route)}
                                className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Chỉnh sửa"
                              >
                                <Edit className="w-5 h-5 text-blue-500" />
                              </button>
                              <button
                                onClick={() => handleDeleteRoute(route.id)}
                                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                title="Xóa"
                              >
                                <Trash2 className="w-5 h-5 text-red-500" />
                              </button>
                              {route.status === "active" && (
                                <button
                                  onClick={() => handleSetInactive(route.id)}
                                  className="p-2 hover:bg-yellow-50 rounded-lg transition-colors"
                                  title="Tạm dừng"
                                >
                                  <PauseCircle className="w-5 h-5 text-yellow-500" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-500">
                    Hiển thị{" "}
                    {(routePagination.page - 1) * routePagination.limit + 1}-
                    {Math.min(
                      routePagination.page * routePagination.limit,
                      routePagination.total
                    )}{" "}
                    trong số {routePagination.total} tuyến bay
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setRouteFilters({
                          ...routeFilters,
                          page: Math.max(routeFilters.page - 1, 1),
                        })
                      }
                      disabled={routeFilters.page === 1}
                      className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm text-gray-700">
                      Trang {routePagination.page} /{" "}
                      {routePagination.total_pages}
                    </span>
                    <button
                      onClick={() =>
                        setRouteFilters({
                          ...routeFilters,
                          page: Math.min(
                            routeFilters.page + 1,
                            routePagination.total_pages
                          ),
                        })
                      }
                      disabled={
                        routeFilters.page === routePagination.total_pages
                      }
                      className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Schedules Tab */}
        {activeTab === "schedules" && (
          <div className="p-6">
            {/* Filters */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Tìm kiếm lịch bay..."
                    value={scheduleFilters.search}
                    onChange={(e) =>
                      setScheduleFilters({
                        ...scheduleFilters,
                        search: e.target.value,
                        page: 1,
                      })
                    }
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <select
                value={scheduleFilters.status}
                onChange={(e) =>
                  setScheduleFilters({
                    ...scheduleFilters,
                    status: e.target.value,
                    page: 1,
                  })
                }
                className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="scheduled">Đã lên lịch</option>
                <option value="boarding">Đang boarding</option>
                <option value="departed">Đã khởi hành</option>
                <option value="arrived">Đã hạ cánh</option>
                <option value="delayed">Bị hoãn</option>
                <option value="cancelled">Đã hủy</option>
              </select>

              <input
                type="date"
                value={scheduleFilters.from_date}
                onChange={(e) =>
                  setScheduleFilters({
                    ...scheduleFilters,
                    from_date: e.target.value,
                    page: 1,
                  })
                }
                className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                placeholder="Từ ngày"
              />

              <input
                type="date"
                value={scheduleFilters.to_date}
                onChange={(e) =>
                  setScheduleFilters({
                    ...scheduleFilters,
                    to_date: e.target.value,
                    page: 1,
                  })
                }
                className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                placeholder="Đến ngày"
              />

              <button
                onClick={() =>
                  setScheduleFilters({
                    search: "",
                    route_id: "",
                    status: "all",
                    from_date: "",
                    to_date: "",
                    page: 1,
                    limit: 10,
                    sort_by: "date_asc",
                  })
                }
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Đặt lại bộ lọc
              </button>
            </div>

            {/* Schedules Table */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : schedules.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Không có lịch bay nào</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                          Mã lịch bay
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                          Chuyến bay
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                          Ngày bay
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                          Giờ bay
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                          Trạng thái
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {schedules.map((schedule) => (
                        <tr key={schedule.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-gray-900">
                            {schedule.schedule_code}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium">
                              {schedule.airline}
                            </div>
                            <div className="text-sm text-gray-500">
                              {schedule.flight_number}: {schedule.from_location}{" "}
                              → {schedule.to_location}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {formatDate(schedule.flight_date)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm">
                              {schedule.departure_datetime &&
                                new Date(
                                  schedule.departure_datetime
                                ).toLocaleTimeString("vi-VN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                schedule.status
                              )}`}
                            >
                              {getStatusText(schedule.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleViewSchedule(schedule)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Xem chi tiết"
                              >
                                <Eye className="w-5 h-5 text-gray-500" />
                              </button>
                              {schedule.status === "scheduled" && (
                                <>
                                  <button
                                    onClick={() =>
                                      handleUpdateScheduleStatus(
                                        schedule.id,
                                        "boarding"
                                      )
                                    }
                                    className="px-3 py-1 text-xs bg-green-50 text-green-600 rounded-lg hover:bg-green-100"
                                  >
                                    Boarding
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleCancelSchedule(schedule.id)
                                    }
                                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Hủy"
                                  >
                                    <X className="w-5 h-5 text-red-500" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-500">
                    Hiển thị{" "}
                    {(schedulePagination.page - 1) * schedulePagination.limit +
                      1}
                    -
                    {Math.min(
                      schedulePagination.page * schedulePagination.limit,
                      schedulePagination.total
                    )}{" "}
                    trong số {schedulePagination.total} lịch bay
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setScheduleFilters({
                          ...scheduleFilters,
                          page: Math.max(scheduleFilters.page - 1, 1),
                        })
                      }
                      disabled={scheduleFilters.page === 1}
                      className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm text-gray-700">
                      Trang {schedulePagination.page} /{" "}
                      {schedulePagination.total_pages}
                    </span>
                    <button
                      onClick={() =>
                        setScheduleFilters({
                          ...scheduleFilters,
                          page: Math.min(
                            scheduleFilters.page + 1,
                            schedulePagination.total_pages
                          ),
                        })
                      }
                      disabled={
                        scheduleFilters.page === schedulePagination.total_pages
                      }
                      className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Schedule Detail Modal */}
      {isScheduleModalOpen && selectedSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                Chi tiết lịch bay
              </h3>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mã lịch bay
                </label>
                <p className="text-gray-900">
                  {selectedSchedule.schedule_code}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hãng bay
                  </label>
                  <p className="text-gray-900">{selectedSchedule.airline}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số hiệu
                  </label>
                  <p className="text-gray-900">
                    {selectedSchedule.flight_number}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Điểm đi
                  </label>
                  <p className="text-gray-900">
                    {selectedSchedule.from_location}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Điểm đến
                  </label>
                  <p className="text-gray-900">
                    {selectedSchedule.to_location}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày bay
                </label>
                <p className="text-gray-900">
                  {formatDate(selectedSchedule.flight_date)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giờ khởi hành
                  </label>
                  <p className="text-gray-900">
                    {selectedSchedule.departure_datetime &&
                      new Date(
                        selectedSchedule.departure_datetime
                      ).toLocaleString("vi-VN")}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giờ đến
                  </label>
                  <p className="text-gray-900">
                    {selectedSchedule.arrival_datetime &&
                      new Date(
                        selectedSchedule.arrival_datetime
                      ).toLocaleString("vi-VN")}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trạng thái
                </label>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    selectedSchedule.status
                  )}`}
                >
                  {getStatusText(selectedSchedule.status)}
                </span>
              </div>

              {selectedSchedule.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ghi chú
                  </label>
                  <p className="text-gray-900">{selectedSchedule.notes}</p>
                </div>
              )}

              {selectedSchedule.cancellation_reason && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lý do hủy
                  </label>
                  <p className="text-red-600">
                    {selectedSchedule.cancellation_reason}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
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

export default FlightManagement;
