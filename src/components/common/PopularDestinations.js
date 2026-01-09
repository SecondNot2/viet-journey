import React from "react";
import { useNavigate } from "react-router-dom";
import { formatPrice } from "../../utils/formatters";

const PopularDestinations = ({
  title = "Điểm đến phổ biến",
  destinations = [],
  loading = false,
  className = "",
}) => {
  const navigate = useNavigate();

  return (
    <div className={`container mx-auto px-4 py-12 ${className}`}>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{title}</h2>
      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {destinations.map((dest) => (
            <div
              key={dest.id}
              className="relative group overflow-hidden rounded-lg cursor-pointer"
              onClick={() => navigate(`/destinations/${dest.id}`)}
            >
              <img
                src={dest.main_image || dest.image}
                alt={dest.name}
                className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/images/placeholder.png";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {dest.name}
                  </h3>
                  <p className="text-white/80">
                    {dest.ticket_price
                      ? `Từ ${formatPrice(dest.ticket_price)}`
                      : "Miễn phí tham quan"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PopularDestinations;
