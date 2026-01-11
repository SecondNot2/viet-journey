import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../../contexts/AuthContext";
import { useBreadcrumb } from "../../../contexts/BreadcrumbContext";
import CommentSection from "../../common/CommentSection";
import ConfirmModal from "../../common/ConfirmModal";
import Toast from "../../common/Toast";
import { API_URL, API_HOST } from "../../../config/api";
import {
  MapPin,
  Clock,
  Calendar,
  Users,
  Info,
  CheckCircle,
  DollarSign,
  Phone,
  Mail,
  AlertCircle,
  Star,
  Heart,
  Share2,
  ChevronLeft,
  Baby,
  User,
  Plus,
  Minus,
  X,
  Bus,
  Hotel,
  Utensils,
  Activity,
  Mountain,
  Compass,
  Building2,
  Loader2,
  ArrowLeft,
  Send,
  ThumbsUp,
  Tag,
  BadgePercent,
  Waves,
  Landmark,
  UserCheck,
  CalendarCheck,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const TourDetail = () => {
  const { user } = useAuth();
  const { idOrSlug } = useParams();
  const id = idOrSlug;
  const navigate = useNavigate();
  const { setDynamicTitle } = useBreadcrumb();
  const guestModalRef = useRef(null);
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState("details");
  const [selectedDay, setSelectedDay] = useState(1);
  const [expandedSchedule, setExpandedSchedule] = useState(null);
  const [bookingDetails, setBookingDetails] = useState({
    startDate: new Date().toISOString().split("T")[0],
    guests: {
      adults: 1,
      children: 0,
      infants: 0,
    },
  });
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showPassengerModal, setShowPassengerModal] = useState(false);
  const [passengerError, setPassengerError] = useState("");
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewError, setReviewError] = useState(null);

  // State cho form đánh giá
  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: "",
  });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewSubmitError, setReviewSubmitError] = useState(null);
  const [likedReviews, setLikedReviews] = useState(new Set()); // Track liked reviews

  // Toast state
  const [toast, setToast] = useState(null);

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    type: "danger",
  });

  // Helper function for image URLs
  const getImageUrl = (imagePath) => {
    if (!imagePath) return `${API_HOST}/images/placeholder.png`;
    if (imagePath.startsWith("http")) return imagePath; // Absolute URL
    if (imagePath.startsWith("/uploads")) return `${API_HOST}${imagePath}`;
    return `${API_HOST}/${imagePath.replace(/^\/+/, "")}`;
  };

  // State for image carousel
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Rating states
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingError, setRatingError] = useState("");

  // State cho booking summary
  const [bookingSummary, setBookingSummary] = useState({
    basePrice: 0,
    totalPrice: 0,
    discount: 0,
    totalDays: 0,
  });

  // Toast helper
  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  // Hàm tính tổng số khách
  const getTotalGuests = () => {
    return bookingDetails.guests.adults + bookingDetails.guests.children;
  };

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

  // Hàm xử lý toggle chi tiết lịch trình
  const toggleScheduleDetails = (index) => {
    setExpandedSchedule(expandedSchedule === index ? null : index);
  };

  useEffect(() => {
    const fetchTourDetail = async () => {
      try {
        setLoading(true);

        // Truyền selected_date nếu có
        const params = {};
        if (bookingDetails.startDate) {
          params.selected_date = bookingDetails.startDate;
        }

        const response = await axios.get(`${API_URL}/tours/${id}`, {
          params,
        });

        // Debug log để kiểm tra dữ liệu tour
        console.debug("[DEBUG] Tour Detail - Response data:", {
          id: response.data.id,
          title: response.data.title,
          price: response.data.price,
          priceType: typeof response.data.price,
          duration: response.data.duration,
          durationType: typeof response.data.duration,
          included_services: response.data.included_services,
          excluded_services: response.data.excluded_services,
          start_dates: response.data.start_dates,
          rating: response.data.rating,
          review_count: response.data.review_count,
          available_seats: response.data.available_seats,
          total_booked: response.data.total_booked,
        });

        setTour(response.data);

        // Set breadcrumb dynamic title
        setDynamicTitle(response.data.title);

        updateBookingSummary(response.data, bookingDetails);
        setError(null);
      } catch (err) {
        console.error("Lỗi khi lấy thông tin tour:", err);
        setError("Không thể tải thông tin tour. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchTourDetail();

    // Clear breadcrumb title when component unmounts
    return () => {
      setDynamicTitle("");
    };
  }, [id, bookingDetails.startDate, setDynamicTitle]); // Re-fetch when date changes

  // Cập nhật booking summary khi thông tin đặt tour thay đổi
  const updateBookingSummary = (tourData, details) => {
    if (!tourData) return;

    const basePrice = tourData.price;
    let totalPrice =
      basePrice * details.guests.adults +
      basePrice * 0.7 * details.guests.children;
    let discount = 0;

    if (tourData.promotions && tourData.promotions.length > 0) {
      const promotion = tourData.promotions[0];
      if (promotion.type === "percentage") {
        discount = totalPrice * (promotion.discount / 100);
      } else {
        discount = Math.min(promotion.discount, totalPrice);
      }
      totalPrice -= discount;
    }

    // Duration is already in days in database
    const totalDays =
      typeof tourData.duration === "string"
        ? parseInt(tourData.duration)
        : tourData.duration;

    setBookingSummary({
      basePrice,
      totalPrice,
      discount,
      totalDays,
    });
  };

  const handleGuestChange = (type, value) => {
    // Kiểm tra min_age cho trẻ em
    if (type === "children") {
      if (tour?.min_age > 11) {
        setPassengerError("Tour này không dành cho trẻ em dưới 12 tuổi");
        return;
      }
    }

    const newGuests = {
      ...bookingDetails.guests,
      [type]: Math.max(0, value),
    };

    // Kiểm tra tổng số khách với available_seats
    const totalGuests = Object.values(newGuests).reduce((a, b) => a + b, 0);
    const maxAvailableSeats =
      tour?.available_seats !== undefined
        ? tour.available_seats
        : getMaxGroupSize(tour?.group_size);

    if (totalGuests > maxAvailableSeats) {
      setPassengerError(
        `Số lượng khách không thể vượt quá ${maxAvailableSeats} người (còn lại)`
      );
      return;
    }

    setPassengerError(""); // Xóa thông báo lỗi nếu không có lỗi
    setBookingDetails((prev) => ({
      ...prev,
      guests: newGuests,
    }));
    updateBookingSummary(tour, { ...bookingDetails, guests: newGuests });
  };

  const handleDateChange = (date) => {
    setBookingDetails((prev) => ({
      ...prev,
      startDate: date,
    }));
  };

  // Xử lý đánh giá
  const handleReviewChange = (e) => {
    const { name, value } = e.target;
    setNewReview((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRatingChange = (rating) => {
    setNewReview((prev) => ({
      ...prev,
      rating,
    }));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate("/login");
      return;
    }

    if (!newReview.comment.trim()) {
      setReviewSubmitError("Vui lòng nhập nội dung đánh giá");
      return;
    }

    setSubmittingReview(true);
    setReviewSubmitError(null);

    try {
      const response = await axios.post(
        `${API_URL}/tours/${id}/reviews`,
        {
          user_id: user.id,
          rating: newReview.rating,
          comment: newReview.comment,
        },
        { withCredentials: true }
      );

      const newReviewData = {
        id: response.data.review_id,
        rating: newReview.rating,
        comment: newReview.comment,
        created_at: new Date().toISOString(),
        likes_count: 0,
        user: {
          id: user.id,
          username: user.username,
          full_name: user.full_name || user.username,
          avatar: user.avatar || null,
        },
      };

      setReviews([newReviewData, ...reviews]);
      setNewReview({ rating: 5, comment: "" });
      setReviewSuccess(true);

      // Reload tour to update rating stats
      const tourResponse = await axios.get(`${API_URL}/tours/${id}`);
      setTour(tourResponse.data);

      setTimeout(() => {
        setReviewSuccess(false);
      }, 3000);
    } catch (err) {
      console.error("Lỗi khi gửi đánh giá:", err);
      setReviewSubmitError(
        err.response?.data?.error || "Có lỗi xảy ra khi gửi đánh giá"
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  // Handler for liking/unliking a review
  const handleLikeReview = async (reviewId) => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/tours/${id}/reviews/${reviewId}/like`,
        { user_id: user.id },
        { withCredentials: true }
      );

      // Update liked reviews state
      const newLikedReviews = new Set(likedReviews);
      if (response.data.liked) {
        newLikedReviews.add(reviewId);
      } else {
        newLikedReviews.delete(reviewId);
      }
      setLikedReviews(newLikedReviews);

      // Update reviews list with new like count
      setReviews(
        reviews.map((review) => {
          if (review.id === reviewId) {
            return {
              ...review,
              likes_count: response.data.liked
                ? (review.likes_count || 0) + 1
                : Math.max(0, (review.likes_count || 0) - 1),
            };
          }
          return review;
        })
      );
    } catch (err) {
      console.error("Error liking review:", err);
      showToast("Có lỗi xảy ra khi thích đánh giá", "error");
    }
  };

  // Handler for rating tour
  const handleRatingClick = async (rating) => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      await axios.post(
        `${API_URL}/tours/${id}/rating`,
        {
          rating,
          user_id: user.id,
        },
        { withCredentials: true }
      );

      setUserRating(rating);
      setRatingError("");
      showToast("Cảm ơn bạn đã đánh giá!", "success");

      // Reload tour to update rating
      const response = await axios.get(`${API_URL}/tours/${id}`);
      setTour(response.data);
    } catch (err) {
      console.error("Error rating tour:", err);
      setRatingError("Có lỗi xảy ra khi gửi đánh giá");
      showToast("Có lỗi xảy ra khi gửi đánh giá", "error");
    }
  };

  // Handler for adding comment (using CommentSection)
  const handleAddComment = async (commentData) => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      // CommentSection passes { comment, parent_id } object
      const { comment, parent_id } =
        typeof commentData === "string"
          ? { comment: commentData, parent_id: null }
          : commentData;

      const response = await axios.post(
        `${API_URL}/tours/${id}/reviews`,
        {
          comment,
          parent_id,
          user_id: user.id,
        },
        { withCredentials: true }
      );

      showToast("Bình luận đã được thêm thành công!", "success");

      // Reload reviews
      const reviewsResponse = await axios.get(`${API_URL}/tours/${id}/reviews`);
      setReviews(reviewsResponse.data.reviews || []);

      return response.data;
    } catch (err) {
      console.error("Error adding comment:", err);
      showToast("Có lỗi xảy ra khi thêm bình luận", "error");
      throw err;
    }
  };

  // Handler for editing comment
  const handleEditComment = async (commentId, commentText) => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      await axios.put(
        `${API_URL}/tours/${id}/reviews/${commentId}`,
        {
          comment: commentText,
          user_id: user.id,
        },
        { withCredentials: true }
      );

      showToast("Bình luận đã được cập nhật!", "success");

      // Reload reviews
      const reviewsResponse = await axios.get(`${API_URL}/tours/${id}/reviews`);
      setReviews(reviewsResponse.data.reviews || []);
    } catch (err) {
      console.error("Error editing comment:", err);
      showToast("Có lỗi xảy ra khi sửa bình luận", "error");
      throw err;
    }
  };

  // Handler for deleting comment
  const handleDeleteComment = async (commentId) => {
    if (!user) {
      navigate("/login");
      return;
    }

    // Show confirm modal
    setConfirmModal({
      isOpen: true,
      title: "Xóa bình luận",
      message: "Bạn có chắc chắn muốn xóa bình luận này?",
      type: "danger",
      onConfirm: async () => {
        try {
          await axios.delete(`${API_URL}/tours/${id}/reviews/${commentId}`, {
            data: { user_id: user.id },
            withCredentials: true,
          });

          showToast("Bình luận đã được xóa!", "success");

          // Reload reviews and liked reviews
          const reviewsResponse = await axios.get(
            `${API_URL}/tours/${id}/reviews`
          );
          setReviews(reviewsResponse.data.reviews || []);

          if (user) {
            const likedResponse = await axios.get(
              `${API_URL}/tours/${id}/reviews/liked`,
              { params: { user_id: user.id } }
            );
            setLikedReviews(new Set(likedResponse.data.liked_reviews || []));
          }

          setConfirmModal({ ...confirmModal, isOpen: false });
        } catch (err) {
          console.error("Error deleting comment:", err);
          showToast("Có lỗi xảy ra khi xóa bình luận", "error");
          setConfirmModal({ ...confirmModal, isOpen: false });
        }
      },
    });
  };

  // Handler for liking comment (reuse handleLikeReview)
  const handleLikeComment = handleLikeReview;

  // Handler for reloading tour data
  const handleReloadTour = async () => {
    try {
      const response = await axios.get(`${API_URL}/tours/${id}`);
      setTour(response.data);

      const reviewsResponse = await axios.get(`${API_URL}/tours/${id}/reviews`);
      setReviews(reviewsResponse.data.reviews || []);

      // Reload liked reviews and user rating if user is logged in
      if (user) {
        const likedResponse = await axios.get(
          `${API_URL}/tours/${id}/reviews/liked`,
          { params: { user_id: user.id } }
        );
        setLikedReviews(new Set(likedResponse.data.liked_reviews || []));

        const ratingResponse = await axios.get(
          `${API_URL}/tours/${id}/rating`,
          { params: { user_id: user.id } }
        );
        setUserRating(ratingResponse.data.rating || 0);
      }
    } catch (err) {
      console.error("Error reloading tour:", err);
    }
  };

  const handleBooking = () => {
    // Validate booking
    if (!bookingDetails.startDate) {
      alert("Vui lòng chọn ngày khởi hành");
      return;
    }

    const totalGuests = Object.values(bookingDetails.guests).reduce(
      (a, b) => a + b,
      0
    );
    if (totalGuests === 0) {
      alert("Vui lòng chọn số lượng khách");
      return;
    }

    // Use slug for SEO-friendly URL, fallback to ID
    const identifier = tour.slug || tour.id;
    navigate(`/tours/${identifier}/booking`, {
      state: {
        tour,
        bookingDetails,
        summary: bookingSummary,
      },
    });
  };

  // Lấy đánh giá của tour (load immediately when tour is loaded)
  useEffect(() => {
    if (id && tour) {
      setReviewsLoading(true);

      // Fetch reviews
      const reviewsPromise = axios.get(`${API_URL}/tours/${id}/reviews`);

      // Fetch liked reviews if user is logged in
      const likedPromise = user
        ? axios.get(`${API_URL}/tours/${id}/reviews/liked`, {
            params: { user_id: user.id },
          })
        : Promise.resolve({ data: { liked_reviews: [] } });

      // Fetch user's rating if user is logged in
      const ratingPromise = user
        ? axios.get(`${API_URL}/tours/${id}/rating`, {
            params: { user_id: user.id },
          })
        : Promise.resolve({ data: { rating: null } });

      Promise.all([reviewsPromise, likedPromise, ratingPromise])
        .then(([reviewsResponse, likedResponse, ratingResponse]) => {
          setReviews(reviewsResponse.data.reviews || reviewsResponse.data);
          setLikedReviews(new Set(likedResponse.data.liked_reviews || []));
          setUserRating(ratingResponse.data.rating || 0);
          setReviewsLoading(false);
        })
        .catch((err) => {
          console.error("Lỗi khi lấy đánh giá tour:", err);
          setReviewError("Không thể tải đánh giá. Vui lòng thử lại sau.");
          setReviewsLoading(false);
        });
    }
  }, [id, tour, user]);

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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-gray-600">Đang tải thông tin tour...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg text-gray-600">{error}</p>
          <button
            onClick={() => navigate("/tours")}
            className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
          >
            Quay lại danh sách tour
          </button>
        </div>
      </div>
    );
  }

  // Redirect if no tour data
  if (!tour) {
    navigate("/tours");
    return null;
  }

  // Helper functions
  const formatPrice = (price) => {
    // Convert to number if it's a string
    const numPrice = typeof price === "string" ? parseFloat(price) : price;

    // Check if it's a valid number
    if (
      typeof numPrice !== "number" ||
      isNaN(numPrice) ||
      numPrice === null ||
      numPrice === undefined
    ) {
      return "Liên hệ";
    }

    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(numPrice);
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

  const formatDuration = (duration) => {
    // Duration is stored as DAYS in database (not minutes)
    if (!duration || duration === 0) return "0 ngày";

    // Convert to number if it's a string
    const days = typeof duration === "string" ? parseInt(duration) : duration;

    if (isNaN(days)) return "0 ngày";

    // If duration is less than 1, assume it's in days with decimal (e.g., 0.5 days = 12 hours)
    if (days < 1) {
      const hours = Math.round(days * 24);
      return `${hours} giờ`;
    }

    return `${days} ngày`;
  };

  const formatTime = (time) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    return `${hours}:${minutes}`;
  };

  const getDuration = (start, end) => {
    const startDate = new Date(`2000-01-01T${start}`);
    const endDate = new Date(`2000-01-01T${end}`);
    const duration = Math.floor((endDate - startDate) / 1000);
    return formatDuration(duration);
  };

  // Booking Summary Card Component
  const BookingSummaryCard = () => (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold">Tóm tắt đặt tour</h3>
      </div>

      <div className="p-6 max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar">
        {/* Chọn ngày */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              Ngày khởi hành
            </label>
            <span className="text-xs text-gray-500">
              {tour?.start_dates?.length || 0} ngày có sẵn
            </span>
          </div>
          <div className="relative">
            <select
              value={bookingDetails.startDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full p-2.5 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white appearance-none cursor-pointer"
            >
              {tour?.start_dates?.map((date, index) => (
                <option key={`${date}-${index}`} value={date}>
                  {formatDate(date)}
                </option>
              ))}
            </select>
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Số lượng khách */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-gray-700">
              Số lượng khách
            </label>
          </div>
          <div className="relative z-50">
            <button
              onClick={() => setShowPassengerModal(!showPassengerModal)}
              className="w-full text-left border border-gray-200 rounded-lg p-3 pl-4 pr-10 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors shadow-sm hover:border-emerald-300 bg-white"
            >
              {`${bookingDetails.guests.adults} người lớn${
                bookingDetails.guests.children > 0
                  ? `, ${bookingDetails.guests.children} trẻ em`
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
                        onClick={() =>
                          handleGuestChange(
                            "adults",
                            bookingDetails.guests.adults - 1
                          )
                        }
                        className={`w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          bookingDetails.guests.adults <= 1
                            ? "border-gray-200 text-gray-300"
                            : "border-gray-300 hover:bg-gray-100"
                        }`}
                        disabled={bookingDetails.guests.adults <= 1}
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-8 text-center font-medium">
                        {bookingDetails.guests.adults}
                      </span>
                      <button
                        onClick={() =>
                          handleGuestChange(
                            "adults",
                            bookingDetails.guests.adults + 1
                          )
                        }
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={
                          getTotalGuests() >=
                          (tour?.available_seats !== undefined
                            ? tour.available_seats
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
                        onClick={() =>
                          handleGuestChange(
                            "children",
                            bookingDetails.guests.children - 1
                          )
                        }
                        className={`w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          bookingDetails.guests.children <= 0
                            ? "border-gray-200 text-gray-300"
                            : "border-gray-300 hover:bg-gray-100"
                        }`}
                        disabled={bookingDetails.guests.children <= 0}
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-8 text-center font-medium">
                        {bookingDetails.guests.children}
                      </span>
                      <button
                        onClick={() =>
                          handleGuestChange(
                            "children",
                            bookingDetails.guests.children + 1
                          )
                        }
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={
                          getTotalGuests() >=
                            (tour?.available_seats !== undefined
                              ? tour.available_seats
                              : getMaxGroupSize(tour?.group_size)) ||
                          tour?.min_age > 11
                        }
                        title={
                          tour?.min_age > 11
                            ? "Tour này không dành cho trẻ em dưới 12 tuổi"
                            : ""
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
                      <p className="text-xs text-emerald-700 mb-1">Chỗ trống</p>
                      <p className="text-2xl font-bold text-emerald-800">
                        {tour?.available_seats !== undefined
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
                          (tour?.available_seats !== undefined
                            ? tour.available_seats
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
                  {tour?.available_seats === 0 && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs text-red-900 font-medium text-center flex items-center justify-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Ngày {formatDate(bookingDetails.startDate)} đã hết chỗ.
                        Vui lòng chọn ngày khác.
                      </p>
                    </div>
                  )}
                  {getTotalGuests() >
                    (tour?.available_seats !== undefined
                      ? tour.available_seats
                      : getMaxGroupSize(tour?.group_size)) && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs text-red-700 font-medium text-center">
                        ⚠️ Vượt quá số lượng còn nhận
                      </p>
                    </div>
                  )}
                  {getTotalGuests() ===
                    (tour?.available_seats !== undefined
                      ? tour.available_seats
                      : getMaxGroupSize(tour?.group_size)) &&
                    tour?.available_seats > 0 && (
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
                      (tour?.available_seats !== undefined
                        ? tour.available_seats
                        : getMaxGroupSize(tour?.group_size))
                  }
                  className={`w-full font-medium py-2 rounded-lg transition-colors ${
                    getTotalGuests() === 0 ||
                    getTotalGuests() >
                      (tour?.available_seats !== undefined
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

        {/* Thông tin tour */}
        <div className="mb-6 bg-gray-50 p-4 rounded-lg space-y-3">
          <div className="flex items-center gap-2 text-gray-700">
            <Clock className="w-5 h-5 text-emerald-600" />
            <span>Thời gian: {formatDuration(tour?.duration)}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <MapPin className="w-5 h-5 text-emerald-600" />
            <span>Điểm đến: {tour?.destination_name}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <Mountain className="w-5 h-5 text-emerald-600" />
            <span>
              Độ khó:{" "}
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
          <div className="flex items-center gap-2 text-gray-700">
            <UserCheck className="w-5 h-5 text-emerald-600" />
            <span>Hướng dẫn viên: {tour?.guide_name || "Đang cập nhật"}</span>
          </div>
        </div>

        {/* Chi tiết giá */}
        <div className="border-t pt-4 space-y-3">
          <div className="flex justify-between text-gray-600">
            <span>
              Người lớn ({bookingDetails.guests.adults} x{" "}
              {formatPrice(tour?.price)})
            </span>
            <span>
              {formatPrice(tour?.price * bookingDetails.guests.adults)}
            </span>
          </div>
          {bookingDetails.guests.children > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>
                Trẻ em ({bookingDetails.guests.children} x{" "}
                {formatPrice(tour?.price * 0.7)})
              </span>
              <span>
                {formatPrice(
                  tour?.price * 0.7 * bookingDetails.guests.children
                )}
              </span>
            </div>
          )}
          {tour?.promotions?.length > 0 && (
            <div className="flex justify-between text-orange-600">
              <span className="flex items-center gap-1">
                <BadgePercent className="w-4 h-4" />
                Giảm giá{" "}
                {tour.promotions[0].type === "percentage"
                  ? `${tour.promotions[0].discount}%`
                  : formatPrice(tour.promotions[0].discount)}
              </span>
              <span>-{formatPrice(bookingSummary.discount)}</span>
            </div>
          )}
        </div>

        <div className="flex justify-between font-bold text-lg mt-4 pt-4 border-t">
          <span>Tổng cộng</span>
          <span className="text-emerald-600">
            {formatPrice(bookingSummary.totalPrice)}
          </span>
        </div>

        {/* Nút đặt tour */}
        <button
          onClick={handleBooking}
          disabled={
            getTotalGuests() === 0 ||
            (tour?.available_seats !== undefined && tour.available_seats === 0)
          }
          className={`w-full mt-6 py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2
          ${
            getTotalGuests() === 0 ||
            (tour?.available_seats !== undefined && tour.available_seats === 0)
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-emerald-600 text-white hover:bg-emerald-700"
          } transition-colors`}
        >
          <DollarSign className="w-5 h-5" />
          {tour?.available_seats === 0
            ? "Ngày này đã hết chỗ"
            : "Đặt tour ngay"}
        </button>

        {/* Cảnh báo khi hết chỗ */}
        {tour?.available_seats === 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-red-900">
                  Ngày {formatDate(bookingDetails.startDate)} đã hết chỗ
                </p>
                <p className="text-red-700 mt-1">
                  Vui lòng chọn ngày khởi hành khác để tiếp tục đặt tour.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Thông tin thêm */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 justify-center text-sm text-gray-500">
            <Info className="w-4 h-4" />
            <span>Hỗ trợ đặt tour 24/7</span>
          </div>
          <div className="text-center text-xs text-gray-500 space-y-1">
            <p>Giá đã bao gồm thuế và phí</p>
            <p>Thanh toán khi đặt tour: 50%</p>
            {tour?.promotions?.length > 0 && (
              <p className="text-orange-600">
                * Ưu đãi còn đến: {formatDate(tour.promotions[0].end_date)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #10b981;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #059669;
        }
      `}</style>

      {/* Hero Section */}
      <div className="bg-emerald-600 text-white py-12">
        <div className="container mx-auto px-4">
          <button
            onClick={() => navigate("/tours")}
            className="flex items-center gap-2 text-white mb-6 hover:text-emerald-100"
          >
            <ArrowLeft className="w-5 h-5" />
            Quay lại danh sách tour
          </button>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{tour?.title}</h1>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <span>{tour?.rating?.toFixed(1) || "Chưa có đánh giá"}</span>
                  {tour?.review_count > 0 && (
                    <span className="text-emerald-100">
                      ({tour.review_count} đánh giá)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  <span>{tour?.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>{formatDuration(tour?.duration)}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-emerald-100">Giá từ</p>
              <div className="flex items-center gap-2">
                <p className="text-3xl font-bold">
                  {formatPrice(
                    tour?.promotions?.length > 0 &&
                      tour?.promotions[0]?.type === "percentage"
                      ? tour?.price * (1 - tour?.promotions[0]?.discount / 100)
                      : tour?.promotions?.length > 0
                      ? tour?.price - tour?.promotions[0]?.discount
                      : tour?.price
                  )}
                </p>
                {tour?.promotions?.length > 0 && (
                  <span className="text-lg line-through text-emerald-200">
                    {formatPrice(tour?.price)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg">
              {/* Navigation */}
              <div className="border-b border-gray-200">
                <div className="flex">
                  <button
                    className={`px-6 py-3 font-medium ${
                      selectedTab === "details"
                        ? "text-emerald-600 border-b-2 border-emerald-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                    onClick={() => setSelectedTab("details")}
                  >
                    Thông tin chung
                  </button>
                  <button
                    className={`px-6 py-3 font-medium ${
                      selectedTab === "schedule"
                        ? "text-emerald-600 border-b-2 border-emerald-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                    onClick={() => setSelectedTab("schedule")}
                  >
                    Lịch trình
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {selectedTab === "details" && (
                  <div className="space-y-6">
                    {/* Mô tả */}
                    <div>
                      <h2 className="text-xl font-semibold mb-4">
                        Mô tả chuyến đi
                      </h2>
                      <p className="text-gray-600 leading-relaxed">
                        {tour.description}
                      </p>
                    </div>

                    {/* Tổng quan */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h2 className="text-xl font-semibold mb-6">Tổng quan</h2>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-emerald-50 rounded-xl">
                            <Clock className="h-6 w-6 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Thời gian</p>
                            <p className="font-medium text-gray-900">
                              {formatDuration(tour.duration)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-emerald-50 rounded-xl">
                            <Users className="h-6 w-6 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Số người</p>
                            <p className="font-medium text-gray-900">
                              {tour.group_size}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-emerald-50 rounded-xl">
                            <Mountain className="h-6 w-6 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Độ khó</p>
                            <p className="font-medium text-gray-900">
                              {tour.difficulty_level === "easy"
                                ? "Dễ"
                                : tour.difficulty_level === "moderate"
                                ? "Trung bình"
                                : tour.difficulty_level === "challenging"
                                ? "Thử thách"
                                : tour.difficulty_level === "difficult"
                                ? "Khó"
                                : "Không xác định"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-emerald-50 rounded-xl">
                            <Calendar className="h-6 w-6 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Khởi hành</p>
                            <p className="font-medium text-gray-900">
                              {tour.start_dates?.[0]
                                ? formatDate(tour.start_dates[0])
                                : "Liên hệ"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Dịch vụ bao gồm */}
                    {tour.included_services &&
                      tour.included_services.length > 0 && (
                        <div className="bg-white rounded-2xl p-6 shadow-sm">
                          <h2 className="text-xl font-semibold mb-4">
                            Dịch vụ bao gồm
                          </h2>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {tour.included_services.map((service, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2 p-3 rounded-xl bg-gray-50"
                              >
                                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                                </div>
                                <span className="text-gray-700">{service}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Dịch vụ không bao gồm */}
                    {tour.excluded_services &&
                      tour.excluded_services.length > 0 && (
                        <div className="bg-white rounded-2xl p-6 shadow-sm">
                          <h2 className="text-xl font-semibold mb-4">
                            Dịch vụ không bao gồm
                          </h2>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {tour.excluded_services.map((service, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2 p-3 rounded-xl bg-gray-50"
                              >
                                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                                  <X className="h-5 w-5 text-red-600" />
                                </div>
                                <span className="text-gray-700">{service}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Đánh giá và Bình luận */}
                    <div className="mt-8 space-y-6">
                      {/* Đánh giá sao */}
                      <div className="bg-white rounded-2xl shadow-sm p-6">
                        <h2 className="text-2xl font-semibold mb-6">
                          Đánh giá tour
                        </h2>

                        {/* Thống kê rating */}
                        <div className="flex items-center gap-8 mb-8 p-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl">
                          <div className="text-center">
                            <div className="text-5xl font-bold text-emerald-600 mb-2">
                              {tour.avg_rating > 0
                                ? tour.avg_rating.toFixed(1)
                                : "N/A"}
                            </div>
                            <div className="flex items-center justify-center gap-1 mb-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-5 h-5 ${
                                    star <= Math.round(tour.avg_rating || 0)
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <p className="text-sm text-gray-600">
                              {tour.review_count || 0} đánh giá
                            </p>
                          </div>

                          <div className="flex-1">
                            {[5, 4, 3, 2, 1].map((star) => {
                              const count = tour.rating_breakdown?.[star] || 0;
                              const percentage =
                                tour.review_count > 0
                                  ? ((count / tour.review_count) * 100).toFixed(
                                      0
                                    )
                                  : 0;

                              return (
                                <div
                                  key={star}
                                  className="flex items-center gap-3 mb-2"
                                >
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

                        {/* Form đánh giá (nếu đã login) */}
                        {user && (
                          <div className="bg-gray-50 rounded-xl p-6 mb-6">
                            <h3 className="font-semibold mb-4">
                              {tour.user_has_rated
                                ? "Cập nhật đánh giá của bạn"
                                : "Bạn đánh giá tour này như thế nào?"}
                            </h3>
                            <div className="flex items-center gap-2 mb-4">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={() => handleRatingClick(star)}
                                  onMouseEnter={() => setHoverRating(star)}
                                  onMouseLeave={() => setHoverRating(0)}
                                  className="transition-transform hover:scale-110"
                                >
                                  <Star
                                    className={`w-8 h-8 ${
                                      star <= (hoverRating || userRating)
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-gray-300"
                                    }`}
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
                              <p className="text-red-600 text-sm mb-3">
                                {ratingError}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Thông báo chưa đăng nhập */}
                        {!user && (
                          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-center">
                            <p className="text-gray-600">
                              Vui lòng{" "}
                              <button
                                onClick={() => navigate("/login")}
                                className="text-emerald-600 hover:text-emerald-700 font-medium"
                              >
                                đăng nhập
                              </button>{" "}
                              để đánh giá tour này
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Comment Section using common component */}
                      <div className="bg-white rounded-2xl shadow-sm p-6">
                        <CommentSection
                          comments={reviews}
                          commentCount={reviews.length}
                          currentUserId={user?.id}
                          isAdmin={user?.role_id === 1}
                          likedComments={likedReviews}
                          onAddComment={handleAddComment}
                          onEditComment={handleEditComment}
                          onDeleteComment={handleDeleteComment}
                          onLikeComment={handleLikeComment}
                          onReloadComments={handleReloadTour}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {selectedTab === "schedule" && (
                  <div className="space-y-8">
                    {tour.schedules && tour.schedules.length > 0 ? (
                      <>
                        <div className="bg-white rounded-xl shadow-sm">
                          {/* Tabs cho các ngày */}
                          <div className="p-4 border-b">
                            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                              {Array.from(
                                new Set(tour.schedules.map((s) => s.day_number))
                              )
                                .sort((a, b) => a - b)
                                .map((day) => (
                                  <button
                                    key={day}
                                    onClick={() => setSelectedDay(day)}
                                    className={`flex-shrink-0 px-6 py-2.5 rounded-lg font-medium transition-all
                                      ${
                                        selectedDay === day
                                          ? "bg-emerald-600 text-white shadow-md"
                                          : "bg-gray-50 text-gray-600 hover:bg-emerald-50 hover:text-emerald-600"
                                      }`}
                                  >
                                    Ngày {day}
                                  </button>
                                ))}
                            </div>
                          </div>

                          {/* Nội dung timeline cho ngày đã chọn */}
                          <div className="relative p-6">
                            <div className="absolute left-[51px] top-20 bottom-24 w-1 bg-emerald-100"></div>

                            {/* Header của ngày */}
                            <div className="mb-8 flex items-center gap-4">
                              <div className="z-10 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg">
                                <Calendar className="h-6 w-6" />
                              </div>
                              <div>
                                <h3 className="text-xl font-bold text-gray-800">
                                  Ngày {selectedDay}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  {
                                    tour.schedules.find(
                                      (s) => s.day_number === selectedDay
                                    )?.title
                                  }
                                </p>
                              </div>
                            </div>

                            {/* Danh sách hoạt động */}
                            <div className="space-y-6">
                              {tour.schedules
                                .filter(
                                  (schedule) =>
                                    schedule.day_number === selectedDay
                                )
                                .sort(
                                  (a, b) =>
                                    a.start_time?.localeCompare(
                                      b.start_time || ""
                                    ) || 0
                                )
                                .map((schedule, index) => (
                                  <div key={index} className="relative group">
                                    {/* Timeline dot */}
                                    <div className="absolute left-[23px] top-16 z-10">
                                      <div className="w-3 h-3 rounded-full bg-emerald-600 ring-4 ring-emerald-100"></div>
                                    </div>

                                    {/* Content card */}
                                    <div className="ml-16">
                                      <div className="bg-white rounded-xl border border-gray-100 transition-all group-hover:shadow-md group-hover:border-emerald-100">
                                        <div className="p-4">
                                          {/* Header */}
                                          <div className="flex justify-between items-start mb-3">
                                            <div className="space-y-1">
                                              {schedule.start_time &&
                                                schedule.end_time && (
                                                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                                                    <Clock className="h-4 w-4" />
                                                    <span>
                                                      {formatTime(
                                                        schedule.start_time
                                                      )}{" "}
                                                      -{" "}
                                                      {formatTime(
                                                        schedule.end_time
                                                      )}
                                                    </span>
                                                  </div>
                                                )}
                                              <div className="flex items-center gap-1.5">
                                                <MapPin className="h-4 w-4 text-emerald-600" />
                                                <h4 className="font-medium text-gray-800">
                                                  {schedule.title}
                                                </h4>
                                              </div>
                                            </div>
                                            {schedule.start_time &&
                                              schedule.end_time && (
                                                <span className="px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-600 rounded-full">
                                                  {getDuration(
                                                    schedule.start_time,
                                                    schedule.end_time
                                                  )}
                                                </span>
                                              )}
                                          </div>

                                          {/* Activities list */}
                                          {(() => {
                                            const activities = Array.isArray(
                                              schedule.activity
                                            )
                                              ? schedule.activity
                                              : typeof schedule.activity ===
                                                "string"
                                              ? schedule.activity
                                                  .split("\n")
                                                  .filter((item) => item.trim())
                                              : [];

                                            if (activities.length === 0)
                                              return null;

                                            return (
                                              <div className="space-y-2 mb-3">
                                                {activities.map((act, idx) => (
                                                  <div
                                                    key={idx}
                                                    className="flex items-start gap-2 text-sm text-gray-600"
                                                  >
                                                    <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                      <span className="text-xs font-medium text-emerald-600">
                                                        {idx + 1}
                                                      </span>
                                                    </div>
                                                    <p>{act}</p>
                                                  </div>
                                                ))}
                                              </div>
                                            );
                                          })()}

                                          {/* Toggle button */}
                                          <button
                                            onClick={() =>
                                              toggleScheduleDetails(index)
                                            }
                                            className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-emerald-600 transition-colors"
                                          >
                                            {expandedSchedule === index ? (
                                              <>
                                                <ChevronUp className="h-4 w-4" />
                                                Thu gọn chi tiết
                                              </>
                                            ) : (
                                              <>
                                                <ChevronDown className="h-4 w-4" />
                                                Xem chi tiết
                                              </>
                                            )}
                                          </button>
                                        </div>

                                        {/* Expanded details */}
                                        <div
                                          className={`grid transition-all duration-300
                                          ${
                                            expandedSchedule === index
                                              ? "grid-rows-[1fr]"
                                              : "grid-rows-[0fr]"
                                          }`}
                                        >
                                          <div className="overflow-hidden">
                                            <div className="p-4 bg-gray-50 space-y-4 text-sm border-t border-gray-100">
                                              {schedule.image && (
                                                <div className="relative w-full h-48 rounded-lg overflow-hidden">
                                                  <img
                                                    src={getImageUrl(
                                                      schedule.image
                                                    )}
                                                    alt={`${schedule.title} image`}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                      e.target.onerror = null;
                                                      e.target.src = `${API_HOST}/images/placeholder.png`;
                                                    }}
                                                  />
                                                </div>
                                              )}
                                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {schedule.accommodation && (
                                                  <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-100">
                                                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                                      <Hotel className="h-5 w-5 text-blue-500" />
                                                    </div>
                                                    <div>
                                                      <p className="text-xs text-gray-500">
                                                        Chỗ ở
                                                      </p>
                                                      <p className="text-gray-700">
                                                        {schedule.accommodation}
                                                      </p>
                                                    </div>
                                                  </div>
                                                )}
                                                {schedule.meals && (
                                                  <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-100">
                                                    <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                                                      <Utensils className="h-5 w-5 text-orange-500" />
                                                    </div>
                                                    <div>
                                                      <p className="text-xs text-gray-500">
                                                        Bữa ăn
                                                      </p>
                                                      <p className="text-gray-700">
                                                        {schedule.meals}
                                                      </p>
                                                    </div>
                                                  </div>
                                                )}
                                                {schedule.transportation && (
                                                  <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-100">
                                                    <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                                                      <Bus className="h-5 w-5 text-green-500" />
                                                    </div>
                                                    <div>
                                                      <p className="text-xs text-gray-500">
                                                        Di chuyển
                                                      </p>
                                                      <p className="text-gray-700">
                                                        {
                                                          schedule.transportation
                                                        }
                                                      </p>
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                              {schedule.description && (
                                                <div className="bg-white p-4 rounded-lg border border-gray-100">
                                                  <p className="text-gray-500 leading-relaxed">
                                                    {schedule.description}
                                                  </p>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>

                        {/* Tổng quan lịch trình */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                              <Compass className="h-6 w-6 text-emerald-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">
                              Tổng quan lịch trình
                            </h3>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Thời gian */}
                            <div className="bg-gray-50 rounded-xl p-4">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                  <Clock className="h-5 w-5 text-blue-500" />
                                </div>
                                <h4 className="font-medium text-gray-800">
                                  Thời gian
                                </h4>
                              </div>
                              <div className="space-y-2 text-sm text-gray-600">
                                <p>
                                  Tổng thời gian:{" "}
                                  {formatDuration(tour.duration)}
                                </p>
                                <p>Số ngày: {tour.schedules.length} ngày</p>
                                <p>
                                  Khởi hành:{" "}
                                  {tour.start_dates?.[0]
                                    ? formatDate(tour.start_dates[0])
                                    : "Liên hệ"}
                                </p>
                              </div>
                            </div>

                            {/* Điểm đến */}
                            <div className="bg-gray-50 rounded-xl p-4">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                                  <MapPin className="h-5 w-5 text-emerald-500" />
                                </div>
                                <h4 className="font-medium text-gray-800">
                                  Điểm đến
                                </h4>
                              </div>
                              <div className="space-y-2 text-sm text-gray-600">
                                <p>Điểm xuất phát: {tour.location}</p>
                                <p>Điểm đến: {tour.destination_name}</p>
                                <p>
                                  Loại hình:{" "}
                                  {tour.type === "domestic"
                                    ? "Tour trong nước"
                                    : tour.type === "international"
                                    ? "Tour quốc tế"
                                    : tour.type === "cultural"
                                    ? "Tour văn hóa"
                                    : tour.type === "adventure"
                                    ? "Tour mạo hiểm"
                                    : tour.type === "beach"
                                    ? "Tour biển"
                                    : tour.type === "mountain"
                                    ? "Tour núi"
                                    : "Khác"}
                                </p>
                              </div>
                            </div>

                            {/* Dịch vụ */}
                            <div className="bg-gray-50 rounded-xl p-4">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                                  <Utensils className="h-5 w-5 text-orange-500" />
                                </div>
                                <h4 className="font-medium text-gray-800">
                                  Dịch vụ
                                </h4>
                              </div>
                              <div className="space-y-2 text-sm text-gray-600">
                                <p>
                                  Bữa ăn:{" "}
                                  {tour.schedules.filter((s) => s.meals).length}{" "}
                                  bữa
                                </p>
                                <p>
                                  Khách sạn:{" "}
                                  {
                                    tour.schedules.filter(
                                      (s) => s.accommodation
                                    ).length
                                  }{" "}
                                  đêm
                                </p>
                                <p>
                                  Phương tiện:{" "}
                                  {Array.from(
                                    new Set(
                                      tour.schedules
                                        .map((s) => s.transportation)
                                        .filter(Boolean)
                                    )
                                  ).join(", ") || "Đang cập nhật"}
                                </p>
                              </div>
                            </div>

                            {/* Thông tin khác */}
                            <div className="bg-gray-50 rounded-xl p-4">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                                  <Info className="h-5 w-5 text-purple-500" />
                                </div>
                                <h4 className="font-medium text-gray-800">
                                  Thông tin khác
                                </h4>
                              </div>
                              <div className="space-y-2 text-sm text-gray-600">
                                <p>Số người tối đa: {tour.group_size} người</p>
                                <p>
                                  Độ tuổi: {tour.min_age || 0} -{" "}
                                  {tour.max_age || 99} tuổi
                                </p>
                                <p>
                                  Độ khó:{" "}
                                  {tour.difficulty_level === "easy"
                                    ? "Dễ"
                                    : tour.difficulty_level === "moderate"
                                    ? "Trung bình"
                                    : tour.difficulty_level === "challenging"
                                    ? "Thử thách"
                                    : tour.difficulty_level === "difficult"
                                    ? "Khó"
                                    : "Không xác định"}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Lưu ý quan trọng */}
                          {tour.description && (
                            <div className="mt-6 p-4 bg-orange-50 rounded-xl border border-orange-100">
                              <div className="flex items-center gap-2 mb-2 text-orange-600">
                                <AlertCircle className="h-5 w-5" />
                                <span className="font-medium">
                                  Lưu ý quan trọng
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 leading-relaxed">
                                {tour.description}
                              </p>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                        <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600 text-lg font-medium">
                          Chưa có thông tin lịch trình
                        </p>
                        <p className="text-gray-400 text-sm">
                          Vui lòng liên hệ để biết thêm chi tiết
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Booking Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <BookingSummaryCard />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Booking Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg md:hidden p-4 z-50">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500">Tổng cộng</p>
            <p className="text-xl font-bold text-emerald-600">
              {formatPrice(bookingSummary.totalPrice)}
            </p>
          </div>
          <button
            onClick={handleBooking}
            disabled={
              getTotalGuests() === 0 ||
              (tour?.available_seats !== undefined &&
                tour.available_seats === 0)
            }
            className={`px-6 py-3 rounded-lg font-semibold transition-colors flex-shrink-0 ${
              getTotalGuests() === 0 ||
              (tour?.available_seats !== undefined &&
                tour.available_seats === 0)
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            }`}
          >
            {tour?.available_seats === 0 ? "Hết chỗ" : "Đặt ngay"}
          </button>
        </div>
        {/* Cảnh báo mobile */}
        {tour?.available_seats === 0 && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-900 flex items-center gap-1">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Ngày này đã hết chỗ. Vui lòng chọn ngày khác.</span>
            </p>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />
    </div>
  );
};

export default TourDetail;
