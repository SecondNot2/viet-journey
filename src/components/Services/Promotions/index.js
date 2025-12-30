import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Tag,
  Star,
  Filter,
  ChevronRight,
  DollarSign,
  CalendarDays,
  Clock,
  Hotel,
  Plane,
  Bus,
  Users,
  MapPin,
} from "lucide-react";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
const PLACEHOLDER_IMAGE = `${API_URL}/images/placeholder.png`;

const serviceTypeOptions = [
  { id: "all", label: "Tất cả dịch vụ" },
  { id: "tour", label: "Tour du lịch" },
  { id: "hotel", label: "Khách sạn" },
  { id: "flight", label: "Vé máy bay" },
  { id: "transport", label: "Xe đưa đón" },
];

const statusOptions = [
  { id: "", label: "Tất cả trạng thái" },
  { id: "active", label: "Đang áp dụng" },
  { id: "inactive", label: "Ngừng áp dụng" },
];

const typeOptions = [
  { id: "", label: "Tất cả loại giảm giá" },
  { id: "percentage", label: "Theo phần trăm" },
  { id: "fixed", label: "Số tiền cố định" },
];

const Promotions = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: "",
    type: "",
  });

  // Hàm lấy danh sách khuyến mãi
  const fetchPromotions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_URL}/api/promotions`);
      let filteredPromotions = res.data;

      // Lọc dữ liệu ở phía client
      if (filters.status) {
        filteredPromotions = filteredPromotions.filter(
          (promo) => promo.status === filters.status
        );
      }
      if (filters.type) {
        filteredPromotions = filteredPromotions.filter(
          (promo) => promo.type === filters.type
        );
      }

      setPromotions(filteredPromotions);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Không thể tải danh sách dịch vụ giảm giá. Vui lòng thử lại sau."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
    // eslint-disable-next-line
  }, [filters]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* Hero Section */}
      <div className="bg-emerald-600 py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-white mb-4">
            Dịch vụ đang giảm giá
          </h1>
          <p className="text-emerald-50 text-lg max-w-2xl">
            Tổng hợp các dịch vụ du lịch, khách sạn, vé máy bay, vận chuyển đang
            có khuyến mãi hấp dẫn.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-8">
        {/* Filters Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Status Filter */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 text-gray-400" />
                Trạng thái
              </label>
              <div className="relative">
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="w-full p-3 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none bg-white hover:border-emerald-500 transition-colors"
                >
                  {statusOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronRight className="absolute right-3 top-1/2 transform -translate-y-1/2 rotate-90 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
            {/* Type Filter */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 text-gray-400" />
                Loại giảm giá
              </label>
              <div className="relative">
                <select
                  name="type"
                  value={filters.type}
                  onChange={handleFilterChange}
                  className="w-full p-3 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none bg-white hover:border-emerald-500 transition-colors"
                >
                  {typeOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronRight className="absolute right-3 top-1/2 transform -translate-y-1/2 rotate-90 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Danh sách dịch vụ giảm giá */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 text-lg">{error}</p>
            <button
              onClick={fetchPromotions}
              className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        ) : promotions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              Không có dịch vụ nào đang giảm giá.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {promotions.map((promo) => (
              <div
                key={promo.id}
                className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 block"
              >
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-4 h-4 text-emerald-500" />
                    <span className="font-semibold text-lg text-gray-900">
                      {promo.title}
                    </span>
                  </div>
                  <div className="text-gray-500 text-sm mb-2">
                    {promo.description}
                  </div>
                  <div className="flex items-center gap-4 mb-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-50 text-purple-600">
                      {promo.type === "percentage"
                        ? `Giảm ${promo.discount}%`
                        : `Giảm ${formatPrice(promo.discount)}`}
                    </span>
                    {promo.max_discount_value && (
                      <span className="text-xs text-gray-500">
                        Tối đa: {formatPrice(promo.max_discount_value)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <CalendarDays className="w-4 h-4" />
                    {`Từ ${promo.start_date} đến ${promo.end_date}`}
                  </div>
                  <div className="flex items-center gap-4 text-sm mt-2">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        promo.is_expired
                          ? "bg-red-50 text-red-600"
                          : promo.status === "active"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-gray-50 text-gray-600"
                      }`}
                    >
                      {promo.is_expired
                        ? "Đã hết hạn"
                        : promo.status === "active"
                        ? "Đang áp dụng"
                        : "Ngừng áp dụng"}
                    </span>
                    {promo.usage_limit && (
                      <span className="text-xs text-gray-500">
                        Còn lại: {promo.remaining_usage} lượt sử dụng
                      </span>
                    )}
                  </div>
                </div>
                {/* Thông tin dịch vụ áp dụng */}
                <div className="p-6">
                  <div className="font-semibold text-gray-800 mb-2">
                    Dịch vụ áp dụng:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {promo.is_global ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        Tất cả dịch vụ
                      </span>
                    ) : (
                      <>
                        {promo.services?.map((service) => (
                          <span
                            key={service.id}
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              service.type === "tour"
                                ? "bg-blue-50 text-blue-600"
                                : service.type === "hotel"
                                ? "bg-yellow-50 text-yellow-600"
                                : service.type === "flight"
                                ? "bg-cyan-50 text-cyan-600"
                                : "bg-green-50 text-green-600"
                            }`}
                          >
                            {service.type === "tour"
                              ? "Tour du lịch"
                              : service.type === "hotel"
                              ? "Khách sạn"
                              : service.type === "flight"
                              ? "Vé máy bay"
                              : "Xe đưa đón"}
                          </span>
                        ))}
                      </>
                    )}
                  </div>
                  {!promo.is_global && (
                    <div className="mt-4 text-sm text-gray-500">
                      Tổng số dịch vụ áp dụng: {promo.services?.length || 0}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Promotions;
