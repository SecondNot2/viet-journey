import { API_URL, API_HOST } from "../../../config/api";
import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Save,
  BedDouble,
  Users,
  Image as ImageIcon,
  Wifi,
  Tv,
  AirVent,
  Coffee,
  ShowerHead,
  Sparkles,
  CheckCircle,
  Loader2,
  X,
  Building2,
  Upload,
  Link as LinkIcon,
} from "lucide-react";
import toast from "react-hot-toast";



const ROOM_AMENITY_OPTIONS = [
  { value: "wifi", label: "WiFi", icon: Wifi },
  { value: "tv", label: "TV", icon: Tv },
  { value: "air_conditioning", label: "Điều hòa", icon: AirVent },
  { value: "mini_bar", label: "Minibar", icon: Coffee },
  { value: "private_bathroom", label: "Phòng tắm riêng", icon: ShowerHead },
  { value: "housekeeping", label: "Dọn phòng", icon: Sparkles },
];

const RoomForm = ({ room, hotel, onClose, onSave, viewMode, editMode }) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [imageInputValue, setImageInputValue] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    capacity: "",
    amenities: [],
    images: [],
    status: "available",
  });

  const isViewMode = viewMode;
  const isEditMode = editMode || !!room;
  const isAddMode = !room && !viewMode;

  // Initialize form data
  useEffect(() => {
    if (room) {
      setFormData({
        name: room.name || "",
        price: room.price || "",
        capacity: room.capacity || "",
        amenities: Array.isArray(room.amenities) ? room.amenities : [],
        images: Array.isArray(room.images) ? room.images : [],
        status: room.status || "available",
      });
    }
  }, [room]);

  // Validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Vui lòng nhập tên phòng";
    }

    if (!formData.price || formData.price <= 0) {
      newErrors.price = "Giá phải lớn hơn 0";
    }

    if (!formData.capacity || formData.capacity <= 0) {
      newErrors.capacity = "Sức chứa phải lớn hơn 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isViewMode) {
      onClose();
      return;
    }

    if (!validateForm()) {
      toast.error("Vui lòng kiểm tra lại thông tin");
      return;
    }

    if (!hotel) {
      toast.error("Không tìm thấy thông tin khách sạn");
      return;
    }

    setLoading(true);
    try {
      const url = room
        ? `${API_URL}/api/hotels/admin/rooms/${room.id}`
        : `${API_URL}/api/hotels/admin/hotels/${hotel.id}/rooms`;

      const method = room ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          capacity: parseInt(formData.capacity),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save room");
      }

      toast.success(
        room ? "Cập nhật phòng thành công!" : "Tạo phòng thành công!"
      );
      onSave();
    } catch (error) {
      console.error("Error saving room:", error);
      toast.error(error.message || "Có lỗi xảy ra khi lưu phòng");
    } finally {
      setLoading(false);
    }
  };

  // Handle input change
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  // Handle amenity toggle
  const handleAmenityToggle = (amenity) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  // Handle image URL add
  const handleAddImageUrl = () => {
    if (imageInputValue && imageInputValue.trim()) {
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, imageInputValue.trim()],
      }));
      setImageInputValue(""); // Clear input after adding
    }
  };

  // Handle image file upload
  const handleImageFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file hình ảnh");
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước file không được vượt quá 5MB");
      return;
    }

    const formDataUpload = new FormData();
    formDataUpload.append("image", file);

    try {
      const response = await fetch(`${API_URL}/api/hotels/upload`, {
        method: "POST",
        body: formDataUpload,
      });

      if (!response.ok) throw new Error("Failed to upload image");

      const data = await response.json();
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, data.imageUrl],
      }));
      toast.success("Upload hình ảnh thành công!");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Không thể upload hình ảnh");
    }
  };

  // Handle image remove
  const handleRemoveImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN").format(price) + " đ";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 -mx-8 -mt-8 px-8 py-6 mb-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <BedDouble className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    {isViewMode
                      ? "Chi tiết phòng"
                      : isEditMode
                      ? "Chỉnh sửa phòng"
                      : "Thêm phòng mới"}
                  </h1>
                  {hotel && (
                    <p className="text-white/80 text-sm mt-0.5">{hotel.name}</p>
                  )}
                </div>
              </div>
            </div>
            {!isViewMode && (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-white text-purple-600 rounded-lg font-medium hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    {isEditMode ? "Cập nhật" : "Tạo mới"}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Hotel Info Banner */}
            {hotel && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <Building2 className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Khách sạn</p>
                    <p className="font-semibold text-gray-900">{hotel.name}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Basic Information */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <BedDouble className="w-6 h-6 text-purple-600" />
                Thông tin cơ bản
              </h2>

              <div className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên phòng <span className="text-red-500">*</span>
                  </label>
                  {isViewMode ? (
                    <p className="text-gray-900 text-lg">{formData.name}</p>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          handleInputChange("name", e.target.value)
                        }
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                          errors.name ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder="VD: Phòng Deluxe 2 giường đơn"
                        disabled={isViewMode}
                      />
                      {errors.name && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.name}
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* Price and Capacity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Giá/đêm (VNĐ) <span className="text-red-500">*</span>
                    </label>
                    {isViewMode ? (
                      <p className="text-lg font-semibold text-purple-600">
                        {formatPrice(formData.price)}
                      </p>
                    ) : (
                      <>
                        <input
                          type="number"
                          value={formData.price}
                          onChange={(e) =>
                            handleInputChange("price", e.target.value)
                          }
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                            errors.price ? "border-red-500" : "border-gray-300"
                          }`}
                          placeholder="1000000"
                          min="0"
                          disabled={isViewMode}
                        />
                        {errors.price && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.price}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  {/* Capacity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Users className="w-4 h-4 inline mr-1" />
                      Sức chứa (người) <span className="text-red-500">*</span>
                    </label>
                    {isViewMode ? (
                      <p className="text-gray-900 text-lg">
                        {formData.capacity} người
                      </p>
                    ) : (
                      <>
                        <input
                          type="number"
                          value={formData.capacity}
                          onChange={(e) =>
                            handleInputChange("capacity", e.target.value)
                          }
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                            errors.capacity
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          placeholder="2"
                          min="1"
                          disabled={isViewMode}
                        />
                        {errors.capacity && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.capacity}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trạng thái
                  </label>
                  {isViewMode ? (
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        formData.status === "available"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {formData.status === "available"
                        ? "Có sẵn"
                        : "Không có sẵn"}
                    </span>
                  ) : (
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        handleInputChange("status", e.target.value)
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      disabled={isViewMode}
                    >
                      <option value="available">Có sẵn</option>
                      <option value="unavailable">Không có sẵn</option>
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div className="border-t pt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Tiện nghi phòng
              </h2>
              {isViewMode ? (
                <div className="flex flex-wrap gap-3">
                  {formData.amenities.length > 0 ? (
                    formData.amenities.map((amenity) => {
                      const option = ROOM_AMENITY_OPTIONS.find(
                        (opt) => opt.value === amenity
                      );
                      const Icon = option?.icon || Wifi;
                      return (
                        <span
                          key={amenity}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium"
                        >
                          <Icon className="w-4 h-4" />
                          {option?.label || amenity}
                        </span>
                      );
                    })
                  ) : (
                    <p className="text-gray-500">Không có tiện nghi</p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {ROOM_AMENITY_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const isSelected = formData.amenities.includes(
                      option.value
                    );
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleAmenityToggle(option.value)}
                        disabled={isViewMode}
                        className={`flex items-center gap-2 px-4 py-3 border-2 rounded-lg transition-all ${
                          isSelected
                            ? "border-purple-500 bg-purple-50 text-purple-700"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-sm font-medium">
                          {option.label}
                        </span>
                        {isSelected && (
                          <CheckCircle className="w-4 h-4 ml-auto" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Images */}
            <div className="border-t pt-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <ImageIcon className="w-6 h-6 text-purple-600" />
                  Hình ảnh phòng
                </h2>
              </div>

              {/* Image Upload Controls */}
              {!isViewMode && (
                <div className="mb-6 space-y-4">
                  {/* Upload from device */}
                  <div className="flex items-center gap-3">
                    <label className="flex-1">
                      <div className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all cursor-pointer">
                        <Upload className="w-5 h-5 text-gray-400" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700">
                            Upload từ thiết bị
                          </p>
                          <p className="text-xs text-gray-500">
                            PNG, JPG, GIF (Max 5MB)
                          </p>
                        </div>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* URL input */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="url"
                        value={imageInputValue}
                        onChange={(e) => setImageInputValue(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddImageUrl();
                          }
                        }}
                        placeholder="Hoặc nhập URL hình ảnh..."
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      disabled={!imageInputValue.trim()}
                      className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Thêm
                    </button>
                  </div>
                </div>
              )}

              {formData.images.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={
                          image.startsWith("http")
                            ? image
                            : `${API_URL}${image}`
                        }
                        alt={`Room ${index + 1}`}
                        className="w-full h-40 object-cover rounded-lg"
                      />
                      {!isViewMode && (
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Chưa có hình ảnh</p>
                </div>
              )}
            </div>

            {/* View Mode Info */}
            {isViewMode && room && (
              <div className="border-t pt-8 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Ngày tạo:</span>
                  <span className="font-medium">
                    {new Date(room.created_at).toLocaleString("vi-VN")}
                  </span>
                </div>
                {room.updated_at && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Cập nhật lần cuối:</span>
                    <span className="font-medium">
                      {new Date(room.updated_at).toLocaleString("vi-VN")}
                    </span>
                  </div>
                )}
                {room.booking_count !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Số lượt đặt:</span>
                    <span className="font-medium">{room.booking_count}</span>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="border-t pt-8 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {isViewMode ? "Đóng" : "Hủy"}
              </button>
              {!isViewMode && (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      {isEditMode ? "Cập nhật" : "Tạo mới"}
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RoomForm;
