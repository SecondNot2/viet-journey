import { API_URL, API_HOST } from "../../../config/api";
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle,
  Plane,
  MapPin,
  Clock,
  DollarSign,
  Calendar,
  Image as ImageIcon,
} from "lucide-react";



const RouteForm = ({ route, onClose, onSave, viewMode: initialViewMode }) => {
  const [viewMode, setViewMode] = useState(initialViewMode);
  const [formData, setFormData] = useState({
    route_code: "",
    flight_number: "",
    airline: "",
    airline_image: "",
    from_location: "",
    to_location: "",
    aircraft: "",
    trip_type: "one_way",
    departure_time: "",
    arrival_time: "",
    duration: "",
    base_price: "",
    seat_classes: {
      economy: { seats: 120, price_multiplier: 1.0 },
      premium_economy: { seats: 30, price_multiplier: 1.5 },
      business: { seats: 20, price_multiplier: 2.5 },
      first: { seats: 10, price_multiplier: 4.0 },
    },
    baggage: {
      cabin: "7 kg",
      checked: "23 kg",
    },
    amenities: [],
    operating_days: [0, 1, 2, 3, 4, 5, 6],
    operating_months: null,
    status: "active",
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const amenitiesOptions = [
    { value: "meal", label: "Suất ăn" },
    { value: "wifi", label: "WiFi" },
    { value: "power", label: "Sạc điện" },
    { value: "entertainment", label: "Giải trí" },
    { value: "lounge", label: "Phòng chờ VIP" },
  ];

  const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const airlines = [
    "Vietnam Airlines",
    "Vietjet Air",
    "Bamboo Airways",
    "Vietravel Airlines",
    "Pacific Airlines",
  ];

  // Safe JSON parse helper
  const safeJSONParse = (value, fallback) => {
    if (!value) return fallback || [];
    if (Array.isArray(value)) return value;
    if (typeof value === "object") return value;
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch (error) {
        console.error("Error parsing JSON:", error);
        return fallback || [];
      }
    }
    return fallback || [];
  };

  useEffect(() => {
    if (route) {
      // Parse JSON fields safely
      const operating_days = safeJSONParse(
        route.operating_days,
        [0, 1, 2, 3, 4, 5, 6]
      );

      const operating_months = route.operating_months
        ? safeJSONParse(route.operating_months, null)
        : null;

      const amenities = safeJSONParse(route.amenities, []);

      const seat_classes = route.seat_classes
        ? safeJSONParse(route.seat_classes, formData.seat_classes)
        : formData.seat_classes;

      const baggage = route.baggage
        ? safeJSONParse(route.baggage, formData.baggage)
        : formData.baggage;

      setFormData({
        route_code: route.route_code || "",
        flight_number: route.flight_number || "",
        airline: route.airline || "",
        airline_image: route.airline_image || "",
        from_location: route.from_location || "",
        to_location: route.to_location || "",
        aircraft: route.aircraft || "",
        trip_type: route.trip_type || "one_way",
        departure_time: route.departure_time || "",
        arrival_time: route.arrival_time || "",
        duration: route.duration || "",
        base_price: route.base_price || "",
        seat_classes,
        baggage,
        amenities,
        operating_days,
        operating_months,
        status: route.status || "active",
      });
    }
  }, [route]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleOperatingDayToggle = (day) => {
    setFormData((prev) => {
      const days = [...prev.operating_days];
      const index = days.indexOf(day);
      if (index > -1) {
        days.splice(index, 1);
      } else {
        days.push(day);
        days.sort((a, b) => a - b);
      }
      return { ...prev, operating_days: days };
    });
  };

  const handleAmenityToggle = (amenity) => {
    setFormData((prev) => {
      const amenities = [...prev.amenities];
      const index = amenities.indexOf(amenity);
      if (index > -1) {
        amenities.splice(index, 1);
      } else {
        amenities.push(amenity);
      }
      return { ...prev, amenities };
    });
  };

  const handleSeatClassChange = (seatClass, field, value) => {
    setFormData((prev) => ({
      ...prev,
      seat_classes: {
        ...prev.seat_classes,
        [seatClass]: {
          ...prev.seat_classes[seatClass],
          [field]:
            field === "seats" ? parseInt(value) || 0 : parseFloat(value) || 1.0,
        },
      },
    }));
  };

  const handleBaggageChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      baggage: {
        ...prev.baggage,
        [field]: value,
      },
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.flight_number.trim()) {
      newErrors.flight_number = "Vui lòng nhập mã chuyến bay";
    }

    if (!formData.airline.trim()) {
      newErrors.airline = "Vui lòng chọn hãng bay";
    }

    if (!formData.from_location.trim()) {
      newErrors.from_location = "Vui lòng nhập điểm đi";
    }

    if (!formData.to_location.trim()) {
      newErrors.to_location = "Vui lòng nhập điểm đến";
    }

    if (!formData.departure_time) {
      newErrors.departure_time = "Vui lòng nhập giờ khởi hành";
    }

    if (!formData.arrival_time) {
      newErrors.arrival_time = "Vui lòng nhập giờ đến";
    }

    if (!formData.duration || parseInt(formData.duration) <= 0) {
      newErrors.duration = "Thời gian bay phải lớn hơn 0";
    }

    if (!formData.base_price || parseFloat(formData.base_price) <= 0) {
      newErrors.base_price = "Giá phải lớn hơn 0";
    }

    if (formData.operating_days.length === 0) {
      newErrors.operating_days = "Vui lòng chọn ít nhất 1 ngày hoạt động";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});
    setSuccessMessage("");

    try {
      const submitData = {
        ...formData,
        id: route?.id,
        duration: parseInt(formData.duration),
        base_price: parseFloat(formData.base_price),
      };

      await onSave(submitData);

      setSuccessMessage(
        route
          ? "Cập nhật tuyến bay thành công!"
          : "Thêm tuyến bay mới thành công!"
      );

      // Đóng form sau 1.5 giây
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error saving route:", error);
      setErrors({
        submit:
          error.message || "Có lỗi xảy ra khi lưu thông tin. Vui lòng thử lại.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Format price for display
  const formatPrice = (price) => {
    if (!price) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  if (viewMode) {
    return (
      <div className="bg-white rounded-2xl shadow-sm">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-white">
                  Chi tiết tuyến bay
                </h1>
                <p className="text-blue-100 text-sm mt-1">{route.route_code}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setViewMode(false)}
                className="px-4 py-2 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-colors"
              >
                Chỉnh sửa
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-white/80 hover:text-white transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Header info */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {route.airline} {route.flight_number}
            </h2>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-600">
                {route.from_location} → {route.to_location}
              </span>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  route.status === "active"
                    ? "bg-green-50 text-green-600"
                    : "bg-gray-50 text-gray-600"
                }`}
              >
                {route.status === "active" ? "Đang hoạt động" : "Tạm dừng"}
              </span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500 rounded-xl">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Giá cơ bản</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatPrice(route.base_price)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500 rounded-xl">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Thời gian bay</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {route.duration} phút
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500 rounded-xl">
                  <Plane className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Máy bay</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {route.aircraft || "N/A"}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-500 rounded-xl">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Hoạt động</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {safeJSONParse(route.operating_days).length} ngày/tuần
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Flight Information */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">
                  Thông tin chuyến bay
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Hãng bay</p>
                  <p className="mt-1 text-gray-900">{route.airline}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Số hiệu</p>
                  <p className="mt-1 text-gray-900">{route.flight_number}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Điểm đi</p>
                  <p className="mt-1 text-gray-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {route.from_location}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Điểm đến</p>
                  <p className="mt-1 text-gray-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {route.to_location}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Loại chuyến
                  </p>
                  <p className="mt-1 text-gray-900">
                    {route.trip_type === "one_way" ? "Một chiều" : "Khứ hồi"}
                  </p>
                </div>
              </div>
            </div>

            {/* Schedule Information */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">
                  Thông tin lịch bay
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Giờ khởi hành
                  </p>
                  <p className="mt-1 text-gray-900 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {route.departure_time}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Giờ đến</p>
                  <p className="mt-1 text-gray-900 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {route.arrival_time}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Ngày hoạt động
                  </p>
                  <div className="mt-2 flex gap-2">
                    {dayNames.map((day, index) => {
                      const isActive = safeJSONParse(
                        route.operating_days
                      ).includes(index);
                      return (
                        <span
                          key={index}
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            isActive
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {day}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Seat Classes */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">
                  Hạng ghế
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {Object.entries(safeJSONParse(route.seat_classes, {})).map(
                    ([seatClass, data]) => (
                      <div
                        key={seatClass}
                        className="flex justify-between items-center border-b pb-2"
                      >
                        <span className="font-medium capitalize">
                          {seatClass === "economy" && "Phổ thông"}
                          {seatClass === "premium_economy" &&
                            "Phổ thông đặc biệt"}
                          {seatClass === "business" && "Thương gia"}
                          {seatClass === "first" && "Hạng nhất"}
                        </span>
                        <div className="text-sm text-gray-600">
                          <span>{data.seats} ghế</span>
                          <span className="mx-2">•</span>
                          <span>×{data.price_multiplier}</span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Amenities */}
            {route.amenities && safeJSONParse(route.amenities).length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Tiện ích
                  </h3>
                </div>
                <div className="p-6">
                  <div className="flex flex-wrap gap-2">
                    {safeJSONParse(route.amenities).map((amenityValue) => {
                      const amenity = amenitiesOptions.find(
                        (a) => a.value === amenityValue
                      );
                      return amenity ? (
                        <span
                          key={amenityValue}
                          className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                        >
                          {amenity.label}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-6 rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold text-white">
              {route ? "Chỉnh sửa tuyến bay" : "Thêm tuyến bay mới"}
            </h1>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            <Save className="w-5 h-5 mr-2" />
            {isLoading ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-8">
        {successMessage && (
          <div className="mb-6 bg-emerald-50 border border-emerald-100 text-emerald-600 px-4 py-3 rounded-xl flex items-start gap-3">
            <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p>{successMessage}</p>
          </div>
        )}

        {errors.submit && (
          <div className="mb-6 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p>{errors.submit}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">
                Thông tin cơ bản
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mã tuyến bay
                  </label>
                  <input
                    type="text"
                    name="route_code"
                    value={formData.route_code}
                    onChange={handleChange}
                    placeholder="Tự động tạo nếu để trống"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mã chuyến bay <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="flight_number"
                    value={formData.flight_number}
                    onChange={handleChange}
                    placeholder="VD: VN123"
                    className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.flight_number
                        ? "border-red-300"
                        : "border-gray-200"
                    }`}
                  />
                  {errors.flight_number && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.flight_number}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hãng bay <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="airline"
                    value={formData.airline}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.airline ? "border-red-300" : "border-gray-200"
                    }`}
                  >
                    <option value="">Chọn hãng bay</option>
                    {airlines.map((airline) => (
                      <option key={airline} value={airline}>
                        {airline}
                      </option>
                    ))}
                  </select>
                  {errors.airline && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.airline}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo hãng bay (URL)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="airline_image"
                      value={formData.airline_image}
                      onChange={handleChange}
                      placeholder="/uploads/flights/airline_logo.jpg"
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <ImageIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Điểm đi <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="from_location"
                      value={formData.from_location}
                      onChange={handleChange}
                      placeholder="VD: Hà Nội"
                      className={`w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.from_location
                          ? "border-red-300"
                          : "border-gray-200"
                      }`}
                    />
                    <MapPin className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  {errors.from_location && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.from_location}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Điểm đến <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="to_location"
                      value={formData.to_location}
                      onChange={handleChange}
                      placeholder="VD: TP. Hồ Chí Minh"
                      className={`w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.to_location
                          ? "border-red-300"
                          : "border-gray-200"
                      }`}
                    />
                    <MapPin className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  {errors.to_location && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.to_location}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Máy bay
                  </label>
                  <input
                    type="text"
                    name="aircraft"
                    value={formData.aircraft}
                    onChange={handleChange}
                    placeholder="VD: Airbus A321"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loại chuyến bay
                  </label>
                  <select
                    name="trip_type"
                    value={formData.trip_type}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="one_way">Một chiều</option>
                    <option value="round_trip">Khứ hồi</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Flight Schedule */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">Lịch bay</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giờ khởi hành <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      name="departure_time"
                      value={formData.departure_time}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.departure_time
                          ? "border-red-300"
                          : "border-gray-200"
                      }`}
                    />
                    <Clock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  {errors.departure_time && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.departure_time}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giờ đến <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      name="arrival_time"
                      value={formData.arrival_time}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.arrival_time
                          ? "border-red-300"
                          : "border-gray-200"
                      }`}
                    />
                    <Clock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  {errors.arrival_time && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.arrival_time}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thời gian bay (phút) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    min="1"
                    placeholder="VD: 120"
                    className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.duration ? "border-red-300" : "border-gray-200"
                    }`}
                  />
                  {errors.duration && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.duration}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.duration
                      ? `~ ${Math.floor(formData.duration / 60)} giờ ${
                          formData.duration % 60
                        } phút`
                      : ""}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày hoạt động <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2 flex-wrap">
                  {dayNames.map((day, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleOperatingDayToggle(index)}
                      className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                        formData.operating_days.includes(index)
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
                {errors.operating_days && (
                  <p className="mt-2 text-sm text-red-500">
                    {errors.operating_days}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">
                Giá vé & Hạng ghế
              </h3>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giá cơ bản (VNĐ) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="base_price"
                    value={formData.base_price}
                    onChange={handleChange}
                    min="0"
                    step="1000"
                    placeholder="VD: 1200000"
                    className={`w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.base_price ? "border-red-300" : "border-gray-200"
                    }`}
                  />
                  <DollarSign className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {errors.base_price && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.base_price}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {formData.base_price ? formatPrice(formData.base_price) : ""}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Giá này áp dụng cho hạng phổ thông. Các hạng khác sẽ nhân với
                  hệ số bên dưới.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(formData.seat_classes).map(
                  ([seatClass, data]) => (
                    <div
                      key={seatClass}
                      className="border border-gray-200 rounded-xl p-4"
                    >
                      <h4 className="font-medium text-gray-900 mb-3 capitalize">
                        {seatClass === "economy" && "Phổ thông"}
                        {seatClass === "premium_economy" &&
                          "Phổ thông đặc biệt"}
                        {seatClass === "business" && "Thương gia"}
                        {seatClass === "first" && "Hạng nhất"}
                      </h4>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Số ghế
                          </label>
                          <input
                            type="number"
                            value={data.seats}
                            onChange={(e) =>
                              handleSeatClassChange(
                                seatClass,
                                "seats",
                                e.target.value
                              )
                            }
                            min="0"
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Hệ số giá
                          </label>
                          <input
                            type="number"
                            value={data.price_multiplier}
                            onChange={(e) =>
                              handleSeatClassChange(
                                seatClass,
                                "price_multiplier",
                                e.target.value
                              )
                            }
                            min="0"
                            step="0.1"
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Baggage & Amenities */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">
                Hành lý & Tiện ích
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hành lý xách tay
                  </label>
                  <input
                    type="text"
                    value={formData.baggage.cabin}
                    onChange={(e) =>
                      handleBaggageChange("cabin", e.target.value)
                    }
                    placeholder="VD: 7 kg"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hành lý ký gửi
                  </label>
                  <input
                    type="text"
                    value={formData.baggage.checked}
                    onChange={(e) =>
                      handleBaggageChange("checked", e.target.value)
                    }
                    placeholder="VD: 23 kg"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiện ích
                </label>
                <div className="flex gap-2 flex-wrap">
                  {amenitiesOptions.map((amenity) => (
                    <button
                      key={amenity.value}
                      type="button"
                      onClick={() => handleAmenityToggle(amenity.value)}
                      className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                        formData.amenities.includes(amenity.value)
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {amenity.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">
                Trạng thái
              </h3>
            </div>
            <div className="p-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trạng thái tuyến bay
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Đang hoạt động</option>
                  <option value="inactive">Tạm dừng</option>
                </select>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RouteForm;
