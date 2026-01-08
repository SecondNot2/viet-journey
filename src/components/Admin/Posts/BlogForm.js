import { API_URL, API_HOST } from "../../../config/api";
import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Save,
  Upload,
  Link as LinkIcon,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";



const BlogForm = ({ blog, onClose, onSave, viewMode, editMode }) => {
  const isAddMode = !blog && !viewMode;
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Get current user (admin) for author_id
  const [currentUser, setCurrentUser] = useState(null);
  const [authors, setAuthors] = useState([]);
  const [categories, setCategories] = useState([]);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
    author_id: "",
    image: "",
  });

  const [imageInputValue, setImageInputValue] = useState("");
  const [errors, setErrors] = useState({});

  // Fetch authors and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch authors
        const authorsRes = await fetch(`${API_URL}/blogs/admin/authors`);
        if (authorsRes.ok) {
          const authorsData = await authorsRes.json();
          setAuthors(authorsData);
        }

        // Fetch categories
        const categoriesRes = await fetch(
          `${API_URL}/blogs/admin/categories`
        );
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setCategories(categoriesData);
        }

        // Get current user from auth context
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const user = JSON.parse(userStr);
          setCurrentUser(user);
          if (isAddMode && !formData.author_id) {
            setFormData((prev) => ({ ...prev, author_id: user.id }));
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  // Initialize form data if editing
  useEffect(() => {
    if (blog) {
      setFormData({
        title: blog.title || "",
        content: blog.content || "",
        category: blog.category || "",
        author_id: blog.author_id || "",
        image: blog.image || "",
      });
    }
  }, [blog]);

  // Handle image file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!validTypes.includes(file.type)) {
      toast.error("Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WEBP)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File ảnh không được vượt quá 5MB");
      return;
    }

    setUploadingImage(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("image", file);

      const response = await fetch(`${API_URL}/hotels/upload`, {
        method: "POST",
        body: formDataUpload,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      setFormData({ ...formData, image: data.imageUrl });
      toast.success("Upload ảnh thành công!");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Có lỗi xảy ra khi upload ảnh!");
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle add image URL
  const handleAddImageUrl = () => {
    if (!imageInputValue.trim()) return;
    setFormData({ ...formData, image: imageInputValue.trim() });
    setImageInputValue("");
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Vui lòng nhập tiêu đề";
    }

    if (!formData.content.trim()) {
      newErrors.content = "Vui lòng nhập nội dung";
    }

    if (!formData.category) {
      newErrors.category = "Vui lòng chọn danh mục";
    }

    if (!formData.author_id) {
      newErrors.author_id = "Vui lòng chọn tác giả";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (viewMode) {
      onClose();
      return;
    }

    if (!validateForm()) {
      toast.error("Vui lòng kiểm tra lại các trường bắt buộc");
      return;
    }

    setLoading(true);
    try {
      const url = blog
        ? `${API_URL}/blogs/admin/blogs/${blog.id}`
        : `${API_URL}/blogs/admin/blogs`;

      const method = blog ? "PUT" : "POST";

      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("content", formData.content);
      formDataToSend.append("category", formData.category);
      formDataToSend.append("author_id", formData.author_id);

      // If image is a URL, send as image_url
      if (formData.image && formData.image.startsWith("http")) {
        formDataToSend.append("image_url", formData.image);
      }

      const response = await fetch(url, {
        method,
        body: formDataToSend,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save blog");
      }

      toast.success(
        blog ? "Cập nhật bài viết thành công!" : "Tạo bài viết thành công!"
      );
      onSave();
    } catch (error) {
      console.error("Error saving blog:", error);
      toast.error(error.message || "Có lỗi xảy ra!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 -mx-8 -mt-8 px-8 py-6 mb-8 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-white" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {viewMode
                    ? "Xem bài viết"
                    : blog
                    ? "Sửa bài viết"
                    : "Thêm bài viết mới"}
                </h1>
                <p className="text-purple-100 text-sm mt-1">
                  {viewMode
                    ? "Chi tiết bài viết"
                    : blog
                    ? "Cập nhật thông tin bài viết"
                    : "Tạo bài viết mới"}
                </p>
              </div>
            </div>
            {!viewMode && (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 bg-white text-purple-600 px-6 py-3 rounded-xl font-medium hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Lưu thay đổi
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                Thông tin cơ bản
              </h2>
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tiêu đề <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    disabled={viewMode}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                    placeholder="VD: Khám phá Vịnh Hạ Long"
                  />
                  {errors.title && (
                    <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                  )}
                </div>

                {/* Category & Author */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Danh mục <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      disabled={viewMode}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                    >
                      <option value="">-- Chọn danh mục --</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                      {!categories.includes(formData.category) &&
                        formData.category && (
                          <option value={formData.category}>
                            {formData.category}
                          </option>
                        )}
                    </select>
                    {errors.category && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.category}
                      </p>
                    )}
                  </div>

                  {/* Author */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tác giả <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.author_id}
                      onChange={(e) =>
                        setFormData({ ...formData, author_id: e.target.value })
                      }
                      disabled={viewMode}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                    >
                      <option value="">-- Chọn tác giả --</option>
                      {authors.map((author) => (
                        <option key={author.id} value={author.id}>
                          {author.username}{" "}
                          {author.full_name && `(${author.full_name})`}
                        </option>
                      ))}
                    </select>
                    {errors.author_id && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.author_id}
                      </p>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nội dung <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    disabled={viewMode}
                    rows={12}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                    placeholder="Nhập nội dung bài viết..."
                  />
                  {errors.content && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.content}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Image Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Hình ảnh
              </h2>
              <div className="space-y-4">
                {/* Current Image */}
                {formData.image && (
                  <div className="relative">
                    <img
                      src={formData.image}
                      alt="Blog"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    {!viewMode && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, image: "" })}
                        className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600"
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                )}

                {!viewMode && (
                  <>
                    {/* Upload from device */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload từ thiết bị
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-500 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="image-upload"
                          disabled={uploadingImage}
                        />
                        <label
                          htmlFor="image-upload"
                          className="cursor-pointer flex flex-col items-center"
                        >
                          {uploadingImage ? (
                            <>
                              <Loader2 className="w-8 h-8 mb-2 text-purple-500 animate-spin" />
                              <p className="text-sm text-gray-500">
                                Đang upload...
                              </p>
                            </>
                          ) : (
                            <>
                              <Upload className="w-8 h-8 mb-2 text-gray-500" />
                              <p className="mb-2 text-sm text-gray-500">
                                <span className="font-semibold">
                                  Click để upload
                                </span>{" "}
                                hoặc kéo thả
                              </p>
                              <p className="text-xs text-gray-500">
                                PNG, JPG, GIF (MAX. 5MB)
                              </p>
                            </>
                          )}
                        </label>
                      </div>
                    </div>

                    {/* Or URL input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hoặc nhập URL hình ảnh
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={imageInputValue}
                          onChange={(e) => setImageInputValue(e.target.value)}
                          placeholder="https://example.com/image.jpg"
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={handleAddImageUrl}
                          disabled={!imageInputValue.trim()}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <LinkIcon className="w-4 h-4" />
                          Thêm
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* View Mode Actions */}
            {viewMode && (
              <div className="flex justify-end pt-6 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-600 text-white rounded-xl font-medium hover:bg-gray-700 transition-colors"
                >
                  Đóng
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default BlogForm;
