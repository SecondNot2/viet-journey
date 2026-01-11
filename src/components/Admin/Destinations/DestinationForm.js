import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Save,
  Loader2,
  Upload,
  X,
  Plus,
  LinkIcon,
} from "lucide-react";
import toast from "react-hot-toast";
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

const DestinationForm = ({
  destination,
  onClose,
  onSave,
  viewMode,
  editMode,
}) => {
  const isAddMode = !destination && !viewMode;
  const [loading, setLoading] = useState(false);
  const [imageInputValue, setImageInputValue] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    region: "north",
    type: "nature",
    location: "",
    image: "",
    main_image: "",
    open_time: "",
    close_time: "",
    ticket_price: 0,
    best_time_to_visit: "",
    transportation: "",
    images: [],
    activities: [],
    notes: "",
    status: "active",
  });

  const [errors, setErrors] = useState({});

  // States for dynamic inputs
  const [newActivity, setNewActivity] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");

  useEffect(() => {
    if (destination) {
      setFormData({
        name: destination.name || "",
        description: destination.description || "",
        region: destination.region || "north",
        type: destination.type || "nature",
        location: destination.location || "",
        image: destination.image || "",
        main_image: destination.main_image || "",
        open_time: destination.open_time || "",
        close_time: destination.close_time || "",
        ticket_price: destination.ticket_price || 0,
        best_time_to_visit: destination.best_time_to_visit || "",
        transportation: destination.transportation || "",
        images: safeJSONParse(destination.images, []),
        activities: safeJSONParse(destination.activities, []),
        notes: destination.notes || "",
        status: destination.status || "active",
      });
    }
  }, [destination]);

  const safeJSONParse = (value, fallback = []) => {
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return fallback;
      }
    }
    return fallback;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const handleAddActivity = () => {
    if (!newActivity.trim()) return;
    setFormData({
      ...formData,
      activities: [...formData.activities, newActivity.trim()],
    });
    setNewActivity("");
  };

  const handleRemoveActivity = (index) => {
    setFormData({
      ...formData,
      activities: formData.activities.filter((_, i) => i !== index),
    });
  };

  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    setFormData({
      ...formData,
      images: [...formData.images, newImageUrl.trim()],
    });
    setNewImageUrl("");
  };

  const handleRemoveImage = (index) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
  };

  const handleImageFileUpload = async (e, fieldName = "image") => {
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
      toast.error("Kích thước file không được vượt quá 5MB");
      return;
    }

    const formDataUpload = new FormData();
    formDataUpload.append("image", file);

    try {
      const response = await fetch(`${API_URL}/destinations/upload`, {
        method: "POST",
        body: formDataUpload,
        credentials: "include",
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();

      if (fieldName === "image") {
        setFormData({ ...formData, image: data.imageUrl });
      } else if (fieldName === "main_image") {
        setFormData({ ...formData, main_image: data.imageUrl });
      }

      toast.success("Upload ảnh thành công!");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Có lỗi khi upload ảnh");
    }
  };

  const handleAddImageUrl = (fieldName = "image") => {
    if (!imageInputValue.trim()) return;

    if (fieldName === "image") {
      setFormData({ ...formData, image: imageInputValue.trim() });
    } else if (fieldName === "main_image") {
      setFormData({ ...formData, main_image: imageInputValue.trim() });
    }

    setImageInputValue("");
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Vui lòng nhập tên điểm đến";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Vui lòng nhập mô tả";
    }

    if (!formData.location.trim()) {
      newErrors.location = "Vui lòng nhập địa điểm";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (viewMode) {
      onClose();
      return;
    }

    if (!validateForm()) {
      toast.error("Vui lòng kiểm tra lại thông tin!");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        images: JSON.stringify(formData.images),
        activities: JSON.stringify(formData.activities),
      };

      const url = destination
        ? `${API_URL}/destinations/admin/destinations/${destination.id}`
        : `${API_URL}/destinations/admin/destinations`;
      const method = destination ? "PUT" : "POST";

      const response = await fetch(
        url,
        getFetchOptions({
          method,
          body: JSON.stringify(payload),
        })
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save destination");
      }

      toast.success(
        destination
          ? "Cập nhật điểm đến thành công!"
          : "Tạo điểm đến thành công!"
      );
      onSave();
    } catch (error) {
      console.error("Error saving destination:", error);
      toast.error(error.message || "Có lỗi xảy ra khi lưu điểm đến");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN").format(price) + " đ";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 -mx-8 -mt-8 px-8 py-6 mb-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {viewMode
                    ? "Xem thông tin Điểm đến"
                    : editMode
                    ? "Chỉnh sửa Điểm đến"
                    : "Thêm Điểm đến mới"}
                </h1>
              </div>
            </div>

            {!viewMode && (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-xl font-medium hover:bg-indigo-50 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Lưu thông tin
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Thông tin cơ bản
            </h2>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên điểm đến <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={viewMode}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="VD: Vịnh Hạ Long"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Địa điểm <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                disabled={viewMode}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 ${
                  errors.location ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="VD: Quảng Ninh, Việt Nam"
              />
              {errors.location && (
                <p className="text-red-500 text-sm mt-1">{errors.location}</p>
              )}
            </div>

            {/* Region, Type, Status */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Miền
                </label>
                <select
                  name="region"
                  value={formData.region}
                  onChange={handleChange}
                  disabled={viewMode}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="north">Miền Bắc</option>
                  <option value="central">Miền Trung</option>
                  <option value="south">Miền Nam</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  disabled={viewMode}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="nature">Thiên nhiên</option>
                  <option value="culture">Văn hóa</option>
                  <option value="beach">Biển</option>
                  <option value="mountain">Núi</option>
                  <option value="city">Thành phố</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trạng thái
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={viewMode}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="active">Đang hoạt động</option>
                  <option value="inactive">Tạm dừng</option>
                  <option value="draft">Nháp</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                disabled={viewMode}
                rows={4}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 ${
                  errors.description ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Mô tả chi tiết về điểm đến..."
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.description}
                </p>
              )}
            </div>
          </div>

          {/* Time & Ticket */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Thời gian & Giá vé
            </h2>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giờ mở cửa
                </label>
                <input
                  type="time"
                  name="open_time"
                  value={formData.open_time}
                  onChange={handleChange}
                  disabled={viewMode}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giờ đóng cửa
                </label>
                <input
                  type="time"
                  name="close_time"
                  value={formData.close_time}
                  onChange={handleChange}
                  disabled={viewMode}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giá vé (đ)
                </label>
                <input
                  type="number"
                  name="ticket_price"
                  value={formData.ticket_price}
                  onChange={handleChange}
                  disabled={viewMode}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
                  placeholder="VD: 100000"
                  min="0"
                />
                {viewMode && formData.ticket_price > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    {formatPrice(formData.ticket_price)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Best Time & Transportation */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Thông tin thêm
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thời gian tốt nhất để tham quan
              </label>
              <input
                type="text"
                name="best_time_to_visit"
                value={formData.best_time_to_visit}
                onChange={handleChange}
                disabled={viewMode}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
                placeholder="VD: Tháng 3 - Tháng 5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phương tiện di chuyển
              </label>
              <textarea
                name="transportation"
                value={formData.transportation}
                onChange={handleChange}
                disabled={viewMode}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
                placeholder="Mô tả cách di chuyển đến điểm đến..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ghi chú
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                disabled={viewMode}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
                placeholder="Các ghi chú khác..."
              />
            </div>
          </div>

          {/* Activities */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Hoạt động
            </h2>

            <div>
              {!viewMode && (
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newActivity}
                    onChange={(e) => setNewActivity(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" &&
                      (e.preventDefault(), handleAddActivity())
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="VD: Tham quan hang động"
                  />
                  <button
                    type="button"
                    onClick={handleAddActivity}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {formData.activities.map((activity, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
                  >
                    {activity}
                    {!viewMode && (
                      <button
                        type="button"
                        onClick={() => handleRemoveActivity(index)}
                        className="hover:bg-indigo-200 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Main Image */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Hình ảnh chính
            </h2>

            {!viewMode && (
              <div className="space-y-4">
                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload từ thiết bị
                  </label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-gray-500" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click để upload</span>{" "}
                          hoặc kéo thả
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF (MAX. 5MB)
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleImageFileUpload(e, "image")}
                      />
                    </label>
                  </div>
                </div>

                {/* URL Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hoặc nhập URL
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="url"
                        value={imageInputValue}
                        onChange={(e) => setImageInputValue(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === "Enter" &&
                          (e.preventDefault(), handleAddImageUrl("image"))
                        }
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddImageUrl("image")}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Thêm
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Image Preview */}
            {formData.image && (
              <div className="relative inline-block">
                <img
                  src={
                    formData.image.startsWith("http")
                      ? formData.image
                      : `${API_HOST}${formData.image}`
                  }
                  alt="Main"
                  className="w-full max-w-md h-64 object-cover rounded-lg"
                />
                {!viewMode && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, image: "" })}
                    className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Gallery Images */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Thư viện ảnh
            </h2>

            {!viewMode && (
              <div className="flex gap-2 mb-2">
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && (e.preventDefault(), handleAddImage())
                  }
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="URL ảnh"
                />
                <button
                  type="button"
                  onClick={handleAddImage}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              {formData.images.map((img, index) => (
                <div key={index} className="relative">
                  <img
                    src={img.startsWith("http") ? img : `${API_HOST}${img}`}
                    alt={`Gallery ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  {!viewMode && (
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DestinationForm;
