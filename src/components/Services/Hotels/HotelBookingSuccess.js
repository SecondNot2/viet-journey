import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Toast from "../../common/Toast";
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
  Info,
  Star,
  BedDouble,
  Clock,
  Home,
  Printer,
} from "lucide-react";

const HotelBookingSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { bookingInfo, bookingId } = location.state || {};
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleDownloadInvoice = () => {
    showToast("Tính năng tải xuống hóa đơn đang được phát triển", "info");
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  if (!bookingInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg max-w-md w-full mx-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Info className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Không tìm thấy thông tin đặt phòng
          </h2>
          <p className="text-gray-600 mb-6">
            Vui lòng kiểm tra lại hoặc liên hệ với chúng tôi để được hỗ trợ
          </p>
          <button
            onClick={() => navigate("/hotels")}
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700 transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Quay lại trang tìm kiếm
          </button>
        </div>
      </div>
    );
  }

  const hotel = bookingInfo.hotel;
  const rooms = bookingInfo.rooms || [];
  const guests = bookingInfo.guests || { adults: 1, children: 0 };
  const contact = bookingInfo.contact || {};
  const payment = bookingInfo.payment || {};
  const nights = bookingInfo.nights || bookingInfo.pricing?.totalNights || 1;
  const promotion = bookingInfo.promotion || bookingInfo.pricing?.promotion;
  const totalPrice = bookingInfo.pricing?.finalTotal || 0;
  const bookingCode = bookingInfo.bookingCode || "N/A";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Success Animation & Message */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 mb-6 shadow-lg animate-bounce-once">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-3">
              Đặt phòng thành công!
            </h1>
            <p className="text-lg text-gray-600">
              Chúng tôi đã gửi xác nhận đặt phòng đến email{" "}
              <span className="font-semibold text-emerald-600">
                {contact.email}
              </span>
            </p>
          </div>

          {/* Main Booking Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
            {/* Header với mã booking */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm mb-1">Mã đặt phòng</p>
                  <p className="text-2xl font-bold tracking-wider">
                    {bookingCode}
                  </p>
                  {bookingId && (
                    <p className="text-emerald-100 text-xs mt-1">
                      ID: #{bookingId}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-emerald-100 text-sm mb-1">Trạng thái</p>
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold">
                    <CheckCircle className="w-4 h-4" />
                    Đã xác nhận
                  </span>
                </div>
              </div>
            </div>

            {/* Booking Details */}
            <div className="p-8">
              {/* Thông tin khách sạn */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Home className="w-6 h-6 text-emerald-600" />
                  Thông tin khách sạn
                </h2>
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                  <img
                    src={
                      hotel?.images?.[0] ||
                      hotel?.image ||
                      "https://via.placeholder.com/100?text=Hotel"
                    }
                    alt={hotel?.name}
                    className="w-24 h-24 object-cover rounded-lg shadow-md"
                    onError={(e) => {
                      e.target.src =
                        "https://via.placeholder.com/100?text=Hotel";
                    }}
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {hotel?.name}
                    </h3>
                    <p className="text-gray-600 flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {hotel?.location}
                    </p>
                    {hotel?.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium text-gray-700">
                          {hotel.rating}/5
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Thông tin đặt phòng */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-600" />
                    Thời gian lưu trú
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nhận phòng:</span>
                      <span className="font-medium">
                        {formatDate(bookingInfo.checkIn)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Trả phòng:</span>
                      <span className="font-medium">
                        {formatDate(bookingInfo.checkOut)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-600">Số đêm:</span>
                      <span className="font-semibold text-emerald-600">
                        {nights} đêm
                      </span>
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div className="text-xs text-blue-700">
                        <p className="font-medium mb-1">Lưu ý thời gian:</p>
                        <p>• Nhận phòng: Từ 14:00</p>
                        <p>• Trả phòng: Trước 12:00</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-600" />
                    Thông tin khách
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tên khách:</span>
                      <span className="font-medium">{contact.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Số khách:</span>
                      <span className="font-medium">
                        {guests.adults + guests.children} người
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 border-t pt-2">
                      {guests.adults} người lớn
                      {guests.children > 0 && `, ${guests.children} trẻ em`}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{contact.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{contact.phone}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phòng đã chọn */}
              <div className="mb-8">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <BedDouble className="w-5 h-5 text-emerald-600" />
                  Phòng đã đặt
                </h3>
                <div className="space-y-3">
                  {rooms.map((room, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div>
                        <h4 className="font-medium text-gray-800">
                          {room.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Sức chứa: {room.capacity} người
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          {formatPrice(room.basePrice)} × {nights} đêm
                        </p>
                        <p className="font-semibold text-emerald-600">
                          {formatPrice(room.basePrice * nights)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chi tiết thanh toán */}
              <div className="mb-8">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  Chi tiết thanh toán
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Phương thức:</span>
                    <span className="font-medium">{payment.method}</span>
                  </div>
                  {payment.info?.cardNumber && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Số thẻ:</span>
                      <span className="font-mono">
                        {payment.info.cardNumber}
                      </span>
                    </div>
                  )}
                  <div className="border-t pt-3 space-y-2">
                    {rooms.map((room, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {room.name} ({nights} đêm)
                        </span>
                        <span>{formatPrice(room.basePrice * nights)}</span>
                      </div>
                    ))}
                    {promotion && (
                      <div className="flex justify-between text-sm text-orange-600">
                        <span>Giảm giá ({promotion.title})</span>
                        <span>
                          -
                          {formatPrice(
                            bookingInfo.pricing?.discountAmount || 0
                          )}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t pt-3">
                      <span>Tổng thanh toán</span>
                      <span className="text-emerald-600">
                        {formatPrice(totalPrice)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Yêu cầu đặc biệt */}
              {bookingInfo.specialRequests && (
                <div className="mb-8">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Info className="w-5 h-5 text-emerald-600" />
                    Yêu cầu đặc biệt
                  </h3>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-gray-700">
                      {bookingInfo.specialRequests}
                    </p>
                  </div>
                </div>
              )}

              {/* Important Notes */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  Lưu ý quan trọng
                </h4>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>
                      Vui lòng mang theo CMND/CCCD và email xác nhận khi nhận
                      phòng
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>
                      Kiểm tra kỹ thông tin đặt phòng trong email xác nhận
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>
                      Liên hệ trực tiếp với khách sạn nếu có thay đổi lịch trình
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>
                      Chính sách hủy phòng: Miễn phí hủy trước 24 giờ nhận phòng
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="border-t bg-gray-50 p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handlePrintInvoice}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-emerald-600 text-emerald-600 rounded-xl hover:bg-emerald-50 transition-colors font-medium"
                >
                  <Printer className="w-5 h-5" />
                  In xác nhận
                </button>
                <button
                  onClick={handleDownloadInvoice}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-medium"
                >
                  <Download className="w-5 h-5" />
                  Tải hóa đơn
                </button>
                <button
                  onClick={() => navigate("/hotels")}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium"
                >
                  Tiếp tục tìm kiếm
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Support Contact */}
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <h3 className="font-semibold text-gray-800 mb-2">
              Cần hỗ trợ thêm?
            </h3>
            <p className="text-gray-600 mb-4">
              Đội ngũ chăm sóc khách hàng của chúng tôi luôn sẵn sàng hỗ trợ bạn
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:support@vietjourney.com"
                className="flex items-center justify-center gap-2 px-4 py-2 text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                <Mail className="w-4 h-4" />
                support@vietjourney.com
              </a>
              <a
                href="tel:1900xxxx"
                className="flex items-center justify-center gap-2 px-4 py-2 text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                <Phone className="w-4 h-4" />
                1900 xxxx
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default HotelBookingSuccess;
