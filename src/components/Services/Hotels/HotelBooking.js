import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Toast from "../../common/Toast";
import {
  MapPin,
  Star,
  Users,
  Calendar,
  CreditCard,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Mail,
  Phone,
  BedDouble,
  Info,
  CheckCircle2,
  Home,
  AlertCircle,
  QrCode,
  Wallet,
  Building2,
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../../../contexts/AuthContext";
import { API_URL, API_HOST } from "../../../config/api";

const HotelBooking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const bookingData = location.state;
  const { user } = useAuth();

  // Kiểm tra và chuyển hướng nếu không có dữ liệu
  useEffect(() => {
    if (
      !bookingData?.hotel ||
      !bookingData?.rooms ||
      bookingData.rooms.length === 0
    ) {
      console.log(
        "[DEBUG] Không có thông tin đặt phòng, chuyển hướng về trang khách sạn"
      );
      navigate("/hotels");
      return;
    }
  }, [bookingData, navigate]);

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [bookingInfo, setBookingInfo] = useState({
    guestInfo: {
      firstName: "", // Will be auto-filled from user profile
      lastName: "",
      email: "",
      phone: "",
      specialRequests: "",
    },
  });

  // ✅ Auto-fill guest info from user profile when logged in
  useEffect(() => {
    if (user) {
      // Parse full_name into firstName and lastName
      let firstName = "";
      let lastName = "";
      if (user.full_name) {
        const nameParts = user.full_name.trim().split(" ");
        if (nameParts.length >= 2) {
          // First word is last name (họ), rest is first name (tên và tên đệm)
          firstName = nameParts[0];
          lastName = nameParts.slice(1).join(" ");
        } else {
          firstName = user.full_name;
        }
      }

      setBookingInfo((prev) => ({
        ...prev,
        guestInfo: {
          ...prev.guestInfo,
          firstName: firstName || prev.guestInfo.firstName,
          lastName: lastName || prev.guestInfo.lastName,
          email: user.email || prev.guestInfo.email,
          phone: user.phone_number || prev.guestInfo.phone,
        },
      }));
    }
  }, [user]);

  // Payment states
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState("credit_card");
  const [paymentInfo, setPaymentInfo] = useState({
    credit_card: {
      cardNumber: "",
      cardHolder: "",
      expiry: "",
      cvv: "",
    },
    bank_transfer: {
      bank: "",
      accountNumber: "",
    },
    vnpay: {
      phone: "",
    },
    momo: {
      phone: "",
    },
  });

  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  // Toast helper
  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  // Định dạng giá
  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  // Định dạng ngày theo DD/MM/YYYY
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleInputChange = (section, field, value) => {
    setBookingInfo((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
    // Clear error khi user nhập
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handlePaymentInputChange = (method, field, value) => {
    setPaymentInfo((prev) => ({
      ...prev,
      [method]: {
        ...prev[method],
        [field]: value,
      },
    }));
  };

  const handleContinue = () => {
    // Reset errors
    setErrors({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    });

    // Validate required fields
    let hasError = false;
    const newErrors = {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    };

    if (!bookingInfo.guestInfo.firstName.trim()) {
      newErrors.firstName = "Vui lòng nhập họ";
      hasError = true;
    }

    if (!bookingInfo.guestInfo.lastName.trim()) {
      newErrors.lastName = "Vui lòng nhập tên";
      hasError = true;
    }

    if (!bookingInfo.guestInfo.email.trim()) {
      newErrors.email = "Vui lòng nhập email";
      hasError = true;
    } else if (!/\S+@\S+\.\S+/.test(bookingInfo.guestInfo.email)) {
      newErrors.email = "Email không hợp lệ";
      hasError = true;
    }

    if (!bookingInfo.guestInfo.phone.trim()) {
      newErrors.phone = "Vui lòng nhập số điện thoại";
      hasError = true;
    } else if (!/^0\d{9,10}$/.test(bookingInfo.guestInfo.phone)) {
      newErrors.phone = "Số điện thoại không hợp lệ (10-11 số, bắt đầu bằng 0)";
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      showToast("Vui lòng điền đầy đủ thông tin", "error");
      return;
    }

    setCurrentStep(2);
  };

  const handleConfirmBooking = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    try {
      // Tách contactInfo từ state bookingInfo
      const contactInfo = {
        name: `${bookingInfo.guestInfo?.firstName || ""} ${
          bookingInfo.guestInfo?.lastName || ""
        }`.trim(),
        email: bookingInfo.guestInfo?.email,
        phone: bookingInfo.guestInfo?.phone,
      };

      // Chuẩn bị dữ liệu bookingInfoObj
      const bookingInfoObj = {
        hotel: bookingData.hotel,
        rooms: bookingData.rooms,
        guests: bookingData.guests,
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        pricing: bookingData.pricing,
        contact: contactInfo,
        payment: {
          method: paymentMethods.find((m) => m.id === selectedPaymentMethod)
            ?.name,
          methodId: selectedPaymentMethod,
          info:
            selectedPaymentMethod === "credit_card"
              ? {
                  cardNumber: `**** **** **** ${paymentInfo.credit_card.cardNumber.slice(
                    -4
                  )}`,
                  cardHolder: paymentInfo.credit_card.cardHolder,
                }
              : selectedPaymentMethod === "bank_transfer"
              ? {
                  bank: paymentInfo.bank_transfer.bank,
                  accountNumber: paymentInfo.bank_transfer.accountNumber,
                }
              : selectedPaymentMethod === "vnpay" ||
                selectedPaymentMethod === "momo"
              ? { phone: paymentInfo[selectedPaymentMethod].phone }
              : {},
        },
        nights: bookingData.pricing?.totalNights,
        promotion: bookingData.pricing?.promotion,
        bookingCode: Math.random().toString(36).substring(2, 10).toUpperCase(),
        specialRequests: bookingInfo.guestInfo.specialRequests,
      };

      // Serialize chi tiết vào notes
      const notes = JSON.stringify({
        rooms: bookingData.rooms,
        promotion: bookingData.pricing?.promotion,
        payment: bookingInfoObj.payment,
        guests: bookingData.guests,
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        contact: bookingInfoObj.contact,
        nights: bookingData.pricing?.totalNights,
        total: bookingData.pricing?.finalTotal,
        specialRequests: bookingInfo.guestInfo.specialRequests,
        bookingCode: bookingInfoObj.bookingCode,
      });

      // Gửi booking lên backend
      const totalGuests =
        parseInt(bookingData.guests?.adults || 0) +
        parseInt(bookingData.guests?.children || 0);
      const roomCount = bookingData.rooms?.length || 0;

      const res = await axios.post(`${API_URL}/bookings`, {
        hotel_id: bookingData.hotel.id,
        user_id: user?.id,
        booking_date: new Date().toISOString().slice(0, 10),
        status: "pending",
        payment_status:
          selectedPaymentMethod === "pay_at_hotel" ? "pending" : "paid",
        payment_method: selectedPaymentMethod,
        service_type: "hotel",
        check_in: bookingData.checkIn,
        check_out: bookingData.checkOut,
        room_count: roomCount,
        guest_count: totalGuests,
        passenger_count: JSON.stringify({
          adults: parseInt(bookingData.guests.adults || 0),
          children: parseInt(bookingData.guests.children || 0),
          infants: 0,
        }),
        total_price: bookingData.pricing?.finalTotal,
        contact_email: bookingInfoObj.contact.email,
        contact_phone: bookingInfoObj.contact.phone,
        notes,
      });

      if (res.status === 201) {
        // Chuyển sang trang thành công
        navigate("/hotels/booking/success", {
          state: {
            bookingInfo: bookingInfoObj,
            bookingId: res.data.booking_id,
          },
        });
      }
    } catch (err) {
      console.error(
        "[DEBUG] Lỗi xác nhận đặt phòng:",
        err,
        err?.response?.data
      );
      showToast(
        err.response?.data?.error ||
          "Có lỗi khi xác nhận đặt phòng. Vui lòng thử lại!",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentStep !== 2) return;

    // Enhanced validation
    let errorMsg = "";

    // Validate payment info
    if (selectedPaymentMethod === "credit_card") {
      const { cardNumber, cardHolder, expiry, cvv } = paymentInfo.credit_card;
      if (!cardNumber || !/^\d{16}$/.test(cardNumber.replace(/\s/g, ""))) {
        errorMsg = "Vui lòng nhập số thẻ hợp lệ (16 số)";
      } else if (!cardHolder || cardHolder.trim().length < 3) {
        errorMsg = "Vui lòng nhập tên chủ thẻ hợp lệ";
      } else if (!expiry || !/^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(expiry)) {
        errorMsg = "Vui lòng nhập ngày hết hạn hợp lệ (MM/YY)";
      } else if (!cvv || !/^\d{3,4}$/.test(cvv)) {
        errorMsg = "Vui lòng nhập CVV hợp lệ (3-4 số)";
      }
    }
    // VNPay, Momo không cần validation vì đang ở chế độ test

    if (errorMsg) {
      showToast(errorMsg, "error");
      return;
    }

    setShowConfirmModal(true);
  };

  // Danh sách phương thức thanh toán
  const paymentMethods = [
    {
      id: "credit_card",
      name: "Thẻ tín dụng/ghi nợ",
      icon: <CreditCard className="w-6 h-6" />,
      description: "Thanh toán bằng thẻ Visa, Mastercard, JCB",
    },
    {
      id: "vnpay",
      name: "VNPay",
      icon: <QrCode className="w-6 h-6" />,
      description: "Thanh toán qua ví điện tử VNPay",
      testMode: true,
    },
    {
      id: "momo",
      name: "Momo",
      icon: <Wallet className="w-6 h-6" />,
      description: "Thanh toán qua ví Momo",
      testMode: true,
    },
    {
      id: "bank_transfer",
      name: "Chuyển khoản ngân hàng",
      icon: <Home className="w-6 h-6" />,
      description: "Chuyển khoản trực tiếp qua ngân hàng",
    },
    {
      id: "pay_at_hotel",
      name: "Thanh toán tại khách sạn",
      icon: <Home className="w-6 h-6" />,
      description: "Thanh toán trực tiếp khi nhận phòng",
    },
  ];

  const renderSteps = () => {
    return (
      <div className="flex items-center justify-center mb-8">
        <div
          className={`flex items-center ${
            currentStep === 1 ? "text-emerald-600" : "text-gray-400"
          }`}
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
              currentStep === 1
                ? "border-emerald-600 bg-emerald-50"
                : currentStep > 1
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "border-gray-300"
            }`}
          >
            {currentStep > 1 ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <Users className="w-5 h-5" />
            )}
          </div>
          <span className="ml-3 font-medium hidden sm:inline">
            Thông tin khách
          </span>
        </div>
        <div className="w-20 h-px bg-gray-300 mx-4"></div>
        <div
          className={`flex items-center ${
            currentStep === 2 ? "text-emerald-600" : "text-gray-400"
          }`}
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
              currentStep === 2
                ? "border-emerald-600 bg-emerald-50"
                : "border-gray-300"
            }`}
          >
            <CreditCard className="w-5 h-5" />
          </div>
          <span className="ml-3 font-medium hidden sm:inline">Thanh toán</span>
        </div>
      </div>
    );
  };

  const renderGuestInfoForm = () => {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Thông tin người đặt</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Họ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={bookingInfo.guestInfo.firstName}
                onChange={(e) =>
                  handleInputChange("guestInfo", "firstName", e.target.value)
                }
                className={`w-full border ${
                  errors.firstName ? "border-red-500" : "border-gray-300"
                } rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors`}
                placeholder="Nhập họ"
              />
              {errors.firstName && (
                <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={bookingInfo.guestInfo.lastName}
                onChange={(e) =>
                  handleInputChange("guestInfo", "lastName", e.target.value)
                }
                className={`w-full border ${
                  errors.lastName ? "border-red-500" : "border-gray-300"
                } rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors`}
                placeholder="Nhập tên"
              />
              {errors.lastName && (
                <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="email"
              value={bookingInfo.guestInfo.email}
              onChange={(e) =>
                handleInputChange("guestInfo", "email", e.target.value)
              }
              className={`w-full border ${
                errors.email ? "border-red-500" : "border-gray-300"
              } rounded-xl pl-11 pr-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors`}
              placeholder="example@email.com"
            />
            <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
          </div>
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Số điện thoại <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="tel"
              value={bookingInfo.guestInfo.phone}
              onChange={(e) =>
                handleInputChange("guestInfo", "phone", e.target.value)
              }
              className={`w-full border ${
                errors.phone ? "border-red-500" : "border-gray-300"
              } rounded-xl pl-11 pr-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors`}
              placeholder="0123456789"
            />
            <Phone className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
          </div>
          {errors.phone && (
            <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Yêu cầu đặc biệt
          </label>
          <textarea
            value={bookingInfo.guestInfo.specialRequests}
            onChange={(e) =>
              handleInputChange("guestInfo", "specialRequests", e.target.value)
            }
            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
            rows="4"
            placeholder="Ví dụ: Phòng tầng cao, phòng yên tĩnh, giường đôi..."
          />
        </div>
      </div>
    );
  };

  const renderPaymentForm = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Phương thức thanh toán</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                selectedPaymentMethod === method.id
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-gray-200 hover:border-emerald-300"
              }`}
              onClick={() => setSelectedPaymentMethod(method.id)}
            >
              <div className="flex items-start gap-3">
                <div className="text-emerald-600 mt-1">{method.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{method.name}</h4>
                    {selectedPaymentMethod === method.id && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {method.description}
                  </p>
                  {method.testMode && (
                    <span className="inline-block mt-2 text-xs px-2 py-1 bg-orange-100 text-orange-600 rounded">
                      Chế độ test
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Form chi tiết theo phương thức */}
      <div className="p-6 bg-gray-50 rounded-xl space-y-4">
        {selectedPaymentMethod === "credit_card" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số thẻ <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={paymentInfo.credit_card.cardNumber}
                  onChange={(e) =>
                    handlePaymentInputChange(
                      "credit_card",
                      "cardNumber",
                      e.target.value.replace(/\D/g, "")
                    )
                  }
                  className="w-full p-3 pl-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="1234 5678 9012 3456"
                  maxLength="16"
                />
                <CreditCard className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên chủ thẻ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={paymentInfo.credit_card.cardHolder}
                onChange={(e) =>
                  handlePaymentInputChange(
                    "credit_card",
                    "cardHolder",
                    e.target.value.toUpperCase()
                  )
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder="NGUYEN VAN A"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày hết hạn <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={paymentInfo.credit_card.expiry}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, "");
                    if (value.length >= 2) {
                      value = value.slice(0, 2) + "/" + value.slice(2, 4);
                    }
                    handlePaymentInputChange("credit_card", "expiry", value);
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="MM/YY"
                  maxLength="5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CVV <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={paymentInfo.credit_card.cvv}
                  onChange={(e) =>
                    handlePaymentInputChange(
                      "credit_card",
                      "cvv",
                      e.target.value.replace(/\D/g, "")
                    )
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="123"
                  maxLength="4"
                />
              </div>
            </div>
          </>
        )}

        {selectedPaymentMethod === "bank_transfer" && (
          <div className="space-y-4">
            {/* Thông tin chuyển khoản */}
            <div className="bg-gradient-to-br from-blue-50 to-emerald-50 rounded-xl p-6 border-2 border-emerald-200">
              <div className="flex items-center gap-3 mb-4">
                <Building2 className="w-6 h-6 text-emerald-600" />
                <h4 className="font-semibold text-gray-800">
                  Thông tin chuyển khoản
                </h4>
              </div>

              <div className="space-y-4">
                {/* Ngân hàng */}
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm text-gray-500 mb-1">Ngân hàng</p>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <p className="font-semibold text-lg text-gray-800">
                      MB Bank (Ngân hàng Quân đội)
                    </p>
                  </div>
                </div>

                {/* Số tài khoản */}
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm text-gray-500 mb-1">Số tài khoản</p>
                  <div className="flex items-center justify-between">
                    <p className="font-mono font-bold text-xl text-gray-800">
                      678919042003
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText("678919042003");
                        alert("Đã copy số tài khoản!");
                      }}
                      className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm hover:bg-emerald-200 transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                {/* Chủ tài khoản */}
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm text-gray-500 mb-1">Chủ tài khoản</p>
                  <p className="font-semibold text-lg text-gray-800 uppercase">
                    Đường Quốc Thắng
                  </p>
                </div>

                {/* Số tiền */}
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm text-gray-500 mb-1">Số tiền</p>
                  <p className="font-bold text-2xl text-emerald-600">
                    {formatPrice(bookingData?.pricing?.finalTotal || 0)}
                  </p>
                </div>

                {/* Nội dung chuyển khoản */}
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm text-gray-500 mb-1">
                    Nội dung chuyển khoản
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-gray-800">
                      DAT PHONG {bookingInfo.guestInfo.phone || "SDT"}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `DAT PHONG ${bookingInfo.guestInfo.phone || "SDT"}`
                        );
                        alert("Đã copy nội dung chuyển khoản!");
                      }}
                      className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm hover:bg-emerald-200 transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                {/* QR Code */}
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm text-gray-500 mb-3 text-center">
                    Quét mã QR để chuyển khoản
                  </p>
                  <div className="aspect-square max-w-[250px] mx-auto bg-white rounded-lg flex items-center justify-center p-2">
                    <img
                      src={`${API_URL}/uploads/QR/bank.jpg`}
                      alt="QR Code MBBank"
                      className="w-full h-full object-contain rounded-lg"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "block";
                      }}
                    />
                    <div
                      className="text-center hidden"
                      style={{ display: "none" }}
                    >
                      <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Mã QR MBBank</p>
                      <p className="text-xs text-gray-400 mt-1">678919042003</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lưu ý */}
              <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium mb-1">Lưu ý quan trọng:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Vui lòng chuyển khoản đúng số tiền và nội dung</li>
                      <li>
                        Đặt phòng sẽ được xác nhận sau khi nhận được thanh toán
                        (2-5 phút)
                      </li>
                      <li>
                        Liên hệ hotline nếu chưa nhận được xác nhận sau 15 phút
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {(selectedPaymentMethod === "vnpay" ||
          selectedPaymentMethod === "momo") && (
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                {selectedPaymentMethod === "vnpay" ? (
                  <QrCode className="w-6 h-6 text-emerald-600" />
                ) : (
                  <Wallet className="w-6 h-6 text-emerald-600" />
                )}
                <h4 className="font-medium">
                  Thanh toán qua{" "}
                  {selectedPaymentMethod === "vnpay" ? "VNPay" : "Momo"}
                </h4>
                <span className="ml-auto text-xs px-2 py-1 bg-orange-100 text-orange-600 rounded">
                  Chế độ test
                </span>
              </div>
              <div className="aspect-square max-w-[200px] mx-auto bg-white rounded-lg flex items-center justify-center p-2 mb-4">
                <img
                  src={`${API_URL}/uploads/QR/bank.jpg`}
                  alt={`QR Code ${
                    selectedPaymentMethod === "vnpay" ? "VNPay" : "Momo"
                  } Test`}
                  className="w-full h-full object-contain rounded-lg"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "block";
                  }}
                />
                <div className="text-center hidden" style={{ display: "none" }}>
                  {selectedPaymentMethod === "vnpay" ? (
                    <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                  ) : (
                    <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                  )}
                  <p className="text-sm text-gray-500">Mã QR Test</p>
                </div>
              </div>
              <div
                className={`p-3 rounded-lg border ${
                  selectedPaymentMethod === "vnpay"
                    ? "bg-blue-50 border-blue-200"
                    : "bg-pink-50 border-pink-200"
                }`}
              >
                <div className="flex items-start gap-2">
                  <Info
                    className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                      selectedPaymentMethod === "vnpay"
                        ? "text-blue-600"
                        : "text-pink-600"
                    }`}
                  />
                  <div
                    className={`text-sm ${
                      selectedPaymentMethod === "vnpay"
                        ? "text-blue-800"
                        : "text-pink-800"
                    }`}
                  >
                    <p className="font-medium mb-1">Chế độ test:</p>
                    <p className="text-xs">
                      Quét mã QR hoặc chuyển khoản vào tài khoản trên. Đơn hàng
                      sẽ được xác nhận tự động (không thu tiền thật).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderBookingSummary = () => {
    const hotel = bookingData?.hotel;
    const rooms = bookingData?.rooms || [];
    const guests = bookingData?.guests || { adults: 1, children: 0 };
    const nights = bookingData?.pricing?.totalNights || 1;
    const promotion = bookingData?.pricing?.promotion;

    const totalGuests = (guests.adults || 0) + (guests.children || 0);
    const totalCapacity = rooms.reduce((sum, r) => sum + (r.capacity || 0), 0);
    const hasCapacityWarning = totalGuests > totalCapacity;

    return (
      <div className="bg-gray-50 rounded-xl p-6 space-y-4">
        <h3 className="font-semibold text-lg">Tóm tắt đặt phòng</h3>

        {/* Thông tin khách sạn */}
        <div className="flex items-start gap-3 pb-4 border-b">
          <img
            src={
              hotel?.images?.[0]
                ? hotel.images[0].startsWith("http")
                  ? hotel.images[0]
                  : `${API_HOST}${hotel.images[0]}`
                : `${API_HOST}/images/placeholder.png`
            }
            alt={hotel?.name}
            className="w-16 h-16 object-cover rounded-lg"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `${API_HOST}/images/placeholder.png`;
            }}
          />
          <div className="flex-1">
            <h4 className="font-medium">{hotel?.name}</h4>
            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3" />
              {hotel?.location}
            </p>
            {hotel?.rating && (
              <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                {hotel.rating}/5
              </p>
            )}
          </div>
        </div>

        {/* Thời gian */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Nhận phòng:</span>
            <span className="font-medium">
              {formatDate(bookingData?.checkIn)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Trả phòng:</span>
            <span className="font-medium">
              {formatDate(bookingData?.checkOut)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Số đêm:</span>
            <span className="font-medium">{nights} đêm</span>
          </div>
        </div>

        {/* Phòng và khách */}
        <div className="pt-4 border-t space-y-2">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Phòng đã chọn:
            </p>
            {rooms.map((room, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-sm mb-1"
              >
                <span className="text-gray-600">{room.name}</span>
                <span className="text-gray-500">({room.capacity} người)</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Số khách:</span>
            <span className="font-medium">
              {guests.adults} người lớn
              {guests.children > 0 && `, ${guests.children} trẻ em`}
            </span>
          </div>
          {hasCapacityWarning && (
            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-orange-700">
                  Sức chứa tối đa: {totalCapacity} người. Tổng khách:{" "}
                  {totalGuests} người.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Chi tiết giá */}
        <div className="pt-4 border-t space-y-2">
          {rooms.map((room, idx) => {
            const roomTotal = room.basePrice * nights;
            return (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {room.name} × {nights} đêm
                </span>
                <span className="font-medium">{formatPrice(roomTotal)}</span>
              </div>
            );
          })}
          {promotion && (
            <div className="flex justify-between text-sm text-orange-600">
              <span>Giảm giá ({promotion.title})</span>
              <span>-{formatPrice(bookingData.pricing.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-lg pt-2 border-t">
            <span>Tổng cộng</span>
            <span className="text-emerald-600">
              {formatPrice(bookingData?.pricing?.finalTotal || 0)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Confirm Modal
  const ConfirmModal = () => (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold mb-2">Xác nhận đặt phòng</h3>
          <p className="text-gray-600">
            Bạn có chắc chắn muốn xác nhận đặt phòng này?
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Khách sạn:</span>
            <span className="font-medium">{bookingData?.hotel?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Số phòng:</span>
            <span className="font-medium">{bookingData?.rooms?.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tổng tiền:</span>
            <span className="font-medium text-emerald-600">
              {formatPrice(bookingData?.pricing?.finalTotal || 0)}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowConfirmModal(false)}
            disabled={loading}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleConfirmBooking}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              "Xác nhận"
            )}
          </button>
        </div>
      </div>
    </div>
  );

  if (!bookingData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-12">
        <div className="container mx-auto px-4">
          <button
            onClick={() => navigate(`/hotels/${bookingData?.hotel?.id}`)}
            className="flex items-center gap-2 text-white/90 mb-6 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Quay lại chi tiết khách sạn
          </button>
          <h1 className="text-3xl font-bold mb-2">Đặt phòng khách sạn</h1>
          <p className="text-emerald-100">
            {bookingData?.hotel?.name} • {bookingData?.rooms?.length} phòng
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form bên trái */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              {renderSteps()}

              {currentStep === 1 ? (
                <div>
                  {renderGuestInfoForm()}
                  <div className="border-t border-gray-200 mt-8 pt-6 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={handleContinue}
                      className="bg-emerald-600 text-white px-8 py-3 rounded-xl hover:bg-emerald-700 transition-colors font-medium flex items-center gap-2"
                    >
                      Tiếp tục
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {renderPaymentForm()}
                  <div className="border-t border-gray-200 mt-8 pt-6 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      Quay lại
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-emerald-600 text-white px-8 py-3 rounded-xl hover:bg-emerald-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          Xác nhận đặt phòng
                          <CheckCircle2 className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Summary bên phải */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">{renderBookingSummary()}</div>
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

      {/* Confirm Modal */}
      {showConfirmModal && <ConfirmModal />}
    </div>
  );
};

export default HotelBooking;
