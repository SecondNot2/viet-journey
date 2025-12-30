import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Plus,
  FileText,
  Bus,
  MapPin,
  Clock,
  DollarSign,
  Users,
  Route as RouteIcon,
  CalendarDays,
  PauseCircle,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import RouteForm from "./RouteForm";
import TripManagement from "./TripManagement";
import ConfirmDialog from "../../common/ConfirmDialog";

const TransportManagement = () => {
  // State cho tab navigation
  const [activeTab, setActiveTab] = useState("routes"); // 'routes' hoặc 'trips'

  // State cho routes
  const [routes, setRoutes] = useState([]);
  const [filteredRoutes, setFilteredRoutes] = useState([]);
  const [selectedRoutes, setSelectedRoutes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useState({
    keyword: "",
    type: "",
    company: "",
    status: "",
  });
  const itemsPerPage = 10;
  const [showForm, setShowForm] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [viewMode, setViewMode] = useState(false);

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

  // Stats data
  const [stats, setStats] = useState({
    totalRoutes: 0,
    totalTrips: 0,
    activeRoutes: 0,
    totalBookings: 0,
  });

  // Fetch routes from API
  const fetchRoutes = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchParams.status && searchParams.status !== "all") {
        params.append("status", searchParams.status);
      }
      if (searchParams.type && searchParams.type !== "all") {
        params.append("type", searchParams.type);
      }
      if (searchParams.company) {
        params.append("company", searchParams.company);
      }
      params.append("page", "1");
      params.append("limit", "1000"); // Load all cho filtering ở client

      const response = await fetch(
        `http://localhost:5000/api/transport/admin/routes?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch routes");
      }

      const data = await response.json();
      console.log("Fetched routes data:", data);

      const routesArray = data.routes || [];
      setRoutes(routesArray);
      setFilteredRoutes(routesArray);

      // Update stats
      setStats((prev) => ({
        ...prev,
        totalRoutes: routesArray.length,
        activeRoutes: routesArray.filter((r) => r.status === "active").length,
      }));

      setError(null);
    } catch (err) {
      setError("Không thể tải danh sách routes. Vui lòng thử lại sau.");
      console.error("Error fetching routes:", err);
      setRoutes([]);
      setFilteredRoutes([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter routes based on search params
  const filterRoutes = useCallback(() => {
    if (!Array.isArray(routes)) {
      setFilteredRoutes([]);
      return;
    }

    let result = [...routes];

    // Tìm kiếm theo keyword
    if (searchParams.keyword.trim()) {
      const keyword = searchParams.keyword.toLowerCase().trim();
      result = result.filter(
        (route) =>
          route.company?.toLowerCase().includes(keyword) ||
          route.route_name?.toLowerCase().includes(keyword) ||
          route.from_location?.toLowerCase().includes(keyword) ||
          route.to_location?.toLowerCase().includes(keyword) ||
          route.vehicle_name?.toLowerCase().includes(keyword)
      );
    }

    // Lọc theo loại xe
    if (searchParams.type && searchParams.type !== "all") {
      result = result.filter((route) => route.type === searchParams.type);
    }

    // Lọc theo công ty
    if (searchParams.company && searchParams.company !== "all") {
      result = result.filter((route) => route.company === searchParams.company);
    }

    // Lọc theo status
    if (searchParams.status && searchParams.status !== "all") {
      result = result.filter((route) => route.status === searchParams.status);
    }

    setFilteredRoutes(result);
    setCurrentPage(1); // Reset về trang 1 khi filter
  }, [routes, searchParams]);

  // Handle search input change
  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchParams((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setSearchParams((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle reset filters
  const handleResetFilters = () => {
    setSearchParams({
      keyword: "",
      type: "",
      company: "",
      status: "",
    });
    setFilteredRoutes(routes);
  };

  // Handle select all
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRoutes(
        Array.isArray(filteredRoutes)
          ? filteredRoutes.map((route) => route.id)
          : []
      );
    } else {
      setSelectedRoutes([]);
    }
  };

  // Handle select one
  const handleSelect = (routeId) => {
    setSelectedRoutes((prev) =>
      prev.includes(routeId)
        ? prev.filter((id) => id !== routeId)
        : [...prev, routeId]
    );
  };

  // Handle set route inactive
  const handleSetInactive = async (routeId) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/transport/admin/routes/${routeId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "inactive" }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to set route inactive");
      }

      await fetchRoutes();
      toast.success(
        "✅ Đã chuyển route sang trạng thái INACTIVE!\n\n" +
          "Route sẽ không tạo trips mới, nhưng trips hiện tại vẫn hoạt động.",
        {
          duration: 5000,
        }
      );
    } catch (error) {
      console.error("Error setting route inactive:", error);
      toast.error("Có lỗi xảy ra khi cập nhật route!");
    }
  };

  // Handle delete route
  const handleDeleteRoute = (routeId) => {
    if (!Array.isArray(filteredRoutes)) {
      toast.error("Không thể xóa route. Dữ liệu không hợp lệ!");
      return;
    }

    const route = filteredRoutes.find((r) => r.id === routeId);
    if (!route) {
      toast.error("Không tìm thấy route cần xóa!");
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: "Xác nhận xóa route",
      message: `Bạn có chắc chắn muốn xóa route "${route.route_name}" từ ${
        route.from_location || ""
      } đến ${
        route.to_location || ""
      }?\n\n⚠️ Lưu ý: Tất cả chuyến đi (trips) liên quan sẽ bị xóa theo. Hành động này không thể hoàn tác.`,
      type: "danger",
      confirmText: "Xóa",
      cancelText: "Hủy",
      onConfirm: async () => {
        try {
          const response = await fetch(
            `http://localhost:5000/api/transport/admin/routes/${routeId}`,
            {
              method: "DELETE",
            }
          );

          if (!response.ok) {
            const data = await response.json();

            // Check if error is about future trips
            if (
              data.error &&
              data.error.includes("chuyến đi trong tương lai")
            ) {
              // Extract trip count from error message
              const match = data.error.match(/(\d+) chuyến đi/);
              const tripCount = match ? match[1] : "nhiều";

              // Show second dialog with option to set inactive
              setConfirmDialog({
                isOpen: true,
                title: "Không thể xóa route",
                message: `❌ Route có ${tripCount} chuyến đi trong tương lai.\n\nBạn có muốn chuyển route sang trạng thái INACTIVE thay vì xóa?\n\nLưu ý: Route inactive sẽ không tạo trips mới, nhưng trips hiện tại vẫn hoạt động bình thường.`,
                type: "warning",
                confirmText: "Đặt Inactive",
                cancelText: "Hủy",
                onConfirm: async () => {
                  // User chose to set inactive
                  await handleSetInactive(routeId);
                  setConfirmDialog({ ...confirmDialog, isOpen: false });
                },
              });
              return;
            }

            throw new Error(data.error || "Failed to delete route");
          }

          // Refresh routes list
          await fetchRoutes();

          toast.success("Đã xóa route thành công!");
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        } catch (error) {
          console.error("Error deleting route:", error);
          toast.error(error.message || "Có lỗi xảy ra khi xóa route!");
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }
      },
    });
  };

  // Handle view route details
  const handleViewDetails = (routeId) => {
    const route = filteredRoutes.find((r) => r.id === routeId);
    if (!route) {
      toast.error("Không tìm thấy thông tin route!");
      return;
    }

    setSelectedRoute(route);
    setViewMode(true);
    setShowForm(true);
  };

  // Handle add route
  const handleAddRoute = () => {
    setSelectedRoute(null);
    setViewMode(false);
    setShowForm(true);
  };

  // Handle edit route
  const handleEditRoute = (routeId) => {
    if (!Array.isArray(filteredRoutes)) {
      toast.error("Không thể chỉnh sửa route. Dữ liệu không hợp lệ!");
      return;
    }

    const route = filteredRoutes.find((r) => r.id === routeId);
    if (!route) {
      toast.error("Không tìm thấy thông tin route!");
      return;
    }

    setSelectedRoute(route);
    setViewMode(false);
    setShowForm(true);
  };

  // Handle close form
  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedRoute(null);
    setViewMode(false);
  };

  // Handle save route
  const handleSaveRoute = async (routeData) => {
    try {
      const url = routeData.id
        ? `http://localhost:5000/api/transport/admin/routes/${routeData.id}`
        : "http://localhost:5000/api/transport/admin/routes";

      const method = routeData.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(routeData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save route");
      }

      await fetchRoutes();
      setShowForm(false);
      setSelectedRoute(null);
      setViewMode(false);

      const message = routeData.id
        ? "Cập nhật route thành công"
        : "Thêm route thành công! Nhớ click 'Generate Trips' để tạo chuyến đi.";
      toast.success(message, { duration: 5000 });
    } catch (error) {
      console.error("Error saving route:", error);
      toast.error(error.message || "Có lỗi xảy ra khi lưu route");
      throw error; // Re-throw để form có thể xử lý
    }
  };

  // Handle generate trips
  const handleGenerateTrips = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Tạo chuyến đi tự động",
      message:
        "Bạn có chắc muốn generate trips cho tất cả routes active?\n\nScript sẽ tạo trips cho 7 ngày tới dựa trên operating_days của mỗi route.\n\n⚠️ Lưu ý: Quá trình này có thể mất vài giây.",
      type: "info",
      confirmText: "Tạo trips",
      cancelText: "Hủy",
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });

        try {
          setIsLoading(true);
          toast.loading("Đang generate trips...", { id: "generate-trips" });

          // Call backend endpoint to trigger generation
          const response = await fetch(
            "http://localhost:5000/api/transport/admin/generate-trips",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              withCredentials: true,
            }
          );

          if (!response.ok) {
            throw new Error("Failed to generate trips");
          }

          const data = await response.json();

          toast.success(
            `✅ Generate trips thành công!\n\n` +
              `- Đã tạo: ${data.created || 0} trips mới\n` +
              `- Đã cleanup: ${data.cleaned || 0} trips cũ`,
            {
              id: "generate-trips",
              duration: 5000,
            }
          );

          // Refresh routes để update stats
          await fetchRoutes();
        } catch (error) {
          console.error("Error generating trips:", error);
          toast.error(
            "Có lỗi xảy ra khi generate trips. Vui lòng chạy script thủ công:\n" +
              "cd backend/scripts && node auto-generate-trips.js",
            {
              id: "generate-trips",
              duration: 7000,
            }
          );
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  // Format time
  const formatTime = (timeString) => {
    try {
      if (!timeString) return "";
      // timeString có dạng "HH:MM:SS" hoặc "HH:MM"
      const parts = timeString.split(":");
      return `${parts[0]}:${parts[1]}`;
    } catch (error) {
      console.error("Error formatting time:", error);
      return "";
    }
  };

  // Format price
  const formatPrice = (price) => {
    try {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(price || 0);
    } catch (error) {
      console.error("Error formatting price:", error);
      return "0 ₫";
    }
  };

  // Format transport type
  const getTransportType = (type) => {
    switch (type) {
      case "bus":
        return "Xe khách";
      case "train":
        return "Tàu hỏa";
      case "car":
        return "Xe hơi";
      case "bike":
        return "Xe máy";
      default:
        return type || "Không xác định";
    }
  };

  // Get unique companies for filter
  const getUniqueCompanies = () => {
    if (!Array.isArray(routes)) return [];
    return [...new Set(routes.map((r) => r.company))].filter(Boolean).sort();
  };

  // Safe JSON parse helper (MySQL2 auto-parses JSON, so check type first)
  const safeJSONParse = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch (error) {
        console.error("Error parsing JSON:", error);
        return [];
      }
    }
    return [];
  };

  // Effect for real-time search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      filterRoutes();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchParams, filterRoutes]);

  // Load routes on mount hoặc khi switch về routes tab
  useEffect(() => {
    if (activeTab === "routes") {
      fetchRoutes();
    }
  }, [activeTab]);

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = Array.isArray(filteredRoutes)
    ? filteredRoutes.slice(indexOfFirstItem, indexOfLastItem)
    : [];
  const totalPages = Math.ceil(
    (Array.isArray(filteredRoutes) ? filteredRoutes.length : 0) / itemsPerPage
  );

  // Nếu đang hiển thị form
  if (showForm) {
    return (
      <RouteForm
        route={selectedRoute}
        onClose={handleCloseForm}
        onSave={handleSaveRoute}
        viewMode={viewMode}
      />
    );
  }

  // Nếu đang ở tab trips
  if (activeTab === "trips") {
    return <TripManagement onBack={() => setActiveTab("routes")} />;
  }

  return (
    <div className="space-y-6">
      <Toaster position="bottom-right" />
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 -mx-8 -mt-8 px-8 py-12 mb-8">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Quản lý vận chuyển
              </h1>
              <p className="text-emerald-50">
                Quản lý routes (lộ trình) và trips (chuyến đi) trong hệ thống
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button className="inline-flex items-center px-4 py-2 bg-white text-emerald-600 rounded-xl hover:bg-emerald-50 transition-colors">
                <FileText className="w-5 h-5 mr-2" />
                Xuất báo cáo
              </button>
              <button
                onClick={handleGenerateTrips}
                className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-400 transition-colors"
                title="Tạo trips cho 7 ngày tới"
              >
                <CalendarDays className="w-5 h-5 mr-2" />
                Generate Trips
              </button>
              <button
                onClick={handleAddRoute}
                className="inline-flex items-center px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-400 transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                Thêm Route mới
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mt-6 flex gap-2">
            <button
              onClick={() => setActiveTab("routes")}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === "routes"
                  ? "bg-white text-emerald-600 shadow-lg"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              <RouteIcon className="w-5 h-5" />
              Routes (Lộ trình)
            </button>
            <button
              onClick={() => setActiveTab("trips")}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === "trips"
                  ? "bg-white text-emerald-600 shadow-lg"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              <CalendarDays className="w-5 h-5" />
              Trips (Chuyến đi)
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500 rounded-xl">
                  <RouteIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-emerald-100 text-sm">Tổng Routes</p>
                  <p className="text-2xl font-bold text-white">
                    {stats.totalRoutes}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500 rounded-xl">
                  <Bus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-emerald-100 text-sm">Routes Hoạt động</p>
                  <p className="text-2xl font-bold text-white">
                    {stats.activeRoutes}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500 rounded-xl">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-emerald-100 text-sm">Tuyến đường</p>
                  <p className="text-2xl font-bold text-white">
                    {Array.isArray(routes)
                      ? new Set(
                          routes.map(
                            (r) =>
                              `${r.from_location || ""}-${r.to_location || ""}`
                          )
                        ).size
                      : 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500 rounded-xl">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-emerald-100 text-sm">Công ty vận chuyển</p>
                  <p className="text-2xl font-bold text-white">
                    {getUniqueCompanies().length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-screen mx-auto">
        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="md:col-span-4">
              <div className="relative">
                <input
                  type="text"
                  name="keyword"
                  value={searchParams.keyword}
                  onChange={handleSearchChange}
                  placeholder="Tìm kiếm theo tên route, công ty, địa điểm..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <select
                name="type"
                value={searchParams.type}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">Tất cả loại xe</option>
                <option value="bus">Xe khách</option>
                <option value="train">Tàu hỏa</option>
                <option value="car">Xe hơi</option>
                <option value="bike">Xe máy</option>
              </select>
            </div>

            {/* Company Filter */}
            <div>
              <select
                name="company"
                value={searchParams.company}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">Tất cả công ty</option>
                {getUniqueCompanies().map((company) => (
                  <option key={company} value={company}>
                    {company}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                name="status"
                value={searchParams.status}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="active">Hoạt động</option>
                <option value="inactive">Tạm ngừng</option>
              </select>
            </div>

            {/* Reset Filters */}
            <div className="md:col-span-4 flex justify-end">
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Đặt lại bộ lọc
              </button>
            </div>
          </div>

          {/* Filter Results Summary */}
          {(searchParams.keyword ||
            searchParams.type ||
            searchParams.company ||
            searchParams.status) && (
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
              <Filter className="w-4 h-4" />
              <span>
                Đang hiển thị {filteredRoutes.length} kết quả
                {searchParams.keyword && ` cho "${searchParams.keyword}"`}
                {searchParams.type &&
                  ` loại xe "${getTransportType(searchParams.type)}"`}
                {searchParams.company &&
                  ` của công ty "${searchParams.company}"`}
              </span>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3 mb-6">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Routes Table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Danh sách Routes
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  Tổng số:{" "}
                  {Array.isArray(filteredRoutes) ? filteredRoutes.length : 0}
                </span>
                <button className="inline-flex items-center px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                  <Download className="w-5 h-5 mr-2" />
                  Xuất dữ liệu
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-4">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={
                        Array.isArray(filteredRoutes) &&
                        filteredRoutes.length > 0 &&
                        selectedRoutes.length === filteredRoutes.length
                      }
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    Route
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    Tuyến đường
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    Lịch trình
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    Giá & Ghế
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
                {isLoading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
                        <p className="text-gray-500">Đang tải dữ liệu...</p>
                      </div>
                    </td>
                  </tr>
                ) : Array.isArray(filteredRoutes) &&
                  filteredRoutes.length > 0 ? (
                  currentItems.map((route) => (
                    <tr key={route.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedRoutes.includes(route.id)}
                          onChange={() => handleSelect(route.id)}
                          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">
                            {route.route_name || route.route_code}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-2">
                            <Bus className="w-4 h-4" />
                            {getTransportType(route.type)} - {route.company}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {route.from_location} → {route.to_location}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {route.duration} phút
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-sm text-gray-600 flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatTime(route.departure_time)} -{" "}
                            {formatTime(route.arrival_time)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {safeJSONParse(route.operating_days).length}{" "}
                            ngày/tuần
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {formatPrice(route.price)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {route.seats} ghế
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            route.status === "active"
                              ? "bg-green-50 text-green-600"
                              : "bg-gray-50 text-gray-600"
                          }`}
                        >
                          {route.status === "active"
                            ? "Hoạt động"
                            : "Tạm ngừng"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewDetails(route.id)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-5 h-5 text-gray-500" />
                          </button>
                          <button
                            onClick={() => handleEditRoute(route.id)}
                            className="p-2 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit className="w-5 h-5 text-emerald-500" />
                          </button>
                          {route.status === "active" && (
                            <button
                              onClick={() => handleSetInactive(route.id)}
                              className="p-2 hover:bg-orange-50 rounded-lg transition-colors"
                              title="Chuyển sang Inactive"
                            >
                              <PauseCircle className="w-5 h-5 text-orange-500" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteRoute(route.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa (chỉ khi không có trips tương lai)"
                          >
                            <Trash2 className="w-5 h-5 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Search className="h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-lg font-medium text-gray-900 mb-1">
                          Không tìm thấy route nào
                        </p>
                        <p className="text-gray-500">
                          Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <div className="text-sm text-gray-500">
                Hiển thị {indexOfFirstItem + 1}-
                {Math.min(
                  indexOfLastItem,
                  Array.isArray(filteredRoutes) ? filteredRoutes.length : 0
                )}{" "}
                trong số{" "}
                {Array.isArray(filteredRoutes) ? filteredRoutes.length : 0}{" "}
                routes
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className={`p-2 border border-gray-200 rounded-lg transition-colors ${
                    currentPage === 1
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        currentPage === page
                          ? "bg-emerald-50 text-emerald-600 font-medium"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className={`p-2 border border-gray-200 rounded-lg transition-colors ${
                    currentPage === totalPages
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

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

export default TransportManagement;
