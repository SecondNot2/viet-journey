import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Toast from "../../common/Toast";
import {
  XCircle,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Phone,
  Mail,
  Home,
  AlertCircle,
  Info,
} from "lucide-react";

const HotelBookingFailed = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { error, bookingData } = location.state || {};
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  // Các lý do thất bại phổ biến và giải pháp
  const errorReasons = [
    {
      code: "payment_failed",
      title: "Thanh toán thất bại",
      description:
        "Giao dịch thanh toán không thành công. Vui lòng kiểm tra thông tin thẻ hoặc tài khoản.",
      solutions: [
        "Kiểm tra số dư tài khoản",
        "Xác nhận thông tin thẻ chính xác",
        "Thử phương thức thanh toán khác",
        "Liên hệ ngân hàng nếu vấn đề tiếp diễn",
      ],
    },
    {
      code: "room_unavailable",
      title: "Phòng không còn trống",
      description: "Rất tiếc, phòng bạn chọn đã được đặt bởi khách hàng khác.",
      solutions: [
        "Chọn phòng khác trong cùng khách sạn",
        "Thử ngày check-in/check-out khác",
        "Tìm khách sạn tương tự",
      ],
    },
    {
      code: "system_error",
      title: "Lỗi hệ thống",
      description: "Đã xảy ra lỗi trong quá trình xử lý đặt phòng.",
      solutions: [
        "Thử lại sau vài phút",
        "Kiểm tra kết nối internet",
        "Xóa bộ nhớ cache và thử lại",
        "Liên hệ bộ phận hỗ trợ",
      ],
    },
    {
      code: "invalid_data",
      title: "Thông tin không hợp lệ",
      description: "Một số thông tin đặt phòng không chính xác hoặc thiếu.",
      solutions: [
        "Kiểm tra lại thông tin khách hàng",
        "Xác nhận ngày check-in/check-out",
        "Kiểm tra số lượng khách và phòng",
      ],
    },
    {
      code: "timeout",
      title: "Hết thời gian chờ",
      description:
        "Phiên đặt phòng đã hết hạn do không hoàn tất trong thời gian quy định.",
      solutions: [
        "Bắt đầu quy trình đặt phòng mới",
        "Hoàn tất nhanh hơn trong lần tiếp theo",
      ],
    },
  ];

  // Xác định lý do lỗi
  const getErrorInfo = () => {
    const errorMessage = error?.message || error || "";
    const errorLower = errorMessage.toLowerCase();

    if (
      errorLower.includes("payment") ||
      errorLower.includes("thanh toán") ||
      errorLower.includes("thẻ")
    ) {
      return errorReasons[0];
    } else if (
      errorLower.includes("room") ||
      errorLower.includes("phòng") ||
      errorLower.includes("available")
    ) {
      return errorReasons[1];
    } else if (
      errorLower.includes("timeout") ||
      errorLower.includes("hết hạn")
    ) {
      return errorReasons[4];
    } else if (
      errorLower.includes("invalid") ||
      errorLower.includes("không hợp lệ")
    ) {
      return errorReasons[3];
    } else {
      return errorReasons[2]; // System error by default
    }
  };

  const errorInfo = getErrorInfo();

  const handleRetry = () => {
    if (bookingData) {
      // Quay lại trang đặt phòng với dữ liệu cũ
      navigate(`/hotels/${bookingData.hotel?.id}/booking`, {
        state: bookingData,
      });
    } else {
      // Quay lại trang tìm kiếm
      navigate("/hotels");
    }
  };

  const handleBackToHotel = () => {
    if (bookingData?.hotel?.id) {
      navigate(`/hotels/${bookingData.hotel.id}`);
    } else {
      navigate("/hotels");
    }
  };

  const handleContactSupport = () => {
    showToast("Đang chuyển đến trang liên hệ...", "info");
    // Có thể thêm navigate đến trang contact
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Error Animation & Message */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-red-400 to-red-600 mb-6 shadow-lg animate-shake">
              <XCircle className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-3">
              Đặt phòng không thành công
            </h1>
            <p className="text-lg text-gray-600">
              Rất tiếc, chúng tôi không thể hoàn tất đặt phòng của bạn
            </p>
          </div>

          {/* Error Details Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
            {/* Error Type Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-8 h-8" />
                <div>
                  <h2 className="text-xl font-bold">{errorInfo.title}</h2>
                  <p className="text-red-100 text-sm mt-1">
                    {errorInfo.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Error Details */}
            <div className="p-8">
              {/* Booking Info (nếu có) */}
              {bookingData && (
                <div className="mb-6 pb-6 border-b">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Info className="w-5 h-5 text-gray-600" />
                    Thông tin đặt phòng
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                    {bookingData.hotel?.name && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Khách sạn:</span>
                        <span className="font-medium">
                          {bookingData.hotel.name}
                        </span>
                      </div>
                    )}
                    {bookingData.checkIn && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Nhận phòng:</span>
                        <span className="font-medium">
                          {new Date(bookingData.checkIn).toLocaleDateString(
                            "vi-VN"
                          )}
                        </span>
                      </div>
                    )}
                    {bookingData.checkOut && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Trả phòng:</span>
                        <span className="font-medium">
                          {new Date(bookingData.checkOut).toLocaleDateString(
                            "vi-VN"
                          )}
                        </span>
                      </div>
                    )}
                    {bookingData.rooms?.length && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Số phòng:</span>
                        <span className="font-medium">
                          {bookingData.rooms.length}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Solutions */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-4">
                  Giải pháp đề xuất
                </h3>
                <div className="space-y-3">
                  {errorInfo.solutions.map((solution, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100"
                    >
                      <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0 text-sm font-semibold mt-0.5">
                        {index + 1}
                      </div>
                      <p className="text-gray-700 text-sm">{solution}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Technical Error (nếu có) */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Chi tiết lỗi
                  </h4>
                  <p className="text-sm text-red-700 font-mono">
                    {typeof error === "string"
                      ? error
                      : error.message || "Unknown error"}
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="border-t bg-gray-50 p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={handleRetry}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium"
                >
                  <RefreshCw className="w-5 h-5" />
                  Thử lại
                </button>
                <button
                  onClick={handleBackToHotel}
                  className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-medium"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Quay lại khách sạn
                </button>
              </div>
              <button
                onClick={() => navigate("/hotels")}
                className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-3 border-2 border-emerald-600 text-emerald-600 rounded-xl hover:bg-emerald-50 transition-colors font-medium"
              >
                <Home className="w-5 h-5" />
                Tìm kiếm khách sạn khác
              </button>
            </div>
          </div>

          {/* Support Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="font-semibold text-gray-800 mb-2 text-center">
              Cần hỗ trợ thêm?
            </h3>
            <p className="text-gray-600 text-center mb-4">
              Đội ngũ chăm sóc khách hàng của chúng tôi luôn sẵn sàng giúp đỡ
              bạn
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:support@vietjourney.com"
                className="flex items-center justify-center gap-2 px-4 py-2 text-emerald-600 hover:text-emerald-700 transition-colors"
                onClick={() => showToast("Đang mở ứng dụng email...", "info")}
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
            <div className="mt-4 text-center">
              <button
                onClick={handleContactSupport}
                className="text-sm text-gray-600 hover:text-emerald-600 transition-colors underline"
              >
                Gửi yêu cầu hỗ trợ trực tuyến
              </button>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h4 className="font-medium text-amber-900 mb-2 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Mẹo hữu ích
            </h4>
            <ul className="space-y-1 text-sm text-amber-800">
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-1">•</span>
                <span>
                  Kiểm tra kỹ thông tin trước khi xác nhận để tránh lỗi
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-1">•</span>
                <span>
                  Đảm bảo kết nối internet ổn định trong quá trình đặt phòng
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-1">•</span>
                <span>Có sẵn thông tin thanh toán để hoàn tất nhanh chóng</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-1">•</span>
                <span>Liên hệ ngay với bộ phận hỗ trợ nếu gặp khó khăn</span>
              </li>
            </ul>
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

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          10%,
          30%,
          50%,
          70%,
          90% {
            transform: translateX(-5px);
          }
          20%,
          40%,
          60%,
          80% {
            transform: translateX(5px);
          }
        }
        .animate-shake {
          animation: shake 0.5s;
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-in;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default HotelBookingFailed;
