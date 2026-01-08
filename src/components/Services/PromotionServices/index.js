import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { API_URL, API_HOST } from "../../../config/api";
import {
  Tag,
  Star,
  Filter,
  ChevronRight,
  DollarSign,
  CalendarDays,
  Clock,
  Hotel,
  Plane,
  Bus,
  Users,
  MapPin,
  Search,
  ChevronDown,
  Plus,
} from "lucide-react";

const PLACEHOLDER_IMAGE = `${API_URL}/images/placeholder.png`;

const serviceTypeOptions = [
  { id: "all", label: "Tất cả dịch vụ" },
  { id: "tour", label: "Tour du lịch" },
  { id: "hotel", label: "Khách sạn" },
  { id: "flight", label: "Vé máy bay" },
  { id: "transport", label: "Xe đưa đón" },
];

const PromotionServices = () => {
  const [allServices, setAllServices] = useState([]); // Tất cả services từ API
  const [services, setServices] = useState([]); // Services sau khi filter và search
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    serviceType: "all",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    itemsPerPage: 8,
    currentPage: 1,
  });
  const [displayedServices, setDisplayedServices] = useState({});

  // Hàm nhóm dịch vụ theo loại
  const groupServicesByType = (services) => {
    const groups = {
      tour: [],
      hotel: [],
      flight: [],
      transport: [],
    };

    services.forEach((service) => {
      if (groups[service.type]) {
        groups[service.type].push(service);
      }
    });

    return groups;
  };

  // Hàm filter và search services
  const filterAndSearchServices = (services, searchTerm, serviceType) => {
    let filtered = [...services];

    // Filter theo service type
    if (serviceType && serviceType !== "all") {
      filtered = filtered.filter((service) => service.type === serviceType);
    }

    // Search theo tên, mô tả, location
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((service) => {
        const name = service.name || "";
        const description = service.description || "";
        const location = service.location || "";
        const airline = service.airline || "";
        const company = service.company || "";
        const fromLocation = service.from_location || "";
        const toLocation = service.to_location || "";

        return (
          name.toLowerCase().includes(searchLower) ||
          description.toLowerCase().includes(searchLower) ||
          location.toLowerCase().includes(searchLower) ||
          airline.toLowerCase().includes(searchLower) ||
          company.toLowerCase().includes(searchLower) ||
          fromLocation.toLowerCase().includes(searchLower) ||
          toLocation.toLowerCase().includes(searchLower)
        );
      });
    }

    return filtered;
  };

  // Hàm cập nhật displayed services với pagination
  const updateDisplayedServices = (filteredServices) => {
    const grouped = groupServicesByType(filteredServices);
    const newDisplayed = {};

    Object.keys(grouped).forEach((type) => {
      if (grouped[type].length > 0) {
        newDisplayed[type] = grouped[type].slice(0, pagination.itemsPerPage);
      }
    });

    setDisplayedServices(newDisplayed);
  };

  // Hàm lấy danh sách dịch vụ đang khuyến mãi
  const fetchServices = async () => {
    setLoading(true);
    setError(null);
    try {
      let response;

      try {
        // Thử API global trước
        console.log(
          "[DEBUG] Đang thử lấy dữ liệu từ /api/promotions/global..."
        );
        response = await axios.get(`${API_URL}/api/promotions/global`);
      } catch (globalError) {
        console.log(
          "[DEBUG] API global lỗi, thử fallback sang /api/promotions/services..."
        );
        console.error(
          "[DEBUG] Global error:",
          globalError.response?.status,
          globalError.response?.data
        );

        try {
          // Fallback: thử API services
          response = await axios.get(`${API_URL}/api/promotions/services`);
        } catch (servicesError) {
          console.error(
            "[DEBUG] Services error:",
            servicesError.response?.status,
            servicesError.response?.data
          );
          throw servicesError;
        }
      }

      let filteredServices = response.data || [];

      console.log(
        `[DEBUG] Đã lấy ${filteredServices.length} dịch vụ khuyến mãi`
      );

      // Lọc dữ liệu ở phía client
      if (filters.serviceType && filters.serviceType !== "all") {
        filteredServices = filteredServices.filter(
          (service) => service.type === filters.serviceType
        );
        console.log(
          `[DEBUG] Sau khi lọc theo ${filters.serviceType}: ${filteredServices.length} dịch vụ`
        );
      }

      // Lưu tất cả services từ API
      setAllServices(response.data || []);
      setServices(filteredServices);
    } catch (err) {
      console.error("[ERROR] Lỗi khi tải dịch vụ khuyến mãi:", err);
      setError(
        err.response?.data?.error ||
          "Không thể tải danh sách dịch vụ. Vui lòng thử lại sau."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
    // eslint-disable-next-line
  }, []);

  // Effect để xử lý filter và search
  useEffect(() => {
    if (allServices.length > 0) {
      const filtered = filterAndSearchServices(
        allServices,
        searchTerm,
        filters.serviceType
      );
      setServices(filtered);
      updateDisplayedServices(filtered);
      // Reset pagination khi filter/search thay đổi
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
    }
    // eslint-disable-next-line
  }, [allServices, searchTerm, filters.serviceType, pagination.itemsPerPage]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleLoadMore = (serviceType) => {
    const grouped = groupServicesByType(services);
    const currentCount = displayedServices[serviceType]?.length || 0;
    const totalCount = grouped[serviceType]?.length || 0;
    const newCount = Math.min(
      currentCount + pagination.itemsPerPage,
      totalCount
    );

    setDisplayedServices((prev) => ({
      ...prev,
      [serviceType]: grouped[serviceType].slice(0, newCount),
    }));
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Thêm hàm format thời gian
  const formatTime = (timeString) => {
    return new Date(timeString).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getServiceLink = (service) => {
    switch (service.type) {
      case "tour":
        return `/tours/${service.id}`;
      case "hotel":
        return `/hotels/${service.id}`;
      case "flight":
        return `/flights/${service.id}`;
      case "transport":
        return `/transport/${service.id}`;
      default:
        return "#";
    }
  };

  const getServiceIcon = (type) => {
    switch (type) {
      case "tour":
        return <Users className="w-4 h-4" />;
      case "hotel":
        return <Hotel className="w-4 h-4" />;
      case "flight":
        return <Plane className="w-4 h-4" />;
      case "transport":
        return <Bus className="w-4 h-4" />;
      default:
        return null;
    }
  };

  // Hàm xử lý URL hình ảnh
  const getImageUrl = (imagePath) => {
    if (!imagePath) return PLACEHOLDER_IMAGE;
    if (imagePath.startsWith("http")) return imagePath;
    return `${API_URL}${imagePath}`;
  };

  const renderServiceCard = (service) => {
    // Card cho tour, hotel và flight
    if (
      service.type === "tour" ||
      service.type === "hotel" ||
      service.type === "flight" ||
      service.type === "transport"
    ) {
      const imageUrl = getImageUrl(service.image);

      return (
        <Link
          key={`${service.type}-${service.id}-${
            service.flight_number || service.name
          }`}
          to={getServiceLink(service)}
          className="bg-white rounded-3xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 block group border border-gray-100 hover:border-emerald-200"
        >
          {/* Phần hình ảnh */}
          <div className="relative w-full pb-[56.25%] overflow-hidden">
            <img
              src={imageUrl}
              alt={service.type === "flight" ? service.airline : service.name}
              className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
              onError={(e) => {
                console.log("Image load error:", imageUrl);
                e.target.onerror = null;
                e.target.src = PLACEHOLDER_IMAGE;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover:opacity-70 transition-opacity"></div>
            <div className="absolute top-4 right-4">
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg backdrop-blur-sm">
                <Tag className="w-3 h-3 mr-1" />
                {service.promotion.type === "percentage"
                  ? `Giảm ${service.promotion.discount}%`
                  : `Giảm ${formatPrice(service.promotion.discount)}`}
              </span>
            </div>
            {/* Service type badge */}
            <div className="absolute top-4 left-4">
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-white bg-opacity-90 text-gray-700 backdrop-blur-sm">
                {getServiceIcon(service.type)}
                <span className="ml-1.5">
                  {service.type === "tour"
                    ? "Tour"
                    : service.type === "hotel"
                    ? "Hotel"
                    : service.type === "flight"
                    ? "Flight"
                    : service.type === "transport"
                    ? "Transport"
                    : service.type}
                </span>
              </span>
            </div>
          </div>

          <div className="p-8">
            <div className="mb-4">
              <h3 className="font-bold text-xl text-gray-900 line-clamp-2 leading-tight mb-2">
                {service.type === "flight"
                  ? `${service.airline} - ${service.flight_number}`
                  : service.type === "transport"
                  ? `${service.company} - ${service.vehicle_type}`
                  : service.name}
              </h3>
              {service.location && (
                <div className="flex items-center text-gray-600 text-sm">
                  <MapPin className="w-4 h-4 mr-1.5" />
                  <span>{service.location}</span>
                </div>
              )}
            </div>
            {service.type === "flight" || service.type === "transport" ? (
              <>
                <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
                  <div>
                    <p className="font-medium">{service.from_location}</p>
                    <p className="text-xs">
                      {formatTime(service.departure_time)}
                    </p>
                  </div>
                  {service.type === "flight" ? (
                    <Plane className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Bus className="w-4 h-4 text-gray-400" />
                  )}
                  <div className="text-right">
                    <p className="font-medium">{service.to_location}</p>
                    <p className="text-xs">
                      {formatTime(service.arrival_time)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="text-gray-500">Thời gian di chuyển</span>
                  <span className="font-medium">
                    {(() => {
                      const durationInMinutes = Math.floor(
                        (new Date(service.arrival_time) -
                          new Date(service.departure_time)) /
                          (1000 * 60)
                      );
                      const hours = Math.floor(durationInMinutes / 60);
                      const minutes = durationInMinutes % 60;
                      return `${hours}h ${minutes}m`;
                    })()}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-gray-600 text-sm mb-4 line-clamp-2 h-10">
                {service.description}
              </div>
            )}
            <div className="border-t border-gray-100 pt-4 mt-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-gray-500 line-through text-sm mb-1">
                    {formatPrice(service.original_price)}
                  </div>
                  <div className="text-2xl font-bold text-emerald-600">
                    {formatPrice(service.discounted_price)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500 mb-1">Tiết kiệm</div>
                  <div className="text-lg font-bold text-red-500">
                    {formatPrice(
                      service.original_price - service.discounted_price
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center text-gray-500">
                  <CalendarDays className="w-4 h-4 mr-1.5" />
                  <span>Đến {formatDate(service.promotion.end_date)}</span>
                </div>
                <div className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                  Còn{" "}
                  {Math.ceil(
                    (new Date(service.promotion.end_date) - new Date()) /
                      (1000 * 60 * 60 * 24)
                  )}{" "}
                  ngày
                </div>
              </div>
            </div>
          </div>
        </Link>
      );
    }

    // Card cho transport với design mới
    return (
      <Link
        key={`${service.type}-${service.id}-${service.company || ""}`}
        to={getServiceLink(service)}
        className="bg-white rounded-3xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 block group border border-gray-100 hover:border-emerald-200"
      >
        {/* Phần hình ảnh */}
        <div className="relative w-full pb-[56.25%] overflow-hidden">
          <img
            src={
              service.transport_image
                ? `${API_URL}${service.transport_image}`
                : PLACEHOLDER_IMAGE
            }
            alt={`${service.company} - ${service.vehicle_type}`}
            className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = PLACEHOLDER_IMAGE;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover:opacity-70 transition-opacity"></div>
          <div className="absolute top-4 right-4">
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg backdrop-blur-sm">
              <Tag className="w-3 h-3 mr-1" />
              {service.promotion.type === "percentage"
                ? `Giảm ${service.promotion.discount}%`
                : `Giảm ${formatPrice(service.promotion.discount)}`}
            </span>
          </div>
          <div className="absolute top-4 left-4">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-white bg-opacity-90 text-gray-700 backdrop-blur-sm">
              <Bus className="w-4 h-4" />
              <span className="ml-1.5">Transport</span>
            </span>
          </div>
        </div>

        <div className="p-8">
          <div className="mb-4">
            <h3 className="font-bold text-xl text-gray-900 line-clamp-2 leading-tight mb-2">
              {`${service.company} - ${service.vehicle_type}`}
            </h3>
            <div className="flex items-center text-gray-600 text-sm">
              <MapPin className="w-4 h-4 mr-1.5" />
              <span>
                {service.from_location} → {service.to_location}
              </span>
            </div>
          </div>

          {/* Thông tin chuyến */}
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3 text-sm text-gray-600">
              <div>
                <p className="font-medium text-gray-900">
                  {service.from_location}
                </p>
                <p className="text-xs">{formatTime(service.departure_time)}</p>
              </div>
              <div className="flex items-center px-2">
                <div className="w-8 h-0.5 bg-gray-300"></div>
                <Bus className="w-4 h-4 text-gray-400 mx-2" />
                <div className="w-8 h-0.5 bg-gray-300"></div>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">
                  {service.to_location}
                </p>
                <p className="text-xs">{formatTime(service.arrival_time)}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-gray-500 text-xs mb-1">Thời gian</div>
                <div className="font-medium text-gray-900">
                  {(() => {
                    const durationInMinutes = Math.floor(
                      (new Date(service.arrival_time) -
                        new Date(service.departure_time)) /
                        (1000 * 60)
                    );
                    const hours = Math.floor(durationInMinutes / 60);
                    const minutes = durationInMinutes % 60;
                    return `${hours}h ${minutes}m`;
                  })()}
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-500 text-xs mb-1">Chỗ trống</div>
                <div className="font-medium text-gray-900">
                  {service.available_seats} chỗ
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-500 text-xs mb-1">Biển số</div>
                <div className="font-medium text-gray-900">
                  {service.vehicle_name}
                </div>
              </div>
            </div>
          </div>

          {/* Giá */}
          <div className="border-t border-gray-100 pt-4 mt-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-gray-500 line-through text-sm mb-1">
                  {formatPrice(service.original_price)}
                </div>
                <div className="text-2xl font-bold text-emerald-600">
                  {formatPrice(service.discounted_price)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500 mb-1">Tiết kiệm</div>
                <div className="text-lg font-bold text-red-500">
                  {formatPrice(
                    service.original_price - service.discounted_price
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center text-gray-500">
                <CalendarDays className="w-4 h-4 mr-1.5" />
                <span>Đến {formatDate(service.promotion.end_date)}</span>
              </div>
              <div className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                Còn{" "}
                {Math.ceil(
                  (new Date(service.promotion.end_date) - new Date()) /
                    (1000 * 60 * 60 * 24)
                )}{" "}
                ngày
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  const renderServiceGroup = (services, type) => {
    if (!services || services.length === 0) return null;

    console.log(`Rendering ${type} group:`, services);

    const titles = {
      tour: "Tour Du Lịch",
      hotel: "Khách Sạn",
      flight: "Vé Máy Bay",
      transport: "Xe Đưa Đón",
    };

    const icons = {
      tour: <Users className="w-6 h-6" />,
      hotel: <Hotel className="w-6 h-6" />,
      flight: <Plane className="w-6 h-6" />,
      transport: <Bus className="w-6 h-6" />,
    };

    const colors = {
      tour: "from-emerald-500 to-emerald-600",
      hotel: "from-blue-500 to-blue-600",
      flight: "from-purple-500 to-purple-600",
      transport: "from-orange-500 to-orange-600",
    };

    const bgColors = {
      tour: "bg-emerald-50",
      hotel: "bg-blue-50",
      flight: "bg-purple-50",
      transport: "bg-orange-50",
    };

    // Get displayed and total services for this type
    const displayedServicesForType = displayedServices[type] || [];
    const allServicesForType = groupServicesByType(services)[type] || [];
    const hasMore = displayedServicesForType.length < allServicesForType.length;

    return (
      <div key={`group-${type}`} className="mb-16">
        <div className="relative mb-8">
          <div
            className={`absolute inset-0 ${bgColors[type]} rounded-3xl transform -rotate-1`}
          ></div>
          <div className="relative bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-2xl bg-gradient-to-br ${colors[type]} text-white shadow-lg`}
                >
                  {icons[type]}
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-1">
                    {titles[type]}
                  </h2>
                  <p className="text-gray-600">
                    Khuyến mãi đặc biệt dành cho bạn
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r ${colors[type]} text-white text-sm font-semibold shadow-lg`}
                >
                  <Tag className="w-4 h-4 mr-2" />
                  {allServicesForType.length} ưu đãi
                </div>
                {displayedServicesForType.length <
                  allServicesForType.length && (
                  <div className="text-sm text-gray-600 mt-2">
                    Hiển thị {displayedServicesForType.length} /{" "}
                    {allServicesForType.length}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayedServicesForType.map((service) =>
            renderServiceCard(service)
          )}
        </div>
        {hasMore && (
          <div className="text-center mt-8">
            <button
              onClick={() => handleLoadMore(type)}
              className={`inline-flex items-center px-8 py-4 bg-gradient-to-r ${colors[type]} text-white rounded-2xl hover:shadow-lg transition-all duration-300 font-semibold`}
            >
              <Plus className="w-5 h-5 mr-2" />
              Xem thêm{" "}
              {Math.min(
                pagination.itemsPerPage,
                allServicesForType.length - displayedServicesForType.length
              )}{" "}
              dịch vụ
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 py-20 overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-10"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-24 h-24 bg-white bg-opacity-10 rounded-full animate-pulse"></div>
          <div className="absolute top-32 right-20 w-16 h-16 bg-white bg-opacity-10 rounded-full animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/4 w-20 h-20 bg-white bg-opacity-10 rounded-full animate-pulse delay-2000"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-white bg-opacity-20 rounded-full text-emerald-100 text-sm font-medium mb-6 backdrop-blur-sm">
              <Tag className="w-4 h-4 mr-2" />
              Khuyến mãi đặc biệt
            </div>
            <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
              Dịch Vụ Đang Được
              <br />
              <span className="text-yellow-300">Khuyến Mãi</span>
            </h1>
            <p className="text-emerald-50 text-xl max-w-3xl mx-auto leading-relaxed">
              Khám phá hàng trăm dịch vụ du lịch đang được áp dụng khuyến mãi
              hấp dẫn. Từ tour du lịch, khách sạn đến vé máy bay - tất cả đều có
              giá ưu đãi.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4 text-emerald-100">
              <div className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                <span>Tiết kiệm đến 50%</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                <span>Ưu đãi có thời hạn</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-12">
        {/* Stats Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 backdrop-blur-sm border border-white border-opacity-20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {services.filter((s) => s.type === "tour").length}
              </div>
              <div className="text-sm text-gray-600">Tour du lịch</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Hotel className="w-8 h-8 text-white" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {services.filter((s) => s.type === "hotel").length}
              </div>
              <div className="text-sm text-gray-600">Khách sạn</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Plane className="w-8 h-8 text-white" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {services.filter((s) => s.type === "flight").length}
              </div>
              <div className="text-sm text-gray-600">Vé máy bay</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Bus className="w-8 h-8 text-white" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {services.filter((s) => s.type === "transport").length}
              </div>
              <div className="text-sm text-gray-600">Xe đưa đón</div>
            </div>
          </div>

          {/* Search Box */}
          <div className="border-t border-gray-100 pt-6 mb-6">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-4">
              <Search className="w-4 h-4 text-gray-400" />
              Tìm kiếm dịch vụ
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Nhập tên dịch vụ, địa điểm, hãng hàng không..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-12 pr-4 py-4 text-base border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 flex items-center justify-center"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-4">
              <Filter className="w-4 h-4 text-gray-400" />
              Lọc theo loại dịch vụ
            </label>
            <div className="flex flex-wrap gap-2">
              {serviceTypeOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() =>
                    setFilters({ ...filters, serviceType: option.id })
                  }
                  className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    filters.serviceType === option.id
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Danh sách dịch vụ */}
        {loading ? (
          <div className="flex flex-col justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-emerald-600 mb-4"></div>
            <p className="text-gray-600 text-lg">
              Đang tải dữ liệu khuyến mãi...
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Vui lòng đợi trong giây lát
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-12 h-12 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Đã xảy ra lỗi
            </h3>
            <p className="text-red-600 text-lg mb-6 max-w-md mx-auto">
              {error}
            </p>
            <button
              onClick={fetchServices}
              className="inline-flex items-center px-8 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium shadow-lg hover:shadow-xl"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Thử lại
            </button>
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Tag className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Chưa có khuyến mãi
            </h3>
            <p className="text-gray-600 text-lg mb-6 max-w-md mx-auto">
              {filters.serviceType === "all"
                ? "Hiện tại không có dịch vụ nào đang được khuyến mãi."
                : `Không có ${serviceTypeOptions
                    .find((opt) => opt.id === filters.serviceType)
                    ?.label?.toLowerCase()} nào đang được khuyến mãi.`}
            </p>
            <button
              onClick={() => setFilters({ serviceType: "all" })}
              className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            >
              Xem tất cả dịch vụ
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Search Results Info */}
            {(searchTerm || filters.serviceType !== "all") && (
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Kết quả tìm kiếm
                    </h3>
                    <p className="text-gray-600">
                      {searchTerm && `Từ khóa: "${searchTerm}"`}
                      {searchTerm && filters.serviceType !== "all" && " • "}
                      {filters.serviceType !== "all" &&
                        `Loại: ${
                          serviceTypeOptions.find(
                            (opt) => opt.id === filters.serviceType
                          )?.label
                        }`}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-emerald-600 mb-1">
                      {services.length}
                    </div>
                    <div className="text-sm text-gray-500">dịch vụ</div>
                  </div>
                </div>
                {(searchTerm || filters.serviceType !== "all") && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setFilters({ serviceType: "all" });
                    }}
                    className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    Xóa bộ lọc
                  </button>
                )}
              </div>
            )}

            {filters.serviceType === "all" ? (
              // Hiển thị theo nhóm khi không lọc
              Object.entries(displayedServices).map(
                ([type, groupServices]) =>
                  groupServices.length > 0 && renderServiceGroup(services, type)
              )
            ) : (
              // Hiển thị danh sách khi đã lọc với header
              <div>
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {
                      serviceTypeOptions.find(
                        (opt) => opt.id === filters.serviceType
                      )?.label
                    }
                  </h2>
                  <p className="text-gray-600">
                    Tìm thấy {services.length} dịch vụ đang được khuyến mãi
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {(displayedServices[filters.serviceType] || []).map(
                    (service) => renderServiceCard(service)
                  )}
                </div>
                {/* Load More button for filtered view */}
                {(() => {
                  const totalForType =
                    groupServicesByType(services)[filters.serviceType]
                      ?.length || 0;
                  const displayedForType =
                    displayedServices[filters.serviceType]?.length || 0;
                  const hasMore = displayedForType < totalForType;

                  if (hasMore) {
                    const colors = {
                      tour: "from-emerald-500 to-emerald-600",
                      hotel: "from-blue-500 to-blue-600",
                      flight: "from-purple-500 to-purple-600",
                      transport: "from-orange-500 to-orange-600",
                    };

                    return (
                      <div className="text-center mt-8">
                        <button
                          onClick={() => handleLoadMore(filters.serviceType)}
                          className={`inline-flex items-center px-8 py-4 bg-gradient-to-r ${
                            colors[filters.serviceType] || colors.tour
                          } text-white rounded-2xl hover:shadow-lg transition-all duration-300 font-semibold`}
                        >
                          <Plus className="w-5 h-5 mr-2" />
                          Xem thêm{" "}
                          {Math.min(
                            pagination.itemsPerPage,
                            totalForType - displayedForType
                          )}{" "}
                          dịch vụ
                        </button>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PromotionServices;
