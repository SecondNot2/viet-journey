import React, { useState } from "react";
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
  Info,
  Clock,
  Mountain,
  UserCheck,
  BadgePercent,
} from "lucide-react";

const TourBookingSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { bookingInfo, tour } = location.state || {};
  const [showModal, setShowModal] = useState(false);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Sinh mã đặt tour ngẫu nhiên
  const bookingCode =
    bookingInfo?.bookingCode ||
    Math.random().toString(36).substring(2, 10).toUpperCase();

  if (!bookingInfo || !tour) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Không tìm thấy thông tin đặt tour
          </h2>
          <button
            onClick={() => navigate("/tours")}
            className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Quay lại trang tìm kiếm
          </button>
        </div>
      </div>
    );
  }

  const contact = bookingInfo.personalInfo || {};
  const payment = bookingInfo.payment || {};
  const guests = bookingInfo.tourDetails?.guests || { adults: 1, children: 0 };
  const totalGuests = guests.adults + guests.children;

  // Tính toán chi tiết giá (Following Transport pattern)
  const calculatePricing = () => {
    const basePrice = tour?.price || 0;

    // Calculate base totals
    const adultTotal = basePrice * guests.adults;
    const childrenTotal = basePrice * 0.7 * guests.children; // Children get 30% discount
    const totalBeforeDiscount = adultTotal + childrenTotal;

    let discount = 0;
    let promotion = null;

    // Try to get promotion from notes first, then from tour data
    try {
      const notes =
        typeof bookingInfo.notes === "string"
          ? JSON.parse(bookingInfo.notes)
          : bookingInfo.notes;

      promotion = notes?.tourDetails?.promotion || tour?.promotions?.[0];
    } catch (e) {
      console.error("Error parsing notes:", e);
      promotion = tour?.promotions?.[0];
    }

    if (promotion) {
      if (promotion.type === "percentage") {
        discount = Math.round(totalBeforeDiscount * (promotion.discount / 100));
      } else {
        discount = Math.min(Number(promotion.discount), totalBeforeDiscount);
      }
    }

    const finalTotal =
      bookingInfo.total_price || totalBeforeDiscount - discount;

    return {
      basePrice,
      adultTotal,
      childrenTotal,
      totalBeforeDiscount,
      discount,
      finalTotal,
      promotion,
    };
  };

  const pricing = calculatePricing();

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
              Đặt tour thành công!
            </h1>
            <p className="text-lg text-gray-600">
              Chúng tôi đã gửi xác nhận đặt tour đến email của bạn
            </p>
          </div>

          {/* Booking Details */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Chi tiết đặt tour</h2>
                <span className="px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                  Đã xác nhận
                </span>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Mã đặt tour</p>
                  <p className="font-medium text-lg">{bookingCode}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Tổng thanh toán</p>
                  <p className="font-medium text-lg text-emerald-600">
                    {formatPrice(pricing.finalTotal)}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50">
              <h3 className="font-medium text-gray-800 mb-4">
                Thông tin chuyến đi
              </h3>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Tour</p>
                    <p className="font-medium">{tour?.title}</p>
                    <p className="text-sm text-gray-600">{tour?.location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Ngày khởi hành</p>
                    <p className="font-medium">
                      {formatDate(bookingInfo.tourDetails?.startDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Thời gian</p>
                    <p className="font-medium">
                      {Math.ceil(tour?.duration / (24 * 60))} ngày
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Số khách</p>
                    <p className="font-medium">
                      {guests.adults} người lớn
                      {guests.children > 0 && `, ${guests.children} trẻ em`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Chi tiết tour */}
              <div className="mt-6">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4 text-emerald-600" /> Chi tiết tour
                </h4>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="flex items-start gap-2">
                    <Mountain className="w-4 h-4 text-emerald-600 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Độ khó</p>
                      <p className="font-medium">
                        {tour?.difficulty_level === "easy"
                          ? "Dễ"
                          : tour?.difficulty_level === "moderate"
                          ? "Trung bình"
                          : tour?.difficulty_level === "challenging"
                          ? "Thử thách"
                          : tour?.difficulty_level === "difficult"
                          ? "Khó"
                          : "Không xác định"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-600 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Hướng dẫn viên</p>
                      <p className="font-medium">
                        {tour?.guide_name || "Đang cập nhật"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chi tiết giá */}
              <div className="mt-6">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" /> Chi tiết
                  giá
                </h4>
                <div className="bg-white rounded-lg p-4 space-y-3">
                  {/* Adult tickets */}
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">
                        Người lớn
                      </p>
                      <p className="text-xs text-gray-500">
                        {guests.adults} người × {formatPrice(pricing.basePrice)}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-800">
                      {formatPrice(pricing.adultTotal)}
                    </p>
                  </div>

                  {/* Children tickets */}
                  {guests.children > 0 && (
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">
                          Trẻ em
                        </p>
                        <p className="text-xs text-gray-500">
                          {guests.children} người ×{" "}
                          {formatPrice(pricing.basePrice * 0.7)}
                        </p>
                        <p className="text-xs text-emerald-600 mt-1">
                          (Giảm 30% so với người lớn)
                        </p>
                      </div>
                      <p className="font-semibold text-gray-800">
                        {formatPrice(pricing.childrenTotal)}
                      </p>
                    </div>
                  )}

                  {/* Subtotal */}
                  {pricing.discount > 0 && (
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                      <span className="text-sm font-medium text-gray-600">
                        Tạm tính
                      </span>
                      <span className="font-semibold text-gray-700">
                        {formatPrice(pricing.totalBeforeDiscount)}
                      </span>
                    </div>
                  )}

                  {/* Discount */}
                  {pricing.discount > 0 && pricing.promotion && (
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-orange-700 flex items-center gap-1">
                          <BadgePercent className="w-4 h-4" />
                          {pricing.promotion.title || "Khuyến mãi"}
                        </p>
                        <p className="text-xs text-orange-600 mt-1">
                          Giảm{" "}
                          {pricing.promotion.type === "percentage"
                            ? `${pricing.promotion.discount}%`
                            : formatPrice(pricing.promotion.discount)}
                        </p>
                      </div>
                      <p className="font-bold text-orange-600">
                        -{formatPrice(pricing.discount)}
                      </p>
                    </div>
                  )}

                  {/* Total */}
                  <div className="border-t-2 border-gray-200 pt-3 flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">Tổng thanh toán</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        ({guests.adults + guests.children} người)
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-emerald-600">
                      {formatPrice(pricing.finalTotal)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Thông tin liên hệ */}
            <div className="p-6 border-t border-gray-100">
              <h3 className="font-medium text-gray-800 mb-4">
                Thông tin liên hệ
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{contact.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Số điện thoại</p>
                    <p className="font-medium">{contact.phone}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Thông tin thanh toán */}
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
                  <p className="font-medium">{payment.method}</p>
                  {payment.testTransaction && (
                    <p className="text-xs text-orange-600 mt-1">
                      Mã giao dịch test: {payment.testTransaction}
                    </p>
                  )}
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
              onClick={() => setShowModal(true)}
              className="inline-flex items-center justify-center gap-2 bg-white text-gray-800 py-3 px-6 rounded-xl hover:bg-gray-50 transition-colors font-medium border border-gray-200"
            >
              Tiếp tục tìm kiếm
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Modal xác nhận chuyển hướng */}
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full text-center">
                <h3 className="text-xl font-bold mb-4 text-gray-800">
                  Bạn muốn tiếp tục tìm tour khác?
                </h3>
                <p className="text-gray-600 mb-6">
                  Bạn sẽ được chuyển về trang danh sách tour.
                </p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={() => navigate("/tours")}
                    className="px-6 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-medium"
                  >
                    Xác nhận
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Important Information */}
          <div className="mt-8 bg-blue-50 rounded-xl p-6">
            <h3 className="font-medium text-blue-900 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5" />
              Lưu ý quan trọng
            </h3>
            <ul className="space-y-2 text-blue-800">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2" />
                <span>Vui lòng kiểm tra email để xem chi tiết đặt tour</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2" />
                <span>
                  Mang theo CMND/CCCD khi làm thủ tục check-in tại khách sạn
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2" />
                <span>
                  Có mặt tại điểm tập trung trước giờ khởi hành 30 phút
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2" />
                <span>
                  Kiểm tra kỹ hành lý cá nhân và các giấy tờ tùy thân cần thiết
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

export default TourBookingSuccess;
