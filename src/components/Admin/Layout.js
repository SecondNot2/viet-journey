import React, { useState, useEffect } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  LayoutDashboard,
  Map,
  Compass,
  Users,
  Calendar,
  Building2,
  Plane,
  FileText,
  Settings,
  Menu,
  X,
  Bell,
  User,
  LogOut,
  ChevronDown,
  Home,
  ChevronRight,
  CalendarCheck,
  Bus,
  Percent,
  Star,
} from "lucide-react";

const menuGroups = [
  {
    title: "Tổng quan",
    items: [
      {
        title: "Dashboard",
        icon: LayoutDashboard,
        path: "/admin/dashboard",
      },
    ],
  },
  {
    title: "Quản lý dịch vụ",
    items: [
      {
        title: "Điểm đến",
        icon: Map,
        path: "/admin/destinations",
      },
      {
        title: "Tour du lịch",
        icon: Compass,
        path: "/admin/tours",
      },
      {
        title: "Dịch vụ",
        icon: Calendar,
        path: "/admin/bookings",
      },
      {
        title: "Khách sạn",
        icon: Building2,
        path: "/admin/hotels",
      },
      {
        title: "Chuyến bay",
        icon: Plane,
        path: "/admin/flights",
      },
      {
        title: "Vé xe",
        icon: Bus,
        path: "/admin/transport",
      },
    ],
  },
  {
    title: "Quản lý nội dung",
    items: [
      {
        title: "Bài viết",
        icon: FileText,
        path: "/admin/posts",
      },
      {
        title: "Khuyến mãi",
        icon: Percent,
        path: "/admin/promotions",
      },
      {
        title: "Đánh giá",
        icon: Star,
        path: "/admin/reviews",
      },
    ],
  },
  {
    title: "Hệ thống",
    items: [
      {
        title: "Người dùng",
        icon: Users,
        path: "/admin/users",
      },
    ],
  },
];

const sidebarLinks = [
  {
    title: "Dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
    path: "/admin",
  },
  {
    title: "Người dùng",
    icon: <Users className="w-5 h-5" />,
    path: "/admin/users",
  },
  {
    title: "Khách sạn",
    icon: <Building2 className="w-5 h-5" />,
    path: "/admin/hotels",
  },
  {
    title: "Điểm đến",
    icon: <Map className="w-5 h-5" />,
    path: "/admin/destinations",
  },
  {
    title: "Chuyến bay",
    icon: <Plane className="w-5 h-5" />,
    path: "/admin/flights",
  },
  {
    title: "Vé xe",
    icon: <Bus className="w-5 h-5" />,
    path: "/admin/transport",
  },
  {
    title: "Đơn đặt",
    icon: <CalendarCheck className="w-5 h-5" />,
    path: "/admin/bookings",
  },
  {
    title: "Bài viết",
    icon: <FileText className="w-5 h-5" />,
    path: "/admin/posts",
  },
];

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();

  // Kiểm tra quyền truy cập
  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/login");
    }
  }, [user, navigate]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const handleLogout = () => {
    logout();
  };

  // Generate breadcrumbs based on current path
  const getBreadcrumbs = () => {
    const paths = location.pathname.split("/").filter(Boolean);
    const breadcrumbMap = {
      admin: "Trang chủ",
      dashboard: "Bảng điều khiển",
      destinations: "Điểm đến",
      tours: "Tour du lịch",
      bookings: "Dịch vụ",
      hotels: "Khách sạn",
      flights: "Chuyến bay",
      posts: "Bài viết",
      users: "Người dùng",
      profile: "Thông tin cá nhân",
    };

    return paths.map((path, index) => {
      const url = `/${paths.slice(0, index + 1).join("/")}`;
      return {
        title:
          breadcrumbMap[path] || path.charAt(0).toUpperCase() + path.slice(1),
        path: url,
      };
    });
  };

  const breadcrumbs = getBreadcrumbs();

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen transition-transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } bg-white border-r border-gray-200 w-64 overflow-y-auto`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b sticky top-0 bg-white z-10">
          <Link to="/admin" className="flex items-center gap-2">
            <Compass className="h-8 w-8 text-emerald-600" />
            <span className="text-xl font-bold text-gray-900">VietJourney</span>
          </Link>
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4">
          {menuGroups.map((group, index) => (
            <div key={index} className="px-4 mb-6">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                {group.title}
              </h3>
              <nav className="space-y-1">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                        isActive
                          ? "bg-emerald-50 text-emerald-600 shadow-sm"
                          : "text-gray-700 hover:bg-gray-50 hover:text-emerald-600"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={`${
          isSidebarOpen ? "lg:ml-64" : ""
        } min-h-screen flex flex-col`}
      >
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Breadcrumbs */}
              <nav className="hidden md:flex items-center gap-2">
                <Link
                  to="/admin"
                  className="text-gray-500 hover:text-emerald-600 transition-colors"
                >
                  <Home className="w-5 h-5" />
                </Link>
                {breadcrumbs.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <Link
                      to={item.path}
                      className={`text-sm ${
                        index === breadcrumbs.length - 1
                          ? "text-emerald-600 font-medium"
                          : "text-gray-500 hover:text-emerald-600"
                      }`}
                    >
                      {item.title}
                    </Link>
                  </div>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button className="p-2 rounded-lg hover:bg-gray-100 relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={toggleUserMenu}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <img
                    src={user.avatar}
                    alt={user.fullName}
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-700">
                      {user.fullName}
                    </p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1">
                    <Link
                      to="/"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 font-medium"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Home className="w-4 h-4" />
                      Về trang người dùng
                    </Link>
                    <hr className="my-1" />
                    <Link
                      to="/admin/profile"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      Thông tin cá nhân
                    </Link>
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
