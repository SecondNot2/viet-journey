import React from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Star,
  Clock,
  Calendar,
  Tag,
  User,
  ArrowRight,
  Repeat,
} from "lucide-react";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
const PLACEHOLDER_IMAGE = `${API_URL}/images/placeholder.png`;

// Hàm xử lý URL ảnh
const getImageUrl = (imageUrl) => {
  if (!imageUrl) return PLACEHOLDER_IMAGE;
  if (imageUrl.startsWith("http")) return imageUrl;
  if (imageUrl.startsWith("/uploads")) return `${API_URL}${imageUrl}`;
  return `${API_URL}/${imageUrl}`.replace(/\/\//g, "/");
};

// Hàm format giá
const formatPrice = (price) => {
  if (!price) return "Liên hệ";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

// Hàm format ngày tháng
const formatDate = (dateString) => {
  if (!dateString) return "";
  const options = { day: "numeric", month: "long", year: "numeric" };
  return new Date(dateString).toLocaleDateString("vi-VN", options);
};

// eslint-disable-next-line no-unused-vars
const formatTime = (timeString) => {
  if (!timeString) return "";
  return new Date(timeString).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Hiển thị thẻ loại dịch vụ
const ServiceTypeTag = ({ type, className = "" }) => {
  const getTypeLabel = () => {
    switch (type) {
      case "tour":
        return "Tour";
      case "hotel":
        return "Khách sạn";
      case "flight":
        return "Chuyến bay";
      case "transport":
        return "Phương tiện";
      case "blog":
        return "Bài viết";
      default:
        return type || "Dịch vụ";
    }
  };

  const getTypeColor = () => {
    switch (type) {
      case "tour":
        return "bg-emerald-50 text-emerald-700";
      case "hotel":
        return "bg-blue-50 text-blue-700";
      case "flight":
        return "bg-indigo-50 text-indigo-700";
      case "transport":
        return "bg-orange-50 text-orange-700";
      case "blog":
        return "bg-purple-50 text-purple-700";
      default:
        return "bg-gray-50 text-gray-700";
    }
  };

  return (
    <span
      className={`text-xs uppercase px-2 py-1 rounded-full font-bold ${getTypeColor()} ${className} shadow-sm transition-all duration-300 hover:shadow-md`}
    >
      {getTypeLabel()}
    </span>
  );
};

// Hiển thị thẻ loại chuyến đi (cho flights và transport)
const TripTypeTag = ({ tripType }) => {
  const getTripTypeLabel = () => {
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

  const getTripTypeIcon = () => {
    switch (tripType) {
      case "round_trip":
        return <Repeat className="w-4 h-4 mr-1" />;
      case "multi_city":
        return <ArrowRight className="w-4 h-4 mr-1" />;
      default:
        return <ArrowRight className="w-4 h-4 mr-1" />;
    }
  };

  const getTripTypeColor = () => {
    switch (tripType) {
      case "round_trip":
        return "bg-blue-600";
      case "multi_city":
        return "bg-purple-600";
      default:
        return "bg-indigo-600";
    }
  };

  return (
    <div
      className={`absolute top-0 right-0 ${getTripTypeColor()} text-white px-3 py-1 rounded-bl-lg font-medium flex items-center shadow-md z-10 transition-transform duration-300 hover:scale-105`}
    >
      {getTripTypeIcon()}
      {getTripTypeLabel()}
    </div>
  );
};

// Hàm tính số ngày còn lại của khuyến mãi
const getDaysRemaining = (endDate) => {
  if (!endDate) return null;
  const daysRemaining = Math.ceil(
    (new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24)
  );
  return daysRemaining > 0 ? daysRemaining : 0;
};

// Hiển thị thẻ khuyến mãi
const PromotionTag = ({ promotion }) => {
  if (!promotion) return null;

  const discountLabel =
    promotion.type === "percentage"
      ? `-${promotion.discount}%`
      : `-${formatPrice(promotion.discount)}`;

  // Tính số ngày còn lại
  const daysRemaining = getDaysRemaining(promotion.endDate);

  return (
    <div className="absolute top-0 left-0 z-10">
      <div className="bg-red-600 text-white rounded-br-lg font-medium overflow-hidden shadow-lg animate-pulse-slow">
        <div className="px-3 py-1 flex items-center">
          <Tag className="w-3 h-3 mr-1" />
          {discountLabel}
        </div>
      </div>

      {daysRemaining !== null && daysRemaining > 0 && (
        <div className="text-xs bg-yellow-300 px-2 py-0.5 text-center mt-1 rounded-sm font-medium shadow-md transition-all duration-300 hover:bg-yellow-400">
          Còn {daysRemaining} ngày
        </div>
      )}
    </div>
  );
};

// Hiển thị tag địa điểm
const LocationTag = ({ location }) => {
  if (!location) return null;

  return (
    <div className="absolute top-0 right-0 bg-emerald-600 text-white px-3 py-1 rounded-bl-lg font-medium flex items-center z-10 shadow-md transition-transform duration-300 hover:scale-105">
      <MapPin className="w-3 h-3 mr-1" />
      <span className="text-sm">{location}</span>
    </div>
  );
};

// Hiển thị giá và khuyến mãi
const PriceDisplay = ({ originalPrice, discountedPrice, promotion }) => {
  return (
    <div className="grid grid-cols-2 gap-2 mb-3">
      <div className="text-gray-800 font-semibold">
        {promotion ? (
          <>
            <div className="text-xs text-gray-500">Giá gốc</div>
            <span className="line-through text-gray-500 text-sm">
              {formatPrice(originalPrice)}
            </span>
          </>
        ) : (
          <div className="text-xs text-gray-500">&nbsp;</div>
        )}
      </div>
      <div className="text-right">
        <div className="text-xs text-gray-500">
          {promotion ? "Giảm còn" : "Giá"}
        </div>
        <span className="text-red-600 font-bold transition-colors duration-300 hover:text-red-700">
          {formatPrice(discountedPrice || originalPrice)}
        </span>
      </div>
    </div>
  );
};

// Hiển thị đánh giá
const RatingDisplay = ({ rating, reviewCount }) => {
  if (!rating) return null;

  return (
    <div className="flex items-center group">
      <Star className="w-4 h-4 text-yellow-400 fill-current group-hover:scale-110 transition-transform duration-300" />
      <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>
      {reviewCount > 0 && (
        <span className="text-xs text-gray-500 ml-1 group-hover:text-gray-700 transition-colors duration-300">
          ({reviewCount} đánh giá)
        </span>
      )}
    </div>
  );
};

// eslint-disable-next-line no-unused-vars
const TimeDisplay = ({
  duration,
  departureTime,
  arrivalTime,
  showDuration = true,
  showDate = true,
}) => {
  const formatDuration = (minutes) => {
    if (!minutes) return "Không xác định";
    const days = Math.floor(minutes / (60 * 24));
    const hours = Math.floor((minutes % (60 * 24)) / 60);
    const mins = minutes % 60;

    if (days > 0) {
      return `${days} ngày${hours > 0 ? ` ${hours}h` : ""}`;
    }
    return `${hours}h ${mins > 0 ? `${mins}m` : ""}`;
  };

  return (
    <div className="flex flex-wrap gap-2 text-xs text-gray-500">
      {showDuration && duration && (
        <div className="flex items-center group hover:bg-gray-100 px-1 py-0.5 rounded transition-colors duration-300">
          <Clock className="w-3 h-3 mr-1 flex-shrink-0 group-hover:text-emerald-600 transition-colors duration-300" />
          <span className="group-hover:text-gray-700 transition-colors duration-300">
            {formatDuration(duration)}
          </span>
        </div>
      )}
      {showDate && departureTime && (
        <div className="flex items-center group hover:bg-gray-100 px-1 py-0.5 rounded transition-colors duration-300">
          <Calendar className="w-3 h-3 mr-1 flex-shrink-0 group-hover:text-emerald-600 transition-colors duration-300" />
          <span className="group-hover:text-gray-700 transition-colors duration-300">
            {formatDate(departureTime)}
          </span>
        </div>
      )}
    </div>
  );
};

const ServiceCard = ({
  id,
  type,
  image,
  title,
  description,
  location,
  price,
  rating,
  reviewCount,
  duration,
  groupSize,
  departureTime,
  arrivalTime,
  fromLocation,
  toLocation,
  promotion,
  tripType,
  icon: Icon,
  onClick,
  actionButtonText = "Đặt ngay",
  renderCustomTypeTag,
  renderAdditionalFeatures,
}) => {
  const handleClick = () => {
    if (onClick) onClick(id);
  };

  // Tính giá sau khuyến mãi nếu có
  const calculateDiscountedPrice = () => {
    if (!promotion) return price;

    return promotion.type === "percentage"
      ? price - (price * promotion.discount) / 100
      : price - promotion.discount;
  };

  const discountedPrice = calculateDiscountedPrice();

  return (
    <div
      className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col h-full transform hover:-translate-y-1"
      onClick={handleClick}
    >
      <div className="relative">
        <img
          src={getImageUrl(image)}
          alt={title}
          className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = PLACEHOLDER_IMAGE;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>

        {/* Tag khuyến mãi */}
        {promotion && <PromotionTag promotion={promotion} />}

        {/* Tag loại dịch vụ - hoặc tag tùy chỉnh nếu được cung cấp */}
        <div className="absolute bottom-0 left-0 px-3 py-1 rounded-tr-lg font-medium flex items-center z-10">
          {renderCustomTypeTag ? (
            renderCustomTypeTag()
          ) : (
            <ServiceTypeTag type={type} />
          )}
        </div>

        {/* Tag địa điểm */}
        {location && type === "tour" && <LocationTag location={location} />}

        {/* Tag loại chuyến đi */}
        {(type === "flight" || type === "transport") && tripType && (
          <TripTypeTag tripType={tripType} />
        )}
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <div className="text-lg font-semibold line-clamp-2 h-10 group-hover:text-emerald-600 transition-colors duration-300">
          {title}
        </div>

        <div className="flex items-center justify-between mb-2">
          {/* Hiển thị đánh giá */}
          <RatingDisplay rating={rating} reviewCount={reviewCount} />

          {/* Hiển thị thời lượng và số người */}
          <div className="flex flex-row-reverse gap-2 text-xs text-gray-500">
            {groupSize && (
              <div className="flex items-center group hover:bg-gray-100 px-1 py-0.5 rounded transition-colors duration-300">
                <User className="w-3 h-3 mr-1 flex-shrink-0 group-hover:text-emerald-600 transition-colors duration-300" />
                <span className="group-hover:text-gray-700 transition-colors duration-300">
                  {groupSize}
                </span>
              </div>
            )}
            {duration && (
              <div className="flex items-center group hover:bg-gray-100 px-1 py-0.5 rounded transition-colors duration-300">
                <Clock className="w-3 h-3 mr-1 flex-shrink-0 group-hover:text-emerald-600 transition-colors duration-300" />
                <span className="group-hover:text-gray-700 transition-colors duration-300">
                  {type === "tour"
                    ? (() => {
                        const days = Math.floor(duration / (60 * 24));
                        const hours = Math.floor((duration % (60 * 24)) / 60);
                        if (days > 0) return `${days} ngày`;
                        return `${hours} giờ`;
                      })()
                    : `${Math.floor(duration / 60)}h ${duration % 60}m`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Hiển thị thông tin chuyến bay hoặc vận chuyển */}
        {(type === "flight" || type === "transport") &&
          fromLocation &&
          toLocation && (
            <div className="flex items-center justify-between mb-2 bg-gray-50 hover:bg-gray-100 rounded-lg p-2 transition-colors duration-300 group">
              <div>
                <p className="text-gray-500 text-xs">Từ</p>
                <p className="font-medium text-sm group-hover:text-emerald-600 transition-colors duration-300">
                  {fromLocation}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 transition-colors duration-300 animate-pulse-slow" />
              <div className="text-right">
                <p className="text-gray-500 text-xs">Đến</p>
                <p className="font-medium text-sm group-hover:text-emerald-600 transition-colors duration-300">
                  {toLocation}
                </p>
              </div>
            </div>
          )}

        {/* Hiển thị mô tả ngắn */}
        {description !== null && (
          <div className="text-gray-600 text-sm line-clamp-3 h-14 hover:text-gray-800 transition-colors duration-300">
            <p>
              {description ||
                `${
                  type === "tour"
                    ? "Khám phá vẻ đẹp của Việt Nam với tour du lịch hấp dẫn này."
                    : type === "hotel"
                    ? "Khách sạn cao cấp với đầy đủ tiện nghi, dịch vụ chất lượng cao."
                    : "Dịch vụ chất lượng với giá tốt nhất."
                }`}
            </p>
          </div>
        )}

        {/* Hiển thị tiện ích bổ sung nếu có */}
        {renderAdditionalFeatures && renderAdditionalFeatures()}

        <div className="mt-auto">
          {/* Hiển thị giá */}
          <PriceDisplay
            originalPrice={price}
            discountedPrice={discountedPrice}
            promotion={promotion}
          />

          {/* Nút hành động */}
          <Link
            to={`/${type}s/${id}`}
            className="block w-full text-center bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white py-2 rounded-lg transition-all duration-300 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0"
          >
            {actionButtonText}
          </Link>
        </div>
      </div>
    </div>
  );
};

// Định nghĩa keyframes cho animation
if (typeof document !== "undefined") {
  // Thêm animation cho pulse-slow
  const style = document.createElement("style");
  style.textContent = `
    @keyframes pulse-slow {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.8; }
    }
    .animate-pulse-slow {
      animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
  `;
  document.head.appendChild(style);
}

export default ServiceCard;
