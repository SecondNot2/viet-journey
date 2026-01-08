import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API_URL, API_HOST } from "../../config/api";
import {
  MapPin,
  Users,
  Star,
  Search,
  Filter,
  ChevronDown,
  Tag,
  Compass,
  DollarSign,
  CalendarDays,
  ChevronRight,
  Clock,
  Leaf,
  UtensilsCrossed,
  Landmark,
  Mountain,
  Building,
  Heart,
  User,
} from "lucide-react";

const PLACEHOLDER_IMAGE = `${API_URL}/images/placeholder.png`;

const typeOptions = [
  { id: "all", label: "Tất cả loại hình", icon: Tag },
  { id: "nature", label: "Thiên nhiên", icon: Leaf },
  { id: "culture", label: "Văn hóa", icon: Landmark },
  { id: "food", label: "Ẩm thực", icon: UtensilsCrossed },
  { id: "adventure", label: "Mạo hiểm", icon: Mountain },
  { id: "city", label: "Đô thị", icon: Building },
];

const seasonOptions = [
  { id: "all", label: "Tất cả mùa" },
  { id: "spring", label: "Mùa xuân (Tháng 1-3)" },
  { id: "summer", label: "Mùa hè (Tháng 4-6)" },
  { id: "autumn", label: "Mùa thu (Tháng 7-9)" },
  { id: "winter", label: "Mùa đông (Tháng 10-12)" },
];

const durationOptions = [
  { id: "all", label: "Tất cả thời gian" },
  { id: "0-3", label: "Dưới 3 giờ" },
  { id: "3-6", label: "3-6 giờ" },
  { id: "6-12", label: "6-12 giờ" },
  { id: "12", label: "Trên 12 giờ" },
];

const popularityOptions = [
  { id: "all", label: "Tất cả" },
  { id: "trending", label: "Đang hot" },
  { id: "new", label: "Mới" },
  { id: "popular", label: "Phổ biến" },
];

const Destinations = () => {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState({
    region: "all",
    type: "all",
    priceRange: "all",
    rating: "all",
    season: "all",
    duration: "all",
    popularity: "all",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Hàm xử lý URL ảnh
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return `${API_URL}/images/placeholder.png`;
    if (imageUrl.startsWith("http")) return imageUrl;
    // Đảm bảo đường dẫn bắt đầu bằng /
    const cleanPath = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
    return `${API_URL}${cleanPath}`;
  };

  // Hàm format giá
  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/api/destinations`, {
          params: {
            region: selectedFilters.region,
            type: selectedFilters.type,
            rating: selectedFilters.rating,
            price_range: selectedFilters.priceRange,
          },
        });

        if (!response.data || response.data.length === 0) {
          setError("Không tìm thấy điểm đến nào.");
          setDestinations([]);
          setLoading(false);
          return;
        }

        // Apply client-side filters for season, duration, popularity, search
        let filteredData = response.data;

        // Filter by search query
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          filteredData = filteredData.filter(
            (dest) =>
              dest.name?.toLowerCase().includes(query) ||
              dest.description?.toLowerCase().includes(query) ||
              dest.location?.toLowerCase().includes(query)
          );
        }

        // Filter by season (based on best_time_to_visit)
        if (selectedFilters.season !== "all") {
          const seasonMonths = {
            spring: ["1", "2", "3", "tháng 1", "tháng 2", "tháng 3", "xuân"],
            summer: ["4", "5", "6", "tháng 4", "tháng 5", "tháng 6", "hè"],
            autumn: ["7", "8", "9", "tháng 7", "tháng 8", "tháng 9", "thu"],
            winter: [
              "10",
              "11",
              "12",
              "tháng 10",
              "tháng 11",
              "tháng 12",
              "đông",
            ],
          };

          filteredData = filteredData.filter((dest) => {
            if (!dest.best_time_to_visit) return true;
            const bestTime = dest.best_time_to_visit.toLowerCase();
            return seasonMonths[selectedFilters.season].some((month) =>
              bestTime.includes(month.toLowerCase())
            );
          });
        }

        // Filter by duration (based on open/close time)
        if (selectedFilters.duration !== "all") {
          filteredData = filteredData.filter((dest) => {
            if (!dest.open_time || !dest.close_time) return true;

            const openHour = parseInt(dest.open_time.split(":")[0]);
            const closeHour = parseInt(dest.close_time.split(":")[0]);
            let duration = closeHour - openHour;
            if (duration < 0) duration += 24;

            if (selectedFilters.duration === "0-3") {
              return duration < 3;
            } else if (selectedFilters.duration === "3-6") {
              return duration >= 3 && duration < 6;
            } else if (selectedFilters.duration === "6-12") {
              return duration >= 6 && duration < 12;
            } else if (selectedFilters.duration === "12") {
              return duration >= 12;
            }
            return true;
          });
        }

        // Filter by popularity (based on rating and rating_count)
        if (selectedFilters.popularity !== "all") {
          if (selectedFilters.popularity === "trending") {
            // Trending: high rating + recent
            filteredData = filteredData.filter(
              (dest) => dest.rating >= 4.0 && dest.rating_count >= 5
            );
            filteredData.sort(
              (a, b) => new Date(b.created_at) - new Date(a.created_at)
            );
          } else if (selectedFilters.popularity === "new") {
            // New: created recently
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
            filteredData = filteredData.filter(
              (dest) => new Date(dest.created_at) >= threeMonthsAgo
            );
          } else if (selectedFilters.popularity === "popular") {
            // Popular: high rating count
            filteredData = filteredData.filter(
              (dest) => dest.rating_count >= 10
            );
            filteredData.sort((a, b) => b.rating_count - a.rating_count);
          }
        }

        setDestinations(filteredData);
        setCurrentPage(1); // Reset to first page when filters change
        setError(
          filteredData.length === 0 ? "Không tìm thấy điểm đến nào." : null
        );
      } catch (err) {
        console.error("Error fetching destinations:", err);
        setError(
          err.response?.data?.error ||
            "Đã có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại sau."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDestinations();
  }, [selectedFilters, searchQuery]);

  const clearFilters = () => {
    setSelectedFilters({
      region: "all",
      type: "all",
      priceRange: "all",
      rating: "all",
      season: "all",
      duration: "all",
      popularity: "all",
    });
    setSearchQuery("");
  };

  // Pagination logic
  const totalPages = Math.ceil(destinations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDestinations = destinations.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section - Similar to BlogList */}
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
              <Compass className="w-4 h-4 mr-2" />
              Khám phá điểm đến
            </div>
            <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
              Điểm Đến Du Lịch
              <br />
              <span className="text-yellow-300">Việt Nam</span>
            </h1>
            <p className="text-emerald-50 text-xl max-w-3xl mx-auto leading-relaxed">
              Khám phá vẻ đẹp đa dạng của Việt Nam qua các điểm đến hấp dẫn. Từ
              di sản văn hóa thế giới đến thiên nhiên tuyệt vời, mỗi nơi đều
              mang đến những trải nghiệm khó quên.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4 text-emerald-100">
              <div className="flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                <span>Đa dạng điểm đến</span>
              </div>
              <div className="flex items-center">
                <Star className="w-5 h-5 mr-2" />
                <span>Chất lượng đảm bảo</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-12 mb-8">
        {/* Filters Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 backdrop-blur-sm border border-white border-opacity-20">
          {/* Search Bar */}
          <div className="border-b border-gray-100 pb-6 mb-6">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-4">
              <Search className="w-4 h-4 text-gray-400" />
              Tìm kiếm điểm đến
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Nhập tên điểm đến, địa điểm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 text-base border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 flex items-center justify-center"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Main Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Region Filter */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Compass className="w-4 h-4 text-gray-400" />
                Khu vực
              </label>
              <div className="relative">
                <select
                  value={selectedFilters.region}
                  onChange={(e) =>
                    setSelectedFilters({
                      ...selectedFilters,
                      region: e.target.value,
                    })
                  }
                  className="w-full p-3 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none bg-white hover:border-emerald-500 transition-colors"
                >
                  <option value="all">Tất cả khu vực</option>
                  <option value="north">Miền Bắc</option>
                  <option value="central">Miền Trung</option>
                  <option value="south">Miền Nam</option>
                </select>
                <ChevronRight className="absolute right-3 top-1/2 transform -translate-y-1/2 rotate-90 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Tag className="w-4 h-4 text-gray-400" />
                Loại hình
              </label>
              <div className="relative">
                <select
                  value={selectedFilters.type}
                  onChange={(e) =>
                    setSelectedFilters({
                      ...selectedFilters,
                      type: e.target.value,
                    })
                  }
                  className="w-full p-3 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none bg-white hover:border-emerald-500 transition-colors"
                >
                  {typeOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronRight className="absolute right-3 top-1/2 transform -translate-y-1/2 rotate-90 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Rating Filter */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Star className="w-4 h-4 text-gray-400" />
                Đánh giá
              </label>
              <div className="relative">
                <select
                  value={selectedFilters.rating}
                  onChange={(e) =>
                    setSelectedFilters({
                      ...selectedFilters,
                      rating: e.target.value,
                    })
                  }
                  className="w-full p-3 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none bg-white hover:border-emerald-500 transition-colors"
                >
                  <option value="all">Tất cả đánh giá</option>
                  <option value="4.5">Từ 4.5 sao</option>
                  <option value="4.0">Từ 4.0 sao</option>
                  <option value="3.5">Từ 3.5 sao</option>
                </select>
                <ChevronRight className="absolute right-3 top-1/2 transform -translate-y-1/2 rotate-90 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Advanced Filters Toggle */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-4">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              <Filter className="w-4 h-4" />
              {showAdvancedFilters
                ? "Ẩn bộ lọc nâng cao"
                : "Hiện bộ lọc nâng cao"}
            </button>
            <button
              onClick={clearFilters}
              className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              Xóa bộ lọc
            </button>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6 pt-6 border-t border-gray-100">
              {/* Price Range Filter */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  Mức giá
                </label>
                <div className="relative">
                  <select
                    value={selectedFilters.priceRange}
                    onChange={(e) =>
                      setSelectedFilters({
                        ...selectedFilters,
                        priceRange: e.target.value,
                      })
                    }
                    className="w-full p-3 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none bg-white hover:border-emerald-500 transition-colors"
                  >
                    <option value="all">Tất cả mức giá</option>
                    <option value="0-500000">Dưới 500.000đ</option>
                    <option value="500000-1000000">
                      500.000đ - 1.000.000đ
                    </option>
                    <option value="1000000-2000000">
                      1.000.000đ - 2.000.000đ
                    </option>
                    <option value="2000000">Trên 2.000.000đ</option>
                  </select>
                  <ChevronRight className="absolute right-3 top-1/2 transform -translate-y-1/2 rotate-90 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Season Filter */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <CalendarDays className="w-4 h-4 text-gray-400" />
                  Mùa du lịch
                </label>
                <div className="relative">
                  <select
                    value={selectedFilters.season}
                    onChange={(e) =>
                      setSelectedFilters({
                        ...selectedFilters,
                        season: e.target.value,
                      })
                    }
                    className="w-full p-3 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none bg-white hover:border-emerald-500 transition-colors"
                  >
                    {seasonOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronRight className="absolute right-3 top-1/2 transform -translate-y-1/2 rotate-90 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Duration Filter */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  Thời gian tham quan
                </label>
                <div className="relative">
                  <select
                    value={selectedFilters.duration}
                    onChange={(e) =>
                      setSelectedFilters({
                        ...selectedFilters,
                        duration: e.target.value,
                      })
                    }
                    className="w-full p-3 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none bg-white hover:border-emerald-500 transition-colors"
                  >
                    {durationOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronRight className="absolute right-3 top-1/2 transform -translate-y-1/2 rotate-90 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Popularity Filter */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Heart className="w-4 h-4 text-gray-400" />
                  Độ phổ biến
                </label>
                <div className="relative">
                  <select
                    value={selectedFilters.popularity}
                    onChange={(e) =>
                      setSelectedFilters({
                        ...selectedFilters,
                        popularity: e.target.value,
                      })
                    }
                    className="w-full p-3 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none bg-white hover:border-emerald-500 transition-colors"
                  >
                    {popularityOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronRight className="absolute right-3 top-1/2 transform -translate-y-1/2 rotate-90 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Search Results Info */}
        {(searchQuery ||
          Object.values(selectedFilters).some((v) => v !== "all")) && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Kết quả tìm kiếm
                </h3>
                <p className="text-gray-600">
                  {searchQuery && `Từ khóa: "${searchQuery}"`}
                  {searchQuery &&
                    Object.values(selectedFilters).some((v) => v !== "all") &&
                    " • "}
                  {Object.values(selectedFilters).some((v) => v !== "all") &&
                    "Có bộ lọc"}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-emerald-600 mb-1">
                  {destinations.length}
                </div>
                <div className="text-sm text-gray-500">điểm đến</div>
              </div>
            </div>
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              Xóa bộ lọc
            </button>
          </div>
        )}

        {error ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Compass className="w-12 h-12 text-red-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Có lỗi xảy ra
            </h3>
            <p className="text-gray-600 text-lg mb-6 max-w-md mx-auto">
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <>
            {/* Destinations Grid - 4 columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {currentDestinations.map((destination) => (
                <Link
                  key={destination.id}
                  to={`/destinations/${destination.id}`}
                  className="group bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 block"
                >
                  {/* Destination Image */}
                  <div className="relative h-48">
                    <img
                      src={getImageUrl(
                        destination.main_image || destination.image
                      )}
                      alt={destination.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `${API_URL}/images/placeholder.png`;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute top-4 right-4">
                      <span className="px-3 py-1 text-sm font-medium text-white bg-black/50 backdrop-blur-sm rounded-full">
                        {destination.type === "nature" && "Thiên nhiên"}
                        {destination.type === "culture" && "Văn hóa"}
                        {destination.type === "food" && "Ẩm thực"}
                        {destination.type === "adventure" && "Mạo hiểm"}
                        {destination.type === "city" && "Đô thị"}
                      </span>
                    </div>
                  </div>

                  {/* Destination Content */}
                  <div className="p-5">
                    <div className="mb-3">
                      <h3 className="text-base font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors line-clamp-1">
                        {destination.name}
                      </h3>
                      <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                        {destination.description}
                      </p>
                    </div>

                    {/* Destination Details */}
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="h-4 w-4 mr-2 text-emerald-500 flex-shrink-0" />
                        <span className="line-clamp-1">
                          {destination.location}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Users className="h-4 w-4 mr-2 text-emerald-500 flex-shrink-0" />
                        {destination.activities?.length || 0} hoạt động
                      </div>
                    </div>

                    {/* Price Range and Rating */}
                    <div className="mt-3 flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500">
                          {destination.ticket_price ? "Giá vé từ" : "Tour từ"}
                        </span>
                        <span className="text-base font-semibold text-emerald-600">
                          {destination.ticket_price
                            ? formatPrice(destination.ticket_price)
                            : formatPrice(destination.min_tour_price || 0)}
                        </span>
                      </div>
                      <div className="flex items-center bg-emerald-50 px-2.5 py-1 rounded-full">
                        <Star className="h-3.5 w-3.5 text-yellow-400 fill-current" />
                        <span className="ml-1 text-xs font-medium text-gray-700">
                          {destination.rating > 0
                            ? destination.rating.toFixed(1)
                            : "N/A"}
                        </span>
                        {destination.rating_count > 0 && (
                          <>
                            <span className="mx-1 text-gray-400 text-xs">
                              •
                            </span>
                            <span className="text-xs text-gray-500">
                              {destination.rating_count}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Empty State */}
            {destinations.length === 0 && !error && (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Compass className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Không tìm thấy điểm đến
                </h3>
                <p className="text-gray-600 text-lg mb-6 max-w-md mx-auto">
                  {searchQuery
                    ? `Không có điểm đến nào phù hợp với từ khóa "${searchQuery}"`
                    : "Vui lòng thử điều chỉnh bộ lọc"}
                </p>
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                >
                  Xem tất cả điểm đến
                </button>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex justify-center">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      currentPage === 1
                        ? "border-gray-200 text-gray-400 cursor-not-allowed"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <ChevronDown className="w-5 h-5 rotate-90" />
                  </button>

                  {[...Array(totalPages)].map((_, index) => {
                    const page = index + 1;
                    // Show first page, last page, current page, and pages around current
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-4 py-2 rounded-lg border transition-colors ${
                            currentPage === page
                              ? "bg-emerald-600 text-white border-emerald-600"
                              : "border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return (
                        <span key={page} className="px-2 text-gray-400">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      currentPage === totalPages
                        ? "border-gray-200 text-gray-400 cursor-not-allowed"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <ChevronDown className="w-5 h-5 -rotate-90" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Destinations;
