import React, { useState } from "react";
import {
  ArrowLeft,
  Star,
  Calendar,
  User,
  Mail,
  MapPin,
  Building,
  Plane,
  Car,
  Mountain,
  FileText,
  Ban,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import ConfirmationModal from "../../../components/ConfirmationModal";

const ReviewDetail = ({ review, onClose, onBan, onUnban }) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionType, setActionType] = useState(null);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Chưa cập nhật";
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString("vi-VN", options);
  };

  // Get service icon based on type
  const getServiceIcon = (type) => {
    switch (type) {
      case "hotel":
        return <Building className="w-6 h-6 text-white" />;
      case "flight":
        return <Plane className="w-6 h-6 text-white" />;
      case "transport":
        return <Car className="w-6 h-6 text-white" />;
      case "destination":
        return <Mountain className="w-6 h-6 text-white" />;
      case "blog":
        return <FileText className="w-6 h-6 text-white" />;
      default:
        return null;
    }
  };

  const handleBanClick = () => {
    setActionType("ban");
    setShowConfirmModal(true);
  };

  const handleUnbanClick = () => {
    setActionType("unban");
    setShowConfirmModal(true);
  };

  const handleConfirm = async () => {
    try {
      if (actionType === "ban") {
        await onBan(review.id);
      } else if (actionType === "unban") {
        await onUnban(review.id);
      }
      setShowConfirmModal(false);
    } catch (error) {
      console.error("Error in action:", error);
      toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
    }
  };

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
              Chi tiết đánh giá
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {review.status === "active" ? (
              <button
                onClick={handleBanClick}
                className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors flex items-center gap-2"
              >
                <Ban className="w-4 h-4" />
                Ban đánh giá
              </button>
            ) : (
              <button
                onClick={handleUnbanClick}
                className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Mở khóa
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-white/80 hover:text-white transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {/* Status Banner */}
        {review.status === "banned" && (
          <div className="mb-6 bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <div>
              <h3 className="font-medium text-red-800">Đánh giá đã bị ban</h3>
              <p className="text-red-600 text-sm">
                Đánh giá này đã bị ban và không hiển thị cho người dùng khác
              </p>
            </div>
          </div>
        )}

        {/* User Info & Rating */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full blur opacity-50 group-hover:opacity-75 transition duration-1000"></div>
            <img
              src={review.user?.avatar || "/default-avatar.png"}
              alt={review.user?.username}
              className="relative w-40 h-40 rounded-full object-cover border-4 border-white shadow-xl"
            />
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {review.user?.full_name || review.user?.username}
            </h2>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < review.rating
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
                <span className="ml-2 text-lg font-semibold text-gray-900">
                  {review.rating}/5
                </span>
              </div>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  review.status === "active"
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {review.status === "active" ? "Hoạt động" : "Đã bị ban"}
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-gray-500">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>{review.user?.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500 rounded-xl">
                {getServiceIcon(review.service?.type)}
              </div>
              <div>
                <p className="text-sm text-gray-500">Loại dịch vụ</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">
                  {review.service?.type || "Không xác định"}
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
                <p className="text-sm text-gray-500">Ngày đánh giá</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDate(review.created_at)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500 rounded-xl">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Đánh giá</p>
                <p className="text-lg font-semibold text-gray-900">
                  {review.rating}/5 sao
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Service Information */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                Thông tin dịch vụ
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Tên dịch vụ</p>
                <p className="mt-1 text-gray-900">{review.service?.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Loại dịch vụ
                </p>
                <p className="mt-1 text-gray-900 capitalize">
                  {review.service?.type}
                </p>
              </div>
            </div>
          </div>

          {/* Review Content */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                Nội dung đánh giá
              </h3>
            </div>
            <div className="p-6">
              <p className="text-gray-600 whitespace-pre-wrap">
                {review.comment}
              </p>
            </div>
          </div>
        </div>

        {/* Status Information */}
        <div className="mt-8">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                Trạng thái đánh giá
              </h3>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    review.status === "active"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {review.status === "active" ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Đang hoạt động
                    </>
                  ) : (
                    <>
                      <Ban className="w-4 h-4 mr-1" />
                      Đã bị ban
                    </>
                  )}
                </span>
                <span className="text-sm text-gray-500">
                  Cập nhật lần cuối: {formatDate(review.updated_at)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirm}
        title={
          actionType === "ban"
            ? "Xác nhận ban đánh giá"
            : "Xác nhận mở khóa đánh giá"
        }
        message={
          actionType === "ban"
            ? "Bạn có chắc chắn muốn ban đánh giá này? Đánh giá sẽ không hiển thị cho người dùng khác sau khi bị ban."
            : "Bạn có chắc chắn muốn mở khóa đánh giá này? Đánh giá sẽ được hiển thị lại cho người dùng khác."
        }
        confirmText={actionType === "ban" ? "Ban" : "Mở khóa"}
        confirmColor={actionType === "ban" ? "red" : "emerald"}
      />
    </div>
  );
};

export default ReviewDetail;
