import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Calendar,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Bus,
  MapPin,
  Clock,
  Users,
  ArrowLeft,
  X,
  CheckCircle,
  XCircle,
  PauseCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";

const TripManagement = ({ onBack }) => {
  const [trips, setTrips] = useState([]);
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useState({
    keyword: "",
    status: "",
    from_date: "",
    to_date: "",
  });
  const itemsPerPage = 10;

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [editData, setEditData] = useState({
    status: "",
    price_override: "",
    delay_minutes: "",
    notes: "",
  });

  // Stats
  const [stats, setStats] = useState({
    totalTrips: 0,
    scheduled: 0,
    departed: 0,
    cancelled: 0,
  });

  // Fetch trips from API
  const fetchTrips = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchParams.status && searchParams.status !== "all") {
        params.append("status", searchParams.status);
      }
      if (searchParams.from_date) {
        params.append("from_date", searchParams.from_date);
      }
      if (searchParams.to_date) {
        params.append("to_date", searchParams.to_date);
      }
      params.append("page", "1");
      params.append("limit", "1000");

      const response = await fetch(
        `http://localhost:5000/api/transport/admin/trips?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch trips");
      }

      const data = await response.json();
      console.log("Fetched trips data:", data);

      const tripsArray = data.trips || [];
      setTrips(tripsArray);
      setFilteredTrips(tripsArray);

      // Update stats
      setStats({
        totalTrips: tripsArray.length,
        scheduled: tripsArray.filter((t) => t.status === "scheduled").length,
        departed: tripsArray.filter((t) => t.status === "departed").length,
        cancelled: tripsArray.filter((t) => t.status === "cancelled").length,
      });

      setError(null);
    } catch (err) {
      setError("Không thể tải danh sách trips. Vui lòng thử lại sau.");
      console.error("Error fetching trips:", err);
      setTrips([]);
      setFilteredTrips([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter trips based on search params
  const filterTrips = useCallback(() => {
    if (!Array.isArray(trips)) {
      setFilteredTrips([]);
      return;
    }

    let result = [...trips];

    // Tìm kiếm theo keyword
    if (searchParams.keyword.trim()) {
      const keyword = searchParams.keyword.toLowerCase().trim();
      result = result.filter(
        (trip) =>
          trip.company?.toLowerCase().includes(keyword) ||
          trip.route_name?.toLowerCase().includes(keyword) ||
          trip.from_location?.toLowerCase().includes(keyword) ||
          trip.to_location?.toLowerCase().includes(keyword) ||
          trip.trip_code?.toLowerCase().includes(keyword)
      );
    }

    // Lọc theo status
    if (searchParams.status && searchParams.status !== "all") {
      result = result.filter((trip) => trip.status === searchParams.status);
    }

    // Lọc theo từ ngày
    if (searchParams.from_date) {
      result = result.filter(
        (trip) => new Date(trip.trip_date) >= new Date(searchParams.from_date)
      );
    }

    // Lọc theo đến ngày
    if (searchParams.to_date) {
      result = result.filter(
        (trip) => new Date(trip.trip_date) <= new Date(searchParams.to_date)
      );
    }

    setFilteredTrips(result);
    setCurrentPage(1);
  }, [trips, searchParams]);

  // Handle search input change
  const handleSearchChange = (e) => {
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
      status: "",
      from_date: "",
      to_date: "",
    });
    setFilteredTrips(trips);
  };

  // Handle cancel trip
  const handleCancelTrip = async (tripId) => {
    const reason = prompt("Nhập lý do hủy chuyến:");
    if (!reason) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/transport/admin/trips/${tripId}/cancel`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ cancel_reason: reason }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to cancel trip");
      }

      await fetchTrips();
      toast.success("Đã hủy chuyến đi thành công!");
    } catch (error) {
      console.error("Error cancelling trip:", error);
      toast.error("Có lỗi xảy ra khi hủy chuyến đi!");
    }
  };

  // Handle edit trip
  const handleEditTrip = (trip) => {
    setSelectedTrip(trip);
    setEditData({
      status: trip.status || "",
      price_override: trip.price_override || "",
      delay_minutes: trip.delay_minutes || "",
      notes: trip.notes || "",
    });
    setShowEditModal(true);
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!selectedTrip) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/transport/admin/trips/${selectedTrip.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update trip");
      }

      await fetchTrips();
      setShowEditModal(false);
      setSelectedTrip(null);
      toast.success("Cập nhật trip thành công!");
    } catch (error) {
      console.error("Error updating trip:", error);
      toast.error("Có lỗi xảy ra khi cập nhật trip!");
    }
  };

  // Format date
  const formatDate = (dateString) => {
    try {
      if (!dateString) return "";
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  // Format time
  const formatTime = (dateString) => {
    try {
      if (!dateString) return "";
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      return date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
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

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case "scheduled":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
            <Calendar className="w-3 h-3 mr-1" />
            Đã lên lịch
          </span>
        );
      case "boarding":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-600">
            <Clock className="w-3 h-3 mr-1" />
            Đang lên xe
          </span>
        );
      case "departed":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            Đã khởi hành
          </span>
        );
      case "arrived":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            Đã đến
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600">
            <XCircle className="w-3 h-3 mr-1" />
            Đã hủy
          </span>
        );
      case "delayed":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-600">
            <PauseCircle className="w-3 h-3 mr-1" />
            Bị trễ
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600">
            {status}
          </span>
        );
    }
  };

  // Effect for real-time search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      filterTrips();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchParams, filterTrips]);

  // Load trips on mount
  useEffect(() => {
    fetchTrips();
  }, []);

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = Array.isArray(filteredTrips)
    ? filteredTrips.slice(indexOfFirstItem, indexOfLastItem)
    : [];
  const totalPages = Math.ceil(
    (Array.isArray(filteredTrips) ? filteredTrips.length : 0) / itemsPerPage
  );

  // Edit Modal Component
  const EditModal = () => {
    if (!showEditModal || !selectedTrip) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-800">
              Chỉnh sửa Trip
            </h3>
            <button
              onClick={() => setShowEditModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Trip Info */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">Trip Code</p>
              <p className="font-medium">{selectedTrip.trip_code}</p>
              <p className="text-sm text-gray-600 mt-1">
                {selectedTrip.from_location} → {selectedTrip.to_location}
              </p>
              <p className="text-sm text-gray-600">
                {formatDate(selectedTrip.trip_date)} -{" "}
                {formatTime(selectedTrip.departure_datetime)}
              </p>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trạng thái
              </label>
              <select
                value={editData.status}
                onChange={(e) =>
                  setEditData({ ...editData, status: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              >
                <option value="scheduled">Đã lên lịch</option>
                <option value="boarding">Đang lên xe</option>
                <option value="departed">Đã khởi hành</option>
                <option value="arrived">Đã đến</option>
                <option value="delayed">Bị trễ</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>

            {/* Price Override */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giá vé đặc biệt (để trống nếu dùng giá mặc định)
              </label>
              <input
                type="number"
                value={editData.price_override}
                onChange={(e) =>
                  setEditData({ ...editData, price_override: e.target.value })
                }
                placeholder="VD: 350000"
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Delay Minutes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thời gian trễ (phút)
              </label>
              <input
                type="number"
                value={editData.delay_minutes}
                onChange={(e) =>
                  setEditData({ ...editData, delay_minutes: e.target.value })
                }
                placeholder="VD: 30"
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ghi chú
              </label>
              <textarea
                value={editData.notes}
                onChange={(e) =>
                  setEditData({ ...editData, notes: e.target.value })
                }
                rows={3}
                placeholder="Nhập ghi chú..."
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Hủy
            </button>
            <button
              onClick={handleSaveEdit}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl"
            >
              Lưu thay đổi
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 -mx-8 -mt-8 px-8 py-12 mb-8">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Quản lý Trips
                </h1>
                <p className="text-emerald-50">
                  Quản lý các chuyến đi cụ thể theo ngày
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="inline-flex items-center px-4 py-2 bg-white text-emerald-600 rounded-xl hover:bg-emerald-50 transition-colors">
                <Download className="w-5 h-5 mr-2" />
                Xuất báo cáo
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500 rounded-xl">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-emerald-100 text-sm">Tổng Trips</p>
                  <p className="text-2xl font-bold text-white">
                    {stats.totalTrips}
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
                  <p className="text-emerald-100 text-sm">Đã lên lịch</p>
                  <p className="text-2xl font-bold text-white">
                    {stats.scheduled}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-emerald-100 text-sm">Đã khởi hành</p>
                  <p className="text-2xl font-bold text-white">
                    {stats.departed}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-500 rounded-xl">
                  <XCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-emerald-100 text-sm">Đã hủy</p>
                  <p className="text-2xl font-bold text-white">
                    {stats.cancelled}
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
                  placeholder="Tìm kiếm theo mã trip, route, địa điểm..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                name="status"
                value={searchParams.status}
                onChange={handleSearchChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="scheduled">Đã lên lịch</option>
                <option value="boarding">Đang lên xe</option>
                <option value="departed">Đã khởi hành</option>
                <option value="arrived">Đã đến</option>
                <option value="delayed">Bị trễ</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>

            {/* From Date */}
            <div>
              <input
                type="date"
                name="from_date"
                value={searchParams.from_date}
                onChange={handleSearchChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            {/* To Date */}
            <div>
              <input
                type="date"
                name="to_date"
                value={searchParams.to_date}
                onChange={handleSearchChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
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
            searchParams.status ||
            searchParams.from_date ||
            searchParams.to_date) && (
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
              <Filter className="w-4 h-4" />
              <span>Đang hiển thị {filteredTrips.length} kết quả</span>
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

        {/* Trips Table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Danh sách Trips
              </h2>
              <span className="text-sm text-gray-500">
                Tổng số:{" "}
                {Array.isArray(filteredTrips) ? filteredTrips.length : 0}
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    Trip Code
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    Tuyến đường
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    Ngày & Giờ
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    Ghế
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    Giá
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
                ) : Array.isArray(filteredTrips) && filteredTrips.length > 0 ? (
                  currentItems.map((trip) => (
                    <tr key={trip.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {trip.trip_code}
                        </div>
                        <div className="text-sm text-gray-500">
                          {trip.company}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {trip.from_location} → {trip.to_location}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-sm text-gray-600 flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(trip.trip_date)}
                          </div>
                          <div className="text-sm text-gray-600 flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatTime(trip.departure_datetime)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">
                            {trip.available_seats}/{trip.total_seats}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Đã đặt: {trip.booked_seats}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {formatPrice(trip.price_override || 0)}
                        </div>
                        {trip.price_override && (
                          <div className="text-xs text-orange-600">
                            Giá đặc biệt
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(trip.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditTrip(trip)}
                            className="p-2 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit className="w-5 h-5 text-emerald-500" />
                          </button>
                          {trip.status !== "cancelled" &&
                            trip.status !== "arrived" && (
                              <button
                                onClick={() => handleCancelTrip(trip.id)}
                                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                title="Hủy chuyến"
                              >
                                <XCircle className="w-5 h-5 text-red-500" />
                              </button>
                            )}
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
                          Không tìm thấy trip nào
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
                  Array.isArray(filteredTrips) ? filteredTrips.length : 0
                )}{" "}
                trong số{" "}
                {Array.isArray(filteredTrips) ? filteredTrips.length : 0} trips
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

      {/* Edit Modal */}
      <EditModal />
    </div>
  );
};

export default TripManagement;
