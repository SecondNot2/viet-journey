import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

const routeNames = {
  // Các trang chính
  tours: "Tour Du Lịch",
  destinations: "Điểm Đến",
  hotels: "Khách Sạn",
  flights: "Vé Máy Bay",
  transport: "Vé Xe/Tàu",
  guide: "Cẩm Nang",
  blog: "Blog Du Lịch",
  about: "Giới Thiệu",
  contact: "Liên Hệ",

  // Các trang dịch vụ
  wishlist: "Yêu Thích",

  // Các trang xác thực
  login: "Đăng Nhập",
  register: "Đăng Ký",
  "forgot-password": "Quên Mật Khẩu",
  profile: "Tài Khoản",

  // Các action
  booking: "Đặt",
  payment: "Thanh Toán",
  confirmation: "Xác Nhận",

  // Các khu vực
  north: "Miền Bắc",
  central: "Miền Trung",
  south: "Miền Nam",

  // Các loại tour
  cultural: "Du Lịch Văn Hóa",
  nature: "Du Lịch Thiên Nhiên",
  food: "Du Lịch Ẩm Thực",
  adventure: "Du Lịch Mạo Hiểm",

  // Các loại điểm đến
  beach: "Biển",
  mountain: "Núi",
  city: "Thành Phố",
  countryside: "Nông Thôn",
  island: "Đảo",
};

const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  // Các trang không hiển thị breadcrumbs
  const excludedPaths = ["login", "register", "forgot-password"];
  if (pathnames.length === 0 || excludedPaths.includes(pathnames[0])) {
    return null;
  }

  return (
    <nav className="bg-gray-50 border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center py-3 text-sm">
          <Link
            to="/"
            className="text-gray-600 hover:text-emerald-600 flex items-center transition-colors"
          >
            <Home size={16} className="mr-1" />
            Trang chủ
          </Link>

          {pathnames.map((name, index) => {
            const routeTo = `/${pathnames.slice(0, index + 1).join("/")}`;
            const isLast = index === pathnames.length - 1;

            // Xử lý các trường hợp đặc biệt
            let displayName = routeNames[name] || name;
            if (name.match(/^[0-9a-f]{24}$/)) {
              // Nếu là MongoDB ObjectId
              displayName = "Chi tiết";
            }

            return (
              <React.Fragment key={name}>
                <ChevronRight size={16} className="mx-2 text-gray-400" />
                {isLast ? (
                  <span className="text-emerald-600 font-medium">
                    {displayName}
                  </span>
                ) : (
                  <Link
                    to={routeTo}
                    className="text-gray-600 hover:text-emerald-600 transition-colors"
                  >
                    {displayName}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Breadcrumbs;
