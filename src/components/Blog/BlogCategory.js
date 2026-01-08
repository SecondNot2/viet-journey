import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL, API_HOST } from "../../config/api";
import {
  Calendar,
  Clock,
  Eye,
  MessageCircle,
  Bookmark,
  Share2,
  ArrowLeft,
  Tag,
  TrendingUp,
  BookOpen,
  Star,
  MapPin,
} from "lucide-react";


const BlogCategory = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const categories = {
    food: "Ẩm thực",
    culture: "Văn hóa",
    experience: "Kinh nghiệm",
    destination: "Điểm đến",
    tips: "Mẹo du lịch",
  };

  // Fetch posts by category
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);

        const response = await axios.get(`${API_URL}/api/blogs`, {
          params: { category: category },
        });

        setPosts(response.data);
        setError(null);
      } catch (err) {
        console.error("[ERROR] Lỗi khi tải bài viết theo danh mục:", err);
        setError("Không thể tải danh sách bài viết. Vui lòng thử lại sau.");
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    if (category) {
      fetchPosts();
    }
  }, [category]);

  // Hàm xử lý URL ảnh
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return `${API_URL}/images/placeholder.png`;
    if (imageUrl.startsWith("http")) return imageUrl;
    if (imageUrl.startsWith("/uploads")) return `${API_URL}${imageUrl}`;
    return `${API_URL}/${imageUrl}`.replace(/\/\//g, "/");
  };

  // Hàm xử lý URL avatar
  const getAvatarUrl = (avatarUrl) => {
    // Nếu không có avatar, dùng ảnh mặc định
    if (!avatarUrl) return `${API_URL}/images/default-destination.jpg`;
    // Nếu là URL đầy đủ (http/https), dùng trực tiếp
    if (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://")) {
      return avatarUrl;
    }
    // Nếu bắt đầu bằng /uploads, thêm API_URL
    if (avatarUrl.startsWith("/uploads")) {
      return `${API_URL}${avatarUrl}`;
    }
    // Nếu là tên file, thêm đường dẫn đầy đủ
    return `${API_URL}/uploads/avatars/${avatarUrl}`;
  };

  // Hàm cắt ngắn text
  const truncateText = (text, maxLength = 120) => {
    if (!text) return "";
    // Remove HTML tags
    const cleanText = text.replace(/<[^>]*>/g, "");
    if (cleanText.length <= maxLength) return cleanText;
    return cleanText.substring(0, maxLength) + "...";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 py-20 overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-10"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-24 h-24 bg-white bg-opacity-10 rounded-full animate-pulse"></div>
          <div className="absolute top-32 right-20 w-16 h-16 bg-white bg-opacity-10 rounded-full animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/4 w-20 h-20 bg-white bg-opacity-10 rounded-full animate-pulse delay-2000"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center">
            <button
              onClick={() => navigate("/blog")}
              className="inline-flex items-center gap-2 text-white/90 hover:text-white transition-all bg-white/10 px-6 py-3 rounded-2xl backdrop-blur-md border border-white/20 hover:bg-white/20 mb-8"
            >
              <ArrowLeft className="w-5 h-5" />
              Quay lại Blog
            </button>

            <div className="inline-flex items-center px-4 py-2 bg-white bg-opacity-20 rounded-full text-emerald-100 text-sm font-medium mb-6 backdrop-blur-sm">
              <Tag className="w-4 h-4 mr-2" />
              Danh mục
            </div>

            <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
              {categories[category] || "Danh mục không tồn tại"}
            </h1>
            <p className="text-emerald-50 text-xl max-w-3xl mx-auto leading-relaxed">
              Khám phá những bài viết về {categories[category]?.toLowerCase()}{" "}
              từ cộng đồng du lịch Việt Nam
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4 text-emerald-100">
              <div className="flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                <span>{posts.length} bài viết</span>
              </div>
              <div className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                <span>Nội dung chất lượng</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-12">
        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-3xl shadow-lg overflow-hidden animate-pulse"
              >
                <div className="h-56 bg-gray-200"></div>
                <div className="p-6">
                  <div className="h-6 bg-gray-200 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-12 h-12 text-red-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Có lỗi xảy ra
            </h3>
            <p className="text-gray-600 text-lg mb-6 max-w-md mx-auto">
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Blog Posts Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-3xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer border border-gray-100 hover:border-emerald-200"
                onClick={() => navigate(`/blog/post/${post.id}`)}
              >
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={getImageUrl(post.image)}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `${API_URL}/images/placeholder.png`;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover:opacity-70 transition-opacity"></div>
                  <div className="absolute top-4 left-4">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-white bg-opacity-90 text-gray-700 backdrop-blur-sm">
                      <Tag className="w-3 h-3 mr-1.5" />
                      {categories[post.category] || post.category || "Bài viết"}
                    </span>
                  </div>
                  <div className="absolute top-4 right-4">
                    <button
                      className="p-2 rounded-full bg-white bg-opacity-20 text-white hover:bg-opacity-30 backdrop-blur-sm transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle bookmark
                      }}
                    >
                      <Bookmark className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="font-bold text-xl text-gray-900 line-clamp-2 leading-tight mb-2 group-hover:text-emerald-600 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {truncateText(post.content)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(post.created_at).toLocaleDateString("vi-VN")}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />5 phút
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {post.views || 0}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          {post.comment_count || 0}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle share
                          }}
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && posts.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Chưa có bài viết
            </h3>
            <p className="text-gray-600 text-lg mb-6 max-w-md mx-auto">
              Danh mục "{categories[category] || category}" hiện chưa có bài
              viết nào. Hãy quay lại sau để khám phá nội dung mới.
            </p>
            <button
              onClick={() => navigate("/blog")}
              className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium"
            >
              Xem tất cả bài viết
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogCategory;
