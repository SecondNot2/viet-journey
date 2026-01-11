import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { useBreadcrumb } from "../../../contexts/BreadcrumbContext";
import axios from "axios";
import { API_URL, API_HOST } from "../../../config/api";
import {
  Calendar,
  Users,
  CreditCard,
  Phone,
  Mail,
  User,
  ArrowLeft,
  CalendarDays,
  MapPin,
  Clock,
  Info,
  Loader2,
  Plus,
  Minus,
  X,
  Mountain,
  DollarSign,
  BadgePercent,
  UserCheck,
  ChevronDown,
  QrCode,
  Building2,
  CheckCircle,
  Wallet,
  Check,
  AlertCircle,
} from "lucide-react";

const TourBooking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { setDynamicTitle } = useBreadcrumb();
  const guestModalRef = useRef(null);
  const {
    tour,
    bookingDetails: initialBookingDetails,
    summary,
  } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [tourData, setTourData] = useState(tour); // State để lưu thông tin tour động
  const [bookingInfo, setBookingInfo] = useState({
    personalInfo: {
      fullName: user?.full_name || "",
      email: user?.email || "",
      phone: user?.phone_number || "", // ✅ Fixed: use phone_number from AuthContext
    },
    tourDetails: {
      startDate: initialBookingDetails?.startDate || "",
      guests: initialBookingDetails?.guests || {
        adults: 1,
        children: 0,
      },
    },
    payment: {
      method: "card",
      cardNumber: "",
      cardHolder: "",
      expiry: "",
      cvv: "",
    },
    specialRequirements: "",
  });

  const [errors, setErrors] = useState({
    personalInfo: {
      fullName: "",
      email: "",
      phone: "",
    },
    tourDetails: {
      startDate: "",
    },
    payment: {
      cardNumber: "",
      cardHolder: "",
      expiry: "",
      cvv: "",
    },
  });

  const [showPassengerModal, setShowPassengerModal] = useState(false);
  const [passengerError, setPassengerError] = useState("");
  const [bookingSummary, setBookingSummary] = useState(
    summary || {
      basePrice: tour?.price || 0,
      totalPrice: 0,
      discount: 0,
    }
  );

  // Helper function: Parse group_size (có thể là "10" hoặc "8-10")
  const getMaxGroupSize = (groupSize) => {
    if (!groupSize) return 10; // Default
    const str = String(groupSize).trim();
    if (str.includes("-")) {
      // Trường hợp "8-10" hoặc "10-15" - lấy số lớn nhất
      const numbers = str
        .split("-")
        .map((n) => parseInt(n.trim()))
        .filter((n) => !isNaN(n));
      return numbers.length > 0 ? Math.max(...numbers) : 10;
    }
    // Trường hợp "10"
    return parseInt(str) || 10;
  };

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
      icon: <Building2 className="w-6 h-6" />,
      description: "Chuyển khoản trực tiếp qua ngân hàng",
    },
  ];

  // Helper functions
  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Redirect if no tour data + Set breadcrumb
  useEffect(() => {
    if (!tour) {
      navigate("/tours");
      return;
    }
    // Set dynamic breadcrumb title
    setDynamicTitle(tour.title || "Đặt tour");
    return () => setDynamicTitle("");
  }, [tour, navigate, setDynamicTitle]);

  // Fetch lại tour data khi thay đổi ngày khởi hành
  useEffect(() => {
    const fetchTourWithDate = async () => {
      if (!tour || !bookingInfo.tourDetails.startDate) return;

      try {
        const params = {
          selected_date: bookingInfo.tourDetails.startDate,
        };
        const response = await axios.get(`${API_URL}/tours/${tour.id}`, {
          params,
        });

        // Cập nhật tourData với available_seats mới
        setTourData((prevTour) => ({
          ...prevTour,
          available_seats: response.data.available_seats,
          total_booked: response.data.total_booked,
        }));
      } catch (error) {
        console.error("[DEBUG] Error fetching tour with date:", error);
      }
    };

    fetchTourWithDate();
  }, [bookingInfo.tourDetails.startDate, tour?.id]);

  // Cập nhật tổng tiền khi thông tin đặt tour thay đổi
  useEffect(() => {
    if (tour) {
      const basePrice = tour.price;
      let totalPrice =
        basePrice * bookingInfo.tourDetails.guests.adults +
        basePrice * 0.7 * bookingInfo.tourDetails.guests.children;
      let discount = 0;

      if (tour.promotions && tour.promotions.length > 0) {
        const promotion = tour.promotions[0];
        if (promotion.type === "percentage") {
          discount = totalPrice * (promotion.discount / 100);
        } else {
          discount = Math.min(promotion.discount, totalPrice);
        }
        totalPrice -= discount;
      }

      setBookingSummary({
        basePrice,
        totalPrice,
        discount,
      });
    }
  }, [tour, bookingInfo.tourDetails.guests]);

  // Thêm useEffect để xử lý click outside modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        guestModalRef.current &&
        !guestModalRef.current.contains(event.target)
      ) {
        setShowPassengerModal(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInputChange = (e, section) => {
    const { name, value } = e.target;
    setBookingInfo((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [name]: value,
      },
    }));
  };

  const validatePersonalInfo = () => {
    const newErrors = {
      fullName: "",
      email: "",
      phone: "",
    };
    let isValid = true;

    // Validate fullName
    if (!bookingInfo.personalInfo.fullName.trim()) {
      newErrors.fullName = "Vui lòng nhập họ tên";
      isValid = false;
    } else if (bookingInfo.personalInfo.fullName.trim().length < 2) {
      newErrors.fullName = "Họ tên phải có ít nhất 2 ký tự";
      isValid = false;
    }

    // Validate email
    if (!bookingInfo.personalInfo.email.trim()) {
      newErrors.email = "Vui lòng nhập email";
      isValid = false;
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bookingInfo.personalInfo.email)
    ) {
      newErrors.email = "Email không hợp lệ";
      isValid = false;
    }

    // Validate phone
    if (!bookingInfo.personalInfo.phone.trim()) {
      newErrors.phone = "Vui lòng nhập số điện thoại";
      isValid = false;
    } else {
      const phoneDigits = bookingInfo.personalInfo.phone.replace(/\D/g, "");
      if (phoneDigits.length < 10 || phoneDigits.length > 11) {
        newErrors.phone = "Số điện thoại phải có 10-11 số";
        isValid = false;
      } else if (!/^0/.test(phoneDigits)) {
        newErrors.phone = "Số điện thoại phải bắt đầu bằng số 0";
        isValid = false;
      }
    }

    // Validate tour details
    const tourErrors = {};
    if (!bookingInfo.tourDetails.startDate) {
      tourErrors.startDate = "Vui lòng chọn ngày khởi hành";
      isValid = false;
    } else {
      // Check if selected date is in the future
      const selectedDate = new Date(bookingInfo.tourDetails.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        tourErrors.startDate = "Ngày khởi hành phải là ngày trong tương lai";
        isValid = false;
      }

      // Check if selected date has available seats
      if (tourData?.available_seats === 0) {
        tourErrors.startDate = "Ngày này đã hết chỗ, vui lòng chọn ngày khác";
        isValid = false;
      }
    }

    // Validate guest count
    const totalGuests = getTotalGuests();
    const maxAvailableSeats =
      tourData?.available_seats !== undefined
        ? tourData.available_seats
        : getMaxGroupSize(tour?.group_size);

    if (totalGuests === 0) {
      setPassengerError("Vui lòng chọn ít nhất 1 hành khách");
      isValid = false;
    } else if (totalGuests > maxAvailableSeats) {
      setPassengerError(
        `Số lượng khách không được vượt quá ${maxAvailableSeats} người (còn lại)`
      );
      isValid = false;
    } else {
      setPassengerError("");
    }

    setErrors((prev) => ({
      ...prev,
      personalInfo: newErrors,
      tourDetails: tourErrors,
    }));

    return isValid;
  };

  const validatePayment = () => {
    // Bỏ validation - cho phép submit với bất kỳ giá trị nào
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (step === 1) {
      if (validatePersonalInfo()) {
        setStep(2);
      }
      return;
    }

    // Bỏ tất cả validation cho payment methods - cho phép submit với bất kỳ giá trị nào

    setLoading(true);
    try {
      // Chuẩn bị thông tin thanh toán
      const paymentDetails = {
        method: selectedPaymentMethod,
        info:
          selectedPaymentMethod === "credit_card"
            ? {
                cardNumber: paymentInfo.credit_card.cardNumber.slice(-4),
                cardHolder: paymentInfo.credit_card.cardHolder,
                expiry: paymentInfo.credit_card.expiry,
              }
            : selectedPaymentMethod === "bank_transfer"
            ? {
                bank: paymentInfo.bank_transfer.bank,
                accountNumber: paymentInfo.bank_transfer.accountNumber,
              }
            : selectedPaymentMethod === "vnpay" ||
              selectedPaymentMethod === "momo"
            ? {
                phone: paymentInfo[selectedPaymentMethod].phone,
              }
            : {},
      };

      // Chuẩn bị dữ liệu đặt tour theo cấu trúc database
      const bookingData = {
        user_id: user?.id,
        tour_id: tour.id,
        booking_date: bookingInfo.tourDetails.startDate, // Ngày khởi hành tour (QUAN TRỌNG!)
        status: "pending",
        payment_status: "pending",
        service_type: "tour",
        check_in: bookingInfo.tourDetails.startDate,
        guest_count: getTotalGuests(),
        passenger_count: JSON.stringify({
          adults: bookingInfo.tourDetails.guests.adults,
          children: bookingInfo.tourDetails.guests.children,
          infants: 0,
        }),
        total_price: bookingSummary.totalPrice,
        contact_email: bookingInfo.personalInfo.email,
        contact_phone: bookingInfo.personalInfo.phone,
        notes: JSON.stringify({
          specialRequirements: bookingInfo.specialRequirements,
          payment: paymentDetails,
          tourDetails: {
            title: tour.title,
            duration: tour.duration,
            startDate: bookingInfo.tourDetails.startDate,
            guests: bookingInfo.tourDetails.guests,
            promotion: tour.promotions?.[0],
          },
        }),
      };

      // Gọi API đặt tour
      const response = await axios.post(`${API_URL}/bookings`, bookingData);

      // Chuyển đến trang thành công
      navigate("/tours/booking/success", {
        state: {
          bookingInfo: {
            ...bookingData,
            booking_id: response.data.booking_id,
            personalInfo: bookingInfo.personalInfo,
            tourDetails: bookingInfo.tourDetails,
            payment: paymentDetails,
          },
          tour,
        },
      });
    } catch (error) {
      console.error("[DEBUG] Booking error:", error);
      alert(error.response?.data?.error || "Có lỗi xảy ra khi đặt tour");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div
        className={`flex items-center ${
          step === 1 ? "text-emerald-600" : "text-gray-400"
        }`}
      >
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
            step === 1 ? "border-emerald-600 bg-emerald-50" : "border-gray-300"
          }`}
        >
          <Users className="w-5 h-5" />
        </div>
        <span className="ml-3 font-medium">Thông tin đặt tour</span>
      </div>
      <div className="w-20 h-px bg-gray-300 mx-4"></div>
      <div
        className={`flex items-center ${
          step === 2 ? "text-emerald-600" : "text-gray-400"
        }`}
      >
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
            step === 2 ? "border-emerald-600 bg-emerald-50" : "border-gray-300"
          }`}
        >
          <CreditCard className="w-5 h-5" />
        </div>
        <span className="ml-3 font-medium">Thanh toán</span>
      </div>
    </div>
  );

  const updatePassengers = (type, action) => {
    setBookingInfo((prev) => {
      let newCount = prev.tourDetails.guests[type];

      if (action === "increase") {
        newCount = prev.tourDetails.guests[type] + 1;
      } else if (action === "decrease") {
        // Decrease: adults minimum 1, others minimum 0
        newCount = Math.max(
          type === "adults" ? 1 : 0,
          prev.tourDetails.guests[type] - 1
        );
      }

      const newGuests = {
        ...prev.tourDetails.guests,
        [type]: newCount,
      };

      // Validate total passengers against group_size
      const total = newGuests.adults + newGuests.children;
      const maxGroupSize =
        tourData?.available_seats !== undefined
          ? tourData.available_seats
          : getMaxGroupSize(tour?.group_size);

      if (total > maxGroupSize) {
        setPassengerError(
          `Tổng số hành khách không thể vượt quá ${maxGroupSize} người (còn lại)`
        );
        // Return previous state (don't update)
        return prev;
      }

      // Check if tour has age restrictions for children
      if (type === "children" && newCount > 0 && tour?.min_age > 11) {
        setPassengerError(
          `Tour này không dành cho trẻ em dưới ${tour.min_age} tuổi`
        );
        // Return previous state (don't update)
        return prev;
      }

      setPassengerError("");
      return {
        ...prev,
        tourDetails: {
          ...prev.tourDetails,
          guests: newGuests,
        },
      };
    });
  };

  const calculateTotal = () => {
    const basePrice = tour.price;
    let totalPrice =
      basePrice * bookingInfo.tourDetails.guests.adults +
      basePrice * 0.7 * bookingInfo.tourDetails.guests.children;
    let discount = 0;

    if (tour.promotions && tour.promotions.length > 0) {
      const promotion = tour.promotions[0];
      if (promotion.type === "percentage") {
        discount = totalPrice * (promotion.discount / 100);
      } else {
        discount = Math.min(promotion.discount, totalPrice);
      }
      totalPrice -= discount;
    }

    return totalPrice;
  };

  const getTotalGuests = () => {
    return (
      bookingInfo.tourDetails.guests.adults +
      bookingInfo.tourDetails.guests.children
    );
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

  const handleTestPayment = async (method) => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const testResponse = {
        success: true,
        transactionId: Math.random().toString(36).substring(7),
        message: `Test ${method} payment successful`,
      };

      console.log(`[DEBUG] Test ${method} payment:`, testResponse);

      navigate("/tours/booking/success", {
        state: {
          bookingInfo: {
            ...bookingInfo,
            payment: {
              method: method,
              testTransaction: testResponse.transactionId,
            },
          },
          tour,
        },
      });
    } catch (error) {
      console.error(`[ERROR] Test ${method} payment failed:`, error);
      alert("Có lỗi xảy ra khi thực hiện thanh toán test!");
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (tour) => {
    const PLACEHOLDER = `${API_HOST}/images/placeholder.png`;
    if (!tour) return PLACEHOLDER;

    // Kiểm tra images array trước
    if (tour.images && tour.images.length > 0) {
      const imgSrc = tour.images[0];
      return imgSrc.startsWith("http") ? imgSrc : `${API_HOST}${imgSrc}`;
    }

    // Kiểm tra single image
    if (tour.image) {
      return tour.image.startsWith("http")
        ? tour.image
        : `${API_HOST}${tour.image}`;
    }

    return PLACEHOLDER;
  };

  const renderPersonalInfoForm = () => (
    <div className="space-y-8">
      <div className="space-y-6">
        <h3 className="text-xl font-semibold">Thông tin liên hệ</h3>
        <div className="p-6 bg-gray-50 rounded-xl space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="fullName"
                value={bookingInfo.personalInfo.fullName}
                onChange={(e) => handleInputChange(e, "personalInfo")}
                className={`w-full p-3 pl-10 border ${
                  errors.personalInfo.fullName
                    ? "border-red-500"
                    : "border-gray-200"
                } rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent`}
                placeholder="Nguyễn Văn A"
              />
              <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
            </div>
            {errors.personalInfo.fullName && (
              <p className="text-red-500 text-sm mt-1">
                {errors.personalInfo.fullName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                name="email"
                value={bookingInfo.personalInfo.email}
                onChange={(e) => handleInputChange(e, "personalInfo")}
                className={`w-full p-3 pl-10 border ${
                  errors.personalInfo.email
                    ? "border-red-500"
                    : "border-gray-200"
                } rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent`}
                placeholder="example@email.com"
              />
              <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
            </div>
            {errors.personalInfo.email && (
              <p className="text-red-500 text-sm mt-1">
                {errors.personalInfo.email}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                name="phone"
                value={bookingInfo.personalInfo.phone}
                onChange={(e) => handleInputChange(e, "personalInfo")}
                className={`w-full p-3 pl-10 border ${
                  errors.personalInfo.phone
                    ? "border-red-500"
                    : "border-gray-200"
                } rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent`}
                placeholder="0123456789"
              />
              <Phone className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
            </div>
            {errors.personalInfo.phone && (
              <p className="text-red-500 text-sm mt-1">
                {errors.personalInfo.phone}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Yêu cầu đặc biệt
            </label>
            <textarea
              name="specialRequirements"
              value={bookingInfo.specialRequirements}
              onChange={(e) =>
                setBookingInfo((prev) => ({
                  ...prev,
                  specialRequirements: e.target.value,
                }))
              }
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              rows="3"
              placeholder="Nhập yêu cầu đặc biệt của bạn (nếu có)"
            />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-semibold">Chi tiết tour</h3>
        <div className="p-6 bg-gray-50 rounded-xl space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ngày khởi hành <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={bookingInfo.tourDetails.startDate}
                onChange={(e) => handleInputChange(e, "tourDetails")}
                name="startDate"
                className={`w-full p-3 pl-10 border ${
                  errors.tourDetails?.startDate
                    ? "border-red-500"
                    : "border-gray-200"
                } rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none cursor-pointer bg-white`}
              >
                <option value="">Chọn ngày khởi hành</option>
                {tour?.start_dates?.map((date) => (
                  <option key={date} value={date}>
                    {formatDate(date)}
                  </option>
                ))}
              </select>
              <Calendar className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
              <ChevronDown className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
            {errors.tourDetails?.startDate && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle size={14} />
                {errors.tourDetails.startDate}
              </p>
            )}
            {!errors.tourDetails?.startDate &&
              tour?.start_dates?.length === 0 && (
                <p className="text-amber-600 text-sm mt-1 flex items-center gap-1">
                  <Info size={14} />
                  Hiện tại chưa có lịch khởi hành. Vui lòng liên hệ để biết thêm
                  chi tiết.
                </p>
              )}
            {!errors.tourDetails?.startDate &&
              bookingInfo.tourDetails.startDate &&
              tourData?.available_seats === 0 && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-red-900">
                        Ngày {formatDate(bookingInfo.tourDetails.startDate)} đã
                        hết chỗ
                      </p>
                      <p className="text-red-700 mt-1">
                        Vui lòng chọn ngày khởi hành khác để tiếp tục đặt tour.
                      </p>
                    </div>
                  </div>
                </div>
              )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số lượng hành khách <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPassengerModal(!showPassengerModal)}
                className="w-full text-left border border-gray-200 rounded-xl p-3 pl-4 pr-10 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors shadow-sm hover:border-emerald-300 bg-white"
              >
                {`${bookingInfo.tourDetails.guests.adults} người lớn${
                  bookingInfo.tourDetails.guests.children > 0
                    ? `, ${bookingInfo.tourDetails.guests.children} trẻ em`
                    : ""
                }`}
              </button>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-emerald-600 bg-emerald-50 p-1 rounded-full">
                <Users size={18} />
              </div>

              {showPassengerModal && (
                <div
                  ref={guestModalRef}
                  className="absolute z-[100] mt-2 w-full bg-white rounded-lg shadow-xl border border-gray-200 p-5 animate-fade-in"
                  style={{ maxHeight: "80vh", overflowY: "auto" }}
                >
                  {/* Người lớn */}
                  <div className="p-4 bg-gray-50 rounded-lg mb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-800">Người lớn</h4>
                        <p className="text-sm text-gray-500">
                          Từ {tour?.min_age || 12} tuổi trở lên
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => updatePassengers("adults", "decrease")}
                          className={`w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            bookingInfo.tourDetails.guests.adults <= 1
                              ? "border-gray-200 text-gray-300"
                              : "border-gray-300 hover:bg-gray-100"
                          }`}
                          disabled={bookingInfo.tourDetails.guests.adults <= 1}
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-8 text-center font-medium">
                          {bookingInfo.tourDetails.guests.adults}
                        </span>
                        <button
                          type="button"
                          onClick={() => updatePassengers("adults", "increase")}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={
                            getTotalGuests() >=
                            (tourData?.available_seats !== undefined
                              ? tourData.available_seats
                              : getMaxGroupSize(tour?.group_size))
                          }
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Trẻ em */}
                  <div className="p-4 bg-gray-50 rounded-lg mb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-800">Trẻ em</h4>
                        <p className="text-sm text-gray-500">
                          2-11 tuổi (Giảm 30%)
                        </p>
                        {tour?.min_age > 11 && (
                          <p className="text-xs text-red-500 mt-1">
                            * Tour này không dành cho trẻ em dưới 12 tuổi
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            updatePassengers("children", "decrease")
                          }
                          className={`w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            bookingInfo.tourDetails.guests.children <= 0
                              ? "border-gray-200 text-gray-300"
                              : "border-gray-300 hover:bg-gray-100"
                          }`}
                          disabled={
                            bookingInfo.tourDetails.guests.children <= 0
                          }
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-8 text-center font-medium">
                          {bookingInfo.tourDetails.guests.children}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updatePassengers("children", "increase")
                          }
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={
                            getTotalGuests() >=
                              (tourData?.available_seats !== undefined
                                ? tour.available_seats
                                : getMaxGroupSize(tour?.group_size)) ||
                            tour?.min_age > 11
                          }
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                    {passengerError && (
                      <p className="text-xs text-red-500 mt-2">
                        {passengerError}
                      </p>
                    )}
                  </div>

                  {/* Thông tin tổng */}
                  <div className="p-4 bg-emerald-50 rounded-lg mb-4">
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div>
                        <p className="text-xs text-emerald-700 mb-1">
                          Chỗ trống
                        </p>
                        <p className="text-2xl font-bold text-emerald-800">
                          {tourData?.available_seats !== undefined
                            ? tour.available_seats
                            : getMaxGroupSize(tour?.group_size)}
                        </p>
                        <p className="text-xs text-emerald-600">chỗ</p>
                      </div>
                      <div>
                        <p className="text-xs text-emerald-700 mb-1">Đã chọn</p>
                        <p className="text-2xl font-bold text-emerald-800">
                          {getTotalGuests()}
                        </p>
                        <p className="text-xs text-emerald-600">người</p>
                      </div>
                      <div>
                        <p className="text-xs text-emerald-700 mb-1">
                          Còn chọn thêm
                        </p>
                        <p className="text-2xl font-bold text-emerald-800">
                          {Math.max(
                            0,
                            (tourData?.available_seats !== undefined
                              ? tourData.available_seats
                              : getMaxGroupSize(tour?.group_size)) -
                              getTotalGuests()
                          )}
                        </p>
                        <p className="text-xs text-emerald-600">người</p>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-emerald-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-emerald-700">
                          Sức chứa tối đa
                        </span>
                        <span className="text-sm font-bold text-emerald-800">
                          {tour?.group_size || 10} người
                        </span>
                      </div>
                      {tour?.total_booked > 0 && (
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-gray-600">
                            Đã có người đặt
                          </span>
                          <span className="text-xs font-semibold text-gray-700">
                            {tour.total_booked} người
                          </span>
                        </div>
                      )}
                    </div>
                    {getTotalGuests() >
                      (tourData?.available_seats !== undefined
                        ? tour.available_seats
                        : getMaxGroupSize(tour?.group_size)) && (
                      <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs text-red-700 font-medium text-center">
                          ⚠️ Vượt quá số lượng còn nhận
                        </p>
                      </div>
                    )}
                    {getTotalGuests() ===
                      (tourData?.available_seats !== undefined
                        ? tour.available_seats
                        : getMaxGroupSize(tour?.group_size)) && (
                      <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-xs text-green-700 font-medium text-center">
                          ✓ Đã chọn đủ số lượng tối đa
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setShowPassengerModal(false)}
                    disabled={
                      getTotalGuests() === 0 ||
                      getTotalGuests() >
                        (tourData?.available_seats !== undefined
                          ? tour.available_seats
                          : getMaxGroupSize(tour?.group_size))
                    }
                    className={`w-full font-medium py-2 rounded-lg transition-colors ${
                      getTotalGuests() === 0 ||
                      getTotalGuests() >
                        (tourData?.available_seats !== undefined
                          ? tour.available_seats
                          : getMaxGroupSize(tour?.group_size))
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-emerald-600 text-white hover:bg-emerald-700"
                    }`}
                  >
                    Xác nhận
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPaymentForm = () => (
    <div className="space-y-6">
      {/* Thông tin liên hệ đã nhập */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-100">
        <h3 className="text-lg font-semibold text-emerald-800 mb-4 flex items-center gap-2">
          <UserCheck className="w-5 h-5" />
          Thông tin liên hệ
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-emerald-600 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">Họ và tên</p>
              <p className="font-medium text-gray-800">
                {bookingInfo.personalInfo.fullName}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-emerald-600 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium text-gray-800">
                {bookingInfo.personalInfo.email}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-emerald-600 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">Số điện thoại</p>
              <p className="font-medium text-gray-800">
                {bookingInfo.personalInfo.phone}
              </p>
            </div>
          </div>
          {bookingInfo.specialRequirements && (
            <div className="flex items-start gap-3 col-span-2">
              <Info className="w-5 h-5 text-emerald-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Yêu cầu đặc biệt</p>
                <p className="font-medium text-gray-800">
                  {bookingInfo.specialRequirements}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Thông tin tour */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Mountain className="w-5 h-5 text-emerald-600" />
          Thông tin tour
        </h3>
        <div className="flex items-center gap-4 pb-4 mb-4 border-b border-gray-200">
          <img
            src={getImageUrl(tour)}
            alt={tour?.title}
            className="w-20 h-20 object-cover rounded-lg border-2 border-gray-100"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `${API_HOST}/images/placeholder.png`;
            }}
          />
          <div className="flex-1">
            <h4 className="font-semibold text-lg mb-1">{tour?.title}</h4>
            <p className="text-gray-500 flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4" />
              {tour?.location}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm pb-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>Ngày khởi hành:</span>
            <span className="font-medium">
              {formatDate(bookingInfo.tourDetails.startDate)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span>Thời gian:</span>
            <span className="font-medium">
              {tour?.duration
                ? `${Math.ceil(tour.duration / (24 * 60))} ngày`
                : "Chưa cập nhật"}
            </span>
          </div>
          <div className="flex items-center gap-2 col-span-2">
            <Users className="w-4 h-4 text-emerald-600" />
            <span>Số khách:</span>
            <span className="font-medium">
              {bookingInfo.tourDetails.guests.adults} người lớn
              {bookingInfo.tourDetails.guests.children > 0 &&
                `, ${bookingInfo.tourDetails.guests.children} trẻ em`}
            </span>
          </div>
        </div>

        <div className="pb-4 border-b border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Mountain className="w-4 h-4 text-emerald-600" />
                <span className="font-medium">Độ khó:</span>
              </div>
              <span className="text-gray-600">
                {tour?.difficulty_level === "easy"
                  ? "Dễ"
                  : tour?.difficulty_level === "moderate"
                  ? "Trung bình"
                  : tour?.difficulty_level === "challenging"
                  ? "Thử thách"
                  : tour?.difficulty_level === "difficult"
                  ? "Khó"
                  : "Không xác định"}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span className="font-medium">Hướng dẫn viên:</span>
              </div>
              <span className="text-gray-600">
                {tour?.guide_name || "Đang cập nhật"}
              </span>
            </div>
          </div>
        </div>

        {/* Chi tiết giá */}
        <div className="space-y-3 bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            Chi tiết giá
          </h4>

          {/* Giá người lớn */}
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">Người lớn</p>
                <p className="text-xs text-gray-500">
                  {bookingInfo.tourDetails.guests.adults} người ×{" "}
                  {formatPrice(tour?.price)}
                </p>
              </div>
              <p className="font-semibold text-gray-800">
                {formatPrice(
                  tour?.price * bookingInfo.tourDetails.guests.adults
                )}
              </p>
            </div>
          </div>

          {/* Giá trẻ em */}
          {bookingInfo.tourDetails.guests.children > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">Trẻ em</p>
                  <p className="text-xs text-gray-500">
                    {bookingInfo.tourDetails.guests.children} người ×{" "}
                    {formatPrice(tour?.price * 0.7)}
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">
                    (Giảm 30% so với người lớn)
                  </p>
                </div>
                <p className="font-semibold text-gray-800">
                  {formatPrice(
                    tour?.price * 0.7 * bookingInfo.tourDetails.guests.children
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Tạm tính */}
          {tour?.promotions?.length > 0 && (
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-sm font-medium text-gray-600">
                Tạm tính
              </span>
              <span className="font-semibold text-gray-700">
                {formatPrice(
                  tour?.price * bookingInfo.tourDetails.guests.adults +
                    tour?.price * 0.7 * bookingInfo.tourDetails.guests.children
                )}
              </span>
            </div>
          )}

          {/* Giảm giá */}
          {tour?.promotions?.length > 0 && (
            <div className="flex justify-between items-start bg-orange-50 -mx-4 px-4 py-3 rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium text-orange-700 flex items-center gap-1">
                  <BadgePercent className="w-4 h-4" />
                  {tour.promotions[0].title || "Khuyến mãi"}
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  Giảm{" "}
                  {tour.promotions[0].type === "percentage"
                    ? `${tour.promotions[0].discount}%`
                    : formatPrice(tour.promotions[0].discount)}
                </p>
              </div>
              <p className="font-bold text-orange-600">
                -{formatPrice(bookingSummary.discount)}
              </p>
            </div>
          )}

          {/* Tổng cộng */}
          <div className="flex justify-between items-center pt-3 border-t-2 border-emerald-200">
            <div>
              <p className="text-sm text-gray-600">Tổng thanh toán</p>
              <p className="text-xs text-gray-500 mt-0.5">
                (
                {bookingInfo.tourDetails.guests.adults +
                  bookingInfo.tourDetails.guests.children}{" "}
                người)
              </p>
            </div>
            <p className="text-2xl font-bold text-emerald-600">
              {formatPrice(bookingSummary.totalPrice)}
            </p>
          </div>
        </div>
      </div>

      {/* Phương thức thanh toán */}
      <h3 className="text-xl font-bold mb-6">Phương thức thanh toán</h3>
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Credit Card */}
        <div
          className={`p-4 border rounded-xl cursor-pointer transition-all ${
            selectedPaymentMethod === "credit_card"
              ? "border-emerald-500 bg-emerald-50"
              : "border-gray-200 hover:border-emerald-300"
          }`}
          onClick={() => setSelectedPaymentMethod("credit_card")}
        >
          <div className="flex items-start gap-3">
            <CreditCard className="w-6 h-6 text-emerald-600 mt-1" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Thẻ tín dụng/ghi nợ</h4>
                {selectedPaymentMethod === "credit_card" && (
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Thanh toán bằng thẻ Visa, Mastercard, JCB
              </p>
              <span className="inline-block mt-2 text-xs px-2 py-1 bg-orange-100 text-orange-600 rounded">
                Chế độ test
              </span>
            </div>
          </div>
        </div>

        {/* Bank Transfer */}
        <div
          className={`p-4 border rounded-xl cursor-pointer transition-all ${
            selectedPaymentMethod === "bank_transfer"
              ? "border-emerald-500 bg-emerald-50"
              : "border-gray-200 hover:border-emerald-300"
          }`}
          onClick={() => setSelectedPaymentMethod("bank_transfer")}
        >
          <div className="flex items-start gap-3">
            <Building2 className="w-6 h-6 text-emerald-600 mt-1" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Chuyển khoản ngân hàng</h4>
                {selectedPaymentMethod === "bank_transfer" && (
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Chuyển khoản trực tiếp qua ngân hàng
              </p>
            </div>
          </div>
        </div>

        {/* VNPay */}
        <div
          className={`p-4 border rounded-xl cursor-pointer transition-all ${
            selectedPaymentMethod === "vnpay"
              ? "border-emerald-500 bg-emerald-50"
              : "border-gray-200 hover:border-emerald-300"
          }`}
          onClick={() => setSelectedPaymentMethod("vnpay")}
        >
          <div className="flex items-start gap-3">
            <QrCode className="w-6 h-6 text-emerald-600 mt-1" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">VNPay</h4>
                {selectedPaymentMethod === "vnpay" && (
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Thanh toán qua ví điện tử VNPay
              </p>
              <span className="inline-block mt-2 text-xs px-2 py-1 bg-orange-100 text-orange-600 rounded">
                Chế độ test
              </span>
            </div>
          </div>
        </div>

        {/* Momo */}
        <div
          className={`p-4 border rounded-xl cursor-pointer transition-all ${
            selectedPaymentMethod === "momo"
              ? "border-emerald-500 bg-emerald-50"
              : "border-gray-200 hover:border-emerald-300"
          }`}
          onClick={() => setSelectedPaymentMethod("momo")}
        >
          <div className="flex items-start gap-3">
            <Wallet className="w-6 h-6 text-emerald-600 mt-1" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Momo</h4>
                {selectedPaymentMethod === "momo" && (
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Thanh toán qua ví Momo
              </p>
              <span className="inline-block mt-2 text-xs px-2 py-1 bg-orange-100 text-orange-600 rounded">
                Chế độ test
              </span>
            </div>
          </div>
        </div>

        {/* Cash */}
        <div
          className={`p-4 border rounded-xl cursor-pointer transition-all col-span-2 ${
            selectedPaymentMethod === "cash"
              ? "border-emerald-500 bg-emerald-50"
              : "border-gray-200 hover:border-emerald-300"
          }`}
          onClick={() => setSelectedPaymentMethod("cash")}
        >
          <div className="flex items-start gap-3">
            <Wallet className="w-6 h-6 text-emerald-600 mt-1" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Tiền mặt</h4>
                {selectedPaymentMethod === "cash" && (
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Thanh toán bằng tiền mặt tại điểm khởi hành
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form chi tiết theo phương thức thanh toán */}
      {selectedPaymentMethod === "credit_card" && (
        <div className="p-6 bg-gray-50 rounded-lg space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    e.target.value
                  )
                }
                className="w-full p-2 pl-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder="1234 5678 9012 3456"
              />
              <CreditCard className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên chủ thẻ <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={paymentInfo.credit_card.cardHolder}
                onChange={(e) =>
                  handlePaymentInputChange(
                    "credit_card",
                    "cardHolder",
                    e.target.value
                  )
                }
                className="w-full p-2 pl-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder="NGUYEN VAN A"
              />
              <User className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày hết hạn <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={paymentInfo.credit_card.expiry}
                  onChange={(e) =>
                    handlePaymentInputChange(
                      "credit_card",
                      "expiry",
                      e.target.value
                    )
                  }
                  className="w-full p-2 pl-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="MM/YY"
                />
                <CalendarDays className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CVV <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={paymentInfo.credit_card.cvv}
                onChange={(e) =>
                  handlePaymentInputChange("credit_card", "cvv", e.target.value)
                }
                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder="123"
              />
            </div>
          </div>
        </div>
      )}
      {selectedPaymentMethod === "bank_transfer" && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-blue-50 to-emerald-50 rounded-xl p-6 border-2 border-emerald-200">
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="w-6 h-6 text-emerald-600" />
              <h4 className="font-semibold text-gray-800">
                Thông tin chuyển khoản
              </h4>
            </div>

            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-500 mb-1">Ngân hàng</p>
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <p className="font-semibold text-lg text-gray-800">
                    MB Bank (Ngân hàng Quân đội)
                  </p>
                </div>
              </div>

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

              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-500 mb-1">Chủ tài khoản</p>
                <p className="font-semibold text-lg text-gray-800 uppercase">
                  Đường Quốc Thắng
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-500 mb-1">Số tiền</p>
                <p className="font-bold text-2xl text-emerald-600">
                  {formatPrice(bookingSummary.totalPrice)}
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-500 mb-1">
                  Nội dung chuyển khoản
                </p>
                <div className="flex items-center justify-between">
                  <p className="font-mono text-gray-800">
                    DAT TOUR {bookingInfo.personalInfo.phone || "SDT"}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `DAT TOUR ${bookingInfo.personalInfo.phone || "SDT"}`
                      );
                      alert("Đã copy nội dung chuyển khoản!");
                    }}
                    className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm hover:bg-emerald-200 transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-500 mb-3 text-center">
                  Quét mã QR để chuyển khoản
                </p>
                <div className="aspect-square max-w-[250px] mx-auto bg-white rounded-lg flex items-center justify-center p-2">
                  <img
                    src={`${API_HOST}/uploads/QR/bank.jpg`}
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

            <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">Lưu ý quan trọng:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Vui lòng chuyển khoản đúng số tiền và nội dung</li>
                    <li>
                      Tour sẽ được xác nhận sau khi nhận được thanh toán (2-5
                      phút)
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

      {selectedPaymentMethod === "vnpay" && (
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <QrCode className="w-6 h-6 text-emerald-600" />
              <h4 className="font-medium">Quét mã QR để thanh toán</h4>
              <span className="ml-auto text-xs px-2 py-1 bg-orange-100 text-orange-600 rounded">
                Chế độ test
              </span>
            </div>
            <div className="aspect-square max-w-[200px] mx-auto bg-white rounded-lg flex items-center justify-center p-2">
              <img
                src={`${API_HOST}/uploads/QR/bank.jpg`}
                alt="QR Code VNPay Test"
                className="w-full h-full object-contain rounded-lg"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "block";
                }}
              />
              <div className="text-center hidden" style={{ display: "none" }}>
                <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Mã QR Test</p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Chế độ test:</p>
                  <p className="text-xs">
                    Quét mã QR hoặc chuyển khoản vào tài khoản trên. Đơn hàng sẽ
                    được xác nhận tự động (không thu tiền thật).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {selectedPaymentMethod === "momo" && (
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <Wallet className="w-6 h-6 text-emerald-600" />
              <h4 className="font-medium">Quét mã QR để thanh toán</h4>
              <span className="ml-auto text-xs px-2 py-1 bg-orange-100 text-orange-600 rounded">
                Chế độ test
              </span>
            </div>
            <div className="aspect-square max-w-[200px] mx-auto bg-white rounded-lg flex items-center justify-center p-2">
              <img
                src={`${API_HOST}/uploads/QR/bank.jpg`}
                alt="QR Code Momo Test"
                className="w-full h-full object-contain rounded-lg"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "block";
                }}
              />
              <div className="text-center hidden" style={{ display: "none" }}>
                <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Mã QR Test</p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-pink-50 rounded-lg border border-pink-200">
              <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-pink-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-pink-800">
                  <p className="font-medium mb-1">Chế độ test:</p>
                  <p className="text-xs">
                    Quét mã QR hoặc chuyển khoản vào tài khoản trên. Đơn hàng sẽ
                    được xác nhận tự động (không thu tiền thật).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {selectedPaymentMethod === "cash" && (
        <div className="p-6 bg-emerald-50 rounded-lg border border-emerald-200">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-emerald-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-emerald-800 mb-2">
                Hướng dẫn thanh toán tiền mặt
              </h4>
              <ul className="text-sm text-emerald-700 space-y-1 list-disc list-inside">
                <li>Vui lòng chuẩn bị đủ tiền mặt khi đến điểm khởi hành</li>
                <li>Thanh toán trực tiếp cho hướng dẫn viên</li>
                <li>Nhận vé và hóa đơn sau khi thanh toán</li>
                <li>Đơn hàng sẽ được xác nhận sau khi thanh toán</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-emerald-600 text-white py-12">
        <div className="container mx-auto px-4">
          <button
            onClick={() => navigate(`/tours/${tour?.id}`)}
            className="flex items-center gap-2 text-white mb-6 hover:text-emerald-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Quay lại chi tiết tour
          </button>
          <h1 className="text-3xl font-bold mb-2">Đặt tour du lịch</h1>
          <p className="text-emerald-100">{tour?.title}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Main Form */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            {renderStepIndicator()}

            <form onSubmit={handleSubmit}>
              {step === 1 ? renderPersonalInfoForm() : renderPaymentForm()}

              {/* Total and Actions */}
              <div className="border-t border-gray-200 mt-8 pt-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Tổng thanh toán</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(bookingSummary.totalPrice)}
                  </p>
                </div>
                <div className="space-x-4 flex items-center">
                  {step === 2 && (
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                    >
                      Quay lại
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={
                      loading ||
                      (tourData?.available_seats === 0 &&
                        bookingInfo.tourDetails.startDate)
                    }
                    className={`px-8 py-3 rounded-xl transition-colors font-medium flex items-center gap-2 ${
                      loading ||
                      (tourData?.available_seats === 0 &&
                        bookingInfo.tourDetails.startDate)
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-emerald-600 text-white hover:bg-emerald-700"
                    }`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : tourData?.available_seats === 0 &&
                      bookingInfo.tourDetails.startDate ? (
                      "Ngày này đã hết chỗ"
                    ) : step === 1 ? (
                      "Tiếp tục"
                    ) : (
                      "Xác nhận đặt tour"
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TourBooking;
