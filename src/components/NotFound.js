import React from "react";
import { useNavigate } from "react-router-dom";
import { Home, Search, Map, Plane, Building2, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const navigate = useNavigate();

  const quickLinks = [
    { path: "/", label: "Trang chủ", icon: Home },
    { path: "/tours", label: "Tour Du Lịch", icon: Map },
    { path: "/flights", label: "Vé Máy Bay", icon: Plane },
    { path: "/hotels", label: "Khách Sạn", icon: Building2 },
  ];

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-gradient-to-br from-gray-50 to-emerald-50 px-4">
      <div className="text-center max-w-2xl">
        {/* 404 Illustration */}
        <div className="relative mb-8">
          <div className="text-[180px] font-black text-emerald-100 leading-none select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white rounded-full p-6 shadow-xl">
              <Search className="w-16 h-16 text-emerald-600" />
            </div>
          </div>
        </div>

        {/* Message */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
          Oops! Trang không tồn tại
        </h1>
        <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
          Trang bạn đang tìm kiếm có thể đã được di chuyển, xóa hoặc chưa bao
          giờ tồn tại.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
          >
            <ArrowLeft size={18} />
            Quay lại
          </button>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
          >
            <Home size={18} />
            Về trang chủ
          </button>
        </div>

        {/* Quick Links */}
        <div className="border-t border-gray-200 pt-8">
          <p className="text-sm text-gray-500 mb-4">Hoặc truy cập nhanh:</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {quickLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-600 rounded-lg border border-gray-100 hover:border-emerald-300 hover:text-emerald-600 transition-all text-sm"
              >
                <link.icon size={16} />
                {link.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
