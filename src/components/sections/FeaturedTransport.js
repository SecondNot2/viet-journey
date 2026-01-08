import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bus,
  Repeat,
  ArrowRight as ArrowRightIcon,
  Tag,
  Car,
  Train,
  Bike,
  Ship,
  Plane,
} from "lucide-react";
import axios from "axios";
import SectionContainer from "../common/SectionContainer";
import ServiceCard from "../common/ServiceCard";
import EmptyState from "../common/EmptyState";
import { API_BASE_URL, API_HOST } from "../../api";

// eslint-disable-next-line no-unused-vars
const PLACEHOLDER_IMAGE = `${API_HOST}/images/placeholder.png`;

// Component tùy chỉnh cho tag phương tiện
const TransportTypeTag = ({ type, className = "" }) => {
  // Defensive check: fallback to 'bus' if type is undefined/null
  const safeType = (type || "bus").toLowerCase();

  // Chuyển đổi loại phương tiện sang tiếng Việt
  const getTransportTypeLabel = () => {
    switch (safeType) {
      case "bus":
        return "Xe buýt";
      case "car":
        return "Xe ô tô";
      case "taxi":
        return "Taxi";
      case "train":
        return "Tàu hỏa";
      case "bike":
      case "motorbike":
        return "Xe máy";
      case "ferry":
      case "boat":
        return "Tàu thủy";
      case "flight":
      case "airplane":
        return "Máy bay";
      default:
        return "Phương tiện";
    }
  };

  // Chọn icon phù hợp với loại phương tiện
  const getTransportTypeIcon = () => {
    switch (safeType) {
      case "bus":
        return <Bus className="w-3 h-3 mr-1" />;
      case "car":
      case "taxi":
        return <Car className="w-3 h-3 mr-1" />;
      case "train":
        return <Train className="w-3 h-3 mr-1" />;
      case "bike":
      case "motorbike":
        return <Bike className="w-3 h-3 mr-1" />;
      case "ferry":
      case "boat":
        return <Ship className="w-3 h-3 mr-1" />;
      case "flight":
      case "airplane":
        return <Plane className="w-3 h-3 mr-1" />;
      default:
        return <Bus className="w-3 h-3 mr-1" />;
    }
  };

  // Chọn màu nền phù hợp với loại phương tiện
  const getTransportTypeColor = () => {
    switch (safeType) {
      case "bus":
        return "bg-orange-50 text-orange-700";
      case "car":
      case "taxi":
        return "bg-red-50 text-red-700";
      case "train":
        return "bg-blue-50 text-blue-700";
      case "bike":
      case "motorbike":
        return "bg-green-50 text-green-700";
      case "ferry":
      case "boat":
        return "bg-cyan-50 text-cyan-700";
      case "flight":
      case "airplane":
        return "bg-indigo-50 text-indigo-700";
      default:
        return "bg-orange-50 text-orange-700";
    }
  };

  return (
    <span
      className={`text-xs flex items-center px-2 py-1 rounded-full font-bold ${getTransportTypeColor()} ${className}`}
    >
      {getTransportTypeIcon()}
      {getTransportTypeLabel()}
    </span>
  );
};

const FeaturedTransport = () => {
  const navigate = useNavigate();
  const [transports, setTransports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [promotions, setPromotions] = useState({});

  // eslint-disable-next-line no-unused-vars
  const formatDate = (dateString) => {
    const options = { day: "numeric", month: "long", year: "numeric" };
    return new Date(dateString).toLocaleDateString("vi-VN", options);
  };

  // eslint-disable-next-line no-unused-vars
  const formatTime = (timeString) => {
    return new Date(timeString).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Hàm format giá
  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  // eslint-disable-next-line no-unused-vars
  const formatTripType = (tripType) => {
    switch (tripType) {
      case "one_way":
        return "Một chiều";
      case "round_trip":
        return "Khứ hồi";
      case "multi_city":
        return "Nhiều thành phố";
      default:
        return "Một chiều";
    }
  };

  // eslint-disable-next-line no-unused-vars
  const getTripTypeIcon = (tripType) => {
    switch (tripType) {
      case "round_trip":
        return <Repeat className="w-4 h-4 mr-1" />;
      case "multi_city":
        return <ArrowRightIcon className="w-4 h-4 mr-1" />;
      default:
        return <ArrowRightIcon className="w-4 h-4 mr-1" />;
    }
  };

  // Hàm kiểm tra và lấy thông tin khuyến mãi
  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/promotions/services`);

        // Tạo map lưu trữ thông tin khuyến mãi theo dịch vụ
        const promoMap = {};
        if (response.data && response.data.length > 0) {
          response.data.forEach((item) => {
            if (item.type === "transport") {
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
    const fetchTransports = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/transport/featured`);

        // Backend trả về array đã flatten
        const transportData = response.data;

        if (!transportData || transportData.length === 0) {
          setTransports([]);
          setLoading(false);
          return;
        }

        // Backend now returns flat data, no need to map
        setTransports(transportData);
        setLoading(false);
      } catch (err) {
        console.error("[ERROR] Lỗi khi tải dữ liệu phương tiện:", err);
        let errorMessage =
          "Không thể tải dữ liệu phương tiện. Vui lòng thử lại sau.";

        if (err.response) {
          errorMessage = err.response.data.message || errorMessage;
          console.error("[ERROR] Chi tiết lỗi response:", err.response.data);
        } else if (err.request) {
          errorMessage =
            "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.";
          console.error("[ERROR] Chi tiết lỗi request:", err.request);
        }

        setError(errorMessage);
        setLoading(false);
      }
    };

    fetchTransports();
  }, []);

  const handleTransportClick = (id) => {
    // id có thể là trip_id từ transport_trips
    navigate(`/transport/${id}`);
  };

  // Hàm tạo mô tả cho phương tiện
  const getTransportDescription = (transport) => {
    const vehicleName = transport.vehicle_name || transport.type;
    return `Di chuyển bằng ${vehicleName} từ ${transport.from_location} đến ${transport.to_location} với ${transport.company}.`;
  };

  // Lấy icon phù hợp cho phương tiện
  const getTransportIcon = () => {
    return Bus;
  };

  // eslint-disable-next-line no-unused-vars
  const renderPromotionTag = (transportId) => {
    const promo = promotions[transportId];
    if (!promo) return null;

    const discountLabel =
      promo.type === "percentage"
        ? `-${promo.discount}%`
        : `-${formatPrice(promo.discount)}`;

    return (
      <div className="absolute top-0 left-0 bg-red-600 text-white px-3 py-1 rounded-br-lg font-medium flex items-center">
        <Tag className="w-3 h-3 mr-1" />
        {discountLabel}
      </div>
    );
  };

  return (
    <SectionContainer
      title="Phương Tiện Di Chuyển Nổi Bật"
      viewAllLink="/transport"
      loading={loading}
      error={error}
    >
      {transports.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {transports.map((transport) => (
            <ServiceCard
              key={transport.trip_id || transport.id}
              id={transport.trip_id || transport.id}
              type="transport"
              image={transport.image}
              title={`${transport.company} - ${
                transport.vehicle_name || transport.type
              }`}
              description={getTransportDescription(transport)}
              price={transport.price}
              duration={transport.duration}
              departureTime={
                transport.departure_time || transport.departure_datetime
              }
              arrivalTime={transport.arrival_time || transport.arrival_datetime}
              fromLocation={transport.from_location}
              toLocation={transport.to_location}
              company={transport.company}
              vehicleName={transport.vehicle_name || transport.type}
              seats={transport.seats}
              promotion={promotions[transport.trip_id || transport.id]}
              tripType={transport.trip_type}
              icon={getTransportIcon()}
              onClick={handleTransportClick}
              actionButtonText="Đặt ngay"
              renderCustomTypeTag={() => (
                <TransportTypeTag type={transport.type} />
              )}
            />
          ))}
        </div>
      ) : !loading && !error ? (
        <EmptyState
          icon={Bus}
          title="Chưa có phương tiện nổi bật"
          description="Hệ thống đang cập nhật thông tin phương tiện"
        />
      ) : null}
    </SectionContainer>
  );
};

export default FeaturedTransport;
