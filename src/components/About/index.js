import React from "react";
import { Phone, Mail, MapPin, Clock, Users, Globe, Heart } from "lucide-react";

const About = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <div className="bg-emerald-600 py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-white mb-4">Về Chúng Tôi</h1>
          <p className="text-emerald-100 text-lg max-w-2xl">
            Khám phá và trải nghiệm Việt Nam cùng VietJourney
          </p>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Introduction */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Giới Thiệu
            </h2>
            <div className="prose prose-emerald">
              <p className="text-gray-600 mb-4">
                VietJourney là website du lịch hàng đầu tại Việt Nam, cung cấp
                đầy đủ thông tin về các điểm đến hấp dẫn và dịch vụ du lịch chất
                lượng cao.
              </p>
              <p className="text-gray-600 mb-4">
                Chúng tôi cam kết mang đến cho khách hàng những trải nghiệm du
                lịch tuyệt vời với giá cả hợp lý và dịch vụ chuyên nghiệp.
              </p>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Thông Tin Liên Hệ
            </h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Phone className="text-emerald-600" size={20} />
                <div>
                  <p className="text-gray-600">Hotline</p>
                  <p className="font-medium">1900 1202</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="text-emerald-600" size={20} />
                <div>
                  <p className="text-gray-600">Email</p>
                  <p className="font-medium">contact@vietjourney.com</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="text-emerald-600" size={20} />
                <div>
                  <p className="text-gray-600">Địa chỉ</p>
                  <p className="font-medium">
                    Hồ Tùng Mậu, Mai Dịch, Cầu Giấy, Hà Nội
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="text-emerald-600" size={20} />
                <div>
                  <p className="text-gray-600">Giờ làm việc</p>
                  <p className="font-medium">24/7</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Our Mission Section */}
      <div className="container mx-auto px-4 py-12 bg-white">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Sứ Mệnh Của Chúng Tôi
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <Users className="text-emerald-600 mx-auto mb-4" size={40} />
            <h3 className="font-bold text-lg mb-2">Khách Hàng Là Trọng Tâm</h3>
            <p className="text-gray-600">
              Chúng tôi luôn đặt khách hàng lên hàng đầu, mang đến dịch vụ tốt
              nhất.
            </p>
          </div>
          <div className="text-center">
            <Globe className="text-emerald-600 mx-auto mb-4" size={40} />
            <h3 className="font-bold text-lg mb-2">Khám Phá Thế Giới</h3>
            <p className="text-gray-600">
              Giúp bạn khám phá những điểm đến mới lạ và thú vị trên toàn thế
              giới.
            </p>
          </div>
          <div className="text-center">
            <Heart className="text-emerald-600 mx-auto mb-4" size={40} />
            <h3 className="font-bold text-lg mb-2">Tận Tâm Phục Vụ</h3>
            <p className="text-gray-600">
              Đội ngũ của chúng tôi luôn tận tâm và nhiệt huyết trong từng
              chuyến đi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
