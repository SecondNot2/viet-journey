import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plane } from "lucide-react";
import axios from "axios";
import SectionContainer from "../common/SectionContainer";
import ServiceCard from "../common/ServiceCard";
import EmptyState from "../common/EmptyState";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
const PLACEHOLDER_IMAGE = `${API_URL}/images/placeholder.png`;

// Tạo component riêng để hiển thị tag hãng hàng không thay vì tag loại dịch vụ
const AirlineTag = ({ airline, className = "" }) => {
  // Defensive check: fallback to 'Hãng bay' if airline is undefined/null
  const safeAirline = airline || "Hãng bay";
  const safeAirlineLower = safeAirline.toLowerCase();

  // Lấy màu dựa trên tên hãng
  const getAirlineColor = () => {
    switch (safeAirlineLower) {
      case "vietnam airlines":
        return "bg-blue-50 text-blue-700";
      case "vietjet air":
      case "vietjet":
        return "bg-red-50 text-red-700";
      case "bamboo airways":
      case "bamboo":
        return "bg-green-50 text-green-700";
      case "pacific airlines":
      case "pacific":
        return "bg-yellow-50 text-yellow-700";
      default:
        return "bg-indigo-50 text-indigo-700";
    }
  };

  return (
    <span
      className={`text-xs uppercase px-2 py-1 rounded-full font-bold ${getAirlineColor()} ${className}`}
    >
      {safeAirline}
    </span>
  );
};

const FeaturedFlights = () => {
  const navigate = useNavigate();
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [promotions, setPromotions] = useState({});

  // eslint-disable-next-line no-unused-vars
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return PLACEHOLDER_IMAGE;
    if (imageUrl.startsWith("http")) return imageUrl;
    return `${API_URL}${imageUrl}`;
  };

  // Hàm kiểm tra và lấy thông tin khuyến mãi
  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/promotions/services`);

        // Tạo map lưu trữ thông tin khuyến mãi theo dịch vụ
        const promoMap = {};
        if (response.data && response.data.length > 0) {
          response.data.forEach((item) => {
            if (item.type === "flight") {
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
    const fetchFlights = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/flights/featured`);

        if (!response.data || response.data.length === 0) {
          setFlights([]);
          setLoading(false);
          return;
        }

        // Backend now returns flat data, no need to map
        setFlights(response.data);
        setLoading(false);
      } catch (err) {
        console.error("[ERROR] Lỗi khi tải dữ liệu chuyến bay:", err);
        let errorMessage =
          "Không thể tải dữ liệu chuyến bay. Vui lòng thử lại sau.";

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

    fetchFlights();
  }, []);

  const handleFlightClick = (id) => {
    navigate(`/flights/${id}`);
  };

  if (loading) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center h-64">
            <div className="text-red-500 text-center">
              <p className="text-xl font-semibold mb-2">Đã có lỗi xảy ra</p>
              <p>{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
              >
                Thử lại
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <SectionContainer
      title="Chuyến Bay Nổi Bật"
      viewAllLink="/flights"
      loading={loading}
      error={error}
    >
      {flights.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {flights.map((flight) => (
            <ServiceCard
              key={flight.id}
              id={flight.id}
              type="flight"
              image={flight.airline_image}
              title={`${flight.airline} - ${flight.flight_number}`}
              description={null}
              price={flight.price}
              duration={flight.duration}
              departureTime={flight.departure_time}
              arrivalTime={flight.arrival_time}
              fromLocation={flight.from_location}
              toLocation={flight.to_location}
              promotion={promotions[flight.id]}
              tripType={flight.trip_type}
              icon={Plane}
              onClick={handleFlightClick}
              actionButtonText="Đặt ngay"
              renderCustomTypeTag={() => (
                <AirlineTag airline={flight.airline} />
              )}
            />
          ))}
        </div>
      ) : !loading && !error ? (
        <EmptyState
          icon={Plane}
          title="Chưa có chuyến bay nổi bật"
          description="Hệ thống đang cập nhật thông tin chuyến bay"
        />
      ) : null}
    </SectionContainer>
  );
};

export default FeaturedFlights;
