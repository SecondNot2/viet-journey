import React from "react";
import { useNavigate } from "react-router-dom";

const colorStyles = {
  blue: {
    bg: "from-blue-600 to-blue-400",
    text: "text-blue-100",
  },
  green: {
    bg: "from-green-600 to-emerald-400",
    text: "text-green-100",
  },
  orange: {
    bg: "from-orange-500 to-amber-400",
    text: "text-orange-100",
  },
  default: {
    bg: "from-gray-600 to-gray-400",
    text: "text-gray-100",
  },
};

const ServiceSuggestions = ({
  title = "Khám phá các dịch vụ khác",
  services = [],
  className = "",
}) => {
  const navigate = useNavigate();

  return (
    <div
      className={`container mx-auto px-4 py-12 border-t border-gray-200 ${className}`}
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {services.map((service) => {
          const style = colorStyles[service.color] || colorStyles.default;
          // Icon component passed as prop (e.g. Hotel, Map, Bus)
          const Icon = service.icon;

          return (
            <div
              key={service.id}
              className="group relative overflow-hidden rounded-2xl cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              onClick={() => navigate(service.path)}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${style.bg}`}
              ></div>
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
              <div className="relative p-8 text-white h-48 flex flex-col justify-between">
                <div className="bg-white/20 w-fit p-3 rounded-xl backdrop-blur-sm">
                  {Icon && <Icon size={32} />}
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-1">{service.title}</h3>
                  <p
                    className={`${style.text} text-sm group-hover:text-white transition-colors`}
                  >
                    {service.description}
                  </p>
                </div>
              </div>
              {/* Decoration */}
              {Icon && (
                <Icon className="absolute -bottom-4 -right-4 text-white/10 w-32 h-32 transform rotate-12 group-hover:scale-110 transition-transform duration-500" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ServiceSuggestions;
