import { API_URL, API_HOST } from "../../../config/api";
import React, { useState } from "react";
import {
  ArrowLeft,
  Star,
  User,
  Calendar,
  MessageSquare,
  Ban,
  CheckCircle,
  ThumbsUp,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import ConfirmDialog from "../../common/ConfirmDialog";



const ReviewForm = ({ review, onClose, onStatusChange }) => {
  const [loading, setLoading] = useState(false);

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

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hour = String(date.getHours()).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");
    return `${hour}:${minute} ${day}/${month}/${year}`;
  };

  // Get service type label
  const getServiceTypeLabel = () => {
    if (review.tour_id) return "Tour";
    if (review.hotel_id) return "Khách sạn";
    if (review.flight_id) return "Chuyến bay";
    if (review.transport_id) return "Vận chuyển";
    if (review.destination_id) return "Điểm đến";
    if (review.blog_id) return "Bài viết";
    return "Không xác định";
  };

  // Handle Ban
  const handleBan = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Khóa đánh giá",
      message:
        "Bạn có chắc chắn muốn khóa đánh giá này?\n\nĐánh giá sẽ không hiển thị với người dùng.",
      type: "warning",
      confirmText: "Khóa",
      cancelText: "Hủy",
      onConfirm: async () => {
        setLoading(true);
        try {
          const response = await fetch(
            `${API_URL}/api/reviews/admin/reviews/${review.id}/status`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ status: "banned" }),
            }
          );

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Failed to ban review");
          }

          toast.success("Đã khóa đánh giá thành công!");
          setConfirmDialog({ ...confirmDialog, isOpen: false });
          onStatusChange();
          onClose();
        } catch (error) {
          console.error("Error banning review:", error);
          toast.error(error.message || "Có lỗi xảy ra khi khóa đánh giá!");
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // Handle Unban
  const handleUnban = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Mở khóa đánh giá",
      message:
        "Bạn có chắc chắn muốn mở khóa đánh giá này?\n\nĐánh giá sẽ hiển thị lại với người dùng.",
      type: "info",
      confirmText: "Mở khóa",
      cancelText: "Hủy",
      onConfirm: async () => {
        setLoading(true);
        try {
          const response = await fetch(
            `${API_URL}/api/reviews/admin/reviews/${review.id}/status`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ status: "active" }),
            }
          );

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Failed to unban review");
          }

          toast.success("Đã mở khóa đánh giá thành công!");
          setConfirmDialog({ ...confirmDialog, isOpen: false });
          onStatusChange();
          onClose();
        } catch (error) {
          console.error("Error unbanning review:", error);
          toast.error(error.message || "Có lỗi xảy ra khi mở khóa đánh giá!");
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 -mx-8 -mt-8 px-8 py-8 mb-8">
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
                  Chi tiết đánh giá
                </h1>
                <p className="text-purple-100 mt-1">
                  Xem và quản lý trạng thái đánh giá
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {review.status === "active" ? (
                <button
                  onClick={handleBan}
                  disabled={loading}
                  className="flex items-center gap-2 bg-yellow-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-yellow-600 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <Ban className="w-5 h-5" />
                      Khóa đánh giá
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleUnban}
                  disabled={loading}
                  className="flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-600 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Mở khóa đánh giá
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Review Info */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Thông tin đánh giá
          </h2>

          {/* User & Rating */}
          <div className="flex items-start gap-6 mb-6 pb-6 border-b">
            <div className="bg-purple-100 text-purple-700 w-16 h-16 rounded-full flex items-center justify-center font-semibold text-xl">
              {review.username?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {review.username || "Người dùng"}
              </h3>
              <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{review.email || "Không có email"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(review.created_at)}</span>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-6 h-6 ${
                      i < review.rating
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
                <span className="ml-2 text-lg font-medium text-gray-700">
                  {review.rating.toFixed(1)} / 5.0
                </span>
              </div>
            </div>

            {/* Status Badge */}
            <div>
              {review.status === "active" ? (
                <span className="inline-block px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium">
                  Active
                </span>
              ) : (
                <span className="inline-block px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium">
                  Banned
                </span>
              )}
            </div>
          </div>

          {/* Comment */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Nội dung đánh giá</h3>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-gray-700 leading-relaxed">{review.comment}</p>
            </div>
          </div>

          {/* Service Info */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Loại dịch vụ</p>
              <p className="text-gray-900 font-medium">
                {getServiceTypeLabel()}
              </p>
            </div>
            {review.likes_count > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Lượt thích</p>
                <div className="flex items-center gap-2">
                  <ThumbsUp className="w-5 h-5 text-blue-600" />
                  <p className="text-gray-900 font-medium">
                    {review.likes_count}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Thông tin bổ sung
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Ngày tạo</p>
              <p className="text-gray-900 font-medium">
                {formatDate(review.created_at)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Cập nhật lần cuối</p>
              <p className="text-gray-900 font-medium">
                {formatDate(review.updated_at)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">ID Đánh giá</p>
              <p className="text-gray-900 font-medium">#{review.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">ID Người dùng</p>
              <p className="text-gray-900 font-medium">#{review.user_id}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Đóng
          </button>
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

export default ReviewForm;
