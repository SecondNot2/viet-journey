// index.js hotels

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL, API_HOST } from "../../../config/api";
import {
  Star,
  MapPin,
  Wifi,
  Car,
  Waves,
  Utensils,
  Filter,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  X,
  DollarSign,
  Hotel,
  Tag,
  Users,
  Search,
  Loader,
  Calendar,
  Coffee,
  Dumbbell,
  HeartPulse,
  Bath,
  Snowflake,
  Wind,
  Tv,
} from "lucide-react";

const PLACEHOLDER_IMAGE = `${API_URL}/images/placeholder.jpg`;

const ratingOptions = [
  { value: "", label: "Tất cả" },
  { value: 5, label: "5 sao" },
  { value: 4, label: "Từ 4 sao" },
  { value: 3, label: "Từ 3 sao" },
  { value: 2, label: "Từ 2 sao" },
  { value: 1, label: "Từ 1 sao" },
];
const sortOptions = [
  { value: "", label: "Mặc định" },
  { value: "price", label: "Giá thấp đến cao" },
  { value: "price_desc", label: "Giá cao đến thấp" },
  { value: "rating", label: "Đánh giá cao nhất" },
  { value: "rating_desc", label: "Đánh giá thấp nhất" },
  { value: "name", label: "Tên A-Z" },
  { value: "name_desc", label: "Tên Z-A" },
];
const hotelAmenityOptions = [
  { value: "wifi", label: "Wifi", icon: <Wifi size={14} className="mr-1" /> },
  {
    value: "parking",
    label: "Bãi đỗ xe",
    icon: <Car size={14} className="mr-1" />,
  },
  {
    value: "restaurant",
    label: "Nhà hàng",
    icon: <Utensils size={14} className="mr-1" />,
  },
  {
    value: "pool",
    label: "Hồ bơi",
    icon: <Waves size={14} className="mr-1" />,
  },
  {
    value: "gym",
    label: "Phòng gym",
    icon: <Dumbbell size={14} className="mr-1" />,
  },
  {
    value: "spa",
    label: "Spa",
    icon: <HeartPulse size={14} className="mr-1" />,
  },
];
const roomAmenityOptions = [
  { value: "tv", label: "TV", icon: <Tv size={14} className="mr-1" /> },
  {
    value: "air_conditioner",
    label: "Máy lạnh",
    icon: <Snowflake size={14} className="mr-1" />,
  },
  {
    value: "bath",
    label: "Bồn tắm",
    icon: <Bath size={14} className="mr-1" />,
  },
  {
    value: "heater",
    label: "Máy sưởi",
    icon: <Wind size={14} className="mr-1" />,
  },
  {
    value: "coffee",
    label: "Máy pha cà phê",
    icon: <Coffee size={14} className="mr-1" />,
  },
];
const roomTypeOptions = [
  { value: "single", label: "Phòng đơn" },
  { value: "double", label: "Phòng đôi" },
  { value: "twin", label: "Phòng 2 giường đơn" },
  { value: "triple", label: "Phòng 3 người" },
  { value: "suite", label: "Phòng Suite" },
  { value: "family", label: "Phòng gia đình" },
];

// Định nghĩa hàm getAmenityIcon trước khi sử dụng trong các component khác
const getAmenityIcon = (amenity) => {
  const amenityLower = amenity.toLowerCase();
  switch (amenityLower) {
    case "wifi":
    case "wifi miễn phí":
      return <Wifi size={14} />;
    case "parking":
    case "bãi đỗ xe":
      return <Car size={14} />;
    case "restaurant":
    case "nhà hàng":
      return <Utensils size={14} />;
    case "pool":
    case "hồ bơi":
      return <Waves size={14} />;
    case "gym":
    case "phòng gym":
      return <Dumbbell size={14} />;
    case "spa":
    case "massage":
      return <HeartPulse size={14} />;
    case "tv":
    case "tivi":
      return <Tv size={14} />;
    case "bath":
    case "bồn tắm":
      return <Bath size={14} />;
    case "air conditioner":
    case "máy lạnh":
      return <Snowflake size={14} />;
    case "máy sưởi":
    case "heater":
      return <Wind size={14} />;
    default:
      return <Hotel size={14} />;
  }
};

// Component hiển thị tiện nghi của khách sạn
const HotelAmenities = ({ amenities, className = "" }) => {
  // Lấy tối đa 3 tiện nghi để hiển thị
  const displayAmenities = (amenities || []).slice(0, 3);

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {displayAmenities.map((amenity, index) => (
        <div
          key={index}
          className="flex items-center text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-full transition-colors duration-200"
        >
          {getAmenityIcon(amenity)}
          <span>{amenity}</span>
        </div>
      ))}
      {(amenities || []).length > 3 && (
        <div className="text-xs text-gray-500 flex items-center">
          +{amenities.length - 3} tiện ích khác
        </div>
      )}
    </div>
  );
};

// Component tùy chỉnh hiển thị hotel tag
const HotelTypeTag = ({ hotel }) => {
  // Xác định loại khách sạn dựa vào số sao
  const getHotelType = (hotel) => {
    if (hotel.rating >= 4.5) return "Khách sạn 5 sao";
    if (hotel.rating >= 3.5) return "Khách sạn 4 sao";
    if (hotel.rating >= 2.5) return "Khách sạn 3 sao";
    if (hotel.rating >= 1.5) return "Khách sạn 2 sao";
    return "Khách sạn";
  };

  return (
    <span className="text-xs uppercase px-2 py-1 rounded-full font-bold bg-blue-50 text-blue-700 shadow-sm transition-all duration-300 hover:shadow-md">
      <Hotel className="w-3 h-3 mr-1 inline" />
      {getHotelType(hotel)}
    </span>
  );
};

// Hiển thị tag khuyến mãi (giả)
const PromotionTag = ({ discount = 10 }) => {
  return (
    <div className="absolute top-0 left-0 z-10">
      <div className="bg-red-600 text-white rounded-br-lg font-medium overflow-hidden shadow-lg animate-pulse-slow">
        <div className="px-3 py-1 flex items-center">
          <Tag className="w-3 h-3 mr-1" />-{discount}%
        </div>
      </div>
    </div>
  );
};

// Cập nhật giá trị DEFAULT_VALUES
const DEFAULT_VALUES = {
  location: "", // Bỏ giá trị mặc định Nha Trang
  check_in: (() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  })(),
  check_out: (() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  })(),
  guests: { adults: 2, children: 0 },
  rooms: 1,
  min_price: 0,
  max_price: 10000000,
};

// Hàm tính giá sau khuyến mãi
const calculateDiscountedPrice = (originalPrice, promotion) => {
  if (!promotion) return originalPrice;

  if (promotion.type === "percentage") {
    return Math.round(originalPrice * (1 - promotion.discount / 100));
  } else {
    return Math.max(0, originalPrice - promotion.discount);
  }
};

// Hàm tính số ngày còn lại
const getDaysRemaining = (endDate) => {
  if (!endDate) return null;
  const daysRemaining = Math.ceil(
    (new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24)
  );
  return daysRemaining > 0 ? daysRemaining : 0;
};

const HotelSearch = () => {
  const navigate = useNavigate();

  // Read URL search params on mount
  const urlParams = new URLSearchParams(window.location.search);
  const initialLocation = urlParams.get("search") || "";

  const [filters, setFilters] = useState({
    location: initialLocation, // Set vào ô location để kích hoạt realtime filter
    city: "", // Thành phố cụ thể
    min_price: DEFAULT_VALUES.min_price,
    max_price: DEFAULT_VALUES.max_price,
    rating: "",
    hotel_amenities: [],
    room_amenities: [],
    room_types: [],
    sort_by: "",
    page: 1,
    limit: 10,
    keyword: "",
  });
  const [hotels, setHotels] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    total_pages: 1,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [collapse, setCollapse] = useState({
    amenities: false,
    room_amenities: false,
    room_types: false,
    price: false,
    rating: false,
  });
  const resultsContainerRef = useRef(null);
  // Thêm state để theo dõi trạng thái tìm kiếm
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  // Thêm state suggestions
  const [suggestions, setSuggestions] = useState({ from: [], to: [] });
  // Gợi ý địa điểm
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [loadingLocationSuggest, setLoadingLocationSuggest] = useState(false);
  const [showLocationSuggest, setShowLocationSuggest] = useState(false);
  // Thêm state cho ngày nhận/trả phòng, khách/phòng, modal filter nâng cao
  const [checkIn, setCheckIn] = useState(DEFAULT_VALUES.check_in);
  const [checkOut, setCheckOut] = useState(DEFAULT_VALUES.check_out);
  const [guests, setGuests] = useState(DEFAULT_VALUES.guests);
  const [rooms, setRooms] = useState(DEFAULT_VALUES.rooms);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  // Hàm xử lý realtime filter cho sidebar (lọc phòng)
  const [roomFilters, setRoomFilters] = useState({
    amenities: [],
    min_price: "",
    max_price: "",
  });
  const guestModalRef = useRef(null);
  const advancedFilterRef = useRef(null);
  const [searchParams, setSearchParams] = useState({
    location: "", // Bỏ giá trị mặc định
    check_in: DEFAULT_VALUES.check_in,
    check_out: DEFAULT_VALUES.check_out,
    guests: DEFAULT_VALUES.guests,
    rooms: DEFAULT_VALUES.rooms,
  });

  // Hàm cuộn đến kết quả tìm kiếm
  const scrollToResults = () => {
    if (resultsContainerRef.current) {
      setTimeout(() => {
        resultsContainerRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 200);
    } else {
      console.warn("[DEBUG] Không tìm thấy ref của phần kết quả để cuộn");
    }
  };

  // Cập nhật hàm fetchHotels
  const fetchHotels = async (customParams = null) => {
    setLoading(true);
    setError(null);
    try {
      const params = customParams || {
        ...filters,
        hotel_amenities: filters.hotel_amenities.join(","),
        room_amenities: filters.room_amenities.join(","),
        room_types: filters.room_types.join(","),
        check_in: checkIn,
        check_out: checkOut,
        guests: guests.adults + guests.children,
        rooms,
      };

      // Thêm location nếu đang trong chế độ tìm kiếm
      if (hasSearched && searchParams.location && !customParams) {
        params.location = searchParams.location;
      }

      console.debug("[DEBUG] Gọi API với params:", params);
      const res = await axios.get(`${API_URL}/hotels`, { params });
      console.debug("[DEBUG] Kết quả API /api/hotels:", res.data);

      if (res.data && res.data.hotels) {
        setHotels(res.data.hotels);
        setPagination(
          res.data.pagination || { page: 1, total_pages: 1, total: 0 }
        );
      } else {
        setHotels([]);
        setError("Không tìm thấy khách sạn phù hợp.");
      }
    } catch (err) {
      console.error("[DEBUG] Lỗi khi tải danh sách hotels:", err);
      setError("Có lỗi xảy ra khi tải danh sách khách sạn");
      setHotels([]);
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật useEffect cho việc load dữ liệu ban đầu
  useEffect(() => {
    fetchHotels(); // Load tất cả khách sạn khi component mount

    // Nếu có location từ URL param, trigger search
    if (filters.location) {
      setHasSearched(true);
      setSearchPerformed(true);
    }
  }, []);

  // Cập nhật useEffect cho việc theo dõi thay đổi filters
  // ⚠️ QUAN TRỌNG: List TẤT CẢ filters có thể thay đổi
  useEffect(() => {
    const shouldFetch =
      hasSearched || filters.page !== 1 || filters.sort_by !== "";
    if (shouldFetch) {
      fetchHotels();
    }
  }, [
    filters.page,
    filters.sort_by,
    filters.min_price,
    filters.max_price,
    filters.rating,
    filters.hotel_amenities.join(","), // Convert array to string to avoid object comparison
    filters.room_amenities.join(","),
    filters.room_types.join(","),
    filters.location,
  ]);

  // Gợi ý địa điểm và tên khách sạn (autocomplete)
  const fetchLocationSuggestions = async (q) => {
    setLoadingLocationSuggest(true);
    try {
      const res = await axios.get(`${API_URL}/hotels/locations/suggest`, {
        params: { q },
      });

      // API trả về danh sách suggestions với type, value, display
      const suggestions = res.data.suggestions || [];
      setLocationSuggestions(suggestions);
      setShowLocationSuggest(suggestions.length > 0);
      console.debug("[DEBUG] Gợi ý tìm kiếm:", suggestions);
    } catch (err) {
      setLocationSuggestions([]);
      setShowLocationSuggest(false);
      console.error("[DEBUG] Lỗi gợi ý:", err);
    } finally {
      setLoadingLocationSuggest(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value, page: 1 }));
    if (field === "location") {
      if (value && value.trim() !== "") {
        fetchLocationSuggestions(value);
      } else {
        setLocationSuggestions([]);
        setShowLocationSuggest(false);
      }
    }
  };

  const handleLocationSelect = (suggestion) => {
    // Chọn value (có thể là tên khách sạn hoặc địa điểm)
    setFilters((prev) => ({ ...prev, location: suggestion.value, page: 1 }));
    setLocationSuggestions([]);
    setShowLocationSuggest(false);
    console.debug("[DEBUG] Đã chọn gợi ý:", suggestion);
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value, page: 1 }));
  };

  const handleAmenityChange = (amenity) => {
    setFilters((prev) => {
      const exists = prev.hotel_amenities.includes(amenity);
      return {
        ...prev,
        hotel_amenities: exists
          ? prev.hotel_amenities.filter((a) => a !== amenity)
          : [...prev.hotel_amenities, amenity],
        page: 1,
      };
    });
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
    setTimeout(() => {
      if (resultsContainerRef.current) {
        resultsContainerRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  const resetFilters = () => {
    setFilters({
      location: "",
      city: "",
      min_price: DEFAULT_VALUES.min_price,
      max_price: DEFAULT_VALUES.max_price,
      rating: "",
      hotel_amenities: [],
      room_amenities: [],
      room_types: [],
      sort_by: "",
      page: 1,
      limit: 10,
      keyword: "",
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(price);
  };

  // ✅ Date formatting helper - format YYYY-MM-DD string to DD/MM/YYYY for display
  const formatDateDisplay = (dateString) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  };

  const handleSelectHotel = (hotelId) => {
    try {
      console.log(
        "[DEBUG] Bắt đầu chuyển hướng đến chi tiết khách sạn:",
        hotelId
      );

      // Chuẩn bị thông tin đặt phòng để truyền qua
      const bookingInfo = {
        checkIn: checkIn,
        checkOut: checkOut,
        guests: guests,
        rooms: rooms,
      };

      // Chuyển hướng với state chứa thông tin đặt phòng
      navigate(`/hotels/${hotelId}`, {
        state: { bookingInfo },
        replace: false, // Đảm bảo có thể quay lại trang trước đó
      });
    } catch (error) {
      console.error("[DEBUG] Lỗi khi chuyển hướng:", error);
    }
  };

  // Xử lý click outside cho modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        guestModalRef.current &&
        !guestModalRef.current.contains(event.target)
      ) {
        setShowGuestModal(false);
      }
      if (
        advancedFilterRef.current &&
        !advancedFilterRef.current.contains(event.target)
      ) {
        setShowAdvancedFilter(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Xử lý thay đổi số khách/phòng
  const handleGuestChange = (type, operation) => {
    if (type === "rooms") {
      const newRooms = operation === "add" ? rooms + 1 : Math.max(1, rooms - 1);
      setRooms(newRooms);
      // Đảm bảo số người lớn >= số phòng
      if (guests.adults < newRooms) {
        setGuests((prev) => ({ ...prev, adults: newRooms }));
      }
    } else {
      setGuests((prev) => ({
        ...prev,
        [type]:
          operation === "add"
            ? prev[type] + 1
            : Math.max(type === "adults" ? rooms : 0, prev[type] - 1),
      }));
    }
  };

  // Format ngày
  const formatDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Cập nhật hàm handleSearch với validation tốt hơn
  const handleSearch = async (e) => {
    if (e) e.preventDefault();

    try {
      setSuggestions({ from: [], to: [] });
      setLoading(true);
      setError(null);

      // Validate các trường input
      if (!filters.location || filters.location.trim() === "") {
        setError("Vui lòng nhập địa điểm hoặc tên khách sạn");
        setLoading(false);
        return;
      }

      // Validate check-in/check-out dates
      if (checkIn && checkOut) {
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);

        if (checkOutDate <= checkInDate) {
          setError("Ngày trả phòng phải sau ngày nhận phòng");
          setLoading(false);
          return;
        }
      }

      // Reset trang về 1 khi tìm kiếm mới
      setFilters((prev) => ({
        ...prev,
        page: 1,
      }));

      // Đánh dấu đã thực hiện tìm kiếm
      setHasSearched(true);
      setSearchPerformed(true);

      // Gọi fetchHotels với tham số tìm kiếm
      await fetchHotels();

      // Cuộn đến kết quả
      setTimeout(() => {
        scrollToResults();
      }, 100);
    } catch (error) {
      console.error("[DEBUG] Lỗi khi tìm kiếm khách sạn:", error);
      setHotels([]);
      setError("Đã xảy ra lỗi. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật hàm resetSearchAndFilters
  const resetSearchAndFilters = () => {
    // Reset searchParams về rỗng
    setSearchParams({
      location: "",
      check_in: DEFAULT_VALUES.check_in,
      check_out: DEFAULT_VALUES.check_out,
      guests: DEFAULT_VALUES.guests,
      rooms: DEFAULT_VALUES.rooms,
    });

    // Đặt lại bộ lọc
    setFilters({
      location: "",
      city: "",
      min_price: DEFAULT_VALUES.min_price,
      max_price: DEFAULT_VALUES.max_price,
      rating: "",
      hotel_amenities: [],
      room_amenities: [],
      room_types: [],
      sort_by: "",
      page: 1,
      limit: 10,
      keyword: "",
    });

    // Reset lại trạng thái tìm kiếm
    setHasSearched(false);
    setSearchPerformed(false);

    // Tải lại tất cả hotels
    fetchHotels();
  };

  // Cập nhật hàm handleFilterChangeRealtime
  const handleFilterChangeRealtime = (field, value) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [field]: value };
      // Gọi fetchHotels với filters mới ngay lập tức
      fetchHotels({
        ...newFilters,
        hotel_amenities: newFilters.hotel_amenities.join(","),
        room_amenities: newFilters.room_amenities.join(","),
        room_types: newFilters.room_types.join(","),
        check_in: checkIn,
        check_out: checkOut,
        guests: guests.adults + guests.children,
        rooms,
        location: searchParams.location,
      });
      return newFilters;
    });
  };

  // Cập nhật các hàm xử lý filter
  const handlePriceRangeChange = (value) => {
    handleFilterChangeRealtime("max_price", value);
  };

  const handleRatingChange = (value) => {
    handleFilterChangeRealtime("rating", value);
  };

  const handleSortChange = (value) => {
    handleFilterChangeRealtime("sort_by", value);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* CSS cho các style tùy chỉnh */}
      <style>
        {`
          /* Custom styling for date inputs */
          .date-input-custom::-webkit-calendar-picker-indicator {
            opacity: 0;
            position: absolute;
            top: 0;
            right: 0;
            width: 100%;
            height: 100%;
            cursor: pointer;
          }

          /* Animation for fade in */
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fadeIn 0.2s ease-out forwards;
          }
          
          /* Card hover effect */
          .hotel-card {
            transition: all 0.3s ease;
          }
          .hotel-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          }

          /* Promo hotel card đặc biệt */
          .promo-hotel-card {
            box-shadow: 0 8px 32px -8px #fb923c99, 0 2px 8px -2px #fb923c33;
            border-radius: 1.2rem;
            border-width: 2px;
            border-color: #fb923c;
            background: linear-gradient(90deg, #fff7ed 60%, #ffedd5 100%);
            position: relative;
          }
          .promo-hotel-card:hover {
            box-shadow: 0 16px 40px -8px #fb923cbb, 0 4px 16px -2px #fb923c44;
            background: linear-gradient(90deg, #fff7ed 40%, #ffedd5 100%);
          }

          /* Custom scrollbar */
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #10b981;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #059669;
          }

          /* Sidebar styles */
          .sidebar-filter { min-width: 270px; max-width: 320px; }
          @media (max-width: 1023px) { .sidebar-filter { display: none; } }
          .sidebar-section { border-bottom: 1px solid #f1f5f9; }
          .sidebar-section:last-child { border-bottom: none; }
          .sidebar-toggle { cursor: pointer; }
        `}
      </style>

      {/* Hero Section */}
      <div className="relative bg-emerald-600 text-white py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-emerald-700 opacity-90"></div>
        <div
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage: "url('/assets/img/hero-bg.jpg')" }}
        ></div>
        <div className="container mx-auto px-4 relative z-10">
          <h1 className="text-4xl font-bold mb-4">Đặt Phòng Khách Sạn</h1>
          <p className="text-emerald-100 text-lg max-w-2xl">
            Tìm và đặt phòng khách sạn với giá tốt nhất cho chuyến đi của bạn.
          </p>
        </div>
      </div>

      {/* Search Form */}
      <div className="container mx-auto px-4 -mt-8 relative z-20">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchHotels();
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 mb-4">
              {/* Địa điểm/Tên khách sạn */}
              <div className="relative col-span-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Địa điểm hoặc tên khách sạn
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={filters.location}
                    onChange={(e) =>
                      handleInputChange("location", e.target.value)
                    }
                    onFocus={() => {
                      if (filters.location && filters.location.trim() !== "") {
                        fetchLocationSuggestions(filters.location);
                      }
                    }}
                    onBlur={() =>
                      setTimeout(() => setShowLocationSuggest(false), 200)
                    }
                    className="w-full border border-gray-300 rounded-lg p-3 pl-4 pr-10 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors shadow-sm hover:border-emerald-300"
                    placeholder="Nhập thành phố, địa điểm hoặc tên khách sạn..."
                    autoComplete="off"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-emerald-600 bg-emerald-50 p-1 rounded-full">
                    <MapPin size={18} />
                  </div>
                  {/* Gợi ý địa điểm và khách sạn */}
                  {showLocationSuggest && locationSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto divide-y divide-gray-100 animate-fade-in">
                      {locationSuggestions.map((suggestion, index) => (
                        <div
                          key={`${suggestion.type}_${suggestion.value}_${index}`}
                          className="px-4 py-3 hover:bg-emerald-50 cursor-pointer transition-colors flex items-center gap-3"
                          onClick={() => handleLocationSelect(suggestion)}
                        >
                          {suggestion.type === "hotel" ? (
                            <>
                              <Hotel
                                size={18}
                                className="text-blue-600 flex-shrink-0"
                              />
                              <div className="flex-1">
                                <div className="font-medium text-gray-800">
                                  {suggestion.display}
                                </div>
                                {suggestion.location && (
                                  <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                    <MapPin size={12} />
                                    {suggestion.location}
                                  </div>
                                )}
                              </div>
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                Khách sạn
                              </span>
                            </>
                          ) : (
                            <>
                              <MapPin
                                size={18}
                                className="text-emerald-500 flex-shrink-0"
                              />
                              <div className="flex-1">
                                <span className="font-medium text-gray-800">
                                  {suggestion.display}
                                </span>
                              </div>
                              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                                Địa điểm
                              </span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Ngày nhận phòng */}
              <div className="relative col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày nhận phòng
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={checkIn}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => {
                      setCheckIn(e.target.value);
                      // Nếu ngày trả phòng < ngày nhận phòng, cập nhật ngày trả phòng
                      if (checkOut && e.target.value >= checkOut) {
                        const nextDay = new Date(e.target.value);
                        nextDay.setDate(nextDay.getDate() + 1);
                        setCheckOut(nextDay.toISOString().split("T")[0]);
                      }
                    }}
                    className="w-full border border-gray-300 rounded-lg p-3 pl-4 pr-10 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors shadow-sm hover:border-emerald-300 date-input-custom"
                    required
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-emerald-600 bg-emerald-50 p-1 rounded-full pointer-events-none">
                    <Calendar size={18} />
                  </div>
                </div>
              </div>

              {/* Ngày trả phòng */}
              <div className="relative col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày trả phòng
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={checkOut}
                    min={checkIn || new Date().toISOString().split("T")[0]}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 pl-4 pr-10 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors shadow-sm hover:border-emerald-300 date-input-custom"
                    required
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-emerald-600 bg-emerald-50 p-1 rounded-full pointer-events-none">
                    <Calendar size={18} />
                  </div>
                </div>
              </div>

              {/* Khách & Phòng */}
              <div className="relative col-span-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Khách & Phòng
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowGuestModal(!showGuestModal)}
                    className="w-full text-left border border-gray-300 rounded-lg p-3 pl-4 pr-10 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors shadow-sm hover:border-emerald-300 bg-white"
                  >
                    {`${guests.adults + guests.children} khách, ${rooms} phòng`}
                  </button>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-emerald-600 bg-emerald-50 p-1 rounded-full">
                    <Users size={18} />
                  </div>

                  {/* Modal Khách & Phòng */}
                  {showGuestModal && (
                    <div
                      ref={guestModalRef}
                      className="absolute z-50 mt-2 w-full bg-white rounded-lg shadow-xl border border-gray-200 p-5 animate-fade-in"
                    >
                      {/* Số phòng */}
                      <div className="flex items-center justify-between mb-5">
                        <div>
                          <p className="font-medium text-gray-800">Phòng</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              handleGuestChange("rooms", "subtract")
                            }
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={rooms <= 1}
                          >
                            <span className="text-gray-600 font-bold">-</span>
                          </button>
                          <span className="w-8 text-center font-medium">
                            {rooms}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleGuestChange("rooms", "add")}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
                          >
                            <span className="text-emerald-600 font-bold">
                              +
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Người lớn */}
                      <div className="flex items-center justify-between mb-5">
                        <div>
                          <p className="font-medium text-gray-800">Người lớn</p>
                          <p className="text-sm text-gray-500">
                            Từ 13 tuổi trở lên
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              handleGuestChange("adults", "subtract")
                            }
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={guests.adults <= rooms}
                          >
                            <span className="text-gray-600 font-bold">-</span>
                          </button>
                          <span className="w-8 text-center font-medium">
                            {guests.adults}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleGuestChange("adults", "add")}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
                          >
                            <span className="text-emerald-600 font-bold">
                              +
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Trẻ em */}
                      <div className="flex items-center justify-between mb-5">
                        <div>
                          <p className="font-medium text-gray-800">Trẻ em</p>
                          <p className="text-sm text-gray-500">0-12 tuổi</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              handleGuestChange("children", "subtract")
                            }
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={guests.children <= 0}
                          >
                            <span className="text-gray-600 font-bold">-</span>
                          </button>
                          <span className="w-8 text-center font-medium">
                            {guests.children}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleGuestChange("children", "add")}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
                          >
                            <span className="text-emerald-600 font-bold">
                              +
                            </span>
                          </button>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-200 mt-3">
                        <button
                          type="button"
                          onClick={() => setShowGuestModal(false)}
                          className="w-full bg-emerald-100 text-emerald-700 font-medium py-2 rounded-lg hover:bg-emerald-200 transition-colors"
                        >
                          Xác nhận
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Nút tìm kiếm */}
            <div className="col-span-2 flex items-end mt-4">
              <button
                type="submit"
                className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 active:bg-emerald-800 transition-all transform active:scale-[0.99] shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader size={20} className="animate-spin" />
                    <span>Đang tìm...</span>
                  </>
                ) : (
                  <>
                    <Search size={20} />
                    <span>Tìm khách sạn</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Layout 2 cột: sidebar + content */}
      <div
        className="container mx-auto px-4 flex flex-row gap-8 relative pb-20"
        ref={resultsContainerRef}
      >
        {/* Sidebar Filter (desktop) */}
        <aside className="sidebar-filter bg-white rounded-xl shadow-lg p-6 h-fit sticky top-28 hidden lg:block max-h-[85vh] overflow-auto custom-scrollbar">
          <div className="flex justify-between mb-4">
            <label className="block text-xl font-bold text-emerald-700 mb-2">
              Bộ lọc
            </label>
            <button
              onClick={resetSearchAndFilters}
              className="px-4 py-2 border border-gray-300 rounded-lg text-emerald-700 hover:bg-emerald-50"
            >
              Đặt lại
            </button>
          </div>
          {/* Tiện ích khách sạn */}
          <div className="sidebar-section mb-4">
            <div
              className="flex justify-between items-center sidebar-toggle"
              onClick={() =>
                setCollapse((c) => ({ ...c, amenities: !c.amenities }))
              }
            >
              <h4 className="text-sm font-medium text-gray-700">
                Tiện ích khách sạn
              </h4>
              <ChevronDown
                className={`transition-transform ${
                  collapse.amenities ? "rotate-180" : ""
                }`}
                size={18}
              />
            </div>
            {!collapse.amenities && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {hotelAmenityOptions.map((amenity) => (
                  <label
                    key={amenity.value}
                    className="flex items-center space-x-2"
                  >
                    <input
                      type="checkbox"
                      checked={filters.hotel_amenities.includes(amenity.value)}
                      onChange={(e) => {
                        const newAmenities = e.target.checked
                          ? [...filters.hotel_amenities, amenity.value]
                          : filters.hotel_amenities.filter(
                              (a) => a !== amenity.value
                            );
                        handleFilterChangeRealtime(
                          "hotel_amenities",
                          newAmenities
                        );
                      }}
                      className="form-checkbox text-emerald-600 h-4 w-4 rounded"
                    />
                    <span className="flex items-center">
                      {amenity.icon}
                      <span>{amenity.label}</span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
          {/* Tiện ích phòng */}
          <div className="sidebar-section mb-4">
            <div
              className="flex justify-between items-center sidebar-toggle"
              onClick={() =>
                setCollapse((c) => ({
                  ...c,
                  room_amenities: !c.room_amenities,
                }))
              }
            >
              <h4 className="text-sm font-medium text-gray-700">
                Tiện ích phòng
              </h4>
              <ChevronDown
                className={`transition-transform ${
                  collapse.room_amenities ? "rotate-180" : ""
                }`}
                size={18}
              />
            </div>
            {!collapse.room_amenities && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {roomAmenityOptions.map((amenity) => (
                  <label
                    key={amenity.value}
                    className="flex items-center space-x-2"
                  >
                    <input
                      type="checkbox"
                      checked={filters.room_amenities.includes(amenity.value)}
                      onChange={(e) => {
                        const newAmenities = e.target.checked
                          ? [...filters.room_amenities, amenity.value]
                          : filters.room_amenities.filter(
                              (a) => a !== amenity.value
                            );
                        handleFilterChangeRealtime(
                          "room_amenities",
                          newAmenities
                        );
                      }}
                      className="form-checkbox text-emerald-600 h-4 w-4 rounded"
                    />
                    <span className="flex items-center">
                      {amenity.icon}
                      <span>{amenity.label}</span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
          {/* Loại phòng */}
          <div className="sidebar-section mb-4">
            <div
              className="flex justify-between items-center sidebar-toggle"
              onClick={() =>
                setCollapse((c) => ({ ...c, room_types: !c.room_types }))
              }
            >
              <h4 className="text-sm font-medium text-gray-700">Loại phòng</h4>
              <ChevronDown
                className={`transition-transform ${
                  collapse.room_types ? "rotate-180" : ""
                }`}
                size={18}
              />
            </div>
            {!collapse.room_types && (
              <div className="flex flex-col gap-2 mt-2">
                {roomTypeOptions.map((type) => (
                  <label
                    key={type.value}
                    className="flex items-center space-x-2"
                  >
                    <input
                      type="checkbox"
                      checked={filters.room_types.includes(type.value)}
                      onChange={(e) => {
                        const newTypes = e.target.checked
                          ? [...filters.room_types, type.value]
                          : filters.room_types.filter((t) => t !== type.value);
                        handleFilterChangeRealtime("room_types", newTypes);
                      }}
                      className="form-checkbox text-emerald-600 h-4 w-4 rounded"
                    />
                    <span>{type.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          {/* Giá */}
          <div className="sidebar-section mb-4">
            <div
              className="flex justify-between items-center sidebar-toggle"
              onClick={() => setCollapse((c) => ({ ...c, price: !c.price }))}
            >
              <h4 className="text-sm font-medium text-gray-700">
                Giá phòng/đêm
              </h4>
              <ChevronDown
                className={`transition-transform ${
                  collapse.price ? "rotate-180" : ""
                }`}
                size={18}
              />
            </div>
            {!collapse.price && (
              <div className="px-2 mt-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{formatPrice(filters.min_price || 0)}</span>
                  <span>{formatPrice(filters.max_price || 10000000)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10000000"
                  step="100000"
                  value={filters.max_price || 10000000}
                  onChange={(e) => handlePriceRangeChange(e.target.value)}
                  className="w-full h-2 bg-emerald-100 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )}
          </div>
          {/* Đánh giá */}
          <div className="sidebar-section mb-4">
            <div
              className="flex justify-between items-center sidebar-toggle"
              onClick={() => setCollapse((c) => ({ ...c, rating: !c.rating }))}
            >
              <h4 className="text-sm font-medium text-gray-700">Xếp hạng</h4>
              <ChevronDown
                className={`transition-transform ${
                  collapse.rating ? "rotate-180" : ""
                }`}
                size={18}
              />
            </div>
            {!collapse.rating && (
              <div className="flex flex-col gap-2 mt-2">
                {ratingOptions.map((opt) => (
                  <label
                    key={opt.value}
                    className="block w-auto p-2 border rounded-lg cursor-pointer hover:bg-emerald-50 hover:border-emerald-200 transition-colors mb-1"
                  >
                    <input
                      type="radio"
                      name="rating"
                      checked={filters.rating == opt.value}
                      onChange={() => handleRatingChange(opt.value)}
                      className="form-radio text-emerald-600 h-4 w-4 rounded mr-2"
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          {/* Sắp xếp */}
          <div className="sidebar-section mb-4">
            <div
              className="flex justify-between items-center sidebar-toggle"
              onClick={() =>
                setCollapse((c) => ({ ...c, sort_by: !c.sort_by }))
              }
            >
              <h4 className="text-sm font-medium text-gray-700">Sắp xếp</h4>
              <ChevronDown
                className={`transition-transform ${
                  collapse.sort_by ? "rotate-180" : ""
                }`}
                size={18}
              />
            </div>
            {!collapse.sort_by && (
              <div className="px-2 mt-2">
                <select
                  value={filters.sort_by}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </aside>
        {/* Main Content: Kết quả tìm kiếm */}
        <div className="flex-1 min-w-0">
          {/* Header cho kết quả tìm kiếm */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {hasSearched ? "Kết quả tìm kiếm" : "Tất cả khách sạn"}
              </h2>
              {!hasSearched && (
                <p className="text-gray-600">
                  Các khách sạn phổ biến hoặc tìm kiếm để xem khách sạn phù hợp
                </p>
              )}
            </div>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <div className="relative">
                <select
                  value={filters.sort_by}
                  onChange={(e) => {
                    handleInputChange("sort_by", e.target.value);
                    setLoading(true);
                  }}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                >
                  <option value="price">Giá thấp nhất</option>
                  <option value="price_desc">Giá cao nhất</option>
                  <option value="rating">Đánh giá cao nhất</option>
                  <option value="rating_desc">Đánh giá thấp nhất</option>
                  <option value="name">Tên A-Z</option>
                  <option value="name_desc">Tên Z-A</option>
                </select>
                <ChevronDown
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none"
                  size={16}
                />
              </div>
            </div>
          </div>

          {/* Search Results Count */}
          <div className="mb-6 text-gray-600">
            <p>
              {loading ? (
                <span className="flex items-center">
                  <Loader size={16} className="animate-spin mr-2" />
                  Đang tải khách sạn...
                </span>
              ) : hasSearched ? (
                `Đã tìm thấy ${pagination.total || 0} khách sạn${
                  filters.location ? ` tại ${filters.location}` : ""
                }`
              ) : (
                `Đã tìm thấy ${pagination.total || 0} khách sạn`
              )}
            </p>
          </div>

          {/* Hotel Cards */}
          <div className="space-y-5">
            {error && (
              <div className="text-center text-red-500 font-semibold py-8">
                {error}
              </div>
            )}
            {!loading && !error && hotels.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                {searchPerformed
                  ? "Không tìm thấy khách sạn phù hợp với tiêu chí tìm kiếm"
                  : "Không có khách sạn nào để hiển thị"}
              </div>
            ) : (
              hotels.map((hotel) => {
                const isPromo =
                  hotel.promotion &&
                  new Date(hotel.promotion.end_date) >= new Date() &&
                  hotel.promotion.status === "active";

                const daysRemaining = isPromo
                  ? getDaysRemaining(hotel.promotion.end_date)
                  : null;

                return (
                  <div
                    key={hotel.id}
                    className={
                      `hotel-card rounded-xl overflow-hidden transition-all duration-300 ` +
                      (isPromo
                        ? "promo-hotel-card"
                        : "bg-white border border-gray-100 shadow-md hover:shadow-lg")
                    }
                  >
                    {/* Tag khuyến mãi */}
                    {isPromo && (
                      <>
                        <div className="absolute top-0 right-0 z-30 px-4 py-1 bg-orange-500 text-white font-bold text-sm rounded-bl-2xl shadow-md flex items-center gap-1">
                          <Tag size={14} />
                          {hotel.promotion.type === "percentage"
                            ? `-${hotel.promotion.discount}%`
                            : `-${formatPrice(hotel.promotion.discount)}`}
                        </div>
                        <div className="absolute top-0 left-0 z-20 flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-orange-400 to-orange-300 text-white font-bold rounded-br-2xl shadow-md">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-5 h-5 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 17.75l-6.172 3.245 1.179-6.873L2 9.755l6.908-1.004L12 2.5l3.092 6.251L22 9.755l-5.007 4.367 1.179 6.873z"
                            />
                          </svg>
                          <span>
                            {hotel.promotion.title || "Khuyến mãi HOT"}
                          </span>
                        </div>
                      </>
                    )}

                    <div className="p-6 flex flex-col md:flex-row gap-6 pt-10">
                      {/* Left Column: Image and Basic Info */}
                      <div className="md:w-1/3">
                        <div className="relative group">
                          <img
                            src={
                              hotel.images && hotel.images[0]
                                ? hotel.images[0].startsWith("http")
                                  ? hotel.images[0]
                                  : `${API_URL}${hotel.images[0]}`
                                : PLACEHOLDER_IMAGE
                            }
                            alt={hotel.name}
                            className="w-full h-48 md:h-64 object-cover rounded-lg shadow-md group-hover:shadow-lg transition-all"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = PLACEHOLDER_IMAGE;
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"></div>
                        </div>
                      </div>

                      {/* Right Column: Details */}
                      <div className="md:w-2/3 flex flex-col justify-between">
                        {/* Hotel Info */}
                        <div>
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="text-xl font-bold text-gray-800">
                                {hotel.name}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <MapPin size={16} className="text-gray-500" />
                                <span className="text-gray-600">
                                  {hotel.location}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              {isPromo ? (
                                <>
                                  <div className="text-2xl font-bold text-orange-600">
                                    {formatPrice(hotel.discounted_price)}
                                  </div>
                                  <div className="flex flex-col items-end">
                                    <p className="text-sm text-gray-400 line-through">
                                      {formatPrice(hotel.price)}
                                    </p>
                                    {daysRemaining !== null && (
                                      <p className="text-xs text-orange-500">
                                        {daysRemaining > 0
                                          ? `Còn ${daysRemaining} ngày`
                                          : "Sắp kết thúc"}
                                      </p>
                                    )}
                                  </div>
                                </>
                              ) : (
                                <div className="text-2xl font-bold text-emerald-600">
                                  {formatPrice(hotel.price)}
                                </div>
                              )}
                              <p className="text-sm text-gray-500 mt-1">/đêm</p>
                            </div>
                          </div>

                          {/* Rating, Capacity and Available Rooms */}
                          <div className="flex items-center gap-4 mb-4 flex-wrap">
                            <div className="flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg">
                              <Star
                                size={16}
                                className="text-yellow-500 fill-yellow-500"
                              />
                              <span className="font-medium text-gray-700">
                                {hotel.rating ? hotel.rating.toFixed(1) : "N/A"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-600">
                              <Users size={16} />
                              <span>{hotel.min_capacity || 2} khách/phòng</span>
                            </div>
                            {hotel.available_rooms !== undefined && (
                              <div
                                className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                                  hotel.available_rooms > 0
                                    ? "bg-blue-50"
                                    : "bg-red-50"
                                }`}
                              >
                                <Hotel
                                  size={16}
                                  className={
                                    hotel.available_rooms > 0
                                      ? "text-blue-600"
                                      : "text-red-600"
                                  }
                                />
                                <span
                                  className={`font-medium ${
                                    hotel.available_rooms > 0
                                      ? "text-blue-700"
                                      : "text-red-700"
                                  }`}
                                >
                                  {hotel.available_rooms > 0
                                    ? `Còn ${hotel.available_rooms} phòng trống`
                                    : "Hết phòng"}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Description */}
                          <p className="text-gray-600 mb-4 line-clamp-2">
                            {hotel.description ||
                              "Khách sạn chất lượng cao, đầy đủ tiện nghi."}
                          </p>

                          {/* Amenities */}
                          <div className="flex flex-wrap gap-3">
                            {hotel.amenities &&
                              hotel.amenities.map((amenity, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-full text-sm text-gray-700 transition-colors"
                                  title={amenity}
                                >
                                  <span className="text-emerald-600">
                                    {getAmenityIcon(amenity)}
                                  </span>
                                  <span className="capitalize">
                                    {amenity.toLowerCase().replace(/_/g, " ")}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Footer */}
                    <div className="p-4 bg-emerald-50/50 flex flex-wrap items-center justify-between">
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                            {hotel.rating
                              ? `${hotel.rating.toFixed(1)} sao`
                              : "Chưa có đánh giá"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users size={14} className="text-gray-400" />
                          <span>{hotel.min_capacity || 2} khách/phòng</span>
                        </div>
                        {hotel.amenities && hotel.amenities.length > 4 && (
                          <div className="text-gray-500">
                            +{hotel.amenities.length - 4} tiện ích khác
                          </div>
                        )}

                        <div className="border-t border-gray-100">
                          {/* Promotion Description */}
                          {isPromo && hotel.promotion.description && (
                            <div className=" bg-orange-50/50">
                              <p className="text-sm text-gray-600">
                                <span className="font-medium text-orange-600">
                                  Ưu đãi:{" "}
                                </span>
                                {hotel.promotion.description}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectHotel(hotel.id);
                        }}
                        className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm text-sm font-medium flex items-center gap-2"
                      >
                        <span>Xem chi tiết</span>
                        <ChevronDown className="w-4 h-4 transform -rotate-90" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div className="mt-8 flex justify-center">
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    handlePageChange(Math.max(1, pagination.page - 1))
                  }
                  disabled={pagination.page === 1 || loading}
                  className="px-3 py-2 border rounded-lg hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path
                      fillRule="evenodd"
                      d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"
                    />
                  </svg>
                  <span>Trước</span>
                </button>
                {Array.from(
                  { length: Math.min(5, pagination.total_pages) },
                  (_, i) => {
                    let pageNum;
                    if (pagination.total_pages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.total_pages - 2) {
                      pageNum = pagination.total_pages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        disabled={loading}
                        className={`w-10 h-10 flex items-center justify-center rounded-lg ${
                          pagination.page === pageNum
                            ? "bg-emerald-600 text-white"
                            : "border hover:bg-emerald-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                )}
                <button
                  onClick={() =>
                    handlePageChange(
                      Math.min(pagination.total_pages, pagination.page + 1)
                    )
                  }
                  disabled={
                    pagination.page === pagination.total_pages || loading
                  }
                  className="px-3 py-2 border rounded-lg hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <span>Sau</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading state cho gợi ý */}
      {loadingLocationSuggest && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 flex items-center justify-center">
          <Loader size={16} className="animate-spin text-emerald-500 mr-2" />
          <span className="text-sm text-gray-500">
            Đang tìm kiếm địa điểm...
          </span>
        </div>
      )}
    </div>
  );
};

// Thêm animation cho pulse-slow nếu chưa có
if (typeof document !== "undefined") {
  const existingStyle = document.getElementById("custom-animations");
  if (!existingStyle) {
    const style = document.createElement("style");
    style.id = "custom-animations";
    style.textContent = `
      @keyframes pulse-slow {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.8; }
      }
      .animate-pulse-slow {
        animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }
    `;
    document.head.appendChild(style);
  }
}

export default HotelSearch;
