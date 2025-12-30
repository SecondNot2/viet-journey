import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Hotel, MapPin, Plane, Bus, Car, Train, Bike } from "lucide-react";
import axios from "axios";
// import { Link } from "react-router-dom"; // unused
import SectionContainer from "../common/SectionContainer";
import ServiceCard from "../common/ServiceCard";
// import TransportTypeTag from "./FeaturedTransport"; // unused

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
const PLACEHOLDER_IMAGE = `${API_URL}/images/placeholder.png`;

const HotPromotions = () => {
  const navigate = useNavigate();
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // eslint-disable-next-line no-unused-vars
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return PLACEHOLDER_IMAGE;
    if (imageUrl.startsWith("http")) return imageUrl;
    return `${API_URL}/${imageUrl.replace(/^\//, "")}`;
  };

  // eslint-disable-next-line no-unused-vars
  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Hàm tạo link dịch vụ
  const getServiceLink = (type, id) => {
    switch (type) {
      case "tour":
        return `/tours/${id}`;
      case "hotel":
        return `/hotels/${id}`;
      case "flight":
        return `/flights/${id}`;
      case "transport":
        return `/transport/${id}`;
      default:
        return "#";
    }
  };

  // eslint-disable-next-line no-unused-vars
  const getServiceIcon = (type, transport_type) => {
    switch (type) {
      case "tour":
        return <MapPin className="w-5 h-5 text-emerald-600" />;
      case "hotel":
        return <Hotel className="w-5 h-5 text-blue-600" />;
      case "flight":
        return <Plane className="w-5 h-5 text-indigo-600" />;
      case "transport":
        switch (transport_type) {
          case "bus":
            return <Bus className="w-5 h-5 text-orange-600" />;
          case "car":
            return <Car className="w-5 h-5 text-orange-600" />;
          case "train":
            return <Train className="w-5 h-5 text-orange-600" />;
          case "bike":
            return <Bike className="w-5 h-5 text-orange-600" />;
          default:
            return <Car className="w-5 h-5 text-orange-600" />;
        }
      default:
        return <MapPin className="w-5 h-5 text-emerald-600" />;
    }
  };

  // eslint-disable-next-line no-unused-vars
  const getServiceColor = (type) => {
    switch (type) {
      case "tour":
        return "bg-emerald-50 text-emerald-700";
      case "hotel":
        return "bg-blue-50 text-blue-700";
      case "flight":
        return "bg-indigo-50 text-indigo-700";
      case "transport":
        return "bg-orange-50 text-orange-700";
      default:
        return "bg-gray-50 text-gray-700";
    }
  };

  // eslint-disable-next-line no-unused-vars
  const getServiceDescription = (service) => {
    switch (service.type) {
      case "tour":
        return service.description
          ? service.description.substring(0, 100) + "..."
          : `Khám phá vẻ đẹp tuyệt vời của ${
              service.location || "Việt Nam"
            } cùng tour du lịch hấp dẫn, trải nghiệm văn hóa và ẩm thực độc đáo.`;
      case "hotel":
        return service.description
          ? service.description.substring(0, 100) + "..."
          : `Khách sạn sang trọng tại ${
              service.location || "Việt Nam"
            } với đầy đủ tiện nghi, phòng rộng rãi và dịch vụ chất lượng cao.`;
      case "flight":
        return `Chuyến bay thẳng từ ${service.from_location} đến ${
          service.to_location
        }, khởi hành lúc ${formatTime(service.departure_time)}.`;
      case "transport":
        return `Di chuyển tiện lợi từ ${service.from_location} đến ${service.to_location} với ${service.company} chất lượng cao.`;
      default:
        return "Dịch vụ du lịch chất lượng với giá ưu đãi hấp dẫn.";
    }
  };

  // Hàm format thời gian
  const formatTime = (dateTimeString) => {
    if (!dateTimeString) return "";
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // eslint-disable-next-line no-unused-vars
  const formatDate = (dateTimeString) => {
    if (!dateTimeString) return "";
    const date = new Date(dateTimeString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Lấy danh sách dịch vụ đang khuyến mãi
  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        setError(null);

        let response;

        try {
          // Thử gọi API promotions/global trước
          response = await axios.get(`${API_URL}/api/promotions/global`);
        } catch (globalError) {
          try {
            // Fallback: thử API promotions/services
            response = await axios.get(`${API_URL}/api/promotions/services`);
          } catch (servicesError) {
            // Không có API nào hoạt động, set empty array
            setPromotions([]);
            setLoading(false);
            return;
          }
        }

        if (
          response.data &&
          Array.isArray(response.data) &&
          response.data.length > 0
        ) {
          // Lọc và sắp xếp các khuyến mãi
          const filteredPromotions = response.data
            .filter((promo) => {
              // Đảm bảo có đủ dữ liệu
              if (!promo || (!promo.promotion && !promo.id)) {
                return false;
              }
              return true;
            })
            .sort((a, b) => {
              // Sắp xếp theo mức giảm giá (cao đến thấp) và ngày kết thúc (gần đến xa)
              const discountA = a.promotion ? a.promotion.discount : 0;
              const discountB = b.promotion ? b.promotion.discount : 0;
              const discountDiff = discountB - discountA;
              if (discountDiff !== 0) return discountDiff;

              const endDateA = new Date(
                a.promotion ? a.promotion.end_date : new Date()
              );
              const endDateB = new Date(
                b.promotion ? b.promotion.end_date : new Date()
              );
              return endDateA - endDateB;
            })
            .slice(0, 4); // Chỉ lấy 4 khuyến mãi

          setPromotions(filteredPromotions);
        } else if (response.data && !Array.isArray(response.data)) {
          setPromotions([]);
        } else {
          setPromotions([]);
        }
      } catch (err) {
        console.error("[ERROR] Lỗi khi tải dữ liệu khuyến mãi:", err);
        // Không set error, chỉ để trống promotions
        setPromotions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPromotions();
  }, []);

  const handlePromotionClick = (id, type) => {
    navigate(getServiceLink(type, id));
  };

  // eslint-disable-next-line no-unused-vars
  const getDaysRemaining = (endDate) => {
    if (!endDate) return null;
    const daysRemaining = Math.ceil(
      (new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24)
    );
    return daysRemaining > 0 ? daysRemaining : 0;
  };

  // Tạo props cho từng loại dịch vụ đang khuyến mãi
  const createServiceProps = (item) => {
    // Xử lý dữ liệu promotion (hỗ trợ cả API /global và /services)
    const promotionData = item.promotion || {
      discount: 0,
      type: "percentage",
      end_date: null,
    };

    // Tính giá sau khuyến mãi
    const originalPrice = item.original_price || item.price || 0;
    const discountedPrice =
      item.discounted_price ||
      (promotionData.type === "percentage"
        ? originalPrice - (originalPrice * promotionData.discount) / 100
        : originalPrice - promotionData.discount);

    const promotion = {
      discount: promotionData.discount,
      type: promotionData.type,
      endDate: promotionData.end_date,
      title: promotionData.title,
      savings: item.savings, // Số tiền tiết kiệm được
    };

    // Props chung
    const props = {
      id: item.id,
      type: item.type,
      image: item.image,
      title: item.name || item.title,
      description: item.description,
      price: originalPrice,
      discountedPrice: Math.round(discountedPrice),
      promotion: promotion,
      onClick: () => handlePromotionClick(item.id, item.type),
    };

    // Props theo loại dịch vụ
    switch (item.type) {
      case "tour":
        return {
          ...props,
          location: item.location,
          duration: item.duration,
          groupSize: item.group_size,
          rating: item.rating || 0,
          reviewCount: item.review_count || 0,
        };
      case "flight":
        return {
          ...props,
          fromLocation: item.from_location,
          toLocation: item.to_location,
          departureTime: item.departure_time,
          arrivalTime: item.arrival_time,
          duration: item.duration,
          tripType: item.trip_type,
          airline: item.airline,
          flightNumber: item.flight_number,
        };
      case "transport":
        return {
          ...props,
          fromLocation: item.from_location,
          toLocation: item.to_location,
          departureTime: item.departure_time,
          arrivalTime: item.arrival_time,
          duration: item.duration,
          tripType: item.trip_type,
          transportType: item.transport_type,
          company: item.company,
        };
      case "hotel":
        return {
          ...props,
          location: item.location,
          rating: item.rating || 0,
          reviewCount: item.review_count || 0,
        };
      default:
        return props;
    }
  };

  return (
    <SectionContainer
      title="Khuyến Mãi Hấp Dẫn"
      viewAllLink="/promotions-services"
      loading={loading}
      error={error}
      bgColor="bg-gray-50"
    >
      {promotions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {promotions.map((promo) => (
            <ServiceCard
              key={`${promo.type}-${promo.id}`}
              {...createServiceProps(promo)}
              actionButtonText="Đặt ngay"
            />
          ))}
        </div>
      ) : !loading && !error ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a2 2 0 012-2z"
              />
            </svg>
            <p className="text-lg font-medium text-gray-700">
              Chưa có khuyến mãi nào
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Hệ thống đang cập nhật các chương trình khuyến mãi mới
            </p>
          </div>
        </div>
      ) : null}
    </SectionContainer>
  );
};

export default HotPromotions;
