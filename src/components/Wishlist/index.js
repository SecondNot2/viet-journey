import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  Trash2,
  MapPin,
  Star,
  Calendar,
  Hotel,
  Plane,
  Bus,
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext";
import { API_URL } from "../../config/api";
import Toast from "../common/Toast";

const Wishlist = () => {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchWishlist();
  }, [user]);

  const fetchWishlist = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/wishlist`, {
        withCredentials: true,
      });
      setWishlistItems(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching wishlist:", err);
      setError("Không thể tải danh sách yêu thích");
      setLoading(false);
    }
  };

  const handleRemoveItem = async (id) => {
    try {
      await axios.delete(`${API_URL}/wishlist/${id}`, {
        withCredentials: true,
      });
      setWishlistItems((prev) =>
        prev.filter((item) => item.wishlist_id !== id)
      );
      showToast("Đã xóa khỏi danh sách yêu thích", "success");
    } catch (err) {
      console.error("Error removing item:", err);
      showToast("Lỗi khi xóa mục này", "error");
    }
  };

  const showToast = (message, type = "info") => {
    setToast({ message, type });
  };

  const formatPrice = (price) => {
    if (!price) return "Liên hệ";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "tour":
        return <MapPin size={16} />;
      case "hotel":
        return <Hotel size={16} />;
      case "flight":
        return <Plane size={16} />;
      case "transport":
        return <Bus size={16} />;
      default:
        return <Heart size={16} />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case "tour":
        return "Tour Du Lịch";
      case "hotel":
        return "Khách Sạn";
      case "flight":
        return "Vé Máy Bay";
      case "transport":
        return "Di Chuyển";
      default:
        return "Khác";
    }
  };

  const getLink = (item) => {
    switch (item.type) {
      case "tour":
        return `/tours/${item.id}`;
      case "hotel":
        return `/hotels/${item.id}`;
      // Add other types when pages are ready
      default:
        return "#";
    }
  };

  const getImageUrl = (image) => {
    if (!image) return `${API_URL}/images/placeholder.png`;
    if (image.startsWith("http")) return image;
    return `${API_URL}/${image}`.replace(/\/\//g, "/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <Heart className="w-16 h-16 text-emerald-200 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Vui lòng đăng nhập
        </h2>
        <p className="text-gray-600 mb-6">
          Bạn cần đăng nhập để xem danh sách yêu thích của mình
        </p>
        <Link
          to="/login"
          className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
        >
          Đăng nhập ngay
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Hero Section */}
      <div className="bg-emerald-600 text-white py-12 mb-8">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Danh Sách Yêu Thích</h1>
          <p className="text-emerald-100">{wishlistItems.length} mục đã lưu</p>
        </div>
      </div>

      {/* Wishlist Items */}
      <div className="container mx-auto px-4">
        {wishlistItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistItems.map((item) => (
              <div
                key={item.wishlist_id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col group"
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  <Link to={getLink(item)}>
                    <img
                      src={getImageUrl(item.image)}
                      alt={item.name}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `${API_URL}/images/placeholder.png`;
                      }}
                    />
                  </Link>
                  <button
                    onClick={() => handleRemoveItem(item.wishlist_id)}
                    className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full text-red-500 hover:bg-red-50 transition-colors shadow-sm"
                    title="Xóa khỏi danh sách"
                  >
                    <Trash2 size={18} />
                  </button>
                  <div className="absolute top-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-sm text-white text-xs rounded-full flex items-center gap-1">
                    {getTypeIcon(item.type)}
                    <span>{getTypeLabel(item.type)}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col">
                  <Link to={getLink(item)} className="block mb-2">
                    <h3 className="font-semibold text-gray-800 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                      {item.name}
                    </h3>
                  </Link>

                  {item.location && (
                    <div className="flex items-center gap-1 text-gray-500 text-sm mb-3">
                      <MapPin size={14} />
                      <span className="truncate">{item.location}</span>
                    </div>
                  )}

                  {/* Rating if available */}
                  {item.rating > 0 && (
                    <div className="flex items-center gap-1 mb-3">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium text-gray-700">
                        {item.rating}
                      </span>
                    </div>
                  )}

                  <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-500 block">
                        Giá từ
                      </span>
                      <span className="text-emerald-600 font-bold">
                        {formatPrice(item.price)}
                      </span>
                    </div>
                    <Link
                      to={getLink(item)}
                      className="px-4 py-2 bg-emerald-50 text-emerald-600 text-sm font-medium rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                      Xem chi tiết
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="text-gray-400" size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Danh sách yêu thích trống
            </h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Hãy lưu lại những địa điểm và tour du lịch bạn yêu thích để xem
              lại sau nhé!
            </p>
            <Link
              to="/tours"
              className="inline-flex items-center justify-center px-6 py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition"
            >
              Khám phá ngay
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
