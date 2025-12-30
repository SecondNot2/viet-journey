import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Calendar,
  Star,
  MapPin,
  Plane,
  Building2,
  Bus,
  Compass,
  FileText,
  Tag,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const COLORS = {
  tour: "#3b82f6", // blue
  hotel: "#10b981", // green
  flight: "#8b5cf6", // purple
  transport: "#f59e0b", // yellow
  pending: "#fbbf24", // yellow
  confirmed: "#10b981", // green
  cancelled: "#ef4444", // red
  completed: "#3b82f6", // blue
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(7); // Default 7 days
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalBookings: 0,
    totalRevenue: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    activeTours: 0,
    activeHotels: 0,
    activeFlights: 0,
    activeTransports: 0,
    totalDestinations: 0,
    totalBlogs: 0,
    totalPromotions: 0,
    totalReviews: 0,
    avgRating: 0,
  });
  const [analytics, setAnalytics] = useState({
    revenueByService: [],
    bookingsByStatus: [],
    revenueTrend: [],
    bookingsTrend: [],
    topServices: [],
  });
  const [detailedAnalytics, setDetailedAnalytics] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Fetch all stats
  const fetchStats = async () => {
    try {
      setLoading(true);

      // Fetch stats from all modules
      const [
        usersRes,
        bookingsRes,
        toursRes,
        hotelsRes,
        flightsRes,
        transportRes,
        destinationsRes,
        blogsRes,
        promotionsRes,
        reviewsRes,
        analyticsRes,
      ] = await Promise.all([
        fetch(`${API_URL}/api/users/admin/stats`),
        fetch(`${API_URL}/api/bookings/admin/stats`),
        fetch(`${API_URL}/api/tours/admin/stats`),
        fetch(`${API_URL}/api/hotels/admin/stats`),
        fetch(`${API_URL}/api/flights/admin/stats`),
        fetch(`${API_URL}/api/transport/admin/stats`),
        fetch(`${API_URL}/api/destinations/admin/stats`),
        fetch(`${API_URL}/api/blogs/admin/stats`),
        fetch(`${API_URL}/api/promotions/admin/stats`),
        fetch(`${API_URL}/api/reviews/admin/stats`),
        fetch(`${API_URL}/api/bookings/admin/analytics?days=${dateRange}`),
      ]);

      const [
        usersData,
        bookingsData,
        toursData,
        hotelsData,
        flightsData,
        transportData,
        destinationsData,
        blogsData,
        promotionsData,
        reviewsData,
        analyticsData,
      ] = await Promise.all([
        usersRes.json(),
        bookingsRes.json(),
        toursRes.json(),
        hotelsRes.json(),
        flightsRes.json(),
        transportRes.json(),
        destinationsRes.json(),
        blogsRes.json(),
        promotionsRes.json(),
        reviewsRes.json(),
        analyticsRes.json(),
      ]);

      setStats({
        totalUsers: usersData.totalUsers || 0,
        activeUsers: usersData.activeUsers || 0,
        totalBookings: bookingsData.totalBookings || 0,
        totalRevenue: bookingsData.totalRevenue || 0,
        pendingBookings: bookingsData.pendingBookings || 0,
        confirmedBookings: bookingsData.confirmedBookings || 0,
        activeTours: toursData.activeTours || 0,
        activeHotels: hotelsData.activeHotels || 0,
        activeFlights: flightsData.activeRoutes || 0,
        activeTransports: transportData.activeRoutes || 0,
        totalDestinations: destinationsData.totalDestinations || 0,
        totalBlogs: blogsData.totalBlogs || 0,
        totalPromotions: promotionsData.totalPromotions || 0,
        totalReviews: reviewsData.totalReviews || 0,
        avgRating: reviewsData.avgRating || 0,
      });

      setAnalytics(analyticsData);

      // Fetch detailed analytics
      const detailedRes = await fetch(
        `${API_URL}/api/bookings/admin/analytics/detailed?days=${dateRange}`
      );
      const detailedData = await detailedRes.json();
      setDetailedAnalytics(detailedData);

      // Fetch comparison
      const comparisonRes = await fetch(
        `${API_URL}/api/bookings/admin/analytics/comparison?days=${dateRange}`
      );
      const comparisonData = await comparisonRes.json();
      setComparison(comparisonData);

      // Update last updated time
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("Không thể tải thống kê");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Manual refresh function
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    toast.loading("Đang cập nhật dữ liệu...", { id: "refresh" });
    await fetchStats();
    await fetchRecentBookings();
    await fetchRecentReviews();
    toast.success("Đã cập nhật dữ liệu mới nhất!", { id: "refresh" });
  };

  // Fetch recent bookings
  const fetchRecentBookings = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/bookings/admin/bookings?limit=5&sort_by=created_desc`
      );
      if (!response.ok) throw new Error("Failed to fetch bookings");

      const data = await response.json();
      setRecentBookings(data.bookings || []);
    } catch (error) {
      console.error("Error fetching recent bookings:", error);
    }
  };

  // Fetch recent reviews
  const fetchRecentReviews = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/reviews/admin/reviews?limit=5&sort_by=created_desc`
      );
      if (!response.ok) throw new Error("Failed to fetch reviews");

      const data = await response.json();
      setRecentReviews(data.reviews || []);
    } catch (error) {
      console.error("Error fetching recent reviews:", error);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchRecentBookings();
    fetchRecentReviews();
  }, [dateRange]); // Refetch when dateRange changes

  // Auto refresh timer
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      console.log("Auto-refreshing dashboard data...");
      fetchStats();
      fetchRecentBookings();
      fetchRecentReviews();
    }, 60000); // Refresh every 60 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, dateRange]);

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${day}/${month}`;
  };

  // Get service info from booking
  const getServiceInfo = (booking) => {
    if (booking.tour_title) {
      return { type: "Tour", name: booking.tour_title };
    }
    if (booking.hotel_name) {
      return { type: "Khách sạn", name: booking.hotel_name };
    }
    if (booking.flight_airline) {
      return { type: "Chuyến bay", name: `${booking.flight_airline}` };
    }
    if (booking.transport_company) {
      return { type: "Vận chuyển", name: booking.transport_company };
    }
    return { type: "Không xác định", name: "" };
  };

  // Prepare chart data
  const prepareRevenueByServiceData = () => {
    return analytics.revenueByService.map((item) => ({
      name:
        item.service_type === "tour"
          ? "Tours"
          : item.service_type === "hotel"
          ? "Khách sạn"
          : item.service_type === "flight"
          ? "Chuyến bay"
          : item.service_type === "transport"
          ? "Vận chuyển"
          : item.service_type,
      revenue: parseFloat(item.revenue), // Keep original VND value
      count: item.count,
    }));
  };

  const prepareBookingsByStatusData = () => {
    return analytics.bookingsByStatus.map((item) => ({
      name:
        item.status === "pending"
          ? "Chờ xác nhận"
          : item.status === "confirmed"
          ? "Đã xác nhận"
          : item.status === "cancelled"
          ? "Đã hủy"
          : item.status === "completed"
          ? "Hoàn thành"
          : item.status,
      value: item.count,
      color: COLORS[item.status] || "#6b7280",
    }));
  };

  const prepareRevenueTrendData = () => {
    // Sort by date ascending and format
    return analytics.revenueTrend
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((item) => ({
        date: formatDate(item.date),
        revenue: parseFloat(item.revenue), // Keep original value (VND)
        bookings: item.bookings,
      }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header with Date Range Filter */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-gray-500">
                Chào mừng trở lại! Đây là tổng quan về hệ thống.
              </p>
              <span className="text-xs text-gray-400">
                • Cập nhật lúc:{" "}
                {lastUpdated.toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            {/* Manual Refresh Button */}
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              title="Làm mới dữ liệu"
            >
              <RefreshCw
                className={`w-4 h-4 text-gray-600 ${
                  isRefreshing ? "animate-spin" : ""
                }`}
              />
              <span className="text-sm font-medium text-gray-700">Làm mới</span>
            </button>

            {/* Auto Refresh Toggle */}
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border shadow-sm transition-all ${
                autoRefresh
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-white border-gray-200"
              }`}
            >
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => {
                    setAutoRefresh(e.target.checked);
                    if (e.target.checked) {
                      toast.success("Auto-refresh đã bật (mỗi 60s)", {
                        icon: "🔄",
                      });
                    } else {
                      toast("Auto-refresh đã tắt", { icon: "⏸️" });
                    }
                  }}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                />
                <span
                  className={`text-sm font-medium flex items-center gap-1 ${
                    autoRefresh ? "text-emerald-700" : "text-gray-700"
                  }`}
                >
                  Auto-refresh (60s)
                  {autoRefresh && (
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  )}
                </span>
              </label>
            </div>

            {/* Date Range Filter */}
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
              <Calendar className="w-4 h-4 text-gray-500" />
              <select
                value={dateRange}
                onChange={(e) => {
                  setDateRange(parseInt(e.target.value));
                  setLoading(true);
                }}
                className="border-none bg-transparent text-sm font-medium text-gray-700 focus:ring-0 focus:outline-none cursor-pointer"
              >
                <option value={7}>7 ngày qua</option>
                <option value={14}>14 ngày qua</option>
                <option value={30}>30 ngày qua</option>
                <option value={60}>60 ngày qua</option>
                <option value={90}>90 ngày qua</option>
                <option value={180}>6 tháng qua</option>
                <option value={365}>1 năm qua</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Users */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 p-3 rounded-lg">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
              {stats.activeUsers} active
            </span>
          </div>
          <h3 className="text-3xl font-bold mb-1">{stats.totalUsers}</h3>
          <p className="text-blue-100 text-sm">Tổng người dùng</p>
        </div>

        {/* Total Bookings */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 p-3 rounded-lg">
              <BookOpen className="w-6 h-6" />
            </div>
            {stats.pendingBookings > 0 && (
              <span className="text-sm font-medium bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full">
                {stats.pendingBookings} chờ
              </span>
            )}
          </div>
          <h3 className="text-3xl font-bold mb-1">{stats.totalBookings}</h3>
          <p className="text-green-100 text-sm">Tổng đơn hàng</p>
        </div>

        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 p-3 rounded-lg">
              <DollarSign className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Paid
            </span>
          </div>
          <h3 className="text-3xl font-bold mb-1">
            {(stats.totalRevenue / 1000000).toFixed(1)}M
          </h3>
          <p className="text-purple-100 text-sm">Doanh thu (đ)</p>
        </div>

        {/* Average Rating */}
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 p-3 rounded-lg">
              <Star className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
              {stats.totalReviews} reviews
            </span>
          </div>
          <h3 className="text-3xl font-bold mb-1">
            {(stats.avgRating || 0).toFixed(1)}/5.0
          </h3>
          <p className="text-yellow-100 text-sm">Đánh giá trung bình</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Trend Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Doanh thu {dateRange} ngày qua
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={prepareRevenueTrendData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
              <YAxis
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
                formatter={(value, name) => [
                  name === "revenue"
                    ? new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(value)
                    : value,
                  name === "revenue" ? "Doanh thu" : "Đơn hàng",
                ]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#8b5cf6"
                strokeWidth={2}
                name="Doanh thu"
              />
              <Line
                type="monotone"
                dataKey="bookings"
                stroke="#10b981"
                strokeWidth={2}
                name="Số đơn"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bookings by Status Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Trạng thái đơn hàng
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={prepareBookingsByStatusData()}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {prepareBookingsByStatusData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue by Service Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Doanh thu theo dịch vụ
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={prepareRevenueByServiceData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
              <YAxis
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
                formatter={(value) => [
                  new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(value),
                  "Doanh thu",
                ]}
              />
              <Legend />
              <Bar dataKey="revenue" fill="#3b82f6" name="Doanh thu" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Stats Grid */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Thống kê nhanh
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
              <div className="bg-yellow-100 p-2 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-900">
                  {stats.pendingBookings}
                </p>
                <p className="text-xs text-yellow-600">Chờ xác nhận</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <div className="bg-green-100 p-2 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-900">
                  {stats.confirmedBookings}
                </p>
                <p className="text-xs text-green-600">Đã xác nhận</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Compass className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-900">
                  {stats.activeTours}
                </p>
                <p className="text-xs text-blue-600">Tours hoạt động</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Building2 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-900">
                  {stats.activeHotels}
                </p>
                <p className="text-xs text-purple-600">Khách sạn</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Services Stats */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Dịch vụ</h2>
          <div className="space-y-3">
            <div
              className="flex items-center justify-between p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
              onClick={() => navigate("/admin/tours")}
            >
              <div className="flex items-center gap-3">
                <Compass className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-900">Tours</span>
              </div>
              <span className="text-sm font-semibold text-blue-600">
                {stats.activeTours}
              </span>
            </div>

            <div
              className="flex items-center justify-between p-3 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
              onClick={() => navigate("/admin/hotels")}
            >
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-900">Khách sạn</span>
              </div>
              <span className="text-sm font-semibold text-green-600">
                {stats.activeHotels}
              </span>
            </div>

            <div
              className="flex items-center justify-between p-3 bg-purple-50 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors"
              onClick={() => navigate("/admin/flights")}
            >
              <div className="flex items-center gap-3">
                <Plane className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-gray-900">Chuyến bay</span>
              </div>
              <span className="text-sm font-semibold text-purple-600">
                {stats.activeFlights}
              </span>
            </div>

            <div
              className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg cursor-pointer hover:bg-yellow-100 transition-colors"
              onClick={() => navigate("/admin/transport")}
            >
              <div className="flex items-center gap-3">
                <Bus className="w-5 h-5 text-yellow-600" />
                <span className="font-medium text-gray-900">Vận chuyển</span>
              </div>
              <span className="text-sm font-semibold text-yellow-600">
                {stats.activeTransports}
              </span>
            </div>
          </div>
        </div>

        {/* Content Stats */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Nội dung</h2>
          <div className="space-y-3">
            <div
              className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg cursor-pointer hover:bg-indigo-100 transition-colors"
              onClick={() => navigate("/admin/destinations")}
            >
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-indigo-600" />
                <span className="font-medium text-gray-900">Điểm đến</span>
              </div>
              <span className="text-sm font-semibold text-indigo-600">
                {stats.totalDestinations}
              </span>
            </div>

            <div
              className="flex items-center justify-between p-3 bg-pink-50 rounded-lg cursor-pointer hover:bg-pink-100 transition-colors"
              onClick={() => navigate("/admin/posts")}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-pink-600" />
                <span className="font-medium text-gray-900">Bài viết</span>
              </div>
              <span className="text-sm font-semibold text-pink-600">
                {stats.totalBlogs}
              </span>
            </div>

            <div
              className="flex items-center justify-between p-3 bg-orange-50 rounded-lg cursor-pointer hover:bg-orange-100 transition-colors"
              onClick={() => navigate("/admin/promotions")}
            >
              <div className="flex items-center gap-3">
                <Tag className="w-5 h-5 text-orange-600" />
                <span className="font-medium text-gray-900">Khuyến mãi</span>
              </div>
              <span className="text-sm font-semibold text-orange-600">
                {stats.totalPromotions}
              </span>
            </div>

            <div
              className="flex items-center justify-between p-3 bg-teal-50 rounded-lg cursor-pointer hover:bg-teal-100 transition-colors"
              onClick={() => navigate("/admin/reviews")}
            >
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-teal-600" />
                <span className="font-medium text-gray-900">Đánh giá</span>
              </div>
              <span className="text-sm font-semibold text-teal-600">
                {stats.totalReviews}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Bookings */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Đơn hàng gần đây
            </h2>
            <button
              onClick={() => navigate("/admin/bookings")}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Xem tất cả
            </button>
          </div>

          <div className="space-y-3">
            {recentBookings.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                Chưa có đơn hàng nào
              </p>
            ) : (
              recentBookings.map((booking) => {
                const serviceInfo = getServiceInfo(booking);
                return (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => navigate("/admin/bookings")}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {booking.customer_name || "Guest"} - {serviceInfo.type}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(booking.booking_date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(booking.total_price)}
                      </p>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          booking.status === "confirmed"
                            ? "bg-green-100 text-green-700"
                            : booking.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {booking.status === "confirmed"
                          ? "Đã xác nhận"
                          : booking.status === "pending"
                          ? "Chờ xác nhận"
                          : booking.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Reviews */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Đánh giá gần đây
            </h2>
            <button
              onClick={() => navigate("/admin/reviews")}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Xem tất cả
            </button>
          </div>

          <div className="space-y-3">
            {recentReviews.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                Chưa có đánh giá nào
              </p>
            ) : (
              recentReviews.map((review) => (
                <div
                  key={review.id}
                  className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => navigate("/admin/reviews")}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-900">
                      {review.username || "Anonymous"}
                    </p>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < (review.rating || 0)
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {review.comment}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDate(review.created_at)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Toggle Detailed View Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowDetailedView(!showDetailedView)}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg font-medium flex items-center justify-center gap-2"
        >
          {showDetailedView ? "Ẩn" : "Xem"} Thống Kê Chi Tiết
          <TrendingUp className="w-5 h-5" />
        </button>
      </div>

      {/* Detailed Analytics Section */}
      {showDetailedView && detailedAnalytics && comparison && (
        <div className="space-y-8">
          {/* Comparison KPIs */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-sm p-6 border border-indigo-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-indigo-600" />
              So sánh với kỳ trước ({dateRange} ngày)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Bookings Growth */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-xs text-gray-500 mb-1">Đơn hàng</p>
                <p className="text-2xl font-bold text-gray-900">
                  {comparison.current.bookings}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  {parseFloat(comparison.growth.bookings) >= 0 ? (
                    <ArrowUpRight className="w-4 h-4 text-green-600" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-600" />
                  )}
                  <span
                    className={`text-sm font-semibold ${
                      parseFloat(comparison.growth.bookings) >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {comparison.growth.bookings}%
                  </span>
                </div>
              </div>

              {/* Revenue Growth */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-xs text-gray-500 mb-1">Doanh thu</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(comparison.current.revenue / 1000000).toFixed(1)}M
                </p>
                <div className="flex items-center gap-1 mt-2">
                  {parseFloat(comparison.growth.revenue) >= 0 ? (
                    <ArrowUpRight className="w-4 h-4 text-green-600" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-600" />
                  )}
                  <span
                    className={`text-sm font-semibold ${
                      parseFloat(comparison.growth.revenue) >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {comparison.growth.revenue}%
                  </span>
                </div>
              </div>

              {/* AOV Growth */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-xs text-gray-500 mb-1">Giá trị TB/đơn</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(comparison.current.avgOrderValue / 1000).toFixed(0)}K
                </p>
                <div className="flex items-center gap-1 mt-2">
                  {parseFloat(comparison.growth.avgOrderValue) >= 0 ? (
                    <ArrowUpRight className="w-4 h-4 text-green-600" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-600" />
                  )}
                  <span
                    className={`text-sm font-semibold ${
                      parseFloat(comparison.growth.avgOrderValue) >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {comparison.growth.avgOrderValue}%
                  </span>
                </div>
              </div>

              {/* Conversion Rate */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-xs text-gray-500 mb-1">Tỷ lệ chuyển đổi</p>
                <p className="text-2xl font-bold text-gray-900">
                  {detailedAnalytics.summary.conversionRate}%
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {detailedAnalytics.summary.confirmedBookings}/
                  {detailedAnalytics.summary.totalBookings}
                </p>
              </div>

              {/* Cancellation Rate */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-xs text-gray-500 mb-1">Tỷ lệ hủy</p>
                <p className="text-2xl font-bold text-gray-900">
                  {detailedAnalytics.summary.cancellationRate}%
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {detailedAnalytics.summary.cancelledBookings} đơn
                </p>
              </div>
            </div>
          </div>

          {/* Service Details Table */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Thống kê chi tiết theo dịch vụ
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Dịch vụ
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                      Tổng đơn
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                      Đã thanh toán
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                      Chờ thanh toán
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                      Mất mát (Hủy)
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                      Giá TB
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                      Min - Max
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {detailedAnalytics.serviceDetails.map((service) => (
                    <tr
                      key={service.service_type}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900">
                          {service.service_type === "tour"
                            ? "Tours"
                            : service.service_type === "hotel"
                            ? "Khách sạn"
                            : service.service_type === "flight"
                            ? "Chuyến bay"
                            : service.service_type === "transport"
                            ? "Vận chuyển"
                            : service.service_type}
                        </span>
                      </td>
                      <td className="text-right py-3 px-4 text-sm text-gray-900">
                        {service.total_bookings}
                      </td>
                      <td className="text-right py-3 px-4 text-sm">
                        <span className="text-green-600 font-semibold">
                          {formatCurrency(service.paid_revenue)}
                        </span>
                      </td>
                      <td className="text-right py-3 px-4 text-sm">
                        <span className="text-yellow-600 font-semibold">
                          {formatCurrency(service.pending_revenue)}
                        </span>
                      </td>
                      <td className="text-right py-3 px-4 text-sm">
                        <span className="text-red-600 font-semibold">
                          {formatCurrency(service.lost_revenue)}
                        </span>
                      </td>
                      <td className="text-right py-3 px-4 text-sm text-gray-900">
                        {formatCurrency(service.avg_paid_order)}
                      </td>
                      <td className="text-right py-3 px-4 text-xs text-gray-500">
                        {(service.min_order / 1000).toFixed(0)}K -{" "}
                        {(service.max_order / 1000000).toFixed(1)}M
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Performers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Tours */}
            {detailedAnalytics.topPerformers.tours.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Compass className="w-5 h-5 text-blue-600" />
                  Top Tours
                </h3>
                <div className="space-y-3">
                  {detailedAnalytics.topPerformers.tours
                    .slice(0, 5)
                    .map((tour, index) => (
                      <div
                        key={tour.id}
                        className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                            {index + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {tour.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              {tour.bookings} đơn
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-blue-600">
                            {(parseFloat(tour.revenue) / 1000000).toFixed(1)}M
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Top Hotels */}
            {detailedAnalytics.topPerformers.hotels.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-green-600" />
                  Top Khách sạn
                </h3>
                <div className="space-y-3">
                  {detailedAnalytics.topPerformers.hotels
                    .slice(0, 5)
                    .map((hotel, index) => (
                      <div
                        key={hotel.id}
                        className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm font-bold text-green-600">
                            {index + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {hotel.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {hotel.bookings} đơn
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-green-600">
                            {(parseFloat(hotel.revenue) / 1000000).toFixed(1)}M
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Top Flights */}
            {detailedAnalytics.topPerformers.flights.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Plane className="w-5 h-5 text-purple-600" />
                  Top Chuyến bay
                </h3>
                <div className="space-y-3">
                  {detailedAnalytics.topPerformers.flights
                    .slice(0, 5)
                    .map((flight, index) => (
                      <div
                        key={`${flight.airline}-${index}`}
                        className="flex items-center justify-between p-3 bg-purple-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <span className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-sm font-bold text-purple-600">
                            {index + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {flight.airline}
                            </p>
                            <p className="text-xs text-gray-500">
                              {flight.from_location} → {flight.to_location} (
                              {flight.bookings} đơn)
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-purple-600">
                            {(parseFloat(flight.revenue) / 1000000).toFixed(1)}M
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Top Transports */}
            {detailedAnalytics.topPerformers.transports.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Bus className="w-5 h-5 text-yellow-600" />
                  Top Vận chuyển
                </h3>
                <div className="space-y-3">
                  {detailedAnalytics.topPerformers.transports
                    .slice(0, 5)
                    .map((transport, index) => (
                      <div
                        key={`${transport.company}-${index}`}
                        className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <span className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center text-sm font-bold text-yellow-600">
                            {index + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {transport.company}
                            </p>
                            <p className="text-xs text-gray-500">
                              {transport.from_location} →{" "}
                              {transport.to_location} ({transport.bookings} đơn)
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-yellow-600">
                            {(parseFloat(transport.revenue) / 1000000).toFixed(
                              1
                            )}
                            M
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Hourly Distribution Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Phân bố đặt hàng theo giờ
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={detailedAnalytics.hourlyDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="hour"
                  stroke="#6b7280"
                  fontSize={12}
                  tickFormatter={(hour) => `${hour}h`}
                />
                <YAxis yAxisId="left" stroke="#6b7280" fontSize={12} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#6b7280"
                  fontSize={12}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                  formatter={(value, name) => [
                    name === "revenue"
                      ? `${(value / 1000000).toFixed(1)}M đ`
                      : value,
                    name === "revenue" ? "Doanh thu" : "Đơn hàng",
                  ]}
                />
                <Legend />
                <Bar
                  dataKey="bookings"
                  fill="#3b82f6"
                  name="Đơn hàng"
                  yAxisId="left"
                />
                <Bar
                  dataKey="revenue"
                  fill="#10b981"
                  name="Doanh thu (đ)"
                  yAxisId="right"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Daily Breakdown Table */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Chi tiết theo ngày
              </h2>
              <button
                onClick={() => {
                  // Export CSV functionality
                  const csv = [
                    [
                      "Ngày",
                      "Dịch vụ",
                      "Tổng đơn",
                      "Xác nhận",
                      "Hoàn thành",
                      "Hủy",
                      "Chờ",
                      "Doanh thu",
                      "Chờ thanh toán",
                      "Giá TB",
                    ],
                    ...detailedAnalytics.dailyBreakdown.map((row) => [
                      row.date,
                      row.service_type,
                      row.total_bookings,
                      row.confirmed_bookings,
                      row.completed_bookings,
                      row.cancelled_bookings,
                      row.pending_bookings,
                      parseFloat(row.paid_revenue).toFixed(2),
                      parseFloat(row.pending_revenue).toFixed(2),
                      parseFloat(row.avg_order_value).toFixed(2),
                    ]),
                  ]
                    .map((row) => row.join(","))
                    .join("\n");

                  const blob = new Blob(["\uFEFF" + csv], {
                    type: "text/csv;charset=utf-8;",
                  });
                  const link = document.createElement("a");
                  link.href = URL.createObjectURL(blob);
                  link.download = `analytics_${
                    new Date().toISOString().split("T")[0]
                  }.csv`;
                  link.click();
                  toast.success("Đã xuất file CSV");
                }}
                className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Xuất CSV
              </button>
            </div>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50">
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">
                      Ngày
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">
                      Dịch vụ
                    </th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-gray-700">
                      Tổng đơn
                    </th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-gray-700">
                      Xác nhận
                    </th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-gray-700">
                      Hoàn thành
                    </th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-gray-700">
                      Hủy
                    </th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-gray-700">
                      Doanh thu
                    </th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-gray-700">
                      Giá TB
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {detailedAnalytics.dailyBreakdown.map((row, index) => (
                    <tr
                      key={`${row.date}-${row.service_type}`}
                      className={`border-b border-gray-100 ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <td className="py-2 px-3 text-xs text-gray-900">
                        {new Date(row.date).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="py-2 px-3 text-xs">
                        <span
                          className={`px-2 py-1 rounded ${
                            row.service_type === "tour"
                              ? "bg-blue-100 text-blue-700"
                              : row.service_type === "hotel"
                              ? "bg-green-100 text-green-700"
                              : row.service_type === "flight"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {row.service_type === "tour"
                            ? "Tour"
                            : row.service_type === "hotel"
                            ? "Hotel"
                            : row.service_type === "flight"
                            ? "Flight"
                            : "Transport"}
                        </span>
                      </td>
                      <td className="text-right py-2 px-3 text-xs font-semibold text-gray-900">
                        {row.total_bookings}
                      </td>
                      <td className="text-right py-2 px-3 text-xs text-green-600">
                        {row.confirmed_bookings}
                      </td>
                      <td className="text-right py-2 px-3 text-xs text-blue-600">
                        {row.completed_bookings}
                      </td>
                      <td className="text-right py-2 px-3 text-xs text-red-600">
                        {row.cancelled_bookings}
                      </td>
                      <td className="text-right py-2 px-3 text-xs font-semibold text-gray-900">
                        {(parseFloat(row.paid_revenue) / 1000).toFixed(0)}K
                      </td>
                      <td className="text-right py-2 px-3 text-xs text-gray-600">
                        {(parseFloat(row.avg_order_value) / 1000).toFixed(0)}K
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
