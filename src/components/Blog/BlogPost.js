import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import {
  Calendar,
  Clock,
  Eye,
  MessageCircle,
  Bookmark,
  Share2,
  ArrowLeft,
  User,
  ThumbsUp,
  Facebook,
  Twitter,
  Linkedin,
  ChevronLeft,
  ChevronRight,
  Info,
  Tag,
  Heart,
  Camera,
  MapPin,
  Star,
  TrendingUp,
  BookOpen,
  Send,
  Edit2,
  Trash2,
  MoreVertical,
  Reply,
  Plane,
  Hotel,
  Bus,
  Compass,
} from "lucide-react";
import Toast from "../common/Toast";
import ImageGallery from "../common/ImageGallery";
import CommentSection from "../common/CommentSection";
import { useAuth } from "../../contexts/AuthContext";
import { API_URL, API_HOST } from "../../config/api";

const BlogPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); // Lấy user từ AuthContext

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [toast, setToast] = useState(null);
  const [likedComments, setLikedComments] = useState(new Set());
  const hasIncrementedView = useRef(false);
  const [detectedLocations, setDetectedLocations] = useState([]);

  // Lấy user ID và role từ AuthContext
  const currentUserId = user?.id || null;
  const isAdmin = user?.role === "admin";

  // Hàm phát hiện địa điểm từ title và content
  const detectLocations = (title, content) => {
    const locations = [
      "Phú Quốc",
      "Hạ Long",
      "Đà Nẵng",
      "Nha Trang",
      "Sapa",
      "Hội An",
      "Huế",
      "Đà Lạt",
      "Vũng Tàu",
      "Phan Thiết",
      "Ninh Bình",
      "Hà Giang",
      "Quy Nhơn",
      "Côn Đảo",
      "Mũi Né",
      "Cần Thơ",
      "TP. Hồ Chí Minh",
      "Hà Nội",
      "Hải Phòng",
      "Cát Bà",
      "Mai Châu",
      "Mộc Châu",
    ];

    const text = `${title} ${content}`.toLowerCase();
    const found = locations.filter((loc) => text.includes(loc.toLowerCase()));

    return found.slice(0, 3); // Giới hạn tối đa 3 địa điểm
  };

  // Fetch blog post data
  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);

        // Chỉ tăng lượt xem 1 lần duy nhất khi component mount lần đầu
        const shouldIncrementView = !hasIncrementedView.current;
        if (shouldIncrementView) {
          hasIncrementedView.current = true;
        }

        // Build query params
        const queryParams = new URLSearchParams();
        if (shouldIncrementView) queryParams.append("incrementView", "true");
        if (currentUserId) queryParams.append("user_id", currentUserId);

        const response = await axios.get(
          `${API_URL}/blogs/${id}${
            queryParams.toString() ? "?" + queryParams.toString() : ""
          }`
        );

        setPost(response.data);

        // Phát hiện địa điểm từ bài viết
        const locations = detectLocations(
          response.data.title,
          response.data.content
        );
        setDetectedLocations(locations);

        // Check if current user has liked this post
        if (currentUserId && response.data.user_has_liked !== undefined) {
          setIsLiked(response.data.user_has_liked);
        }

        // Get liked comments
        if (currentUserId && response.data.liked_comment_ids) {
          setLikedComments(new Set(response.data.liked_comment_ids));
        }

        // Fetch related posts
        const relatedResponse = await axios.get(`${API_URL}/blogs`, {
          params: { limit: 3, category: response.data.category },
        });

        const filtered = relatedResponse.data.filter(
          (p) => p.id !== parseInt(id)
        );
        setRelatedPosts(filtered.slice(0, 2));

        setError(null);
      } catch (err) {
        console.error("[ERROR] Lỗi khi tải bài viết:", err);
        if (err.response?.status === 404) {
          setError("Không tìm thấy bài viết này.");
        } else {
          setError("Không thể tải bài viết. Vui lòng thử lại sau.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPost();
    }
  }, [id, currentUserId]);

  // Show toast notification
  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  // Hàm thêm bình luận - refactored to work with CommentSection
  const handleAddComment = async ({ comment, parent_id }) => {
    const response = await axios.post(`${API_URL}/blogs/${id}/comments`, {
      user_id: currentUserId,
      comment,
      rating: null,
      parent_id,
    });

    // Cập nhật danh sách bình luận
    setPost({
      ...post,
      comments: [response.data.comment, ...(post.comments || [])],
      comment_count: (post.comment_count || 0) + 1,
    });
  };

  // Hàm sửa bình luận - refactored
  const handleEditComment = async (commentId, editedText) => {
    await axios.put(`${API_URL}/blogs/${id}/comments/${commentId}`, {
      user_id: currentUserId,
      comment: editedText,
    });

    // Cập nhật comment trong state
    setPost({
      ...post,
      comments: post.comments.map((c) =>
        c.id === commentId ? { ...c, comment: editedText } : c
      ),
    });
  };

  // Hàm xóa bình luận - refactored
  const handleDeleteComment = async (commentId) => {
    await axios.delete(`${API_URL}/blogs/${id}/comments/${commentId}`, {
      data: {
        user_id: currentUserId,
        is_admin: isAdmin,
      },
    });

    // Xóa comment khỏi state
    setPost({
      ...post,
      comments: post.comments.filter((c) => c.id !== commentId),
      comment_count: Math.max(0, (post.comment_count || 0) - 1),
    });
  };

  // Hàm xử lý like/unlike blog post
  const handleLike = async () => {
    // Check đăng nhập
    if (!currentUserId) {
      showToast("Vui lòng đăng nhập để thích bài viết", "warning");
      return;
    }

    try {
      const endpoint = isLiked ? "unlike" : "like";
      const response = await axios.post(`${API_URL}/blogs/${id}/${endpoint}`, {
        user_id: currentUserId,
      });

      setPost({
        ...post,
        likes: response.data.likes,
      });
      setIsLiked(!isLiked);
      showToast(
        isLiked ? "Đã bỏ thích bài viết" : "Đã thích bài viết",
        "success"
      );
    } catch (error) {
      console.error("Lỗi khi thích bài viết:", error);
      showToast(
        error.response?.data?.error || "Không thể thực hiện thao tác",
        "error"
      );
    }
  };

  // Hàm xử lý like/unlike comment - refactored with toast
  const handleLikeComment = async (commentId) => {
    const isLiked = likedComments.has(commentId);
    const endpoint = isLiked ? "unlike" : "like";

    const response = await axios.post(
      `${API_URL}/blogs/${id}/comments/${commentId}/${endpoint}`,
      { user_id: currentUserId }
    );

    // Cập nhật danh sách liked comments
    const newLikedComments = new Set(likedComments);
    if (isLiked) {
      newLikedComments.delete(commentId);
    } else {
      newLikedComments.add(commentId);
    }
    setLikedComments(newLikedComments);

    // Cập nhật số lượt thích trong comment
    setPost({
      ...post,
      comments: post.comments.map((c) =>
        c.id === commentId ? { ...c, likes_count: response.data.likes } : c
      ),
    });
  };

  // Reload post data
  const reloadPost = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (currentUserId) queryParams.append("user_id", currentUserId);

      const response = await axios.get(
        `${API_URL}/blogs/${id}${
          queryParams.toString() ? "?" + queryParams.toString() : ""
        }`
      );

      setPost(response.data);

      if (currentUserId && response.data.liked_comment_ids) {
        setLikedComments(new Set(response.data.liked_comment_ids));
      }
    } catch (err) {
      console.error("Lỗi khi reload post:", err);
    }
  };

  // Hàm xử lý URL ảnh
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return `${API_HOST}/images/placeholder.png`;
    if (imageUrl.startsWith("http")) return imageUrl;
    if (imageUrl.startsWith("/uploads")) return `${API_HOST}${imageUrl}`;
    return `${API_HOST}/${imageUrl}`.replace(/\/\//g, "/");
  };

  // Hàm xử lý URL avatar
  const getAvatarUrl = (avatarUrl) => {
    // Nếu không có avatar, dùng ảnh mặc định
    if (!avatarUrl) {
      return `${API_HOST}/images/default-destination.jpg`;
    }
    // Nếu là URL đầy đủ (http/https), dùng trực tiếp
    if (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://")) {
      return avatarUrl;
    }
    // Nếu bắt đầu bằng /uploads, thêm API_HOST
    if (avatarUrl.startsWith("/uploads")) {
      return `${API_HOST}${avatarUrl}`;
    }
    // Nếu là tên file, thêm đường dẫn đầy đủ
    return `${API_HOST}/uploads/avatars/${avatarUrl}`;
  };

  // Tạo gallery từ image chính và extract từ content
  const getGalleryImages = () => {
    const images = [];

    // Thêm ảnh chính
    if (post?.image) {
      images.push(getImageUrl(post.image));
    }

    // Extract ảnh từ content HTML
    if (post?.content) {
      const imgRegex = /<img[^>]+src="([^">]+)"/g;
      let match;
      while ((match = imgRegex.exec(post.content)) !== null) {
        const imgSrc = match[1];
        // Chỉ thêm nếu chưa có trong mảng
        if (!images.includes(imgSrc)) {
          images.push(getImageUrl(imgSrc));
        }
      }
    }

    // Nếu không có ảnh nào, trả về placeholder
    if (images.length === 0) {
      return [`${API_HOST}/images/placeholder.png`];
    }

    return images;
  };

  const handleImageNavigation = (direction) => {
    if (!post) return;

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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải bài viết...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-12 h-12 text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Có lỗi xảy ra
          </h3>
          <p className="text-gray-600 mb-6">
            {error || "Không tìm thấy bài viết"}
          </p>
          <button
            onClick={() => navigate("/blog")}
            className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium"
          >
            Quay lại danh sách blog
          </button>
        </div>
      </div>
    );
  }

  const galleryImages = getGalleryImages();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Hero Section with Image Background */}
      <div className="relative h-[60vh] bg-gradient-to-br from-emerald-600 to-teal-800 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={galleryImages[activeImageIndex]}
            alt={post.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
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
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-flex items-center px-3 py-1.5 bg-black/20 rounded-lg text-white text-sm font-medium backdrop-blur-sm border border-white/20">
                    <Tag className="w-4 h-4 mr-2" />
                    {post.category || "Bài viết"}
                  </span>
                  <span className="inline-flex items-center px-3 py-1.5 bg-black/20 rounded-lg text-white text-sm font-medium backdrop-blur-sm border border-white/20">
                    <Clock className="w-4 h-4 mr-2" />5 phút
                  </span>
                </div>
                <h1 className="text-4xl font-bold text-white mb-4">
                  {post.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-white/90">
                  <div className="flex items-center gap-2">
                    <img
                      src={getAvatarUrl(post.author_avatar)}
                      alt={post.author_name || "Tác giả"}
                      className="w-10 h-10 rounded-full border-2 border-white/30"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `${API_HOST}/images/default-destination.jpg`;
                      }}
                    />
                    <div>
                      <div className="font-medium">
                        {post.author_name || "Tác giả"}
                      </div>
                      <div className="text-sm text-white/70">
                        {new Date(post.created_at).toLocaleDateString("vi-VN")}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {post.views || 0}
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      {post.comment_count || 0}
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      {post.likes || 0}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className={`p-3 rounded-xl backdrop-blur-sm transition-all ${
                    isWishlisted
                      ? "bg-red-500 text-white"
                      : "bg-black/20 text-white hover:bg-black/30"
                  }`}
                >
                  <Bookmark
                    className={`w-5 h-5 ${isWishlisted ? "fill-current" : ""}`}
                  />
                </button>
                <button
                  onClick={handleLike}
                  className={`p-3 rounded-xl backdrop-blur-sm transition-all ${
                    isLiked
                      ? "bg-emerald-500 text-white"
                      : "bg-black/20 text-white hover:bg-black/30"
                  }`}
                >
                  <ThumbsUp
                    className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`}
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
            {/* Author Info */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center gap-4">
                <img
                  src={getAvatarUrl(post.author_avatar)}
                  alt={post.author_name || "Tác giả"}
                  className="w-12 h-12 rounded-full"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `${API_HOST}/images/default-destination.jpg`;
                  }}
                />
                <div>
                  <h3 className="font-medium">
                    {post.author_name || "Tác giả"}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(post.created_at).toLocaleDateString("vi-VN")}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />5 phút
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Article Content */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </div>

            {/* Tags */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="font-medium mb-4">Tags</h3>
              <div className="flex flex-wrap gap-2">
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-gray-200 transition-colors cursor-pointer">
                  #{post.category || "Bài viết"}
                </span>
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-gray-200 transition-colors cursor-pointer">
                  #Du lịch
                </span>
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-gray-200 transition-colors cursor-pointer">
                  #Việt Nam
                </span>
              </div>
            </div>

            {/* Thư viện ảnh */}
            {galleryImages.length > 0 && (
              <ImageGallery images={galleryImages} title={post.title} />
            )}

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="font-medium mb-6">Bài viết liên quan</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {relatedPosts.map((relatedPost) => (
                    <div
                      key={relatedPost.id}
                      className="group cursor-pointer"
                      onClick={() => navigate(`/blog/post/${relatedPost.id}`)}
                    >
                      <div className="relative h-48 rounded-xl overflow-hidden mb-4">
                        <img
                          src={getImageUrl(relatedPost.image)}
                          alt={relatedPost.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `${API_HOST}/images/placeholder.png`;
                          }}
                        />
                      </div>
                      <h4 className="font-medium group-hover:text-emerald-600 transition-colors mb-2">
                        {relatedPost.title}
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(relatedPost.created_at).toLocaleDateString(
                            "vi-VN"
                          )}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />5 phút
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bình luận */}
            <CommentSection
              comments={post.comments || []}
              commentCount={post.comment_count || 0}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              likedComments={likedComments}
              onAddComment={handleAddComment}
              onEditComment={handleEditComment}
              onDeleteComment={handleDeleteComment}
              onLikeComment={handleLikeComment}
              onReloadComments={reloadPost}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-6">
              {/* Dịch vụ liên quan */}
              {detectedLocations.length > 0 && (
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Khám phá {detectedLocations[0]}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Tìm kiếm các dịch vụ du lịch tại{" "}
                    {detectedLocations.join(", ")}
                  </p>
                  <div className="space-y-3">
                    <Link
                      to={`/tours?search=${encodeURIComponent(
                        detectedLocations[0]
                      )}`}
                      className="flex items-center gap-3 bg-white text-emerald-700 px-4 py-3 rounded-xl hover:bg-emerald-100 transition-colors shadow-sm group"
                    >
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                        <Compass className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">Xem tour du lịch</div>
                        <div className="text-xs text-gray-500">
                          Tour tại {detectedLocations[0]}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-emerald-600" />
                    </Link>

                    <Link
                      to={`/hotels?search=${encodeURIComponent(
                        detectedLocations[0]
                      )}`}
                      className="flex items-center gap-3 bg-white text-blue-700 px-4 py-3 rounded-xl hover:bg-blue-50 transition-colors shadow-sm group"
                    >
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <Hotel className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">Tìm khách sạn</div>
                        <div className="text-xs text-gray-500">
                          Khách sạn tại {detectedLocations[0]}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-blue-600" />
                    </Link>

                    <Link
                      to={`/flights?to=${encodeURIComponent(
                        detectedLocations[0]
                      )}`}
                      className="flex items-center gap-3 bg-white text-purple-700 px-4 py-3 rounded-xl hover:bg-purple-50 transition-colors shadow-sm group"
                    >
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                        <Plane className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">Đặt vé máy bay</div>
                        <div className="text-xs text-gray-500">
                          Chuyến bay đến {detectedLocations[0]}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-purple-600" />
                    </Link>

                    <Link
                      to={`/transport?to=${encodeURIComponent(
                        detectedLocations[0]
                      )}`}
                      className="flex items-center gap-3 bg-white text-orange-700 px-4 py-3 rounded-xl hover:bg-orange-50 transition-colors shadow-sm group"
                    >
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                        <Bus className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">Đặt vé di chuyển</div>
                        <div className="text-xs text-gray-500">
                          Xe/Tàu đến {detectedLocations[0]}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-orange-600" />
                    </Link>
                  </div>
                </div>
              )}

              {/* Share */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Chia sẻ bài viết</h3>
                <div className="flex flex-col gap-2">
                  <button className="flex items-center justify-center gap-3 bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-700 transition-colors">
                    <Facebook className="w-5 h-5" />
                    <span className="font-medium">Chia sẻ lên Facebook</span>
                  </button>
                  <button className="flex items-center justify-center gap-3 bg-blue-400 text-white px-4 py-3 rounded-xl hover:bg-blue-500 transition-colors">
                    <Twitter className="w-5 h-5" />
                    <span className="font-medium">Chia sẻ lên Twitter</span>
                  </button>
                  <button className="flex items-center justify-center gap-3 bg-blue-700 text-white px-4 py-3 rounded-xl hover:bg-blue-800 transition-colors">
                    <Linkedin className="w-5 h-5" />
                    <span className="font-medium">Chia sẻ lên LinkedIn</span>
                  </button>
                </div>
              </div>

              {/* Tags Cloud */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-emerald-600" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-white text-emerald-700 px-4 py-2 rounded-full text-sm font-medium hover:bg-emerald-100 transition-colors cursor-pointer shadow-sm">
                    #{post.category || "Bài viết"}
                  </span>
                  <span className="bg-white text-emerald-700 px-4 py-2 rounded-full text-sm font-medium hover:bg-emerald-100 transition-colors cursor-pointer shadow-sm">
                    #Du lịch
                  </span>
                  <span className="bg-white text-emerald-700 px-4 py-2 rounded-full text-sm font-medium hover:bg-emerald-100 transition-colors cursor-pointer shadow-sm">
                    #Việt Nam
                  </span>
                  <span className="bg-white text-emerald-700 px-4 py-2 rounded-full text-sm font-medium hover:bg-emerald-100 transition-colors cursor-pointer shadow-sm">
                    #Khám phá
                  </span>
                  <span className="bg-white text-emerald-700 px-4 py-2 rounded-full text-sm font-medium hover:bg-emerald-100 transition-colors cursor-pointer shadow-sm">
                    #Trải nghiệm
                  </span>
                </div>
              </div>

              {/* Blog Stats */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Thống kê</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-600">
                      <Eye className="w-4 h-4" />
                      Lượt xem
                    </span>
                    <span className="font-semibold">{post.views || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-600">
                      <Heart className="w-4 h-4" />
                      Lượt thích
                    </span>
                    <span className="font-semibold">{post.likes || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-600">
                      <MessageCircle className="w-4 h-4" />
                      Bình luận
                    </span>
                    <span className="font-semibold">
                      {post.comment_count || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogPost;
