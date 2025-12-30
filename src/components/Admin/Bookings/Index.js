import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Search,
  Loader2,
  DollarSign,
  Clock,
  CheckCircle,
  Package,
  Edit,
  Trash2,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import ConfirmDialog from "../../common/ConfirmDialog";
import BookingDetail from "./BookingDetail";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const AdminBookings = () => {
  const [loading, setLoading] = useState(false);

  // Bookings state
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    totalRevenue: 0,
  });
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    payment_status: "all",
    service_type: "all",
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

  // Detail state
  const [showDetail, setShowDetail] = useState(false);
  const [currentBooking, setCurrentBooking] = useState(null);

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
      const response = await fetch(`${API_URL}/api/bookings/admin/stats`);
      if (!response.ok) throw new Error("Failed to fetch stats");

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  // Fetch bookings
  const fetchBookings = async () => {
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
        `${API_URL}/api/bookings/admin/bookings?${params}`
      );
      if (!response.ok) throw new Error("Failed to fetch bookings");

      const data = await response.json();
      setBookings(data.bookings || []);

      // Ensure pagination is set correctly
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchStats();
  }, []);

  // Fetch bookings when filters change
  useEffect(() => {
    fetchBookings();
  }, [filters]);

  // Handle View
  const handleView = (booking) => {
    setCurrentBooking(booking);
    setShowDetail(true);
  };

  // Handle Detail Close
  const handleDetailClose = () => {
    setShowDetail(false);
    setCurrentBooking(null);
  };

  // Handle Quick Status Change
  const handleQuickStatusChange = async (bookingId, newStatus) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking || booking.status === newStatus) return;

    const statusLabels = {
      pending: "Chờ xác nhận",
      confirmed: "Đã xác nhận",
      completed: "Hoàn thành",
      cancelled: "Đã hủy",
    };

    setConfirmDialog({
      isOpen: true,
      title: "Xác nhận thay đổi trạng thái",
      message: `Bạn có chắc chắn muốn thay đổi trạng thái đơn hàng #${
        booking.id
      } từ "${statusLabels[booking.status]}" sang "${
        statusLabels[newStatus]
      }"?`,
      type: "warning",
      confirmText: "Xác nhận",
      cancelText: "Hủy",
      onConfirm: async () => {
        try {
          const response = await fetch(
            `${API_URL}/api/bookings/admin/bookings/${bookingId}/status`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: newStatus }),
            }
          );

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Failed to update status");
          }

          await fetchBookings();
          await fetchStats();
          toast.success("Đã cập nhật trạng thái thành công!");
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        } catch (error) {
          console.error("Error updating status:", error);
          toast.error(
            error.message || "Có lỗi xảy ra khi cập nhật trạng thái!"
          );
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }
      },
    });
  };

  // Handle Quick Payment Status Change
  const handleQuickPaymentChange = async (bookingId, newPaymentStatus) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking || booking.payment_status === newPaymentStatus) return;

    const paymentLabels = {
      pending: "Chưa thanh toán",
      paid: "Đã thanh toán",
      refunded: "Đã hoàn tiền",
      failed: "Thất bại",
    };

    setConfirmDialog({
      isOpen: true,
      title: "Xác nhận thay đổi thanh toán",
      message: `Bạn có chắc chắn muốn thay đổi trạng thái thanh toán đơn hàng #${
        booking.id
      } từ "${paymentLabels[booking.payment_status]}" sang "${
        paymentLabels[newPaymentStatus]
      }"?`,
      type: "warning",
      confirmText: "Xác nhận",
      cancelText: "Hủy",
      onConfirm: async () => {
        try {
          const response = await fetch(
            `${API_URL}/api/bookings/admin/bookings/${bookingId}/payment`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ payment_status: newPaymentStatus }),
            }
          );

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Failed to update payment status");
          }

          await fetchBookings();
          await fetchStats();
          toast.success("Đã cập nhật trạng thái thanh toán thành công!");
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        } catch (error) {
          console.error("Error updating payment status:", error);
          toast.error(
            error.message || "Có lỗi xảy ra khi cập nhật trạng thái thanh toán!"
          );
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }
      },
    });
  };

  // Handle Delete
  const handleDelete = (bookingId) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    setConfirmDialog({
      isOpen: true,
      title: "Xác nhận xóa đơn hàng",
      message: `Bạn có chắc chắn muốn xóa đơn hàng #${booking.id}?\n\n⚠️ Lưu ý: Hành động này không thể hoàn tác.`,
      type: "danger",
      confirmText: "Xóa",
      cancelText: "Hủy",
      onConfirm: async () => {
        try {
          const response = await fetch(
            `${API_URL}/api/bookings/admin/bookings/${bookingId}`,
            {
              method: "DELETE",
            }
          );

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Failed to delete booking");
          }

          await fetchBookings();
          await fetchStats();
          toast.success("Đã xóa đơn hàng thành công!");
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        } catch (error) {
          console.error("Error deleting booking:", error);
          toast.error(error.message || "Có lỗi xảy ra khi xóa đơn hàng!");
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }
      },
    });
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

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price || 0);
  };

  // eslint-disable-next-line no-unused-vars
  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
            Chờ xác nhận
          </span>
        );
      case "confirmed":
        return (
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
            Đã xác nhận
          </span>
        );
      case "cancelled":
        return (
          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
            Đã hủy
          </span>
        );
      case "completed":
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
            Hoàn thành
          </span>
        );
      default:
        return null;
    }
  };

  // eslint-disable-next-line no-unused-vars
  const getPaymentBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
            Chưa thanh toán
          </span>
        );
      case "paid":
        return (
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
            Đã thanh toán
          </span>
        );
      case "refunded":
        return (
          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
            Đã hoàn tiền
          </span>
        );
      case "failed":
        return (
          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
            Thất bại
          </span>
        );
      default:
        return null;
    }
  };

  // Get service info
  const getServiceInfo = (booking) => {
    if (booking.tour_title) {
      return {
        type: "Tour",
        name: booking.tour_title,
        location: booking.tour_location,
      };
    }
    if (booking.hotel_name) {
      return {
        type: "Khách sạn",
        name: booking.hotel_name,
        location: booking.hotel_location,
      };
    }
    if (booking.flight_airline) {
      return {
        type: "Chuyến bay",
        name: `${booking.flight_airline} - ${booking.flight_code || ""}`,
        location: `${booking.flight_from} → ${booking.flight_to}`,
      };
    }
    if (booking.transport_company) {
      return {
        type: "Vận chuyển",
        name: `${booking.transport_company} (${booking.transport_type})`,
        location: `${booking.transport_from} → ${booking.transport_to}`,
      };
    }
    return { type: "Không xác định", name: "", location: "" };
  };

  // If detail is shown, render detail
  if (showDetail) {
    return (
      <BookingDetail
        booking={currentBooking}
        onClose={handleDetailClose}
        onUpdate={async () => {
          await fetchBookings();
          await fetchStats();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with gradient */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 -mx-8 -mt-8 px-8 py-12 mb-8">
        <div className="max-w-screen-xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Quản lý Đơn hàng
                </h1>
                <p className="text-green-100 mt-1">
                  Quản lý tất cả đơn đặt dịch vụ
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm mb-1">Tổng đơn hàng</p>
                  <p className="text-3xl font-bold text-white">
                    {stats.totalBookings}
                  </p>
                </div>
                <div className="bg-white/10 p-3 rounded-lg">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm mb-1">Chờ xác nhận</p>
                  <p className="text-3xl font-bold text-white">
                    {stats.pendingBookings}
                  </p>
                </div>
                <div className="bg-white/10 p-3 rounded-lg">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm mb-1">Đã xác nhận</p>
                  <p className="text-3xl font-bold text-white">
                    {stats.confirmedBookings}
                  </p>
                </div>
                <div className="bg-white/10 p-3 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm mb-1">Tổng doanh thu</p>
                  <p className="text-2xl font-bold text-white">
                    {(stats.totalRevenue / 1000000).toFixed(1)}M đ
                  </p>
                </div>
                <div className="bg-white/10 p-3 rounded-lg">
                  <DollarSign className="w-6 h-6 text-white" />
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
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ xác nhận</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="cancelled">Đã hủy</option>
              <option value="completed">Hoàn thành</option>
            </select>

            {/* Payment Status Filter */}
            <select
              value={filters.payment_status}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  payment_status: e.target.value,
                  page: 1,
                })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">Tất cả thanh toán</option>
              <option value="pending">Chưa thanh toán</option>
              <option value="paid">Đã thanh toán</option>
              <option value="refunded">Đã hoàn tiền</option>
              <option value="failed">Thất bại</option>
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
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">Tất cả dịch vụ</option>
              <option value="tour">Tour</option>
              <option value="hotel">Khách sạn</option>
              <option value="flight">Chuyến bay</option>
              <option value="transport">Vận chuyển</option>
            </select>

            {/* Sort */}
            <select
              value={filters.sort_by}
              onChange={(e) =>
                setFilters({ ...filters, sort_by: e.target.value, page: 1 })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="created_desc">Mới nhất</option>
              <option value="created_asc">Cũ nhất</option>
              <option value="price_desc">Giá cao nhất</option>
              <option value="price_asc">Giá thấp nhất</option>
              <option value="booking_date_desc">Ngày đặt mới nhất</option>
              <option value="booking_date_asc">Ngày đặt cũ nhất</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!loading && bookings.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Không tìm thấy đơn hàng nào
            </h3>
            <p className="text-gray-500">
              Hãy thay đổi bộ lọc để xem kết quả khác
            </p>
          </div>
        )}

        {/* Bookings Table */}
        {!loading && bookings.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mã đơn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Khách hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dịch vụ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày đặt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tổng tiền
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thanh toán
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookings.map((booking) => {
                  const serviceInfo = getServiceInfo(booking);
                  return (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{booking.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {booking.customer_name || "Guest"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {booking.contact_email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {serviceInfo.type}
                        </div>
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {serviceInfo.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(booking.booking_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatPrice(booking.total_price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative group">
                          <select
                            value={booking.status}
                            onChange={(e) =>
                              handleQuickStatusChange(
                                booking.id,
                                e.target.value
                              )
                            }
                            className={`
                              appearance-none pr-8 pl-2 py-1 text-xs font-medium rounded cursor-pointer border-0 focus:ring-2 focus:ring-offset-1 transition-all
                              ${
                                booking.status === "pending"
                                  ? "bg-yellow-100 text-yellow-700 focus:ring-yellow-500"
                                  : booking.status === "confirmed"
                                  ? "bg-green-100 text-green-700 focus:ring-green-500"
                                  : booking.status === "cancelled"
                                  ? "bg-red-100 text-red-700 focus:ring-red-500"
                                  : "bg-blue-100 text-blue-700 focus:ring-blue-500"
                              }
                            `}
                          >
                            <option value="pending">Chờ xác nhận</option>
                            <option value="confirmed">Đã xác nhận</option>
                            <option value="completed">Hoàn thành</option>
                            <option value="cancelled">Đã hủy</option>
                          </select>
                          <ChevronDown
                            className={`
                              absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none
                              ${
                                booking.status === "pending"
                                  ? "text-yellow-700"
                                  : booking.status === "confirmed"
                                  ? "text-green-700"
                                  : booking.status === "cancelled"
                                  ? "text-red-700"
                                  : "text-blue-700"
                              }
                            `}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative group">
                          <select
                            value={booking.payment_status}
                            onChange={(e) =>
                              handleQuickPaymentChange(
                                booking.id,
                                e.target.value
                              )
                            }
                            className={`
                              appearance-none pr-8 pl-2 py-1 text-xs font-medium rounded cursor-pointer border-0 focus:ring-2 focus:ring-offset-1 transition-all
                              ${
                                booking.payment_status === "pending"
                                  ? "bg-yellow-100 text-yellow-700 focus:ring-yellow-500"
                                  : booking.payment_status === "paid"
                                  ? "bg-green-100 text-green-700 focus:ring-green-500"
                                  : booking.payment_status === "refunded"
                                  ? "bg-purple-100 text-purple-700 focus:ring-purple-500"
                                  : "bg-red-100 text-red-700 focus:ring-red-500"
                              }
                            `}
                          >
                            <option value="pending">Chưa thanh toán</option>
                            <option value="paid">Đã thanh toán</option>
                            <option value="refunded">Đã hoàn tiền</option>
                            <option value="failed">Thất bại</option>
                          </select>
                          <ChevronDown
                            className={`
                              absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none
                              ${
                                booking.payment_status === "pending"
                                  ? "text-yellow-700"
                                  : booking.payment_status === "paid"
                                  ? "text-green-700"
                                  : booking.payment_status === "refunded"
                                  ? "text-purple-700"
                                  : "text-red-700"
                              }
                            `}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleView(booking)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Xem & Sửa"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(booking.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Xóa"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && bookings.length > 0 && pagination.total > 0 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t">
            <p className="text-sm text-gray-600">
              Hiển thị {(pagination.page - 1) * pagination.limit + 1} -{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              trong tổng số {pagination.total} đơn hàng
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
                <span className="px-4 py-2 bg-green-50 text-green-600 rounded-lg font-medium">
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
      />
    </div>
  );
};

export default AdminBookings;
