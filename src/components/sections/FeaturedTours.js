import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import /* MapPin, Users, Star - unused */ "lucide-react";
import SectionContainer from "../common/SectionContainer";
import ServiceCard from "../common/ServiceCard";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const FeaturedTours = () => {
  const navigate = useNavigate();
  const [tours, setTours] = useState([]);
  const [promotions, setPromotions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);

        let toursResponse;
        let promotionsResponse;

        try {
          // Tải danh sách tour nổi bật
          toursResponse = await axios.get(`${API_URL}/api/tours/featured`);
        } catch (featuredError) {
          // Fallback: lấy tours thông thường với limit
          toursResponse = await axios.get(
            `${API_URL}/api/tours?limit=4&sort_by=rating&sort_order=desc`
          );
        }

        try {
          // Tải danh sách khuyến mãi (không bắt buộc)
          promotionsResponse = await axios.get(
            `${API_URL}/api/promotions/services`
          );
        } catch (promoError) {
          promotionsResponse = { data: [] };
        }

        // Xử lý dữ liệu tours
        if (
          toursResponse.data &&
          Array.isArray(toursResponse.data) &&
          toursResponse.data.length > 0
        ) {
          setTours(toursResponse.data);
        } else if (toursResponse.data && !Array.isArray(toursResponse.data)) {
          setError("Định dạng dữ liệu tour không đúng.");
          return;
        } else {
          setTours([]);
        }

        // Xử lý dữ liệu khuyến mãi và lưu vào state dưới dạng object với key là id của dịch vụ
        if (
          promotionsResponse.data &&
          Array.isArray(promotionsResponse.data) &&
          promotionsResponse.data.length > 0
        ) {
          const promoMap = {};
          promotionsResponse.data.forEach((promo) => {
            if (promo.type === "tour") {
              promoMap[promo.id] = {
                discount: promo.promotion.discount,
                type: promo.promotion.type,
                endDate: promo.promotion.end_date,
              };
            }
          });

          setPromotions(promoMap);
        } else {
          setPromotions({});
        }
      } catch (err) {
        console.error("[ERROR] Lỗi khi tải dữ liệu tour:", err);
        setError("Đã xảy ra lỗi khi tải dữ liệu tour. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleTourClick = (id) => {
    navigate(`/tours/${id}`);
  };

  return (
    <SectionContainer
      title="Tour Nổi Bật"
      viewAllLink="/tours"
      loading={loading}
      error={error}
      bgColor="bg-gray-50"
    >
      {tours.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tours.map((tour) => (
            <ServiceCard
              key={tour.id}
              id={tour.id}
              type="tour"
              image={tour.image}
              title={tour.title}
              description={tour.description}
              location={tour.location}
              price={tour.price}
              rating={tour.rating}
              reviewCount={tour.review_count}
              duration={tour.duration}
              groupSize={tour.group_size}
              promotion={promotions[tour.id]}
              onClick={handleTourClick}
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
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-lg font-medium text-gray-700">
              Chưa có tour nổi bật
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Hệ thống đang cập nhật dữ liệu tour mới
            </p>
          </div>
        </div>
      ) : null}
    </SectionContainer>
  );
};

export default FeaturedTours;
