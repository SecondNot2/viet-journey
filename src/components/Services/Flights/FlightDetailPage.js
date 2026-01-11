import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import FlightDetail from "./FlightDetail";
import {
  CheckCircle,
  ArrowLeft,
  CreditCard,
  Loader,
  Loader2,
  Users,
} from "lucide-react";
import axios from "axios";
import { API_URL, API_HOST } from "../../../config/api";
import { useBreadcrumb } from "../../../contexts/BreadcrumbContext";
import {
  formatDateLong,
  extractTime,
  formatDateDDMMYYYY,
} from "../../../utils/dateHelpers";

// Alias for backward compatibility
const API_BASE_URL = API_URL;

// Cấu hình URL cơ sở cho axios

// Sample flight data - replace with actual API call
const sampleFlight = {
  id: "1",
  airline: "Vietnam Airlines",
  flight_number: "VN123",
  from_location: "Hà Nội",
  to_location: "Hồ Chí Minh",
  departure_time: "2025-04-25T07:00:00",
  arrival_time: "2025-04-25T09:10:00",
  price: 1200000,
  duration: 130, // minutes
  aircraft: "Airbus A321",
  baggage: { cabin: "7kg", checked: "23kg" },
  amenities: ["meal", "wifi", "power", "entertainment"],
  seat_classes: {
    first: { price: 1500000, total_seats: 10, available_seats: 8 },
    economy: { price: 0, total_seats: 120, available_seats: 110 },
    business: { price: 800000, total_seats: 20, available_seats: 18 },
    premium_economy: { price: 300000, total_seats: 30, available_seats: 28 },
  },
};

const FlightDetailPage = () => {
  const { idOrSlug } = useParams();
  const id = idOrSlug;
  const navigate = useNavigate();
  const location = useLocation();
  const { setDynamicTitle } = useBreadcrumb();
  const [flight, setFlight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Lấy thông tin từ state của navigate
  const initialPassengers = location.state?.passengers || {
    adults: 1,
    children: 0,
    infants: 0,
  };
  const initialClass = location.state?.class || "economy";

  const [selectedClass, setSelectedClass] = useState(initialClass);
  const [passengers, setPassengers] = useState(initialPassengers);
  const [showPassengerModal, setShowPassengerModal] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const passengerModalRef = useRef(null);
  const [totalBeforeTax, setTotalBeforeTax] = useState(0);
  const [tax, setTax] = useState(0);
  const [totalAfterTax, setTotalAfterTax] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalTotal, setFinalTotal] = useState(0);

  // Thêm state để lưu thông tin giá
  const [priceDetails, setPriceDetails] = useState({
    basePrice: 0,
    seatClassSurcharge: 0,
    adultTotal: 0,
    childTotal: 0,
    infantTotal: 0,
    totalBeforeTax: 0,
    tax: 0,
    totalAfterTax: 0,
    discountAmount: 0,
    finalTotal: 0,
  });

  // Log để debug
  useEffect(() => {}, [initialPassengers, initialClass]);

  useEffect(() => {
    const fetchFlightDetail = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(`${API_BASE_URL}/flights/${id}`);

        if (response.data) {
          // Xử lý dữ liệu trước khi set state
          const flightData = {
            ...response.data,
            // Đảm bảo có đường dẫn hình ảnh hãng bay đầy đủ
            airlineLogo: response.data.airline_image
              ? response.data.airline_image.startsWith("http")
                ? response.data.airline_image
                : response.data.airline_image.startsWith("/")
                ? `${API_HOST}${response.data.airline_image}`
                : `${API_HOST}/${response.data.airline_image}`
              : `${API_HOST}/images/placeholder.png`,
            // Chuyển đổi các trường thời gian (backend trả về departure_datetime/arrival_datetime)
            departure_time: response.data.departure_datetime,
            arrival_time: response.data.arrival_datetime,
            flight_date: response.data.flight_date,
            // Đảm bảo các trường JSON được parse
            baggage:
              typeof response.data.baggage === "string"
                ? JSON.parse(response.data.baggage)
                : response.data.baggage,
            amenities:
              typeof response.data.amenities === "string"
                ? JSON.parse(response.data.amenities)
                : response.data.amenities,
            seat_classes:
              typeof response.data.seat_classes === "string"
                ? JSON.parse(response.data.seat_classes)
                : response.data.seat_classes,
          };

          setFlight(flightData);

          // Set breadcrumb dynamic title
          setDynamicTitle(
            `${flightData.from_location} → ${flightData.to_location}`
          );

          // Tính toán giá ban đầu dựa trên hạng ghế mặc định
          calculateInitialPrice(flightData);
        } else {
          throw new Error("Không tìm thấy thông tin chuyến bay");
        }
      } catch (err) {
        console.error("[DEBUG] Lỗi khi tải thông tin chuyến bay:", err);
        setError(
          err.response?.data?.error || "Không thể tải thông tin chuyến bay"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchFlightDetail();

    // Clear breadcrumb title when component unmounts
    return () => {
      setDynamicTitle("");
    };
  }, [id, setDynamicTitle]);

  // Cập nhật hàm calculateInitialPrice để tính toán giá dựa trên số lượng hành khách
  const calculateInitialPrice = (flightData) => {
    try {
      const basePrice = Number(flightData.price) || 0;
      let seatClassPrice = 0;

      if (flightData.seat_classes) {
        const seatClasses =
          typeof flightData.seat_classes === "string"
            ? JSON.parse(flightData.seat_classes)
            : flightData.seat_classes;

        if (typeof seatClasses[selectedClass] === "number") {
          seatClassPrice = seatClasses[selectedClass];
        } else if (seatClasses[selectedClass]?.price !== undefined) {
          seatClassPrice = seatClasses[selectedClass].price;
        }
      }

      // Tính tổng giá cho tất cả hành khách
      const totalPassengerPrice =
        (basePrice + seatClassPrice) * passengers.adults + // Người lớn
        (basePrice + seatClassPrice) * 0.75 * passengers.children + // Trẻ em (75% giá)
        (basePrice + seatClassPrice) * 0.25 * passengers.infants; // Em bé (25% giá)

      setTotalPrice(totalPassengerPrice);
    } catch (error) {
      console.error("[DEBUG] Lỗi khi tính giá ban đầu:", error);
      setTotalPrice(Number(flightData.price) || 0);
    }
  };

  // Cập nhật giá khi thay đổi số lượng hành khách hoặc hạng ghế
  useEffect(() => {
    if (flight) {
      calculateInitialPrice(flight);
    }
  }, [passengers, selectedClass, flight]);

  // Thêm useEffect để xử lý click outside modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        passengerModalRef.current &&
        !passengerModalRef.current.contains(event.target)
      ) {
        setShowPassengerModal(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // ✅ Improved passenger change handler với better validation
  const handlePassengerChange = (type, operation) => {
    setPassengers((prev) => {
      const newPassengers = { ...prev };

      if (operation === "add") {
        // ✅ Kiểm tra giới hạn tổng hành khách
        const totalPassengers = Object.values(newPassengers).reduce(
          (a, b) => a + b,
          0
        );
        if (totalPassengers >= 9) {
          alert("Tổng số hành khách không được vượt quá 9 người");
          return prev;
        }

        // ✅ Kiểm tra giới hạn cho từng loại
        if (type === "adults" && newPassengers.adults >= 9) {
          alert("Số người lớn không được vượt quá 9");
          return prev;
        }
        if (type === "children" && newPassengers.children >= 4) {
          alert("Số trẻ em không được vượt quá 4");
          return prev;
        }
        if (
          type === "infants" &&
          newPassengers.infants >= newPassengers.adults
        ) {
          alert(
            "Số em bé không được vượt quá số người lớn (mỗi người lớn chỉ được đi kèm 1 em bé)"
          );
          return prev;
        }

        newPassengers[type]++;
      } else if (operation === "subtract") {
        // ✅ Kiểm tra điều kiện giảm
        if (type === "adults" && newPassengers.adults <= 1) {
          alert("Phải có ít nhất 1 người lớn");
          return prev;
        }

        // ✅ Kiểm tra em bé khi giảm người lớn
        if (
          type === "adults" &&
          newPassengers.infants > newPassengers.adults - 1
        ) {
          alert("Vui lòng giảm số em bé trước khi giảm người lớn");
          return prev;
        }

        if (newPassengers[type] > 0) {
          newPassengers[type]--;
        }
      }

      return newPassengers;
    });
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

  const handleClose = () => {
    navigate("/flights");
  };

  // Helper function to create slug
  const toSlug = (str) => {
    if (!str) return "";
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[đĐ]/g, "d")
      .replace(/([^0-9a-z-\s])/g, "")
      .replace(/(\s+)/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleBooking = () => {
    const bookingInfo = {
      flightId: flight.id,
      class: selectedClass,
      passengers: passengers,
      pricing: priceDetails,
      promotion: flight.promotion,
      flight: {
        ...flight,
        // ✅ KHÔNG parse Date - dùng helper functions
        departureTime: extractTime(
          flight.departure_datetime || flight.departure_time
        ),
        arrivalTime: extractTime(
          flight.arrival_datetime || flight.arrival_time
        ),
        from: flight.from_location,
        to: flight.to_location,
        flightNumber: flight.flight_number,
        airline: flight.airline,
        airlineLogo: flight.airlineLogo,
        duration: flight.duration,
      },
    };

    // Generate slug for prettier URL
    const slug = `${toSlug(flight.from_location)}-${toSlug(
      flight.to_location
    )}-${flight.id}`;
    navigate(`/flights/${slug}/booking`, { state: bookingInfo });
  };

  // Xử lý và hiển thị các lựa chọn hạng ghế
  const SeatClassSelection = ({ flight, selectedClass, setSelectedClass }) => {
    const basePrice = Number(flight.price) || 0;
    const formatPrice = (price) => {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(price);
    };

    // Tính tổng giá vé (giá cơ bản + giá hạng ghế)
    const calculateTotalPrice = (classType) => {
      let seatClassPrice = 0;

      // Xử lý cả định dạng cũ và mới của seat_classes
      if (flight.seat_classes) {
        try {
          let seatClasses;

          if (typeof flight.seat_classes === "string") {
            seatClasses = JSON.parse(flight.seat_classes);
          } else {
            seatClasses = flight.seat_classes;
          }

          // Kiểm tra định dạng cũ (giá trị số) hoặc định dạng mới (object)
          if (typeof seatClasses[classType] === "number") {
            seatClassPrice = seatClasses[classType];
          } else if (seatClasses[classType]?.price !== undefined) {
            seatClassPrice = seatClasses[classType].price;
          }
        } catch (error) {
          console.error("[DEBUG] Lỗi khi xử lý seat_classes:", error);
        }
      }

      return basePrice + seatClassPrice;
    };

    // Lấy số ghế còn trống
    const getAvailableSeats = (classType) => {
      try {
        if (typeof flight.seat_classes === "string") {
          const seatClasses = JSON.parse(flight.seat_classes);
          if (seatClasses[classType]?.available_seats !== undefined) {
            return seatClasses[classType].available_seats;
          }
        } else if (
          flight.seat_classes?.[classType]?.available_seats !== undefined
        ) {
          return flight.seat_classes[classType].available_seats;
        }
      } catch (error) {
        console.error("[DEBUG] Lỗi khi lấy số ghế trống:", error);
      }

      return flight.seats || 0;
    };

    const classOptions = [
      {
        value: "economy",
        label: "Phổ thông",
        description: "Chỗ ngồi tiêu chuẩn, hành lý xách tay 7kg",
        price: calculateTotalPrice("economy"),
        availableSeats: getAvailableSeats("economy"),
      },
      {
        value: "premium_economy",
        label: "Phổ thông đặc biệt",
        description: "Chỗ ngồi rộng hơn, ưu tiên lên máy bay, hành lý 15kg",
        price: calculateTotalPrice("premium_economy"),
        availableSeats: getAvailableSeats("premium_economy"),
      },
      {
        value: "business",
        label: "Thương gia",
        description: "Ghế ngả 150°, bữa ăn cao cấp, hành lý 30kg",
        price: calculateTotalPrice("business"),
        availableSeats: getAvailableSeats("business"),
      },
      {
        value: "first",
        label: "Hạng nhất",
        description: "Phòng riêng, giường phẳng, dịch vụ cá nhân hóa",
        price: calculateTotalPrice("first"),
        availableSeats: getAvailableSeats("first"),
      },
    ];

    return (
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Lựa chọn hạng ghế</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {classOptions.map((option) => (
            <div
              key={option.value}
              className={`border p-4 rounded-lg cursor-pointer transition-all ${
                selectedClass === option.value
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-gray-200 hover:border-emerald-300"
              }`}
              onClick={() => setSelectedClass(option.value)}
            >
              <div className="flex justify-between">
                <div>
                  <h4 className="font-semibold">{option.label}</h4>
                  <p className="text-gray-600 text-sm">{option.description}</p>
                  <div className="mt-1 text-sm text-gray-500">
                    <span>{option.availableSeats} ghế trống</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-emerald-600 font-bold">
                    {formatPrice(option.price)}
                  </div>
                  {selectedClass === option.value && (
                    <div className="mt-2 text-emerald-600">
                      <CheckCircle size={18} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Component PassengerSelection
  const PassengerSelection = () => {
    return (
      <div className="mt-8 bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h3 className="text-xl font-semibold mb-4">Hành khách</h3>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowPassengerModal(!showPassengerModal)}
            className="w-full text-left border border-gray-300 rounded-lg p-3 pl-4 pr-10 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors shadow-sm hover:border-emerald-300 bg-white"
          >
            {`${passengers.adults} người lớn, ${passengers.children} trẻ em, ${passengers.infants} em bé`}
          </button>
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-emerald-600 bg-emerald-50 p-1 rounded-full">
            <Users size={18} />
          </div>
        </div>

        {showPassengerModal && (
          <div
            ref={passengerModalRef}
            className="absolute z-50 mt-2 w-1/2 bg-white rounded-lg shadow-xl border border-gray-200 p-5 animate-fade-in"
          >
            {/* Adults */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="font-medium text-gray-800">Người lớn</p>
                <p className="text-sm text-gray-500">
                  &gt; 12 tuổi (100% giá vé)
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handlePassengerChange("adults", "subtract")}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={passengers.adults <= 1}
                >
                  <span className="text-gray-600 font-bold">-</span>
                </button>
                <span className="w-8 text-center font-medium">
                  {passengers.adults}
                </span>
                <button
                  type="button"
                  onClick={() => handlePassengerChange("adults", "add")}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
                >
                  <span className="text-emerald-600 font-bold">+</span>
                </button>
              </div>
            </div>

            {/* Children */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="font-medium text-gray-800">Trẻ em</p>
                <p className="text-sm text-gray-500">2-12 tuổi (75% giá vé)</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handlePassengerChange("children", "subtract")}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <span className="text-gray-600 font-bold">-</span>
                </button>
                <span className="w-8 text-center font-medium">
                  {passengers.children}
                </span>
                <button
                  type="button"
                  onClick={() => handlePassengerChange("children", "add")}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
                >
                  <span className="text-emerald-600 font-bold">+</span>
                </button>
              </div>
            </div>

            {/* Infants */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="font-medium text-gray-800">Em bé</p>
                <p className="text-sm text-gray-500">
                  &lt; 2 tuổi (25% giá vé)
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handlePassengerChange("infants", "subtract")}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <span className="text-gray-600 font-bold">-</span>
                </button>
                <span className="w-8 text-center font-medium">
                  {passengers.infants}
                </span>
                <button
                  type="button"
                  onClick={() => handlePassengerChange("infants", "add")}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
                >
                  <span className="text-emerald-600 font-bold">+</span>
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowPassengerModal(false)}
                className="w-full bg-emerald-100 text-emerald-700 font-medium py-2 rounded-lg hover:bg-emerald-200 transition-colors"
              >
                Xác nhận
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ✅ Improved pricing calculation với proper error handling
  const calculatePrices = () => {
    if (!flight) return;

    try {
      // ✅ Chuyển đổi và làm tròn giá vé cơ bản và phụ thu
      const basePrice = Math.round(Number(flight.price) || 0);

      // ✅ Safe access to seat_classes
      let seatClassData = flight.seat_classes;
      if (typeof seatClassData === "string") {
        try {
          seatClassData = JSON.parse(seatClassData);
        } catch (e) {
          console.error("[ERROR] Failed to parse seat_classes:", e);
          seatClassData = {};
        }
      }

      const seatClassSurcharge = Math.round(
        Number(seatClassData[selectedClass]?.price || 0)
      );

      // ✅ Tính giá cho người lớn (giá cơ bản + phụ thu hạng ghế)
      const adultBasePrice = basePrice * passengers.adults;
      const adultSurcharge = seatClassSurcharge * passengers.adults;
      const adultTotal = adultBasePrice + adultSurcharge;

      // ✅ Tính giá cho trẻ em (75% giá cơ bản + 75% phụ thu hạng ghế)
      const childBasePrice = Math.round(basePrice * 0.75 * passengers.children);
      const childSurcharge = Math.round(
        seatClassSurcharge * 0.75 * passengers.children
      );
      const childTotal = childBasePrice + childSurcharge;

      // ✅ Tính giá cho em bé (MIỄN PHÍ - dưới 2 tuổi)
      const infantTotal = 0; // Em bé miễn phí vé

      // ✅ Tính tổng giá trước thuế
      const beforeTax = adultTotal + childTotal + infantTotal;
      setTotalBeforeTax(beforeTax);

      // ✅ Tính thuế (5%)
      const taxAmount = Math.round(beforeTax * 0.05);
      setTax(taxAmount);

      // ✅ Tính tổng sau thuế
      const afterTax = beforeTax + taxAmount;
      setTotalAfterTax(afterTax);

      // ✅ Tính khuyến mãi với proper validation
      let discount = 0;
      if (flight.promotion && flight.promotion.status === "active") {
        const currentDate = new Date();
        // ✅ Parse promotion.end_date safely (backend trả về string YYYY-MM-DD)
        const [year, month, day] = (flight.promotion.end_date || "").split("-");
        const endDate = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day)
        );

        // Check if promotion is still valid
        if (endDate >= currentDate) {
          if (flight.promotion.type === "percentage") {
            const discountPercent = Number(flight.promotion.discount) || 0;
            discount = Math.round(afterTax * (discountPercent / 100));
          } else {
            discount = Math.round(Number(flight.promotion.discount) || 0);
          }
        }
      }
      setDiscountAmount(discount);

      // ✅ Tính tổng cuối cùng
      const total = Math.max(0, afterTax - discount); // Ensure non-negative
      setFinalTotal(total);

      // ✅ Cập nhật state priceDetails
      setPriceDetails({
        basePrice,
        seatClassSurcharge,
        adultTotal,
        childTotal,
        infantTotal,
        totalBeforeTax: beforeTax,
        tax: taxAmount,
        totalAfterTax: afterTax,
        discountAmount: discount,
        finalTotal: total,
      });
    } catch (error) {
      console.error("[ERROR] Error calculating prices:", error);
      // Set default values on error
      setPriceDetails({
        basePrice: 0,
        seatClassSurcharge: 0,
        adultTotal: 0,
        childTotal: 0,
        infantTotal: 0,
        totalBeforeTax: 0,
        tax: 0,
        totalAfterTax: 0,
        discountAmount: 0,
        finalTotal: 0,
      });
    }
  };

  // Theo dõi thay đổi hạng ghế và số lượng hành khách
  useEffect(() => {
    calculatePrices();
  }, [selectedClass, passengers, flight]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-gray-600">Đang tải thông tin chuyến bay...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Có lỗi xảy ra
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-emerald-600"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold">Chi tiết chuyến bay</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <FlightDetail flight={flight} />
              <PassengerSelection />
              <SeatClassSelection
                flight={flight}
                selectedClass={selectedClass}
                setSelectedClass={setSelectedClass}
              />
            </div>
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-28">
              <h3 className="text-xl font-semibold mb-4">Tóm tắt đặt vé</h3>
              <div className="space-y-4">
                {/* Thông tin chuyến bay */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hãng hàng không</span>
                    <div className="flex items-center gap-2">
                      <img
                        src={flight.airlineLogo}
                        alt={flight.airline}
                        className="h-5 w-5 object-contain"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `${API_HOST}/images/placeholder.png`;
                        }}
                      />
                      <span className="font-medium">{flight.airline}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mã chuyến bay</span>
                    <span className="font-medium">{flight.flight_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Từ</span>
                    <span className="font-medium">{flight.from_location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Đến</span>
                    <span className="font-medium">{flight.to_location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ngày bay</span>
                    <span className="font-medium">
                      {formatDateLong(flight.flight_date) || "Chưa xác định"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Giờ bay</span>
                    <div className="text-right">
                      <span className="font-medium">
                        {extractTime(
                          flight.departure_datetime || flight.departure_time
                        )}
                      </span>
                      <span className="text-gray-400 mx-2">→</span>
                      <span className="font-medium">
                        {extractTime(
                          flight.arrival_datetime || flight.arrival_time
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Thời gian bay</span>
                    <span className="font-medium">
                      {formatDuration(flight.duration)}
                    </span>
                  </div>
                </div>

                {/* Thông tin hành khách và hạng ghế */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hạng ghế</span>
                      <span className="font-medium">
                        {selectedClass === "economy"
                          ? "Phổ thông"
                          : selectedClass === "premium_economy"
                          ? "Phổ thông đặc biệt"
                          : selectedClass === "business"
                          ? "Thương gia"
                          : "Hạng nhất"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Số hành khách</span>
                      <div className="text-right">
                        {passengers.adults > 0 && (
                          <p className="font-medium">
                            x {passengers.adults} người lớn
                          </p>
                        )}
                        {passengers.children > 0 && (
                          <p className="font-medium">
                            x {passengers.children} trẻ em
                          </p>
                        )}
                        {passengers.infants > 0 && (
                          <p className="font-medium">
                            x {passengers.infants} em bé
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chi tiết giá vé */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-medium mb-3">Chi tiết giá vé</h4>
                  <div className="space-y-2">
                    {/* Giá vé cơ bản */}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Giá vé cơ bản</span>
                      <span>{formatPrice(flight.price)}</span>
                    </div>
                    {/* Phụ thu hạng ghế */}
                    {flight.seat_classes[selectedClass]?.price > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phụ thu hạng ghế</span>
                        <span>
                          {formatPrice(
                            flight.seat_classes[selectedClass].price
                          )}
                        </span>
                      </div>
                    )}

                    {/* Chi tiết giá theo hành khách */}
                    {/* Người lớn */}
                    {passengers.adults > 0 && (
                      <div className="flex justify-between">
                        <div>
                          <span className="text-gray-600">Người lớn</span>
                          <span className="text-gray-400 text-sm ml-1">
                            x{passengers.adults}
                          </span>
                        </div>
                        <span className="font-medium">
                          {formatPrice(
                            (flight.price +
                              (flight.seat_classes[selectedClass]?.price ||
                                0)) *
                              passengers.adults
                          )}
                        </span>
                      </div>
                    )}
                    {/* Trẻ em */}
                    {passengers.children > 0 && (
                      <div className="flex justify-between">
                        <div>
                          <span className="text-gray-600">Trẻ em</span>
                          <span className="text-gray-400 text-sm ml-1">
                            x{passengers.children}
                          </span>
                          <span className="text-gray-400 text-xs ml-1">
                            (75%)
                          </span>
                        </div>
                        <span className="font-medium">
                          {formatPrice(
                            (flight.price +
                              (flight.seat_classes[selectedClass]?.price ||
                                0)) *
                              0.75 *
                              passengers.children
                          )}
                        </span>
                      </div>
                    )}
                    {/* Em bé */}
                    {passengers.infants > 0 && (
                      <div className="flex justify-between">
                        <div>
                          <span className="text-gray-600">Em bé</span>
                          <span className="text-gray-400 text-sm ml-1">
                            x{passengers.infants}
                          </span>
                          <span className="text-gray-400 text-xs ml-1">
                            (25%)
                          </span>
                        </div>
                        <span className="font-medium">
                          {formatPrice(
                            (flight.price +
                              (flight.seat_classes[selectedClass]?.price ||
                                0)) *
                              0.25 *
                              passengers.infants
                          )}
                        </span>
                      </div>
                    )}

                    {/* Tổng giá trước thuế */}
                    <div className="flex justify-between font-medium pt-2 border-t border-dashed border-gray-200">
                      <span>Tổng giá trước thuế</span>
                      <span>{formatPrice(totalBeforeTax)}</span>
                    </div>

                    {/* Thuế và phí */}
                    <div className="flex justify-between text-gray-600">
                      <span>Thuế và phí (5%)</span>
                      <span>{formatPrice(tax)}</span>
                    </div>

                    {/* Tổng sau thuế */}
                    <div className="flex justify-between font-medium pt-2 border-t border-dashed border-gray-200">
                      <span>Tổng sau thuế</span>
                      <span>{formatPrice(totalAfterTax)}</span>
                    </div>
                  </div>
                </div>

                {/* Khuyến mãi nếu có */}
                {flight.promotion && (
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between text-orange-500">
                      <span>Khuyến mãi</span>
                      <span>-{formatPrice(discountAmount)}</span>
                    </div>
                    <div className="mt-2 p-3 bg-orange-50 rounded-lg text-sm">
                      <p className="text-orange-600 font-medium flex justify-between">
                        {flight.promotion.title}{" "}
                        <span className="bg-orange-200 text-orange-700 px-2 py-0.5 rounded-full text-xs ml-1">
                          {flight.promotion.type === "percentage"
                            ? `-${flight.promotion.discount}%`
                            : `-${formatPrice(flight.promotion.discount)}`}
                        </span>
                      </p>
                      <p className="text-gray-600 text-xs mt-1">
                        Thời hạn:{" "}
                        {formatDateDDMMYYYY(flight.promotion.end_date)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Tổng cộng */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Tổng cộng</span>
                    <span className="text-emerald-600">
                      {formatPrice(finalTotal)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Đã bao gồm thuế và phí
                  </p>
                </div>

                {/* Nút đặt vé */}
                <button
                  onClick={handleBooking}
                  className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                >
                  <CreditCard size={20} />
                  Tiếp tục đặt vé
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightDetailPage;
