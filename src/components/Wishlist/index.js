import React from "react";
import { Heart, Trash2 } from "lucide-react";

const Wishlist = () => {
  // Placeholder data for wishlist items
  const wishlistItems = [
    {
      id: 1,
      type: "tour",
      name: "Tour Phú Quốc 3N2Đ",
      image: "/images/tours/phu-quoc.jpg",
      price: 5990000,
      originalPrice: 6990000,
    },
    {
      id: 2,
      type: "hotel",
      name: "Vinpearl Resort & Spa",
      image: "/images/hotels/vinpearl.jpg",
      price: 2500000,
      originalPrice: 3000000,
    },
  ];

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-emerald-600 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Danh Sách Yêu Thích</h1>
          <p className="text-emerald-100">Các tour và khách sạn bạn đã lưu</p>
        </div>
      </div>

      {/* Wishlist Items */}
      <div className="container mx-auto px-4 py-12">
        {wishlistItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden"
              >
                {/* Item Image */}
                <div className="relative h-48">
                  <div className="absolute inset-0 bg-gray-300">
                    {/* Placeholder for item image */}
                  </div>
                  <div className="absolute top-4 right-4">
                    <button className="p-2 bg-white rounded-full shadow-sm hover:bg-red-50">
                      <Heart className="text-red-500 fill-current" size={20} />
                    </button>
                  </div>
                </div>

                {/* Item Info */}
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-sm font-medium text-emerald-600 mb-2 block">
                        {item.type === "tour" ? "Tour Du Lịch" : "Khách Sạn"}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {item.name}
                      </h3>
                    </div>
                    <button className="text-gray-400 hover:text-red-500">
                      <Trash2 size={20} />
                    </button>
                  </div>

                  {/* Price */}
                  <div className="mt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-emerald-600">
                        {formatPrice(item.price)}
                      </span>
                      {item.originalPrice > item.price && (
                        <span className="text-sm text-gray-400 line-through">
                          {formatPrice(item.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <button className="w-full mt-4 bg-emerald-600 text-white py-2 rounded hover:bg-emerald-700 transition-colors">
                    Đặt Ngay
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Heart className="mx-auto text-gray-400 mb-4" size={48} />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Danh sách yêu thích trống
            </h2>
            <p className="text-gray-600">
              Bạn chưa lưu tour hoặc khách sạn nào vào danh sách yêu thích
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
