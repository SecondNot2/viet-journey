import { API_URL, API_HOST } from "../../../config/api";
import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Save,
  Loader2,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Clock,
  MapPin,
} from "lucide-react";
import toast from "react-hot-toast";
import ConfirmDialog from "../../common/ConfirmDialog";



const ScheduleForm = ({ tour, onClose, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const [formData, setFormData] = useState({
    day_number: 1,
    title: "",
    description: "",
    accommodation: "",
    meals: "",
    transportation: "",
    start_time: "",
    end_time: "",
    activity: "",
    location: "",
  });

  const [errors, setErrors] = useState({});

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

  useEffect(() => {
    if (tour) {
      fetchSchedules();
    }
  }, [tour]);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/tours/admin/tours/${tour.id}/schedules`
      );
      if (!response.ok) throw new Error("Failed to fetch schedules");

      const data = await response.json();
      setSchedules(data.schedules || []);
    } catch (error) {
      console.error("Error fetching schedules:", error);
      toast.error("Không thể tải lịch trình");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      day_number: schedules.length + 1,
      title: "",
      description: "",
      accommodation: "",
      meals: "",
      transportation: "",
      start_time: "",
      end_time: "",
      activity: "",
      location: "",
    });
    setErrors({});
  };

  const handleAddNew = () => {
    resetForm();
    setEditingSchedule(null);
    setIsAddingNew(true);
  };

  const handleEdit = (schedule) => {
    setFormData({
      day_number: schedule.day_number,
      title: schedule.title || "",
      description: schedule.description || "",
      accommodation: schedule.accommodation || "",
      meals: schedule.meals || "",
      transportation: schedule.transportation || "",
      start_time: schedule.start_time || "",
      end_time: schedule.end_time || "",
      activity: schedule.activity || "",
      location: schedule.location || "",
    });
    setEditingSchedule(schedule);
    setIsAddingNew(false);
  };

  const handleCancelEdit = () => {
    setEditingSchedule(null);
    setIsAddingNew(false);
    resetForm();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.day_number || formData.day_number < 1) {
      newErrors.day_number = "Ngày phải lớn hơn 0";
    }

    if (!formData.title.trim()) {
      newErrors.title = "Vui lòng nhập tiêu đề";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Vui lòng kiểm tra lại thông tin!");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/tours/admin/tours/${tour.id}/schedules`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save schedule");
      }

      toast.success(
        editingSchedule
          ? "Cập nhật lịch trình thành công!"
          : "Thêm lịch trình thành công!"
      );
      await fetchSchedules();
      handleCancelEdit();
    } catch (error) {
      console.error("Error saving schedule:", error);
      toast.error(error.message || "Có lỗi xảy ra khi lưu lịch trình");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (scheduleId, dayNumber) => {
    setConfirmDialog({
      isOpen: true,
      title: "Xác nhận xóa lịch trình",
      message: `Bạn có chắc chắn muốn xóa lịch trình Ngày ${dayNumber}?\n\nHành động này không thể hoàn tác.`,
      type: "danger",
      confirmText: "Xóa",
      cancelText: "Hủy",
      onConfirm: async () => {
        try {
          const response = await fetch(
            `${API_URL}/api/tours/admin/schedules/${scheduleId}`,
            {
              method: "DELETE",
            }
          );

          if (!response.ok) throw new Error("Failed to delete schedule");

          toast.success("Đã xóa lịch trình thành công!");
          await fetchSchedules();
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        } catch (error) {
          console.error("Error deleting schedule:", error);
          toast.error("Có lỗi xảy ra khi xóa lịch trình!");
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }
      },
    });
  };

  const handleSaveAndClose = () => {
    onSave();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 -mx-8 -mt-8 px-8 py-6 mb-8">
        <div className="max-w-6xl mx-auto">
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
                  Quản lý Lịch trình Tour
                </h1>
                <p className="text-white/80 mt-1">{tour?.title}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {!isAddingNew && !editingSchedule && (
                <button
                  onClick={handleAddNew}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-purple-600 rounded-xl font-medium hover:bg-purple-50 transition-all shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                  Thêm ngày
                </button>
              )}
              <button
                onClick={handleSaveAndClose}
                className="flex items-center gap-2 px-6 py-3 bg-white/20 text-white rounded-xl font-medium hover:bg-white/30 transition-all"
              >
                <Save className="w-5 h-5" />
                Lưu & Đóng
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-12 gap-6">
          {/* Schedule List - Left Side */}
          <div className="col-span-5">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Danh sách lịch trình ({schedules.length} ngày)
              </h2>

              {loading && !isAddingNew && !editingSchedule ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                </div>
              ) : schedules.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Chưa có lịch trình nào</p>
                  <button
                    onClick={handleAddNew}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Thêm lịch trình đầu tiên
                  </button>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {schedules.map((schedule) => (
                    <div
                      key={schedule.id}
                      className={`border rounded-lg p-4 transition-all ${
                        editingSchedule?.id === schedule.id
                          ? "border-purple-500 bg-purple-50"
                          : "border-gray-200 hover:border-purple-300"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                              Ngày {schedule.day_number}
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-900">
                            {schedule.title}
                          </h3>
                          {schedule.location && (
                            <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                              <MapPin className="w-3 h-3" />
                              {schedule.location}
                            </div>
                          )}
                          {(schedule.start_time || schedule.end_time) && (
                            <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                              <Clock className="w-3 h-3" />
                              {schedule.start_time} - {schedule.end_time}
                            </div>
                          )}
                        </div>
                      </div>

                      {schedule.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {schedule.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(schedule)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                          Sửa
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(schedule.id, schedule.day_number)
                          }
                          className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Schedule Form - Right Side */}
          <div className="col-span-7">
            {isAddingNew || editingSchedule ? (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {editingSchedule
                      ? `Chỉnh sửa Ngày ${formData.day_number}`
                      : "Thêm ngày mới"}
                  </h2>
                  <button
                    onClick={handleCancelEdit}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Hủy
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Day Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ngày thứ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="day_number"
                      value={formData.day_number}
                      onChange={handleChange}
                      min="1"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                        errors.day_number ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="VD: 1"
                    />
                    {errors.day_number && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.day_number}
                      </p>
                    )}
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tiêu đề <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                        errors.title ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="VD: Khám phá Vịnh Hạ Long"
                    />
                    {errors.title && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.title}
                      </p>
                    )}
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Địa điểm
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="VD: Vịnh Hạ Long, Quảng Ninh"
                    />
                  </div>

                  {/* Time */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Giờ bắt đầu
                      </label>
                      <input
                        type="time"
                        name="start_time"
                        value={formData.start_time}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Giờ kết thúc
                      </label>
                      <input
                        type="time"
                        name="end_time"
                        value={formData.end_time}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mô tả chi tiết
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Mô tả hoạt động trong ngày..."
                    />
                  </div>

                  {/* Activity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hoạt động
                    </label>
                    <textarea
                      name="activity"
                      value={formData.activity}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="VD: Tham quan động Thiên Cung, Du thuyền trên vịnh..."
                    />
                  </div>

                  {/* Accommodation */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Chỗ ở
                    </label>
                    <input
                      type="text"
                      name="accommodation"
                      value={formData.accommodation}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="VD: Khách sạn 4 sao tại Hạ Long"
                    />
                  </div>

                  {/* Meals */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bữa ăn
                    </label>
                    <input
                      type="text"
                      name="meals"
                      value={formData.meals}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="VD: Sáng, Trưa, Tối"
                    />
                  </div>

                  {/* Transportation */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phương tiện
                    </label>
                    <input
                      type="text"
                      name="transportation"
                      value={formData.transportation}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="VD: Xe du lịch, Du thuyền"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-2 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Đang lưu...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          {editingSchedule ? "Cập nhật" : "Thêm"}
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">
                    Chọn một lịch trình bên trái để chỉnh sửa
                  </p>
                  <p className="text-sm text-gray-400">
                    hoặc thêm lịch trình mới cho tour
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
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

export default ScheduleForm;
