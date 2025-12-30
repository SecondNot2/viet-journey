import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  MapPin,
  Star,
  Calendar,
  Sun,
  CloudRain,
  Snowflake,
  Leaf,
  Flower,
} from "lucide-react";
import SectionContainer from "../common/SectionContainer";
import EmptyState from "../common/EmptyState";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
const PLACEHOLDER_IMAGE = `${API_URL}/images/placeholder.png`;

// Tạo component DestinationCard riêng cho điểm đến
const DestinationCard = ({
  id,
  name,
  image,
  description,
  location,
  rating,
  reviewCount,
  type,
  region,
  bestTimeToVisit,
  relatedServices,
  onClick,
}) => {
  // Hàm xử lý URL ảnh
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return PLACEHOLDER_IMAGE;
    if (imageUrl.startsWith("http")) return imageUrl;
    if (imageUrl.startsWith("/uploads")) return `${API_URL}${imageUrl}`;
    return `${API_URL}/${imageUrl}`.replace(/\/\//g, "/");
  };

  // Định dạng tên loại điểm đến sang tiếng Việt
  const getVietnamseType = (type) => {
    if (!type) return "";

    const typeMapping = {
      nature: "Thiên nhiên",
      culture: "Văn hóa",
      beach: "Biển",
      mountain: "Núi",
      city: "Đô thị",
    };

    return typeMapping[type] || type.replace(/_/g, " ");
  };

  // Định dạng vùng miền sang tiếng Việt
  const getVietnameseRegion = (region) => {
    if (!region) return "";

    const regionMapping = {
      north: "Miền Bắc",
      central: "Miền Trung",
      south: "Miền Nam",
    };

    return regionMapping[region] || region;
  };

  // Hàm lấy icon phù hợp theo mùa/thời gian
  const getSeasonIcon = (timeToVisit) => {
    if (!timeToVisit) return <Calendar className="w-3 h-3" />;

    const time = timeToVisit.toLowerCase();

    if (
      time.includes("tháng 12") ||
      time.includes("tháng 1") ||
      time.includes("tháng 2")
    ) {
      return <Snowflake className="w-3 h-3 text-blue-300" />; // Mùa đông
    }

    if (
      time.includes("tháng 3") ||
      time.includes("tháng 4") ||
      time.includes("tháng 5")
    ) {
      return <Flower className="w-3 h-3 text-pink-300" />; // Mùa xuân
    }

    if (
      time.includes("tháng 6") ||
      time.includes("tháng 7") ||
      time.includes("tháng 8")
    ) {
      return <Sun className="w-3 h-3 text-yellow-300" />; // Mùa hè
    }

    if (
      time.includes("tháng 9") ||
      time.includes("tháng 10") ||
      time.includes("tháng 11")
    ) {
      return <Leaf className="w-3 h-3 text-orange-300" />; // Mùa thu
    }

    if (time.includes("mưa") || time.includes("ẩm")) {
      return <CloudRain className="w-3 h-3 text-blue-300" />; // Mùa mưa
    }

    if (time.includes("khô") || time.includes("nắng")) {
      return <Sun className="w-3 h-3 text-yellow-300" />; // Mùa khô/nắng
    }

    if (time.includes("quanh năm")) {
      return <Calendar className="w-3 h-3 text-green-300" />; // Quanh năm
    }

    return <Calendar className="w-3 h-3" />; // Mặc định
  };

  // Hàm lấy màu nền cho tag thời gian tham quan
  const getSeasonBackgroundColor = (timeToVisit) => {
    if (!timeToVisit) return "bg-white/20";

    const time = timeToVisit.toLowerCase();

    if (
      time.includes("tháng 12") ||
      time.includes("tháng 1") ||
      time.includes("tháng 2")
    ) {
      return "bg-blue-500/30"; // Mùa đông
    }

    if (
      time.includes("tháng 3") ||
      time.includes("tháng 4") ||
      time.includes("tháng 5")
    ) {
      return "bg-pink-500/30"; // Mùa xuân
    }

    if (
      time.includes("tháng 6") ||
      time.includes("tháng 7") ||
      time.includes("tháng 8")
    ) {
      return "bg-yellow-500/30"; // Mùa hè
    }

    if (
      time.includes("tháng 9") ||
      time.includes("tháng 10") ||
      time.includes("tháng 11")
    ) {
      return "bg-orange-500/30"; // Mùa thu
    }

    if (time.includes("mưa") || time.includes("ẩm")) {
      return "bg-blue-500/30"; // Mùa mưa
    }

    if (time.includes("khô") || time.includes("nắng")) {
      return "bg-yellow-500/30"; // Mùa khô/nắng
    }

    return "bg-white/20"; // Mặc định
  };

  return (
    <div
      className="group relative overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer"
      onClick={() => onClick(id)}
    >
      <div className="relative h-64 overflow-hidden">
        <img
          src={getImageUrl(image)}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = PLACEHOLDER_IMAGE;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

        {/* Tag vùng miền (region) */}
        {region && (
          <div className="absolute top-0 left-0 bg-emerald-600 text-white px-3 py-1 rounded-br-lg font-medium flex items-center z-10">
            <MapPin className="w-3 h-3 mr-1" />
            <span className="text-sm">{getVietnameseRegion(region)}</span>
          </div>
        )}

        {/* Tag loại điểm đến (type) bằng tiếng Việt */}
        {type && (
          <div className="absolute top-0 right-0 bg-blue-600 text-white px-3 py-1 rounded-bl-lg font-medium text-xs z-10">
            {getVietnamseType(type)}
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
        <h3 className="text-xl font-bold mb-2">{name}</h3>

        <div className="flex items-center justify-between mb-3">
          {/* Đánh giá - nếu chưa có thì hiển thị "Chưa có đánh giá" */}
          <div className="flex items-center">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="ml-1 text-sm font-medium">
              {rating ? rating.toFixed(1) : "Chưa có đánh giá"}
            </span>
            {rating > 0 && (
              <span className="text-xs opacity-80 ml-1">
                ({reviewCount} đánh giá)
              </span>
            )}
          </div>

          {/* Thời điểm tốt nhất để tham quan với icon theo mùa */}
          {bestTimeToVisit && (
            <div
              className={`flex items-center text-xs ${getSeasonBackgroundColor(
                bestTimeToVisit
              )} rounded-full px-2 py-1`}
            >
              {getSeasonIcon(bestTimeToVisit)}
              <span className="ml-1">{bestTimeToVisit}</span>
            </div>
          )}
        </div>

        {/* Các dịch vụ liên quan */}
        {relatedServices && relatedServices.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {relatedServices.map((service, index) => (
              <span
                key={index}
                className="text-xs bg-white/30 rounded-full px-2 py-0.5"
              >
                {service}
              </span>
            ))}
          </div>
        )}

        <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg transition-colors duration-300 mt-2 text-sm font-medium">
          Khám phá
        </button>
      </div>
    </div>
  );
};

const FeaturedDestinations = () => {
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/api/destinations/featured?limit=4`
        );
        if (!response.data || response.data.length === 0) {
          setDestinations([]);
          setLoading(false);
          return;
        }

        // Thêm dữ liệu giả về các dịch vụ liên quan cho mỗi điểm đến
        const enhancedDestinations = response.data.map((destination) => {
          // Danh sách các dịch vụ có thể có tại điểm đến
          const potentialServices = [
            "Tour",
            "Khách sạn",
            "Nhà hàng",
            "Phương tiện",
            "Hoạt động",
            "Lưu trú",
          ];

          // Chọn ngẫu nhiên 2-4 dịch vụ
          const numServices = Math.floor(Math.random() * 3) + 2; // 2-4 dịch vụ
          const selectedServices = [];

          while (
            selectedServices.length < numServices &&
            potentialServices.length > 0
          ) {
            const randomIndex = Math.floor(
              Math.random() * potentialServices.length
            );
            selectedServices.push(potentialServices[randomIndex]);
            potentialServices.splice(randomIndex, 1);
          }

          // Nếu không có best_time_to_visit, tạo dữ liệu giả
          const bestTimeToVisit =
            destination.best_time_to_visit ||
            guessBestTimeToVisit(destination.type, destination.region);

          return {
            ...destination,
            relatedServices: selectedServices,
            bestTimeToVisit,
          };
        });

        setDestinations(enhancedDestinations);
        setLoading(false);
      } catch (err) {
        console.error("[ERROR] Lỗi khi tải dữ liệu điểm đến:", err);
        let errorMessage =
          "Không thể tải dữ liệu điểm đến. Vui lòng thử lại sau.";

        if (err.response) {
          // Lỗi từ server
          errorMessage = err.response.data.message || errorMessage;
          console.error("[ERROR] Chi tiết lỗi response:", err.response.data);
        } else if (err.request) {
          // Lỗi không thể kết nối đến server
          errorMessage =
            "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.";
          console.error("[ERROR] Chi tiết lỗi request:", err.request);
        }

        setError(errorMessage);
        setLoading(false);
      }
    };

    fetchDestinations();
  }, []);

  // Hàm đoán thời điểm tốt nhất để tham quan dựa vào loại và vùng miền
  const guessBestTimeToVisit = (type, region) => {
    if (type === "beach") {
      return "Tháng 5 - Tháng 8";
    } else if (type === "mountain") {
      return "Tháng 9 - Tháng 11";
    } else if (region === "north") {
      return "Tháng 10 - Tháng 3";
    } else if (region === "central") {
      return "Tháng 1 - Tháng 4";
    } else if (region === "south") {
      return "Tháng 12 - Tháng 3";
    }

    return "Quanh năm";
  };

  const handleDestinationClick = (id) => {
    navigate(`/destinations/${id}`);
  };

  return (
    <SectionContainer
      title="Điểm Đến Nổi Bật"
      viewAllLink="/destinations"
      loading={loading}
      error={error}
      bgColor="bg-white"
    >
      {destinations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {destinations.map((destination) => (
            <DestinationCard
              key={destination.id}
              id={destination.id}
              name={destination.name}
              image={destination.main_image || destination.image}
              description={destination.description}
              location={destination.location}
              rating={destination.rating}
              reviewCount={destination.review_count}
              type={destination.type}
              region={destination.region}
              bestTimeToVisit={
                destination.best_time_to_visit || destination.bestTimeToVisit
              }
              relatedServices={destination.relatedServices}
              onClick={handleDestinationClick}
            />
          ))}
        </div>
      ) : !loading && !error ? (
        <EmptyState
          icon={MapPin}
          title="Chưa có điểm đến nổi bật"
          description="Hệ thống đang cập nhật dữ liệu điểm đến mới"
        />
      ) : null}
    </SectionContainer>
  );
};

export default FeaturedDestinations;
