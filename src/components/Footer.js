import React from "react";
import { Link } from "react-router-dom";
import {
  Facebook,
  Instagram,
  Youtube,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 pt-10">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Thông tin công ty */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">
              Du lịch Việt Nam
            </h3>
            <p className="text-sm">
              Khám phá vẻ đẹp Việt Nam qua những hành trình độc đáo và trải
              nghiệm văn hóa đặc sắc.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://facebook.com"
                className="hover:text-white transition"
              >
                <Facebook size={20} />
              </a>
              <a
                href="https://instagram.com"
                className="hover:text-white transition"
              >
                <Instagram size={20} />
              </a>
              <a
                href="https://youtube.com"
                className="hover:text-white transition"
              >
                <Youtube size={20} />
              </a>
            </div>
          </div>

          {/* Liên kết nhanh */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">Khám phá</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/destinations"
                  className="hover:text-white transition"
                >
                  Điểm đến
                </Link>
              </li>
              <li>
                <Link to="/tours" className="hover:text-white transition">
                  Tour du lịch
                </Link>
              </li>
              <li>
                <Link to="/hotels" className="hover:text-white transition">
                  Khách sạn
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-white transition">
                  Blog du lịch
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition">
                  Về chúng tôi
                </Link>
              </li>
            </ul>
          </div>

          {/* Dịch vụ */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">Dịch vụ</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/flights" className="hover:text-white transition">
                  Vé máy bay
                </Link>
              </li>
              <li>
                <Link
                  to="/hotels/booking"
                  className="hover:text-white transition"
                >
                  Đặt phòng khách sạn
                </Link>
              </li>
              <li>
                <Link
                  to="/tours/booking"
                  className="hover:text-white transition"
                >
                  Đặt tour
                </Link>
              </li>
              <li>
                <Link
                  to="/transportation"
                  className="hover:text-white transition"
                >
                  Thuê xe
                </Link>
              </li>
              <li>
                <Link to="/visa" className="hover:text-white transition">
                  Dịch vụ visa
                </Link>
              </li>
            </ul>
          </div>

          {/* Liên hệ */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">Liên hệ</h3>
            <ul className="space-y-3">
              <li className="flex items-center space-x-3">
                <Phone size={18} />
                <span>1900 1202</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail size={18} />
                <a
                  href="mailto:contact@travel.vn"
                  className="hover:text-white transition"
                >
                  contact@vietjourney.vn
                </a>
              </li>
              <li className="flex items-start space-x-3">
                <MapPin size={18} className="mt-1 flex-shrink-0" />
                <span>
                  Hồ Tùng Mậu, Mai Dịch, Cầu Giấy
                  <br />
                  Hà Nội, Việt Nam
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright và Sitemap */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="text-sm">
              © {new Date().getFullYear()} Du lịch Việt Nam. All rights
              reserved.
            </div>
            <div className="flex space-x-4 text-sm md:justify-end">
              <Link to="/terms" className="hover:text-white transition">
                Điều khoản sử dụng
              </Link>
              <Link to="/privacy" className="hover:text-white transition">
                Chính sách bảo mật
              </Link>
              <Link to="/sitemap" className="hover:text-white transition">
                Sitemap
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
