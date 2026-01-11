import React, { useState, useEffect } from "react";
import {
  Building2,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Loader2,
  MapPin,
  Star,
  BedDouble,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import ConfirmDialog from "../../common/ConfirmDialog";
import HotelForm from "./HotelForm";
import RoomForm from "./RoomForm";
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

const AdminHotels = () => {
  const [activeTab, setActiveTab] = useState("hotels"); // 'hotels' | 'rooms'
  const [loading, setLoading] = useState(false);

  // Hotels state
  const [hotels, setHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [stats, setStats] = useState({
    totalHotels: 0,
    activeHotels: 0,
    totalRooms: 0,
    availableRooms: 0,
  });
  const [hotelFilters, setHotelFilters] = useState({
    search: "",
    location: "",
    status: "all",
    min_rating: 0,
    page: 1,
    limit: 10,
    sort_by: "created_desc",
  });
  const [hotelPagination, setHotelPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 0,
  });

  // Rooms state
  const [rooms, setRooms] = useState([]);
  const [roomFilters, setRoomFilters] = useState({
    search: "",
    status: "all",
    min_price: 0,
    max_price: 999999999,
    page: 1,
    limit: 10,
    sort_by: "created_desc",
  });
  const [roomPagination, setRoomPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 0,
  });

  // Form states
  const [showHotelForm, setShowHotelForm] = useState(false);
  const [hotelFormMode, setHotelFormMode] = useState("view"); // 'view' | 'edit' | 'add'
  const [currentHotel, setCurrentHotel] = useState(null);

  const [showRoomForm, setShowRoomForm] = useState(false);
  const [roomFormMode, setRoomFormMode] = useState("view");
  const [currentRoom, setCurrentRoom] = useState(null);

  // Locations for filter
  const [locations, setLocations] = useState([]);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "danger",
    confirmText: "Xác nhận",
    cancelText: "Hủy",
    onConfirm: () => {},
  });

  // Fetch hotels
  const fetchHotels = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      // Only add params if they have meaningful values
      Object.keys(hotelFilters).forEach((key) => {
        const value = hotelFilters[key];

        // Skip empty, null, undefined, "all"
        if (
          value === "" ||
          value === null ||
          value === undefined ||
          value === "all"
        ) {
          return;
        }

        // Skip default min_rating (0)
        if (key === "min_rating" && value === 0) return;

        params.append(key, value);
      });

      const response = await fetch(
        `${API_URL}/hotels/admin/hotels?${params}`,
        getFetchOptions()
      );
      if (!response.ok) throw new Error("Failed to fetch hotels");

      const data = await response.json();
      setHotels(data.hotels || []);
      setHotelPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching hotels:", error);
      toast.error("Không thể tải danh sách khách sạn");
    } finally {
      setLoading(false);
    }
  };

  // Fetch rooms
  const fetchRooms = async () => {
    if (!selectedHotel) return;

    setLoading(true);
    try {
      const params = new URLSearchParams();

      // Only add params if they have meaningful values
      Object.keys(roomFilters).forEach((key) => {
        const value = roomFilters[key];

        // Skip empty, null, undefined, "all"
        if (
          value === "" ||
          value === null ||
          value === undefined ||
          value === "all"
        ) {
          return;
        }

        // Skip default min_price (0) and max_price (999999999)
        if (key === "min_price" && value === 0) return;
        if (key === "max_price" && value === 999999999) return;

        params.append(key, value);
      });

      const response = await fetch(
        `${API_URL}/hotels/admin/hotels/${selectedHotel.id}/rooms?${params}`,
        getFetchOptions()
      );
      if (!response.ok) throw new Error("Failed to fetch rooms");

      const data = await response.json();
      setRooms(data.rooms || []);
      setRoomPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      toast.error("Không thể tải danh sách phòng");
    } finally {
      setLoading(false);
    }
  };

  // Fetch locations
  const fetchLocations = async () => {
    try {
      const response = await fetch(
        `${API_URL}/hotels/admin/locations`,
        getFetchOptions()
      );
      if (!response.ok) throw new Error("Failed to fetch locations");

      const data = await response.json();
      setLocations(data.locations || []);
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch(
        `${API_URL}/hotels/admin/stats`,
        getFetchOptions()
      );
      if (!response.ok) throw new Error("Failed to fetch stats");

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  useEffect(() => {
    fetchLocations();
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === "hotels") {
      fetchHotels();
    }
  }, [hotelFilters, activeTab]);

  useEffect(() => {
    if (activeTab === "rooms" && selectedHotel) {
      fetchRooms();
    }
  }, [roomFilters, activeTab, selectedHotel]);

  // Hotel handlers
  const handleAddHotel = () => {
    setCurrentHotel(null);
    setHotelFormMode("add");
    setShowHotelForm(true);
  };

  const handleViewHotel = (hotel) => {
    setCurrentHotel(hotel);
    setHotelFormMode("view");
    setShowHotelForm(true);
  };

  const handleEditHotel = (hotel) => {
    setCurrentHotel(hotel);
    setHotelFormMode("edit");
    setShowHotelForm(true);
  };

  const handleDeleteHotel = (hotelId) => {
    const hotel = hotels.find((h) => h.id === hotelId);
    if (!hotel) return;

    setConfirmDialog({
      isOpen: true,
      title: "Xác nhận xóa khách sạn",
      message: `Bạn có chắc chắn muốn xóa khách sạn "${hotel.name}"?\n\n⚠️ Lưu ý: Tất cả phòng liên quan sẽ bị xóa theo.`,
      type: "danger",
      confirmText: "Xóa",
      cancelText: "Hủy",
      onConfirm: async () => {
        try {
          const response = await fetch(
            `${API_URL}/hotels/admin/hotels/${hotelId}`,
            getFetchOptions({
              method: "DELETE",
            })
          );

          if (!response.ok) {
            const data = await response.json();
            if (data.hasFutureBookings) {
              setConfirmDialog({
                isOpen: true,
                title: "Không thể xóa khách sạn",
                message: `❌ Khách sạn có ${data.futureBookingsCount} đặt phòng trong tương lai.\n\nBạn có muốn chuyển khách sạn sang trạng thái INACTIVE?`,
                type: "warning",
                confirmText: "Đặt Inactive",
                cancelText: "Hủy",
                onConfirm: async () => {
                  await handleSetInactive(hotelId);
                  setConfirmDialog({ ...confirmDialog, isOpen: false });
                },
              });
              return;
            }
            throw new Error(data.error || "Failed to delete hotel");
          }

          await fetchHotels();
          await fetchStats(); // Update stats after delete
          toast.success("Đã xóa khách sạn thành công!");
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        } catch (error) {
          console.error("Error deleting hotel:", error);
          toast.error(error.message || "Có lỗi xảy ra khi xóa khách sạn!");
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }
      },
    });
  };

  const handleSetInactive = async (hotelId) => {
    try {
      const response = await fetch(
        `${API_URL}/hotels/admin/hotels/${hotelId}`,
        getFetchOptions({
          method: "PUT",
          body: JSON.stringify({ status: "inactive" }),
        })
      );

      if (!response.ok) throw new Error("Failed to set inactive");

      await fetchHotels();
      await fetchStats(); // Update stats after status change
      toast.success("Đã chuyển khách sạn sang trạng thái Inactive");
    } catch (error) {
      toast.error("Có lỗi khi cập nhật trạng thái");
    }
  };

  const handleSelectHotelForRooms = (hotel) => {
    setSelectedHotel(hotel);
    setActiveTab("rooms");
    setRoomFilters({ ...roomFilters, page: 1 });
  };

  // Room handlers
  const handleAddRoom = () => {
    if (!selectedHotel) {
      toast.error("Vui lòng chọn khách sạn trước");
      return;
    }
    setCurrentRoom(null);
    setRoomFormMode("add");
    setShowRoomForm(true);
  };

  const handleViewRoom = (room) => {
    setCurrentRoom(room);
    setRoomFormMode("view");
    setShowRoomForm(true);
  };

  const handleEditRoom = (room) => {
    setCurrentRoom(room);
    setRoomFormMode("edit");
    setShowRoomForm(true);
  };

  const handleDeleteRoom = (roomId) => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;

    setConfirmDialog({
      isOpen: true,
      title: "Xác nhận xóa phòng",
      message: `Bạn có chắc chắn muốn xóa phòng "${room.name}"?`,
      type: "danger",
      confirmText: "Xóa",
      cancelText: "Hủy",
      onConfirm: async () => {
        try {
          const response = await fetch(
            `${API_URL}/hotels/admin/rooms/${roomId}`,
            getFetchOptions({
              method: "DELETE",
            })
          );

          if (!response.ok) {
            const data = await response.json();
            if (data.hasFutureBookings) {
              toast.error(
                `Không thể xóa phòng có ${data.futureBookingsCount} đặt phòng trong tương lai`
              );
              setConfirmDialog({ ...confirmDialog, isOpen: false });
              return;
            }
            throw new Error(data.error || "Failed to delete room");
          }

          await fetchRooms();
          await fetchStats(); // Update stats after room delete
          toast.success("Đã xóa phòng thành công!");
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        } catch (error) {
          console.error("Error deleting room:", error);
          toast.error(error.message || "Có lỗi xảy ra khi xóa phòng!");
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }
      },
    });
  };

  // Close form handlers
  const handleCloseHotelForm = () => {
    setShowHotelForm(false);
    setCurrentHotel(null);
  };

  const handleCloseRoomForm = () => {
    setShowRoomForm(false);
    setCurrentRoom(null);
  };

  // Format helpers
  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN").format(price) + " đ";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  // If showing form, render form instead
  if (showHotelForm) {
    return (
      <HotelForm
        hotel={currentHotel}
        onClose={handleCloseHotelForm}
        onSave={() => {
          fetchHotels();
          fetchStats(); // Update stats after hotel save
          handleCloseHotelForm();
        }}
        viewMode={hotelFormMode === "view"}
        editMode={hotelFormMode === "edit"}
      />
    );
  }

  if (showRoomForm) {
    return (
      <RoomForm
        room={currentRoom}
        hotel={selectedHotel}
        onClose={handleCloseRoomForm}
        onSave={() => {
          fetchRooms();
          fetchStats(); // Update stats after room save
          handleCloseRoomForm();
        }}
        viewMode={roomFormMode === "view"}
        editMode={roomFormMode === "edit"}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Tabs */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 -mx-8 -mt-8 px-8 py-12 mb-8">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Quản lý Khách sạn
                </h1>
                <p className="text-white/80 mt-1">
                  Quản lý khách sạn và phòng trong hệ thống
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {activeTab === "hotels" && (
                <button
                  onClick={handleAddHotel}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-xl font-medium hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-5 h-5" />
                  Thêm khách sạn
                </button>
              )}
              {activeTab === "rooms" && selectedHotel && (
                <button
                  onClick={handleAddRoom}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-xl font-medium hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-5 h-5" />
                  Thêm phòng
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Tổng khách sạn</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {stats.totalHotels}
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Đang hoạt động</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {stats.activeHotels}
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Tổng phòng</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {stats.totalRooms}
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <BedDouble className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Phòng có sẵn</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {stats.availableRooms}
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("hotels")}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === "hotels"
                  ? "bg-white text-blue-600 shadow-lg"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              <Building2 className="w-5 h-5" />
              Khách sạn
            </button>
            <button
              onClick={() => setActiveTab("rooms")}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === "rooms"
                  ? "bg-white text-blue-600 shadow-lg"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
              disabled={!selectedHotel}
            >
              <BedDouble className="w-5 h-5" />
              Phòng {selectedHotel && `(${selectedHotel.name})`}
            </button>
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div className="max-w-screen-xl mx-auto bg-white rounded-2xl shadow-sm p-6">
        {activeTab === "hotels" ? (
          <>
            {/* Filters */}
            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm khách sạn..."
                    value={hotelFilters.search}
                    onChange={(e) =>
                      setHotelFilters({
                        ...hotelFilters,
                        search: e.target.value,
                        page: 1,
                      })
                    }
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Location Filter */}
                <select
                  value={hotelFilters.location}
                  onChange={(e) =>
                    setHotelFilters({
                      ...hotelFilters,
                      location: e.target.value,
                      page: 1,
                    })
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Tất cả địa điểm</option>
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={hotelFilters.status}
                  onChange={(e) =>
                    setHotelFilters({
                      ...hotelFilters,
                      status: e.target.value,
                      page: 1,
                    })
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="active">Đang hoạt động</option>
                  <option value="inactive">Tạm dừng</option>
                  <option value="draft">Nháp</option>
                </select>

                {/* Sort */}
                <select
                  value={hotelFilters.sort_by}
                  onChange={(e) =>
                    setHotelFilters({
                      ...hotelFilters,
                      sort_by: e.target.value,
                    })
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="created_desc">Mới nhất</option>
                  <option value="created_asc">Cũ nhất</option>
                  <option value="name_asc">Tên A-Z</option>
                  <option value="name_desc">Tên Z-A</option>
                  <option value="rating_desc">Rating cao nhất</option>
                  <option value="rating_asc">Rating thấp nhất</option>
                </select>
              </div>
            </div>

            {/* Hotels List */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : hotels.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Không tìm thấy khách sạn nào</p>
              </div>
            ) : (
              <div className="space-y-4">
                {hotels.map((hotel) => (
                  <div
                    key={hotel.id}
                    className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex gap-4">
                      {/* Hotel Image */}
                      <div className="w-32 h-32 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                        {hotel.images && hotel.images.length > 0 ? (
                          <img
                            src={
                              hotel.images[0].startsWith("http")
                                ? hotel.images[0]
                                : `${API_HOST}${hotel.images[0]}`
                            }
                            alt={hotel.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Building2 className="w-12 h-12 text-gray-300" />
                          </div>
                        )}
                      </div>

                      {/* Hotel Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {hotel.name}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                              <MapPin className="w-4 h-4" />
                              {hotel.location}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {hotel.status === "active" ? (
                              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                Đang hoạt động
                              </span>
                            ) : hotel.status === "inactive" ? (
                              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                                Tạm dừng
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                                Nháp
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4 mb-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span>
                              {hotel.rating
                                ? parseFloat(hotel.rating).toFixed(1)
                                : "N/A"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <BedDouble className="w-4 h-4 text-gray-500" />
                            <span>{hotel.room_count || 0} phòng</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-600">Giá từ:</span>
                            <span className="font-semibold text-blue-600">
                              {hotel.min_price
                                ? formatPrice(hotel.min_price)
                                : "N/A"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span>{formatDate(hotel.created_at)}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewHotel(hotel)}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            Xem
                          </button>
                          <button
                            onClick={() => handleEditHotel(hotel)}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                            Sửa
                          </button>
                          <button
                            onClick={() => handleSelectHotelForRooms(hotel)}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          >
                            <BedDouble className="w-4 h-4" />
                            Quản lý phòng
                          </button>
                          <button
                            onClick={() => handleDeleteHotel(hotel.id)}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Xóa
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {hotelPagination.total_pages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t">
                <p className="text-sm text-gray-600">
                  Hiển thị{" "}
                  {(hotelPagination.page - 1) * hotelPagination.limit + 1} -{" "}
                  {Math.min(
                    hotelPagination.page * hotelPagination.limit,
                    hotelPagination.total
                  )}{" "}
                  trong tổng số {hotelPagination.total} khách sạn
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setHotelFilters({
                        ...hotelFilters,
                        page: hotelFilters.page - 1,
                      })
                    }
                    disabled={hotelFilters.page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Trước
                  </button>
                  <span className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium">
                    {hotelPagination.page} / {hotelPagination.total_pages}
                  </span>
                  <button
                    onClick={() =>
                      setHotelFilters({
                        ...hotelFilters,
                        page: hotelFilters.page + 1,
                      })
                    }
                    disabled={hotelFilters.page === hotelPagination.total_pages}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Rooms Tab */}
            {!selectedHotel ? (
              <div className="text-center py-12">
                <BedDouble className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  Vui lòng chọn khách sạn để quản lý phòng
                </p>
              </div>
            ) : (
              <>
                {/* Hotel Info Banner */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Building2 className="w-8 h-8 text-blue-600" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {selectedHotel.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {selectedHotel.location}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedHotel(null);
                        setActiveTab("hotels");
                      }}
                      className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      Chọn khách sạn khác
                    </button>
                  </div>
                </div>

                {/* Filters */}
                <div className="mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Tìm kiếm phòng..."
                        value={roomFilters.search}
                        onChange={(e) =>
                          setRoomFilters({
                            ...roomFilters,
                            search: e.target.value,
                            page: 1,
                          })
                        }
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Status Filter */}
                    <select
                      value={roomFilters.status}
                      onChange={(e) =>
                        setRoomFilters({
                          ...roomFilters,
                          status: e.target.value,
                          page: 1,
                        })
                      }
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">Tất cả trạng thái</option>
                      <option value="available">Có sẵn</option>
                      <option value="unavailable">Không có sẵn</option>
                    </select>

                    {/* Price Range */}
                    <div className="col-span-1"></div>

                    {/* Sort */}
                    <select
                      value={roomFilters.sort_by}
                      onChange={(e) =>
                        setRoomFilters({
                          ...roomFilters,
                          sort_by: e.target.value,
                        })
                      }
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="created_desc">Mới nhất</option>
                      <option value="created_asc">Cũ nhất</option>
                      <option value="name_asc">Tên A-Z</option>
                      <option value="name_desc">Tên Z-A</option>
                      <option value="price_asc">Giá thấp nhất</option>
                      <option value="price_desc">Giá cao nhất</option>
                      <option value="capacity_asc">Sức chứa thấp nhất</option>
                      <option value="capacity_desc">Sức chứa cao nhất</option>
                    </select>
                  </div>
                </div>

                {/* Rooms List */}
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                ) : rooms.length === 0 ? (
                  <div className="text-center py-12">
                    <BedDouble className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Không tìm thấy phòng nào</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rooms.map((room) => (
                      <div
                        key={room.id}
                        className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                      >
                        {/* Room Image */}
                        <div className="h-48 bg-gray-100">
                          {room.images && room.images.length > 0 ? (
                            <img
                              src={
                                room.images[0].startsWith("http")
                                  ? room.images[0]
                                  : `${API_HOST}${room.images[0]}`
                              }
                              alt={room.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BedDouble className="w-16 h-16 text-gray-300" />
                            </div>
                          )}
                        </div>

                        {/* Room Info */}
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">
                              {room.name}
                            </h4>
                            {room.status === "available" ? (
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                Có sẵn
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                                Không sẵn
                              </span>
                            )}
                          </div>

                          <div className="space-y-2 mb-4">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Giá/đêm:</span>
                              <span className="font-semibold text-blue-600">
                                {formatPrice(room.price)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Sức chứa:</span>
                              <span className="font-medium">
                                {room.capacity} người
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleViewRoom(room)}
                              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              Xem
                            </button>
                            <button
                              onClick={() => handleEditRoom(room)}
                              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                              Sửa
                            </button>
                            <button
                              onClick={() => handleDeleteRoom(room.id)}
                              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              Xóa
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {roomPagination.total_pages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-6 border-t">
                    <p className="text-sm text-gray-600">
                      Hiển thị{" "}
                      {(roomPagination.page - 1) * roomPagination.limit + 1} -{" "}
                      {Math.min(
                        roomPagination.page * roomPagination.limit,
                        roomPagination.total
                      )}{" "}
                      trong tổng số {roomPagination.total} phòng
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setRoomFilters({
                            ...roomFilters,
                            page: roomFilters.page - 1,
                          })
                        }
                        disabled={roomFilters.page === 1}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Trước
                      </button>
                      <span className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium">
                        {roomPagination.page} / {roomPagination.total_pages}
                      </span>
                      <button
                        onClick={() =>
                          setRoomFilters({
                            ...roomFilters,
                            page: roomFilters.page + 1,
                          })
                        }
                        disabled={
                          roomFilters.page === roomPagination.total_pages
                        }
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
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

export default AdminHotels;
