import React, { useState, useEffect } from "react";
import { API_URL, API_HOST } from "../../../config/api";

const PLACEHOLDER_IMAGE = `${API_HOST}/images/placeholder.png`;
import {
  ArrowLeft,
  Save,
  Upload,
  Trash2,
  AlertCircle,
  CheckCircle,
  User,
  Calendar,
  Tag,
  FileText,
  Image as ImageIcon,
  MessageSquare,
} from "lucide-react";

const PostForm = ({ post, onClose, onSave, viewMode: initialViewMode }) => {
  const [viewMode, setViewMode] = useState(initialViewMode);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    author_id: "",
    category: "",
    image: "",
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title || "",
        content: post.content || "",
        author_id: post.author_id || "",
        category: post.category || "",
        image: post.image || "",
      });
      setImagePreview(post.image || "");
    }
  }, [post]);

  const validateForm = () => {
    const newErrors = {};

    // Validate required fields
    if (!formData.title?.trim()) newErrors.title = "Vui lòng nhập tiêu đề";
    if (!formData.content?.trim()) newErrors.content = "Vui lòng nhập nội dung";
    if (!formData.author_id) newErrors.author_id = "Vui lòng chọn tác giả";
    if (!formData.category?.trim())
      newErrors.category = "Vui lòng chọn danh mục";

    // Validate title length
    if (formData.title?.length > 255) {
      newErrors.title = "Tiêu đề không được vượt quá 255 ký tự";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});
    setSuccessMessage("");

    try {
      const url = post ? `${API_URL}/blogs/${post.id}` : `${API_URL}/blogs`;

      const method = post ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Lỗi khi lưu bài viết");
      }

      setSuccessMessage(
        post ? "Cập nhật bài viết thành công!" : "Thêm bài viết mới thành công!"
      );

      // Đóng form sau 2 giây
      setTimeout(() => {
        if (onSave) {
          onSave(data);
        }
      }, 2000);
    } catch (error) {
      console.error("Error saving post:", error);
      setErrors({
        submit:
          error.message || "Có lỗi xảy ra khi lưu bài viết. Vui lòng thử lại.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData({ ...formData, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Chưa cập nhật";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  if (viewMode) {
    return (
      <div className="bg-white rounded-2xl shadow-sm">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-semibold text-white">
                Chi tiết bài viết
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setViewMode(false);
                }}
                className="px-4 py-2 bg-white text-emerald-600 rounded-xl hover:bg-emerald-50 transition-colors"
              >
                Chỉnh sửa
              </button>
              <button
                onClick={() => onClose()}
                className="px-4 py-2 text-white/80 hover:text-white transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Image & Basic Info */}
          <div className="flex flex-col md:flex-row gap-8 mb-12">
            <div className="w-full md:w-1/3">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl blur opacity-50 group-hover:opacity-75 transition duration-1000"></div>
                <img
                  src={post.image || PLACEHOLDER_IMAGE}
                  alt={post.title}
                  className="relative w-full h-48 object-cover rounded-2xl shadow-xl"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = PLACEHOLDER_IMAGE;
                  }}
                />
              </div>
            </div>
            <div className="w-full md:w-2/3">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {post.title}
              </h2>
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-600">
                  {post.category}
                </span>
                <div className="flex items-center gap-2 text-gray-500">
                  <User className="w-4 h-4" />
                  <span>{post.author_name}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(post.created_at)}</span>
                </div>
              </div>
              <div className="prose max-w-none">
                <p className="text-gray-600">{post.content}</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500 rounded-xl">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Ngày đăng</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatDate(post.created_at)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500 rounded-xl">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Cập nhật lần cuối</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatDate(post.updated_at)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500 rounded-xl">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Bình luận</p>
                  <p className="text-lg font-semibold text-gray-900">0</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-6 rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold text-white">
              {post ? "Chỉnh sửa bài viết" : "Thêm bài viết mới"}
            </h1>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 bg-white text-emerald-600 rounded-xl hover:bg-emerald-50 transition-colors disabled:opacity-50"
          >
            <Save className="w-5 h-5 mr-2" />
            {isLoading ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-8">
        {successMessage && (
          <div className="mb-6 bg-emerald-50 border border-emerald-100 text-emerald-600 px-4 py-3 rounded-xl flex items-start gap-3">
            <CheckCircle className="w-5 h-5 mt-0.5" />
            <p>{successMessage}</p>
          </div>
        )}

        {errors.submit && (
          <div className="mb-6 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <p>{errors.submit}</p>
          </div>
        )}

        <form className="space-y-8">
          {/* Image Upload */}
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative group w-full md:w-1/3">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl blur opacity-50 group-hover:opacity-75 transition duration-1000"></div>
              <div className="relative">
                <img
                  src={imagePreview || PLACEHOLDER_IMAGE}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-2xl shadow-xl"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = PLACEHOLDER_IMAGE;
                  }}
                />
                {imagePreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview("");
                      setFormData({ ...formData, image: "" });
                    }}
                    className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="w-full md:w-2/3">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Ảnh bài viết
              </h3>
              <label className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <Upload className="w-5 h-5 mr-2 text-emerald-500" />
                <span>Tải ảnh lên</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
              <p className="text-sm text-gray-500 mt-2">
                Cho phép PNG, JPG hoặc GIF. Tối đa 1MB.
              </p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 gap-8">
            {/* Basic Information */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">
                  Thông tin bài viết
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tiêu đề
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        className={`w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                          errors.title ? "border-red-300" : "border-gray-200"
                        }`}
                      />
                      <FileText className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.title}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nội dung
                    </label>
                    <div className="relative">
                      <textarea
                        value={formData.content}
                        onChange={(e) =>
                          setFormData({ ...formData, content: e.target.value })
                        }
                        rows={6}
                        className={`w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                          errors.content ? "border-red-300" : "border-gray-200"
                        }`}
                      />
                      <FileText className="w-5 h-5 text-gray-400 absolute left-3 top-4" />
                    </div>
                    {errors.content && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.content}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tác giả
                      </label>
                      <div className="relative">
                        <select
                          value={formData.author_id}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              author_id: e.target.value,
                            })
                          }
                          className={`w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                            errors.author_id
                              ? "border-red-300"
                              : "border-gray-200"
                          }`}
                        >
                          <option value="">Chọn tác giả</option>
                          <option value="1">Nguyễn Văn A</option>
                          <option value="2">Trần Thị B</option>
                        </select>
                        <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      </div>
                      {errors.author_id && (
                        <p className="mt-1 text-sm text-red-500">
                          {errors.author_id}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Danh mục
                      </label>
                      <div className="relative">
                        <select
                          value={formData.category}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              category: e.target.value,
                            })
                          }
                          className={`w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                            errors.category
                              ? "border-red-300"
                              : "border-gray-200"
                          }`}
                        >
                          <option value="">Chọn danh mục</option>
                          <option value="du-lich">Du lịch</option>
                          <option value="am-thuc">Ẩm thực</option>
                          <option value="van-hoa">Văn hóa</option>
                          <option value="kinh-nghiem">Kinh nghiệm</option>
                        </select>
                        <Tag className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      </div>
                      {errors.category && (
                        <p className="mt-1 text-sm text-red-500">
                          {errors.category}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostForm;
