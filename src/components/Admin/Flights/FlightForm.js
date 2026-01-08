import React, { useState, useEffect } from "react";
import { API_URL } from "../../../config/api";
import {
  ArrowLeft,
  Save,
  Plane,
  MapPin,
  Calendar,
  Clock,
  Users,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Timer,
} from "lucide-react";

const FlightForm = ({ flight, onClose, onSave, viewMode: initialViewMode }) => {
  const [viewMode, setViewMode] = useState(initialViewMode);
  const [formData, setFormData] = useState({
    airline: "",
    flight_number: "",
    from_location: "",
    to_location: "",
    departure_time: "",
    arrival_time: "",
    price: "",
    duration: "",
    seats: "",
    status: "scheduled",
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (flight) {
      try {
        console.log("Loading flight data:", flight);
        console.log(
          "Original status:",
          flight.status,
          "Type:",
          typeof flight.status
        );
        // Hàm helper để format thời gian
        const formatDateTime = (dateTimeStr) => {
          if (!dateTimeStr) return "";
          try {
            // Chuyển đổi MySQL datetime thành local datetime-local
            const date = new Date(dateTimeStr.replace(" ", "T"));
            if (isNaN(date.getTime())) return "";

            return date.toISOString().slice(0, 16); // Lấy YYYY-MM-DDThh:mm
          } catch (error) {
            console.error("Error formatting datetime:", error);
            return "";
          }
        };

        setFormData({
          airline: flight.airline || "",
          flight_number: flight.flight_number || "",
          from_location: flight.from_location || "",
          to_location: flight.to_location || "",
          departure_time: formatDateTime(flight.departure_time),
          arrival_time: formatDateTime(flight.arrival_time),
          price: flight.price || "",
          duration: flight.duration || "",
          seats: flight.seats || "",
          status: (flight.status || "scheduled").toString().trim(),
        });
      } catch (error) {
        console.error("Error formatting flight data:", error);
      }
    }
  }, [flight]);

  const validateForm = () => {
    const newErrors = {};

    // Validate required fields
    if (!formData.airline?.trim()) newErrors.airline = "Vui lòng chọn hãng bay";
    if (!formData.flight_number?.trim())
      newErrors.flight_number = "Vui lòng nhập mã chuyến bay";
    if (!formData.from_location?.trim())
      newErrors.from_location = "Vui lòng nhập điểm khởi hành";
    if (!formData.to_location?.trim())
      newErrors.to_location = "Vui lòng nhập điểm đến";
    if (!formData.departure_time)
      newErrors.departure_time = "Vui lòng chọn thời gian khởi hành";
    if (!formData.arrival_time)
      newErrors.arrival_time = "Vui lòng chọn thời gian hạ cánh";
    if (!formData.price) newErrors.price = "Vui lòng nhập giá vé";
    if (!formData.seats) newErrors.seats = "Vui lòng nhập số ghế";

    // Validate price and seats
    if (formData.price && formData.price <= 0) {
      newErrors.price = "Giá vé phải lớn hơn 0";
    }
    if (formData.seats && formData.seats <= 0) {
      newErrors.seats = "Số ghế phải lớn hơn 0";
    }

    // Validate departure and arrival time
    if (formData.departure_time && formData.arrival_time) {
      const departure = new Date(formData.departure_time);
      const arrival = new Date(formData.arrival_time);
      if (arrival <= departure) {
        newErrors.arrival_time =
          "Thời gian hạ cánh phải sau thời gian khởi hành";
      }
    }

    // Validate status
    const validStatuses = [
      "scheduled",
      "boarding",
      "departed",
      "arrived",
      "delayed",
      "cancelled",
    ];
    if (formData.status && !validStatuses.includes(formData.status.trim())) {
      newErrors.status = "Trạng thái không hợp lệ";
      console.error(
        "Invalid status:",
        formData.status,
        "Valid statuses:",
        validStatuses
      );
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
      const url = flight
        ? `${API_URL}/flights/${flight.id}`
        : `${API_URL}/flights`;

      const method = flight ? "PUT" : "POST";

      // Chuẩn bị dữ liệu gửi đi
      const submitData = {
        ...formData,
        price: Number(formData.price),
        seats: Number(formData.seats),
        duration: Number(formData.duration) || null,
        status: formData.status?.toString().trim() || "scheduled",
      };

      console.log("Submit data being sent:", submitData);
      console.log(
        "Status value:",
        submitData.status,
        "Type:",
        typeof submitData.status
      );

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Lỗi khi lưu thông tin chuyến bay");
      }

      setSuccessMessage(
        flight
          ? "Cập nhật thông tin chuyến bay thành công!"
          : "Thêm chuyến bay mới thành công!"
      );

      setTimeout(() => {
        if (onSave) {
          onSave(data);
        }
      }, 2000);
    } catch (error) {
      console.error("Error saving flight:", error);
      setErrors({
        submit:
          error.message || "Có lỗi xảy ra khi lưu thông tin. Vui lòng thử lại.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Format currency for display
  const formatCurrency = (amount) => {
    if (!amount) return "Chưa cập nhật";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Chưa cập nhật";
    try {
      const date = new Date(dateString.replace(" ", "T"));
      if (isNaN(date.getTime())) return "Không hợp lệ";
      return date.toLocaleString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Không hợp lệ";
    }
  };

  // Get status text
  const getStatusText = (status) => {
    switch (status) {
      case "scheduled":
        return "Đã lên lịch";
      case "boarding":
        return "Đang boarding";
      case "departed":
        return "Đã khởi hành";
      case "arrived":
        return "Đã hạ cánh";
      case "delayed":
        return "Bị hoãn";
      case "cancelled":
        return "Đã hủy";
      default:
        return "Không xác định";
    }
  };

  // Get status color
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
      default:
        return "bg-gray-50 text-gray-600";
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
              <h1 className="text-xl font-semibold text-white">
                Chi tiết chuyến bay
              </h1>
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
          {/* Basic Info */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {flight.airline} - {flight.flight_number}
              </h2>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  flight.status
                )}`}
              >
                {getStatusText(flight.status)}
              </span>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500 rounded-xl">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Số ghế</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {flight.seats} ghế
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500 rounded-xl">
                  <Timer className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Thời gian bay</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {flight.duration} phút
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500 rounded-xl">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Giá vé</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(flight.price)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Flight Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Route Information */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">
                  Thông tin hành trình
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Điểm khởi hành
                  </p>
                  <p className="mt-1 text-gray-900">{flight.from_location}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Điểm đến</p>
                  <p className="mt-1 text-gray-900">{flight.to_location}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Thời gian khởi hành
                  </p>
                  <p className="mt-1 text-gray-900">
                    {formatDate(flight.departure_time)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Thời gian hạ cánh
                  </p>
                  <p className="mt-1 text-gray-900">
                    {formatDate(flight.arrival_time)}
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">
                  Thông tin bổ sung
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Hãng bay</p>
                  <p className="mt-1 text-gray-900">{flight.airline}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Mã chuyến bay
                  </p>
                  <p className="mt-1 text-gray-900">{flight.flight_number}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Ngày tạo</p>
                  <p className="mt-1 text-gray-900">
                    {formatDate(flight.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Cập nhật lần cuối
                  </p>
                  <p className="mt-1 text-gray-900">
                    {formatDate(flight.updated_at)}
                  </p>
                </div>
              </div>
            </div>
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
              {flight ? "Chỉnh sửa chuyến bay" : "Thêm chuyến bay mới"}
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
            <CheckCircle className="w-5 h-5 mt-0.5" />
            <p>{successMessage}</p>
          </div>
        )}

        {errors.submit && (
          <div className="mb-6 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <p>{errors.submit}</p>
          </div>
        )}

        <form className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                Thông tin cơ bản
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hãng bay
                  </label>
                  <div className="relative">
                    <select
                      value={formData.airline}
                      onChange={(e) =>
                        setFormData({ ...formData, airline: e.target.value })
                      }
                      className={`w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                        errors.airline ? "border-red-300" : "border-gray-200"
                      }`}
                    >
                      <option value="">Chọn hãng bay</option>
                      <option value="Vietnam Airlines">Vietnam Airlines</option>
                      <option value="Vietjet Air">Vietjet Air</option>
                      <option value="Bamboo Airways">Bamboo Airways</option>
                      <option value="Pacific Airlines">Pacific Airlines</option>
                    </select>
                    <Plane className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  {errors.airline && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.airline}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mã chuyến bay
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.flight_number}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          flight_number: e.target.value,
                        })
                      }
                      className={`w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                        errors.flight_number
                          ? "border-red-300"
                          : "border-gray-200"
                      }`}
                    />
                    <Plane className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  {errors.flight_number && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.flight_number}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Điểm khởi hành
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
                      className={`w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                        errors.from_location
                          ? "border-red-300"
                          : "border-gray-200"
                      }`}
                    />
                    <MapPin className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  {errors.from_location && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.from_location}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Điểm đến
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
                      className={`w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                        errors.to_location
                          ? "border-red-300"
                          : "border-gray-200"
                      }`}
                    />
                    <MapPin className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  {errors.to_location && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.to_location}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thời gian khởi hành
                  </label>
                  <div className="relative">
                    <input
                      type="datetime-local"
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
                    <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  {errors.departure_time && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.departure_time}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thời gian hạ cánh
                  </label>
                  <div className="relative">
                    <input
                      type="datetime-local"
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
                    <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  {errors.arrival_time && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.arrival_time}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                Thông tin bổ sung
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giá vé (VNĐ)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      className={`w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                        errors.price ? "border-red-300" : "border-gray-200"
                      }`}
                    />
                    <DollarSign className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-500">{errors.price}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số ghế
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.seats}
                      onChange={(e) =>
                        setFormData({ ...formData, seats: e.target.value })
                      }
                      className={`w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                        errors.seats ? "border-red-300" : "border-gray-200"
                      }`}
                    />
                    <Users className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  {errors.seats && (
                    <p className="mt-1 text-sm text-red-500">{errors.seats}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thời gian bay (phút)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) =>
                        setFormData({ ...formData, duration: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                    <Clock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trạng thái
                  </label>
                  <div className="relative">
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                        errors.status ? "border-red-300" : "border-gray-200"
                      }`}
                    >
                      <option value="scheduled">Đã lên lịch</option>
                      <option value="boarding">Đang boarding</option>
                      <option value="departed">Đã khởi hành</option>
                      <option value="arrived">Đã hạ cánh</option>
                      <option value="delayed">Bị hoãn</option>
                      <option value="cancelled">Đã hủy</option>
                    </select>
                  </div>
                  {errors.status && (
                    <p className="mt-1 text-sm text-red-500">{errors.status}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FlightForm;
