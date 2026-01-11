import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { useBreadcrumb } from "../../../contexts/BreadcrumbContext";
import HotelDetail from "./HotelDetail";
import {
  CheckCircle,
  ArrowLeft,
  CreditCard,
  Loader2,
  Users,
  Calendar,
} from "lucide-react";
import axios from "axios";
import { API_URL, API_HOST } from "../../../config/api";

// Alias for backward compatibility
const API_BASE_URL = API_URL;

// Cấu hình URL cơ sở cho axios

const HotelDetailPage = () => {
  const { user } = useAuth();
  const { idOrSlug } = useParams();
  const id = idOrSlug;
  const navigate = useNavigate();
  const location = useLocation();
  const { setDynamicTitle } = useBreadcrumb();
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState("details");
  const [showGuestModal, setShowGuestModal] = useState(false);
  const guestModalRef = useRef(null);

  // Rating and comment states
  const [likedComments, setLikedComments] = useState(new Set());
  const [toast, setToast] = useState(null);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingError, setRatingError] = useState("");

  // Lấy thông tin đặt phòng từ state navigation
  const bookingInfo = location.state?.bookingInfo || {
    checkIn: new Date().toISOString().split("T")[0],
    checkOut: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    guests: { adults: 1, children: 0 },
    rooms: 1,
  };

  // State cho đặt phòng với giá trị mặc định từ bookingInfo
  const [bookingDetails, setBookingDetails] = useState({
    checkIn: bookingInfo.checkIn,
    checkOut: bookingInfo.checkOut,
    guests: bookingInfo.guests,
    rooms: bookingInfo.rooms,
    selectedRoom: null,
  });

  // Thêm state cho tính toán giá
  const [priceDetails, setPriceDetails] = useState({
    basePrice: 0,
    totalNights: 0,
    roomPrice: 0,
    discountAmount: 0,
    finalTotal: 0,
  });

  // Thêm state để quản lý phòng đã chọn
  const [selectedRooms, setSelectedRooms] = useState([]);

  // Fetch hotel data với better error handling
  useEffect(() => {
    const fetchHotelDetail = async () => {
      try {
        setLoading(true);
        setError(null);

        const queryParams = new URLSearchParams();
        if (user?.id) queryParams.append("user_id", user.id);
        if (bookingDetails.checkIn)
          queryParams.append("check_in", bookingDetails.checkIn);
        if (bookingDetails.checkOut)
          queryParams.append("check_out", bookingDetails.checkOut);

        const response = await axios.get(
          `${API_BASE_URL}/hotels/${id}${
            queryParams.toString() ? "?" + queryParams.toString() : ""
          }`
        );

        if (response.data) {
          // Parse các trường JSON nếu cần
          const hotelData = {
            ...response.data,
            images: response.data.images?.map((img) =>
              img.startsWith("http") ? img : `${API_BASE_URL}${img}`
            ),
            amenities:
              typeof response.data.amenities === "string"
                ? JSON.parse(response.data.amenities)
                : response.data.amenities,
            rooms: response.data.hotelrooms?.map((room) => ({
              ...room,
              amenities:
                typeof room.amenities === "string"
                  ? JSON.parse(room.amenities)
                  : room.amenities,
              images: room.images?.map((img) =>
                img.startsWith("http") ? img : `${API_BASE_URL}${img}`
              ),
            })),
          };

          // ✅ Validate dữ liệu trước khi set state
          if (!hotelData.id) {
            throw new Error("Dữ liệu khách sạn không hợp lệ");
          }

          setHotel(hotelData);

          // Set breadcrumb dynamic title
          setDynamicTitle(hotelData.name);

          // Fetch liked comments if user is logged in
          if (user?.id) {
            try {
              const likedResponse = await axios.get(
                `${API_BASE_URL}/reviews/liked`,
                {
                  params: { hotel_id: id },
                  withCredentials: true,
                }
              );
              const likedSet = new Set(
                likedResponse.data.map((r) => r.review_id)
              );
              setLikedComments(likedSet);
            } catch (likedErr) {
              console.error("Error fetching liked comments:", likedErr);
              // Non-critical, don't show error to user
            }
          }
        } else {
          throw new Error("Không nhận được dữ liệu từ server");
        }
      } catch (err) {
        console.error("[DEBUG] Lỗi khi tải thông tin khách sạn:", err);
        const errorMessage =
          err.response?.status === 404
            ? "Không tìm thấy khách sạn"
            : err.response?.data?.error ||
              err.message ||
              "Không thể tải thông tin khách sạn";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchHotelDetail();
    }

    // Clear breadcrumb title when component unmounts
    return () => {
      setDynamicTitle("");
    };
  }, [
    id,
    user?.id,
    bookingDetails.checkIn,
    bookingDetails.checkOut,
    setDynamicTitle,
  ]);

  // Log để debug
  useEffect(() => {}, [location.state, bookingInfo, bookingDetails]);

  // Xử lý thay đổi thông tin đặt phòng
  const handleBookingChange = (field, value) => {
    setBookingDetails((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Tính tổng sức chứa tối đa của các phòng đã chọn
  const getTotalMaxCapacity = () => {
    return selectedRooms.reduce((total, room) => total + room.capacity, 0);
  };

  // Xử lý thay đổi số khách/phòng - Logic cải thiện
  const handleGuestChange = (type, operation) => {
    setBookingDetails((prev) => {
      const newDetails = { ...prev };

      if (type === "rooms") {
        // Xử lý thay đổi số phòng
        const newRooms =
          operation === "add" ? prev.rooms + 1 : Math.max(1, prev.rooms - 1);

        newDetails.rooms = newRooms;

        // Reset selectedRooms nếu giảm số phòng và đã chọn nhiều hơn
        if (selectedRooms.length > newRooms) {
          setSelectedRooms([]);
          showToast(
            "Đã reset danh sách phòng vì thay đổi số phòng. Vui lòng chọn lại.",
            "info"
          );
        }

        // Đảm bảo số người lớn >= số phòng (mỗi phòng ít nhất 1 người lớn)
        if (prev.guests.adults < newRooms) {
          newDetails.guests = { ...prev.guests, adults: newRooms };
        }
      } else {
        // Xử lý thay đổi số người
        const newGuests = { ...prev.guests };

        if (operation === "add") {
          newGuests[type]++;
        } else {
          // Giảm số người
          if (type === "adults") {
            // Không cho phép giảm số người lớn xuống dưới số phòng
            newGuests[type] = Math.max(prev.rooms, newGuests[type] - 1);
          } else {
            // Trẻ em có thể giảm về 0
            newGuests[type] = Math.max(0, newGuests[type] - 1);
          }
        }

        newDetails.guests = newGuests;
      }

      return newDetails;
    });
  };

  // Tính số đêm giữa 2 ngày
  const calculateNights = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Tính toán giá
  const calculatePrices = () => {
    if (!bookingDetails.selectedRoom) return;

    const nights = calculateNights(
      bookingDetails.checkIn,
      bookingDetails.checkOut
    );
    const roomPrice = bookingDetails.selectedRoom.price;

    // Tính tổng giá phòng
    const totalPrice = roomPrice * nights;

    // Tính khuyến mãi nếu có
    let discountAmount = 0;
    let finalTotal = totalPrice;

    if (hotel?.promotion) {
      if (hotel.promotion.type === "percentage") {
        discountAmount = Math.round(
          totalPrice * (hotel.promotion.discount / 100)
        );
      } else {
        discountAmount = Math.min(totalPrice, hotel.promotion.discount); // Không để giá giảm âm
      }
      finalTotal = totalPrice - discountAmount;
    }

    // Cập nhật state
    setPriceDetails({
      basePrice: roomPrice,
      totalNights: nights,
      roomPrice: totalPrice,
      discountAmount,
      finalTotal,
    });
  };

  // Theo dõi thay đổi để tính lại giá
  useEffect(() => {
    calculatePrices();
  }, [
    bookingDetails.selectedRoom,
    bookingDetails.checkIn,
    bookingDetails.checkOut,
    hotel?.promotion,
  ]);

  // Xử lý đặt phòng
  const handleBooking = () => {
    if (!bookingDetails.checkIn || !bookingDetails.checkOut) {
      alert("Vui lòng chọn ngày nhận phòng và trả phòng");
      return;
    }

    if (!bookingDetails.selectedRoom) {
      alert("Vui lòng chọn loại phòng");
      return;
    }

    // Kiểm tra xem đã chọn đủ số phòng chưa
    if (selectedRooms.length < bookingDetails.rooms) {
      showToast(`Vui lòng chọn đủ ${bookingDetails.rooms} phòng`, "warning");
      return;
    }

    // Tính tổng giá cho tất cả phòng đã chọn
    const totalPrice = selectedRooms.reduce((total, room) => {
      const roomPrice = room.price * priceDetails.totalNights;
      return total + roomPrice;
    }, 0);

    // Tính giảm giá nếu có
    let discountAmount = 0;
    let finalTotal = totalPrice;
    if (hotel?.promotion) {
      if (hotel.promotion.type === "percentage") {
        discountAmount = Math.round(
          totalPrice * (hotel.promotion.discount / 100)
        );
      } else {
        discountAmount = Math.min(totalPrice, hotel.promotion.discount);
      }
      finalTotal = totalPrice - discountAmount;
    }

    const bookingInfo = {
      hotel: {
        ...hotel,
        name: hotel.name,
        location: hotel.location,
        images: hotel.images,
        rating: hotel.rating,
        promotion: hotel.promotion,
      },
      rooms: selectedRooms.map((room) => ({
        ...room,
        nights: priceDetails.totalNights,
        basePrice: room.price,
        totalPrice: room.price * priceDetails.totalNights,
      })),
      checkIn: bookingDetails.checkIn,
      checkOut: bookingDetails.checkOut,
      guests: {
        adults: bookingDetails.guests.adults,
        children: bookingDetails.guests.children,
      },
      pricing: {
        totalNights: priceDetails.totalNights,
        baseTotal: totalPrice,
        discountAmount: discountAmount,
        finalTotal: finalTotal,
        promotion: hotel?.promotion,
      },
    };

    // Use slug for SEO-friendly URL, fallback to ID
    const identifier = hotel.slug || hotel.id;
    navigate(`/hotels/${identifier}/booking`, { state: bookingInfo });
  };

  // Format giá
  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
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

  // Xử lý click outside cho modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        guestModalRef.current &&
        !guestModalRef.current.contains(event.target)
      ) {
        setShowGuestModal(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Kiểm tra có thể thêm khách không
  const canAddGuests = (type) => {
    const totalGuests =
      bookingDetails.guests.adults + bookingDetails.guests.children;
    const totalMaxCapacity = getTotalMaxCapacity();

    // Nếu chưa chọn phòng, cho phép thêm tự do (giới hạn tối đa 20 người)
    if (selectedRooms.length === 0) {
      return totalGuests < 20;
    }

    // Nếu đã chọn phòng, kiểm tra sức chứa
    return totalGuests < totalMaxCapacity;
  };

  const canReduceGuests = (type) => {
    if (type === "adults") {
      // Không thể giảm số người lớn xuống dưới số phòng
      return bookingDetails.guests.adults > bookingDetails.rooms;
    }
    return bookingDetails.guests[type] > 0;
  };

  // Component PassengerSelection
  const PassengerSelection = () => {
    const totalGuests =
      bookingDetails.guests.adults + bookingDetails.guests.children;
    const totalMaxCapacity = getTotalMaxCapacity();
    const hasSelectedRooms = selectedRooms.length > 0;

    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowGuestModal(!showGuestModal)}
          className="w-full text-left border border-gray-200 rounded-lg p-3 pl-4 pr-10 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors shadow-sm hover:border-emerald-300 bg-white"
        >
          {`${bookingDetails.guests.adults} người lớn${
            bookingDetails.guests.children > 0
              ? `, ${bookingDetails.guests.children} trẻ em`
              : ""
          } • ${bookingDetails.rooms} phòng`}
        </button>
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-emerald-600 bg-emerald-50 p-1 rounded-full">
          <Users size={18} />
        </div>

        {showGuestModal && (
          <div
            ref={guestModalRef}
            className="absolute z-50 mt-2 w-full bg-white rounded-lg shadow-xl border border-gray-200 p-5 animate-fade-in"
          >
            {/* Số phòng */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="font-medium text-gray-800">Phòng</p>
                {hasSelectedRooms && (
                  <p className="text-xs text-orange-500">
                    *Thay đổi số phòng sẽ reset phòng đã chọn
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleGuestChange("rooms", "subtract")}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={bookingDetails.rooms <= 1}
                >
                  <span className="text-gray-600 font-bold">-</span>
                </button>
                <span className="w-8 text-center font-medium">
                  {bookingDetails.rooms}
                </span>
                <button
                  type="button"
                  onClick={() => handleGuestChange("rooms", "add")}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={bookingDetails.rooms >= 5} // Giới hạn tối đa 5 phòng
                >
                  <span className="text-emerald-600 font-bold">+</span>
                </button>
              </div>
            </div>

            {/* Người lớn */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="font-medium text-gray-800">Người lớn</p>
                <p className="text-sm text-gray-500">Từ 13 tuổi trở lên</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleGuestChange("adults", "subtract")}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!canReduceGuests("adults")}
                  title={
                    !canReduceGuests("adults")
                      ? "Số người lớn không thể ít hơn số phòng"
                      : ""
                  }
                >
                  <span className="text-gray-600 font-bold">-</span>
                </button>
                <span className="w-8 text-center font-medium">
                  {bookingDetails.guests.adults}
                </span>
                <button
                  type="button"
                  onClick={() => handleGuestChange("adults", "add")}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!canAddGuests("adults")}
                  title={
                    !canAddGuests("adults") ? "Đã đạt giới hạn sức chứa" : ""
                  }
                >
                  <span className="text-emerald-600 font-bold">+</span>
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
                  onClick={() => handleGuestChange("children", "subtract")}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!canReduceGuests("children")}
                >
                  <span className="text-gray-600 font-bold">-</span>
                </button>
                <span className="w-8 text-center font-medium">
                  {bookingDetails.guests.children}
                </span>
                <button
                  type="button"
                  onClick={() => handleGuestChange("children", "add")}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!canAddGuests("children")}
                  title={
                    !canAddGuests("children") ? "Đã đạt giới hạn sức chứa" : ""
                  }
                >
                  <span className="text-emerald-600 font-bold">+</span>
                </button>
              </div>
            </div>

            {/* Thông tin sức chứa */}
            {hasSelectedRooms && (
              <div className="mb-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-700 font-medium">
                    Sức chứa đã chọn:
                  </span>
                  <span
                    className={`font-semibold ${
                      totalGuests > totalMaxCapacity
                        ? "text-red-600"
                        : totalGuests === totalMaxCapacity
                        ? "text-emerald-600"
                        : "text-blue-600"
                    }`}
                  >
                    {totalGuests}/{totalMaxCapacity} người
                  </span>
                </div>
                <div className="text-xs text-gray-600 bg-white p-2 rounded">
                  {selectedRooms.map((room, idx) => (
                    <div key={room.id} className="flex justify-between py-1">
                      <span>{room.name}</span>
                      <span className="font-medium">{room.capacity} người</span>
                    </div>
                  ))}
                </div>
                {totalGuests > totalMaxCapacity && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                    <p className="text-xs text-red-600 font-medium">
                      ⚠️ Vượt quá sức chứa! Vui lòng giảm số người hoặc chọn
                      thêm phòng.
                    </p>
                  </div>
                )}
                {totalGuests < totalMaxCapacity &&
                  selectedRooms.length === bookingDetails.rooms && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                      <p className="text-xs text-blue-600">
                        ℹ️ Còn trống {totalMaxCapacity - totalGuests} chỗ trong
                        các phòng đã chọn
                      </p>
                    </div>
                  )}
              </div>
            )}

            {/* Cảnh báo khi chưa chọn phòng */}
            {!hasSelectedRooms && totalGuests > 0 && (
              <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-xs text-yellow-700">
                  💡 Vui lòng chọn phòng phù hợp với {totalGuests} người
                </p>
              </div>
            )}

            <div className="pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowGuestModal(false)}
                className="w-full bg-emerald-600 text-white font-medium py-3 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Xác nhận
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Toast helper
  const showToast = (message, type = "info") => {
    setToast({ message, type });
  };

  // Rating handler
  const handleRatingClick = async (rating) => {
    if (!user?.id) {
      showToast("Vui lòng đăng nhập để đánh giá", "warning");
      return;
    }

    try {
      setUserRating(rating);
      setRatingError("");

      const response = await axios.post(
        `${API_BASE_URL}/hotels/${id}/rating`,
        {
          user_id: user.id,
          rating: rating,
        },
        { withCredentials: true }
      );

      if (response.status === 200) {
        showToast(`Đánh giá ${rating} sao thành công!`, "success");
        reloadHotel();
      }
    } catch (error) {
      console.error("Error rating hotel:", error);
      setRatingError("Có lỗi xảy ra khi đánh giá. Vui lòng thử lại.");
      showToast("Không thể gửi đánh giá. Vui lòng thử lại.", "error");
    }
  };

  // Comment handlers
  const handleAddComment = async ({ comment, parent_id }) => {
    const response = await axios.post(
      `${API_BASE_URL}/hotels/${id}/reviews`,
      {
        user_id: user?.id,
        comment,
        rating: null,
        parent_id,
      },
      { withCredentials: true }
    );

    setHotel({
      ...hotel,
      reviews: [response.data.review, ...(hotel.reviews || [])],
      comment_count: (hotel.comment_count || 0) + 1,
    });
  };

  const handleEditComment = async (reviewId, editedText) => {
    await axios.put(
      `${API_BASE_URL}/reviews/${reviewId}`,
      {
        comment: editedText,
        rating: null,
      },
      { withCredentials: true }
    );

    setHotel({
      ...hotel,
      reviews: hotel.reviews.map((review) =>
        review.id === reviewId
          ? {
              ...review,
              comment: editedText,
            }
          : review
      ),
    });
  };

  const handleDeleteComment = async (reviewId) => {
    await axios.delete(`${API_BASE_URL}/reviews/${reviewId}`, {
      withCredentials: true,
    });

    // Xóa comment và tất cả replies của nó
    setHotel({
      ...hotel,
      reviews: hotel.reviews.filter(
        (review) => review.id !== reviewId && review.parent_id !== reviewId
      ),
      comment_count: Math.max(0, (hotel.comment_count || 0) - 1),
    });
  };

  const handleLikeComment = async (reviewId) => {
    const response = await axios.post(
      `${API_BASE_URL}/reviews/${reviewId}/like`,
      {},
      { withCredentials: true }
    );

    // Update liked state
    if (response.data.liked) {
      setLikedComments((prev) => new Set([...prev, reviewId]));
    } else {
      setLikedComments((prev) => {
        const newSet = new Set(prev);
        newSet.delete(reviewId);
        return newSet;
      });
    }

    // Update likes_count in reviews
    setHotel({
      ...hotel,
      reviews: hotel.reviews.map((review) =>
        review.id === reviewId
          ? {
              ...review,
              likes_count: response.data.liked
                ? (review.likes_count || 0) + 1
                : Math.max(0, (review.likes_count || 0) - 1),
            }
          : review
      ),
    });
  };

  // Reload hotel data (including reviews)
  const reloadHotel = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (user?.id) queryParams.append("user_id", user.id);

      const response = await axios.get(
        `${API_BASE_URL}/hotels/${id}${
          queryParams.toString() ? "?" + queryParams.toString() : ""
        }`
      );

      if (response.data) {
        const hotelData = {
          ...response.data,
          images: response.data.images?.map((img) =>
            img.startsWith("http") ? img : `${API_BASE_URL}${img}`
          ),
          amenities:
            typeof response.data.amenities === "string"
              ? JSON.parse(response.data.amenities)
              : response.data.amenities,
          rooms: response.data.hotelrooms?.map((room) => ({
            ...room,
            amenities:
              typeof room.amenities === "string"
                ? JSON.parse(room.amenities)
                : room.amenities,
            images: room.images?.map((img) =>
              img.startsWith("http") ? img : `${API_BASE_URL}${img}`
            ),
          })),
        };

        setHotel(hotelData);
      }

      // Fetch liked comments if user is logged in
      if (user?.id) {
        const likedResponse = await axios.get(`${API_BASE_URL}/reviews/liked`, {
          params: { hotel_id: id },
          withCredentials: true,
        });
        const likedSet = new Set(likedResponse.data.map((r) => r.review_id));
        setLikedComments(likedSet);
      }
    } catch (err) {
      console.error("Error reloading hotel:", err);
      showToast("Không thể tải lại dữ liệu", "error");
    }
  };

  // Kiểm tra có thể tiếp tục đặt phòng không (chỉ kiểm tra điều kiện bắt buộc)
  const canProceedBooking = () => {
    // Phải có ngày nhận và trả phòng
    if (!bookingDetails.checkIn || !bookingDetails.checkOut) {
      return false;
    }

    // Phải chọn ít nhất 1 phòng
    if (selectedRooms.length === 0) {
      return false;
    }

    // Phải chọn đủ số phòng đã yêu cầu
    if (selectedRooms.length < bookingDetails.rooms) {
      return false;
    }

    return true;
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
          <h1 className="text-2xl font-bold">Chi tiết khách sạn</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <HotelDetail
                hotel={hotel}
                bookingDetails={bookingDetails}
                onBookingChange={handleBookingChange}
                onGuestChange={handleGuestChange}
                onRoomSelect={(room) =>
                  handleBookingChange("selectedRoom", room)
                }
                selectedTab={selectedTab}
                setSelectedTab={setSelectedTab}
                selectedRooms={selectedRooms}
                setSelectedRooms={setSelectedRooms}
                // Rating & Review props
                currentUserId={user?.id}
                isAdmin={user?.role === "admin"}
                likedComments={likedComments}
                toast={toast}
                showToast={showToast}
                onAddComment={handleAddComment}
                onEditComment={handleEditComment}
                onDeleteComment={handleDeleteComment}
                onLikeComment={handleLikeComment}
                onReloadHotel={reloadHotel}
                onRatingClick={handleRatingClick}
                userRating={userRating}
                hoverRating={hoverRating}
                setHoverRating={setHoverRating}
                ratingError={ratingError}
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-1">
            {/* Booking Card */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Đặt phòng ngay</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nhận phòng
                  </label>
                  <div className="relative group">
                    <input
                      type="date"
                      value={bookingDetails.checkIn}
                      onChange={(e) =>
                        handleBookingChange("checkIn", e.target.value)
                      }
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full border border-gray-200 rounded-lg p-3 pl-4 pr-10 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:border-emerald-300 hover:shadow-md cursor-pointer bg-white"
                      required
                    />
                    <Calendar
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-emerald-600 bg-emerald-50 p-1 rounded-full pointer-events-none group-hover:bg-emerald-100 transition-colors"
                      size={18}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trả phòng
                  </label>
                  <div className="relative group">
                    <input
                      type="date"
                      value={bookingDetails.checkOut}
                      onChange={(e) =>
                        handleBookingChange("checkOut", e.target.value)
                      }
                      min={bookingDetails.checkIn}
                      className="w-full border border-gray-200 rounded-lg p-3 pl-4 pr-10 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:border-emerald-300 hover:shadow-md cursor-pointer bg-white"
                      required
                    />
                    <Calendar
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-emerald-600 bg-emerald-50 p-1 rounded-full pointer-events-none group-hover:bg-emerald-100 transition-colors"
                      size={18}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số khách & phòng
                  </label>
                  <PassengerSelection />
                </div>
              </div>
            </div>

            {/* Booking Summary */}
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">
              <h3 className="text-xl font-semibold mb-4">Tóm tắt đặt phòng</h3>
              <div className="space-y-4">
                {/* Thông tin khách sạn */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tên khách sạn</span>
                    <span className="font-medium">{hotel?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Địa điểm</span>
                    <span className="font-medium">{hotel?.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nhận phòng</span>
                    <span className="font-medium">
                      {bookingDetails.checkIn
                        ? formatDate(bookingDetails.checkIn)
                        : "Chưa chọn"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trả phòng</span>
                    <span className="font-medium">
                      {bookingDetails.checkOut
                        ? formatDate(bookingDetails.checkOut)
                        : "Chưa chọn"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Số đêm</span>
                    <span className="font-medium">
                      {calculateNights(
                        bookingDetails.checkIn,
                        bookingDetails.checkOut
                      )}{" "}
                      đêm
                    </span>
                  </div>
                </div>

                {/* Thông tin phòng và khách */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-gray-600">Số phòng đã chọn</span>
                      <div className="text-right">
                        <p className="font-medium">
                          {selectedRooms.length}/{bookingDetails.rooms} phòng
                        </p>
                        {selectedRooms.length > 0 && (
                          <div className="text-sm text-gray-500 mt-1">
                            {selectedRooms.map((room, index) => (
                              <p key={room.id}>
                                {room.name} ({room.capacity} người)
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-gray-600">Số khách</span>
                      <div className="text-right">
                        <p className="font-medium">
                          {bookingDetails.guests.adults} người lớn
                          {bookingDetails.guests.children > 0 && (
                            <span>
                              , {bookingDetails.guests.children} trẻ em
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500">
                          Tổng:{" "}
                          {bookingDetails.guests.adults +
                            bookingDetails.guests.children}{" "}
                          người
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-gray-600">Sức chứa</span>
                      <div className="text-right">
                        <p
                          className={`font-medium ${
                            selectedRooms.length > 0 &&
                            bookingDetails.guests.adults +
                              bookingDetails.guests.children >
                              getTotalMaxCapacity()
                              ? "text-red-600"
                              : "text-emerald-600"
                          }`}
                        >
                          {selectedRooms.length > 0
                            ? `${getTotalMaxCapacity()} người`
                            : "Chưa chọn phòng"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chi tiết giá */}
                {selectedRooms.length > 0 && (
                  <div className="border-t border-gray-200 pt-4">
                    <div className="space-y-2">
                      {/* Giá từng phòng */}
                      {selectedRooms.map((room) => {
                        const nights = calculateNights(
                          bookingDetails.checkIn,
                          bookingDetails.checkOut
                        );
                        const roomTotal = room.price * nights;
                        let discountAmount = 0;
                        let finalRoomPrice = roomTotal;

                        if (hotel?.promotion) {
                          if (hotel.promotion.type === "percentage") {
                            discountAmount = Math.round(
                              roomTotal * (hotel.promotion.discount / 100)
                            );
                          } else {
                            discountAmount = Math.min(
                              roomTotal,
                              hotel.promotion.discount
                            );
                          }
                          finalRoomPrice = roomTotal - discountAmount;
                        }

                        return (
                          <div key={room.id} className="space-y-1">
                            <div className="flex justify-between text-gray-600">
                              <span>{room.name}</span>
                              <span>
                                {formatPrice(room.price)} × {nights} đêm
                              </span>
                            </div>
                            {hotel?.promotion && (
                              <div className="flex justify-between text-orange-600 text-sm">
                                <span>Giảm giá</span>
                                <span>-{formatPrice(discountAmount)}</span>
                              </div>
                            )}
                            <div className="flex justify-between font-medium">
                              <span>Thành tiền</span>
                              <span>{formatPrice(finalRoomPrice)}</span>
                            </div>
                          </div>
                        );
                      })}

                      {/* Tổng cộng */}
                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <div className="flex justify-between text-lg font-semibold">
                          <span>Tổng cộng</span>
                          <span className="text-emerald-600">
                            {formatPrice(
                              selectedRooms.reduce((total, room) => {
                                const nights = calculateNights(
                                  bookingDetails.checkIn,
                                  bookingDetails.checkOut
                                );
                                const roomTotal = room.price * nights;
                                let finalPrice = roomTotal;

                                if (hotel?.promotion) {
                                  if (hotel.promotion.type === "percentage") {
                                    finalPrice =
                                      roomTotal *
                                      (1 - hotel.promotion.discount / 100);
                                  } else {
                                    finalPrice = Math.max(
                                      0,
                                      roomTotal - hotel.promotion.discount
                                    );
                                  }
                                }

                                return total + finalPrice;
                              }, 0)
                            )}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          * Không mất phí khi đặt phòng
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Nút đặt phòng */}
                <button
                  onClick={() => {
                    if (canProceedBooking()) {
                      handleBooking();
                    } else if (selectedRooms.length === 0) {
                      setSelectedTab("rooms");
                      const roomsSection =
                        document.querySelector("#rooms-section");
                      if (roomsSection) {
                        roomsSection.scrollIntoView({ behavior: "smooth" });
                      }
                    }
                  }}
                  disabled={!canProceedBooking()}
                  className={`w-full py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                    canProceedBooking()
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {selectedRooms.length === 0 ? (
                    <>
                      <ArrowLeft size={20} />
                      Chọn phòng
                    </>
                  ) : selectedRooms.length < bookingDetails.rooms ? (
                    <>
                      <ArrowLeft size={20} />
                      Chọn thêm {bookingDetails.rooms -
                        selectedRooms.length}{" "}
                      phòng
                    </>
                  ) : (
                    <>
                      <CreditCard size={20} />
                      Tiếp tục đặt phòng
                    </>
                  )}
                </button>

                {/* Cảnh báo sức chứa nếu có */}
                {selectedRooms.length > 0 &&
                  bookingDetails.guests.adults +
                    bookingDetails.guests.children >
                    selectedRooms.reduce(
                      (total, room) => total + room.capacity,
                      0
                    ) && (
                    <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex items-start gap-2">
                        <svg
                          className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5"
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
                          <p className="text-sm font-medium text-orange-800">
                            Lưu ý về sức chứa
                          </p>
                          <p className="text-sm text-orange-700 mt-1">
                            Sức chứa tối đa của các phòng đã chọn (
                            {selectedRooms.reduce(
                              (total, room) => total + room.capacity,
                              0
                            )}{" "}
                            người) không đủ cho{" "}
                            {bookingDetails.guests.adults +
                              bookingDetails.guests.children}{" "}
                            khách. Vui lòng chọn thêm phòng hoặc điều chỉnh số
                            khách.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelDetailPage;
