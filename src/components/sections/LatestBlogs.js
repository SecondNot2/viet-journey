import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  Eye,
  MessageCircle,
  User,
  BookOpen,
} from "lucide-react";
import axios from "axios";
import SectionContainer from "../common/SectionContainer";
import { API_BASE_URL, API_HOST } from "../../api";

const LatestBlogs = () => {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        // Thay đổi để lấy 4 bài viết thay vì 3
        const response = await axios.get(`${API_BASE_URL}/blogs`, {
          params: { limit: 4 },
        });

        if (!response.data || response.data.length === 0) {
          setBlogs([]);
          setLoading(false);
          return;
        }

        // Handle both array response and object with blogs property
        const blogsData = response.data.blogs || response.data;
        setBlogs(Array.isArray(blogsData) ? blogsData.slice(0, 4) : []); // Lấy 4 bài viết đầu tiên
        setLoading(false);
      } catch (err) {
        console.error("[ERROR] Lỗi khi tải dữ liệu bài viết:", err);
        let errorMessage =
          "Không thể tải dữ liệu bài viết. Vui lòng thử lại sau.";

        if (err.response) {
          errorMessage =
            err.response.data.error ||
            err.response.data.message ||
            errorMessage;
          console.error("[ERROR] Chi tiết lỗi response:", err.response.data);
        } else if (err.request) {
          errorMessage =
            "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.";
          console.error("[ERROR] Chi tiết lỗi request:", err.request);
        }

        setError(errorMessage);
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  const handleBlogClick = (id) => {
    navigate(`/blog/post/${id}`);
  };

  // Hàm xử lý URL ảnh
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return `${API_HOST}/images/placeholder.png`;
    if (imageUrl.startsWith("http")) return imageUrl;
    if (imageUrl.startsWith("/uploads")) return `${API_HOST}${imageUrl}`;
    return `${API_HOST}/${imageUrl}`.replace(/\/\//g, "/");
  };

  // eslint-disable-next-line no-unused-vars
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

  // Hàm format ngày tháng
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const options = { day: "numeric", month: "long", year: "numeric" };
    return new Date(dateString).toLocaleDateString("vi-VN", options);
  };

  // Hàm cắt ngắn text
  const truncateText = (text, maxLength = 120) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // Component BlogCard tùy chỉnh cho blog
  const BlogCard = ({ blog }) => {
    return (
      <div
        className="bg-white rounded-3xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 hover:border-emerald-200 group"
        onClick={() => handleBlogClick(blog.id)}
      >
        <div className="relative h-56 overflow-hidden">
          <img
            src={getImageUrl(blog.image)}
            alt={blog.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `${API_HOST}/images/placeholder.png`;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover:opacity-70 transition-opacity"></div>

          {/* Blog Type Badge */}
          <div className="absolute top-4 left-4">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 backdrop-blur-sm">
              <BookOpen className="w-3 h-3 mr-1.5" />
              Bài viết
            </span>
          </div>

          {/* Author Info on Image */}
          <div className="absolute bottom-4 left-4 text-white">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4" />
              <span>{blog.author_name || blog.author || "Tác giả"}</span>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <h3 className="font-bold text-xl text-gray-900 line-clamp-2 leading-tight mb-2 group-hover:text-emerald-600 transition-colors">
              {blog.title}
            </h3>
            <p className="text-gray-600 text-sm line-clamp-3">
              {truncateText(
                blog.content?.replace(/<[^>]*>/g, "") || blog.excerpt
              )}
            </p>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(blog.created_at)}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {blog.read_time || "5 phút"}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {blog.views || 0}
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  {blog.comment_count || 0}
                </div>
              </div>
              <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium">
                Đọc thêm
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <SectionContainer
      title="Bài Viết Mới Nhất"
      viewAllLink="/blog"
      viewAllText="Xem tất cả bài viết"
      loading={loading}
      error={error}
      bgColor="bg-gray-50"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {blogs.map((blog) => (
          <BlogCard key={blog.id} blog={blog} />
        ))}
      </div>

      {/* Empty State */}
      {!loading && !error && blogs.length === 0 && (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Chưa có bài viết nào
          </h3>
          <p className="text-gray-600 text-lg mb-6 max-w-md mx-auto">
            Hiện tại chưa có bài viết mới nào. Hãy quay lại sau để khám phá nội
            dung mới.
          </p>
        </div>
      )}
    </SectionContainer>
  );
};

export default LatestBlogs;
