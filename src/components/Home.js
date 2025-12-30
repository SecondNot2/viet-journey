// src/components/Home.js
import React from "react";
import { useNavigate } from "react-router-dom";
import Hero from "./Hero";
import {
  Award,
  Shield,
  DollarSign,
  Gift,
  Coffee,
  Utensils,
  Camera,
  Music,
  Plane,
  Hotel as HotelIcon,
  Bus,
  Compass,
  ArrowRight,
  Phone,
  Mail,
  Clock,
  Tag,
} from "lucide-react";
import FeaturedDestinations from "./sections/FeaturedDestinations";
import HotPromotions from "./sections/HotPromotions";
import LatestBlogs from "./sections/LatestBlogs";
import FeaturedFlights from "./sections/FeaturedFlights";
import FeaturedHotels from "./sections/FeaturedHotels";
import FeaturedTours from "./sections/FeaturedTours";
import FeaturedTransport from "./sections/FeaturedTransport";

const Home = () => {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = React.useState(0);
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [dateRange, setDateRange] = React.useState({
    from: undefined,
    to: undefined,
  });
  const [passengers, setPassengers] = React.useState({
    adults: 1,
    children: 0,
    infants: 0,
  });

  const experiences = [
    {
      title: "Ẩm Thực Đường Phố",
      icon: Utensils,
      description: "Khám phá các món ăn đường phố độc đáo",
      price: "300.000đ",
      duration: "3 giờ",
    },
    {
      title: "Cafe Văn Hóa",
      icon: Coffee,
      description: "Thưởng thức cafe trong không gian văn hóa",
      price: "250.000đ",
      duration: "2 giờ",
    },
    {
      title: "Chụp Ảnh",
      icon: Camera,
      description: "Tour chụp ảnh tại các địa điểm nổi tiếng",
      price: "500.000đ",
      duration: "4 giờ",
    },
    {
      title: "Âm Nhạc Dân Tộc",
      icon: Music,
      description: "Trải nghiệm âm nhạc truyền thống",
      price: "400.000đ",
      duration: "2 giờ",
    },
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleExperienceClick = (type) => {
    navigate(`/tours/type/${type}`);
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <Hero
        selectedTab={selectedTab}
        setSelectedTab={setSelectedTab}
        showDatePicker={showDatePicker}
        setShowDatePicker={setShowDatePicker}
        dateRange={dateRange}
        setDateRange={setDateRange}
        passengers={passengers}
        setPassengers={setPassengers}
      />

      {/* Quick Links */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Plane, title: "Vé Máy Bay", path: "/flights" },
              { icon: HotelIcon, title: "Khách Sạn", path: "/hotels" },
              { icon: Compass, title: "Tour Du Lịch", path: "/tours" },
              { icon: Bus, title: "Vé Xe & Tàu", path: "/transport" },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div
                  className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition group cursor-pointer"
                  onClick={() => handleNavigation(item.path)}
                >
                  <item.icon className="w-12 h-12 text-emerald-600 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="font-semibold group-hover:text-emerald-600 transition-colors">
                    {item.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Destinations */}
      <FeaturedDestinations />

      {/* Featured Flights */}
      <FeaturedFlights />

      {/* Featured Hotels */}
      <FeaturedHotels />

      {/* Featured Tours */}
      <FeaturedTours />

      {/* Featured Transport */}
      <FeaturedTransport />

      {/* Hot Promotions */}
      <HotPromotions />

      {/* Experiences Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold">Trải Nghiệm Độc Đáo</h2>
            <button
              onClick={() => handleNavigation("/tours/type/experience")}
              className="text-emerald-600 font-semibold flex items-center gap-2 hover:gap-3 transition-all"
            >
              Xem tất cả <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {experiences.map((exp, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition group cursor-pointer"
                onClick={() =>
                  handleExperienceClick(
                    exp.title.toLowerCase().replace(/\s+/g, "-")
                  )
                }
              >
                <exp.icon className="w-12 h-12 text-emerald-600 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-semibold mb-2 group-hover:text-emerald-600 transition-colors">
                  {exp.title}
                </h3>
                <p className="text-gray-600 mb-4">{exp.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-gray-500">
                    <Clock className="w-4 h-4" />
                    {exp.duration}
                  </div>
                  <div className="flex items-center gap-1 text-emerald-600 font-medium">
                    <Tag className="w-4 h-4" />
                    {exp.price}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-emerald-600 text-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Tại Sao Chọn Chúng Tôi?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                icon: Award,
                title: "Dịch Vụ Chất Lượng",
                description: "Cam kết trải nghiệm du lịch tốt nhất",
              },
              {
                icon: Shield,
                title: "An Toàn & Tin Cậy",
                description: "Đảm bảo an toàn cho mọi chuyến đi",
              },
              {
                icon: DollarSign,
                title: "Giá Cả Hợp Lý",
                description: "Cam kết giá tốt nhất thị trường",
              },
              {
                icon: Gift,
                title: "Ưu Đãi Hấp Dẫn",
                description: "Nhiều chương trình khuyến mãi đặc biệt",
              },
            ].map((item, index) => (
              <div key={index} className="text-center group">
                <div className="bg-white/10 rounded-lg p-6 backdrop-blur-sm hover:bg-white/20 transition">
                  <item.icon className="w-12 h-12 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-white/80">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact & Newsletter Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div>
              <h2 className="text-3xl font-bold mb-8">Liên Hệ Với Chúng Tôi</h2>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="bg-emerald-100 p-3 rounded-lg">
                    <Phone className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium">Hotline</p>
                    <p className="text-gray-600">1900 1234</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="bg-emerald-100 p-3 rounded-lg">
                    <Mail className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-gray-600">info@vietjourney.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="bg-emerald-100 p-3 rounded-lg">
                    <Clock className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium">Giờ làm việc</p>
                    <p className="text-gray-600">24/7</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Newsletter */}
            <div className="bg-emerald-50 p-8 rounded-lg">
              <h2 className="text-3xl font-bold mb-4">
                Đăng Ký Nhận Thông Tin Ưu Đãi
              </h2>
              <p className="text-gray-600 mb-6">
                Để không bỏ lỡ những ưu đãi hấp dẫn và thông tin du lịch mới
                nhất, hãy đăng ký nhận bản tin của chúng tôi.
              </p>
              <div className="flex gap-4">
                <input
                  type="email"
                  placeholder="Email của bạn"
                  className="flex-1 p-3 rounded-lg border focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <button className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition flex items-center gap-2">
                  Đăng Ký
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Blog Posts */}
      <LatestBlogs />
    </div>
  );
};

export default Home;
