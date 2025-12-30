import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  MapPin,
  Star,
  Users,
  Calendar,
  Wifi,
  Car,
  WavesLadder,
  Coffee,
  Utensils,
  Info,
  ArrowLeft,
  Loader2,
  Phone,
  Mail,
  Clock,
  Bed,
  MapPin as LocationIcon,
  CheckCircle2,
  Home,
  ShowerHead,
  Bath,
  Sparkles,
  Dumbbell,
  Waves,
  HeartPulse,
  UtensilsCrossed,
  BadgePercent,
  Tv,
  CarFront,
  AirVent,
  X,
  ChevronLeft,
  ChevronRight,
  Image,
  Search,
  Filter,
  SlidersHorizontal,
} from "lucide-react";
import Toast from "../../common/Toast";
import CommentSection from "../../common/CommentSection";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const HotelDetail = ({
  hotel,
  bookingDetails = {
    checkIn: new Date().toISOString().split("T")[0],
    checkOut: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    guests: { adults: 1, children: 0 },
    rooms: 1,
    selectedRoom: null,
  },
  onBookingChange,
  onGuestChange,
  onRoomSelect,
  selectedTab,
  setSelectedTab,
  selectedRooms,
  setSelectedRooms,
  // Rating & Review props
  currentUserId,
  isAdmin,
  likedComments,
  toast,
  showToast,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onLikeComment,
  onReloadHotel,
  onRatingClick,
  userRating,
  hoverRating,
  setHoverRating,
  ratingError,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Thêm state cho giá
  const [priceDetails, setPriceDetails] = useState({
    basePrice: 0,
    totalNights: 0,
    roomPrice: 0,
    discountAmount: 0,
    finalTotal: 0,
  });

  // State cho tìm kiếm, lọc và phân trang phòng
  const [roomSearch, setRoomSearch] = useState("");
  const [roomFilters, setRoomFilters] = useState({
    minCapacity: 0,
    maxCapacity: 999,
    minPrice: 0,
    maxPrice: 999999999,
  });
  const [roomSortBy, setRoomSortBy] = useState("price_asc"); // price_asc, price_desc, capacity_asc, capacity_desc
  const [roomPage, setRoomPage] = useState(1);
  const [roomsPerPage] = useState(6);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const navigate = useNavigate();

  // Format ngày tháng
  const formatDateDisplay = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleBooking = (room) => {
    if (!bookingDetails.checkIn || !bookingDetails.checkOut) {
      alert("Vui lòng chọn ngày nhận phòng và trả phòng");
      return;
    }

    if (!room) {
      setSelectedTab("rooms");
      const roomsSection = document.querySelector("#rooms-section");
      if (roomsSection) {
        roomsSection.scrollIntoView({ behavior: "smooth" });
      }
      return;
    }

    navigate(`/hotels/${hotel.id}/booking`, {
      state: {
        hotel,
        selectedRoom: room,
        checkIn: bookingDetails.checkIn,
        checkOut: bookingDetails.checkOut,
        guests: bookingDetails.guests,
      },
    });
  };

  const handleInputChange = (field, value) => {
    onBookingChange((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Xử lý mở modal chi tiết phòng
  const openRoomDetails = (room) => {
    setSelectedRoom(room);
    setCurrentImageIndex(0);
    setShowRoomModal(true);
    document.body.style.overflow = "hidden";
  };

  // Xử lý đóng modal
  const closeRoomModal = () => {
    setShowRoomModal(false);
    setSelectedRoom(null);
    document.body.style.overflow = "auto";
  };

  // Xử lý điều hướng qua các ảnh
  const nextImage = () => {
    if (selectedRoom?.images && selectedRoom.images.length > 0) {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === selectedRoom.images.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  const prevImage = () => {
    if (selectedRoom?.images && selectedRoom.images.length > 0) {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === 0 ? selectedRoom.images.length - 1 : prevIndex - 1
      );
    }
  };

  // Ảnh hiện tại
  const getCurrentImage = () => {
    if (selectedRoom?.images && selectedRoom.images.length > 0) {
      return selectedRoom.images[currentImageIndex];
    }
    return "https://via.placeholder.com/800x500?text=Không+có+ảnh";
  };

  // Hàm tính số đêm
  const calculateNights = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Xử lý chọn phòng - Logic đơn giản hơn
  const handleRoomSelect = (room) => {
    const isSelected = selectedRooms.some((r) => r.id === room.id);

    if (isSelected) {
      // Bỏ chọn phòng
      const newSelectedRooms = selectedRooms.filter((r) => r.id !== room.id);
      setSelectedRooms(newSelectedRooms);

      // Nếu chỉ có 1 phòng, reset selectedRoom trong bookingDetails
      if (bookingDetails.rooms === 1) {
        onBookingChange({
          ...bookingDetails,
          selectedRoom: null,
        });
      }
    } else {
      // Chọn phòng mới
      if (selectedRooms.length >= bookingDetails.rooms) {
        // Nếu đã đủ số phòng
        if (bookingDetails.rooms === 1) {
          // Chế độ 1 phòng: thay thế phòng cũ
          setSelectedRooms([room]);
          onBookingChange({
            ...bookingDetails,
            selectedRoom: room,
          });
        } else {
          // Chế độ nhiều phòng: không cho chọn thêm
          showToast(
            `Bạn chỉ có thể chọn tối đa ${bookingDetails.rooms} phòng`,
            "warning"
          );
        }
        return;
      }

      // Thêm phòng vào danh sách
      const newSelectedRooms = [...selectedRooms, room];
      setSelectedRooms(newSelectedRooms);

      // Nếu chỉ có 1 phòng, cập nhật selectedRoom
      if (bookingDetails.rooms === 1) {
        onBookingChange({
          ...bookingDetails,
          selectedRoom: room,
        });
      }
    }

    onRoomSelect(room);
  };

  // Kiểm tra cảnh báo về sức chứa
  const getCapacityWarning = () => {
    const totalGuests =
      bookingDetails.guests.adults + bookingDetails.guests.children;
    const totalCapacity = selectedRooms.reduce(
      (total, room) => total + room.capacity,
      0
    );

    if (selectedRooms.length > 0 && totalGuests > totalCapacity) {
      return `Sức chứa tối đa của các phòng đã chọn (${totalCapacity} người) không đủ cho ${totalGuests} khách`;
    }

    return null;
  };

  // Kiểm tra xem phòng có được chọn không
  const isRoomSelected = (roomId) => {
    return selectedRooms.some((room) => room.id === roomId);
  };

  // Logic lọc, sắp xếp và phân trang phòng
  const filteredAndSortedRooms = useMemo(() => {
    if (!hotel || !hotel.rooms) return [];

    let rooms = [...hotel.rooms];

    // 1. Tìm kiếm theo tên
    if (roomSearch.trim()) {
      rooms = rooms.filter((room) =>
        room.name.toLowerCase().includes(roomSearch.toLowerCase())
      );
    }

    // 2. Lọc theo sức chứa
    if (roomFilters.minCapacity > 0) {
      rooms = rooms.filter((room) => room.capacity >= roomFilters.minCapacity);
    }
    if (roomFilters.maxCapacity < 999) {
      rooms = rooms.filter((room) => room.capacity <= roomFilters.maxCapacity);
    }

    // 3. Lọc theo giá (tính cả khuyến mãi)
    rooms = rooms.filter((room) => {
      let roomPrice = room.price;
      if (hotel?.promotion) {
        if (hotel.promotion.type === "percentage") {
          roomPrice = Math.round(
            room.price * (1 - hotel.promotion.discount / 100)
          );
        } else {
          roomPrice = Math.max(0, room.price - hotel.promotion.discount);
        }
      }
      return (
        roomPrice >= roomFilters.minPrice && roomPrice <= roomFilters.maxPrice
      );
    });

    // 4. Sắp xếp
    rooms.sort((a, b) => {
      // Tính giá sau khuyến mãi cho cả 2 phòng
      let priceA = a.price;
      let priceB = b.price;

      if (hotel?.promotion) {
        if (hotel.promotion.type === "percentage") {
          priceA = Math.round(a.price * (1 - hotel.promotion.discount / 100));
          priceB = Math.round(b.price * (1 - hotel.promotion.discount / 100));
        } else {
          priceA = Math.max(0, a.price - hotel.promotion.discount);
          priceB = Math.max(0, b.price - hotel.promotion.discount);
        }
      }

      switch (roomSortBy) {
        case "price_asc":
          return priceA - priceB;
        case "price_desc":
          return priceB - priceA;
        case "capacity_asc":
          return a.capacity - b.capacity;
        case "capacity_desc":
          return b.capacity - a.capacity;
        default:
          return 0;
      }
    });

    return rooms;
  }, [hotel, roomSearch, roomFilters, roomSortBy]);

  // Phân trang
  const paginatedRooms = useMemo(() => {
    const startIndex = (roomPage - 1) * roomsPerPage;
    const endIndex = startIndex + roomsPerPage;
    return filteredAndSortedRooms.slice(startIndex, endIndex);
  }, [filteredAndSortedRooms, roomPage, roomsPerPage]);

  const totalRoomPages = Math.ceil(
    filteredAndSortedRooms.length / roomsPerPage
  );

  // Reset trang về 1 khi filter/search thay đổi
  const handleFilterChange = (newFilters) => {
    setRoomFilters(newFilters);
    setRoomPage(1);
  };

  const handleSearchChange = (value) => {
    setRoomSearch(value);
    setRoomPage(1);
  };

  const handleSortChange = (value) => {
    setRoomSortBy(value);
    setRoomPage(1);
  };

  // Hiển thị thông tin chi tiết về sức chứa
  const getCapacityInfo = () => {
    const totalGuests =
      bookingDetails.guests.adults + bookingDetails.guests.children;
    const currentCapacity = selectedRooms.reduce(
      (total, room) => total + room.capacity,
      0
    );

    if (selectedRooms.length === 0) {
      return `Cần chọn phòng cho ${totalGuests} người`;
    }

    if (currentCapacity < totalGuests) {
      return `Sức chứa: ${currentCapacity}/${totalGuests} người (Chưa đủ)`;
    }

    return `Sức chứa: ${currentCapacity}/${totalGuests} người (Đã đủ)`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-gray-600">Đang tải thông tin khách sạn...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{error}</h2>
          <button
            onClick={() => navigate("/hotels")}
            className="text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Quay lại danh sách khách sạn
          </button>
        </div>
      </div>
    );
  }

  if (!hotel) {
    navigate("/hotels");
    return null;
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const getAmenityIcon = (amenity) => {
    const normalizedAmenity =
      amenity
        ?.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") || "";

    if (
      normalizedAmenity.includes("wifi") ||
      normalizedAmenity.includes("internet")
    ) {
      return <Wifi className="w-5 h-5 text-emerald-600" />;
    }
    if (
      normalizedAmenity.includes("parking") ||
      normalizedAmenity.includes("do xe") ||
      normalizedAmenity.includes("bai dau")
    ) {
      return <CarFront className="w-5 h-5 text-emerald-600" />;
    }
    if (
      normalizedAmenity.includes("restaurant") ||
      normalizedAmenity.includes("nha hang")
    ) {
      return <Utensils className="w-5 h-5 text-emerald-600" />;
    }
    if (
      normalizedAmenity.includes("pool") ||
      normalizedAmenity.includes("ho boi")
    ) {
      return <WavesLadder className="w-5 h-5 text-emerald-600" />;
    }
    if (
      normalizedAmenity.includes("coffee") ||
      normalizedAmenity.includes("cafe")
    ) {
      return <Coffee className="w-5 h-5 text-emerald-600" />;
    }
    if (
      normalizedAmenity.includes("gym") ||
      normalizedAmenity.includes("fitness") ||
      normalizedAmenity.includes("tap luyen")
    ) {
      return <Dumbbell className="w-5 h-5 text-emerald-600" />;
    }
    if (
      normalizedAmenity.includes("spa") ||
      normalizedAmenity.includes("massage")
    ) {
      return <HeartPulse className="w-5 h-5 text-emerald-600" />;
    }
    if (
      normalizedAmenity.includes("breakfast") ||
      normalizedAmenity.includes("buffet") ||
      normalizedAmenity.includes("bua sang")
    ) {
      return <UtensilsCrossed className="w-5 h-5 text-emerald-600" />;
    }
    if (
      normalizedAmenity.includes("beach") ||
      normalizedAmenity.includes("bien")
    ) {
      return <Waves className="w-5 h-5 text-emerald-600" />;
    }
    if (
      normalizedAmenity.includes("air") ||
      normalizedAmenity.includes("dieu hoa")
    ) {
      return <AirVent className="w-5 h-5 text-emerald-600" />;
    }
    if (
      normalizedAmenity.includes("shower") ||
      normalizedAmenity.includes("voi sen")
    ) {
      return <ShowerHead className="w-5 h-5 text-emerald-600" />;
    }
    if (
      normalizedAmenity.includes("bath") ||
      normalizedAmenity.includes("bon tam")
    ) {
      return <Bath className="w-5 h-5 text-emerald-600" />;
    }
    if (
      normalizedAmenity.includes("clean") ||
      normalizedAmenity.includes("don phong")
    ) {
      return <Sparkles className="w-5 h-5 text-emerald-600" />;
    }
    if (
      normalizedAmenity.includes("service") ||
      normalizedAmenity.includes("dich vu")
    ) {
      return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
    }
    if (
      normalizedAmenity.includes("location") ||
      normalizedAmenity.includes("vi tri")
    ) {
      return <LocationIcon className="w-5 h-5 text-emerald-600" />;
    }
    if (
      normalizedAmenity.includes("room") ||
      normalizedAmenity.includes("phong")
    ) {
      return <Home className="w-5 h-5 text-emerald-600" />;
    }
    if (
      normalizedAmenity.includes("tv") ||
      normalizedAmenity.includes("television")
    ) {
      return <Tv className="w-5 h-5 text-emerald-600" />;
    }

    return <Info className="w-5 h-5 text-emerald-600" />;
  };

  const getAmenityDisplayName = (amenity) => {
    const normalizedAmenity =
      amenity
        ?.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") || "";

    if (
      normalizedAmenity.includes("wifi") ||
      normalizedAmenity.includes("internet")
    ) {
      return "Wi-Fi miễn phí";
    }
    if (
      normalizedAmenity.includes("parking") ||
      normalizedAmenity.includes("do xe") ||
      normalizedAmenity.includes("bai dau")
    ) {
      return "Bãi đậu xe";
    }
    if (
      normalizedAmenity.includes("restaurant") ||
      normalizedAmenity.includes("nha hang")
    ) {
      return "Nhà hàng";
    }
    if (
      normalizedAmenity.includes("pool") ||
      normalizedAmenity.includes("ho boi")
    ) {
      return "Hồ bơi";
    }
    if (
      normalizedAmenity.includes("coffee") ||
      normalizedAmenity.includes("cafe")
    ) {
      return "Quán cafe";
    }
    if (
      normalizedAmenity.includes("gym") ||
      normalizedAmenity.includes("fitness") ||
      normalizedAmenity.includes("tap luyen")
    ) {
      return "Phòng tập gym";
    }
    if (
      normalizedAmenity.includes("spa") ||
      normalizedAmenity.includes("massage")
    ) {
      return "Dịch vụ spa";
    }
    if (
      normalizedAmenity.includes("breakfast") ||
      normalizedAmenity.includes("buffet") ||
      normalizedAmenity.includes("bua sang")
    ) {
      return "Bữa sáng";
    }
    if (
      normalizedAmenity.includes("beach") ||
      normalizedAmenity.includes("bien")
    ) {
      return "Gần biển";
    }
    if (
      normalizedAmenity.includes("air") ||
      normalizedAmenity.includes("dieu hoa")
    ) {
      return "Điều hòa";
    }

    return amenity.charAt(0).toUpperCase() + amenity.slice(1);
  };

  const renderRating = (rating) => {
    const numericRating = parseFloat(rating) || 0;
    const safeRating = Math.min(Math.max(0, numericRating), 5);

    return [...Array(5)].map((_, index) => (
      <Star
        key={index}
        className={`w-5 h-5 ${
          index < safeRating ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString("vi-VN", options);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => showToast(null)}
        />
      )}

      {/* Hero Section */}
      <div className="bg-emerald-600 text-white py-12">
        <div className="container mx-auto px-4">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-white mb-6 hover:text-emerald-100"
          >
            <ArrowLeft className="w-5 h-5" />
            Quay lại danh sách khách sạn
          </button>
          <h1 className="text-3xl font-bold mb-2">{hotel.name}</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              {renderRating(hotel.rating)}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              {hotel.location}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-8">
        <div className="bg-white rounded-lg shadow-lg">
          {/* Navigation */}
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                className={
                  selectedTab === "details"
                    ? "px-6 py-3 font-medium text-emerald-600 border-b-2 border-emerald-600"
                    : "px-6 py-3 font-medium text-gray-500 hover:text-gray-700"
                }
                onClick={() => setSelectedTab("details")}
              >
                Thông tin chung
              </button>
              <button
                className={
                  selectedTab === "rooms"
                    ? "px-6 py-3 font-medium text-emerald-600 border-b-2 border-emerald-600"
                    : "px-6 py-3 font-medium text-gray-500 hover:text-gray-700"
                }
                onClick={() => setSelectedTab("rooms")}
              >
                Danh sách phòng
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {selectedTab === "details" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Mô tả</h2>
                  <p className="text-gray-600">{hotel.description}</p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-4">
                    Tiện nghi khách sạn
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {hotel.amenities &&
                      hotel.amenities.map((amenity, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-gray-600"
                        >
                          {getAmenityIcon(amenity)}
                          <span className="capitalize">
                            {getAmenityDisplayName(amenity)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-4">
                    Thông tin cần biết
                  </h2>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium mb-2">Nhận phòng</h3>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-5 h-5" />
                        <span>Từ 14:00</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium mb-2">Trả phòng</h3>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-5 h-5" />
                        <span>Trước 12:00</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-4">Liên hệ</h2>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-5 h-5" />
                      <span>+84 xxx xxx xxx</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-5 h-5" />
                      <span>
                        contact@
                        {hotel.name?.toLowerCase().replace(/\s+/g, "")}
                        vietjourney.com
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-5 h-5" />
                      <span>{hotel.location}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === "rooms" && (
              <div className="space-y-6" id="rooms-section">
                {/* Booking Form */}
                <div className="bg-emerald-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Calendar className="w-5 h-5 text-emerald-600" />
                      <div>
                        <p className="font-medium">Thời gian đã chọn:</p>
                        <p className="text-sm text-gray-600">
                          Nhận phòng:{" "}
                          {formatDateDisplay(bookingDetails.checkIn)}
                        </p>
                        <p className="text-sm text-gray-600">
                          Trả phòng:{" "}
                          {formatDateDisplay(bookingDetails.checkOut)}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="font-medium">Số khách & phòng:</p>
                      <p className="text-sm text-gray-600">
                        {bookingDetails.guests.adults} người lớn
                        {bookingDetails.guests.children > 0 &&
                          `, ${bookingDetails.guests.children} trẻ em`}
                      </p>
                      <p className="text-sm text-gray-600">
                        {bookingDetails.rooms} phòng
                      </p>
                    </div>
                  </div>
                  {/* Thông tin về số phòng đã chọn */}
                  {bookingDetails.rooms > 0 && (
                    <div className="mt-4 pt-4 border-t border-emerald-200">
                      <div className="flex flex-col gap-3">
                        {/* Header */}
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-sm font-medium text-gray-700">
                              Tiến trình chọn phòng
                            </span>
                            <div className="text-xs text-gray-500 mt-1">
                              {selectedRooms.length > 0
                                ? `Đã chọn ${selectedRooms.length}/${bookingDetails.rooms} phòng`
                                : `Cần chọn ${bookingDetails.rooms} phòng`}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-medium text-gray-700">
                              Sức chứa
                            </span>
                            <div
                              className={`text-xs mt-1 font-medium ${
                                selectedRooms.length === 0
                                  ? "text-gray-500"
                                  : selectedRooms.reduce(
                                      (total, r) => total + r.capacity,
                                      0
                                    ) >=
                                    bookingDetails.guests.adults +
                                      bookingDetails.guests.children
                                  ? "text-emerald-600"
                                  : "text-orange-600"
                              }`}
                            >
                              {getCapacityInfo()}
                            </div>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              selectedRooms.length === bookingDetails.rooms
                                ? "bg-emerald-500"
                                : "bg-emerald-400"
                            }`}
                            style={{
                              width: `${
                                (selectedRooms.length / bookingDetails.rooms) *
                                100
                              }%`,
                            }}
                          />
                        </div>

                        {/* Chi tiết phòng đã chọn */}
                        {selectedRooms.length > 0 && (
                          <div className="bg-white p-3 rounded-lg border border-emerald-100">
                            <div className="text-xs font-medium text-gray-700 mb-2">
                              Phòng đã chọn:
                            </div>
                            {selectedRooms.map((room, idx) => (
                              <div
                                key={room.id}
                                className="flex justify-between items-center text-xs text-gray-600 py-1"
                              >
                                <span>
                                  {idx + 1}. {room.name}
                                </span>
                                <span className="font-medium text-emerald-600">
                                  {room.capacity} người
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Cảnh báo sức chứa nếu có */}
                        {getCapacityWarning() && (
                          <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                            <div className="flex items-start gap-2">
                              <svg
                                className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                              </svg>
                              <div className="flex-1">
                                <div className="text-xs font-medium text-orange-800 mb-1">
                                  Lưu ý về sức chứa
                                </div>
                                <p className="text-xs text-orange-700">
                                  {getCapacityWarning()}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Tìm kiếm, Lọc và Sắp xếp phòng */}
                <div className="mb-6 space-y-4">
                  {/* Search và Sort */}
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Search Box */}
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Tìm kiếm phòng theo tên..."
                        value={roomSearch}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>

                    {/* Sort Dropdown */}
                    <div className="flex gap-2">
                      <select
                        value={roomSortBy}
                        onChange={(e) => handleSortChange(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                      >
                        <option value="price_asc">Giá: Thấp đến Cao</option>
                        <option value="price_desc">Giá: Cao đến Thấp</option>
                        <option value="capacity_asc">
                          Sức chứa: Ít đến Nhiều
                        </option>
                        <option value="capacity_desc">
                          Sức chứa: Nhiều đến Ít
                        </option>
                      </select>

                      {/* Filter Toggle Button */}
                      <button
                        onClick={() => setShowFilterPanel(!showFilterPanel)}
                        className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
                          showFilterPanel
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <SlidersHorizontal className="w-5 h-5" />
                        Lọc
                      </button>
                    </div>
                  </div>

                  {/* Filter Panel */}
                  {showFilterPanel && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
                      <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                        <Filter className="w-5 h-5" />
                        Bộ lọc nâng cao
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Lọc theo sức chứa */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Sức chứa (người)
                          </label>
                          <div className="flex gap-2 items-center">
                            <input
                              type="number"
                              placeholder="Từ"
                              min="0"
                              value={
                                roomFilters.minCapacity === 0
                                  ? ""
                                  : roomFilters.minCapacity
                              }
                              onChange={(e) =>
                                handleFilterChange({
                                  ...roomFilters,
                                  minCapacity: parseInt(e.target.value) || 0,
                                })
                              }
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                            <span className="text-gray-500">-</span>
                            <input
                              type="number"
                              placeholder="Đến"
                              min="0"
                              value={
                                roomFilters.maxCapacity === 999
                                  ? ""
                                  : roomFilters.maxCapacity
                              }
                              onChange={(e) =>
                                handleFilterChange({
                                  ...roomFilters,
                                  maxCapacity: parseInt(e.target.value) || 999,
                                })
                              }
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                          </div>
                        </div>

                        {/* Lọc theo giá */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Giá phòng (VNĐ/đêm)
                          </label>
                          <div className="flex gap-2 items-center">
                            <input
                              type="number"
                              placeholder="Từ"
                              min="0"
                              value={
                                roomFilters.minPrice === 0
                                  ? ""
                                  : roomFilters.minPrice
                              }
                              onChange={(e) =>
                                handleFilterChange({
                                  ...roomFilters,
                                  minPrice: parseInt(e.target.value) || 0,
                                })
                              }
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                            <span className="text-gray-500">-</span>
                            <input
                              type="number"
                              placeholder="Đến"
                              min="0"
                              value={
                                roomFilters.maxPrice === 999999999
                                  ? ""
                                  : roomFilters.maxPrice
                              }
                              onChange={(e) =>
                                handleFilterChange({
                                  ...roomFilters,
                                  maxPrice:
                                    parseInt(e.target.value) || 999999999,
                                })
                              }
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Reset Button */}
                      <div className="flex justify-end">
                        <button
                          onClick={() => {
                            handleFilterChange({
                              minCapacity: 0,
                              maxCapacity: 999,
                              minPrice: 0,
                              maxPrice: 999999999,
                            });
                            setRoomSearch("");
                            setRoomSortBy("price_asc");
                          }}
                          className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          Đặt lại bộ lọc
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Kết quả tìm kiếm */}
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <p>
                      Hiển thị <strong>{paginatedRooms.length}</strong> trong
                      tổng số <strong>{filteredAndSortedRooms.length}</strong>{" "}
                      phòng
                    </p>
                  </div>
                </div>

                {/* Room List */}
                {paginatedRooms && paginatedRooms.length > 0 ? (
                  paginatedRooms.map((room) => {
                    // Tính giá khuyến mãi cho phòng
                    let discountedPrice = room.price;
                    let discountText = null;

                    if (hotel?.promotion) {
                      if (hotel.promotion.type === "percentage") {
                        discountedPrice = Math.round(
                          room.price * (1 - hotel.promotion.discount / 100)
                        );
                        discountText = `-${hotel.promotion.discount}%`;
                      } else {
                        discountedPrice = Math.max(
                          0,
                          room.price - hotel.promotion.discount
                        );
                        discountText = `-${formatPrice(
                          hotel.promotion.discount
                        )}`;
                      }
                    }

                    return (
                      <div
                        key={room.id}
                        className={`border rounded-lg p-6 transition-colors ${
                          isRoomSelected(room.id)
                            ? "border-emerald-500 bg-emerald-50"
                            : "hover:border-emerald-500"
                        }`}
                      >
                        <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-4">
                          <div className="w-full md:w-2/3">
                            <div className="flex justify-between items-start">
                              <h3 className="text-lg font-semibold mb-2">
                                {room.name}
                              </h3>
                            </div>
                            <div className="flex items-center gap-1 text-gray-600 mb-2">
                              <Users className="w-5 h-5 text-emerald-600" />
                              <span>{room.capacity} người</span>
                              {room.size && (
                                <>
                                  <span className="mx-2">•</span>
                                  <Building2 className="w-5 h-5 text-emerald-600" />
                                  <span>{room.size}m²</span>
                                </>
                              )}
                            </div>

                            {/* Tiện nghi phòng */}
                            <div className="mb-4">
                              <h4 className="text-sm font-medium text-gray-700 mb-1">
                                Tiện nghi phòng:
                              </h4>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                {room.amenities && room.amenities.length > 0 ? (
                                  room.amenities.map((amenity, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center gap-1"
                                    >
                                      {getAmenityIcon(amenity)}
                                      <span className="text-gray-600">
                                        {getAmenityDisplayName(amenity)}
                                      </span>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-gray-500 italic col-span-2">
                                    Chưa có thông tin chi tiết về tiện nghi
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Chính sách phòng */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 text-sm">
                              <div className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />
                                <span>Miễn phí hủy phòng trước 24h</span>
                              </div>
                              <div className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />
                                <span>Đã bao gồm bữa sáng</span>
                              </div>
                              <div className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />
                                <span>Thanh toán tại khách sạn</span>
                              </div>
                              <div className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />
                                <span>WiFi miễn phí</span>
                              </div>
                            </div>

                            <button
                              onClick={() => openRoomDetails(room)}
                              className="text-emerald-600 text-sm font-medium hover:text-emerald-700 flex items-center"
                            >
                              Xem chi tiết phòng
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </button>
                          </div>

                          <div className="w-full md:w-1/3 flex flex-col items-center md:items-end">
                            {/* Hình ảnh phòng */}
                            {room.images && room.images.length > 0 ? (
                              <div
                                className="w-full h-32 rounded-lg overflow-hidden mb-4 relative group cursor-pointer"
                                onClick={() => openRoomDetails(room)}
                              >
                                <img
                                  src={room.images[0]}
                                  alt={room.name}
                                  className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src =
                                      "https://via.placeholder.com/150?text=Không+có+ảnh";
                                  }}
                                />
                                {room.images.length > 1 && (
                                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md flex items-center">
                                    <Image className="w-3 h-3 mr-1" />
                                    {room.images.length}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="w-full h-32 rounded-lg overflow-hidden mb-4 bg-gray-100 flex items-center justify-center">
                                <p className="text-gray-400 text-sm">
                                  Không có ảnh
                                </p>
                              </div>
                            )}

                            <div className="text-right">
                              {/* Hiển thị giá gốc và giá khuyến mãi */}
                              {hotel?.promotion ? (
                                <>
                                  <div className="flex items-center justify-end gap-2 mb-1">
                                    <span className="text-sm line-through text-gray-400">
                                      {formatPrice(room.price)}
                                    </span>
                                    <span className="bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full">
                                      {discountText}
                                    </span>
                                  </div>
                                  <p className="text-2xl font-bold text-emerald-600">
                                    {formatPrice(discountedPrice)}
                                  </p>
                                </>
                              ) : (
                                <p className="text-2xl font-bold text-emerald-600">
                                  {formatPrice(room.price)}
                                </p>
                              )}
                              <p className="text-sm text-gray-500 mb-4">/đêm</p>

                              <div className="text-sm text-emerald-700 mb-2">
                                Sức chứa: {room.capacity} người
                              </div>

                              <button
                                onClick={() => handleRoomSelect(room)}
                                className={`w-full py-2 rounded-lg font-semibold transition-colors ${
                                  isRoomSelected(room.id)
                                    ? "bg-emerald-700 text-white"
                                    : bookingDetails.rooms === 1 ||
                                      selectedRooms.length <
                                        bookingDetails.rooms
                                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                    : "bg-gray-300 cursor-not-allowed"
                                }`}
                              >
                                {isRoomSelected(room.id)
                                  ? "Bỏ chọn"
                                  : bookingDetails.rooms === 1
                                  ? "Chọn phòng"
                                  : selectedRooms.length >= bookingDetails.rooms
                                  ? "Đã đủ số phòng"
                                  : "Chọn phòng"}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Mô tả phòng */}
                        {room.description && (
                          <div className="border-t pt-4 mt-2">
                            <h4 className="text-sm font-medium text-gray-700 mb-1">
                              Mô tả:
                            </h4>
                            <p className="text-gray-600 text-sm">
                              {room.description}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      {filteredAndSortedRooms.length === 0 &&
                      hotel.rooms?.length > 0
                        ? "Không tìm thấy phòng phù hợp với bộ lọc"
                        : "Không có phòng nào khả dụng"}
                    </p>
                  </div>
                )}

                {/* Pagination */}
                {totalRoomPages > 1 && (
                  <div className="mt-8 flex justify-center items-center gap-2">
                    {/* Previous Button */}
                    <button
                      onClick={() =>
                        setRoomPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={roomPage === 1}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        roomPage === 1
                          ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    {/* Page Numbers */}
                    <div className="flex gap-1">
                      {Array.from(
                        { length: totalRoomPages },
                        (_, i) => i + 1
                      ).map((pageNum) => {
                        // Hiển thị page đầu, cuối, current và 1 page xung quanh current
                        const showPage =
                          pageNum === 1 ||
                          pageNum === totalRoomPages ||
                          Math.abs(pageNum - roomPage) <= 1;

                        const showEllipsis =
                          (pageNum === 2 && roomPage > 3) ||
                          (pageNum === totalRoomPages - 1 &&
                            roomPage < totalRoomPages - 2);

                        if (showEllipsis) {
                          return (
                            <span
                              key={pageNum}
                              className="px-3 py-2 text-gray-500"
                            >
                              ...
                            </span>
                          );
                        }

                        if (!showPage) return null;

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setRoomPage(pageNum)}
                            className={`px-4 py-2 rounded-lg border transition-colors ${
                              roomPage === pageNum
                                ? "bg-emerald-600 text-white border-emerald-600"
                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    {/* Next Button */}
                    <button
                      onClick={() =>
                        setRoomPage((prev) =>
                          Math.min(totalRoomPages, prev + 1)
                        )
                      }
                      disabled={roomPage === totalRoomPages}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        roomPage === totalRoomPages
                          ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Đánh giá và Bình luận - Giống TransportDetail */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Đánh giá sao */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-2xl font-semibold mb-6">
                Đánh giá khách sạn
              </h2>

              {/* Thống kê rating */}
              <div className="flex items-center gap-8 mb-8 p-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl">
                <div className="text-center">
                  <div className="text-5xl font-bold text-emerald-600 mb-2">
                    {hotel.rating > 0 ? hotel.rating.toFixed(1) : "N/A"}
                  </div>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= Math.round(hotel.rating || 0)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">
                    {hotel.rating_count || 0} đánh giá
                  </p>
                </div>

                <div className="flex-1">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = hotel.rating_breakdown?.[star] || 0;
                    const percentage =
                      hotel.rating_count > 0
                        ? ((count / hotel.rating_count) * 100).toFixed(0)
                        : 0;

                    return (
                      <div key={star} className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-medium w-12">
                          {star} sao
                        </span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-400 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 w-12 text-right">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Form đánh giá - hiện nếu user đã đăng nhập */}
              {currentUserId && onRatingClick && (
                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                  <h3 className="font-semibold mb-4">
                    {hotel.user_has_rated
                      ? "Cập nhật đánh giá của bạn"
                      : "Bạn đánh giá khách sạn này như thế nào?"}
                  </h3>
                  <div className="flex items-center gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => onRatingClick(star)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            star <= (hoverRating || userRating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                          onMouseEnter={() =>
                            setHoverRating && setHoverRating(star)
                          }
                          onMouseLeave={() =>
                            setHoverRating && setHoverRating(0)
                          }
                        />
                      </button>
                    ))}
                    {userRating > 0 && (
                      <span className="ml-2 text-sm font-medium text-gray-700">
                        {userRating}/5 sao
                      </span>
                    )}
                  </div>
                  {ratingError && (
                    <p className="text-red-600 text-sm mb-3">{ratingError}</p>
                  )}
                </div>
              )}

              {/* Thông báo chưa đăng nhập */}
              {!currentUserId && (
                <div className="bg-gray-50 rounded-xl p-4 mb-6 text-center">
                  <p className="text-gray-600">
                    Vui lòng{" "}
                    <button
                      onClick={() => navigate("/login")}
                      className="text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      đăng nhập
                    </button>{" "}
                    để đánh giá khách sạn này
                  </p>
                </div>
              )}
            </div>

            {/* Bình luận */}
            {onAddComment && (
              <CommentSection
                comments={hotel.reviews || []}
                commentCount={hotel.comment_count || 0}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
                likedComments={likedComments}
                onAddComment={onAddComment}
                onEditComment={onEditComment}
                onDeleteComment={onDeleteComment}
                onLikeComment={onLikeComment}
                onReloadComments={onReloadHotel}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modal chi tiết phòng */}
      {showRoomModal && selectedRoom && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
              <h3 className="text-xl font-semibold text-gray-800">
                {selectedRoom.name}
              </h3>
              <button
                onClick={closeRoomModal}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Nội dung */}
            <div className="p-4">
              {/* Slideshow ảnh */}
              <div className="mb-6 relative">
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  {selectedRoom.images && selectedRoom.images.length > 0 ? (
                    <img
                      src={getCurrentImage()}
                      alt={`${selectedRoom.name} - ảnh ${
                        currentImageIndex + 1
                      }`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src =
                          "https://via.placeholder.com/800x500?text=Không+có+ảnh";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <p className="text-gray-400">Không có ảnh</p>
                    </div>
                  )}

                  {/* Nút điều hướng */}
                  {selectedRoom.images && selectedRoom.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 focus:outline-none"
                      >
                        <ChevronLeft className="w-5 h-5 text-gray-700" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 focus:outline-none"
                      >
                        <ChevronRight className="w-5 h-5 text-gray-700" />
                      </button>

                      {/* Thông tin ảnh */}
                      <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md">
                        {currentImageIndex + 1}/{selectedRoom.images.length}
                      </div>
                    </>
                  )}
                </div>

                {/* Thumbnails */}
                {selectedRoom.images && selectedRoom.images.length > 1 && (
                  <div className="flex mt-2 space-x-2 overflow-x-auto pb-2">
                    {selectedRoom.images.map((image, idx) => (
                      <div
                        key={idx}
                        className={`w-20 h-16 rounded-md overflow-hidden flex-shrink-0 cursor-pointer ${
                          idx === currentImageIndex
                            ? "ring-2 ring-emerald-500"
                            : "opacity-70 hover:opacity-100"
                        }`}
                        onClick={() => setCurrentImageIndex(idx)}
                      >
                        <img
                          src={image}
                          alt={`Thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src =
                              "https://via.placeholder.com/80?text=Lỗi";
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Thông tin chi tiết */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-800 mb-3">
                    Thông tin phòng
                  </h4>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-emerald-600" />
                      <span className="text-gray-700">
                        Sức chứa: <strong>{selectedRoom.capacity} người</strong>
                      </span>
                    </div>

                    {selectedRoom.size && (
                      <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-emerald-600" />
                        <span className="text-gray-700">
                          Diện tích: <strong>{selectedRoom.size}m²</strong>
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Bed className="w-5 h-5 text-emerald-600" />
                      <span className="text-gray-700">
                        Giường: <strong>1 giường đôi hoặc 2 giường đơn</strong>
                      </span>
                    </div>

                    {/* Giá và đặt phòng */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Giá phòng mỗi đêm</span>
                        <span className="text-xl font-bold text-emerald-600">
                          {formatPrice(selectedRoom.price)}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          closeRoomModal();
                          handleBooking(selectedRoom);
                        }}
                        className={`w-full py-2 rounded-lg font-semibold transition-colors ${
                          bookingDetails.selectedRoom?.id === selectedRoom.id
                            ? "bg-emerald-700 text-white"
                            : "bg-emerald-600 text-white hover:bg-emerald-700"
                        }`}
                      >
                        {bookingDetails.selectedRoom?.id === selectedRoom.id
                          ? "Đã chọn"
                          : "Chọn phòng"}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-medium text-gray-800 mb-3">
                    Tiện nghi phòng
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedRoom.amenities &&
                    selectedRoom.amenities.length > 0 ? (
                      selectedRoom.amenities.map((amenity, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          {getAmenityIcon(amenity)}
                          <span className="text-gray-600">
                            {getAmenityDisplayName(amenity)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 italic col-span-2">
                        Chưa có thông tin chi tiết về tiện nghi
                      </p>
                    )}
                  </div>

                  {/* Mô tả */}
                  {selectedRoom.description && (
                    <div className="mt-6">
                      <h4 className="text-lg font-medium text-gray-800 mb-2">
                        Mô tả
                      </h4>
                      <p className="text-gray-600">
                        {selectedRoom.description}
                      </p>
                    </div>
                  )}

                  {/* Chính sách phòng */}
                  <div className="mt-6">
                    <h4 className="text-lg font-medium text-gray-800 mb-3">
                      Chính sách phòng
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />
                        <span className="text-gray-600">
                          Miễn phí hủy phòng trước 24h
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />
                        <span className="text-gray-600">
                          Đã bao gồm bữa sáng
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />
                        <span className="text-gray-600">
                          Thanh toán tại khách sạn
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />
                        <span className="text-gray-600">WiFi miễn phí</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />
                        <span className="text-gray-600">
                          Nhận phòng từ 14:00, trả phòng trước 12:00
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HotelDetail;
