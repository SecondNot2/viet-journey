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
  BookOpen, // Added for Blog
  AlertTriangle,
  X,
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext";
import { API_URL, API_HOST } from "../../config/api";
import Toast from "../common/Toast";

const Wishlist = () => {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  // Confirm dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

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

      // 1. Fetch Backend Wishlist
      const wishlistResponse = await axios.get(`${API_URL}/wishlist`, {
        withCredentials: true,
      });
      const backendItems = wishlistResponse.data || [];

      // 2. Fetch LocalStorage Saved Blogs
      const savedBlogIds = JSON.parse(
        localStorage.getItem("saved_blogs") || "[]"
      );
      let blogItems = [];

      if (savedBlogIds.length > 0) {
        // Fetch all blogs and filter (optimization: create bulk fetch API later)
        // For now, fast enough for small numbers
        try {
          const blogsResponse = await axios.get(`${API_URL}/blogs`);
          const allBlogs = Array.isArray(blogsResponse.data)
            ? blogsResponse.data
            : blogsResponse.data.blogs || [];

          blogItems = allBlogs
            .filter((blog) => savedBlogIds.includes(blog.id))
            .map((blog) => ({
              wishlist_id: `blog-${blog.id}`, // Fake ID for key
              id: blog.id,
              type: "blog",
              name: blog.title,
              image: blog.image,
              location: "Blog du lịch",
              price: 0,
              rating: 0,
            }));
        } catch (blogErr) {
          console.error("Error fetching saved blogs:", blogErr);
        }
      }

      setWishlistItems([...backendItems, ...blogItems]);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching wishlist:", err);
      // Still show blogs if backend fails?
      // Better to show error
      setError("Không thể tải danh sách yêu thích");
      setLoading(false);
    }
  };

  // Open confirm dialog
  const openConfirmDialog = (item) => {
    setItemToDelete(item);
    setShowConfirmDialog(true);
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowConfirmDialog(false);
    setItemToDelete(null);
  };

  // Confirm and execute delete
  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.type === "blog") {
        // Remove from local storage
        const savedBlogs = JSON.parse(
          localStorage.getItem("saved_blogs") || "[]"
        );
        const newSaved = savedBlogs.filter((id) => id !== itemToDelete.id);
        localStorage.setItem("saved_blogs", JSON.stringify(newSaved));

        setWishlistItems((prev) =>
          prev.filter((i) => i.wishlist_id !== itemToDelete.wishlist_id)
        );
        showToast("Đã xóa bài viết khỏi danh sách yêu thích", "success");
      } else {
        await axios.delete(`${API_URL}/wishlist/${itemToDelete.wishlist_id}`, {
          withCredentials: true,
        });
        setWishlistItems((prev) =>
          prev.filter((i) => i.wishlist_id !== itemToDelete.wishlist_id)
        );
        showToast("Đã xóa khỏi danh sách yêu thích", "success");
      }
    } catch (err) {
      console.error("Error removing item:", err);
      showToast("Lỗi khi xóa mục này", "error");
    } finally {
      setShowConfirmDialog(false);
      setItemToDelete(null);
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
      case "blog":
        return <BookOpen size={16} />;
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
      case "blog":
        return "Bài Viết";
      default:
        return "Khác";
    }
  };

  // Helper function to convert Vietnamese text to slug
  const toSlug = (str) => {
    if (!str) return "";
    const vietnameseMap = {
      à: "a",
      á: "a",
      ả: "a",
      ã: "a",
      ạ: "a",
      ă: "a",
      ằ: "a",
      ắ: "a",
      ẳ: "a",
      ẵ: "a",
      ặ: "a",
      â: "a",
      ầ: "a",
      ấ: "a",
      ẩ: "a",
      ẫ: "a",
      ậ: "a",
      è: "e",
      é: "e",
      ẻ: "e",
      ẽ: "e",
      ẹ: "e",
      ê: "e",
      ề: "e",
      ế: "e",
      ể: "e",
      ễ: "e",
      ệ: "e",
      ì: "i",
      í: "i",
      ỉ: "i",
      ĩ: "i",
      ị: "i",
      ò: "o",
      ó: "o",
      ỏ: "o",
      õ: "o",
      ọ: "o",
      ô: "o",
      ồ: "o",
      ố: "o",
      ổ: "o",
      ỗ: "o",
      ộ: "o",
      ơ: "o",
      ờ: "o",
      ớ: "o",
      ở: "o",
      ỡ: "o",
      ợ: "o",
      ù: "u",
      ú: "u",
      ủ: "u",
      ũ: "u",
      ụ: "u",
      ư: "u",
      ừ: "u",
      ứ: "u",
      ử: "u",
      ữ: "u",
      ự: "u",
      ỳ: "y",
      ý: "y",
      ỷ: "y",
      ỹ: "y",
      ỵ: "y",
      đ: "d",
    };
    let slug = str.toLowerCase();
    for (const [viet, latin] of Object.entries(vietnameseMap)) {
      slug = slug.replace(new RegExp(viet, "g"), latin);
    }
    return slug
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  // Generate slug-based URL for each item type
  const getLink = (item) => {
    // Use existing slug or generate from name + id
    const generateSlug = () => item.slug || `${toSlug(item.name)}-${item.id}`;

    switch (item.type) {
      case "tour":
        return `/tours/${generateSlug()}`;
      case "hotel":
        return `/hotels/${generateSlug()}`;
      case "flight":
        // For flights, use from-to-id pattern if available
        if (item.from_location && item.to_location) {
          return `/flights/${toSlug(item.from_location)}-${toSlug(
            item.to_location
          )}-${item.id}`;
        }
        return `/flights/${generateSlug()}`;
      case "transport":
        // For transport, use from-to-id pattern if available
        if (item.from_location && item.to_location) {
          return `/transport/${toSlug(item.from_location)}-${toSlug(
            item.to_location
          )}-${item.id}`;
        }
        return `/transport/${generateSlug()}`;
      case "blog":
        return `/blog/post/${item.id}`;
      case "destination":
        return `/destinations/${generateSlug()}`;
      default:
        return "#";
    }
  };

  const getImageUrl = (image) => {
    if (!image) return `${API_HOST}/images/placeholder.png`;
    if (image.startsWith("http")) return image;

    const cleanPath = image.replace(/^\/+/, "");

    // If path already points to our static folders
    if (cleanPath.startsWith("uploads") || cleanPath.startsWith("images")) {
      return `${API_HOST}/${cleanPath}`;
    }

    // Default fallback: assume it's in images folder (common for seeds)
    return `${API_HOST}/images/${cleanPath}`;
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

      {/* Confirm Delete Dialog */}
      {showConfirmDialog && itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="bg-red-50 px-6 py-4 flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">
                Xác nhận xóa
              </h3>
              <button
                onClick={cancelDelete}
                className="ml-auto p-1 hover:bg-red-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              <p className="text-gray-600">
                Bạn có chắc chắn muốn xóa{" "}
                <span className="font-semibold text-gray-800">
                  "{itemToDelete.name}"
                </span>{" "}
                khỏi danh sách yêu thích?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Hành động này không thể hoàn tác.
              </p>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 flex gap-3 justify-end">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
              >
                <Trash2 size={16} />
                Xóa
              </button>
            </div>
          </div>
        </div>
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
                    onClick={() => openConfirmDialog(item)}
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
                      {item.type !== "blog" && (
                        <>
                          <span className="text-xs text-gray-500 block">
                            Giá từ
                          </span>
                          <span className="text-emerald-600 font-bold">
                            {formatPrice(item.price)}
                          </span>
                        </>
                      )}
                      {item.type === "blog" && (
                        <span className="text-sm text-gray-500 italic">
                          Đọc ngay
                        </span>
                      )}
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
