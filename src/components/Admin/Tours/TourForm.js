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

const TourForm = ({ tour, onClose, onSave, viewMode, editMode }) => {
  const isAddMode = !tour && !viewMode;
  const [loading, setLoading] = useState(false);
  const [imageInputValue, setImageInputValue] = useState("");

  // Helper lists
  const [guides, setGuides] = useState([]);
  const [destinations, setDestinations] = useState([]);

  const [formData, setFormData] = useState({
    title: "",
    type: "domestic",
    status: "active",
    description: "",
    included_services: [],
    excluded_services: [],
    image: "",
    duration: 1,
    start_dates: [],
    group_size: "",
    difficulty_level: "easy",
    guide_id: "",
    destination_id: "",
    price: 0,
    location: "",
  });

  const [errors, setErrors] = useState({});

  // New states for dynamic inputs
  const [newIncludedService, setNewIncludedService] = useState("");
  const [newExcludedService, setNewExcludedService] = useState("");
  const [newStartDate, setNewStartDate] = useState("");

  useEffect(() => {
    fetchGuides();
    fetchDestinations();
  }, []);

  useEffect(() => {
    if (tour) {
      setFormData({
        title: tour.title || "",
        type: tour.type || "domestic",
        status: tour.status || "active",
        description: tour.description || "",
        included_services: safeJSONParse(tour.included_services, []),
        excluded_services: safeJSONParse(tour.excluded_services, []),
        image: tour.image || "",
        duration: tour.duration || 1,
        start_dates: safeJSONParse(tour.start_dates, []),
        group_size: tour.group_size || "",
        difficulty_level: tour.difficulty_level || "easy",
        guide_id: tour.guide_id || "",
        destination_id: tour.destination_id || "",
        price: tour.price || 0,
        location: tour.location || "",
      });
    }
  }, [tour]);

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

  const fetchGuides = async () => {
    try {
      const response = await fetch(
        `${API_URL}/tours/admin/guides`,
        getFetchOptions()
      );
      if (!response.ok) throw new Error("Failed to fetch guides");
      const data = await response.json();
      setGuides(data.guides || []);
    } catch (error) {
      console.error("Error fetching guides:", error);
    }
  };

  const fetchDestinations = async () => {
    try {
      const response = await fetch(
        `${API_URL}/tours/admin/destinations`,
        getFetchOptions()
      );
      if (!response.ok) throw new Error("Failed to fetch destinations");
      const data = await response.json();
      setDestinations(data.destinations || []);
    } catch (error) {
      console.error("Error fetching destinations:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const handleAddIncludedService = () => {
    if (!newIncludedService.trim()) return;
    setFormData({
      ...formData,
      included_services: [
        ...formData.included_services,
        newIncludedService.trim(),
      ],
    });
    setNewIncludedService("");
  };

  const handleRemoveIncludedService = (index) => {
    setFormData({
      ...formData,
      included_services: formData.included_services.filter(
        (_, i) => i !== index
      ),
    });
  };

  const handleAddExcludedService = () => {
    if (!newExcludedService.trim()) return;
    setFormData({
      ...formData,
      excluded_services: [
        ...formData.excluded_services,
        newExcludedService.trim(),
      ],
    });
    setNewExcludedService("");
  };

  const handleRemoveExcludedService = (index) => {
    setFormData({
      ...formData,
      excluded_services: formData.excluded_services.filter(
        (_, i) => i !== index
      ),
    });
  };

  const handleAddStartDate = () => {
    if (!newStartDate) return;
    if (formData.start_dates.includes(newStartDate)) {
      toast.error("Ngày này đã tồn tại!");
      return;
    }
    setFormData({
      ...formData,
      start_dates: [...formData.start_dates, newStartDate].sort(),
    });
    setNewStartDate("");
  };

  const handleRemoveStartDate = (index) => {
    setFormData({
      ...formData,
      start_dates: formData.start_dates.filter((_, i) => i !== index),
    });
  };

  const handleImageFileUpload = async (e) => {
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
    formDataUpload.append("folder", "tours");

    try {
      // For file upload, don't include Content-Type header
      const response = await fetch(`${API_URL}/upload`, {
        method: "POST",
        credentials: "include",
        body: formDataUpload,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      setFormData({ ...formData, image: data.url });
      toast.success("Upload ảnh thành công!");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Có lỗi khi upload ảnh");
    }
  };

  const handleAddImageUrl = () => {
    if (!imageInputValue.trim()) return;
    setFormData({ ...formData, image: imageInputValue.trim() });
    setImageInputValue("");
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, image: "" });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Vui lòng nhập tên tour";
    }

    if (!formData.location.trim()) {
      newErrors.location = "Vui lòng nhập địa điểm";
    }

    if (!formData.price || formData.price <= 0) {
      newErrors.price = "Giá phải lớn hơn 0";
    }

    if (!formData.duration || formData.duration <= 0) {
      newErrors.duration = "Thời gian phải lớn hơn 0";
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
        included_services: JSON.stringify(formData.included_services),
        excluded_services: JSON.stringify(formData.excluded_services),
        start_dates: JSON.stringify(formData.start_dates),
        guide_id: formData.guide_id || null,
        destination_id: formData.destination_id || null,
      };

      const url = tour
        ? `${API_URL}/tours/admin/tours/${tour.id}`
        : `${API_URL}/tours/admin/tours`;
      const method = tour ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save tour");
      }

      toast.success(
        tour ? "Cập nhật tour thành công!" : "Tạo tour thành công!"
      );
      onSave();
    } catch (error) {
      console.error("Error saving tour:", error);
      toast.error(error.message || "Có lỗi xảy ra khi lưu tour");
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
      <div className="bg-gradient-to-r from-green-600 to-teal-600 -mx-8 -mt-8 px-8 py-6 mb-8">
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
                    ? "Xem thông tin Tour"
                    : editMode
                    ? "Chỉnh sửa Tour"
                    : "Thêm Tour mới"}
                </h1>
              </div>
            </div>

            {!viewMode && (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-white text-green-600 rounded-xl font-medium hover:bg-green-50 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên tour <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                disabled={viewMode}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 ${
                  errors.title ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="VD: Tour Hạ Long Bay 3 ngày 2 đêm"
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title}</p>
              )}
            </div>

            {/* Type, Status, Difficulty */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại tour
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  disabled={viewMode}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="domestic">Trong nước</option>
                  <option value="international">Quốc tế</option>
                  <option value="adventure">Mạo hiểm</option>
                  <option value="cultural">Văn hóa</option>
                  <option value="beach">Biển</option>
                  <option value="mountain">Núi</option>
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="active">Đang hoạt động</option>
                  <option value="inactive">Tạm dừng</option>
                  <option value="draft">Nháp</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Độ khó
                </label>
                <select
                  name="difficulty_level"
                  value={formData.difficulty_level}
                  onChange={handleChange}
                  disabled={viewMode}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="easy">Dễ</option>
                  <option value="moderate">Trung bình</option>
                  <option value="challenging">Khó</option>
                  <option value="difficult">Rất khó</option>
                </select>
              </div>
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
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 ${
                  errors.location ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="VD: Hà Nội, Việt Nam"
              />
              {errors.location && (
                <p className="text-red-500 text-sm mt-1">{errors.location}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                disabled={viewMode}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                placeholder="Mô tả chi tiết về tour..."
              />
            </div>
          </div>

          {/* Price & Duration */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Giá & Thời gian
            </h2>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giá tour <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  disabled={viewMode}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 ${
                    errors.price ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="VD: 5000000"
                />
                {errors.price && (
                  <p className="text-red-500 text-sm mt-1">{errors.price}</p>
                )}
                {viewMode && formData.price > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    {formatPrice(formData.price)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thời gian (ngày) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  disabled={viewMode}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 ${
                    errors.duration ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="VD: 3"
                  min="1"
                />
                {errors.duration && (
                  <p className="text-red-500 text-sm mt-1">{errors.duration}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kích thước nhóm
                </label>
                <input
                  type="text"
                  name="group_size"
                  value={formData.group_size}
                  onChange={handleChange}
                  disabled={viewMode}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                  placeholder="VD: 10-20 người"
                />
              </div>
            </div>
          </div>

          {/* Guide & Destination */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Hướng dẫn viên & Điểm đến
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hướng dẫn viên
                </label>
                <select
                  name="guide_id"
                  value={formData.guide_id}
                  onChange={handleChange}
                  disabled={viewMode}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="">-- Chọn hướng dẫn viên --</option>
                  {guides.map((guide) => (
                    <option key={guide.id} value={guide.id}>
                      {guide.name} ({guide.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Điểm đến
                </label>
                <select
                  name="destination_id"
                  value={formData.destination_id}
                  onChange={handleChange}
                  disabled={viewMode}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="">-- Chọn điểm đến --</option>
                  {destinations.map((dest) => (
                    <option key={dest.id} value={dest.id}>
                      {dest.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Dịch vụ bao gồm & Không bao gồm
            </h2>

            {/* Included Services */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dịch vụ bao gồm
              </label>
              {!viewMode && (
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newIncludedService}
                    onChange={(e) => setNewIncludedService(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" &&
                      (e.preventDefault(), handleAddIncludedService())
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="VD: Vé tham quan"
                  />
                  <button
                    type="button"
                    onClick={handleAddIncludedService}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {formData.included_services.map((service, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                  >
                    {service}
                    {!viewMode && (
                      <button
                        type="button"
                        onClick={() => handleRemoveIncludedService(index)}
                        className="hover:bg-green-200 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>

            {/* Excluded Services */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dịch vụ không bao gồm
              </label>
              {!viewMode && (
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newExcludedService}
                    onChange={(e) => setNewExcludedService(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" &&
                      (e.preventDefault(), handleAddExcludedService())
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="VD: Chi phí cá nhân"
                  />
                  <button
                    type="button"
                    onClick={handleAddExcludedService}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {formData.excluded_services.map((service, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm"
                  >
                    {service}
                    {!viewMode && (
                      <button
                        type="button"
                        onClick={() => handleRemoveExcludedService(index)}
                        className="hover:bg-red-200 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Start Dates */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Ngày khởi hành
            </h2>

            <div>
              {!viewMode && (
                <div className="flex gap-2 mb-2">
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={handleAddStartDate}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {formData.start_dates.map((date, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                  >
                    {new Date(date).toLocaleDateString("vi-VN")}
                    {!viewMode && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStartDate(index)}
                        className="hover:bg-blue-200 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Hình ảnh
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
                        onChange={handleImageFileUpload}
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
                          (e.preventDefault(), handleAddImageUrl())
                        }
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
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
                      : `${API_URL}${formData.image}`
                  }
                  alt="Tour preview"
                  className="w-full max-w-md h-64 object-cover rounded-lg"
                />
                {!viewMode && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default TourForm;
