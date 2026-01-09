import { API_URL, API_HOST } from "../../config/api";
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import {
  MapPin,
  Clock,
  Ticket,
  Calendar,
  Star,
  Heart,
  Share2,
  Info,
  Camera,
  Hotel,
  Bus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Toast from "../common/Toast";
import ImageGallery from "../common/ImageGallery";
import CommentSection from "../common/CommentSection";
import { useAuth } from "../../contexts/AuthContext";

const DestinationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State cho dữ liệu
  const [destination, setDestination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State cho UI
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [likedComments, setLikedComments] = useState(new Set());
  const [toast, setToast] = useState(null);

  // State cho rating
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingError, setRatingError] = useState("");

  const currentUserId = user?.id || null;
  const isAdmin = user?.role === "admin";

  // Wishlist Logic
  const [wishlistLoading, setWishlistLoading] = useState(false);

  useEffect(() => {
    if (currentUserId && id) {
      checkWishlistStatus();
    }
  }, [currentUserId, id]);

  const checkWishlistStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/wishlist/check`, {
        params: { type: "destination", id: id },
        withCredentials: true,
      });
      setIsWishlisted(response.data.isWishlisted);
    } catch (error) {
      console.error("Error checking wishlist:", error);
    }
  };

  const handleWishlistToggle = async () => {
    if (!currentUserId) {
      showToast("Vui lòng đăng nhập để lưu yêu thích", "warning");
      return;
    }

    try {
      setWishlistLoading(true);
      if (isWishlisted) {
        // Remove logic - we need the wishlist ID properly, but for now our API might need to be smart or we fetch it.
        // Actually, querying via DELETE /wishlist/item?type=x&id=y would be easier, but our current route is DELETE /:id (primary key).
        // Let's refactor backend route slightly to allow delete by item or just fetch ID first.
        // The check endpoint returns wishlistId.

        const checkRes = await axios.get(`${API_URL}/wishlist/check`, {
          params: { type: "destination", id: id },
          withCredentials: true,
        });

        if (checkRes.data.wishlistId) {
          await axios.delete(
            `${API_URL}/wishlist/${checkRes.data.wishlistId}`,
            {
              withCredentials: true,
            }
          );
          setIsWishlisted(false);
          showToast("Đã xóa khỏi danh sách yêu thích", "info");
        }
      } else {
        // Add
        await axios.post(
          `${API_URL}/wishlist`,
          {
            item_type: "destination",
            item_id: id,
          },
          {
            withCredentials: true,
          }
        );
        setIsWishlisted(true);
        showToast("Đã thêm vào danh sách yêu thích", "success");
      }
    } catch (error) {
      console.error("Wishlist toggle error:", error);
      showToast("Không thể cập nhật danh sách yêu thích", "error");
    } finally {
      setWishlistLoading(false);
    }
  };

  // Fetch dữ liệu điểm đến từ API
  useEffect(() => {
    const fetchDestination = async () => {
      try {
        setLoading(true);

        // Build query params
        const queryParams = new URLSearchParams();
        if (currentUserId) queryParams.append("user_id", currentUserId);

        const response = await axios.get(
          `${API_URL}/destinations/${id}${
            queryParams.toString() ? "?" + queryParams.toString() : ""
          }`
        );

        setDestination(response.data);

        // Set liked comments if available
        if (response.data.liked_review_ids) {
          setLikedComments(new Set(response.data.liked_review_ids));
        }

        setLoading(false);
      } catch (err) {
        console.error("[ERROR] Lỗi khi tải thông tin điểm đến:", err);
        setError(
          err.response?.data?.error || "Không thể tải thông tin điểm đến"
        );
        setLoading(false);
      }
    };

    if (id) {
      fetchDestination();
    }
  }, [id, currentUserId]);

  // Helper functions
  const showToast = (message, type = "info") => {
    setToast({ message, type });
  };

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return `${API_HOST}/images/placeholder.png`;
    if (imageUrl.startsWith("http")) return imageUrl;
    if (imageUrl.startsWith("/uploads")) return `${API_HOST}${imageUrl}`;
    return `${API_HOST}/${imageUrl}`.replace(/\/\//g, "/");
  };

  const getGalleryImages = () => {
    const images = [];

    if (destination.main_image) {
      images.push(getImageUrl(destination.main_image));
    } else if (destination.image) {
      images.push(getImageUrl(destination.image));
    }

    if (destination.images) {
      try {
        const additionalImages =
          typeof destination.images === "string"
            ? JSON.parse(destination.images)
            : destination.images;

        if (Array.isArray(additionalImages)) {
          additionalImages.forEach((img) => {
            const imgUrl = getImageUrl(img);
            if (!images.includes(imgUrl)) {
              images.push(imgUrl);
            }
          });
        }
      } catch (e) {
        console.error("Error parsing images:", e);
      }
    }

    if (images.length === 0) {
      images.push(`${API_HOST}/images/placeholder.png`);
    }

    return images;
  };

  const getActivities = () => {
    if (!destination.activities) return [];
    try {
      return typeof destination.activities === "string"
        ? JSON.parse(destination.activities)
        : destination.activities;
    } catch (e) {
      console.error("Error parsing activities:", e);
      return [];
    }
  };

  // Format time to HH:MM
  const formatTime = (time) => {
    if (!time) return "";
    // Nếu time là format HH:MM:SS, cắt bỏ :SS
    if (time.includes(":")) {
      const parts = time.split(":");
      return `${parts[0]}:${parts[1]}`;
    }
    return time;
  };

  const handleImageNavigation = (direction) => {
    const galleryImages = getGalleryImages();
    if (direction === "next") {
      setActiveImageIndex((prev) =>
        prev === galleryImages.length - 1 ? 0 : prev + 1
      );
    } else {
      setActiveImageIndex((prev) =>
        prev === 0 ? galleryImages.length - 1 : prev - 1
      );
    }
  };

  // Handler cho rating (cho phép thêm mới và cập nhật)
  const handleRatingClick = async (rating) => {
    if (!currentUserId) {
      showToast("Vui lòng đăng nhập để đánh giá", "warning");
      return;
    }

    try {
      setUserRating(rating);
      setRatingError("");

      // Gửi rating lên server (có thể là thêm mới hoặc cập nhật)
      const response = await axios.post(
        `${API_URL}/destinations/${id}/rating`,
        {
          user_id: currentUserId,
          rating: rating,
        }
      );

      // Kiểm tra xem là cập nhật hay thêm mới
      if (response.data.old_rating) {
        showToast(
          `Đã cập nhật đánh giá từ ${response.data.old_rating} sao thành ${rating} sao!`,
          "success"
        );
      } else {
        showToast(`Cảm ơn bạn đã đánh giá ${rating} sao!`, "success");
      }

      // Reload destination để cập nhật rating
      await reloadDestination();
    } catch (error) {
      console.error("Lỗi khi gửi đánh giá:", error);
      setRatingError(
        error.response?.data?.error ||
          "Không thể gửi đánh giá. Vui lòng thử lại."
      );
      setUserRating(0);
    }
  };

  // Comment handlers - refactored to work with CommentSection component
  const handleAddComment = async ({ comment, parent_id }) => {
    const response = await axios.post(`${API_URL}/destinations/${id}/reviews`, {
      user_id: currentUserId,
      comment,
      rating: null,
      parent_id,
    });

    setDestination({
      ...destination,
      reviews: [response.data.review, ...(destination.reviews || [])],
      review_count: (destination.review_count || 0) + 1,
    });
  };

  const handleEditComment = async (reviewId, editedText) => {
    await axios.put(`${API_URL}/destinations/${id}/reviews/${reviewId}`, {
      comment: editedText,
      rating: null,
    });

    setDestination({
      ...destination,
      reviews: destination.reviews.map((review) =>
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
    await axios.delete(`${API_URL}/destinations/${id}/reviews/${reviewId}`);

    setDestination({
      ...destination,
      reviews: destination.reviews.filter((review) => review.id !== reviewId),
      review_count: Math.max(0, (destination.review_count || 0) - 1),
    });
  };

  const handleLikeComment = async (reviewId) => {
    const response = await axios.post(
      `${API_URL}/destinations/${id}/reviews/${reviewId}/like`,
      {
        user_id: currentUserId,
      }
    );

    // Update liked state dựa vào response
    if (response.data.liked) {
      setLikedComments((prev) => new Set([...prev, reviewId]));
    } else {
      setLikedComments((prev) => {
        const newSet = new Set(prev);
        newSet.delete(reviewId);
        return newSet;
      });
    }

    // Update like count từ response
    setDestination({
      ...destination,
      reviews: destination.reviews.map((review) =>
        review.id === reviewId
          ? {
              ...review,
              likes_count: response.data.likes_count,
            }
          : review
      ),
    });
  };

  const reloadDestination = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (currentUserId) queryParams.append("user_id", currentUserId);

      const response = await axios.get(
        `${API_URL}/destinations/${id}${
          queryParams.toString() ? "?" + queryParams.toString() : ""
        }`
      );

      setDestination(response.data);

      if (response.data.liked_review_ids) {
        setLikedComments(new Set(response.data.liked_review_ids));
      }
    } catch (err) {
      console.error("Lỗi khi reload destination:", err);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin điểm đến...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !destination) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {error || "Không tìm thấy thông tin điểm đến"}
          </h2>
          <button
            onClick={() => navigate("/destinations")}
            className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium"
          >
            <ChevronLeft className="w-5 h-5" />
            Quay lại trang tìm kiếm
          </button>
        </div>
      </div>
    );
  }

  const galleryImages = getGalleryImages();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Hero Section */}
      <div className="relative h-[60vh] bg-emerald-600 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={galleryImages[activeImageIndex]}
            alt={destination.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = `${API_HOST}/images/placeholder.png`;
            }}
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>

        <div className="container mx-auto px-4 h-full relative">
          <div className="flex flex-col h-full justify-between py-8">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-white/90 hover:text-white transition-colors bg-black/20 px-4 py-2 rounded-lg backdrop-blur-sm w-fit"
            >
              <ChevronLeft className="w-5 h-5" />
              Quay lại
            </button>

            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-4xl font-bold text-white mb-4">
                  {destination.name}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-white/90">
                  <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                    <MapPin className="w-4 h-4" />
                    <span>{destination.location || "Việt Nam"}</span>
                  </div>
                  {destination.rating > 0 && (
                    <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span>{destination.rating}/5</span>
                      {destination.review_count > 0 && (
                        <span className="text-sm">
                          ({destination.review_count} đánh giá)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleWishlistToggle}
                  disabled={wishlistLoading}
                  className={`p-3 rounded-xl backdrop-blur-sm transition-all ${
                    isWishlisted
                      ? "bg-red-500 text-white"
                      : "bg-black/20 text-white hover:bg-black/30"
                  } ${wishlistLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <Heart
                    className={`w-5 h-5 ${isWishlisted ? "fill-current" : ""}`}
                  />
                </button>
                <button className="p-3 rounded-xl bg-black/20 text-white hover:bg-black/30 backdrop-blur-sm transition-all">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Image Navigation */}
        {galleryImages.length > 1 && (
          <div className="absolute bottom-4 right-4 flex gap-2">
            <button
              onClick={() => handleImageNavigation("prev")}
              className="p-2 rounded-lg bg-black/20 text-white hover:bg-black/30 backdrop-blur-sm transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleImageNavigation("next")}
              className="p-2 rounded-lg bg-black/20 text-white hover:bg-black/30 backdrop-blur-sm transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Thông tin tổng quan */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6">
                <h2 className="text-2xl font-semibold mb-4">Tổng quan</h2>
                {destination.description && (
                  <p className="text-gray-600 mb-6 leading-relaxed whitespace-pre-line">
                    {destination.description}
                  </p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {destination.best_time_to_visit && (
                    <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-xl">
                      <Calendar className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Thời điểm đẹp nhất
                        </p>
                        <p className="text-sm">
                          {destination.best_time_to_visit}
                        </p>
                      </div>
                    </div>
                  )}
                  {(destination.open_time || destination.close_time) && (
                    <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-xl">
                      <Clock className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Giờ mở cửa
                        </p>
                        <p className="text-sm">
                          {destination.open_time && destination.close_time
                            ? `${formatTime(
                                destination.open_time
                              )} - ${formatTime(destination.close_time)}`
                            : formatTime(destination.open_time) ||
                              formatTime(destination.close_time) ||
                              "Liên hệ"}
                        </p>
                      </div>
                    </div>
                  )}
                  {destination.ticket_price && (
                    <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-xl">
                      <Ticket className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Giá vé
                        </p>
                        <p className="text-sm">
                          {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(destination.ticket_price)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Hoạt động & Trải nghiệm */}
            {getActivities().length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-2xl font-semibold mb-6">
                  Hoạt động & Trải nghiệm
                </h2>
                <div className="grid gap-4">
                  {getActivities().map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-4 rounded-xl bg-gray-50"
                    >
                      <div className="flex-1">
                        {typeof activity === "object" && activity !== null ? (
                          <>
                            <h3 className="font-medium mb-1">
                              {activity.title || activity.name || "Hoạt động"}
                            </h3>
                            {activity.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {activity.description}
                              </p>
                            )}
                          </>
                        ) : (
                          <h3 className="font-medium mb-1">{activity}</h3>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Thư viện ảnh */}
            {galleryImages.length > 0 && (
              <ImageGallery images={galleryImages} title={destination.name} />
            )}

            {/* Tours liên quan */}
            {destination.tours && destination.tours.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-2xl font-semibold mb-6">
                  Tours du lịch liên quan
                </h2>
                <div className="grid gap-4">
                  {destination.tours.map((tour, index) => (
                    <Link
                      key={index}
                      to={`/tours/${tour.id}`}
                      className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      {tour.image && (
                        <img
                          src={getImageUrl(tour.image)}
                          alt={tour.title}
                          className="w-24 h-24 rounded-lg object-cover"
                          onError={(e) => {
                            e.target.src = `${API_HOST}/images/placeholder.png`;
                          }}
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium mb-1">{tour.title}</h3>
                        {tour.description && (
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {tour.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm">
                          {tour.duration && (
                            <span className="text-gray-500">
                              <Clock className="w-4 h-4 inline mr-1" />
                              {tour.duration} ngày
                            </span>
                          )}
                          {tour.price && (
                            <span className="text-emerald-600 font-medium">
                              {new Intl.NumberFormat("vi-VN", {
                                style: "currency",
                                currency: "VND",
                              }).format(tour.price)}
                            </span>
                          )}
                          {tour.rating > 0 && (
                            <span className="flex items-center text-yellow-500">
                              <Star className="w-4 h-4 fill-current mr-1" />
                              {tour.rating}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Khách sạn gần đây */}
            {destination.hotels && destination.hotels.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-2xl font-semibold mb-6">
                  Khách sạn gần đây
                </h2>
                <div className="grid gap-4">
                  {destination.hotels.map((hotel, index) => (
                    <Link
                      key={index}
                      to={`/hotels/${hotel.id}`}
                      className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium mb-1">{hotel.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {hotel.location}
                        </p>
                        <div className="flex items-center gap-2 text-sm">
                          {hotel.rating > 0 && (
                            <div className="flex items-center text-yellow-500">
                              <Star className="w-4 h-4 fill-current mr-1" />
                              <span className="font-medium">
                                {hotel.rating.toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm">
                        Xem chi tiết
                      </button>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Đánh giá sao */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-2xl font-semibold mb-6">Đánh giá điểm đến</h2>

              {/* Thống kê rating */}
              <div className="flex items-center gap-8 mb-8 p-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl">
                <div className="text-center">
                  <div className="text-5xl font-bold text-emerald-600 mb-2">
                    {destination.rating > 0
                      ? destination.rating.toFixed(1)
                      : "N/A"}
                  </div>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= Math.round(destination.rating || 0)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">
                    {destination.rating_count || 0} đánh giá
                  </p>
                </div>

                <div className="flex-1">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = destination.rating_breakdown?.[star] || 0;
                    const percentage =
                      destination.rating_count > 0
                        ? ((count / destination.rating_count) * 100).toFixed(0)
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
              {currentUserId && (
                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                  <h3 className="font-semibold mb-4">
                    {destination.user_has_rated
                      ? "Cập nhật đánh giá của bạn"
                      : "Bạn đánh giá điểm đến này như thế nào?"}
                  </h3>
                  <div className="flex items-center gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRatingClick(star)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            star <= (hoverRating || userRating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
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
                    để đánh giá điểm đến này
                  </p>
                </div>
              )}
            </div>

            {/* Bình luận */}
            <CommentSection
              comments={destination.reviews || []}
              commentCount={destination.comment_count || 0}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              likedComments={likedComments}
              onAddComment={handleAddComment}
              onEditComment={handleEditComment}
              onDeleteComment={handleDeleteComment}
              onLikeComment={handleLikeComment}
              onReloadComments={reloadDestination}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-6">
              {/* Quick Actions */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Khám phá ngay</h3>
                <div className="space-y-3">
                  <Link
                    to={`/tours?destination=${id}`}
                    className="w-full bg-emerald-600 text-white py-3 rounded-xl font-medium hover:bg-emerald-700 transition flex items-center justify-center gap-2"
                  >
                    <Camera className="w-5 h-5" />
                    Xem tour du lịch
                  </Link>
                  <Link
                    to={`/hotels?destination=${id}`}
                    className="w-full bg-white text-emerald-600 py-3 rounded-xl font-medium border-2 border-emerald-600 hover:bg-emerald-50 transition flex items-center justify-center gap-2"
                  >
                    <Hotel className="w-5 h-5" />
                    Tìm khách sạn
                  </Link>
                  <Link
                    to={`/transport?destination=${id}`}
                    className="w-full bg-white text-emerald-600 py-3 rounded-xl font-medium border-2 border-emerald-600 hover:bg-emerald-50 transition flex items-center justify-center gap-2"
                  >
                    <Bus className="w-5 h-5" />
                    Đặt vé di chuyển
                  </Link>
                </div>
              </div>

              {/* Phương tiện di chuyển */}
              {destination.transportation && (
                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Phương tiện di chuyển
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                    {destination.transportation}
                  </p>
                </div>
              )}

              {/* Ghi chú */}
              {destination.notes && (
                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold mb-4">Lưu ý thêm</h3>
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                    {destination.notes}
                  </p>
                </div>
              )}

              {/* Travel Tips */}
              <div className="bg-emerald-50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">Lưu ý du lịch</h3>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-center gap-3">
                    <Info className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Nên đặt phòng và tour trước trong mùa cao điểm</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>
                      Mang theo ô/áo mưa vì thời tiết có thể thay đổi đột ngột
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>
                      Nên mặc trang phục lịch sự khi vào các di tích, đền chùa
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DestinationDetail;
