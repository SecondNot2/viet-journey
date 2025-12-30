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
  Bus,
  Train,
  Info,
} from "lucide-react";

const TransportBookingSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { bookingInfo, transport, bookingId } = location.state || {};

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  if (!bookingInfo || !transport) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Không tìm thấy thông tin đặt vé
          </h2>
          <button
            onClick={() => navigate("/transport")}
            className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Quay lại trang tìm kiếm
          </button>
        </div>
      </div>
    );
  }

  const TransportIcon = transport.type === "train" ? Train : Bus;

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
                  Đã xác nhận
                </span>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Mã đặt vé</p>
                  <p className="font-medium text-lg">
                    #
                    {bookingId ||
                      Math.random().toString(36).substring(2, 10).toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Tổng thanh toán</p>
                  <p className="font-medium text-lg text-emerald-600">
                    {formatPrice(
                      transport.price * bookingInfo.passengers.adults +
                        (transport.price * bookingInfo.passengers.children) / 2
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50">
              <h3 className="font-medium text-gray-800 mb-4">
                Thông tin hành trình
              </h3>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="flex items-start gap-3">
                  <TransportIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Phương tiện</p>
                    <p className="font-medium">
                      {transport.vehicle_name ||
                        transport.name ||
                        (transport.type === "train" ? "Tàu hỏa" : "Xe khách")}
                    </p>
                    <p className="text-sm text-gray-600">
                      {transport.company ||
                        (transport.type === "train" ? "Tàu" : "Xe khách")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Hành trình</p>
                    <p className="font-medium">
                      {transport.from_location || transport.from} →{" "}
                      {transport.to_location || transport.to}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Ngày khởi hành</p>
                    <p className="font-medium">
                      {(() => {
                        // Priority 1: bookingInfo.date
                        if (bookingInfo.date) {
                          return new Date(bookingInfo.date).toLocaleDateString(
                            "vi-VN"
                          );
                        }
                        // Priority 2: transport.trip_date
                        if (transport.trip_date) {
                          return new Date(
                            transport.trip_date
                          ).toLocaleDateString("vi-VN");
                        }
                        // Priority 3: transport.departure_time
                        if (transport.departure_time) {
                          return new Date(
                            transport.departure_time
                          ).toLocaleDateString("vi-VN");
                        }
                        // Priority 4: transport.departure_datetime
                        if (transport.departure_datetime) {
                          return new Date(
                            transport.departure_datetime
                          ).toLocaleDateString("vi-VN");
                        }
                        return "Chưa xác định";
                      })()}
                    </p>
                    {transport.trip_code && (
                      <p className="text-xs text-gray-500 mt-1">
                        Mã chuyến: {transport.trip_code}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Hành khách</p>
                    <p className="font-medium">
                      {bookingInfo.passengers.adults +
                        bookingInfo.passengers.children}{" "}
                      người
                    </p>
                    <p className="text-sm text-gray-600">
                      {bookingInfo.passengers.adults} người lớn
                      {bookingInfo.passengers.children > 0 &&
                        `, ${bookingInfo.passengers.children} trẻ em`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              <h3 className="font-medium text-gray-800 mb-4">
                Thông tin liên hệ
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">
                      {bookingInfo.passengerDetails.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Số điện thoại</p>
                    <p className="font-medium">
                      {bookingInfo.passengerDetails.phone}
                    </p>
                  </div>
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
              onClick={() => navigate("/transport")}
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
                  Mang theo CMND/CCCD và thẻ thanh toán khi làm thủ tục lên
                  xe/tàu
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2" />
                <span>Có mặt tại điểm khởi hành trước 30 phút</span>
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

export default TransportBookingSuccess;
