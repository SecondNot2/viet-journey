import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../../contexts/AuthContext";
import {
  MapPin,
  Clock,
  Users,
  Calendar,
  CreditCard,
  Bus,
  Train,
  Car,
  ArrowLeft,
  Phone,
  Mail,
  CheckCircle,
  User,
  CalendarDays,
  Loader2,
  Info,
  BadgePercent,
  QrCode,
  Building2,
  Wallet,
  Plus,
  Minus,
  X,
} from "lucide-react";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const TransportBooking = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth(); // ✅ Thêm AuthContext
  const guestModalRef = useRef(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [transport, setTransport] = useState(null);
  const [showPassengerModal, setShowPassengerModal] = useState(false);
  const [passengerError, setPassengerError] = useState("");
  const [bookingInfo, setBookingInfo] = useState({
    passengerDetails: {
      title: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
    },
    date: location.state?.bookingDetails?.date || "",
    passengers: location.state?.bookingDetails?.passengers || {
      adults: 1,
      children: 0,
    },
    payment: {
      method: "credit_card",
      cardNumber: "",
      cardHolder: "",
      expiry: "",
      cvv: "",
      bank: "",
      accountNumber: "",
      vnpayPhone: "",
      momoPhone: "",
    },
  });
  const [errors, setErrors] = useState({
    passengerDetails: {
      title: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
    },
    payment: {
      cardNumber: "",
      cardHolder: "",
      expiry: "",
      cvv: "",
    },
  });
  const [bookingSummary, setBookingSummary] = useState({
    basePrice: 0,
    totalPrice: 0,
    discount: 0,
  });

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

  useEffect(() => {
    const fetchTransportDetail = async () => {
      if (!id || id === "undefined") {
        console.error("ID chuyến đi không hợp lệ");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/api/transport/${id}`);
        const fetchedTransport = response.data;

        // Map response data to match expected structure
        const mappedTransport = {
          id: fetchedTransport.trip_id,
          trip_id: fetchedTransport.trip_id,
          type: fetchedTransport.type,
          vehicle_name: fetchedTransport.vehicle_name,
          company: fetchedTransport.company,
          from_location: fetchedTransport.from_location,
          to_location: fetchedTransport.to_location,
          trip_type: fetchedTransport.trip_type,
          departure_time: fetchedTransport.departure_time,
          arrival_time: fetchedTransport.arrival_time,
          duration: fetchedTransport.duration,
          price: fetchedTransport.price,
          base_price: fetchedTransport.base_price,
          total_seats: fetchedTransport.total_seats,
          available_seats: fetchedTransport.available_seats,
          booked_seats: fetchedTransport.booked_seats,
          seats: fetchedTransport.total_seats,
          image: fetchedTransport.image,
          amenities: fetchedTransport.amenities || [],
          promotion: fetchedTransport.promotion, // If exists
          discounted_price: fetchedTransport.discounted_price, // If exists
        };

        setTransport(mappedTransport);
        // Tính tổng tiền ban đầu
        const basePrice =
          mappedTransport.discounted_price || mappedTransport.price;
        let totalPrice =
          basePrice *
            (location.state?.bookingDetails?.passengers?.adults || 1) +
          basePrice *
            0.75 *
            (location.state?.bookingDetails?.passengers?.children || 0);
        let discount = 0;
        if (mappedTransport.promotion) {
          if (mappedTransport.promotion.type === "percentage") {
            discount = Math.round(
              (mappedTransport.price *
                (location.state?.bookingDetails?.passengers?.adults || 1) +
                mappedTransport.price *
                  0.75 *
                  (location.state?.bookingDetails?.passengers?.children || 0)) *
                (mappedTransport.promotion.discount / 100)
            );
          } else {
            discount = Math.min(
              mappedTransport.promotion.discount,
              mappedTransport.price *
                (location.state?.bookingDetails?.passengers?.adults || 1) +
                mappedTransport.price *
                  0.75 *
                  (location.state?.bookingDetails?.passengers?.children || 0)
            );
          }
        }
        setBookingSummary({
          basePrice: mappedTransport.price,
          totalPrice: totalPrice - discount,
          discount,
        });
      } catch (err) {
        console.error("[ERROR] Lỗi khi lấy chi tiết phương tiện:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTransportDetail();
  }, [id]);

  useEffect(() => {
    if (!transport) return;
    const basePrice = transport.discounted_price || transport.price;
    let totalPrice =
      basePrice * bookingInfo.passengers.adults +
      basePrice * 0.75 * bookingInfo.passengers.children;
    let discount = 0;
    if (transport.promotion) {
      if (transport.promotion.type === "percentage") {
        discount = Math.round(
          (transport.price * bookingInfo.passengers.adults +
            transport.price * 0.75 * bookingInfo.passengers.children) *
            (transport.promotion.discount / 100)
        );
      } else {
        discount = Math.min(
          transport.promotion.discount,
          transport.price * bookingInfo.passengers.adults +
            transport.price * 0.75 * bookingInfo.passengers.children
        );
      }
    }
    setBookingSummary({
      basePrice: transport.price,
      totalPrice: totalPrice - discount,
      discount,
    });
  }, [bookingInfo.passengers, transport]);

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

  const handleInputChange = (section, field, value) => {
    setBookingInfo((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const updatePassengers = (type, action) => {
    setBookingInfo((prev) => {
      const newCount =
        action === "increase"
          ? prev.passengers[type] + 1
          : Math.max(type === "adults" ? 1 : 0, prev.passengers[type] - 1);
      const newPassengers = {
        ...prev.passengers,
        [type]: newCount,
      };
      // Validate tổng số khách
      const total = newPassengers.adults + newPassengers.children;
      if (total > 10) {
        setPassengerError("Tổng số hành khách không thể vượt quá 10 người");
        return { ...prev, passengers: newPassengers };
      }
      setPassengerError("");
      return { ...prev, passengers: newPassengers };
    });
  };

  const validateStep1 = () => {
    const newErrors = {
      passengerDetails: {
        title: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
      },
    };
    let hasError = false;
    if (!bookingInfo.passengerDetails.title) {
      newErrors.passengerDetails.title = "Vui lòng chọn danh xưng";
      hasError = true;
    }
    if (!bookingInfo.passengerDetails.firstName.trim()) {
      newErrors.passengerDetails.firstName = "Vui lòng nhập tên";
      hasError = true;
    }
    if (!bookingInfo.passengerDetails.lastName.trim()) {
      newErrors.passengerDetails.lastName = "Vui lòng nhập họ";
      hasError = true;
    }
    if (!bookingInfo.passengerDetails.email.trim()) {
      newErrors.passengerDetails.email = "Vui lòng nhập email";
      hasError = true;
    } else if (!/\S+@\S+\.\S+/.test(bookingInfo.passengerDetails.email)) {
      newErrors.passengerDetails.email = "Email không hợp lệ";
      hasError = true;
    }
    if (!bookingInfo.passengerDetails.phone.trim()) {
      newErrors.passengerDetails.phone = "Vui lòng nhập số điện thoại";
      hasError = true;
    }
    if (!bookingInfo.passengerDetails.address.trim()) {
      newErrors.passengerDetails.address = "Vui lòng nhập địa chỉ";
      hasError = true;
    }
    setErrors((prev) => ({
      ...prev,
      passengerDetails: newErrors.passengerDetails,
    }));
    return !hasError;
  };

  const validateStep2 = () => {
    const newErrors = {
      payment: {
        cardNumber: "",
        cardHolder: "",
        expiry: "",
        cvv: "",
      },
    };
    let hasError = false;
    if (bookingInfo.payment.method === "credit_card") {
      if (!bookingInfo.payment.cardNumber.trim()) {
        newErrors.payment.cardNumber = "Vui lòng nhập số thẻ";
        hasError = true;
      }
      if (!bookingInfo.payment.cardHolder.trim()) {
        newErrors.payment.cardHolder = "Vui lòng nhập tên chủ thẻ";
        hasError = true;
      }
      if (!bookingInfo.payment.expiry.trim()) {
        newErrors.payment.expiry = "Vui lòng nhập ngày hết hạn";
        hasError = true;
      }
      if (!bookingInfo.payment.cvv.trim()) {
        newErrors.payment.cvv = "Vui lòng nhập CVV";
        hasError = true;
      }
    }
    // Các phương thức khác (bank_transfer, vnpay, momo, cash) không cần validation
    // vì đang ở chế độ test hoặc thông tin đã được cung cấp sẵn
    setErrors((prev) => ({ ...prev, payment: newErrors.payment }));
    return !hasError;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step === 1) {
      if (validateStep1()) setStep(2);
      return;
    }
    if (!validateStep2()) return;
    setLoading(true);
    try {
      // Chuẩn bị dữ liệu passengers
      const passengers = [];

      // Thêm người lớn
      for (let i = 0; i < bookingInfo.passengers.adults; i++) {
        passengers.push({
          passenger_type: "adult",
          title: bookingInfo.passengerDetails.title,
          first_name: bookingInfo.passengerDetails.firstName,
          last_name: bookingInfo.passengerDetails.lastName,
          dob: null,
          passport_number: null,
          nationality: "VN",
        });
      }

      // Thêm trẻ em
      for (let i = 0; i < bookingInfo.passengers.children; i++) {
        passengers.push({
          passenger_type: "child",
          title: bookingInfo.passengerDetails.title,
          first_name: `${bookingInfo.passengerDetails.firstName} (Trẻ em ${
            i + 1
          })`,
          last_name: bookingInfo.passengerDetails.lastName,
          dob: null,
          passport_number: null,
          nationality: "VN",
        });
      }

      // Tạo booking
      const bookingData = {
        user_id: user?.id || null, // ✅ Thêm user_id từ AuthContext
        transport_id: transport.trip_id || transport.id,
        service_type: "transport",
        booking_date:
          bookingInfo.date || new Date().toISOString().split("T")[0],
        status: "pending",
        payment_status:
          bookingInfo.payment.method === "cash" ? "pending" : "paid",
        total_price: bookingSummary.totalPrice,
        contact_email: bookingInfo.passengerDetails.email,
        contact_phone: bookingInfo.passengerDetails.phone,
        notes: `Phương thức thanh toán: ${
          bookingInfo.payment.method === "credit_card"
            ? "Thẻ tín dụng"
            : bookingInfo.payment.method === "bank_transfer"
            ? "Chuyển khoản"
            : bookingInfo.payment.method === "vnpay"
            ? "VNPay"
            : bookingInfo.payment.method === "momo"
            ? "Momo"
            : "Tiền mặt"
        }`,
        passenger_count: JSON.stringify({
          adults: bookingInfo.passengers.adults,
          children: bookingInfo.passengers.children,
        }),
        passengers: passengers,
      };

      // Gọi API tạo booking
      const response = await axios.post(
        `${API_URL}/api/bookings`,
        bookingData,
        {
          withCredentials: true,
        }
      );

      if (response.status === 201) {
        // Đặt vé thành công
        navigate("/transport/booking/success", {
          state: {
            bookingInfo,
            transport,
            bookingSummary,
            bookingId: response.data.booking_id,
          },
        });
      }
    } catch (error) {
      console.error("[ERROR] Booking error:", error);
      alert(
        `Có lỗi xảy ra khi đặt vé: ${
          error.response?.data?.error || error.message
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang xử lý...</p>
        </div>
      </div>
    );
  }

  if (!transport) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Không tìm thấy thông tin vận chuyển
          </h2>
          <button
            onClick={() => navigate("/transport")}
            className="text-emerald-600 hover:text-emerald-700"
          >
            Quay lại trang tìm kiếm
          </button>
        </div>
      </div>
    );
  }

  const getTransportIcon = (type) => {
    switch (type) {
      case "bus":
        return <Bus size={24} />;
      case "train":
        return <Train size={24} />;
      case "car":
        return <Car size={24} />;
      default:
        return null;
    }
  };

  const renderPassengerModal = () => (
    <div
      ref={guestModalRef}
      className="absolute z-50 mt-2 w-full bg-white rounded-lg shadow-xl border border-gray-200 p-5 animate-fade-in"
      style={{ maxWidth: 350 }}
    >
      {/* Người lớn */}
      <div className="p-4 bg-gray-50 rounded-lg mb-4">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-medium text-gray-800">Người lớn</h4>
            <p className="text-sm text-gray-500">Từ 12 tuổi trở lên</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => updatePassengers("adults", "decrease")}
              className={`w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                bookingInfo.passengers.adults <= 1
                  ? "border-gray-200 text-gray-300"
                  : "border-gray-300 hover:bg-gray-100"
              }`}
              disabled={bookingInfo.passengers.adults <= 1}
            >
              <Minus size={16} />
            </button>
            <span className="w-8 text-center font-medium">
              {bookingInfo.passengers.adults}
            </span>
            <button
              onClick={() => updatePassengers("adults", "increase")}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={
                bookingInfo.passengers.adults +
                  bookingInfo.passengers.children >=
                10
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
            <p className="text-sm text-gray-500">Dưới 12 tuổi (giảm 25%)</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => updatePassengers("children", "decrease")}
              className={`w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                bookingInfo.passengers.children <= 0
                  ? "border-gray-200 text-gray-300"
                  : "border-gray-300 hover:bg-gray-100"
              }`}
              disabled={bookingInfo.passengers.children <= 0}
            >
              <Minus size={16} />
            </button>
            <span className="w-8 text-center font-medium">
              {bookingInfo.passengers.children}
            </span>
            <button
              onClick={() => updatePassengers("children", "increase")}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={
                bookingInfo.passengers.adults +
                  bookingInfo.passengers.children >=
                10
              }
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
        {passengerError && (
          <p className="text-xs text-red-500 mt-2">{passengerError}</p>
        )}
      </div>
      {/* Tổng */}
      <div className="p-4 bg-emerald-50 rounded-lg mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="font-medium text-emerald-800">Tổng số khách</span>
          <span className="font-medium text-emerald-800">
            {bookingInfo.passengers.adults + bookingInfo.passengers.children}/10
            người
          </span>
        </div>
        <div className="text-sm text-emerald-600">
          {bookingInfo.passengers.adults + bookingInfo.passengers.children >= 10
            ? "* Đã đạt số lượng tối đa"
            : `* Còn nhận thêm ${
                10 -
                (bookingInfo.passengers.adults +
                  bookingInfo.passengers.children)
              } khách`}
        </div>
      </div>
      <button
        onClick={() => setShowPassengerModal(false)}
        className={`w-full font-medium py-2 rounded-lg transition-colors bg-emerald-100 text-emerald-700 hover:bg-emerald-200`}
      >
        Xác nhận
      </button>
    </div>
  );

  const renderPaymentForm = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
          <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-lg border">
            {getTransportIcon(transport.type)}
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-1">
              {transport.vehicle_name ||
                (transport.type === "train" ? "Tàu hỏa" : "Xe khách")}
            </h3>
            <p className="text-gray-500 flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4" />
              {transport.from_location} → {transport.to_location}
            </p>
            {transport.company && (
              <p className="text-gray-500 text-sm mt-1">{transport.company}</p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm pb-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>Ngày khởi hành:</span>
            <span className="font-medium">
              {bookingInfo.date
                ? formatDate(bookingInfo.date)
                : transport.trip_date
                ? new Date(transport.trip_date).toLocaleDateString("vi-VN")
                : "Chưa xác định"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span>Thời gian:</span>
            <span className="font-medium">
              {transport.duration
                ? `${Math.floor(transport.duration / 60)}h ${
                    transport.duration % 60
                  }m`
                : "Chưa xác định"}
            </span>
          </div>
          <div className="flex items-center gap-2 col-span-2">
            <Users className="w-4 h-4 text-emerald-600" />
            <span>Số khách:</span>
            <span className="font-medium">
              {bookingInfo.passengers.adults} người lớn
              {bookingInfo.passengers.children > 0 &&
                `, ${bookingInfo.passengers.children} trẻ em`}
            </span>
          </div>
        </div>
        {/* Chi tiết giá */}
        <div className="space-y-3">
          <div className="flex justify-between text-gray-600">
            <span>
              Người lớn ({bookingInfo.passengers.adults} x{" "}
              {formatPrice(transport.price)})
            </span>
            <span>
              {formatPrice(transport.price * bookingInfo.passengers.adults)}
            </span>
          </div>
          {bookingInfo.passengers.children > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>
                Trẻ em ({bookingInfo.passengers.children} x{" "}
                {formatPrice(transport.price * 0.75)})
              </span>
              <span>
                {formatPrice(
                  transport.price * 0.75 * bookingInfo.passengers.children
                )}
              </span>
            </div>
          )}
          {transport.promotion && (
            <div className="flex justify-between text-orange-600">
              <span className="flex items-center gap-1">
                <BadgePercent className="w-4 h-4" />
                Giảm giá{" "}
                {transport.promotion.type === "percentage"
                  ? `${transport.promotion.discount}%`
                  : formatPrice(transport.promotion.discount)}
              </span>
              <span>-{formatPrice(bookingSummary.discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg pt-3 border-t">
            <span>Tổng cộng</span>
            <span className="text-emerald-600">
              {formatPrice(bookingSummary.totalPrice)}
            </span>
          </div>
        </div>
      </div>
      <h3 className="text-xl font-bold">Phương thức thanh toán</h3>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div
          className={`p-4 border rounded-xl cursor-pointer transition-all ${
            bookingInfo.payment.method === "credit_card"
              ? "border-emerald-500 bg-emerald-50"
              : "border-gray-200 hover:border-emerald-300"
          }`}
          onClick={() => handleInputChange("payment", "method", "credit_card")}
        >
          <div className="flex items-start gap-3">
            <CreditCard className="w-6 h-6 text-emerald-600 mt-1" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Thẻ tín dụng/ghi nợ</h4>
                {bookingInfo.payment.method === "credit_card" && (
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
        <div
          className={`p-4 border rounded-xl cursor-pointer transition-all ${
            bookingInfo.payment.method === "bank_transfer"
              ? "border-emerald-500 bg-emerald-50"
              : "border-gray-200 hover:border-emerald-300"
          }`}
          onClick={() =>
            handleInputChange("payment", "method", "bank_transfer")
          }
        >
          <div className="flex items-start gap-3">
            <Building2 className="w-6 h-6 text-emerald-600 mt-1" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Chuyển khoản ngân hàng</h4>
                {bookingInfo.payment.method === "bank_transfer" && (
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Chuyển khoản trực tiếp qua ngân hàng
              </p>
            </div>
          </div>
        </div>
        <div
          className={`p-4 border rounded-xl cursor-pointer transition-all ${
            bookingInfo.payment.method === "vnpay"
              ? "border-emerald-500 bg-emerald-50"
              : "border-gray-200 hover:border-emerald-300"
          }`}
          onClick={() => handleInputChange("payment", "method", "vnpay")}
        >
          <div className="flex items-start gap-3">
            <QrCode className="w-6 h-6 text-emerald-600 mt-1" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">VNPay</h4>
                {bookingInfo.payment.method === "vnpay" && (
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
        <div
          className={`p-4 border rounded-xl cursor-pointer transition-all ${
            bookingInfo.payment.method === "momo"
              ? "border-emerald-500 bg-emerald-50"
              : "border-gray-200 hover:border-emerald-300"
          }`}
          onClick={() => handleInputChange("payment", "method", "momo")}
        >
          <div className="flex items-start gap-3">
            <Wallet className="w-6 h-6 text-emerald-600 mt-1" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Momo</h4>
                {bookingInfo.payment.method === "momo" && (
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
        {/* Phương thức thanh toán tiền mặt */}
        <div
          className={`p-4 border rounded-xl cursor-pointer transition-all col-span-2 ${
            bookingInfo.payment.method === "cash"
              ? "border-emerald-500 bg-emerald-50"
              : "border-gray-200 hover:border-emerald-300"
          }`}
          onClick={() => handleInputChange("payment", "method", "cash")}
        >
          <div className="flex items-start gap-3">
            <Wallet className="w-6 h-6 text-emerald-600 mt-1" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Tiền mặt</h4>
                {bookingInfo.payment.method === "cash" && (
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Thanh toán bằng tiền mặt khi lên xe
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form chi tiết theo phương thức thanh toán */}
      {bookingInfo.payment.method === "credit_card" && (
        <div className="p-6 bg-gray-50 rounded-lg space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số thẻ <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={bookingInfo.payment.cardNumber}
                onChange={(e) =>
                  handleInputChange("payment", "cardNumber", e.target.value)
                }
                className={`w-full p-2 pl-10 border ${
                  errors.payment.cardNumber
                    ? "border-red-500"
                    : "border-gray-200"
                } rounded-lg focus:ring-2 focus:ring-emerald-500`}
                placeholder="1234 5678 9012 3456"
              />
              <CreditCard className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              {errors.payment.cardNumber && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.payment.cardNumber}
                </p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên chủ thẻ <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={bookingInfo.payment.cardHolder}
                onChange={(e) =>
                  handleInputChange("payment", "cardHolder", e.target.value)
                }
                className={`w-full p-2 pl-10 border ${
                  errors.payment.cardHolder
                    ? "border-red-500"
                    : "border-gray-200"
                } rounded-lg focus:ring-2 focus:ring-emerald-500`}
                placeholder="NGUYEN VAN A"
              />
              <User className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              {errors.payment.cardHolder && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.payment.cardHolder}
                </p>
              )}
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
                  value={bookingInfo.payment.expiry}
                  onChange={(e) =>
                    handleInputChange("payment", "expiry", e.target.value)
                  }
                  className={`w-full p-2 pl-10 border ${
                    errors.payment.expiry ? "border-red-500" : "border-gray-200"
                  } rounded-lg focus:ring-2 focus:ring-emerald-500`}
                  placeholder="MM/YY"
                />
                <CalendarDays className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                {errors.payment.expiry && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.payment.expiry}
                  </p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CVV <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={bookingInfo.payment.cvv}
                onChange={(e) =>
                  handleInputChange("payment", "cvv", e.target.value)
                }
                className={`w-full p-2 border ${
                  errors.payment.cvv ? "border-red-500" : "border-gray-200"
                } rounded-lg focus:ring-2 focus:ring-emerald-500`}
                placeholder="123"
              />
              {errors.payment.cvv && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.payment.cvv}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      {bookingInfo.payment.method === "bank_transfer" && (
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
                  {formatPrice(bookingSummary.totalPrice)}
                </p>
              </div>

              {/* Nội dung chuyển khoản */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-500 mb-1">
                  Nội dung chuyển khoản
                </p>
                <div className="flex items-center justify-between">
                  <p className="font-mono text-gray-800">
                    DAT VE {bookingInfo.passengerDetails.phone || "SDT"}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `DAT VE ${bookingInfo.passengerDetails.phone || "SDT"}`
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
                      Vé sẽ được xác nhận sau khi nhận được thanh toán (2-5
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
      {bookingInfo.payment.method === "vnpay" && (
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
                src={`${API_URL}/uploads/QR/bank.jpg`}
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
      {bookingInfo.payment.method === "momo" && (
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
                src={`${API_URL}/uploads/QR/bank.jpg`}
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
      {bookingInfo.payment.method === "cash" && (
        <div className="p-6 bg-emerald-50 rounded-lg border border-emerald-200">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-emerald-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-emerald-800 mb-2">
                Hướng dẫn thanh toán tiền mặt
              </h4>
              <ul className="text-sm text-emerald-700 space-y-1 list-disc list-inside">
                <li>Vui lòng chuẩn bị đủ tiền mặt khi lên xe</li>
                <li>Thanh toán trực tiếp cho tài xế hoặc nhân viên xe</li>
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
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white mb-6 hover:text-emerald-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Quay lại chi tiết chuyến đi
          </button>
          <h1 className="text-3xl font-bold mb-2">
            Đặt vé{" "}
            {transport.vehicle_name ||
              (transport.type === "train" ? "tàu" : "xe")}
          </h1>
          <p className="text-emerald-100">
            {transport.from_location} → {transport.to_location}
          </p>
          {transport.trip_code && (
            <p className="text-emerald-200 text-sm mt-1">
              Mã chuyến: {transport.trip_code}
            </p>
          )}
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            {/* Step indicator */}
            <div className="flex items-center justify-center mb-8">
              <div
                className={`flex items-center ${
                  step === 1 ? "text-emerald-600" : "text-gray-400"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    step === 1
                      ? "border-emerald-600 bg-emerald-50"
                      : "border-gray-300"
                  }`}
                >
                  <Users className="w-5 h-5" />
                </div>
                <span className="ml-3 font-medium">Thông tin hành khách</span>
              </div>
              <div className="w-20 h-px bg-gray-300 mx-4"></div>
              <div
                className={`flex items-center ${
                  step === 2 ? "text-emerald-600" : "text-gray-400"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    step === 2
                      ? "border-emerald-600 bg-emerald-50"
                      : "border-gray-300"
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                </div>
                <span className="ml-3 font-medium">Thanh toán</span>
              </div>
            </div>
            {/* Step 1: Thông tin hành khách */}
            {step === 1 ? (
              <div className="space-y-8">
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold">
                    Thông tin hành khách
                  </h3>
                  <div className="p-6 bg-gray-50 rounded-lg space-y-4">
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Danh xưng <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={bookingInfo.passengerDetails.title}
                          onChange={(e) =>
                            handleInputChange(
                              "passengerDetails",
                              "title",
                              e.target.value
                            )
                          }
                          className={`w-full p-2 border ${
                            errors.passengerDetails.title
                              ? "border-red-500"
                              : "border-gray-200"
                          } rounded-lg focus:ring-2 focus:ring-emerald-500`}
                        >
                          <option value="">Chọn</option>
                          <option value="mr">Ông</option>
                          <option value="mrs">Bà</option>
                        </select>
                        {errors.passengerDetails.title && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.passengerDetails.title}
                          </p>
                        )}
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Họ và tên đệm <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={bookingInfo.passengerDetails.lastName}
                          onChange={(e) =>
                            handleInputChange(
                              "passengerDetails",
                              "lastName",
                              e.target.value
                            )
                          }
                          className={`w-full p-2 border ${
                            errors.passengerDetails.lastName
                              ? "border-red-500"
                              : "border-gray-200"
                          } rounded-lg focus:ring-2 focus:ring-emerald-500`}
                        />
                        {errors.passengerDetails.lastName && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.passengerDetails.lastName}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tên <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={bookingInfo.passengerDetails.firstName}
                          onChange={(e) =>
                            handleInputChange(
                              "passengerDetails",
                              "firstName",
                              e.target.value
                            )
                          }
                          className={`w-full p-2 border ${
                            errors.passengerDetails.firstName
                              ? "border-red-500"
                              : "border-gray-200"
                          } rounded-lg focus:ring-2 focus:ring-emerald-500`}
                        />
                        {errors.passengerDetails.firstName && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.passengerDetails.firstName}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          value={bookingInfo.passengerDetails.email}
                          onChange={(e) =>
                            handleInputChange(
                              "passengerDetails",
                              "email",
                              e.target.value
                            )
                          }
                          className={`w-full p-2 pl-10 border ${
                            errors.passengerDetails.email
                              ? "border-red-500"
                              : "border-gray-200"
                          } rounded-lg focus:ring-2 focus:ring-emerald-500`}
                        />
                        <Mail className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                        {errors.passengerDetails.email && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.passengerDetails.email}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Số điện thoại <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          value={bookingInfo.passengerDetails.phone}
                          onChange={(e) =>
                            handleInputChange(
                              "passengerDetails",
                              "phone",
                              e.target.value
                            )
                          }
                          className={`w-full p-2 pl-10 border ${
                            errors.passengerDetails.phone
                              ? "border-red-500"
                              : "border-gray-200"
                          } rounded-lg focus:ring-2 focus:ring-emerald-500`}
                        />
                        <Phone className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                        {errors.passengerDetails.phone && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.passengerDetails.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Địa chỉ <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={bookingInfo.passengerDetails.address}
                        onChange={(e) =>
                          handleInputChange(
                            "passengerDetails",
                            "address",
                            e.target.value
                          )
                        }
                        className={`w-full p-2 border ${
                          errors.passengerDetails.address
                            ? "border-red-500"
                            : "border-gray-200"
                        } rounded-lg focus:ring-2 focus:ring-emerald-500`}
                      />
                      {errors.passengerDetails.address && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.passengerDetails.address}
                        </p>
                      )}
                    </div>
                    {/* Chọn số lượng khách */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Số lượng hành khách{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setShowPassengerModal(!showPassengerModal)
                        }
                        className="w-full text-left border border-gray-200 rounded-xl p-3 pl-4 pr-10 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors shadow-sm hover:border-emerald-300 bg-white"
                      >
                        {`${bookingInfo.passengers.adults} người lớn${
                          bookingInfo.passengers.children > 0
                            ? `, ${bookingInfo.passengers.children} trẻ em`
                            : ""
                        }`}
                      </button>
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-emerald-600 bg-emerald-50 p-1 rounded-full">
                        <Users size={18} />
                      </div>
                      {showPassengerModal && renderPassengerModal()}
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-200 mt-8 pt-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">
                      Tổng thanh toán
                    </p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {formatPrice(bookingSummary.totalPrice)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="bg-emerald-600 text-white px-8 py-3 rounded-xl hover:bg-emerald-700 transition-colors font-medium"
                  >
                    Tiếp tục
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {renderPaymentForm()}
                <div className="border-t border-gray-200 mt-8 pt-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">
                      Tổng thanh toán
                    </p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {formatPrice(bookingSummary.totalPrice)}
                    </p>
                  </div>
                  <div className="space-x-4 flex items-center">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                    >
                      Quay lại
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-emerald-600 text-white px-8 py-3 rounded-xl hover:bg-emerald-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-70"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Đang xử lý...
                        </>
                      ) : (
                        "Xác nhận đặt vé"
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransportBooking;
