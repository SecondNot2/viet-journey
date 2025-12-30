import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle,
  Bus,
  MapPin,
  Clock,
  DollarSign,
  Users,
  Calendar,
  Image as ImageIcon,
  X,
} from "lucide-react";

const RouteForm = ({ route, onClose, onSave, viewMode: initialViewMode }) => {
  const [viewMode, setViewMode] = useState(initialViewMode);
  const [formData, setFormData] = useState({
    route_code: "",
    route_name: "",
    type: "",
    vehicle_name: "",
    company: "",
    from_location: "",
    to_location: "",
    price: "",
    duration: "",
    seats: "",
    departure_time: "",
    arrival_time: "",
    operating_days: [1, 2, 3, 4, 5], // Mặc định T2-T6
    image: "",
    trip_type: "one_way",
    amenities: [],
    notes: "",
    status: "active",
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

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

  // Danh sách tiện ích
  const availableAmenities = [
    { id: "wifi", label: "WiFi" },
    { id: "ac", label: "Điều hòa" },
    { id: "toilet", label: "Toilet" },
    { id: "water", label: "Nước uống" },
    { id: "snack", label: "Snack" },
    { id: "blanket", label: "Chăn" },
    { id: "pillow", label: "Gối" },
    { id: "socket", label: "Ổ cắm điện" },
    { id: "tv", label: "TV/Giải trí" },
  ];

  // Ngày trong tuần
  const daysOfWeek = [
    { value: 0, label: "CN" },
    { value: 1, label: "T2" },
    { value: 2, label: "T3" },
    { value: 3, label: "T4" },
    { value: 4, label: "T5" },
    { value: 5, label: "T6" },
    { value: 6, label: "T7" },
  ];

  useEffect(() => {
    if (route) {
      setFormData({
        route_code: route.route_code || "",
        route_name: route.route_name || "",
        type: route.type || "",
        vehicle_name: route.vehicle_name || "",
        company: route.company || "",
        from_location: route.from_location || "",
        to_location: route.to_location || "",
        price: route.price || "",
        duration: route.duration || "",
        seats: route.seats || "",
        departure_time: route.departure_time || "",
        arrival_time: route.arrival_time || "",
        operating_days: route.operating_days
          ? typeof route.operating_days === "string"
            ? JSON.parse(route.operating_days)
            : route.operating_days
          : [1, 2, 3, 4, 5],
        image: route.image || "",
        trip_type: route.trip_type || "one_way",
        amenities: route.amenities
          ? typeof route.amenities === "string"
            ? JSON.parse(route.amenities)
            : route.amenities
          : [],
        notes: route.notes || "",
        status: route.status || "active",
      });
    }
  }, [route]);

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.route_code?.trim())
      newErrors.route_code = "Vui lòng nhập mã route";
    if (!formData.route_name?.trim())
      newErrors.route_name = "Vui lòng nhập tên route";
    if (!formData.type?.trim()) newErrors.type = "Vui lòng chọn loại xe";
    if (!formData.vehicle_name?.trim())
      newErrors.vehicle_name = "Vui lòng nhập tên xe";
    if (!formData.company?.trim())
      newErrors.company = "Vui lòng nhập tên công ty";
    if (!formData.from_location?.trim())
      newErrors.from_location = "Vui lòng nhập điểm đi";
    if (!formData.to_location?.trim())
      newErrors.to_location = "Vui lòng nhập điểm đến";
    if (!formData.price) newErrors.price = "Vui lòng nhập giá vé";
    if (!formData.duration) newErrors.duration = "Vui lòng nhập thời lượng";
    if (!formData.seats) newErrors.seats = "Vui lòng nhập số ghế";
    if (!formData.departure_time)
      newErrors.departure_time = "Vui lòng nhập giờ khởi hành";
    if (!formData.arrival_time)
      newErrors.arrival_time = "Vui lòng nhập giờ đến";

    // Validate number fields
    if (
      formData.price &&
      (isNaN(Number(formData.price)) || Number(formData.price) <= 0)
    ) {
      newErrors.price = "Giá vé phải là số dương";
    }
    if (
      formData.duration &&
      (isNaN(Number(formData.duration)) || Number(formData.duration) <= 0)
    ) {
      newErrors.duration = "Thời lượng phải là số dương";
    }
    if (
      formData.seats &&
      (isNaN(Number(formData.seats)) || Number(formData.seats) <= 0)
    ) {
      newErrors.seats = "Số ghế phải là số dương";
    }

    // Validate operating days
    if (!formData.operating_days || formData.operating_days.length === 0) {
      newErrors.operating_days = "Vui lòng chọn ít nhất 1 ngày hoạt động";
    }

    // Validate times
    if (formData.departure_time && formData.arrival_time) {
      const [depHour, depMin] = formData.departure_time.split(":");
      const [arrHour, arrMin] = formData.arrival_time.split(":");

      const depMinutes = parseInt(depHour) * 60 + parseInt(depMin);
      const arrMinutes = parseInt(arrHour) * 60 + parseInt(arrMin);

      // Allow arrival next day
      if (arrMinutes <= depMinutes && arrMinutes > 0) {
        // Could be next day, this is OK
      }
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
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration),
        seats: parseInt(formData.seats),
      };

      await onSave(submitData);

      setSuccessMessage(
        route ? "Cập nhật route thành công!" : "Thêm route mới thành công!"
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

  const handleAmenityToggle = (amenityId) => {
    setFormData((prev) => {
      const amenities = [...prev.amenities];
      const index = amenities.indexOf(amenityId);
      if (index > -1) {
        amenities.splice(index, 1);
      } else {
        amenities.push(amenityId);
      }
      return { ...prev, amenities };
    });
  };

  // Format price for display
  const formatPrice = (price) => {
    if (!price) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  // Format transport type for display
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
        return type;
    }
  };

  if (viewMode) {
    return (
      <div className="bg-white rounded-2xl shadow-sm">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-6 rounded-t-2xl">
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
                  Chi tiết Route
                </h1>
                <p className="text-emerald-100 text-sm mt-1">
                  {route.route_code}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setViewMode(false)}
                className="px-4 py-2 bg-white text-emerald-600 rounded-xl hover:bg-emerald-50 transition-colors"
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
              {route.route_name}
            </h2>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-600">
                {getTransportType(route.type)}
              </span>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  route.status === "active"
                    ? "bg-green-50 text-green-600"
                    : "bg-gray-50 text-gray-600"
                }`}
              >
                {route.status === "active" ? "Hoạt động" : "Tạm ngừng"}
              </span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500 rounded-xl">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Giá vé</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatPrice(route.price)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500 rounded-xl">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Số ghế</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {route.seats} ghế
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
                  <p className="text-sm text-gray-500">Thời gian</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {route.duration} phút
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
            {/* Route Information */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">
                  Thông tin tuyến đường
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Công ty</p>
                  <p className="mt-1 text-gray-900">{route.company}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Tên xe</p>
                  <p className="mt-1 text-gray-900">{route.vehicle_name}</p>
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
                  Thông tin lịch trình
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
                    {daysOfWeek.map((day) => {
                      const isActive = safeJSONParse(
                        route.operating_days
                      ).includes(day.value);
                      return (
                        <span
                          key={day.value}
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            isActive
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {day.label}
                        </span>
                      );
                    })}
                  </div>
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
                    {safeJSONParse(route.amenities).map((amenityId) => {
                      const amenity = availableAmenities.find(
                        (a) => a.id === amenityId
                      );
                      return amenity ? (
                        <span
                          key={amenityId}
                          className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium"
                        >
                          {amenity.label}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {route.notes && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Ghi chú
                  </h3>
                </div>
                <div className="p-6">
                  <p className="text-gray-700 whitespace-pre-line">
                    {route.notes}
                  </p>
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
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-6 rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold text-white">
              {route ? "Chỉnh sửa Route" : "Thêm Route mới"}
            </h1>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 bg-white text-emerald-600 rounded-xl hover:bg-emerald-50 transition-colors disabled:opacity-50"
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
                    Mã Route <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.route_code}
                    onChange={(e) =>
                      setFormData({ ...formData, route_code: e.target.value })
                    }
                    placeholder="VD: HN-DN-BUS-08:00"
                    className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                      errors.route_code ? "border-red-300" : "border-gray-200"
                    }`}
                  />
                  {errors.route_code && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.route_code}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên Route <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.route_name}
                    onChange={(e) =>
                      setFormData({ ...formData, route_name: e.target.value })
                    }
                    placeholder="VD: Hà Nội - Đà Nẵng"
                    className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                      errors.route_name ? "border-red-300" : "border-gray-200"
                    }`}
                  />
                  {errors.route_name && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.route_name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loại xe <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value })
                      }
                      className={`w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                        errors.type ? "border-red-300" : "border-gray-200"
                      }`}
                    >
                      <option value="">Chọn loại xe</option>
                      <option value="bus">Xe khách</option>
                      <option value="train">Tàu hỏa</option>
                      <option value="car">Xe hơi</option>
                      <option value="bike">Xe máy</option>
                    </select>
                    <Bus className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  {errors.type && (
                    <p className="mt-1 text-sm text-red-500">{errors.type}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên xe <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.vehicle_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        vehicle_name: e.target.value,
                      })
                    }
                    placeholder="VD: Xe giường nằm 40 chỗ"
                    className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                      errors.vehicle_name ? "border-red-300" : "border-gray-200"
                    }`}
                  />
                  {errors.vehicle_name && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.vehicle_name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Công ty <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) =>
                      setFormData({ ...formData, company: e.target.value })
                    }
                    placeholder="VD: Phương Trang"
                    className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                      errors.company ? "border-red-300" : "border-gray-200"
                    }`}
                  />
                  {errors.company && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.company}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loại chuyến
                  </label>
                  <select
                    value={formData.trip_type}
                    onChange={(e) =>
                      setFormData({ ...formData, trip_type: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="one_way">Một chiều</option>
                    <option value="round_trip">Khứ hồi</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Route Details */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">
                Chi tiết tuyến đường
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Điểm đi <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.from_location}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          from_location: e.target.value,
                        })
                      }
                      placeholder="VD: Hà Nội"
                      className={`w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
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
                      value={formData.to_location}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          to_location: e.target.value,
                        })
                      }
                      placeholder="VD: Đà Nẵng"
                      className={`w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
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
                    Thời lượng (phút) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) =>
                        setFormData({ ...formData, duration: e.target.value })
                      }
                      placeholder="VD: 720"
                      className={`w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                        errors.duration ? "border-red-300" : "border-gray-200"
                      }`}
                    />
                    <Clock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL ảnh
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.image}
                      onChange={(e) =>
                        setFormData({ ...formData, image: e.target.value })
                      }
                      placeholder="VD: /uploads/transport/bus.jpg"
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                    <ImageIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing & Capacity */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">
                Giá vé & Sức chứa
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giá vé (VNĐ) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      placeholder="VD: 350000"
                      className={`w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                        errors.price ? "border-red-300" : "border-gray-200"
                      }`}
                    />
                    <DollarSign className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-500">{errors.price}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.price ? formatPrice(formData.price) : ""}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số ghế <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.seats}
                      onChange={(e) =>
                        setFormData({ ...formData, seats: e.target.value })
                      }
                      placeholder="VD: 40"
                      className={`w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                        errors.seats ? "border-red-300" : "border-gray-200"
                      }`}
                    />
                    <Users className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  {errors.seats && (
                    <p className="mt-1 text-sm text-red-500">{errors.seats}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">
                Lịch trình
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giờ khởi hành <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      value={formData.departure_time}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          departure_time: e.target.value,
                        })
                      }
                      className={`w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
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
                      value={formData.arrival_time}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          arrival_time: e.target.value,
                        })
                      }
                      className={`w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày hoạt động <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2 flex-wrap">
                  {daysOfWeek.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => handleOperatingDayToggle(day.value)}
                      className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                        formData.operating_days.includes(day.value)
                          ? "bg-emerald-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {day.label}
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

          {/* Amenities */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">Tiện ích</h3>
            </div>
            <div className="p-6">
              <div className="flex gap-2 flex-wrap">
                {availableAmenities.map((amenity) => (
                  <button
                    key={amenity.id}
                    type="button"
                    onClick={() => handleAmenityToggle(amenity.id)}
                    className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                      formData.amenities.includes(amenity.id)
                        ? "bg-emerald-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {amenity.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Notes & Status */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">
                Thông tin bổ sung
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ghi chú
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={4}
                    placeholder="Nhập ghi chú về route này..."
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trạng thái
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Tạm ngừng</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RouteForm;
