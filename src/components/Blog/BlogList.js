import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL, API_HOST } from "../../config/api";
import {
  Calendar,
  Clock,
  Eye,
  MessageCircle,
  Bookmark,
  Share2,
  Search,
  Filter,
  Tag,
  ChevronRight,
  Heart,
  User,
  MapPin,
  Star,
  TrendingUp,
  BookOpen,
} from "lucide-react";

const BlogList = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    sortBy: "latest",
    timeRange: "all",
    author: "all",
  });
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const categories = [
    { id: "all", name: "Tất cả" },
    { id: "food", name: "Ẩm thực" },
    { id: "culture", name: "Văn hóa" },
    { id: "experience", name: "Kinh nghiệm" },
    { id: "destination", name: "Điểm đến" },
    { id: "tips", name: "Mẹo du lịch" },
  ];

  const sortOptions = [
    { id: "latest", name: "Mới nhất" },
    { id: "popular", name: "Phổ biến nhất" },
    { id: "views", name: "Xem nhiều nhất" },
    { id: "comments", name: "Bình luận nhiều nhất" },
  ];

  const timeRangeOptions = [
    { id: "all", name: "Mọi thời điểm" },
    { id: "today", name: "Hôm nay" },
    { id: "week", name: "Tuần này" },
    { id: "month", name: "Tháng này" },
    { id: "year", name: "Năm nay" },
  ];

  const authorOptions = [
    { id: "all", name: "Tất cả tác giả" },
    { id: "verified", name: "Tác giả xác thực" },
    { id: "expert", name: "Chuyên gia" },
    { id: "community", name: "Cộng đồng" },
  ];

  // Fetch blogs from API
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);

        const params = {};
        if (selectedCategory !== "all") {
          params.category = selectedCategory;
        }
        if (searchQuery.trim()) {
          params.search = searchQuery.trim();
        }

        const response = await axios.get(`${API_URL}/blogs`, { params });

        // Handle both array response and object response with blogs property
        const blogsData = Array.isArray(response.data)
          ? response.data
          : response.data?.blogs || response.data?.data || [];
        setBlogs(blogsData);
        setError(null);
      } catch (err) {
        console.error("[ERROR] Lỗi khi tải blog:", err);
        setError("Không thể tải danh sách bài viết. Vui lòng thử lại sau.");
        setBlogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, [selectedCategory, searchQuery]);

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
    if (!avatarUrl) return `${API_HOST}/images/default-destination.jpg`;
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

  const clearFilters = () => {
    setSelectedCategory("all");
    setSearchQuery("");
    setSelectedFilters({
      sortBy: "latest",
      timeRange: "all",
      author: "all",
    });
  };

  return (
    <div className="bg-gray-50 min-h-screen">
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
            <div className="inline-flex items-center px-4 py-2 bg-white bg-opacity-20 rounded-full text-emerald-100 text-sm font-medium mb-6 backdrop-blur-sm">
              <BookOpen className="w-4 h-4 mr-2" />
              Khám phá kiến thức du lịch
            </div>
            <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
              Blog Du Lịch
              <br />
              <span className="text-yellow-300">Việt Nam</span>
            </h1>
            <p className="text-emerald-50 text-xl max-w-3xl mx-auto leading-relaxed">
              Khám phá những trải nghiệm và kiến thức du lịch thú vị từ cộng
              đồng du lịch Việt Nam. Chia sẻ câu chuyện, mẹo hay và những điểm
              đến tuyệt vời.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4 text-emerald-100">
              <div className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                <span>Nội dung chất lượng</span>
              </div>
              <div className="flex items-center">
                <Star className="w-5 h-5 mr-2" />
                <span>Từ chuyên gia</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-12 mb-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 backdrop-blur-sm border border-white border-opacity-20">
          {/* Search Bar */}
          <div className="border-b border-gray-100 pb-6 mb-6">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-4">
              <Search className="w-4 h-4 text-gray-400" />
              Tìm kiếm bài viết
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Nhập từ khóa, tên tác giả, chủ đề..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 text-base border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 flex items-center justify-center"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-4">
              <Filter className="w-4 h-4 text-gray-400" />
              Lọc theo danh mục
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    selectedCategory === category.id
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search Results Info */}
        {(searchQuery || selectedCategory !== "all") && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Kết quả tìm kiếm
                </h3>
                <p className="text-gray-600">
                  {searchQuery && `Từ khóa: "${searchQuery}"`}
                  {searchQuery && selectedCategory !== "all" && " • "}
                  {selectedCategory !== "all" &&
                    `Danh mục: ${
                      categories.find((c) => c.id === selectedCategory)?.name
                    }`}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-emerald-600 mb-1">
                  {blogs.length}
                </div>
                <div className="text-sm text-gray-500">bài viết</div>
              </div>
            </div>
            {(searchQuery || selectedCategory !== "all") && (
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        )}

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
            {blogs.map((post) => (
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
                      e.target.src = `${API_HOST}/images/placeholder.png`;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover:opacity-70 transition-opacity"></div>
                  <div className="absolute top-4 left-4">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-white bg-opacity-90 text-gray-700 backdrop-blur-sm">
                      <Tag className="w-3 h-3 mr-1.5" />
                      {post.category || "Bài viết"}
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
                  <div className="absolute bottom-4 left-4 text-white">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4" />
                      <span>{post.author_name || "Tác giả"}</span>
                    </div>
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
        {!loading && !error && blogs.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Không tìm thấy bài viết
            </h3>
            <p className="text-gray-600 text-lg mb-6 max-w-md mx-auto">
              {searchQuery
                ? `Không có bài viết nào phù hợp với từ khóa "${searchQuery}"`
                : selectedCategory !== "all"
                ? `Không có bài viết nào trong danh mục "${
                    categories.find((c) => c.id === selectedCategory)?.name
                  }"`
                : "Hiện tại chưa có bài viết nào"}
            </p>
            <button
              onClick={clearFilters}
              className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            >
              Xem tất cả bài viết
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogList;
