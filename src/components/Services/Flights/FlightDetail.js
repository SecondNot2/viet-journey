import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_HOST } from "../../../config/api";
import {
  Plane,
  Clock,
  Calendar,
  Briefcase,
  Coffee,
  Wifi,
  Power,
  Monitor,
  File,
  Info,
  AlertCircle,
  ChevronRight,
  CreditCard,
  Wallet,
  Building2,
  Loader2,
  ArrowLeft,
} from "lucide-react";

const FlightDetail = ({ flight, onBook }) => {
  const [selectedTab, setSelectedTab] = useState("details");
  const navigate = useNavigate();

  // If flight is undefined, show loading state
  if (!flight) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-gray-600">Đang tải thông tin chuyến bay...</p>
        </div>
      </div>
    );
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (datetimeStr) => {
    if (!datetimeStr) return "";
    const date = new Date(datetimeStr);
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (datetimeStr) => {
    if (!datetimeStr) return "";
    const date = new Date(datetimeStr);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatDuration = (minutes) => {
    if (!minutes) return "";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  const getBaggage = () => {
    if (!flight.baggage) return { cabin: "7kg", checked: "20kg" };

    if (typeof flight.baggage === "string") {
      try {
        return JSON.parse(flight.baggage);
      } catch (e) {
        return { cabin: "7kg", checked: "20kg" };
      }
    }

    return flight.baggage;
  };

  const getAmenities = () => {
    if (!flight.amenities) return [];

    if (typeof flight.amenities === "string") {
      try {
        return JSON.parse(flight.amenities);
      } catch (e) {
        return [];
      }
    }

    return flight.amenities;
  };

  const getAmenityIcon = (amenity) => {
    switch (amenity) {
      case "meal":
        return <Coffee className="w-4 h-4" />;
      case "wifi":
        return <Wifi className="w-4 h-4" />;
      case "power":
        return <Power className="w-4 h-4" />;
      case "entertainment":
        return <Monitor className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const handleBooking = () => {
    navigate(`/flights/${flight.id}/booking`, {
      state: { flight },
    });
  };

  const from = flight.from_location || flight.from || "";
  const to = flight.to_location || flight.to || "";
  // Backend trả về departure_datetime/arrival_datetime
  const departureTime =
    flight.departure_datetime || flight.departure_time
      ? formatTime(flight.departure_datetime || flight.departure_time)
      : flight.departureTime || "";
  const arrivalTime =
    flight.arrival_datetime || flight.arrival_time
      ? formatTime(flight.arrival_datetime || flight.arrival_time)
      : flight.arrivalTime || "";
  const flightNumber = flight.flight_number || flight.flightNumber || "";
  const duration = formatDuration(flight.duration);
  const baggage = getBaggage();
  const amenities = getAmenities();
  const departureDate =
    flight.departure_datetime || flight.departure_time
      ? formatDate(flight.departure_datetime || flight.departure_time)
      : "";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-emerald-600 text-white py-12">
        <div className="container mx-auto px-4">
          <button
            onClick={() => navigate("/flights")}
            className="flex items-center gap-2 text-white mb-6 hover:text-emerald-100"
          >
            <ArrowLeft className="w-5 h-5" />
            Quay lại danh sách chuyến bay
          </button>
          <h1 className="text-3xl font-bold mb-2">Chi tiết chuyến bay</h1>
          <p className="text-emerald-100">
            {from} → {to}
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
                Thông tin chuyến bay
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
                {/* Flight Overview */}
                <div className="bg-gray-50 rounded-lg p-6 mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <img
                        src={flight.airlineLogo}
                        alt={flight.airline}
                        className="h-8"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `${API_HOST}/images/placeholder.png`;
                        }}
                      />
                      <div>
                        <h3 className="font-semibold text-lg">
                          {flight.airline}
                        </h3>
                        <p className="text-sm text-gray-500">{flightNumber}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {flight.promotion ? (
                        <div>
                          <p className="text-2xl font-bold text-orange-600">
                            {formatPrice(
                              flight.promotion.type === "percentage"
                                ? flight.price *
                                    (1 - flight.promotion.discount / 100)
                                : flight.price - flight.promotion.discount
                            )}
                          </p>
                          <p className="text-base text-gray-500 line-through">
                            {formatPrice(flight.price)}
                          </p>
                        </div>
                      ) : (
                        <p className="text-2xl font-bold text-emerald-600">
                          {formatPrice(flight.price)}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        {flight.seats} chỗ trống
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 justify-between">
                    <div>
                      <p className="text-2xl font-bold">{departureTime}</p>
                      <p className="text-gray-500">{from}</p>
                    </div>
                    <div className="flex-1 flex flex-col items-center">
                      <p className="text-sm text-gray-500">{duration}</p>
                      <div className="w-full flex items-center gap-2">
                        <div className="h-px flex-1 bg-gray-300"></div>
                        <Plane
                          size={20}
                          className="text-gray-400 transform rotate-90"
                        />
                        <div className="h-px flex-1 bg-gray-300"></div>
                      </div>
                      <p className="text-xs text-gray-500">Bay thẳng</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{arrivalTime}</p>
                      <p className="text-gray-500">{to}</p>
                    </div>
                  </div>
                </div>

                {/* Flight Details */}
                <div className="space-y-6">
                  {/* Aircraft Info */}
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <Plane className="w-6 h-6 text-gray-400" />
                    <div>
                      <p className="font-medium">Máy bay</p>
                      <p className="text-gray-500">{flight.aircraft}</p>
                    </div>
                  </div>

                  {/* Baggage Info */}
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <Briefcase className="w-6 h-6 text-gray-400" />
                    <div>
                      <p className="font-medium">Hành lý</p>
                      <p className="text-gray-500">
                        Xách tay: {baggage.cabin} / Ký gửi: {baggage.checked}
                      </p>
                    </div>
                  </div>

                  {/* Amenities */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="font-medium mb-4">Tiện nghi trên máy bay</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {amenities.map((amenity) => (
                        <div
                          key={amenity}
                          className="flex items-center gap-2 text-gray-500"
                        >
                          {getAmenityIcon(amenity)}
                          <span className="capitalize">
                            {amenity === "meal"
                              ? "Bữa ăn"
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
                    {/* Giá vé cơ bản */}
                    <div className="flex justify-between">
                      <span>Giá vé cơ bản</span>
                      <span>{formatPrice(flight.price)}</span>
                    </div>
                    {/* Giá hạng ghế */}
                    {Object.entries(flight.seat_classes).map(
                      ([className, data]) => (
                        <div
                          key={className}
                          className="flex justify-between text-gray-600"
                        >
                          <span>
                            Phụ thu{" "}
                            {className === "economy"
                              ? "Phổ thông"
                              : className === "premium_economy"
                              ? "Phổ thông đặc biệt"
                              : className === "business"
                              ? "Thương gia"
                              : "Hạng nhất"}
                          </span>
                          <span>{formatPrice(data.price || 0)}</span>
                        </div>
                      )
                    )}
                    {/* Khuyến mãi nếu có */}
                    {flight.promotion && (
                      <div className="flex justify-between text-orange-500">
                        <span>Khuyến mãi</span>
                        <span>
                          {flight.promotion.type === "percentage"
                            ? `-${formatPrice(
                                flight.price * (flight.promotion.discount / 100)
                              )}`
                            : `-${formatPrice(flight.promotion.discount)}`}
                        </span>
                      </div>
                    )}
                    {/* Thuế và phí */}
                    <div className="flex justify-between text-gray-600">
                      <span>Thuế và phí</span>
                      <span>{formatPrice(flight.price * 0.05)}</span>
                    </div>
                    {/* Tổng cộng */}
                    <div className="border-t pt-4 flex justify-between font-bold">
                      <span>Tổng cộng</span>
                      <span>
                        {formatPrice(
                          flight.promotion
                            ? (flight.promotion.type === "percentage"
                                ? flight.price *
                                  (1 - flight.promotion.discount / 100)
                                : flight.price - flight.promotion.discount) *
                                1.1
                            : flight.price * 1.1
                        )}
                      </span>
                    </div>

                    {/* Thông tin khuyến mãi */}
                    {flight.promotion && (
                      <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <h4 className="font-medium text-orange-600 mb-2">
                          Thông tin khuyến mãi
                        </h4>
                        <div className="space-y-2 text-sm">
                          <p className="text-gray-700">
                            {flight.promotion.title}
                          </p>
                          <p className="text-gray-600">
                            {flight.promotion.description}
                          </p>
                          <p className="text-orange-500">
                            Thời gian:{" "}
                            {new Date(
                              flight.promotion.start_date
                            ).toLocaleDateString("vi-VN")}{" "}
                            -{" "}
                            {new Date(
                              flight.promotion.end_date
                            ).toLocaleDateString("vi-VN")}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Ghi chú */}
                    <div className="text-sm text-gray-500 mt-4">
                      <p>* Giá vé đã bao gồm thuế và các loại phí</p>
                      <p>
                        * Giá vé có thể thay đổi tùy theo thời điểm đặt và số
                        lượng ghế còn trống
                      </p>
                      <p>* Thuế và phí: 5% giá vé</p>
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
                          Phí đổi vé: 300.000 VNĐ/vé + chênh lệch giá vé (nếu
                          có)
                        </li>
                        <li>
                          Chỉ được đổi ngày bay, không được đổi hành trình
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
                        <li>Phí hoàn vé: 400.000 VNĐ/vé</li>
                        <li>Thời gian hoàn tiền: 7-15 ngày làm việc</li>
                        <li>Không áp dụng hoàn vé cho vé khuyến mãi</li>
                      </ul>
                    </div>
                    {/* Hành lý */}
                    <div>
                      <h4 className="font-medium text-emerald-600 mb-2">
                        Quy định hành lý
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <p className="font-medium mb-1">Hành lý xách tay</p>
                          <ul className="list-disc list-inside space-y-1 text-gray-600">
                            <li>Phổ thông: {flight.baggage.cabin}</li>
                            <li>Kích thước tối đa: 56 x 36 x 23 cm</li>
                          </ul>
                        </div>
                        <div>
                          <p className="font-medium mb-1">Hành lý ký gửi</p>
                          <ul className="list-disc list-inside space-y-1 text-gray-600">
                            <li>Phổ thông: {flight.baggage.checked}</li>
                            <li>Phí hành lý quá cước: 200.000 VNĐ/kg</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    {/* Quy định khác */}
                    <div>
                      <h4 className="font-medium text-emerald-600 mb-2">
                        Quy định khác
                      </h4>
                      <ul className="list-disc list-inside space-y-2 text-gray-600">
                        <li>
                          Check-in trước giờ khởi hành 120 phút với chuyến bay
                          quốc tế
                        </li>
                        <li>
                          Check-in trước giờ khởi hành 90 phút với chuyến bay
                          nội địa
                        </li>
                        <li>
                          Mang theo giấy tờ tùy thân (CMND/CCCD/Hộ chiếu) còn
                          hiệu lực
                        </li>
                        <li>
                          Tuân thủ các quy định về an ninh, an toàn hàng không
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightDetail;
