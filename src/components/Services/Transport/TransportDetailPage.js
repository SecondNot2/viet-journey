import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../../contexts/AuthContext";
import { API_URL, API_HOST } from "../../../config/api";
import TransportDetail, {
  formatPrice,
  formatDate,
  formatTime,
  formatDuration,
  getTransportLabel,
} from "./TransportDetail";
import {
  MapPin,
  Clock,
  Users,
  Star,
  ArrowLeft,
  Loader2,
  AlertCircle,
  X,
  Minus,
  Plus,
  Calendar,
  DollarSign,
  Info,
  BadgePercent,
  Send,
  ThumbsUp,
} from "lucide-react";

// Helper Functions
const calculateDiscountedPrice = (originalPrice, promotion) => {
  if (!promotion || promotion.status !== "active") return originalPrice;
  if (typeof originalPrice !== "number" || isNaN(originalPrice))
    return originalPrice;

  const discountValue = Number(promotion.discount);
  if (isNaN(discountValue)) return originalPrice;

  if (promotion.type === "percentage") {
    return Math.max(0, Math.round(originalPrice * (1 - discountValue / 100)));
  } else {
    // Ensure discount doesn't make price negative
    return Math.max(0, originalPrice - discountValue);
  }
};

// PassengerSelection Component
const PassengerSelection = ({
  passengers,
  setPassengers,
  showPassengerModal,
  setShowPassengerModal,
  handlePassengerChange,
  passengerError,
  setPassengerError,
  passengerModalRef,
}) => {
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
                <Minus className="w-4 h-4 text-gray-600" />
              </button>
              <span className="w-8 text-center font-medium">
                {passengers.adults}
              </span>
              <button
                type="button"
                onClick={() => handlePassengerChange("adults", "add")}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
              >
                <Plus className="w-4 h-4 text-emerald-600" />
              </button>
            </div>
          </div>

          {/* Children */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="font-medium text-gray-800">Trẻ em</p>
              <p className="text-sm text-gray-500">2-12 tuổi (70% giá vé)</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handlePassengerChange("children", "subtract")}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <Minus className="w-4 h-4 text-gray-600" />
              </button>
              <span className="w-8 text-center font-medium">
                {passengers.children}
              </span>
              <button
                type="button"
                onClick={() => handlePassengerChange("children", "add")}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
              >
                <Plus className="w-4 h-4 text-emerald-600" />
              </button>
            </div>
          </div>

          {/* Infants */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="font-medium text-gray-800">Em bé</p>
              <p className="text-sm text-gray-500">&lt; 2 tuổi (25% giá vé)</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handlePassengerChange("infants", "subtract")}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <Minus className="w-4 h-4 text-gray-600" />
              </button>
              <span className="w-8 text-center font-medium">
                {passengers.infants}
              </span>
              <button
                type="button"
                onClick={() => handlePassengerChange("infants", "add")}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
              >
                <Plus className="w-4 h-4 text-emerald-600" />
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                const total =
                  passengers.adults + passengers.children + passengers.infants;
                if (total > 0 && passengers.adults === 0) {
                  setPassengerError("Phải có ít nhất 1 người lớn");
                } else if (passengers.infants > passengers.adults) {
                  setPassengerError(
                    "Số em bé không được vượt quá số người lớn"
                  );
                } else {
                  setShowPassengerModal(false);
                  setPassengerError("");
                }
              }}
              className="w-full bg-emerald-100 text-emerald-700 font-medium py-2 rounded-lg hover:bg-emerald-200 transition-colors"
            >
              Xác nhận
            </button>
            {passengerError && (
              <p className="text-red-500 text-sm mt-2">{passengerError}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const TransportDetailPage = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const passengerModalRef = useRef(null);

  // Main states
  const [transport, setTransport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Use this for major loading errors

  // Booking states
  const [passengers, setPassengers] = useState({
    adults: 1,
    children: 0,
    infants: 0,
  });
  const [showPassengerModal, setShowPassengerModal] = useState(false);
  const [passengerError, setPassengerError] = useState(""); // For errors within the modal
  const [bookingError, setBookingError] = useState(""); // For errors related to date/passenger selection

  // Reviews states
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewError, setReviewError] = useState(null); // For errors fetching reviews
  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: "",
  });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewSubmitError, setReviewSubmitError] = useState(null); // For errors submitting review

  // Rating and comment states (like DestinationDetail)
  const [likedComments, setLikedComments] = useState(new Set());
  const [toast, setToast] = useState(null);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingError, setRatingError] = useState("");

  // Booking summary state
  const [priceDetails, setPriceDetails] = useState({
    basePrice: 0,
    adultTotal: 0,
    childTotal: 0,
    totalBeforeDiscount: 0,
    discountAmount: 0,
    finalTotal: 0,
  });

  // Fetch transport details
  useEffect(() => {
    const fetchTransportDetail = async () => {
      if (!id || id === "undefined") {
        setError("ID chuyến đi không hợp lệ");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null); // Reset main error
      try {
        // Build query params to include user_id for rating/liked status
        const queryParams = new URLSearchParams();
        if (user?.id) queryParams.append("user_id", user.id);

        const response = await axios.get(
          `${API_URL}/transport/${id}${
            queryParams.toString() ? "?" + queryParams.toString() : ""
          }`
        );
        const fetchedTransport = response.data;

        // Map response data to match expected structure
        const mappedTransport = {
          id: fetchedTransport.trip_id,
          trip_id: fetchedTransport.trip_id,
          trip_code: fetchedTransport.trip_code,
          trip_date: fetchedTransport.trip_date,
          trip_status: fetchedTransport.trip_status,
          route_id: fetchedTransport.route_id,
          route_code: fetchedTransport.route_code,
          route_name: fetchedTransport.route_name,
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
          seats: fetchedTransport.total_seats, // For compatibility
          image: fetchedTransport.image,
          amenities: fetchedTransport.amenities || [],
          notes: fetchedTransport.trip_notes || fetchedTransport.route_notes,
          rating: fetchedTransport.rating || 0,
          rating_count: fetchedTransport.rating_count || 0,
          rating_breakdown: fetchedTransport.rating_breakdown || {},
          comment_count: fetchedTransport.comment_count || 0,
          user_has_rated: fetchedTransport.user_has_rated || false,
          user_rating: fetchedTransport.user_rating || 0,
          reviews: fetchedTransport.reviews || [],
          liked_review_ids: fetchedTransport.liked_review_ids || [],
        };

        setTransport(mappedTransport);

        // Set liked comments if available
        if (fetchedTransport.liked_review_ids) {
          setLikedComments(new Set(fetchedTransport.liked_review_ids));
        }

        calculatePrices(); // Calculate initial summary
        setError(null);
      } catch (err) {
        console.error("Lỗi khi lấy thông tin vận chuyển:", err);
        setError(
          err.response?.data?.error ||
            "Không thể tải thông tin. Vui lòng thử lại sau."
        );
        setTransport(null); // Clear transport data on error
      } finally {
        setLoading(false);
      }
    };

    fetchTransportDetail();
  }, [id, user?.id]); // Dependency on ID and user ID

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      if (!id || id === "undefined") return; // Don't fetch if ID is missing or invalid
      setReviewsLoading(true);
      setReviewError(null); // Reset review error
      try {
        // Use the new transport-specific reviews endpoint
        const response = await axios.get(`${API_URL}/transport/${id}/reviews`);
        // Response format: { reviews: [...] }
        setReviews(response.data?.reviews || response.data || []);
        setReviewError(null);
      } catch (err) {
        console.error("Lỗi khi lấy đánh giá:", err);
        setReviewError("Không thể tải đánh giá. Vui lòng thử lại sau.");
        setReviews([]);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchReviews();
  }, [id]); // Also depends on ID

  // Helper functions
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

      const response = await axios.post(`${API_URL}/transport/${id}/rating`, {
        user_id: user.id,
        rating: rating,
      });

      if (response.data.old_rating) {
        showToast(
          `Đã cập nhật đánh giá từ ${response.data.old_rating} sao thành ${rating} sao!`,
          "success"
        );
      } else {
        showToast(`Cảm ơn bạn đã đánh giá ${rating} sao!`, "success");
      }

      // Reload transport to update rating
      await reloadTransport();
    } catch (error) {
      console.error("Lỗi khi gửi đánh giá:", error);
      setRatingError(
        error.response?.data?.error ||
          "Không thể gửi đánh giá. Vui lòng thử lại."
      );
      setUserRating(0);
    }
  };

  // Comment handlers
  const handleAddComment = async ({ comment, parent_id }) => {
    const response = await axios.post(`${API_URL}/transport/${id}/reviews`, {
      user_id: user.id,
      comment,
      rating: null,
      parent_id,
    });

    setTransport({
      ...transport,
      reviews: [response.data.review, ...(transport.reviews || [])],
      comment_count: (transport.comment_count || 0) + 1,
    });
  };

  const handleEditComment = async (reviewId, editedText) => {
    await axios.put(`${API_URL}/transport/${id}/reviews/${reviewId}`, {
      comment: editedText,
      rating: null,
    });

    setTransport({
      ...transport,
      reviews: transport.reviews.map((review) =>
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
    await axios.delete(`${API_URL}/transport/${id}/reviews/${reviewId}`);

    setTransport({
      ...transport,
      reviews: transport.reviews.filter((review) => review.id !== reviewId),
      comment_count: Math.max(0, (transport.comment_count || 0) - 1),
    });
  };

  const handleLikeComment = async (reviewId) => {
    const response = await axios.post(
      `${API_URL}/transport/${id}/reviews/${reviewId}/like`,
      {
        user_id: user.id,
      }
    );

    if (response.data.liked) {
      setLikedComments((prev) => new Set([...prev, reviewId]));
    } else {
      setLikedComments((prev) => {
        const newSet = new Set(prev);
        newSet.delete(reviewId);
        return newSet;
      });
    }

    setTransport({
      ...transport,
      reviews: transport.reviews.map((review) =>
        review.id === reviewId
          ? {
              ...review,
              likes_count: response.data.likes_count,
            }
          : review
      ),
    });
  };

  const reloadTransport = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (user?.id) queryParams.append("user_id", user.id);

      const response = await axios.get(
        `${API_URL}/transport/${id}${
          queryParams.toString() ? "?" + queryParams.toString() : ""
        }`
      );

      const fetchedTransport = response.data;

      const mappedTransport = {
        id: fetchedTransport.trip_id,
        trip_id: fetchedTransport.trip_id,
        trip_code: fetchedTransport.trip_code,
        trip_date: fetchedTransport.trip_date,
        trip_status: fetchedTransport.trip_status,
        route_id: fetchedTransport.route_id,
        route_code: fetchedTransport.route_code,
        route_name: fetchedTransport.route_name,
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
        notes: fetchedTransport.trip_notes || fetchedTransport.route_notes,
        rating: fetchedTransport.rating,
        rating_count: fetchedTransport.rating_count,
        rating_breakdown: fetchedTransport.rating_breakdown,
        comment_count: fetchedTransport.comment_count,
        user_has_rated: fetchedTransport.user_has_rated,
        user_rating: fetchedTransport.user_rating,
        reviews: fetchedTransport.reviews || [],
        liked_review_ids: fetchedTransport.liked_review_ids || [],
      };

      setTransport(mappedTransport);

      if (fetchedTransport.liked_review_ids) {
        setLikedComments(new Set(fetchedTransport.liked_review_ids));
      }
    } catch (err) {
      console.error("Lỗi khi reload transport:", err);
    }
  };

  // Handle click outside passenger modal
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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update booking summary when passengers or transport changes
  const calculatePrices = () => {
    if (!transport) return;

    // Chuyển đổi và làm tròn giá vé cơ bản
    const basePrice = Math.round(Number(transport.price));

    // Tính giá cho người lớn (100% giá cơ bản)
    const adultTotal = basePrice * passengers.adults;

    // Tính giá cho trẻ em (70% giá cơ bản)
    const childTotal = Math.round(basePrice * 0.7 * passengers.children);

    // Tính tổng trước khuyến mãi
    const totalBeforeDiscount = adultTotal + childTotal;

    // Tính khuyến mãi
    let discount = 0;
    if (transport.promotion_status === "active") {
      if (transport.promotion_type === "percentage") {
        discount = Math.round(
          totalBeforeDiscount * (transport.promotion_discount / 100)
        );
      } else {
        discount = Math.round(Number(transport.promotion_discount));
      }
    }

    // Tính tổng cuối cùng
    const total = totalBeforeDiscount - discount;

    // Cập nhật state priceDetails
    setPriceDetails({
      basePrice,
      adultTotal,
      childTotal,
      totalBeforeDiscount,
      discountAmount: discount,
      finalTotal: total,
    });
  };

  // Thêm useEffect để theo dõi thay đổi số lượng hành khách
  useEffect(() => {
    calculatePrices();
  }, [passengers, transport]);

  // Event Handlers
  const handlePassengerChange = (type, action) => {
    setPassengers((prev) => {
      const newPassengers = { ...prev };

      if (action === "add") {
        // Kiểm tra giới hạn hành khách
        const totalPassengers = Object.values(newPassengers).reduce(
          (a, b) => a + b,
          0
        );
        if (totalPassengers >= 9) {
          setPassengerError("Tổng số hành khách không được vượt quá 9 người");
          return prev;
        }

        // Kiểm tra giới hạn cho từng loại
        if (type === "adults" && newPassengers.adults >= 9) {
          setPassengerError("Số người lớn không được vượt quá 9");
          return prev;
        }
        if (type === "children" && newPassengers.children >= 4) {
          setPassengerError("Số trẻ em không được vượt quá 4");
          return prev;
        }
        if (
          type === "infants" &&
          newPassengers.infants >= newPassengers.adults
        ) {
          setPassengerError("Số em bé không được vượt quá số người lớn");
          return prev;
        }

        newPassengers[type]++;
      } else if (action === "subtract") {
        // Kiểm tra điều kiện giảm
        if (type === "adults" && newPassengers.adults <= 1) {
          setPassengerError("Phải có ít nhất 1 người lớn");
          return prev;
        }
        if (
          type === "adults" &&
          newPassengers.infants > newPassengers.adults - 1
        ) {
          setPassengerError("Số em bé không được vượt quá số người lớn");
          return prev;
        }
        if (newPassengers[type] > 0) {
          newPassengers[type]--;
        }
      }

      setPassengerError(""); // Xóa thông báo lỗi nếu thành công
      return newPassengers;
    });
  };

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
      navigate("/login", {
        state: { from: `/transport/${id}` },
      }); // Redirect back after login
      return;
    }

    if (!newReview.comment.trim()) {
      setReviewSubmitError("Vui lòng nhập nội dung đánh giá");
      return;
    }

    setSubmittingReview(true);
    setReviewSubmitError(null);
    setReviewSuccess(false);

    try {
      // Use the new transport-specific reviews endpoint
      const response = await axios.post(
        `${API_URL}/transport/${id}/reviews`,
        {
          user_id: user.id,
          rating: newReview.rating,
          comment: newReview.comment,
        },
        { withCredentials: true }
      );

      // Build new review object for immediate display
      const newReviewData = {
        id: response.data.review_id || Date.now(),
        rating: newReview.rating,
        comment: newReview.comment,
        created_at: new Date().toISOString(),
        user: {
          id: user.id,
          username: user.username,
          full_name: user.full_name || user.username,
          avatar: user.avatar || null,
        },
        likes_count: 0,
      };

      // Add the new review to the top of the list
      setReviews((prevReviews) => [newReviewData, ...prevReviews]);
      setNewReview({ rating: 5, comment: "" }); // Reset form
      setReviewSuccess(true);

      // Reload transport to update rating stats
      await reloadTransport();

      // Hide success message after 3 seconds
      setTimeout(() => {
        setReviewSuccess(false);
      }, 3000);
    } catch (err) {
      console.error("Lỗi khi gửi đánh giá:", err);
      setReviewSubmitError(
        err.response?.data?.error ||
          "Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại."
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleBooking = () => {
    // 1. Validate Passengers
    const totalPassengers =
      passengers.adults + passengers.children + passengers.infants;
    if (totalPassengers === 0) {
      setBookingError("Vui lòng chọn số lượng hành khách");
      return;
    }
    if (passengers.adults === 0) {
      setBookingError("Phải có ít nhất 1 người lớn trong đoàn");
      return;
    }
    const availableSeats = transport?.seats || 0;
    if (totalPassengers > availableSeats) {
      setBookingError(
        `Số lượng hành khách (${totalPassengers}) vượt quá số chỗ còn lại (${availableSeats})`
      );
      return;
    }

    // Clear any previous errors if validation passes
    setBookingError("");

    // 2. Prepare state for navigation
    const bookingState = {
      transport: {
        id: transport.id,
        vehicle_name: transport.vehicle_name,
        type: transport.type,
        company: transport.company,
        from_location: transport.from_location,
        to_location: transport.to_location,
        departure_time: transport.departure_time,
        arrival_time: transport.arrival_time,
        duration: transport.duration,
        image: transport.image,
        price: transport.price,
        promotion: {
          id: transport.promotion_id,
          type: transport.promotion_type,
          discount: transport.promotion_discount,
          status: transport.promotion_status,
          end_date: transport.promotion_end_date,
          title: transport.promotion_title,
          description: transport.promotion_description,
        },
      },
      bookingDetails: {
        passengers: {
          adults: passengers.adults,
          children: passengers.children,
          infants: passengers.infants,
        },
      },
      summary: {
        basePrice: priceDetails.basePrice,
        adultTotal: priceDetails.adultTotal,
        childTotal: priceDetails.childTotal,
        discount: priceDetails.discountAmount,
        totalPrice: priceDetails.finalTotal,
      },
    };

    // 3. Navigate
    navigate(`/transport/${id}/booking`, { state: bookingState });
  };

  // --- Render Logic ---

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Không thể tải dữ liệu
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate("/transport")}
            className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center mx-auto gap-2"
          >
            <ArrowLeft size={18} />
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  if (!transport) {
    // Should be caught by the error state, but as a fallback
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Không tìm thấy thông tin vận chuyển.</p>
      </div>
    );
  }

  // Determine if there's an active promotion
  const promotion = {
    type: transport.promotion_type,
    discount: Number(transport.promotion_discount),
    status: transport.promotion_status,
    end_date: transport.promotion_end_date,
    title: transport.promotion_title,
  };
  const isPromoActive =
    promotion.status === "active" &&
    promotion.discount > 0 &&
    new Date(promotion.end_date) >= new Date();

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
          <h1 className="text-2xl font-bold">Chi tiết chuyến xe</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <TransportDetail
                transport={{
                  ...transport,
                  reviews: reviews, // Use reviews from separate fetch
                  comment_count: reviews.length, // Actual count
                }}
                currentUserId={user?.id}
                isAdmin={user?.role === "admin"}
                likedComments={likedComments}
                toast={toast}
                showToast={showToast}
                onAddComment={handleAddComment}
                onEditComment={handleEditComment}
                onDeleteComment={handleDeleteComment}
                onLikeComment={handleLikeComment}
                onReloadTransport={reloadTransport}
                onRatingClick={handleRatingClick}
                userRating={userRating}
                hoverRating={hoverRating}
                setHoverRating={setHoverRating}
                ratingError={ratingError}
                // Passenger props
                passengers={passengers}
                setPassengers={setPassengers}
                showPassengerModal={showPassengerModal}
                setShowPassengerModal={setShowPassengerModal}
                handlePassengerChange={handlePassengerChange}
                passengerError={passengerError}
                setPassengerError={setPassengerError}
                passengerModalRef={passengerModalRef}
              />
            </div>
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-28">
              <h3 className="text-xl font-semibold mb-4">Tóm tắt đặt vé</h3>
              <div className="space-y-4">
                {/* Thông tin chuyến xe */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nhà xe</span>
                    <div className="flex items-center gap-2">
                      <img
                        src={transport.image}
                        alt={transport.company}
                        className="h-5 w-5 object-contain"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `${API_HOST}/images/placeholder.png`;
                        }}
                      />
                      <span className="font-medium">{transport.company}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Loại xe</span>
                    <span className="font-medium">
                      {getTransportLabel(transport.type)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Từ</span>
                    <span className="font-medium">
                      {transport.from_location}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Đến</span>
                    <span className="font-medium">{transport.to_location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ngày đi</span>
                    <span className="font-medium">
                      {new Date(transport.departure_time).toLocaleDateString(
                        "vi-VN",
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Giờ khởi hành</span>
                    <div className="text-right">
                      <span className="font-medium">
                        {new Date(transport.departure_time).toLocaleTimeString(
                          "vi-VN",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </span>
                      <span className="text-gray-400 mx-2">→</span>
                      <span className="font-medium">
                        {new Date(transport.arrival_time).toLocaleTimeString(
                          "vi-VN",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Thời gian di chuyển</span>
                    <span className="font-medium">
                      {formatDuration(transport.duration)}
                    </span>
                  </div>
                </div>

                {/* Thông tin hành khách */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Số hành khách</span>
                      <div className="text-right">
                        {passengers.adults > 0 && (
                          <p className="font-medium">
                            {passengers.adults} người lớn
                          </p>
                        )}
                        {passengers.children > 0 && (
                          <p className="font-medium">
                            {passengers.children} trẻ em
                          </p>
                        )}
                        {passengers.infants > 0 && (
                          <p className="font-medium">
                            {passengers.infants} em bé
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
                    {/* Giá vé người lớn */}
                    {passengers.adults > 0 && (
                      <div className="flex justify-between">
                        <div>
                          <span className="text-gray-600">Người lớn</span>
                          <span className="text-gray-400 text-sm ml-1">
                            x{passengers.adults}
                          </span>
                        </div>
                        <span className="font-medium">
                          {formatPrice(priceDetails.adultTotal)}
                        </span>
                      </div>
                    )}

                    {/* Giá vé trẻ em */}
                    {passengers.children > 0 && (
                      <div className="flex justify-between">
                        <div>
                          <span className="text-gray-600">Trẻ em</span>
                          <span className="text-gray-400 text-sm ml-1">
                            x{passengers.children}
                          </span>
                          <span className="text-gray-400 text-xs ml-1">
                            (70%)
                          </span>
                        </div>
                        <span className="font-medium">
                          {formatPrice(priceDetails.childTotal)}
                        </span>
                      </div>
                    )}

                    {/* Giá vé em bé */}
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
                          {formatPrice(priceDetails.childTotal * 0.25)}
                        </span>
                      </div>
                    )}

                    {/* Tổng trước khuyến mãi */}
                    <div className="flex justify-between font-medium pt-2 border-t border-dashed border-gray-200">
                      <span>Tổng giá vé</span>
                      <span>
                        {formatPrice(priceDetails.totalBeforeDiscount)}
                      </span>
                    </div>

                    {/* Khuyến mãi */}
                    {transport.promotion_status === "active" &&
                      transport.promotion_discount > 0 && (
                        <div>
                          <div className="flex justify-between text-orange-500">
                            <span className="flex items-center gap-1">
                              <BadgePercent className="w-4 h-4" />
                              Khuyến mãi
                            </span>
                            <span>
                              -{formatPrice(priceDetails.discountAmount)}
                            </span>
                          </div>
                          <div className="mt-2 p-3 bg-orange-50 rounded-lg text-sm">
                            <p className="text-orange-600 font-medium flex justify-between">
                              {transport.promotion_title}{" "}
                              <span className="bg-orange-200 text-orange-700 px-2 py-0.5 rounded-full text-xs ml-1">
                                {transport.promotion_type === "percentage"
                                  ? `-${transport.promotion_discount}%`
                                  : `-${formatPrice(
                                      transport.promotion_discount
                                    )}`}
                              </span>
                            </p>
                            <p className="text-gray-600 text-xs mt-1">
                              Thời hạn:{" "}
                              {new Date(
                                transport.promotion_end_date
                              ).toLocaleDateString("vi-VN")}
                            </p>
                          </div>
                        </div>
                      )}
                  </div>
                </div>

                {/* Tổng cộng */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Tổng cộng</span>
                    <span className="text-emerald-600">
                      {formatPrice(priceDetails.finalTotal)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Giá cuối cùng</p>
                </div>

                {/* Nút đặt vé */}
                <button
                  onClick={handleBooking}
                  disabled={passengers.adults === 0}
                  className={`w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
                    passengers.adults === 0
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-emerald-600 text-white hover:bg-emerald-700"
                  }`}
                >
                  <DollarSign className="w-5 h-5" />
                  {passengers.adults === 0
                    ? "Vui lòng chọn số hành khách"
                    : "Tiếp tục đặt vé"}
                </button>

                {/* Thông tin bổ sung */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 justify-center text-sm text-gray-500">
                    <Info className="w-4 h-4" />
                    <span>Hỗ trợ đặt vé 24/7</span>
                  </div>
                  <div className="text-center text-xs text-gray-500">
                    <p>Giá đã bao gồm khuyến mãi</p>
                    {transport.promotion_end_date && (
                      <p className="text-orange-500">
                        * Ưu đãi áp dụng đến{" "}
                        {new Date(
                          transport.promotion_end_date
                        ).toLocaleDateString("vi-VN")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Booking Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg lg:hidden p-4 z-40">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500">Tổng cộng</p>
            <p className="text-xl font-bold text-emerald-600">
              {formatPrice(priceDetails.finalTotal)}
            </p>
          </div>
          <button
            onClick={handleBooking}
            disabled={passengers.adults === 0}
            className={`px-6 py-3 rounded-lg font-semibold text-white transition-colors ${
              passengers.adults === 0
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {passengers.adults === 0 ? "Chọn khách" : "Đặt ngay"}
          </button>
        </div>
        {bookingError && (
          <p className="text-red-500 text-xs mt-1 text-center">
            {bookingError}
          </p>
        )}
      </div>
    </div>
  );
};

export default TransportDetailPage;
