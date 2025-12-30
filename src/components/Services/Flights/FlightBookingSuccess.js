import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CheckCircle,
  Download,
  ArrowRight,
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  CreditCard,
  Mail,
  Phone,
  Plane,
  Info,
  User,
  Clock,
  Armchair,
} from "lucide-react";

const FlightBookingSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { bookingInfo, flight, pricing } = location.state || {};

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDuration = (minutes) => {
    if (!minutes) return "";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  const getPassengerTypeText = (type) => {
    switch (type) {
      case "adult":
        return "Người lớn";
      case "child":
        return "Trẻ em";
      case "infant":
        return "Em bé";
      default:
        return type;
    }
  };

  const getTitleText = (title) => {
    switch (title) {
      case "mr":
        return "Ông";
      case "mrs":
        return "Bà";
      case "ms":
        return "Cô";
      default:
        return title;
    }
  };

  // ✅ Data Display Priority Pattern - handle missing data gracefully
  const getFlightInfo = (field) => {
    if (!flight) return "Chưa xác định";

    switch (field) {
      case "airline":
        return flight.airline || "Chưa xác định";
      case "flightNumber":
        return flight.flightNumber || flight.flight_number || "Chưa xác định";
      case "from":
        return flight.from || flight.from_location || "Chưa xác định";
      case "to":
        return flight.to || flight.to_location || "Chưa xác định";
      case "departureTime":
        // Priority: formatted date → departure_time → "Chưa xác định"
        if (flight.departureTime) return flight.departureTime;
        if (flight.departure_time) {
          const date = new Date(flight.departure_time);
          return date.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          });
        }
        return "Chưa xác định";
      case "departureHour":
        // Priority: formatted time → departure_time → "Chưa xác định"
        if (flight.departureHour) return flight.departureHour;
        if (flight.departure_time) {
          const date = new Date(flight.departure_time);
          return date.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });
        }
        return "Chưa xác định";
      case "seatClass":
        const seatClass = flight.seat_class || "economy";
        const seatClassMap = {
          economy: "Phổ thông",
          premium_economy: "Phổ thông đặc biệt",
          business: "Thương gia",
          first: "Hạng nhất",
        };
        return seatClassMap[seatClass] || "Phổ thông";
      case "duration":
        if (flight.duration) return formatDuration(flight.duration);
        return "Chưa xác định";
      default:
        return "Chưa xác định";
    }
  };

  // ✅ Validate required data
  if (!bookingInfo || !flight) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Không tìm thấy thông tin đặt vé
          </h2>
          <p className="text-gray-600 mb-4">
            Vui lòng kiểm tra lịch sử đặt vé trong trang cá nhân của bạn
          </p>
          <button
            onClick={() => navigate("/flights")}
            className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Quay lại trang tìm kiếm
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Success Message */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-3">
              Đặt vé thành công!
            </h1>
            <p className="text-lg text-gray-600">
              Chúng tôi đã gửi xác nhận đặt vé đến email của bạn
            </p>
          </div>

          {/* Booking Details */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Chi tiết đặt vé</h2>
                <span className="px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                  {bookingInfo.payment.status === "confirmed"
                    ? "Đã xác nhận"
                    : "Chờ xác nhận"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Mã đặt vé</p>
                  <p className="font-medium text-lg">{bookingInfo.bookingId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Tổng thanh toán</p>
                  <p className="font-medium text-lg text-emerald-600">
                    {formatPrice(bookingInfo.totalPrice)}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50">
              <h3 className="font-medium text-gray-800 mb-4">
                Thông tin chuyến bay
              </h3>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="flex items-start gap-3">
                  <Plane className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Chuyến bay</p>
                    <p className="font-medium">{getFlightInfo("airline")}</p>
                    <p className="text-sm text-gray-600">
                      {getFlightInfo("flightNumber")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Hành trình</p>
                    <p className="font-medium">
                      {getFlightInfo("from")} → {getFlightInfo("to")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Ngày bay</p>
                    <p className="font-medium">
                      {getFlightInfo("departureTime")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Giờ bay</p>
                    <p className="font-medium">
                      {getFlightInfo("departureHour")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Armchair className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Hạng ghế</p>
                    <p className="font-medium">{getFlightInfo("seatClass")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Thời gian bay</p>
                    <p className="font-medium">{getFlightInfo("duration")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Hành khách</p>
                    <p className="font-medium">
                      {bookingInfo.passengers?.length || 0} người
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Passenger Details */}
            <div className="p-6 border-t border-gray-100">
              <h3 className="font-medium text-gray-800 mb-4">
                Thông tin hành khách
              </h3>
              <div className="space-y-4">
                {bookingInfo.passengers?.map((passenger, index) => {
                  // ✅ Safe data access with fallbacks
                  const passengerType = passenger.passenger_type || "adult";
                  const title = passenger.title || "";
                  const firstName =
                    passenger.first_name || passenger.firstName || "";
                  const lastName =
                    passenger.last_name || passenger.lastName || "";
                  const dob = passenger.dob || "";
                  const nationality = passenger.nationality || "Vietnam";
                  const passportNumber =
                    passenger.passport_number ||
                    passenger.passportNumber ||
                    "N/A";
                  const specialReq =
                    passenger.special_requirements ||
                    passenger.specialRequirements ||
                    "";

                  return (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="w-5 h-5 text-emerald-600" />
                          <span className="text-sm font-medium text-emerald-600">
                            {getPassengerTypeText(passengerType)} #{index + 1}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {getTitleText(title)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="font-medium text-gray-800">
                            {lastName} {firstName}
                          </p>
                          <div className="mt-2 space-y-1 text-sm text-gray-600">
                            <div>
                              <span className="text-gray-500">Ngày sinh:</span>{" "}
                              {dob
                                ? new Date(dob).toLocaleDateString("vi-VN")
                                : "N/A"}
                            </div>
                            <div>
                              <span className="text-gray-500">Quốc tịch:</span>{" "}
                              {nationality}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div>
                            <span className="text-gray-500">
                              Số hộ chiếu/CMND:
                            </span>{" "}
                            <span className="font-medium">
                              {passportNumber}
                            </span>
                          </div>
                          {specialReq && (
                            <div>
                              <span className="text-gray-500">
                                Yêu cầu đặc biệt:
                              </span>{" "}
                              <span className="text-orange-600">
                                {specialReq}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }) || []}
              </div>
            </div>

            <div className="p-6 border-t border-gray-100">
              <h3 className="font-medium text-gray-800 mb-4">
                Thông tin liên hệ
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{bookingInfo.contact.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Số điện thoại</p>
                    <p className="font-medium">{bookingInfo.contact.phone}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="p-6 border-t border-gray-100">
              <h3 className="font-medium text-gray-800 mb-4">
                Thông tin thanh toán
              </h3>
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">
                    Phương thức thanh toán
                  </p>
                  <p className="font-medium">
                    {bookingInfo.payment.method === "credit_card"
                      ? "Thẻ tín dụng/ghi nợ"
                      : bookingInfo.payment.method === "bank_transfer"
                      ? "Chuyển khoản ngân hàng"
                      : bookingInfo.payment.method === "vnpay"
                      ? "VNPay"
                      : "Momo"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="grid gap-4 md:grid-cols-2">
            <button className="inline-flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 px-6 rounded-xl hover:bg-emerald-700 transition-colors font-medium">
              <Download className="w-5 h-5" />
              Tải hóa đơn
            </button>
            <button
              onClick={() => navigate("/flights")}
              className="inline-flex items-center justify-center gap-2 bg-white text-gray-800 py-3 px-6 rounded-xl hover:bg-gray-50 transition-colors font-medium border border-gray-200"
            >
              Tiếp tục tìm kiếm
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Important Information */}
          <div className="mt-8 bg-blue-50 rounded-xl p-6">
            <h3 className="font-medium text-blue-900 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5" />
              Lưu ý quan trọng
            </h3>
            <ul className="space-y-2 text-blue-800">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2" />
                <span>Vui lòng kiểm tra email để xem chi tiết đặt vé</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2" />
                <span>
                  Mang theo CMND/CCCD và thẻ thanh toán khi làm thủ tục check-in
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2" />
                <span>
                  Có mặt tại sân bay trước giờ khởi hành 2 tiếng với chuyến bay
                  quốc tế và 1.5 tiếng với chuyến bay nội địa
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2" />
                <span>
                  Kiểm tra kỹ hành lý xách tay và ký gửi theo quy định của hãng
                  bay
                </span>
              </li>
            </ul>
          </div>

          {/* Support Contact */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-2">
              Cần hỗ trợ? Liên hệ với chúng tôi
            </p>
            <div className="flex items-center justify-center gap-6">
              <a
                href="tel:1900xxxx"
                className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700"
              >
                <Phone className="w-5 h-5" />
                1900 xxxx
              </a>
              <a
                href="mailto:support@vietjourney.vn"
                className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700"
              >
                <Mail className="w-5 h-5" />
                support@vietjourney.vn
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightBookingSuccess;
