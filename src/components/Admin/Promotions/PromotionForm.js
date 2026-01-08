import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Save,
  Loader2,
  Calendar,
  Percent,
  DollarSign,
} from "lucide-react";
import toast from "react-hot-toast";
import { API_URL, API_HOST } from "../../../config/api";


const PromotionForm = ({ promotion, onClose, onSave, viewMode, editMode }) => {
  const isAddMode = !promotion && !viewMode;
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    discount: "",
    type: "percentage",
    start_date: "",
    end_date: "",
    min_order_value: "",
    max_discount_value: "",
    usage_limit: "",
    status: "active",
    is_global: 0,
  });

  const [errors, setErrors] = useState({});

  // Load data for edit/view mode
  useEffect(() => {
    if (promotion) {
      setFormData({
        title: promotion.title || "",
        description: promotion.description || "",
        discount: promotion.discount || "",
        type: promotion.type || "percentage",
        start_date: promotion.start_date || "",
        end_date: promotion.end_date || "",
        min_order_value: promotion.min_order_value || "",
        max_discount_value: promotion.max_discount_value || "",
        usage_limit: promotion.usage_limit || "",
        status: promotion.status || "active",
        is_global: promotion.is_global || 0,
      });
    }
  }, [promotion]);

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Vui lòng nhập tiêu đề";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Vui lòng nhập mô tả";
    }

    if (!formData.discount || formData.discount <= 0) {
      newErrors.discount = "Giá trị giảm giá phải lớn hơn 0";
    }

    if (formData.type === "percentage" && formData.discount > 100) {
      newErrors.discount = "Phần trăm giảm giá không được vượt quá 100%";
    }

    if (!formData.start_date) {
      newErrors.start_date = "Vui lòng chọn ngày bắt đầu";
    }

    if (!formData.end_date) {
      newErrors.end_date = "Vui lòng chọn ngày kết thúc";
    }

    if (formData.start_date && formData.end_date) {
      if (new Date(formData.end_date) <= new Date(formData.start_date)) {
        newErrors.end_date = "Ngày kết thúc phải sau ngày bắt đầu";
      }
    }

    if (formData.min_order_value && formData.min_order_value < 0) {
      newErrors.min_order_value = "Giá trị đơn hàng tối thiểu không được âm";
    }

    if (formData.max_discount_value && formData.max_discount_value < 0) {
      newErrors.max_discount_value = "Giá trị giảm giá tối đa không được âm";
    }

    if (formData.usage_limit && formData.usage_limit < 0) {
      newErrors.usage_limit = "Giới hạn sử dụng không được âm";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Vui lòng kiểm tra lại thông tin!");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        discount: parseFloat(formData.discount),
        min_order_value: formData.min_order_value
          ? parseFloat(formData.min_order_value)
          : null,
        max_discount_value: formData.max_discount_value
          ? parseFloat(formData.max_discount_value)
          : null,
        usage_limit: formData.usage_limit
          ? parseInt(formData.usage_limit)
          : null,
        is_global: formData.is_global ? 1 : 0,
      };

      const url = isAddMode
        ? `${API_URL}/api/promotions`
        : `${API_URL}/api/promotions/${promotion.id}`;

      const method = isAddMode ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save promotion");
      }

      toast.success(
        isAddMode
          ? "Tạo khuyến mãi thành công!"
          : "Cập nhật khuyến mãi thành công!"
      );

      onSave();
    } catch (error) {
      console.error("Error saving promotion:", error);
      toast.error(error.message || "Có lỗi xảy ra khi lưu khuyến mãi!");
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 -mx-8 -mt-8 px-8 py-8 mb-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="bg-white/10 backdrop-blur-sm p-2 rounded-lg hover:bg-white/20 transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-white" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {viewMode
                    ? "Chi tiết khuyến mãi"
                    : isAddMode
                    ? "Thêm khuyến mãi mới"
                    : "Chỉnh sửa khuyến mãi"}
                </h1>
                <p className="text-orange-100 mt-1">
                  {viewMode
                    ? "Xem thông tin chi tiết khuyến mãi"
                    : isAddMode
                    ? "Tạo khuyến mãi mới cho dịch vụ"
                    : "Cập nhật thông tin khuyến mãi"}
                </p>
              </div>
            </div>
            {!viewMode && (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 bg-white text-orange-600 px-6 py-3 rounded-xl font-medium hover:bg-orange-50 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Lưu khuyến mãi
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Thông tin cơ bản
            </h2>
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiêu đề <span className="text-red-500">*</span>
                </label>
                {viewMode ? (
                  <p className="text-gray-900">{formData.title}</p>
                ) : (
                  <>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      className={`w-full px-4 py-3 border ${
                        errors.title ? "border-red-500" : "border-gray-300"
                      } rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                      placeholder="VD: Giảm giá mùa hè"
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.title}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả <span className="text-red-500">*</span>
                </label>
                {viewMode ? (
                  <p className="text-gray-900">{formData.description}</p>
                ) : (
                  <>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      rows={4}
                      className={`w-full px-4 py-3 border ${
                        errors.description
                          ? "border-red-500"
                          : "border-gray-300"
                      } rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                      placeholder="Mô tả chi tiết về khuyến mãi..."
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.description}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Type & Discount */}
              <div className="grid grid-cols-2 gap-4">
                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loại giảm giá <span className="text-red-500">*</span>
                  </label>
                  {viewMode ? (
                    <p className="text-gray-900">
                      {formData.type === "percentage"
                        ? "Phần trăm (%)"
                        : "Số tiền cố định (đ)"}
                    </p>
                  ) : (
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="percentage">Phần trăm (%)</option>
                      <option value="fixed">Số tiền cố định (đ)</option>
                    </select>
                  )}
                </div>

                {/* Discount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giá trị giảm <span className="text-red-500">*</span>
                  </label>
                  {viewMode ? (
                    <p className="text-gray-900">
                      {formData.type === "percentage"
                        ? `${formData.discount}%`
                        : `${parseFloat(formData.discount).toLocaleString()}đ`}
                    </p>
                  ) : (
                    <>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          value={formData.discount}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              discount: e.target.value,
                            })
                          }
                          className={`w-full px-4 py-3 pr-10 border ${
                            errors.discount
                              ? "border-red-500"
                              : "border-gray-300"
                          } rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                          placeholder={
                            formData.type === "percentage" ? "0-100" : "0"
                          }
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                          {formData.type === "percentage" ? (
                            <Percent className="w-5 h-5" />
                          ) : (
                            <span className="text-sm">đ</span>
                          )}
                        </div>
                      </div>
                      {errors.discount && (
                        <p className="mt-1 text-sm text-red-500">
                          {errors.discount}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày bắt đầu <span className="text-red-500">*</span>
                  </label>
                  {viewMode ? (
                    <p className="text-gray-900">
                      {formatDate(formData.start_date)}
                    </p>
                  ) : (
                    <>
                      <div className="relative">
                        <input
                          type="date"
                          value={formData.start_date}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              start_date: e.target.value,
                            })
                          }
                          className={`w-full px-4 py-3 pr-10 border ${
                            errors.start_date
                              ? "border-red-500"
                              : "border-gray-300"
                          } rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                        />
                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                      </div>
                      {errors.start_date && (
                        <p className="mt-1 text-sm text-red-500">
                          {errors.start_date}
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày kết thúc <span className="text-red-500">*</span>
                  </label>
                  {viewMode ? (
                    <p className="text-gray-900">
                      {formatDate(formData.end_date)}
                    </p>
                  ) : (
                    <>
                      <div className="relative">
                        <input
                          type="date"
                          value={formData.end_date}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              end_date: e.target.value,
                            })
                          }
                          className={`w-full px-4 py-3 pr-10 border ${
                            errors.end_date
                              ? "border-red-500"
                              : "border-gray-300"
                          } rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                        />
                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                      </div>
                      {errors.end_date && (
                        <p className="mt-1 text-sm text-red-500">
                          {errors.end_date}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Additional Settings */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Cài đặt bổ sung
            </h2>
            <div className="space-y-4">
              {/* Min Order Value */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giá trị đơn hàng tối thiểu
                </label>
                {viewMode ? (
                  <p className="text-gray-900">
                    {formData.min_order_value
                      ? `${parseFloat(
                          formData.min_order_value
                        ).toLocaleString()}đ`
                      : "Không giới hạn"}
                  </p>
                ) : (
                  <>
                    <input
                      type="number"
                      step="1000"
                      value={formData.min_order_value}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          min_order_value: e.target.value,
                        })
                      }
                      className={`w-full px-4 py-3 border ${
                        errors.min_order_value
                          ? "border-red-500"
                          : "border-gray-300"
                      } rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                      placeholder="VD: 500000"
                    />
                    {errors.min_order_value && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.min_order_value}
                      </p>
                    )}
                    <p className="mt-1 text-sm text-gray-500">
                      Để trống nếu không giới hạn
                    </p>
                  </>
                )}
              </div>

              {/* Max Discount Value */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giá trị giảm giá tối đa
                </label>
                {viewMode ? (
                  <p className="text-gray-900">
                    {formData.max_discount_value
                      ? `${parseFloat(
                          formData.max_discount_value
                        ).toLocaleString()}đ`
                      : "Không giới hạn"}
                  </p>
                ) : (
                  <>
                    <input
                      type="number"
                      step="1000"
                      value={formData.max_discount_value}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          max_discount_value: e.target.value,
                        })
                      }
                      className={`w-full px-4 py-3 border ${
                        errors.max_discount_value
                          ? "border-red-500"
                          : "border-gray-300"
                      } rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                      placeholder="VD: 1000000"
                    />
                    {errors.max_discount_value && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.max_discount_value}
                      </p>
                    )}
                    <p className="mt-1 text-sm text-gray-500">
                      Chỉ áp dụng cho loại phần trăm. Để trống nếu không giới
                      hạn
                    </p>
                  </>
                )}
              </div>

              {/* Usage Limit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giới hạn số lần sử dụng
                </label>
                {viewMode ? (
                  <p className="text-gray-900">
                    {formData.usage_limit
                      ? `${formData.usage_limit} lần`
                      : "Không giới hạn"}
                  </p>
                ) : (
                  <>
                    <input
                      type="number"
                      value={formData.usage_limit}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          usage_limit: e.target.value,
                        })
                      }
                      className={`w-full px-4 py-3 border ${
                        errors.usage_limit
                          ? "border-red-500"
                          : "border-gray-300"
                      } rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                      placeholder="VD: 100"
                    />
                    {errors.usage_limit && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.usage_limit}
                      </p>
                    )}
                    <p className="mt-1 text-sm text-gray-500">
                      Để trống nếu không giới hạn
                    </p>
                  </>
                )}
              </div>

              {/* Status & Is Global */}
              <div className="grid grid-cols-2 gap-4">
                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trạng thái
                  </label>
                  {viewMode ? (
                    <span
                      className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                        formData.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {formData.status === "active" ? "Active" : "Inactive"}
                    </span>
                  ) : (
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  )}
                </div>

                {/* Is Global */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Khuyến mãi toàn cục
                  </label>
                  {viewMode ? (
                    <span
                      className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                        formData.is_global
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {formData.is_global ? "Có" : "Không"}
                    </span>
                  ) : (
                    <div className="flex items-center h-[50px]">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.is_global === 1}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              is_global: e.target.checked ? 1 : 0,
                            })
                          }
                          className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Áp dụng cho tất cả dịch vụ
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* View mode metadata */}
          {viewMode && promotion && (
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Thông tin khác
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Đã sử dụng</p>
                  <p className="text-gray-900 font-medium">
                    {promotion.used_count || 0} lần
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Ngày tạo</p>
                  <p className="text-gray-900 font-medium">
                    {formatDate(promotion.created_at)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions for non-view mode */}
          {!viewMode && (
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Lưu khuyến mãi
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default PromotionForm;
