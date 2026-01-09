import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Clock,
  Calendar,
  Users,
  Bus,
  Train,
  Car,
  Bike,
  Building,
  Star,
  ArrowRight,
  Luggage,
  Wifi,
  Coffee,
  Power,
  Music,
  Info,
  AlertCircle,
  ChevronRight,
  CreditCard,
  Wallet,
  Building2,
  Loader2,
  ArrowLeft,
  Minus,
  Plus,
  X,
} from "lucide-react";
import Toast from "../../common/Toast";
import CommentSection from "../../common/CommentSection";
import { API_URL, API_HOST } from "../../../config/api";

// Helper Functions
export const formatPrice = (price) => {
  // Chuyển đổi price thành số nếu là string
  const numericPrice = typeof price === "string" ? parseFloat(price) : price;

  // Kiểm tra nếu không phải là số hoặc nhỏ hơn 0
  if (
    typeof numericPrice !== "number" ||
    isNaN(numericPrice) ||
    numericPrice < 0
  ) {
    return "Liên hệ";
  }

  // Format số thành tiền VND
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numericPrice);
};

/**
 * Format date for display
 * Handles both ISO format and "YYYY-MM-DD HH:MM:SS" from DB
 */
export const formatDate = (dateString) => {
  if (!dateString) return "";

  // Handle "YYYY-MM-DD HH:MM:SS" format from DB (parse manually to avoid timezone issues)
  const str = String(dateString);
  if (str.includes(" ") && !str.includes("T")) {
    const [datePart] = str.split(" ");
    const [year, month, day] = datePart.split("-");
    // Create date in local timezone
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  // Standard ISO format
  return new Date(dateString).toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/**
 * Format time for display
 * Handles both ISO format and "YYYY-MM-DD HH:MM:SS" from DB
 */
export const formatTime = (dateString) => {
  if (!dateString) return "";

  // Handle "YYYY-MM-DD HH:MM:SS" format from DB
  const str = String(dateString);
  if (str.includes(" ") && !str.includes("T")) {
    const [, timePart] = str.split(" ");
    if (timePart) {
      // Return HH:MM directly without Date parsing (avoids timezone issues)
      return timePart.substring(0, 5);
    }
  }

  // Standard ISO format
  return new Date(dateString).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Format datetime for display (combines date and time)
 * Returns "HH:MM - DD/MM/YYYY"
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return "Chưa xác định";

  const str = String(dateString);

  // Handle "YYYY-MM-DD HH:MM:SS" format from DB
  if (str.includes(" ") && !str.includes("T")) {
    const [datePart, timePart] = str.split(" ");
    const [year, month, day] = datePart.split("-");
    const time = timePart ? timePart.substring(0, 5) : "";
    return `${time} - ${day}/${month}/${year}`;
  }

  // ISO format
  const date = new Date(dateString);
  const time = date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateFormatted = date.toLocaleDateString("vi-VN");
  return `${time} - ${dateFormatted}`;
};

export const formatDuration = (minutes) => {
  if (!minutes) return "Không xác định";
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours === 0) return `${remainingMinutes} phút`;
  if (remainingMinutes === 0) return `${hours} giờ`;
  return `${hours} giờ ${remainingMinutes} phút`;
};

export const getTransportIcon = (type, className = "") => {
  const defaultClass = `w-8 h-8 ${className}`;
  switch (type) {
    case "bus":
      return <Bus className={`${defaultClass} text-blue-500`} />;
    case "train":
      return <Train className={`${defaultClass} text-purple-500`} />;
    case "car":
      return <Car className={`${defaultClass} text-orange-500`} />;
    case "bike":
      return <Bike className={`${defaultClass} text-green-500`} />;
    default:
      return null;
  }
};

export const getTransportLabel = (type) => {
  const labels = {
    bus: "Xe khách",
    train: "Tàu hỏa",
    car: "Xe Limousine",
    bike: "Xe máy",
  };
  return labels[type] || type;
};

// Hàm xử lý đường dẫn hình ảnh - use API_HOST for static assets
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith("http")) return imagePath;
  // Use API_HOST (not API_URL) for static assets like images
  if (imagePath.startsWith("/uploads")) return `${API_HOST}${imagePath}`;
  return `${API_HOST}/uploads/transport/${imagePath}`;
};

const TransportDetail = ({
  transport,
  currentUserId,
  isAdmin,
  likedComments,
  toast,
  showToast,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onLikeComment,
  onReloadTransport,
  onRatingClick,
  userRating,
  hoverRating,
  setHoverRating,
  ratingError,
  // Passenger selection props
  passengers,
  setPassengers,
  showPassengerModal,
  setShowPassengerModal,
  handlePassengerChange,
  passengerError,
  setPassengerError,
  passengerModalRef,
}) => {
  const [selectedTab, setSelectedTab] = useState("details");
  const navigate = useNavigate();

  if (!transport) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  const amenities = transport.amenities
    ? typeof transport.amenities === "string"
      ? JSON.parse(transport.amenities)
      : transport.amenities
    : [];

  const getAmenityIcon = (amenity) => {
    switch (amenity) {
      case "meal":
        return <Coffee className="w-4 h-4" />;
      case "wifi":
        return <Wifi className="w-4 h-4" />;
      case "power":
        return <Power className="w-4 h-4" />;
      case "entertainment":
        return <Music className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => showToast(null)}
        />
      )}

      {/* Hero Section */}
      <div className="bg-emerald-600 text-white py-12">
        <div className="container mx-auto px-4">
          <button
            onClick={() => navigate("/transport")}
            className="flex items-center gap-2 text-white mb-6 hover:text-emerald-100"
          >
            <ArrowLeft className="w-5 h-5" />
            Quay lại danh sách chuyến xe
          </button>
          <h1 className="text-3xl font-bold mb-2">Chi tiết chuyến xe</h1>
          <p className="text-emerald-100">
            {transport.from_location} → {transport.to_location}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-8">
        <div className="bg-white rounded-lg shadow-lg">
          {/* Navigation */}
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                className={
                  selectedTab === "details"
                    ? "px-6 py-3 font-medium text-emerald-600 border-b-2 border-emerald-600"
                    : "px-6 py-3 font-medium text-gray-500 hover:text-gray-700"
                }
                onClick={() => setSelectedTab("details")}
              >
                Thông tin chuyến xe
              </button>
              <button
                className={
                  selectedTab === "fare"
                    ? "px-6 py-3 font-medium text-emerald-600 border-b-2 border-emerald-600"
                    : "px-6 py-3 font-medium text-gray-500 hover:text-gray-700"
                }
                onClick={() => setSelectedTab("fare")}
              >
                Chi tiết giá vé
              </button>
              <button
                className={
                  selectedTab === "policy"
                    ? "px-6 py-3 font-medium text-emerald-600 border-b-2 border-emerald-600"
                    : "px-6 py-3 font-medium text-gray-500 hover:text-gray-700"
                }
                onClick={() => setSelectedTab("policy")}
              >
                Điều kiện vé
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {selectedTab === "details" && (
              <div>
                {/* Transport Overview */}
                <div className="bg-gray-50 rounded-lg p-6 mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      {transport.image ? (
                        <div className="w-16 h-16 rounded-lg shadow-sm overflow-hidden bg-white flex items-center justify-center">
                          <img
                            src={getImageUrl(transport.image)}
                            alt={transport.company}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = `${API_HOST}/images/placeholder.png`;
                            }}
                          />
                        </div>
                      ) : (
                        <div className="p-3 bg-white rounded-lg shadow-sm">
                          {getTransportIcon(transport.type)}
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-lg">
                          {transport.company}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {getTransportLabel(transport.type)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {transport.promotion_status === "active" &&
                      transport.promotion_discount ? (
                        <div>
                          <p className="text-2xl font-bold text-orange-600">
                            {formatPrice(
                              transport.promotion_type === "percentage"
                                ? transport.price *
                                    (1 - transport.promotion_discount / 100)
                                : transport.price - transport.promotion_discount
                            )}
                          </p>
                          <p className="text-base text-gray-500 line-through">
                            {formatPrice(transport.price)}
                          </p>
                        </div>
                      ) : (
                        <p className="text-2xl font-bold text-emerald-600">
                          {formatPrice(transport.price)}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        {transport.available_seats || transport.seats} chỗ trống
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 justify-between">
                    <div>
                      <p className="text-2xl font-bold">
                        {formatTime(transport.departure_time)}
                      </p>
                      <p className="text-gray-500">{transport.from_location}</p>
                    </div>
                    <div className="flex-1 flex flex-col items-center">
                      <p className="text-sm text-gray-500">
                        {formatDuration(transport.duration)}
                      </p>
                      <div className="w-full flex items-center gap-2">
                        <div className="h-px flex-1 bg-gray-300"></div>
                        <div className="p-1 rounded-full bg-emerald-100">
                          {getTransportIcon(transport.type, "w-4 h-4")}
                        </div>
                        <div className="h-px flex-1 bg-gray-300"></div>
                      </div>
                      <p className="text-xs text-gray-500">Chuyến thẳng</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {formatTime(transport.arrival_time)}
                      </p>
                      <p className="text-gray-500">{transport.to_location}</p>
                    </div>
                  </div>
                </div>

                {/* Transport Details */}
                <div className="space-y-6">
                  {/* Vehicle Info */}
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    {getTransportIcon(transport.type, "text-gray-400")}
                    <div>
                      <p className="font-medium">Phương tiện</p>
                      <p className="text-gray-500">{transport.vehicle_name}</p>
                    </div>
                  </div>

                  {/* Company Info */}
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <Building className="w-6 h-6 text-gray-400" />
                    <div>
                      <p className="font-medium">Nhà xe</p>
                      <p className="text-gray-500">{transport.company}</p>
                    </div>
                  </div>

                  {/* Trip Info */}
                  {transport.trip_code && (
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <Calendar className="w-6 h-6 text-gray-400" />
                      <div>
                        <p className="font-medium">Mã chuyến</p>
                        <p className="text-gray-500">{transport.trip_code}</p>
                      </div>
                    </div>
                  )}

                  {/* Seats Info */}
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <Users className="w-6 h-6 text-gray-400" />
                    <div>
                      <p className="font-medium">Chỗ ngồi</p>
                      <p className="text-gray-500">
                        {transport.available_seats || transport.seats}/
                        {transport.total_seats || transport.seats} chỗ trống
                      </p>
                    </div>
                  </div>

                  {/* Amenities */}
                  {amenities.length > 0 && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="font-medium mb-4">Tiện nghi trên xe</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {amenities.map((amenity) => (
                          <div
                            key={amenity}
                            className="flex items-center gap-2 text-gray-500"
                          >
                            {getAmenityIcon(amenity)}
                            <span className="capitalize">
                              {amenity === "meal"
                                ? "Đồ ăn"
                                : amenity === "wifi"
                                ? "Wi-Fi"
                                : amenity === "power"
                                ? "Ổ cắm điện"
                                : "Giải trí"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedTab === "fare" && (
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-4">
                    Chi tiết giá vé
                  </h3>
                  <div className="space-y-4">
                    {/* Giá vé niêm yết */}
                    <div className="flex justify-between">
                      <span>Giá vé niêm yết</span>
                      <span className="font-medium">
                        {formatPrice(transport.price)}
                      </span>
                    </div>

                    {/* Khuyến mãi nếu có */}
                    {transport.promotion &&
                      transport.promotion_status === "active" && (
                        <div className="flex justify-between text-orange-500">
                          <span>Khuyến mãi</span>
                          <span className="font-medium">
                            {transport.promotion_type === "percentage"
                              ? `-${formatPrice(
                                  transport.price *
                                    (transport.promotion_discount / 100)
                                )}`
                              : `-${formatPrice(transport.promotion_discount)}`}
                          </span>
                        </div>
                      )}

                    {/* Tổng cộng */}
                    <div className="border-t pt-4 flex justify-between font-bold text-lg">
                      <span>Tổng cộng</span>
                      <span className="text-emerald-600">
                        {formatPrice(
                          transport.promotion &&
                            transport.promotion_status === "active"
                            ? transport.promotion_type === "percentage"
                              ? transport.price *
                                (1 - transport.promotion_discount / 100)
                              : transport.price - transport.promotion_discount
                            : transport.price
                        )}
                      </span>
                    </div>

                    {/* Thông tin khuyến mãi */}
                    {transport.promotion && (
                      <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <h4 className="font-medium text-orange-600 mb-2">
                          Thông tin khuyến mãi
                        </h4>
                        <div className="space-y-2 text-sm">
                          <p className="text-gray-700">
                            {transport.promotion.title}
                          </p>
                          <p className="text-gray-600">
                            {transport.promotion.description}
                          </p>
                          <p className="text-orange-500">
                            Thời hạn:{" "}
                            {new Date(
                              transport.promotion.start_date
                            ).toLocaleDateString("vi-VN")}{" "}
                            -{" "}
                            {new Date(
                              transport.promotion.end_date
                            ).toLocaleDateString("vi-VN")}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Ghi chú */}
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-700 mb-2 flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        Lưu ý quan trọng
                      </h4>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>
                          • Giá vé là giá niêm yết, không thu thêm bất kỳ phụ
                          phí nào
                        </li>
                        <li>• Giá vé đã bao gồm thuế VAT (nếu có)</li>
                        <li>
                          • Giá vé có thể thay đổi tùy theo thời điểm đặt và số
                          ghế còn trống
                        </li>
                        {transport.promotion &&
                          transport.promotion_status === "active" && (
                            <li className="text-orange-600 font-medium">
                              • Đang áp dụng chương trình khuyến mãi - Số lượng
                              có hạn
                            </li>
                          )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === "policy" && (
              <div className="space-y-6">
                {/* Quy định vé */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-4">Quy định vé</h3>
                  <div className="space-y-6">
                    {/* Đổi vé */}
                    <div>
                      <h4 className="font-medium text-emerald-600 mb-2">
                        Đổi vé
                      </h4>
                      <ul className="list-disc list-inside space-y-2 text-gray-600">
                        <li>Được phép đổi vé trước giờ khởi hành 24 tiếng</li>
                        <li>
                          Phí đổi vé: 50.000 VNĐ/vé + chênh lệch giá vé (nếu có)
                        </li>
                        <li>
                          Chỉ được đổi ngày đi, không được đổi tuyến đường
                        </li>
                        <li>Không áp dụng đổi vé cho vé khuyến mãi</li>
                      </ul>
                    </div>

                    {/* Hoàn vé */}
                    <div>
                      <h4 className="font-medium text-emerald-600 mb-2">
                        Hoàn vé
                      </h4>
                      <ul className="list-disc list-inside space-y-2 text-gray-600">
                        <li>Được phép hoàn vé trước giờ khởi hành 48 tiếng</li>
                        <li>Phí hoàn vé: 100.000 VNĐ/vé</li>
                        <li>Thời gian hoàn tiền: 3-5 ngày làm việc</li>
                        <li>Không áp dụng hoàn vé cho vé khuyến mãi</li>
                      </ul>
                    </div>

                    {/* Hành lý */}
                    <div>
                      <h4 className="font-medium text-emerald-600 mb-2">
                        Quy định hành lý
                      </h4>
                      <ul className="list-disc list-inside space-y-2 text-gray-600">
                        <li>Hành lý xách tay: 7kg/người</li>
                        <li>Hành lý ký gửi: 20kg/người</li>
                        <li>Không vận chuyển hàng cấm, hàng dễ cháy nổ</li>
                        <li>Phí hành lý quá cước: 50.000 VNĐ/kg</li>
                      </ul>
                    </div>

                    {/* Quy định khác */}
                    <div>
                      <h4 className="font-medium text-emerald-600 mb-2">
                        Quy định khác
                      </h4>
                      <ul className="list-disc list-inside space-y-2 text-gray-600">
                        <li>Có mặt tại điểm đón trước giờ khởi hành 30 phút</li>
                        <li>
                          Mang theo giấy tờ tùy thân (CMND/CCCD) còn hiệu lực
                        </li>
                        <li>Không hút thuốc, uống rượu bia trên xe</li>
                        <li>
                          Tuân thủ hướng dẫn của tài xế và nhân viên phục vụ
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lựa chọn hành khách */}
        {passengers && (
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-xl font-semibold mb-4">
                  Lựa chọn hành khách
                </h3>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setShowPassengerModal &&
                      setShowPassengerModal(!showPassengerModal)
                    }
                    className="w-full text-left border border-gray-300 rounded-lg p-3 pl-4 pr-10 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors shadow-sm hover:border-emerald-300 bg-white"
                  >
                    {`${passengers.adults} người lớn, ${passengers.children} trẻ em, ${passengers.infants} em bé`}
                  </button>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-emerald-600 bg-emerald-50 p-1 rounded-full">
                    <Users size={18} />
                  </div>
                </div>

                {showPassengerModal && (
                  <div
                    ref={passengerModalRef}
                    className="absolute z-50 mt-2 w-full max-w-md bg-white rounded-lg shadow-xl border border-gray-200 p-5"
                  >
                    {/* Adults */}
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <p className="font-medium text-gray-800">Người lớn</p>
                        <p className="text-sm text-gray-500">
                          &gt; 12 tuổi (100% giá vé)
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            handlePassengerChange &&
                            handlePassengerChange("adults", "subtract")
                          }
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={passengers.adults <= 1}
                        >
                          <Minus className="w-4 h-4 text-gray-600" />
                        </button>
                        <span className="w-8 text-center font-medium">
                          {passengers.adults}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handlePassengerChange &&
                            handlePassengerChange("adults", "add")
                          }
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                        >
                          <Plus className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </div>

                    {/* Children */}
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <p className="font-medium text-gray-800">Trẻ em</p>
                        <p className="text-sm text-gray-500">
                          2-12 tuổi (75% giá vé)
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            handlePassengerChange &&
                            handlePassengerChange("children", "subtract")
                          }
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={passengers.children <= 0}
                        >
                          <Minus className="w-4 h-4 text-gray-600" />
                        </button>
                        <span className="w-8 text-center font-medium">
                          {passengers.children}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handlePassengerChange &&
                            handlePassengerChange("children", "add")
                          }
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                        >
                          <Plus className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </div>

                    {/* Infants */}
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <p className="font-medium text-gray-800">Em bé</p>
                        <p className="text-sm text-gray-500">
                          &lt; 2 tuổi (Miễn phí)
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            handlePassengerChange &&
                            handlePassengerChange("infants", "subtract")
                          }
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={passengers.infants <= 0}
                        >
                          <Minus className="w-4 h-4 text-gray-600" />
                        </button>
                        <span className="w-8 text-center font-medium">
                          {passengers.infants}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handlePassengerChange &&
                            handlePassengerChange("infants", "add")
                          }
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                        >
                          <Plus className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassengerModal && setShowPassengerModal(false)
                      }
                      className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}

                {passengerError && (
                  <p className="text-red-600 text-sm mt-2">{passengerError}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Đánh giá và Bình luận */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Đánh giá sao */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-2xl font-semibold mb-6">
                Đánh giá chuyến xe
              </h2>

              {/* Thống kê rating */}
              <div className="flex items-center gap-8 mb-8 p-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl">
                <div className="text-center">
                  <div className="text-5xl font-bold text-emerald-600 mb-2">
                    {transport.rating > 0 ? transport.rating.toFixed(1) : "N/A"}
                  </div>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= Math.round(transport.rating || 0)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">
                    {transport.rating_count || 0} đánh giá
                  </p>
                </div>

                <div className="flex-1">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = transport.rating_breakdown?.[star] || 0;
                    const percentage =
                      transport.rating_count > 0
                        ? ((count / transport.rating_count) * 100).toFixed(0)
                        : 0;

                    return (
                      <div key={star} className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-medium w-12">
                          {star} sao
                        </span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-400 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 w-12 text-right">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Form đánh giá - hiện nếu user đã đăng nhập */}
              {currentUserId && onRatingClick && (
                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                  <h3 className="font-semibold mb-4">
                    {transport.user_has_rated
                      ? "Cập nhật đánh giá của bạn"
                      : "Bạn đánh giá chuyến xe này như thế nào?"}
                  </h3>
                  <div className="flex items-center gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => onRatingClick(star)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            star <= (hoverRating || userRating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                          onMouseEnter={() =>
                            setHoverRating && setHoverRating(star)
                          }
                          onMouseLeave={() =>
                            setHoverRating && setHoverRating(0)
                          }
                        />
                      </button>
                    ))}
                    {userRating > 0 && (
                      <span className="ml-2 text-sm font-medium text-gray-700">
                        {userRating}/5 sao
                      </span>
                    )}
                  </div>
                  {ratingError && (
                    <p className="text-red-600 text-sm mb-3">{ratingError}</p>
                  )}
                </div>
              )}

              {/* Thông báo chưa đăng nhập */}
              {!currentUserId && (
                <div className="bg-gray-50 rounded-xl p-4 mb-6 text-center">
                  <p className="text-gray-600">
                    Vui lòng{" "}
                    <button
                      onClick={() => navigate("/login")}
                      className="text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      đăng nhập
                    </button>{" "}
                    để đánh giá chuyến xe này
                  </p>
                </div>
              )}
            </div>

            {/* Bình luận */}
            {onAddComment && (
              <CommentSection
                comments={transport.reviews || []}
                commentCount={transport.comment_count || 0}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
                likedComments={likedComments}
                onAddComment={onAddComment}
                onEditComment={onEditComment}
                onDeleteComment={onDeleteComment}
                onLikeComment={onLikeComment}
                onReloadComments={onReloadTransport}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransportDetail;
