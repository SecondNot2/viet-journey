import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Hotel,
  Wifi,
  Coffee,
  Utensils,
  Dumbbell,
  Bath,
  Car,
  Tv,
  Wind,
  Bed,
} from "lucide-react";
import axios from "axios";
import SectionContainer from "../common/SectionContainer";
import ServiceCard from "../common/ServiceCard";
import EmptyState from "../common/EmptyState";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

// Component hiển thị tiện nghi của khách sạn
const HotelAmenities = ({ amenities, className = "" }) => {
  // Xử lý dữ liệu tiện nghi từ database
  const parseAmenities = (amenitiesData) => {
    try {
      // Nếu là string JSON thì parse
      if (typeof amenitiesData === "string") {
        return JSON.parse(amenitiesData);
      }

      // Nếu đã là array thì trả về luôn
      if (Array.isArray(amenitiesData)) {
        return amenitiesData;
      }

      // Trường hợp không có dữ liệu hoặc dữ liệu không hợp lệ
      return [];
    } catch (error) {
      console.error("[ERROR] Lỗi khi parse tiện ích:", error);
      return [];
    }
  };

  // Map icon cho từng loại tiện nghi
  const getAmenityIcon = (amenity) => {
    const iconProps = { className: "w-4 h-4 mr-1 flex-shrink-0" };
    // Defensive check: return default icon if amenity is undefined/null
    if (!amenity) return <Bed {...iconProps} />;
    const amenityLower = amenity.toLowerCase();

    if (amenityLower.includes("wifi") || amenityLower.includes("internet")) {
      return <Wifi {...iconProps} />;
    }

    if (
      amenityLower.includes("ăn sáng") ||
      amenityLower.includes("buffet") ||
      amenityLower.includes("breakfast")
    ) {
      return <Coffee {...iconProps} />;
    }

    if (
      amenityLower.includes("nhà hàng") ||
      amenityLower.includes("ăn uống") ||
      amenityLower.includes("restaurant")
    ) {
      return <Utensils {...iconProps} />;
    }

    if (
      amenityLower.includes("gym") ||
      amenityLower.includes("thể dục") ||
      amenityLower.includes("fitness")
    ) {
      return <Dumbbell {...iconProps} />;
    }

    if (
      amenityLower.includes("bể bơi") ||
      amenityLower.includes("bơi") ||
      amenityLower.includes("pool")
    ) {
      return <Bath {...iconProps} />;
    }

    if (
      amenityLower.includes("đỗ xe") ||
      amenityLower.includes("bãi đậu") ||
      amenityLower.includes("parking")
    ) {
      return <Car {...iconProps} />;
    }

    if (
      amenityLower.includes("tv") ||
      amenityLower.includes("tivi") ||
      amenityLower.includes("truyền hình")
    ) {
      return <Tv {...iconProps} />;
    }

    if (
      amenityLower.includes("điều hòa") ||
      amenityLower.includes("máy lạnh") ||
      amenityLower.includes("air")
    ) {
      return <Wind {...iconProps} />;
    }

    if (amenityLower.includes("máy sưởi") || amenityLower.includes("nóng")) {
      return <Coffee {...iconProps} />;
    }

    if (amenityLower.includes("bồn tắm") || amenityLower.includes("tắm")) {
      return <Bed {...iconProps} />;
    }

    return <Bed {...iconProps} />;
  };

  // Parse tiện nghi từ dữ liệu ban đầu
  const parsedAmenities = parseAmenities(amenities);

  // Nếu không có tiện nghi thì trả về null
  if (!parsedAmenities || parsedAmenities.length === 0) {
    return null;
  }

  // Lấy tối đa 3 tiện nghi để hiển thị
  const displayAmenities = parsedAmenities.slice(0, 3);

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {displayAmenities.map((amenity, index) => (
        <div
          key={index}
          className="flex items-center text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-full transition-colors duration-200"
        >
          {getAmenityIcon(amenity)}
          <span>{amenity}</span>
        </div>
      ))}
      {parsedAmenities.length > 3 && (
        <div className="text-xs text-gray-500 flex items-center mb-2">
          +{parsedAmenities.length - 3} tiện ích khác
        </div>
      )}
    </div>
  );
};

// Component tùy chỉnh hiển thị hotel tag
const HotelTypeTag = ({ hotel, className = "" }) => {
  // Xác định loại khách sạn dựa vào số sao hoặc thông tin khác
  const getHotelType = (hotel) => {
    if (hotel.rating >= 4.5) return "Khách sạn 5 sao";
    if (hotel.rating >= 3.5) return "Khách sạn 4 sao";
    if (hotel.rating >= 2.5) return "Khách sạn 3 sao";
    if (hotel.rating >= 1.5) return "Khách sạn 2 sao";
    return "Khách sạn";
  };

  return (
    <span
      className={`text-xs uppercase px-2 py-1 rounded-full font-bold bg-blue-50 text-blue-700 shadow-sm transition-all duration-300 hover:shadow-md ${className}`}
    >
      <Hotel className="w-3 h-3 mr-1 inline" />
      {getHotelType(hotel)}
    </span>
  );
};

const FeaturedHotels = () => {
  const navigate = useNavigate();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [promotions, setPromotions] = useState({});

  // Hàm kiểm tra và lấy thông tin khuyến mãi
  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/promotions/services`);

        // Tạo map lưu trữ thông tin khuyến mãi theo dịch vụ
        const promoMap = {};
        if (response.data && response.data.length > 0) {
          response.data.forEach((item) => {
            if (item.type === "hotel") {
              promoMap[item.id] = {
                discount: item.promotion.discount,
                type: item.promotion.type,
                endDate: item.promotion.end_date,
              };
            }
          });
        }

        setPromotions(promoMap);
      } catch (err) {
        console.error("[ERROR] Lỗi khi tải dữ liệu khuyến mãi:", err);
      }
    };

    fetchPromotions();
  }, []);

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/hotels`, {
          params: {
            limit: "4",
            page: "1",
            sort_by: "rating",
          },
        });

        if (response.data && response.data.hotels) {
          setHotels(response.data.hotels);
        } else {
          setHotels([]);
        }
        setLoading(false);
      } catch (err) {
        console.error("[ERROR] Lỗi khi tải dữ liệu khách sạn:", err);
        setError(
          err.response?.data?.error ||
            "Không thể tải danh sách khách sạn nổi bật. Vui lòng thử lại sau."
        );
        setLoading(false);
      }
    };

    fetchHotels();
  }, []);

  const handleHotelClick = (id) => {
    navigate(`/hotels/${id}`);
  };

  // Xử lý ảnh khách sạn
  const getHotelImage = (images) => {
    if (!images || !Array.isArray(images) || images.length === 0) return null;
    return images[0];
  };

  // Render tiện nghi của khách sạn trong ServiceCard
  const renderHotelFeatures = (hotel) => {
    return (
      <div className="mt-2">
        <HotelAmenities amenities={hotel.amenities} />
      </div>
    );
  };

  return (
    <SectionContainer
      title="Khách Sạn Nổi Bật"
      viewAllLink="/hotels"
      loading={loading}
      error={error}
    >
      {hotels.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {hotels.map((hotel) => (
            <ServiceCard
              key={hotel.id}
              id={hotel.id}
              type="hotel"
              image={getHotelImage(hotel.images)}
              title={hotel.name}
              description={null}
              location={hotel.location}
              price={hotel.min_price}
              rating={hotel.rating}
              reviewCount={hotel.review_count}
              amenities={hotel.amenities}
              promotion={promotions[hotel.id]}
              icon={Hotel}
              onClick={handleHotelClick}
              actionButtonText="Đặt ngay"
              renderCustomTypeTag={() => <HotelTypeTag hotel={hotel} />}
              renderAdditionalFeatures={() => renderHotelFeatures(hotel)}
            />
          ))}
        </div>
      ) : !loading && !error ? (
        <EmptyState
          icon={Hotel}
          title="Chưa có khách sạn nổi bật"
          description="Hệ thống đang cập nhật dữ liệu khách sạn mới"
        />
      ) : null}
    </SectionContainer>
  );
};

export default FeaturedHotels;
