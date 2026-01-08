import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Building,
  Star,
  DollarSign,
  MapPin,
  Eye,
} from "lucide-react";
import HotelForm from "./HotelForm";
import { API_URL } from "../../../config/api";

const HotelsManagement = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState(false);

  useEffect(() => {
    fetchHotels();
  }, []);

  const fetchHotels = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/hotels");
      if (!response.ok) {
        throw new Error("Failed to fetch hotels");
      }
      const data = await response.json();
      setHotels(data);
    } catch (error) {
      console.error("Error fetching hotels:", error);
      toast.error("Lỗi khi tải danh sách khách sạn");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa khách sạn này?")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/hotels/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete hotel");
      }

      setHotels(hotels.filter((hotel) => hotel.id !== id));
      toast.success("Xóa khách sạn thành công");
    } catch (error) {
      console.error("Error deleting hotel:", error);
      toast.error("Lỗi khi xóa khách sạn");
    }
  };

  const handleEdit = (hotel) => {
    setSelectedHotel(hotel);
    setViewMode(false);
    setShowForm(true);
  };

  const handleView = (hotel) => {
    setSelectedHotel(hotel);
    setViewMode(true);
    setShowForm(true);
  };

  const handleSave = (hotel) => {
    if (selectedHotel) {
      setHotels(
        hotels.map((h) => (h.id === hotel.id ? { ...h, ...hotel } : h))
      );
    } else {
      setHotels([...hotels, hotel]);
    }
    setShowForm(false);
    setSelectedHotel(null);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const filteredHotels = hotels.filter((hotel) =>
    hotel.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (showForm) {
    return (
      <HotelForm
        hotel={selectedHotel}
        onSave={handleSave}
        onClose={() => {
          setShowForm(false);
          setSelectedHotel(null);
        }}
        viewMode={viewMode}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý khách sạn</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Thêm khách sạn
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Tìm kiếm khách sạn..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Lọc
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHotels.map((hotel) => (
            <div
              key={hotel.id}
              className="bg-white rounded-xl shadow-sm overflow-hidden"
            >
              <div className="relative">
                <img
                  src={
                    hotel.images
                      ? JSON.parse(hotel.images)[0]
                      : "https://via.placeholder.com/300x200"
                  }
                  alt={hotel.name}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    onClick={() => handleView(hotel)}
                    className="p-2 bg-white/80 rounded-lg hover:bg-white transition-colors"
                  >
                    <Eye className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleEdit(hotel)}
                    className="p-2 bg-white/80 rounded-lg hover:bg-white transition-colors"
                  >
                    <Edit className="w-5 h-5 text-emerald-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(hotel.id)}
                    className="p-2 bg-white/80 rounded-lg hover:bg-white transition-colors"
                  >
                    <Trash2 className="w-5 h-5 text-red-500" />
                  </button>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  {hotel.name}
                </h3>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-5 h-5" />
                  <span>{hotel.location}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <DollarSign className="w-5 h-5" />
                  <span>{formatPrice(hotel.price)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <span>{hotel.rating} sao</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Building className="w-5 h-5" />
                  <span>{hotel.total_rooms} loại phòng</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HotelsManagement;
