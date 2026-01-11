import React, { useState, useEffect } from "react";
import {
  FileText,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Loader2,
  ThumbsUp,
  MessageCircle,
  BarChart2,
  User,
} from "lucide-react";
import toast from "react-hot-toast";
import ConfirmDialog from "../../common/ConfirmDialog";
import BlogForm from "./BlogForm";
import { API_URL, API_HOST } from "../../../config/api";

// Helper function to get fetch options with credentials
const getFetchOptions = (options = {}) => ({
  ...options,
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
    ...options.headers,
  },
});

const AdminBlogs = () => {
  const [loading, setLoading] = useState(false);

  // Blogs state
  const [blogs, setBlogs] = useState([]);
  const [stats, setStats] = useState({
    totalBlogs: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
  });
  const [filters, setFilters] = useState({
    search: "",
    category: "all",
    author_id: "all",
    page: 1,
    limit: 10,
    sort_by: "created_desc",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 0,
  });

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [currentBlog, setCurrentBlog] = useState(null);
  const [formMode, setFormMode] = useState("add"); // 'add' | 'edit' | 'view'

  // Filter options
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "danger",
    confirmText: "Xác nhận",
    cancelText: "Hủy",
    onConfirm: () => {},
  });

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch(
        `${API_URL}/blogs/admin/stats`,
        getFetchOptions()
      );
      if (!response.ok) throw new Error("Failed to fetch stats");

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await fetch(
        `${API_URL}/blogs/admin/categories`,
        getFetchOptions()
      );
      if (!response.ok) throw new Error("Failed to fetch categories");

      const data = await response.json();
      setCategories(Array.isArray(data) ? data : data.categories || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  // Fetch authors
  const fetchAuthors = async () => {
    try {
      const response = await fetch(
        `${API_URL}/blogs/admin/authors`,
        getFetchOptions()
      );
      if (!response.ok) throw new Error("Failed to fetch authors");

      const data = await response.json();
      setAuthors(Array.isArray(data) ? data : data.authors || []);
    } catch (error) {
      console.error("Error fetching authors:", error);
    }
  };

  // Fetch blogs
  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      // Only add params if they have meaningful values
      Object.keys(filters).forEach((key) => {
        const value = filters[key];

        // Skip empty, null, undefined, "all"
        if (
          value === "" ||
          value === null ||
          value === undefined ||
          value === "all"
        ) {
          return;
        }

        params.append(key, value);
      });

      const response = await fetch(
        `${API_URL}/blogs/admin/blogs?${params}`,
        getFetchOptions()
      );
      if (!response.ok) throw new Error("Failed to fetch blogs");

      const data = await response.json();
      setBlogs(data.blogs || []);

      // Ensure pagination is set correctly
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Error fetching blogs:", error);
      toast.error("Không thể tải danh sách bài viết");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchStats();
    fetchCategories();
    fetchAuthors();
  }, []);

  // Fetch blogs when filters change
  useEffect(() => {
    fetchBlogs();
  }, [filters]);

  // Handle Add
  const handleAdd = () => {
    setCurrentBlog(null);
    setFormMode("add");
    setShowForm(true);
  };

  // Handle View
  const handleView = (blog) => {
    setCurrentBlog(blog);
    setFormMode("view");
    setShowForm(true);
  };

  // Handle Edit
  const handleEdit = (blog) => {
    setCurrentBlog(blog);
    setFormMode("edit");
    setShowForm(true);
  };

  // Handle Delete
  const handleDelete = (blogId) => {
    const blog = blogs.find((b) => b.id === blogId);
    if (!blog) return;

    setConfirmDialog({
      isOpen: true,
      title: "Xác nhận xóa bài viết",
      message: `Bạn có chắc chắn muốn xóa bài viết "${blog.title}"?\n\n⚠️ Lưu ý: Tất cả bình luận và lượt thích liên quan sẽ bị xóa theo.`,
      type: "danger",
      confirmText: "Xóa",
      cancelText: "Hủy",
      onConfirm: async () => {
        try {
          const response = await fetch(
            `${API_URL}/blogs/admin/blogs/${blogId}`,
            getFetchOptions({
              method: "DELETE",
            })
          );

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Failed to delete blog");
          }

          await fetchBlogs();
          await fetchStats();
          toast.success("Đã xóa bài viết thành công!");
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        } catch (error) {
          console.error("Error deleting blog:", error);
          toast.error(error.message || "Có lỗi xảy ra khi xóa bài viết!");
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }
      },
    });
  };

  // Handle Form Close
  const handleFormClose = () => {
    setShowForm(false);
    setCurrentBlog(null);
  };

  // Handle Form Save
  const handleFormSave = async () => {
    setShowForm(false);
    setCurrentBlog(null);
    await fetchBlogs();
    await fetchStats();
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Truncate text
  const truncateText = (text, maxLength) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // If form is shown, render form
  if (showForm) {
    return (
      <BlogForm
        blog={currentBlog}
        onClose={handleFormClose}
        onSave={handleFormSave}
        viewMode={formMode === "view"}
        editMode={formMode === "edit"}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with gradient */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 -mx-8 -mt-8 px-8 py-12 mb-8">
        <div className="max-w-screen-xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Quản lý Bài viết
                </h1>
                <p className="text-purple-100 mt-1">
                  Quản lý tất cả bài viết blog
                </p>
              </div>
            </div>
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 bg-white text-purple-600 px-6 py-3 rounded-xl font-medium hover:bg-purple-50 transition-colors shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Thêm bài viết
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm mb-1">Tổng bài viết</p>
                  <p className="text-3xl font-bold text-white">
                    {stats.totalBlogs}
                  </p>
                </div>
                <div className="bg-white/10 p-3 rounded-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm mb-1">Tổng lượt xem</p>
                  <p className="text-3xl font-bold text-white">
                    {stats.totalViews}
                  </p>
                </div>
                <div className="bg-white/10 p-3 rounded-lg">
                  <BarChart2 className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm mb-1">
                    Tổng lượt thích
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {stats.totalLikes}
                  </p>
                </div>
                <div className="bg-white/10 p-3 rounded-lg">
                  <ThumbsUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm mb-1">Tổng bình luận</p>
                  <p className="text-3xl font-bold text-white">
                    {stats.totalComments}
                  </p>
                </div>
                <div className="bg-white/10 p-3 rounded-lg">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        {/* Filters */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tiêu đề hoặc nội dung..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value, page: 1 })
              }
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap gap-4">
            {/* Category Filter */}
            <select
              value={filters.category}
              onChange={(e) =>
                setFilters({ ...filters, category: e.target.value, page: 1 })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">Tất cả danh mục</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            {/* Author Filter */}
            <select
              value={filters.author_id}
              onChange={(e) =>
                setFilters({ ...filters, author_id: e.target.value, page: 1 })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">Tất cả tác giả</option>
              {authors.map((author) => (
                <option key={author.id} value={author.id}>
                  {author.username}{" "}
                  {author.full_name && `(${author.full_name})`}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={filters.sort_by}
              onChange={(e) =>
                setFilters({ ...filters, sort_by: e.target.value, page: 1 })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="created_desc">Mới nhất</option>
              <option value="created_asc">Cũ nhất</option>
              <option value="title_asc">Tên A-Z</option>
              <option value="title_desc">Tên Z-A</option>
              <option value="views_desc">Nhiều lượt xem nhất</option>
              <option value="views_asc">Ít lượt xem nhất</option>
              <option value="likes_desc">Nhiều lượt thích nhất</option>
              <option value="likes_asc">Ít lượt thích nhất</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!loading && blogs.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Không tìm thấy bài viết nào
            </h3>
            <p className="text-gray-500 mb-6">
              Hãy thêm bài viết mới hoặc thay đổi bộ lọc
            </p>
            <button
              onClick={handleAdd}
              className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Thêm bài viết
            </button>
          </div>
        )}

        {/* Blogs Grid */}
        {!loading && blogs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog) => (
              <div
                key={blog.id}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Image */}
                <div className="relative h-48 bg-gray-200">
                  {blog.image ? (
                    <img
                      src={blog.image}
                      alt={blog.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileText className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  {/* Category */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                      {blog.category}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(blog.created_at)}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {blog.title}
                  </h3>

                  {/* Content Preview */}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {truncateText(blog.content, 150)}
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
                    <User className="w-4 h-4" />
                    <span>{blog.author_name}</span>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <BarChart2 className="w-4 h-4" />
                      <span>{blog.views || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="w-4 h-4" />
                      <span>{blog.likes || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      <span>{blog.comment_count || 0}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleView(blog)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Xem
                    </button>
                    <button
                      onClick={() => handleEdit(blog)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(blog.id)}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && blogs.length > 0 && pagination.total > 0 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t">
            <p className="text-sm text-gray-600">
              Hiển thị {(pagination.page - 1) * pagination.limit + 1} -{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              trong tổng số {pagination.total} bài viết
            </p>
            {pagination.total_pages > 1 && (
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setFilters({ ...filters, page: filters.page - 1 })
                  }
                  disabled={filters.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Trước
                </button>
                <span className="px-4 py-2 bg-purple-50 text-purple-600 rounded-lg font-medium">
                  {pagination.page} / {pagination.total_pages}
                </span>
                <button
                  onClick={() =>
                    setFilters({ ...filters, page: filters.page + 1 })
                  }
                  disabled={filters.page === pagination.total_pages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Sau
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ConfirmDialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
      />
    </div>
  );
};

export default AdminBlogs;
