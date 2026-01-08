import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Star,
  ThumbsUp,
  MessageCircle,
  Calendar,
  Edit2,
  Trash2,
  MapPin,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { API_URL } from "../../config/api";

const Reviews = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        // Lấy reviews của user hiện tại
        const response = await axios.get(`${API_URL}/reviews/user`, {
          withCredentials: true,
          params: {
            type: activeTab !== "all" ? activeTab : undefined,
          },
        });

        if (!response.data) {
          throw new Error("Không thể lấy dữ liệu đánh giá");
        }

        // Xử lý và định dạng dữ liệu từ API
        const formattedReviews = (response.data.data || response.data).map(
          (review) => {
            let title, location, image;

            if (review.tour_id && review.tours) {
              title = review.tours.title || "Tour du lịch";
              location = review.tours.location;
              image =
                review.tours.image ||
                "https://images.unsplash.com/photo-1512291313931-d4291048e7b6";
            } else if (review.hotel_id && review.hotels) {
              title = review.hotels.name || "Khách sạn";
              location = review.hotels.location;
              image =
                (review.hotels.images && review.hotels.images[0]) ||
                "https://images.unsplash.com/photo-1566073771259-6a8506099945";
            } else if (
              review.flight_id &&
              review.flight_schedules?.flight_routes
            ) {
              const route = review.flight_schedules.flight_routes;
              title = `${route.airline || "Chuyến bay"} - ${
                route.flight_number || ""
              }`;
              location = `${route.from_location || ""} → ${
                route.to_location || ""
              }`;
              image =
                "https://images.unsplash.com/photo-1436491865332-7a61a109cc05";
            } else if (
              review.transport_id &&
              review.transport_trips?.transport_routes
            ) {
              const route = review.transport_trips.transport_routes;
              title = `${route.company || "Xe khách"} - ${route.type || ""}`;
              location = `${route.from_location || ""} → ${
                route.to_location || ""
              }`;
              image =
                "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957";
            } else if (review.destination_id && review.destinations) {
              title = review.destinations.name || "Điểm đến du lịch";
              location = review.destinations.location;
              image =
                review.destinations.image ||
                "https://images.unsplash.com/photo-1512291313931-d4291048e7b6";
            } else if (review.blog_id && review.blogs) {
              title = review.blogs.title || "Bài viết";
              location = review.blogs.category;
              image =
                review.blogs.image ||
                "https://images.unsplash.com/photo-1512291313931-d4291048e7b6";
            } else {
              title = "Đánh giá chung";
              location = "Hệ thống";
              image =
                "https://images.unsplash.com/photo-1512291313931-d4291048e7b6";
            }

            return {
              id: review.id,
              type: review.tour_id
                ? "tour"
                : review.hotel_id
                ? "hotel"
                : review.flight_id
                ? "flight"
                : review.transport_id
                ? "transport"
                : review.destination_id
                ? "destination"
                : review.blog_id
                ? "blog"
                : "other",
              title,
              location: location || "Chưa cập nhật",
              rating: review.rating || 0,
              content: review.comment || "Không có nội dung đánh giá",
              likes: review.likes || 0,
              replies: review.replies || 0,
              image,
              status: review.status,
              created_at: review.created_at,
              updated_at: review.updated_at,
            };
          }
        );

        setReviews(formattedReviews);
        setError(null);
      } catch (err) {
        if (err.response?.status === 401) {
          // Nếu chưa đăng nhập, chuyển hướng về trang login
          navigate("/login", { state: { from: "/profile/reviews" } });
        } else {
          setError(
            err.response?.data?.error || "Có lỗi xảy ra khi tải dữ liệu"
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [activeTab, navigate]);

  const tabs = [
    { id: "all", label: "Tất cả" },
    { id: "tour", label: "Tour" },
    { id: "hotel", label: "Khách sạn" },
    { id: "flight", label: "Chuyến bay" },
    { id: "transport", label: "Vận chuyển" },
    { id: "destination", label: "Điểm đến" },
    { id: "blog", label: "Bài viết" },
  ];

  const filteredReviews =
    activeTab === "all"
      ? reviews
      : reviews.filter((review) => review.type === activeTab);

  // Tính toán phân trang
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentReviews = filteredReviews.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage);

  const handleDeleteReview = async (reviewId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa đánh giá này?")) {
      try {
        await axios.delete(`${API_URL}/reviews/${reviewId}`, {
          withCredentials: true,
        });

        // Cập nhật state sau khi xóa
        setReviews(reviews.filter((review) => review.id !== reviewId));
      } catch (err) {
        alert(err.response?.data?.error || "Có lỗi xảy ra khi xóa đánh giá");
      }
    }
  };

  const handleEditReview = (reviewId) => {
    // Chuyển hướng đến trang chỉnh sửa đánh giá
    window.location.href = `/profile/reviews/edit/${reviewId}`;
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <Star
        key={index}
        className={`w-5 h-5 ${
          index < rating ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Profile Navigation */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <nav className="flex gap-4">
            <Link
              to="/profile"
              className="px-4 py-2 text-gray-600 hover:text-emerald-600 transition-colors"
            >
              Thông tin cá nhân
            </Link>
            <Link
              to="/profile/bookings"
              className="px-4 py-2 text-gray-600 hover:text-emerald-600 transition-colors"
            >
              Lịch sử đặt
            </Link>
            <Link
              to="/profile/reviews"
              className="px-4 py-2 text-emerald-600 border-b-2 border-emerald-500"
            >
              Đánh giá
            </Link>
          </nav>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Profile Navigation */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <nav className="flex gap-4">
            <Link
              to="/profile"
              className="px-4 py-2 text-gray-600 hover:text-emerald-600 transition-colors"
            >
              Thông tin cá nhân
            </Link>
            <Link
              to="/profile/bookings"
              className="px-4 py-2 text-gray-600 hover:text-emerald-600 transition-colors"
            >
              Lịch sử đặt
            </Link>
            <Link
              to="/profile/reviews"
              className="px-4 py-2 text-emerald-600 border-b-2 border-emerald-500"
            >
              Đánh giá
            </Link>
          </nav>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-emerald-600 hover:text-emerald-700"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Profile Navigation */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <nav className="flex gap-4">
            <Link
              to="/profile"
              className="px-4 py-2 text-gray-600 hover:text-emerald-600 transition-colors"
            >
              Thông tin cá nhân
            </Link>
            <Link
              to="/profile/bookings"
              className="px-4 py-2 text-gray-600 hover:text-emerald-600 transition-colors"
            >
              Lịch sử đặt
            </Link>
            <Link
              to="/profile/reviews"
              className="px-4 py-2 text-emerald-600 border-b-2 border-emerald-500"
            >
              Đánh giá
            </Link>
          </nav>
        </div>

        {/* Review Stats */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="grid grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-600 mb-2">
                {reviews.length}
              </div>
              <div className="text-gray-600">Đánh giá</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-600 mb-2">
                {reviews.reduce((sum, review) => sum + (review.likes || 0), 0)}
              </div>
              <div className="text-gray-600">Lượt thích</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-600 mb-2">
                {reviews.length > 0
                  ? (
                      reviews.reduce((sum, review) => sum + review.rating, 0) /
                      reviews.length
                    ).toFixed(1)
                  : "0.0"}
              </div>
              <div className="text-gray-600">Điểm trung bình</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-600 mb-2">
                {reviews.filter((review) => review.status === "active").length}
              </div>
              <div className="text-gray-600">Đang hiển thị</div>
            </div>
          </div>
        </div>

        {/* Review Tabs */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex gap-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setCurrentPage(1); // Reset về trang 1 khi chuyển tab
                }}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? "bg-emerald-50 text-emerald-600"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Review List */}
        <div className="space-y-6">
          {currentReviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-xl shadow-sm overflow-hidden"
            >
              <div className="p-6">
                <div className="flex gap-4">
                  <img
                    src={review.image}
                    alt={review.title}
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-medium">{review.title}</h3>
                      {review.status === "banned" && (
                        <span className="px-2 py-1 bg-red-50 text-red-600 text-xs rounded-full">
                          Đã ẩn
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {review.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(review.created_at).toLocaleDateString(
                          "vi-VN"
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mb-3">
                      {renderStars(review.rating)}
                    </div>
                    <p className="text-gray-600">{review.content}</p>
                    <div className="flex items-center gap-6 mt-4">
                      <button className="flex items-center gap-2 text-gray-500 hover:text-emerald-600 transition-colors">
                        <ThumbsUp className="w-5 h-5" />
                        {review.likes}
                      </button>
                      <button className="flex items-center gap-2 text-gray-500 hover:text-emerald-600 transition-colors">
                        <MessageCircle className="w-5 h-5" />
                        {review.replies}
                      </button>
                      {review.status === "active" && (
                        <>
                          <button
                            onClick={() => handleEditReview(review.id)}
                            className="flex items-center gap-2 text-gray-500 hover:text-emerald-600 transition-colors"
                          >
                            <Edit2 className="w-5 h-5" />
                            Chỉnh sửa
                          </button>
                          <button
                            onClick={() => handleDeleteReview(review.id)}
                            className="flex items-center gap-2 text-gray-500 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                            Xóa
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {filteredReviews.length > itemsPerPage && (
          <div className="flex items-center justify-between px-6 py-4 mt-6">
            <div className="text-sm text-gray-500">
              Hiển thị {indexOfFirstItem + 1}-
              {Math.min(indexOfLastItem, filteredReviews.length)} trong số{" "}
              {filteredReviews.length} đánh giá
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`p-2 border border-gray-200 rounded-lg transition-colors ${
                  currentPage === 1
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-50"
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      currentPage === page
                        ? "bg-emerald-50 text-emerald-600 font-medium"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className={`p-2 border border-gray-200 rounded-lg transition-colors ${
                  currentPage === totalPages
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-50"
                }`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reviews;
