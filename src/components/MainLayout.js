import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import Breadcrumbs from "./Breadcrumbs";

import { MapPin, Calendar, Star } from "lucide-react";

const MainLayout = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = React.useState(false);
  const [isTourDropdownOpen, setIsTourDropdownOpen] = React.useState(false);
  const [currentLanguage, setCurrentLanguage] = React.useState("VN");

  const languages = [
    { code: "VN", name: "Tiếng Việt", currency: "VND" },
    { code: "EN", name: "English", currency: "USD" },
    { code: "KR", name: "한국어", currency: "KRW" },
    { code: "JP", name: "日本語", currency: "JPY" },
  ];

  const tourCategories = {
    byType: [
      { name: "Tour Khám Phá", icon: MapPin },
      { name: "Tour Nghỉ Dưỡng", icon: Calendar },
      { name: "Tour Mạo Hiểm", icon: Star },
    ],
    byRegion: [
      { name: "Miền Bắc", places: ["Hà Nội", "Hạ Long", "Sapa"] },
      { name: "Miền Trung", places: ["Huế", "Đà Nẵng", "Hội An"] },
      { name: "Miền Nam", places: ["TP.HCM", "Phú Quốc", "Cần Thơ"] },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header - Fixed position */}
      <Header
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        isLanguageOpen={isLanguageOpen}
        setIsLanguageOpen={setIsLanguageOpen}
        currentLanguage={currentLanguage}
        setCurrentLanguage={setCurrentLanguage}
        isTourDropdownOpen={isTourDropdownOpen}
        setIsTourDropdownOpen={setIsTourDropdownOpen}
        languages={languages}
        tourCategories={tourCategories}
      />
      {/* Header space placeholder */}
      <div className="h-[104px]"></div>{" "}
      {/* Điều chỉnh chiều cao này để phù hợp với chiều cao thực tế của header */}
      {/* Content wrapper */}
      <div className="flex-grow">
        <Breadcrumbs />
        <main>
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default MainLayout;
