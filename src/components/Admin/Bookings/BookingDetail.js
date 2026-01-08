import { API_URL, API_HOST } from "../../../config/api";
import React, { useState } from "react";
import {
  ArrowLeft,
  User,
  Package,
  Calendar,
  DollarSign,
  Save,
} from "lucide-react";
import toast from "react-hot-toast";
import ConfirmDialog from "../../common/ConfirmDialog";



const BookingDetail = ({ booking, onClose, onUpdate }) => {
  const [status, setStatus] = useState(booking.status);
  const [paymentStatus, setPaymentStatus] = useState(booking.payment_status);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "warning",
    confirmText: "Xác nhận",
    cancelText: "Hủy",
    onConfirm: () => {},
  });
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "Chưa cập nhật";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price || 0);
  };

  // Get service info
  const getServiceInfo = () => {
    if (booking.tour_title) {
      return {
        type: "Tour",
        name: booking.tour_title,
        location: booking.tour_location,
      };
    }
    if (booking.hotel_name) {
      return {
        type: "Khách sạn",
        name: booking.hotel_name,
        location: booking.hotel_location,
      };
    }
    if (booking.flight_airline) {
      return {
        type: "Chuyến bay",
        name: `${booking.flight_airline} - ${booking.flight_code || ""}`,
        location: `${booking.flight_from} → ${booking.flight_to}`,
      };
    }
    if (booking.transport_company) {
      return {
        type: "Vận chuyển",
        name: `${booking.transport_company} (${booking.transport_type})`,
        location: `${booking.transport_from} → ${booking.transport_to}`,
      };
    }
    return { type: "Không xác định", name: "", location: "" };
  };

  const serviceInfo = getServiceInfo();

  // Handle Update Status
  const handleUpdateStatus = () => {
    if (status === booking.status) {
      toast.error("Trạng thái chưa thay đổi");
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: "Xác nhận cập nhật trạng thái",
      message: `Bạn có chắc chắn muốn đổi trạng thái đơn hàng từ "${booking.status}" sang "${status}"?`,
      type: "warning",
      confirmText: "Cập nhật",
      cancelText: "Hủy",
      onConfirm: async () => {
        try {
          const response = await fetch(
            `${API_URL}/api/bookings/admin/bookings/${booking.id}/status`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status }),
            }
          );

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Failed to update status");
          }

          toast.success("Cập nhật trạng thái thành công!");
          booking.status = status; // Update local state
          if (onUpdate) await onUpdate();
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        } catch (error) {
          console.error("Error updating status:", error);
          toast.error(error.message || "Có lỗi xảy ra!");
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }
      },
    });
  };

  // Handle Update Payment Status
  const handleUpdatePayment = () => {
    if (paymentStatus === booking.payment_status) {
      toast.error("Trạng thái thanh toán chưa thay đổi");
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: "Xác nhận cập nhật thanh toán",
      message: `Bạn có chắc chắn muốn đổi trạng thái thanh toán từ "${booking.payment_status}" sang "${paymentStatus}"?`,
      type: "warning",
      confirmText: "Cập nhật",
      cancelText: "Hủy",
      onConfirm: async () => {
        try {
          const response = await fetch(
            `${API_URL}/api/bookings/admin/bookings/${booking.id}/payment`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ payment_status: paymentStatus }),
            }
          );

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Failed to update payment status");
          }

          toast.success("Cập nhật trạng thái thanh toán thành công!");
          booking.payment_status = paymentStatus; // Update local state
          if (onUpdate) await onUpdate();
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        } catch (error) {
          console.error("Error updating payment:", error);
          toast.error(error.message || "Có lỗi xảy ra!");
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 -mx-8 -mt-8 px-8 py-8 mb-8">
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
                  Chi tiết đơn hàng
                </h1>
                <p className="text-green-100 mt-1">Mã đơn: #{booking.id}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Customer Info */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Thông tin khách hàng
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Tên</p>
              <p className="text-gray-900 font-medium">
                {booking.customer_name || booking.customer_full_name || "Guest"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Email</p>
              <p className="text-gray-900 font-medium">
                {booking.contact_email || booking.customer_email}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Số điện thoại</p>
              <p className="text-gray-900 font-medium">
                {booking.contact_phone ||
                  booking.customer_phone ||
                  "Chưa cập nhật"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">Trạng thái đơn hàng</p>
              <div className="flex gap-2 items-center">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="pending">Chờ xác nhận</option>
                  <option value="confirmed">Đã xác nhận</option>
                  <option value="completed">Hoàn thành</option>
                  <option value="cancelled">Đã hủy</option>
                </select>
                {status !== booking.status && (
                  <button
                    onClick={handleUpdateStatus}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Lưu
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Service Info */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Thông tin dịch vụ
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Loại dịch vụ</p>
              <p className="text-gray-900 font-medium">{serviceInfo.type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Tên dịch vụ</p>
              <p className="text-gray-900 font-medium">
                {serviceInfo.name || "Chưa cập nhật"}
              </p>
            </div>
            {serviceInfo.location && (
              <div className="col-span-2">
                <p className="text-sm text-gray-500 mb-1">Địa điểm</p>
                <p className="text-gray-900 font-medium">
                  {serviceInfo.location}
                </p>
              </div>
            )}
            {booking.check_in && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Ngày nhận phòng</p>
                <p className="text-gray-900 font-medium">
                  {formatDate(booking.check_in)}
                </p>
              </div>
            )}
            {booking.check_out && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Ngày trả phòng</p>
                <p className="text-gray-900 font-medium">
                  {formatDate(booking.check_out)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Booking Info */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Thông tin đơn hàng
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Ngày đặt</p>
              <p className="text-gray-900 font-medium">
                {formatDate(booking.booking_date)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">
                Trạng thái thanh toán
              </p>
              <div className="flex gap-2 items-center">
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="pending">Chưa thanh toán</option>
                  <option value="paid">Đã thanh toán</option>
                  <option value="refunded">Đã hoàn tiền</option>
                  <option value="failed">Thất bại</option>
                </select>
                {paymentStatus !== booking.payment_status && (
                  <button
                    onClick={handleUpdatePayment}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Lưu
                  </button>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Ngày tạo</p>
              <p className="text-gray-900 font-medium">
                {formatDate(booking.created_at)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Cập nhật lần cuối</p>
              <p className="text-gray-900 font-medium">
                {formatDate(booking.updated_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Price Info */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Thông tin thanh toán
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-gray-600">Tổng tiền:</span>
              <span className="text-2xl font-bold text-green-600">
                {formatPrice(booking.total_price)}
              </span>
            </div>
            {booking.notes && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Ghi chú</p>
                <p className="text-gray-900">{booking.notes}</p>
              </div>
            )}
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

      {/* Confirm Dialog */}
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

export default BookingDetail;
