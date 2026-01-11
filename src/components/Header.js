import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Globe,
  ChevronDown,
  Heart,
  User,
  Compass,
  Plane,
  Building2,
  Map,
  Train,
  MapPin,
  Book,
  Info,
  Menu,
  X,
  LogOut,
  ClipboardList,
  Star,
} from "lucide-react";

function Header({
  isMenuOpen,
  setIsMenuOpen,
  isLanguageOpen,
  setIsLanguageOpen,
  currentLanguage,
  setCurrentLanguage,
  isTourDropdownOpen,
  setIsTourDropdownOpen,
  languages,
  tourCategories,
}) {
  const { user, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Helper function for navigation with reload (chỉ dùng khi cần clear state như logout)
  const navigateWithReload = (path) => {
    window.location.href = path;
  };

  // Xử lý đăng xuất
  const handleLogout = () => {
    logout();
    navigateWithReload("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
      <div className="container mx-auto px-4">
        {/* Top Bar */}
        <div className="py-2 border-b flex justify-between items-center text-sm">
          <div className="flex items-center space-x-4">
            <span className="flex items-center text-emerald-600">
              24/7 Hỗ trợ
            </span>
            <span className="flex items-center text-emerald-600">
              Đảm bảo giá tốt nhất
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <button
                className="flex items-center space-x-1 text-gray-600 hover:text-emerald-600"
                onClick={() => setIsLanguageOpen(!isLanguageOpen)}
              >
                <Globe size={16} />
                <span>{currentLanguage}</span>
                <ChevronDown size={16} />
              </button>

              {isLanguageOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      className="block w-full px-4 py-2 text-left hover:bg-gray-50"
                      onClick={() => {
                        setCurrentLanguage(lang.code);
                        setIsLanguageOpen(false);
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <span>{lang.name}</span>
                        <span className="text-gray-400 text-sm">
                          {lang.currency}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="h-4 w-px bg-gray-200"></div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/wishlist")}
                className="text-gray-600 hover:text-emerald-600 flex items-center space-x-1"
              >
                <Heart size={16} />
                <span>Yêu Thích</span>
              </button>

              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 text-gray-600 hover:text-emerald-600"
                  >
                    <img
                      src={user.avatar}
                      alt={user.fullName}
                      className="h-6 w-6 rounded-full"
                    />
                    <span>{user.fullName}</span>
                    <ChevronDown size={16} />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      <button
                        onClick={() => navigate("/profile")}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <User size={16} />
                        <span>Tài khoản</span>
                      </button>
                      <button
                        onClick={() => navigate("/profile/bookings")}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <ClipboardList size={16} />
                        <span>Đơn đặt chỗ</span>
                      </button>
                      <button
                        onClick={() => navigate("/profile/reviews")}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Star size={16} />
                        <span>Đánh giá</span>
                      </button>
                      <hr className="my-1" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
                      >
                        <LogOut size={16} />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => navigate("/login")}
                  className="text-gray-600 hover:text-emerald-600 flex items-center space-x-1"
                >
                  <User size={16} />
                  <span>Đăng Nhập</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/")}
              className="flex items-center space-x-2"
            >
              <Compass className="h-8 w-8 text-emerald-600" />
              <span className="text-2xl font-bold text-emerald-600">
                VietJourney
              </span>
            </button>
          </div>

          <div className="hidden lg:flex items-center space-x-8">
            <button
              onClick={() => navigate("/flights")}
              className="flex items-center space-x-1 text-gray-700 hover:text-emerald-600"
            >
              <Plane size={18} />
              <span>Đặt Vé Máy Bay</span>
            </button>

            <button
              onClick={() => navigate("/hotels")}
              className="flex items-center space-x-1 text-gray-700 hover:text-emerald-600"
            >
              <Building2 size={18} />
              <span>Khách Sạn</span>
            </button>

            <div className="relative group">
              <button
                className="flex items-center space-x-1 text-gray-700 hover:text-emerald-600"
                onClick={() => {
                  setIsTourDropdownOpen(!isTourDropdownOpen);
                  navigate("/tours");
                }}
              >
                <Map size={18} />
                <span>Tour Du Lịch</span>
                <ChevronDown size={16} />
              </button>

              <div className="absolute left-0 mt-2 w-[600px] bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-6 grid grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">
                      Theo Loại Hình
                    </h4>
                    <div className="space-y-3">
                      {tourCategories.byType.map((category, index) => (
                        <button
                          key={index}
                          onClick={() =>
                            navigate(
                              `/tours/type/${category.name
                                .toLowerCase()
                                .replace(/\s+/g, "-")}`
                            )
                          }
                          className="flex items-center space-x-2 text-gray-600 hover:text-emerald-600"
                        >
                          <category.icon size={16} />
                          <span>{category.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">
                      Theo Vùng Miền
                    </h4>
                    <div className="space-y-4">
                      {tourCategories.byRegion.map((region, index) => (
                        <div key={index}>
                          <h5 className="font-medium text-gray-900 mb-2">
                            {region.name}
                          </h5>
                          <div className="grid grid-cols-2 gap-2">
                            {region.places.map((place, placeIndex) => (
                              <button
                                key={placeIndex}
                                onClick={() =>
                                  navigate(
                                    `/tours/region/${region.name
                                      .toLowerCase()
                                      .replace(/\s+/g, "-")}`
                                  )
                                }
                                className="text-gray-600 hover:text-emerald-600 text-left"
                              >
                                {place}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate("/transport")}
              className="flex items-center space-x-1 text-gray-700 hover:text-emerald-600"
            >
              <Train size={18} />
              <span>Vé Xe/Tàu</span>
            </button>

            <button
              onClick={() => navigate("/destinations")}
              className="flex items-center space-x-1 text-gray-700 hover:text-emerald-600"
            >
              <MapPin size={18} />
              <span>Điểm Đến</span>
            </button>

            <button
              onClick={() => navigate("/blog")}
              className="flex items-center space-x-1 text-gray-700 hover:text-emerald-600"
            >
              <Book size={18} />
              <span>Blog</span>
            </button>

            <button
              onClick={() => navigate("/about")}
              className="flex items-center space-x-1 text-gray-700 hover:text-emerald-600"
            >
              <Info size={18} />
              <span>Về Chúng Tôi</span>
            </button>
          </div>

          <button
            className="lg:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </nav>
      </div>
    </header>
  );
}

export default Header;
