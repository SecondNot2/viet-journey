import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  ChevronDown,
  ChevronUp,
  Star,
  Plane,
  Building2,
  Car,
  Navigation,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const BookingHistory = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [expandedBooking, setExpandedBooking] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user || !user.id) {
        setError("Vui lòng đăng nhập để xem lịch sử đặt chỗ");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          `http://localhost:5000/api/bookings/user/${user.id}`,
          {
            withCredentials: true,
            params: {
              status: activeTab !== "all" ? activeTab : undefined,
            },
          }
        );

        // Xử lý và định dạng dữ liệu từ API
        const formattedBookings = (response.data.data || response.data).map(
          (booking) => {
            let title, location, duration, image, price, guests;

            if (booking.tour_id && booking.tours) {
              title = booking.tours.title || "Tour du lịch";
              location = booking.tours.location || "Chưa cập nhật";
              duration = booking.tours.duration
                ? `${booking.tours.duration} ngày`
                : "3 ngày 2 đêm";
              image =
                booking.tours.image ||
                "https://images.unsplash.com/photo-1512291313931-d4291048e7b6";
              price = booking.tour_price || booking.total_price;
              guests = booking.number_of_guests || 1;
            } else if (booking.hotel_id && booking.hotels) {
              title = booking.hotels.name || "Khách sạn";
              location = booking.hotels.location || "Chưa cập nhật";
              // Calculate duration from dates if not provided
              const nights =
                booking.duration ||
                (booking.end_date && booking.booking_date
                  ? Math.round(
                      (new Date(booking.end_date) -
                        new Date(booking.booking_date)) /
                        (1000 * 60 * 60 * 24)
                    )
                  : 1);
              duration = `${nights} đêm`;
              image =
                (booking.hotels.images && booking.hotels.images[0]) ||
                "https://images.unsplash.com/photo-1566073771259-6a8506099945";
              price = booking.hotel_price || booking.total_price;
              guests = booking.number_of_guests || 1;
            } else if (
              booking.flight_id &&
              booking.flight_schedules?.flight_routes
            ) {
              const route = booking.flight_schedules.flight_routes;
              title = `${route.airline || "Chuyến bay"} ${
                route.flight_number || ""
              }`;
              location = `${route.from_location || ""} → ${
                route.to_location || ""
              }`;
              duration = route.duration
                ? `${Math.floor(route.duration / 60)}h ${route.duration % 60}m`
                : "1h 20m";
              image =
                "https://images.unsplash.com/photo-1436491865332-7a61a109cc05";
              price = booking.flight_price || booking.total_price;
              guests = booking.number_of_guests || 1;

              // Map specific flight details
              booking.departure_time =
                booking.flight_schedules.departure_datetime;
              booking.arrival_time = booking.flight_schedules.arrival_datetime;
              booking.flight_number = route.flight_number;
            } else if (
              booking.transport_id &&
              booking.transport_trips?.transport_routes
            ) {
              const route = booking.transport_trips.transport_routes;
              title = `${route.company || ""} - ${route.type || "Vận chuyển"}`;
              location = `${route.from_location || ""} → ${
                route.to_location || ""
              }`;
              duration = route.duration
                ? `${Math.floor(route.duration / 60)}h ${route.duration % 60}m`
                : "2h";
              image =
                route.image ||
                "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957";
              price = booking.transport_price || booking.total_price;
              guests = booking.number_of_guests || 1;
            }

            // Xử lý ngày tháng
            const bookingDate = booking.booking_date
              ? new Date(booking.booking_date)
              : null;
            const formattedBookingDate = bookingDate
              ? bookingDate.toLocaleDateString("vi-VN")
              : "Chưa cập nhật";

            const endDate = booking.end_date
              ? new Date(booking.end_date)
              : null;
            const formattedEndDate = endDate
              ? endDate.toLocaleDateString("vi-VN")
              : "Chưa cập nhật";

            // Xử lý thời gian bay
            const departureTime =
              booking.flight_id && booking.departure_time
                ? new Date(booking.departure_time)
                : null;
            const arrivalTime =
              booking.flight_id && booking.arrival_time
                ? new Date(booking.arrival_time)
                : null;

            return {
              ...booking,
              title,
              location,
              duration,
              image,
              price: price || 0,
              guests,
              date: formattedBookingDate,
              type: booking.tour_id
                ? "tour"
                : booking.hotel_id
                ? "hotel"
                : booking.flight_id
                ? "flight"
                : "transport",
              details: {
                bookingCode: booking.id || "Chưa có",
                paymentMethod: booking.payment_status || "Chưa thanh toán",
                checkIn: formattedBookingDate,
                checkOut: formattedEndDate,
                flightNumber: booking.flight_number || "Chưa cập nhật",
                departure: departureTime
                  ? departureTime.toLocaleTimeString("vi-VN")
                  : "Chưa cập nhật",
                arrival: arrivalTime
                  ? arrivalTime.toLocaleTimeString("vi-VN")
                  : "Chưa cập nhật",
                seat: booking.seat_number || "Chưa cập nhật",
                gate: booking.gate || "Chưa cập nhật",
                roomType: booking.room_type || "Chưa cập nhật",
                bedType: booking.bed_type || "Chưa cập nhật",
                guide: booking.guide_name || "Chưa phân công",
                pickupLocation: booking.pickup_location || "Chưa cập nhật",
                notes: booking.notes || "Không có ghi chú",
              },
            };
          }
        );

        setBookings(formattedBookings);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.error || "Có lỗi xảy ra khi tải dữ liệu");
        setLoading(false);
      }
    };

    fetchBookings();
  }, [activeTab]);

  const tabs = [
    { id: "all", label: "Tất cả" },
    { id: "upcoming", label: "Sắp tới" },
    { id: "completed", label: "Đã hoàn thành" },
    { id: "cancelled", label: "Đã hủy" },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-emerald-50 text-emerald-600";
      case "upcoming":
        return "bg-blue-50 text-blue-600";
      case "cancelled":
        return "bg-red-50 text-red-600";
      default:
        return "bg-gray-50 text-gray-600";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "completed":
        return "Đã hoàn thành";
      case "upcoming":
        return "Sắp tới";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "tour":
        return Navigation;
      case "flight":
        return Plane;
      case "hotel":
        return Building2;
      case "transport":
        return Car;
      default:
        return Navigation;
    }
  };

  const filteredBookings =
    activeTab === "all"
      ? bookings
      : bookings.filter((booking) => booking.status === activeTab);

  // Tính toán phân trang
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBookings = filteredBookings.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);

  const handleCancelBooking = async (bookingId) => {
    try {
      await axios.put(
        `http://localhost:5000/api/bookings/${bookingId}/status`,
        {
          status: "cancelled",
        },
        {
          withCredentials: true,
        }
      );

      // Cập nhật lại danh sách đặt chỗ
      const updatedBookings = bookings.map((booking) =>
        booking.id === bookingId ? { ...booking, status: "cancelled" } : booking
      );
      setBookings(updatedBookings);
    } catch (err) {
      alert(err.response?.data?.error || "Có lỗi xảy ra khi hủy đặt chỗ");
    }
  };

  const handleReview = (bookingId) => {
    // Chuyển hướng đến trang đánh giá
    window.location.href = `/profile/reviews/create?booking=${bookingId}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Profile Navigation */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <nav className="flex gap-4">
            <Link
              to="/profile"
              className="px-4 py-2 text-gray-600 hover:text-emerald-600 transition-colors"
            >
              Thông tin cá nhân
            </Link>
            <Link
              to="/profile/bookings"
              className="px-4 py-2 text-emerald-600 border-b-2 border-emerald-500"
            >
              Lịch sử đặt
            </Link>
            <Link
              to="/profile/reviews"
              className="px-4 py-2 text-gray-600 hover:text-emerald-600 transition-colors"
            >
              Đánh giá
            </Link>
          </nav>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Profile Navigation */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <nav className="flex gap-4">
            <Link
              to="/profile"
              className="px-4 py-2 text-gray-600 hover:text-emerald-600 transition-colors"
            >
              Thông tin cá nhân
            </Link>
            <Link
              to="/profile/bookings"
              className="px-4 py-2 text-emerald-600 border-b-2 border-emerald-500"
            >
              Lịch sử đặt
            </Link>
            <Link
              to="/profile/reviews"
              className="px-4 py-2 text-gray-600 hover:text-emerald-600 transition-colors"
            >
              Đánh giá
            </Link>
          </nav>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-emerald-600 hover:text-emerald-700"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Profile Navigation */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <nav className="flex gap-4">
            <Link
              to="/profile"
              className="px-4 py-2 text-gray-600 hover:text-emerald-600 transition-colors"
            >
              Thông tin cá nhân
            </Link>
            <Link
              to="/profile/bookings"
              className="px-4 py-2 text-emerald-600 border-b-2 border-emerald-500"
            >
              Lịch sử đặt
            </Link>
            <Link
              to="/profile/reviews"
              className="px-4 py-2 text-gray-600 hover:text-emerald-600 transition-colors"
            >
              Đánh giá
            </Link>
          </nav>
        </div>

        {/* Booking Tabs */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex gap-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? "bg-emerald-50 text-emerald-600"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Booking List */}
        <div className="space-y-4">
          {currentBookings.map((booking) => {
            const TypeIcon = getTypeIcon(booking.type);
            const isExpanded = expandedBooking === booking.id;

            return (
              <div
                key={booking.id}
                className="bg-white rounded-xl shadow-sm overflow-hidden"
              >
                {/* Booking Header */}
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <img
                      src={booking.image}
                      alt={booking.title}
                      className="w-24 h-24 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <TypeIcon className="w-5 h-5 text-emerald-500" />
                        <span
                          className={`px-2 py-1 rounded-full text-sm ${getStatusColor(
                            booking.status
                          )}`}
                        >
                          {getStatusText(booking.status)}
                        </span>
                      </div>
                      <h3 className="text-lg font-medium mb-2">
                        {booking.title}
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-5 h-5" />
                          {booking.date || "Chưa cập nhật"}
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="w-5 h-5" />
                          {booking.location || "Chưa cập nhật"}
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Users className="w-5 h-5" />
                          {booking.guests || 1} người
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-5 h-5" />
                          {booking.duration || "Chưa cập nhật"}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-medium text-emerald-600 mb-2">
                        {(booking.price || 0).toLocaleString("vi-VN")}đ
                      </div>
                      <button
                        onClick={() =>
                          setExpandedBooking(isExpanded ? null : booking.id)
                        }
                        className="flex items-center gap-1 text-gray-500 hover:text-emerald-600 transition-colors"
                      >
                        Chi tiết
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Booking Details */}
                {isExpanded && (
                  <div className="px-6 pb-6 pt-2 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-4">Thông tin đặt chỗ</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Mã đặt chỗ:</span>
                            <span className="font-medium">
                              {booking.details.bookingCode}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">
                              Phương thức thanh toán:
                            </span>
                            <span className="font-medium">
                              {booking.details.paymentMethod}
                            </span>
                          </div>
                          {booking.type === "tour" && (
                            <>
                              <div className="flex justify-between">
                                <span className="text-gray-600">
                                  Hướng dẫn viên:
                                </span>
                                <span className="font-medium">
                                  {booking.details.guide}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">
                                  Điểm đón khách:
                                </span>
                                <span className="font-medium">
                                  {booking.details.pickupLocation}
                                </span>
                              </div>
                            </>
                          )}
                          {booking.type === "flight" && (
                            <>
                              <div className="flex justify-between">
                                <span className="text-gray-600">
                                  Số hiệu chuyến bay:
                                </span>
                                <span className="font-medium">
                                  {booking.details.flightNumber}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Cổng:</span>
                                <span className="font-medium">
                                  {booking.details.gate}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Ghế:</span>
                                <span className="font-medium">
                                  {booking.details.seat}
                                </span>
                              </div>
                            </>
                          )}
                          {booking.type === "hotel" && (
                            <>
                              <div className="flex justify-between">
                                <span className="text-gray-600">
                                  Loại phòng:
                                </span>
                                <span className="font-medium">
                                  {booking.details.roomType}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">
                                  Loại giường:
                                </span>
                                <span className="font-medium">
                                  {booking.details.bedType}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-4">Thời gian</h4>
                        <div className="space-y-2">
                          {(booking.type === "tour" ||
                            booking.type === "hotel") && (
                            <>
                              <div className="flex justify-between">
                                <span className="text-gray-600">
                                  Nhận phòng:
                                </span>
                                <span className="font-medium">
                                  {booking.details.checkIn}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">
                                  Trả phòng:
                                </span>
                                <span className="font-medium">
                                  {booking.details.checkOut}
                                </span>
                              </div>
                            </>
                          )}
                          {booking.type === "flight" && (
                            <>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Cất cánh:</span>
                                <span className="font-medium">
                                  {booking.details.departure}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Hạ cánh:</span>
                                <span className="font-medium">
                                  {booking.details.arrival}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex justify-end gap-4">
                      {booking.status === "completed" && (
                        <button
                          onClick={() => handleReview(booking.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                        >
                          <Star className="w-5 h-5" />
                          Đánh giá
                        </button>
                      )}
                      {booking.status === "upcoming" && (
                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                "Bạn có chắc chắn muốn hủy đặt chỗ này?"
                              )
                            ) {
                              handleCancelBooking(booking.id);
                            }
                          }}
                          className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          Hủy đặt chỗ
                        </button>
                      )}
                      <button className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        Tải hóa đơn
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {filteredBookings.length > itemsPerPage && (
          <div className="flex items-center justify-between px-6 py-4 mt-6">
            <div className="text-sm text-gray-500">
              Hiển thị {indexOfFirstItem + 1}-
              {Math.min(indexOfLastItem, filteredBookings.length)} trong số{" "}
              {filteredBookings.length} đơn đặt
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`p-2 border border-gray-200 rounded-lg transition-colors ${
                  currentPage === 1
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-50"
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      currentPage === page
                        ? "bg-emerald-50 text-emerald-600 font-medium"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className={`p-2 border border-gray-200 rounded-lg transition-colors ${
                  currentPage === totalPages
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-50"
                }`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingHistory;
