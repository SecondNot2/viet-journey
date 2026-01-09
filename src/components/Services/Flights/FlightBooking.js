import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  User,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  ArrowLeft,
  Users,
  Clock,
  Loader2,
  CalendarDays,
  Plane,
  Info,
  Plus,
  Minus,
  X,
  Wallet,
  QrCode,
  Building2,
  CheckCircle2,
  MapPin,
  ArrowRight,
  Armchair,
  Receipt,
  Tag,
  Check,
  AlertCircle,
  X as XIcon,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import axios from "axios";
import Toast from "../../common/Toast";
import ConfirmModal from "../../common/ConfirmModal";
import { API_URL, API_HOST } from "../../../config/api";

// API_URL cho REST endpoints (e.g. /api/bookings), API_HOST cho static assets
const API_BASE_URL = API_URL;

const FlightBooking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const bookingData = location.state;

  // Validate booking data on mount
  useEffect(() => {
    if (!bookingData) {
      navigate("/flights");
      return;
    }
  }, [bookingData, navigate]);

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassengerModal, setShowPassengerModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [passengerError, setPassengerError] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState("credit_card");
  const [toast, setToast] = useState(null);

  const defaultPassengerCount = {
    adults: 1,
    children: 0,
    infants: 0,
  };

  const [passengerCount, setPassengerCount] = useState(
    bookingData?.passengers || defaultPassengerCount
  );

  const getInitialPassengers = () => {
    const totalPassengers = bookingData?.passengers
      ? Object.values(bookingData.passengers).reduce((a, b) => a + b, 0)
      : 1;

    return Array(totalPassengers).fill({
      title: "",
      firstName: "",
      lastName: "",
      dob: "",
      passportNumber: "",
      nationality: "Vietnam",
      specialRequirements: "",
    });
  };

  const [bookingInfo, setBookingInfo] = useState({
    passengers: getInitialPassengers(),
    contact: {
      email: "",
      phone: "",
    },
    payment: {
      cardNumber: "",
      cardHolder: "",
      expiry: "",
      cvv: "",
    },
  });

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
    passengers: [],
    contact: {
      email: "",
      phone: "",
    },
    payment: {
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
    },
    passport: "",
  });

  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    setErrors((prev) => ({
      ...prev,
      passengers: Array(
        Object.values(passengerCount).reduce((a, b) => a + b, 0)
      ).fill({
        title: "",
        firstName: "",
        lastName: "",
        dob: "",
      }),
    }));
  }, [passengerCount]);

  useEffect(() => {
    if (!location.state) {
      console.log("[DEBUG] Không có dữ liệu booking");
      navigate("/flights");
      return;
    }

    if (bookingData.passengers) {
      setPassengerCount(bookingData.passengers);
    }
  }, [bookingData, navigate]);

  // ✅ Auto-fill contact info and first passenger from user profile when logged in
  useEffect(() => {
    if (user) {
      // Parse full_name into firstName and lastName
      let firstName = "";
      let lastName = "";
      if (user.full_name) {
        const nameParts = user.full_name.trim().split(" ");
        if (nameParts.length >= 2) {
          // First word is last name (họ), rest is first name (tên và tên đệm)
          lastName = nameParts[0];
          firstName = nameParts.slice(1).join(" ");
        } else {
          firstName = user.full_name;
        }
      }

      // Determine title based on gender
      let title = "";
      if (user.gender === "male") {
        title = "mr";
      } else if (user.gender === "female") {
        title = "ms";
      }

      // Update contact info
      setBookingInfo((prev) => {
        const newPassengers = [...prev.passengers];
        // Auto-fill first passenger if exists
        if (newPassengers.length > 0) {
          newPassengers[0] = {
            ...newPassengers[0],
            title: title || newPassengers[0].title,
            firstName: firstName || newPassengers[0].firstName,
            lastName: lastName || newPassengers[0].lastName,
          };
        }

        return {
          ...prev,
          passengers: newPassengers,
          contact: {
            ...prev.contact,
            email: user.email || prev.contact.email,
            phone: user.phone_number || prev.contact.phone,
          },
        };
      });
    }
  }, [user]);

  const { flight } = location.state || {};

  if (!flight) {
    navigate("/flights");
    return null;
  }

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

  const handleInputChange = (section, field, index = null, value) => {
    setBookingInfo((prev) => {
      if (index !== null) {
        const newPassengers = [...prev.passengers];
        newPassengers[index] = {
          ...newPassengers[index],
          [field]: value,
        };
        return { ...prev, passengers: newPassengers };
      }
      if (section === "contact") {
        return {
          ...prev,
          contact: { ...prev.contact, [field]: value },
        };
      }
      if (section === "payment") {
        return {
          ...prev,
          payment: { ...prev.payment, [field]: value },
        };
      }
      return prev;
    });
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

  const generatePassportNumber = (passenger, index) => {
    const firstName = passenger.firstName.substring(0, 1);
    const lastName = passenger.lastName.replace(/\s/g, "").substring(0, 2);
    const dob = passenger.dob.replace(/-/g, "").substring(2, 8);

    let prefix = "";
    if (index >= passengerCount.adults) {
      if (index >= passengerCount.adults + passengerCount.children) {
        prefix = "INFANT_";
      } else {
        prefix = "CHILD_";
      }
    }

    return prefix + lastName + firstName + dob;
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const handleConfirmBooking = async () => {
    try {
      setShowConfirmModal(false);
      setSubmitLoading(true);

      // ✅ Lấy flight và pricing từ location.state
      // FlightDetailPage gửi bookingInfo với flight và pricing bên trong
      const flight = location.state?.flight || {};
      const pricing = location.state?.pricing || {};

      // ✅ Validate flight ID (phải là schedule_id từ flight_schedules)
      const flightId = flight.id || flight.schedule_id || flight.flightId;

      console.log("[DEBUG] Flight data:", flight);
      console.log("[DEBUG] Flight ID:", flightId);
      console.log("[DEBUG] Seat class:", location.state.class);

      if (!flightId) {
        showToast("Thiếu thông tin chuyến bay", "error");
        throw new Error("Thiếu thông tin chuyến bay");
      }
      if (
        !bookingInfo.contact.email?.trim() ||
        !bookingInfo.contact.phone?.trim()
      ) {
        showToast("Vui lòng nhập đầy đủ thông tin liên hệ", "error");
        throw new Error("Vui lòng nhập đầy đủ thông tin liên hệ");
      }

      const totalPassengers =
        passengerCount.adults +
        passengerCount.children +
        passengerCount.infants;
      if (totalPassengers === 0) {
        showToast("Vui lòng chọn ít nhất 1 hành khách", "error");
        throw new Error("Vui lòng chọn ít nhất 1 hành khách");
      }

      // ✅ Prepare passenger data với validation
      const passengers = bookingInfo.passengers.map((p, index) => {
        let passengerType = "adult";
        if (index >= passengerCount.adults) {
          if (index >= passengerCount.adults + passengerCount.children) {
            passengerType = "infant";
          } else {
            passengerType = "child";
          }
        }

        // ✅ Generate passport number cho trẻ em và em bé
        let passportNumber = p.passportNumber;
        if (!passportNumber && passengerType !== "adult") {
          const firstName = p.firstName?.substring(0, 1) || "X";
          const lastName =
            p.lastName?.replace(/\s/g, "").substring(0, 2) || "XX";
          const dob = p.dob?.replace(/-/g, "").substring(2, 8) || "000000";
          passportNumber = `${passengerType.toUpperCase()}_${lastName}${firstName}${dob}`;
        }

        return {
          passenger_type: passengerType,
          title: p.title,
          first_name: p.firstName,
          last_name: p.lastName,
          dob: p.dob,
          passport_number: passportNumber,
          nationality: p.nationality || "Vietnam",
          special_requirements: p.specialRequirements || null,
        };
      });

      const bookingPayload = {
        user_id: user?.id || null, // ✅ THÊM user_id từ AuthContext
        flight_id: flightId, // ✅ Dùng flightId đã validate (schedule_id từ flight_schedules)
        service_type: "flight",
        seat_class: location.state.class || "economy",
        passenger_count: JSON.stringify({
          adults: passengerCount.adults,
          children: passengerCount.children,
          infants: passengerCount.infants,
        }),
        total_price: pricing.finalTotal,
        contact_email: bookingInfo.contact.email,
        contact_phone: bookingInfo.contact.phone,
        booking_date: new Date().toISOString().split("T")[0],
        status: "pending",
        payment_status:
          selectedPaymentMethod === "credit_card" ? "paid" : "pending",
        payment_method: selectedPaymentMethod,
        passengers: passengers,
      };

      console.log("[DEBUG] Booking payload với user_id:", bookingPayload);
      console.log("[DEBUG] user_id value:", bookingPayload.user_id);

      const response = await axios.post(
        `${API_BASE_URL}/bookings`,
        bookingPayload,
        { withCredentials: true }
      );

      if (response.status === 201) {
        showToast("Đặt vé thành công! Đang chuyển hướng...", "success");

        // ✅ Format date properly - KHÔNG parse Date object để tránh timezone issues
        // Dùng flight_date (YYYY-MM-DD string) thay vì departure_datetime
        const flightDateStr = flight.flight_date || ""; // "2025-10-11"
        const formattedDate = flightDateStr
          ? (() => {
              const [year, month, day] = flightDateStr.split("-");
              return `${day}/${month}/${year}`; // DD/MM/YYYY
            })()
          : "Chưa xác định";

        // ✅ Extract time từ departure_datetime (hoặc dùng departure_time từ route)
        const formattedTime = (() => {
          if (flight.departure_datetime) {
            // Parse time portion only: "2025-10-12T06:00:00.000Z" → "06:00"
            const timePart = flight.departure_datetime.split("T")[1];
            if (timePart) {
              const [hour, minute] = timePart.split(":");
              return `${hour}:${minute}`;
            }
          }
          return flight.departure_time || "00:00";
        })();

        // Delay navigation để user thấy toast
        setTimeout(() => {
          navigate("/flights/booking/success", {
            state: {
              bookingInfo: {
                bookingId: response.data.booking_id,
                passengers: passengers,
                contact: bookingInfo.contact,
                payment: {
                  method: selectedPaymentMethod,
                  status: "confirmed",
                },
                totalPrice: pricing.finalTotal,
              },
              flight: {
                ...flight,
                airline: flight.airline,
                flightNumber: flight.flight_number,
                from: flight.from_location,
                to: flight.to_location,
                departureTime: formattedDate,
                departureHour: formattedTime,
                price: flight.price,
                seat_class: location.state.class,
              },
              pricing: pricing,
            },
          });
        }, 1500);
      }
    } catch (error) {
      console.error("[ERROR] Booking error:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Có lỗi xảy ra khi đặt vé";
      showToast(errorMessage, "error");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSubmit = async () => {
    console.log("[DEBUG] handleSubmit CALLED! currentStep:", currentStep);

    if (currentStep !== 2) {
      console.log("[DEBUG] Skipped because currentStep !== 2");
      return;
    }

    setErrors((prev) => ({
      ...prev,
      payment: {
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
      },
    }));

    let hasError = false;
    const newErrors = { ...errors };

    if (selectedPaymentMethod === "credit_card") {
      if (!paymentInfo.credit_card.cardNumber.trim()) {
        newErrors.payment.credit_card.cardNumber = "Vui lòng nhập số thẻ";
        hasError = true;
      } else if (
        !/^\d{16}$/.test(paymentInfo.credit_card.cardNumber.replace(/\s/g, ""))
      ) {
        newErrors.payment.credit_card.cardNumber = "Số thẻ không hợp lệ";
        hasError = true;
      }

      if (!paymentInfo.credit_card.cardHolder.trim()) {
        newErrors.payment.credit_card.cardHolder = "Vui lòng nhập tên chủ thẻ";
        hasError = true;
      }

      if (!paymentInfo.credit_card.expiry.trim()) {
        newErrors.payment.credit_card.expiry = "Vui lòng nhập ngày hết hạn";
        hasError = true;
      } else if (
        !/^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(paymentInfo.credit_card.expiry)
      ) {
        newErrors.payment.credit_card.expiry =
          "Ngày hết hạn không hợp lệ (MM/YY)";
        hasError = true;
      }

      if (!paymentInfo.credit_card.cvv.trim()) {
        newErrors.payment.credit_card.cvv = "Vui lòng nhập CVV";
        hasError = true;
      } else if (!/^\d{3,4}$/.test(paymentInfo.credit_card.cvv)) {
        newErrors.payment.credit_card.cvv = "CVV không hợp lệ";
        hasError = true;
      }
    } else if (selectedPaymentMethod === "bank_transfer") {
      // Bank transfer không cần validate vì thông tin đã cố định
      // User chỉ cần chuyển khoản theo thông tin hiển thị
    } else if (
      selectedPaymentMethod === "vnpay" ||
      selectedPaymentMethod === "momo"
    ) {
      if (!paymentInfo[selectedPaymentMethod].phone.trim()) {
        newErrors.payment[selectedPaymentMethod].phone =
          "Vui lòng nhập số điện thoại";
        hasError = true;
      } else if (
        !/^(0|\+84)[0-9]{9}$/.test(paymentInfo[selectedPaymentMethod].phone)
      ) {
        newErrors.payment[selectedPaymentMethod].phone =
          "Số điện thoại không hợp lệ";
        hasError = true;
      }
    }

    if (hasError) {
      console.log("[DEBUG] Validation FAILED, errors:", newErrors);
      setErrors(newErrors);
      return;
    }

    console.log("[DEBUG] Validation PASSED, proceeding to submit...");
    setLoading(true);
    try {
      // ✅ DEBUG: Kiểm tra user từ AuthContext
      console.log("[DEBUG] Current user from AuthContext:", user);
      console.log("[DEBUG] user?.id:", user?.id);
      console.log("[DEBUG] bookingData?.flight:", bookingData?.flight);
      console.log(
        "[DEBUG] flight_id sẽ dùng:",
        bookingData?.flight?.schedule_id || bookingData?.flight?.id
      );

      // ✅ Chuẩn bị dữ liệu passengers cho API
      const passengers = bookingInfo.passengers.map((p) => ({
        passenger_type: p.type || "adult", // adult, child, infant
        title: p.title,
        first_name: p.firstName,
        last_name: p.lastName,
        dob: p.dob || null,
        passport_number: p.passportNumber || null,
        nationality: p.nationality || "VN",
        special_requirements: p.specialRequirements || null,
      }));

      // ✅ Tính tổng số hành khách
      const totalPassengers = {
        adults: passengerCount.adults || 1,
        children: passengerCount.children || 0,
        infants: passengerCount.infants || 0,
      };

      // ✅ Chuẩn bị booking data
      const apiBookingData = {
        user_id: user?.id || null, // ✅ Thêm user_id từ AuthContext
        flight_id: bookingData?.flight?.schedule_id || bookingData?.flight?.id, // ✅ Fix: dùng schedule_id như trong log
        service_type: "flight",
        booking_date: new Date().toISOString().split("T")[0],
        status: "pending",
        payment_status:
          selectedPaymentMethod === "bank_transfer" ? "pending" : "paid",
        seat_class: bookingData?.seatClass || "economy",
        passenger_count: JSON.stringify(totalPassengers),
        total_price: bookingData?.pricing?.finalTotal || 0,
        contact_email: bookingInfo.contact.email,
        contact_phone: bookingInfo.contact.phone,
        notes: `Phương thức thanh toán: ${
          selectedPaymentMethod === "credit_card"
            ? "Thẻ tín dụng"
            : selectedPaymentMethod === "bank_transfer"
            ? "Chuyển khoản ngân hàng"
            : selectedPaymentMethod === "vnpay"
            ? "VNPay"
            : "Momo"
        }`,
        passengers: passengers,
      };

      console.log("[DEBUG] Sending flight booking:", apiBookingData);
      console.log("[DEBUG] apiBookingData.user_id:", apiBookingData.user_id);

      // ✅ Gọi API tạo booking
      const response = await axios.post(
        `${API_BASE_URL}/bookings`,
        apiBookingData,
        {
          withCredentials: true,
        }
      );

      if (response.status === 201) {
        // ✅ Đặt vé thành công
        navigate("/flights/booking/success", {
          state: {
            bookingInfo: bookingInfo,
            flight: bookingData?.flight,
            bookingId: response.data.booking_id,
          },
        });
      }
    } catch (error) {
      console.error("[ERROR] Flight booking failed:", error);
      alert(
        `Có lỗi xảy ra khi đặt vé: ${
          error.response?.data?.error || error.message
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    // ✅ Reset errors trước khi validate
    setErrors((prev) => ({
      ...prev,
      passengers: prev.passengers.map(() => ({
        title: "",
        firstName: "",
        lastName: "",
        dob: "",
        passport: "",
      })),
      contact: {
        email: "",
        phone: "",
      },
    }));

    let hasError = false;
    const newErrors = { ...errors };

    // ✅ Validate từng hành khách
    bookingInfo.passengers.forEach((passenger, index) => {
      // Danh xưng
      if (!passenger.title) {
        newErrors.passengers[index].title = "Vui lòng chọn danh xưng";
        hasError = true;
      }

      // Tên
      if (!passenger.firstName?.trim()) {
        newErrors.passengers[index].firstName = "Vui lòng nhập tên";
        hasError = true;
      } else if (passenger.firstName.trim().length < 2) {
        newErrors.passengers[index].firstName = "Tên phải có ít nhất 2 ký tự";
        hasError = true;
      }

      // Họ
      if (!passenger.lastName?.trim()) {
        newErrors.passengers[index].lastName = "Vui lòng nhập họ";
        hasError = true;
      } else if (passenger.lastName.trim().length < 2) {
        newErrors.passengers[index].lastName = "Họ phải có ít nhất 2 ký tự";
        hasError = true;
      }

      // Ngày sinh
      if (!passenger.dob) {
        newErrors.passengers[index].dob = "Vui lòng nhập ngày sinh";
        hasError = true;
      } else {
        const birthDate = new Date(passenger.dob);
        const today = new Date();
        const age = Math.floor(
          (today - birthDate) / (365.25 * 24 * 60 * 60 * 1000)
        );

        // Validate age based on passenger type
        if (index < passengerCount.adults) {
          if (age < 12) {
            newErrors.passengers[index].dob =
              "Người lớn phải từ 12 tuổi trở lên";
            hasError = true;
          }
        } else if (index < passengerCount.adults + passengerCount.children) {
          if (age < 2 || age >= 12) {
            newErrors.passengers[index].dob = "Trẻ em phải từ 2-11 tuổi";
            hasError = true;
          }
        } else {
          if (age >= 2) {
            newErrors.passengers[index].dob = "Em bé phải dưới 2 tuổi";
            hasError = true;
          }
        }
      }

      // ✅ Passport/CMND validation cho người lớn
      if (index < passengerCount.adults) {
        if (!passenger.passportNumber?.trim()) {
          newErrors.passengers[index].passport =
            "Vui lòng nhập số hộ chiếu/CMND";
          hasError = true;
        } else if (!/^[A-Z0-9]{8,12}$/.test(passenger.passportNumber.trim())) {
          newErrors.passengers[index].passport =
            "Số hộ chiếu/CMND phải có 8-12 ký tự, chỉ bao gồm chữ in hoa và số";
          hasError = true;
        }
      }
    });

    // ✅ Validate contact info
    if (!bookingInfo.contact.email?.trim()) {
      newErrors.contact.email = "Vui lòng nhập email";
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bookingInfo.contact.email)) {
      newErrors.contact.email = "Email không hợp lệ";
      hasError = true;
    }

    if (!bookingInfo.contact.phone?.trim()) {
      newErrors.contact.phone = "Vui lòng nhập số điện thoại";
      hasError = true;
    } else if (
      !/^(0|\+84)[0-9]{9,10}$/.test(
        bookingInfo.contact.phone.replace(/\s/g, "")
      )
    ) {
      newErrors.contact.phone = "Số điện thoại không hợp lệ";
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      // Scroll to first error
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setCurrentStep(2);
  };

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

  const renderTotalPrice = () => {
    if (!bookingData?.pricing) return formatPrice(0);
    return formatPrice(bookingData.pricing.finalTotal);
  };

  const renderStepIndicator = () => (
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
        <span className="ml-3 font-medium">Thanh toán</span>
      </div>
    </div>
  );

  const updatePassengers = (type, action) => {
    setPassengerCount((prev) => {
      const newCount =
        action === "increase"
          ? prev[type] + 1
          : Math.max(type === "adults" ? 1 : 0, prev[type] - 1);

      const newCounts = {
        ...prev,
        [type]: newCount,
      };

      const total = newCounts.adults + newCounts.children + newCounts.infants;
      if (total > 10) {
        setPassengerError("Tổng số hành khách không thể vượt quá 10 người");
        return prev;
      }

      const totalPassengers =
        newCounts.adults + newCounts.children + newCounts.infants;
      const currentPassengers = [...bookingInfo.passengers];

      if (totalPassengers > currentPassengers.length) {
        while (currentPassengers.length < totalPassengers) {
          currentPassengers.push({
            title: "",
            firstName: "",
            lastName: "",
            dob: "",
          });
        }
      } else if (totalPassengers < currentPassengers.length) {
        currentPassengers.splice(totalPassengers);
      }

      setBookingInfo((prev) => ({
        ...prev,
        passengers: currentPassengers,
      }));

      setPassengerError("");
      return newCounts;
    });
  };

  const PassengerModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">Chọn số lượng hành khách</h3>
          <button
            onClick={() => setShowPassengerModal(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Người lớn</p>
              <p className="text-sm text-gray-500">Từ 12 tuổi trở lên</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => updatePassengers("adults", "decrease")}
                className="p-2 border rounded-xl hover:bg-gray-50 transition-colors"
                disabled={passengerCount.adults <= 1}
              >
                <Minus
                  size={16}
                  className={passengerCount.adults <= 1 ? "text-gray-300" : ""}
                />
              </button>
              <span className="w-8 text-center font-medium">
                {passengerCount.adults}
              </span>
              <button
                onClick={() => updatePassengers("adults", "increase")}
                className="p-2 border rounded-xl hover:bg-gray-50 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Trẻ em</p>
              <p className="text-sm text-gray-500">2-11 tuổi (Giảm 30%)</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => updatePassengers("children", "decrease")}
                className="p-2 border rounded-xl hover:bg-gray-50 transition-colors"
                disabled={passengerCount.children <= 0}
              >
                <Minus
                  size={16}
                  className={
                    passengerCount.children <= 0 ? "text-gray-300" : ""
                  }
                />
              </button>
              <span className="w-8 text-center font-medium">
                {passengerCount.children}
              </span>
              <button
                onClick={() => updatePassengers("children", "increase")}
                className="p-2 border rounded-xl hover:bg-gray-50 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Em bé</p>
              <p className="text-sm text-gray-500">Dưới 2 tuổi (Miễn phí)</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => updatePassengers("infants", "decrease")}
                className="p-2 border rounded-xl hover:bg-gray-50 transition-colors"
                disabled={passengerCount.infants <= 0}
              >
                <Minus
                  size={16}
                  className={passengerCount.infants <= 0 ? "text-gray-300" : ""}
                />
              </button>
              <span className="w-8 text-center font-medium">
                {passengerCount.infants}
              </span>
              <button
                onClick={() => updatePassengers("infants", "increase")}
                className="p-2 border rounded-xl hover:bg-gray-50 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {passengerError && (
            <p className="text-red-500 text-sm">{passengerError}</p>
          )}

          <button
            onClick={() => setShowPassengerModal(false)}
            className="w-full bg-emerald-600 text-white py-3 rounded-xl hover:bg-emerald-700 transition-colors"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );

  const renderPassengerAndContactForm = () => (
    <div className="space-y-8">
      <div className="space-y-6">
        <h3 className="text-xl font-semibold">Thông tin hành khách</h3>
        <div className="p-6 bg-gray-50 rounded-xl space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số lượng hành khách <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPassengerModal(true)}
                className="w-full text-left border border-gray-200 rounded-xl p-4 pr-10 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all hover:bg-gray-50"
              >
                {passengerCount.adults +
                  passengerCount.children +
                  passengerCount.infants >
                0
                  ? `${passengerCount.adults} người lớn${
                      passengerCount.children > 0
                        ? `, ${passengerCount.children} trẻ em`
                        : ""
                    }${
                      passengerCount.infants > 0
                        ? `, ${passengerCount.infants} em bé`
                        : ""
                    }`
                  : "Chọn số lượng hành khách"}
              </button>
              <Users
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
            </div>
          </div>

          {bookingInfo.passengers.map((passenger, index) => (
            <div
              key={index}
              className="space-y-4 pt-4 border-t border-gray-200 first:pt-0 first:border-t-0"
            >
              <p className="font-medium">
                {index < passengerCount.adults
                  ? "Người lớn"
                  : index < passengerCount.adults + passengerCount.children
                  ? "Trẻ em"
                  : "Em bé"}{" "}
                #{index + 1}
              </p>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Danh xưng <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="title"
                    value={passenger.title}
                    onChange={(e) =>
                      handleInputChange(
                        "passengers",
                        "title",
                        index,
                        e.target.value
                      )
                    }
                    className={`w-full p-2 border ${
                      errors.passengers[index]?.title
                        ? "border-red-500"
                        : "border-gray-200"
                    } rounded-lg focus:ring-2 focus:ring-emerald-500`}
                  >
                    <option value="">Chọn</option>
                    <option value="mr">Ông</option>
                    <option value="mrs">Bà</option>
                  </select>
                  {errors.passengers[index]?.title && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.passengers[index].title}
                    </p>
                  )}
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Họ và tên đệm <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={passenger.lastName}
                    onChange={(e) =>
                      handleInputChange(
                        "passengers",
                        "lastName",
                        index,
                        e.target.value
                      )
                    }
                    className={`w-full p-2 border ${
                      errors.passengers[index]?.lastName
                        ? "border-red-500"
                        : "border-gray-200"
                    } rounded-lg focus:ring-2 focus:ring-emerald-500`}
                  />
                  {errors.passengers[index]?.lastName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.passengers[index].lastName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={passenger.firstName}
                    onChange={(e) =>
                      handleInputChange(
                        "passengers",
                        "firstName",
                        index,
                        e.target.value
                      )
                    }
                    className={`w-full p-2 border ${
                      errors.passengers[index]?.firstName
                        ? "border-red-500"
                        : "border-gray-200"
                    } rounded-lg focus:ring-2 focus:ring-emerald-500`}
                  />
                  {errors.passengers[index]?.firstName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.passengers[index].firstName}
                    </p>
                  )}
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Yêu cầu đặc biệt
                  </label>
                  <input
                    type="text"
                    name="specialRequirements"
                    value={passenger.specialRequirements || ""}
                    onChange={(e) =>
                      handleInputChange(
                        "passengers",
                        "specialRequirements",
                        index,
                        e.target.value
                      )
                    }
                    placeholder="Ví dụ: Suất ăn đặc biệt, hỗ trợ xe lăn..."
                    className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày sinh <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {/* Ngày */}
                  <select
                    value={
                      passenger.dob ? new Date(passenger.dob).getDate() : ""
                    }
                    onChange={(e) => {
                      const currentDate = passenger.dob
                        ? new Date(passenger.dob)
                        : new Date();
                      const year = passenger.dob
                        ? currentDate.getFullYear()
                        : new Date().getFullYear();
                      const month = passenger.dob ? currentDate.getMonth() : 0;
                      const day = parseInt(e.target.value) || 1;
                      const newDate = new Date(year, month, day);
                      handleInputChange(
                        "passengers",
                        "dob",
                        index,
                        newDate.toISOString().split("T")[0]
                      );
                    }}
                    className={`p-2 border ${
                      errors.passengers[index]?.dob
                        ? "border-red-500"
                        : "border-gray-200"
                    } rounded-lg focus:ring-2 focus:ring-emerald-500`}
                  >
                    <option value="">Ngày</option>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>

                  {/* Tháng */}
                  <select
                    value={
                      passenger.dob
                        ? new Date(passenger.dob).getMonth() + 1
                        : ""
                    }
                    onChange={(e) => {
                      const currentDate = passenger.dob
                        ? new Date(passenger.dob)
                        : new Date();
                      const year = passenger.dob
                        ? currentDate.getFullYear()
                        : new Date().getFullYear();
                      const month = parseInt(e.target.value) - 1 || 0;
                      const day = passenger.dob ? currentDate.getDate() : 1;
                      const newDate = new Date(year, month, day);
                      handleInputChange(
                        "passengers",
                        "dob",
                        index,
                        newDate.toISOString().split("T")[0]
                      );
                    }}
                    className={`p-2 border ${
                      errors.passengers[index]?.dob
                        ? "border-red-500"
                        : "border-gray-200"
                    } rounded-lg focus:ring-2 focus:ring-emerald-500`}
                  >
                    <option value="">Tháng</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(
                      (month) => (
                        <option key={month} value={month}>
                          Tháng {month}
                        </option>
                      )
                    )}
                  </select>

                  {/* Năm */}
                  <select
                    value={
                      passenger.dob ? new Date(passenger.dob).getFullYear() : ""
                    }
                    onChange={(e) => {
                      const currentDate = passenger.dob
                        ? new Date(passenger.dob)
                        : new Date();
                      const year =
                        parseInt(e.target.value) || new Date().getFullYear();
                      const month = passenger.dob ? currentDate.getMonth() : 0;
                      const day = passenger.dob ? currentDate.getDate() : 1;
                      const newDate = new Date(year, month, day);
                      handleInputChange(
                        "passengers",
                        "dob",
                        index,
                        newDate.toISOString().split("T")[0]
                      );
                    }}
                    className={`p-2 border ${
                      errors.passengers[index]?.dob
                        ? "border-red-500"
                        : "border-gray-200"
                    } rounded-lg focus:ring-2 focus:ring-emerald-500`}
                  >
                    <option value="">Năm</option>
                    {Array.from(
                      { length: 100 },
                      (_, i) => new Date().getFullYear() - i
                    ).map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.passengers[index]?.dob && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.passengers[index].dob}
                  </p>
                )}
              </div>
              {index < passengerCount.adults && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số hộ chiếu/CMND <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="passportNumber"
                      value={passenger.passportNumber || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "passengers",
                          "passportNumber",
                          index,
                          e.target.value.toUpperCase()
                        )
                      }
                      placeholder="Nhập số hộ chiếu hoặc CMND"
                      className={`w-full p-2 border ${
                        errors.passengers[index]?.passport
                          ? "border-red-500"
                          : "border-gray-200"
                      } rounded-lg focus:ring-2 focus:ring-emerald-500`}
                    />
                    {errors.passengers[index]?.passport && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.passengers[index].passport}
                      </p>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Số hộ chiếu/CMND phải có 8-12 ký tự, chỉ bao gồm chữ in hoa
                    và số
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-semibold">Thông tin liên hệ</h3>
        <div className="p-6 bg-gray-50 rounded-lg space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                name="email"
                value={bookingInfo.contact.email}
                onChange={(e) =>
                  handleInputChange("contact", "email", null, e.target.value)
                }
                className={`w-full p-2 pl-10 border ${
                  errors.contact.email ? "border-red-500" : "border-gray-200"
                } rounded-lg focus:ring-2 focus:ring-emerald-500`}
              />
              <Mail className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              {errors.contact.email && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.contact.email}
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
                name="phone"
                value={bookingInfo.contact.phone}
                onChange={(e) =>
                  handleInputChange("contact", "phone", null, e.target.value)
                }
                className={`w-full p-2 pl-10 border ${
                  errors.contact.phone ? "border-red-500" : "border-gray-200"
                } rounded-lg focus:ring-2 focus:ring-emerald-500`}
              />
              <Phone className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              {errors.contact.phone && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.contact.phone}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPaymentForm = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Receipt className="w-5 h-5 text-emerald-600" />
          <h4 className="font-medium text-gray-900">Chi tiết đặt vé</h4>
        </div>

        <div className="border-b border-gray-200 pb-6">
          <div className="flex gap-6">
            <div className="w-1/3">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <img
                  src={bookingData?.flight?.airlineLogo}
                  alt={bookingData?.flight?.airline}
                  className="w-full h-32 object-contain mb-4"
                />
                <div className="flex items-center gap-2 mb-2">
                  <Plane className="w-4 h-4 text-gray-500" />
                  <p className="font-medium">{bookingData?.flight?.airline}</p>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {bookingData?.flight?.flightNumber}
                </p>

                <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm text-emerald-700 font-medium">
                    {(() => {
                      // ✅ Dùng flight_date (string YYYY-MM-DD) thay vì parse datetime
                      const flightDate = bookingData?.flight?.flight_date;
                      if (!flightDate) return "Chưa xác định";

                      // ✅ Parse YYYY-MM-DD string mà KHÔNG chuyển đổi timezone
                      const [year, month, day] = flightDate.split("-");
                      const date = new Date(
                        parseInt(year),
                        parseInt(month) - 1,
                        parseInt(day)
                      );

                      return date.toLocaleDateString("vi-VN", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      });
                    })()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-4">
                <div className="flex items-center gap-8">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-5 h-5 text-emerald-600" />
                      <p className="text-sm text-gray-500">Điểm khởi hành</p>
                    </div>
                    <p className="font-medium text-xl mb-1">
                      {bookingData?.flight?.from}
                    </p>
                    <p className="text-base text-gray-600">
                      {(() => {
                        // ✅ KHÔNG parse Date - extract time từ string
                        if (bookingData?.flight?.departureHour) {
                          return bookingData.flight.departureHour;
                        }

                        const datetime =
                          bookingData?.flight?.departure_datetime ||
                          bookingData?.flight?.departure_time;
                        if (datetime) {
                          // Extract time: "2025-10-12T06:00:00.000Z" → "06:00"
                          const timePart = datetime.split("T")[1];
                          if (timePart) {
                            const [hour, minute] = timePart.split(":");
                            return `${hour}:${minute}`;
                          }
                        }

                        return "N/A";
                      })()}
                    </p>
                  </div>
                  <div className="flex flex-col items-center px-6">
                    <div className="w-px h-12 bg-gray-300"></div>
                    <div className="bg-emerald-100 rounded-full p-2 my-2">
                      <ArrowRight className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div className="w-px h-12 bg-gray-300"></div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-5 h-5 text-emerald-600" />
                      <p className="text-sm text-gray-500">Điểm đến</p>
                    </div>
                    <p className="font-medium text-xl mb-1">
                      {bookingData?.flight?.to}
                    </p>
                    <p className="text-base text-gray-600">
                      {(() => {
                        // ✅ KHÔNG parse Date - extract time từ string
                        if (bookingData?.flight?.arrivalHour) {
                          return bookingData.flight.arrivalHour;
                        }

                        const datetime =
                          bookingData?.flight?.arrival_datetime ||
                          bookingData?.flight?.arrival_time;
                        if (datetime) {
                          // Extract time: "2025-10-12T08:45:00.000Z" → "08:45"
                          const timePart = datetime.split("T")[1];
                          if (timePart) {
                            const [hour, minute] = timePart.split(":");
                            return `${hour}:${minute}`;
                          }
                        }

                        return "N/A";
                      })()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-emerald-600" />
                    <p className="text-sm text-gray-500">Thời gian bay</p>
                  </div>
                  <p className="font-medium text-lg">
                    {formatDuration(bookingData?.flight?.duration)}
                  </p>
                  <p className="text-sm text-gray-600">Bay thẳng</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Armchair className="w-5 h-5 text-emerald-600" />
                    <p className="text-sm text-gray-500">Hạng ghế</p>
                  </div>
                  <p className="font-medium text-lg">
                    {bookingData?.class === "economy"
                      ? "Phổ thông"
                      : bookingData?.class === "premium_economy"
                      ? "Phổ thông đặc biệt"
                      : bookingData?.class === "business"
                      ? "Thương gia"
                      : "Hạng nhất"}
                  </p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-emerald-600" />
                    <p className="text-sm text-gray-500">Hành khách</p>
                  </div>
                  <p className="font-medium text-lg">
                    {Object.values(passengerCount).reduce((a, b) => a + b, 0)}{" "}
                    người
                  </p>
                  <p className="text-sm text-gray-600">
                    {passengerCount.adults} người lớn
                    {passengerCount.children > 0
                      ? `, ${passengerCount.children} trẻ em`
                      : ""}
                    {passengerCount.infants > 0
                      ? `, ${passengerCount.infants} em bé`
                      : ""}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-200 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-gray-600" />
            <h5 className="font-medium">Thông tin hành khách</h5>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Người lớn (trên 12 tuổi)</span>
              <span>
                {passengerCount.adults} x{" "}
                {formatPrice(bookingData?.pricing?.basePrice)}
              </span>
            </div>
            {passengerCount.children > 0 && (
              <div className="flex justify-between text-sm">
                <span>Trẻ em (2-11 tuổi)</span>
                <span>
                  {passengerCount.children} x{" "}
                  {formatPrice(bookingData?.pricing?.basePrice * 0.75)}
                </span>
              </div>
            )}
            {passengerCount.infants > 0 && (
              <div className="flex justify-between text-sm">
                <span>Em bé (dưới 2 tuổi)</span>
                <span>{passengerCount.infants} x Miễn phí</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-5 h-5 text-gray-600" />
            <h5 className="font-medium">Chi tiết giá</h5>
          </div>
          <div className="space-y-2">
            {/* Chi tiết giá cho từng loại hành khách */}
            {passengerCount.adults > 0 && (
              <div className="flex justify-between text-sm">
                <span>
                  Người lớn ({passengerCount.adults} x{" "}
                  {formatPrice(bookingData?.pricing?.basePrice || 0)})
                </span>
                <span>
                  {formatPrice(bookingData?.pricing?.adultTotal || 0)}
                </span>
              </div>
            )}
            {passengerCount.children > 0 && (
              <div className="flex justify-between text-sm">
                <span>
                  Trẻ em ({passengerCount.children} x{" "}
                  {formatPrice((bookingData?.pricing?.basePrice || 0) * 0.75)})
                </span>
                <span>
                  {formatPrice(bookingData?.pricing?.childTotal || 0)}
                </span>
              </div>
            )}
            {passengerCount.infants > 0 && (
              <div className="flex justify-between text-sm">
                <span>Em bé ({passengerCount.infants} x Miễn phí)</span>
                <span className="text-emerald-600 font-medium">
                  {formatPrice(0)}
                </span>
              </div>
            )}

            {/* Phụ thu hạng ghế */}
            {bookingData?.pricing?.seatClassSurcharge > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Phụ thu hạng ghế</span>
                <span>
                  {formatPrice(bookingData?.pricing?.seatClassSurcharge)}
                </span>
              </div>
            )}

            {/* Tổng trước thuế */}
            <div className="flex justify-between text-sm font-medium pt-2 border-t border-dashed border-gray-200">
              <span>Tổng trước thuế</span>
              <span>
                {formatPrice(bookingData?.pricing?.totalBeforeTax || 0)}
              </span>
            </div>

            {/* Thuế */}
            <div className="flex justify-between text-sm text-gray-600">
              <span>Thuế và phí (5%)</span>
              <span>{formatPrice(bookingData?.pricing?.tax || 0)}</span>
            </div>

            {/* Khuyến mãi */}
            {bookingData?.pricing?.discountAmount > 0 && (
              <div className="flex justify-between text-sm text-orange-500">
                <span>Khuyến mãi</span>
                <span>
                  -{formatPrice(bookingData?.pricing?.discountAmount)}
                </span>
              </div>
            )}

            {/* Tổng cộng */}
            <div className="flex justify-between font-semibold text-base pt-2 border-t-2 border-gray-300">
              <span>Tổng thanh toán</span>
              <span className="text-emerald-600">
                {formatPrice(bookingData?.pricing?.finalTotal || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <h3 className="text-xl font-bold">Phương thức thanh toán</h3>
      <div className="grid grid-cols-2 gap-4 mb-6">
        {paymentMethods.map((method) => (
          <div
            key={method.id}
            className={`p-4 border rounded-xl cursor-pointer transition-all ${
              selectedPaymentMethod === method.id
                ? "border-emerald-500 bg-emerald-50"
                : "border-gray-200 hover:border-emerald-300"
            }`}
            onClick={() => setSelectedPaymentMethod(method.id)}
          >
            <div className="flex items-start gap-3">
              <div className={`text-emerald-600 mt-1`}>{method.icon}</div>
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

      <div className="p-6 bg-gray-50 rounded-lg space-y-4">
        {selectedPaymentMethod === "credit_card" && (
          <>
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
                  className="w-full p-2 pl-10 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="1234 5678 9012 3456"
                />
                <CreditCard className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
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
                      DAT VE {bookingInfo.contact.phone || "SDT"}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `DAT VE ${bookingInfo.contact.phone || "SDT"}`
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
                <h4 className="font-medium">Quét mã QR để thanh toán</h4>
                <span className="ml-auto text-xs px-2 py-1 bg-orange-100 text-orange-600 rounded">
                  Chế độ test
                </span>
              </div>
              <div className="aspect-square max-w-[200px] mx-auto bg-white rounded-lg flex items-center justify-center p-2">
                <img
                  src={`${API_HOST}/uploads/QR/bank.jpg`}
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
                className={`mt-4 p-3 rounded-lg border ${
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

  const renderFlightSummary = () => (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-start gap-6">
        <img
          src={bookingData?.flight?.airlineLogo}
          alt={bookingData?.flight?.airline}
          className="w-32 h-32 object-contain rounded-xl bg-gray-50 p-4"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = `${API_HOST}/images/placeholder.png`;
          }}
        />
        <div>
          <h3 className="font-semibold text-xl mb-2">
            {bookingData?.flight?.airline}
          </h3>
          <p className="text-gray-500 text-sm mb-2">
            {bookingData?.flight?.flightNumber}
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded">
              {bookingData?.class === "economy"
                ? "Phổ thông"
                : bookingData?.class === "premium_economy"
                ? "Phổ thông đặc biệt"
                : bookingData?.class === "business"
                ? "Thương gia"
                : "Hạng nhất"}
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 mt-6 pt-6"></div>

      <div className="border-t border-gray-200 mt-6 pt-6">
        <h4 className="font-medium mb-4">Chi tiết giá</h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Giá vé cơ bản</span>
            <span>{formatPrice(bookingData?.pricing?.basePrice || 0)}</span>
          </div>
          {bookingData?.pricing?.seatClassSurcharge > 0 && (
            <div className="flex justify-between text-sm">
              <span>Phụ thu hạng ghế</span>
              <span>
                {formatPrice(bookingData?.pricing?.seatClassSurcharge)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span>Thuế và phí</span>
            <span>{formatPrice(bookingData?.pricing?.tax || 0)}</span>
          </div>
          {bookingData?.pricing?.discount > 0 && (
            <div className="flex justify-between text-sm text-orange-500">
              <span>Khuyến mãi</span>
              <span>-{formatPrice(bookingData?.pricing?.discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-medium pt-2 border-t border-dashed border-gray-200">
            <span>Tổng cộng</span>
            <span className="text-emerald-600">
              {formatPrice(bookingData?.pricing?.finalTotal || 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

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

      navigate("/flights/booking/success", {
        state: {
          bookingInfo: {
            ...bookingInfo,
            payment: {
              method: method,
              testTransaction: testResponse.transactionId,
            },
          },
          flight: bookingData?.flight,
        },
      });
    } catch (error) {
      console.error(`[ERROR] Test ${method} payment failed:`, error);
      alert("Có lỗi xảy ra khi thực hiện thanh toán test!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-emerald-600 text-white py-12">
        <div className="container mx-auto px-4">
          <button
            onClick={() => navigate(`/flights/${bookingData?.flightId}`)}
            className="flex items-center gap-2 text-white mb-6 hover:text-emerald-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Quay lại chi tiết chuyến bay
          </button>
          <h1 className="text-3xl font-bold mb-2">Đặt vé máy bay</h1>
          <p className="text-emerald-100">
            {bookingData?.flight?.from} → {bookingData?.flight?.to} •{" "}
            {bookingData?.flight?.departureTime}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            {renderStepIndicator()}

            {currentStep === 1 ? (
              <div>
                {renderPassengerAndContactForm()}
                <div className="border-t border-gray-200 mt-8 pt-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">
                      Tổng thanh toán
                    </p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {renderTotalPrice()}
                    </p>
                  </div>
                  <div className="space-x-4 flex items-center">
                    <button
                      type="button"
                      onClick={handleContinue}
                      className="bg-emerald-600 text-white px-8 py-3 rounded-xl hover:bg-emerald-700 transition-colors font-medium"
                    >
                      Tiếp tục
                    </button>
                  </div>
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
                      {renderTotalPrice()}
                    </p>
                  </div>
                  <div className="space-x-4 flex items-center">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                    >
                      Quay lại
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowConfirmModal(true)}
                      disabled={submitLoading}
                      className="bg-emerald-600 text-white px-8 py-3 rounded-xl hover:bg-emerald-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitLoading ? (
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
      {showPassengerModal && <PassengerModal />}
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmBooking}
        title="Xác nhận đặt vé"
        message="Bạn có chắc chắn muốn đặt vé chuyến bay này không?"
        confirmText="Xác nhận đặt vé"
        cancelText="Hủy"
        type="confirm"
        loading={submitLoading}
      />
    </div>
  );
};

export default FlightBooking;
