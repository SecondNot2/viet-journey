import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { API_URL, API_HOST } from "../../../config/api";
import {
  MapPin,
  Users,
  Clock,
  Star,
  Search,
  Filter,
  ChevronRight,
  Compass,
  Tag,
  DollarSign,
  CalendarDays,
  Heart,
  Leaf,
  UtensilsCrossed,
  Landmark,
  Mountain,
  Building,
  Loader,
  ChevronDown,
  ChevronUp,
  X,
  SlidersHorizontal,
  Award,
  CalendarCheck,
  Calendar,
  UserCheck,
  Check,
  Waves,
  Car,
  Hotel,
  Utensils,
  Bus,
  Train,
  Bike,
  BadgePercent,
} from "lucide-react";

// --- Configuration ---
const PLACEHOLDER_IMAGE = `${API_HOST}/images/placeholder.png`;

// --- Helper Functions ---
const getImageUrl = (imagePath) => {
  if (!imagePath) return PLACEHOLDER_IMAGE;
  if (imagePath.startsWith("http")) return imagePath;
  return `${API_HOST}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
};

const formatPrice = (price) => {
  if (typeof price !== "number" || isNaN(price)) return "Liên hệ";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  }).format(price);
};

// --- Filter Options ---
const typeOptions = [
  { id: "all", label: "Tất cả loại hình", icon: Tag },
  { id: "bus", label: "Xe khách", icon: Bus },
  { id: "train", label: "Tàu hỏa", icon: Train },
  { id: "car", label: "Xe hơi", icon: Car },
];

const tripTypeOptions = [
  { value: "all", label: "Tất cả loại chuyến" },
  { value: "one_way", label: "Một chiều" },
  { value: "round_trip", label: "Khứ hồi" },
  { value: "multi_city", label: "Nhiều điểm" },
];

const sortOptions = [
  { value: "price_asc", label: "Giá thấp đến cao" },
  { value: "price_desc", label: "Giá cao đến thấp" },
  { value: "departure_time_asc", label: "Giờ khởi hành sớm nhất" },
  { value: "departure_time_desc", label: "Giờ khởi hành muộn nhất" },
  { value: "duration_asc", label: "Thời gian ngắn nhất" },
  { value: "duration_desc", label: "Thời gian dài nhất" },
];

// --- Default State Values ---
const DEFAULT_FILTERS = {
  from_location: "",
  to_location: "",
  type: "all",
  trip_type: "all",
  vehicle_name: "all",
  company: "all",
  min_price: 0,
  max_price: 5000000,
  date: "",
  time: "",
  page: 1,
  limit: 9,
};

const DEFAULT_SORT_BY = "price_asc";

// Thêm helper function để tính giá sau khuyến mãi
const calculateDiscountedPrice = (originalPrice, promotion) => {
  if (!promotion) return originalPrice;

  if (promotion.type === "percentage") {
    return Math.round(originalPrice * (1 - promotion.discount / 100));
  } else {
    return Math.max(0, originalPrice - promotion.discount);
  }
};

// Thêm helper function để tính số ngày còn lại
const getDaysRemaining = (endDate) => {
  if (!endDate) return null;
  const daysRemaining = Math.ceil(
    (new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24)
  );
  return daysRemaining > 0 ? daysRemaining : 0;
};

// --- Main Component ---
const Transport = () => {
  const navigate = useNavigate();

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sortBy, setSortBy] = useState(DEFAULT_SORT_BY);
  const [transports, setTransports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    total_pages: 1,
    total: 0,
  });
  const [collapse, setCollapse] = useState({
    price: false,
    type: false,
    trip_type: false,
    vehicle_name: false,
    company: false,
  });
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const resultsContainerRef = useRef(null);
  const sidebarRef = useRef(null);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const advancedFilterRef = useRef(null);

  // States for search params (separate from filters)
  const [searchParams, setSearchParams] = useState({
    from_location: "",
    to_location: "",
    date: "",
    time: "",
  });
  const [fromLocationSuggestions, setFromLocationSuggestions] = useState([]);
  const [toLocationSuggestions, setToLocationSuggestions] = useState([]);
  const [showFromLocationSuggest, setShowFromLocationSuggest] = useState(false);
  const [showToLocationSuggest, setShowToLocationSuggest] = useState(false);
  const [loadingLocationSuggest, setLoadingLocationSuggest] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // States for available dates and times
  const [availableDates, setAvailableDates] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const [loadingTimes, setLoadingTimes] = useState(false);

  // States for dynamic filter options
  const [vehicleNameOptions, setVehicleNameOptions] = useState([]);
  const [companyOptions, setCompanyOptions] = useState([]);

  // Fetch filter options on mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [vehicleNamesRes, companiesRes] = await Promise.all([
          axios.get(`${API_URL}/transport/vehicle-names`),
          axios.get(`${API_URL}/transport/companies`),
        ]);
        setVehicleNameOptions(vehicleNamesRes.data.vehicleNames || []);
        setCompanyOptions(companiesRes.data.companies || []);
      } catch (err) {
        console.error("Lỗi khi lấy filter options:", err);
      }
    };
    fetchFilterOptions();
  }, []);

  // Read URL parameters on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const initialToLocation = urlParams.get("to") || "";
    const initialFromLocation = urlParams.get("from") || "";

    if (initialToLocation || initialFromLocation) {
      setSearchParams({
        from_location: initialFromLocation,
        to_location: initialToLocation,
        date: "",
      });
      // Tự động trigger search khi có URL param
      setFilters((prev) => ({
        ...prev,
        to_location: initialToLocation,
        from_location: initialFromLocation,
      }));
      setHasSearched(true);
    }
  }, []);

  // --- Data Fetching ---
  const fetchTransports = async (
    currentFilters = filters,
    currentSortBy = sortBy
  ) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentFilters.page,
        limit: currentFilters.limit,
      };

      if (currentFilters.from_location)
        params.from_location = currentFilters.from_location;
      if (currentFilters.to_location)
        params.to_location = currentFilters.to_location;
      if (currentFilters.date) params.date = currentFilters.date;
      if (currentFilters.time) params.time = currentFilters.time;
      if (currentFilters.type !== "all") params.type = currentFilters.type;
      if (currentFilters.trip_type !== "all")
        params.trip_type = currentFilters.trip_type;
      if (currentFilters.vehicle_name !== "all")
        params.vehicle_name = currentFilters.vehicle_name;
      if (currentFilters.company !== "all")
        params.company = currentFilters.company;
      if (currentFilters.min_price > 0)
        params.min_price = currentFilters.min_price;
      if (currentFilters.max_price < 5000000)
        params.max_price = currentFilters.max_price;

      // Gửi sort_by nguyên vẹn cho backend
      params.sort_by = currentSortBy;

      const res = await axios.get(`${API_URL}/transport`, { params });

      if (res.data && res.data.transports && res.data.pagination) {
        // 🔍 Debug: Log first transport to check date format
        if (res.data.transports.length > 0) {
          console.log("🔍 First transport data:", res.data.transports[0]);
          console.log(
            "  - trip_date:",
            res.data.transports[0].trip_date,
            typeof res.data.transports[0].trip_date
          );
          console.log(
            "  - departure_time:",
            res.data.transports[0].departure_time,
            typeof res.data.transports[0].departure_time
          );
          console.log(
            "  - departure_datetime:",
            res.data.transports[0].departure_datetime,
            typeof res.data.transports[0].departure_datetime
          );
        }
        setTransports(res.data.transports);
        setPagination(res.data.pagination);
      } else {
        setTransports(res.data?.transports || []);
        setPagination(
          res.data?.pagination || { page: 1, total_pages: 1, total: 0 }
        );
      }
    } catch (err) {
      setError(
        `Lỗi khi tải dữ liệu: ${err.response?.data?.error || err.message}`
      );
      setTransports([]);
      setPagination({ page: 1, total_pages: 1, total: 0 });
    } finally {
      setLoading(false);
    }
  };

  // Fetch location suggestions
  const fetchLocationSuggestions = async (q, field) => {
    setLoadingLocationSuggest(true);
    try {
      const res = await axios.get(`${API_URL}/transport/locations/suggest`, {
        params: { q, field }, // Pass field to backend
      });
      const suggestions = [];
      if (res.data.locations) {
        res.data.locations.forEach((location) => {
          const parts = location.split(",").map((part) => part.trim());
          parts.forEach((part) => {
            if (part && !suggestions.includes(part)) {
              suggestions.push(part);
            }
          });
        });
      }

      if (field === "from") {
        setFromLocationSuggestions(suggestions);
        setShowFromLocationSuggest(true);
      } else {
        setToLocationSuggestions(suggestions);
        setShowToLocationSuggest(true);
      }
    } catch (err) {
      if (field === "from") {
        setFromLocationSuggestions([]);
        setShowFromLocationSuggest(false);
      } else {
        setToLocationSuggestions([]);
        setShowToLocationSuggest(false);
      }
    } finally {
      setLoadingLocationSuggest(false);
    }
  };

  // Fetch available dates based on from_location and to_location
  const fetchAvailableDates = async (fromLocation, toLocation) => {
    if (!fromLocation || !toLocation) {
      setAvailableDates([]);
      return;
    }

    setLoadingDates(true);
    try {
      const res = await axios.get(`${API_URL}/transport/available-dates`, {
        params: {
          from_location: fromLocation,
          to_location: toLocation,
        },
      });
      setAvailableDates(res.data.dates || []);

      // Reset date and time if not in available list
      if (res.data.dates && res.data.dates.length > 0) {
        const currentDate = searchParams.date;
        // dates đã là YYYY-MM-DD, so sánh trực tiếp
        const dateExists = res.data.dates.includes(currentDate);
        if (!dateExists) {
          setSearchParams((prev) => ({ ...prev, date: "", time: "" }));
          setAvailableTimes([]);
        }
      } else {
        setSearchParams((prev) => ({ ...prev, date: "", time: "" }));
        setAvailableTimes([]);
      }
    } catch (err) {
      setAvailableDates([]);
    } finally {
      setLoadingDates(false);
    }
  };

  // Fetch available times based on from_location, to_location, and date
  const fetchAvailableTimes = async (fromLocation, toLocation, date) => {
    if (!fromLocation || !toLocation || !date) {
      setAvailableTimes([]);
      return;
    }

    setLoadingTimes(true);
    try {
      const res = await axios.get(`${API_URL}/transport/available-times`, {
        params: {
          from_location: fromLocation,
          to_location: toLocation,
          date: date,
        },
      });
      setAvailableTimes(res.data.times || []);

      // Reset time if not in available list
      if (res.data.times && res.data.times.length > 0) {
        const currentTime = searchParams.time;
        if (!res.data.times.includes(currentTime)) {
          setSearchParams((prev) => ({ ...prev, time: "" }));
        }
      } else {
        setSearchParams((prev) => ({ ...prev, time: "" }));
      }
    } catch (err) {
      setAvailableTimes([]);
    } finally {
      setLoadingTimes(false);
    }
  };

  // --- Effects ---
  // Fetch transports when filters or sort change
  useEffect(() => {
    // Always fetch when page, type, trip_type, price, or sortBy changes
    // Only skip if hasSearched is false AND search params exist but not submitted
    const shouldFetch =
      hasSearched ||
      (!searchParams.from_location &&
        !searchParams.to_location &&
        !searchParams.date);

    if (shouldFetch) {
      fetchTransports(filters, sortBy);
    }
  }, [
    filters.page,
    filters.type,
    filters.trip_type,
    filters.vehicle_name,
    filters.company,
    filters.min_price,
    filters.max_price,
    filters.from_location,
    filters.to_location,
    filters.date,
    filters.time,
    sortBy,
  ]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        if (!event.target.closest("#mobile-filter-toggle")) {
          setShowMobileFilter(false);
        }
      }
    };
    if (showMobileFilter) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMobileFilter]);

  // --- Handlers ---
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
      page: 1,
    }));
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    setFilters((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    const totalPages = pagination.totalPages || pagination.total_pages || 1;

    if (newPage >= 1 && newPage <= totalPages) {
      setFilters((prev) => ({ ...prev, page: newPage }));

      // Scroll to top of results
      setTimeout(() => {
        if (resultsContainerRef.current) {
          resultsContainerRef.current.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }, 100);
    }
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSortBy(DEFAULT_SORT_BY);
    setSearchParams({ from_location: "", to_location: "", date: "", time: "" });
    setAvailableDates([]);
    setAvailableTimes([]);
    setHasSearched(false);
  };

  const handleSelectTransport = (transportId) => {
    if (transportId) {
      navigate(`/transports/${transportId}`);
    }
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    setFilters((prev) => ({
      ...prev,
      from_location: searchParams.from_location,
      to_location: searchParams.to_location,
      date: searchParams.date,
      time: searchParams.time,
      page: 1,
    }));
    setHasSearched(true);
    setShowFromLocationSuggest(false);
    setShowToLocationSuggest(false);
  };

  const handleSearchInputChange = (field, value) => {
    setSearchParams((prev) => ({ ...prev, [field]: value }));

    if (field === "from_location" && value && value.trim() !== "") {
      fetchLocationSuggestions(value, "from");
    } else if (field === "from_location") {
      setFromLocationSuggestions([]);
      setShowFromLocationSuggest(false);
    }

    if (field === "to_location" && value && value.trim() !== "") {
      fetchLocationSuggestions(value, "to");
    } else if (field === "to_location") {
      setToLocationSuggestions([]);
      setShowToLocationSuggest(false);
    }

    // Khi chọn ngày, fetch available times
    if (
      field === "date" &&
      value &&
      searchParams.from_location &&
      searchParams.to_location
    ) {
      fetchAvailableTimes(
        searchParams.from_location,
        searchParams.to_location,
        value
      );
    }
  };

  const handleLocationSelect = (location, field) => {
    setSearchParams((prev) => ({ ...prev, [field]: location }));
    if (field === "from_location") {
      setFromLocationSuggestions([]);
      setShowFromLocationSuggest(false);
      // Khi chọn điểm đi, tự động fetch các điểm đến có thể đến từ điểm này
      fetchDestinationsFromOrigin(location);

      // Nếu đã có điểm đến, fetch available dates
      if (searchParams.to_location) {
        fetchAvailableDates(location, searchParams.to_location);
      }
    } else {
      setToLocationSuggestions([]);
      setShowToLocationSuggest(false);
      // Khi chọn điểm đến, tự động fetch các điểm khởi hành có thể đi đến điểm này
      fetchOriginsToDestination(location);

      // Nếu đã có điểm khởi hành, fetch available dates
      if (searchParams.from_location) {
        fetchAvailableDates(searchParams.from_location, location);
      }
    }
  };

  // Fetch các điểm đến có thể đi từ điểm khởi hành
  const fetchDestinationsFromOrigin = async (fromLocation) => {
    if (!fromLocation || fromLocation.trim() === "") return;

    try {
      const res = await axios.get(`${API_URL}/transport/destinations/from`, {
        params: { from: fromLocation },
      });
      const suggestions = [];
      if (res.data.locations) {
        res.data.locations.forEach((location) => {
          const parts = location.split(",").map((part) => part.trim());
          parts.forEach((part) => {
            if (part && !suggestions.includes(part)) {
              suggestions.push(part);
            }
          });
        });
      }
      setToLocationSuggestions(suggestions);
    } catch (err) {
      // Silent fail
    }
  };

  // Fetch các điểm khởi hành có thể đến điểm đích
  const fetchOriginsToDestination = async (toLocation) => {
    if (!toLocation || toLocation.trim() === "") return;

    try {
      const res = await axios.get(`${API_URL}/transport/origins/to`, {
        params: { to: toLocation },
      });
      const suggestions = [];
      if (res.data.locations) {
        res.data.locations.forEach((location) => {
          const parts = location.split(",").map((part) => part.trim());
          parts.forEach((part) => {
            if (part && !suggestions.includes(part)) {
              suggestions.push(part);
            }
          });
        });
      }
      setFromLocationSuggestions(suggestions);
    } catch (err) {
      // Silent fail
    }
  };

  // Handle focus on to_location input
  const handleToLocationFocus = () => {
    if (searchParams.from_location && toLocationSuggestions.length > 0) {
      setShowToLocationSuggest(true);
    } else if (searchParams.from_location) {
      fetchDestinationsFromOrigin(searchParams.from_location);
      setShowToLocationSuggest(true);
    }
  };

  // Handle focus on from_location input
  const handleFromLocationFocus = () => {
    if (searchParams.to_location && fromLocationSuggestions.length > 0) {
      setShowFromLocationSuggest(true);
    } else if (searchParams.to_location) {
      fetchOriginsToDestination(searchParams.to_location);
      setShowFromLocationSuggest(true);
    }
  };

  // --- Helper Functions ---
  const getTypeIcon = (type) => {
    switch (type) {
      case "bus":
        return <Bus size={16} className="text-blue-500" />;
      case "train":
        return <Train size={16} className="text-purple-500" />;
      case "car":
        return <Car size={16} className="text-orange-500" />;
      case "bike":
        return <Bike size={16} className="text-green-500" />;
      default:
        return <Tag size={16} className="text-gray-500" />;
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      bus: "Xe khách",
      train: "Tàu hỏa",
      car: "Xe hơi",
      bike: "Xe máy",
    };
    return labels[type] || type;
  };

  const getTripTypeLabel = (tripType) => {
    const labels = {
      one_way: "Một chiều",
      round_trip: "Khứ hồi",
      multi_city: "Nhiều điểm",
    };
    return labels[tripType] || tripType;
  };

  const formatDuration = (minutes) => {
    if (!minutes) return "0 phút";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours > 0 ? `${hours} giờ ` : ""}${
      mins > 0 ? `${mins} phút` : ""
    }`;
  };

  // ✅ Format datetime string YYYY-MM-DD HH:MM:SS → HH:MM DD/MM/YYYY
  // KHÔNG parse thành Date object để tránh lỗi timezone!
  const formatDateTime = (datetime) => {
    if (!datetime) return "Chưa xác định";

    // Split "2025-10-12 08:30:00" → ["2025-10-12", "08:30:00"]
    const [datePart, timePart] = String(datetime).split(" ");
    if (!datePart) return datetime;

    // Split date "2025-10-12" → ["2025", "10", "12"]
    const [year, month, day] = datePart.split("-");

    // Get time "08:30:00" → "08:30"
    const time = timePart ? timePart.substring(0, 5) : "";

    // Format: HH:MM DD/MM/YYYY
    return `${time} ${day}/${month}/${year}`;
  };

  // --- Sidebar Component ---
  const SidebarFilter = ({ isMobile = false }) => (
    <aside
      ref={isMobile ? sidebarRef : null}
      className={`
        ${
          isMobile
            ? `fixed inset-y-0 left-0 z-50 transform bg-white p-6 shadow-xl transition-transform duration-300 ease-in-out w-4/5 max-w-sm overflow-y-auto custom-scrollbar ${
                showMobileFilter ? "translate-x-0" : "-translate-x-full"
              }`
            : "sidebar-filter bg-white rounded-xl shadow-lg p-6 h-fit sticky top-24 hidden lg:block max-h-[85vh] overflow-auto custom-scrollbar"
        }`}
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-emerald-700">Bộ lọc</h3>
        <button
          onClick={resetFilters}
          className="text-sm font-medium text-gray-500 hover:text-emerald-600 transition-colors"
        >
          Đặt lại
        </button>
        {isMobile && (
          <button
            onClick={() => setShowMobileFilter(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        )}
      </div>

      {/* Price Range */}
      <div className="sidebar-section pb-6 mb-6">
        <div
          className="flex justify-between items-center cursor-pointer mb-3"
          onClick={() => setCollapse((c) => ({ ...c, price: !c.price }))}
        >
          <h4 className="text-md font-semibold text-gray-800">Giá vé</h4>
          <ChevronDown
            className={`transition-transform ${
              collapse.price ? "rotate-180" : ""
            }`}
            size={20}
          />
        </div>
        {!collapse.price && (
          <div className="px-1 space-y-3 animate-fade-in">
            <div className="flex justify-between text-sm text-gray-600">
              <span>{formatPrice(filters.min_price)}</span>
              <span>{formatPrice(filters.max_price)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="5000000"
              step="50000"
              value={filters.max_price}
              onChange={(e) =>
                handleFilterChange("max_price", parseInt(e.target.value))
              }
              className="w-full h-2 bg-emerald-100 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:bg-emerald-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full"
            />
          </div>
        )}
      </div>

      {/* Transport Type */}
      <div className="sidebar-section pb-6 mb-6">
        <div
          className="flex justify-between items-center cursor-pointer mb-3"
          onClick={() => setCollapse((c) => ({ ...c, type: !c.type }))}
        >
          <h4 className="text-md font-semibold text-gray-800">
            Loại phương tiện
          </h4>
          <ChevronDown
            className={`transition-transform ${
              collapse.type ? "rotate-180" : ""
            }`}
            size={20}
          />
        </div>
        {!collapse.type && (
          <div className="space-y-2 animate-fade-in">
            {typeOptions.map((option) => (
              <label
                key={option.id}
                className={`flex items-center space-x-3 cursor-pointer p-2 rounded-lg transition-all ${
                  filters.type === option.id
                    ? "bg-emerald-50 text-emerald-900"
                    : "hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="transportType"
                  value={option.id}
                  checked={filters.type === option.id}
                  onChange={(e) => handleFilterChange("type", e.target.value)}
                  className="form-radio h-4 w-4 border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <div
                  className={`flex items-center gap-2 ${
                    filters.type === option.id
                      ? "text-emerald-900"
                      : "text-gray-600"
                  }`}
                >
                  <option.icon
                    size={18}
                    className={
                      filters.type === option.id
                        ? "text-emerald-600"
                        : "text-gray-400"
                    }
                  />
                  <span className="text-sm">{option.label}</span>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Trip Type */}
      <div className="sidebar-section pb-6 mb-6">
        <div
          className="flex justify-between items-center cursor-pointer mb-3"
          onClick={() =>
            setCollapse((c) => ({ ...c, trip_type: !c.trip_type }))
          }
        >
          <h4 className="text-md font-semibold text-gray-800">Loại chuyến</h4>
          <ChevronDown
            className={`transition-transform ${
              collapse.trip_type ? "rotate-180" : ""
            }`}
            size={20}
          />
        </div>
        {!collapse.trip_type && (
          <div className="space-y-2 animate-fade-in">
            {tripTypeOptions.map((option) => (
              <label
                key={option.value}
                className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-emerald-50"
              >
                <input
                  type="radio"
                  name="tripType"
                  value={option.value}
                  checked={filters.trip_type === option.value}
                  onChange={(e) =>
                    handleFilterChange("trip_type", e.target.value)
                  }
                  className="form-radio text-emerald-600 h-4 w-4 border-gray-300 focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Vehicle Name */}
      <div className="sidebar-section pb-6 mb-6">
        <div
          className="flex justify-between items-center cursor-pointer mb-3"
          onClick={() =>
            setCollapse((c) => ({ ...c, vehicle_name: !c.vehicle_name }))
          }
        >
          <h4 className="text-md font-semibold text-gray-800">Loại xe</h4>
          <ChevronDown
            className={`transition-transform ${
              collapse.vehicle_name ? "rotate-180" : ""
            }`}
            size={20}
          />
        </div>
        {!collapse.vehicle_name && (
          <div className="space-y-2 animate-fade-in max-h-60 overflow-y-auto custom-scrollbar">
            <label className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-emerald-50">
              <input
                type="radio"
                name="vehicleName"
                value="all"
                checked={filters.vehicle_name === "all"}
                onChange={(e) =>
                  handleFilterChange("vehicle_name", e.target.value)
                }
                className="form-radio text-emerald-600 h-4 w-4 border-gray-300 focus:ring-emerald-500"
              />
              <span className="text-sm text-gray-700">Tất cả</span>
            </label>
            {vehicleNameOptions.map((name) => (
              <label
                key={name}
                className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-emerald-50"
              >
                <input
                  type="radio"
                  name="vehicleName"
                  value={name}
                  checked={filters.vehicle_name === name}
                  onChange={(e) =>
                    handleFilterChange("vehicle_name", e.target.value)
                  }
                  className="form-radio text-emerald-600 h-4 w-4 border-gray-300 focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700">{name}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Company */}
      <div className="sidebar-section pb-6 mb-6">
        <div
          className="flex justify-between items-center cursor-pointer mb-3"
          onClick={() => setCollapse((c) => ({ ...c, company: !c.company }))}
        >
          <h4 className="text-md font-semibold text-gray-800">Hãng xe</h4>
          <ChevronDown
            className={`transition-transform ${
              collapse.company ? "rotate-180" : ""
            }`}
            size={20}
          />
        </div>
        {!collapse.company && (
          <div className="space-y-2 animate-fade-in">
            <label className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-emerald-50">
              <input
                type="radio"
                name="company"
                value="all"
                checked={filters.company === "all"}
                onChange={(e) => handleFilterChange("company", e.target.value)}
                className="form-radio text-emerald-600 h-4 w-4 border-gray-300 focus:ring-emerald-500"
              />
              <span className="text-sm text-gray-700">Tất cả</span>
            </label>
            {companyOptions.map((company) => (
              <label
                key={company}
                className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-emerald-50"
              >
                <input
                  type="radio"
                  name="company"
                  value={company}
                  checked={filters.company === company}
                  onChange={(e) =>
                    handleFilterChange("company", e.target.value)
                  }
                  className="form-radio text-emerald-600 h-4 w-4 border-gray-300 focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700">{company}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </aside>
  );

  // --- Transport Card Component ---
  const TransportCard = ({ transport }) => {
    const navigate = useNavigate();

    const handleViewDetail = () => {
      // Sử dụng trip_id vì đây là transport_trips
      navigate(`/transport/${transport.trip_id || transport.id}`);
    };

    const isPromo =
      transport.promotion_id &&
      transport.promotion_status === "active" &&
      new Date(transport.promotion_end_date) >= new Date() &&
      transport.promotion_discount > 0;

    const daysRemaining = isPromo
      ? getDaysRemaining(transport.promotion_end_date)
      : null;

    const discountedPrice = isPromo
      ? calculateDiscountedPrice(Number(transport.price), {
          type: transport.promotion_type,
          discount: Number(transport.promotion_discount),
        })
      : Number(transport.price);

    return (
      <div
        key={transport.id}
        className={`transport-card rounded-xl overflow-hidden transition-all duration-300 relative ${
          isPromo
            ? "promo-transport-card"
            : "bg-white border border-gray-100 shadow-md hover:shadow-lg"
        }`}
      >
        {/* Tag khuyến mãi */}
        {isPromo && (
          <>
            <div className="absolute top-0 right-0 z-30 px-4 py-1 bg-orange-500 text-white font-bold text-sm rounded-bl-2xl shadow-md flex items-center gap-1">
              <Tag size={14} />
              {transport.promotion_type === "percentage"
                ? `-${transport.promotion_discount}%`
                : `-${formatPrice(transport.promotion_discount)}`}
            </div>
            <div className="absolute top-0 left-0 z-20 flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-orange-400 to-orange-300 text-white font-bold rounded-br-2xl shadow-md">
              <Star size={14} className="fill-current" />
              <span>{transport.promotion_title || "Khuyến mãi HOT"}</span>
            </div>
          </>
        )}

        <div className="flex flex-col lg:flex-row">
          {/* Left Column: Image */}
          <div className="lg:w-1/3 relative">
            <div className="relative h-64 lg:h-full">
              <img
                src={getImageUrl(transport.image)}
                alt={transport.vehicle_name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = PLACEHOLDER_IMAGE;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>

            {/* Transport Type Badge */}
            <div
              className={`absolute bottom-3 left-3 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 ${
                transport.type === "bus"
                  ? "bg-blue-50 text-blue-700"
                  : transport.type === "train"
                  ? "bg-purple-50 text-purple-700"
                  : transport.type === "car"
                  ? "bg-orange-50 text-orange-700"
                  : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {getTypeIcon(transport.type)}
              <span>{getTypeLabel(transport.type)}</span>
            </div>
          </div>

          {/* Right Column: Content */}
          <div className="lg:w-2/3 p-6 pt-10">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {transport.vehicle_name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-gray-500" />
                    <span className="text-gray-600">
                      {transport.from_location} → {transport.to_location}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  {isPromo ? (
                    <>
                      <div className="text-2xl font-bold text-orange-600">
                        {formatPrice(discountedPrice)}
                      </div>
                      <div className="flex flex-col items-end">
                        <p className="text-sm text-gray-400 line-through">
                          {formatPrice(Number(transport.price))}
                        </p>
                        {daysRemaining !== null && (
                          <p className="text-xs text-orange-500">
                            {daysRemaining > 0
                              ? `Còn ${daysRemaining} ngày`
                              : "Sắp kết thúc"}
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-2xl font-bold text-emerald-600">
                      {formatPrice(Number(transport.price))}
                    </div>
                  )}
                  <p className="text-sm text-gray-500">/vé</p>
                </div>
              </div>

              {/* Details Row */}
              <div className="flex flex-wrap items-center gap-4 mb-4">
                {/* Company */}
                <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-lg">
                  <Building size={16} className="text-emerald-600" />
                  <span className="font-medium text-gray-700">
                    {transport.company}
                  </span>
                </div>

                {/* Duration */}
                <div className="flex items-center gap-1.5 text-gray-600">
                  <Clock size={16} />
                  <span>{formatDuration(transport.duration)}</span>
                </div>

                {/* Seats */}
                <div className="flex items-center gap-1.5 text-gray-600">
                  <Users size={16} />
                  <span>{transport.seats} chỗ</span>
                </div>

                {/* Trip Type */}
                <div className="flex items-center gap-1.5 text-gray-600">
                  <Compass size={16} />
                  <span>{getTripTypeLabel(transport.trip_type)}</span>
                </div>
              </div>

              {/* Schedule */}
              <div className="mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                    <Calendar size={16} className="text-emerald-500" />
                    <div>
                      <span className="text-sm text-gray-500">Khởi hành: </span>
                      <span className="font-medium text-gray-900">
                        {formatDateTime(
                          transport.departure_datetime ||
                            transport.departure_time
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                    <Clock size={16} className="text-emerald-500" />
                    <div>
                      <span className="text-sm text-gray-500">Thời gian: </span>
                      <span className="font-medium text-gray-900">
                        {formatDuration(transport.duration)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-auto pt-4 border-t border-gray-100">
                <div className="flex items-center">
                  {/* Promotion Description */}
                  {isPromo && transport.promotion_description && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium text-orange-600">
                        Ưu đãi:{" "}
                      </span>
                      {transport.promotion_description}
                    </div>
                  )}
                  <button
                    onClick={handleViewDetail}
                    className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm text-sm font-medium flex items-center gap-2 ml-auto"
                  >
                    <span>Xem chi tiết</span>
                    <ChevronDown className="w-4 h-4 transform -rotate-90" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- Main Render ---
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* CSS Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #10b981;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #059669;
        }

        .sidebar-filter { min-width: 270px; max-width: 320px; }
        @media (max-width: 1023px) { .sidebar-filter { display: none; } }
        .sidebar-section { border-bottom: 1px solid #f1f5f9; }
        .sidebar-section:last-child { border-bottom: none; }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out forwards;
        }
        
        .transport-card {
          transition: all 0.3s ease;
        }
        .transport-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }

        /* Promo transport card đặc biệt */
        .promo-transport-card {
          box-shadow: 0 8px 32px -8px #fb923c99, 0 2px 8px -2px #fb923c33;
          border-radius: 1.2rem;
          border-width: 2px;
          border-color: #fb923c;
          background: linear-gradient(90deg, #fff7ed 60%, #ffedd5 100%);
          position: relative;
        }
        .promo-transport-card:hover {
          box-shadow: 0 16px 40px -8px #fb923cbb, 0 4px 16px -2px #fb923c44;
          background: linear-gradient(90deg, #fff7ed 40%, #ffedd5 100%);
        }
      `}</style>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 py-16 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-transparent opacity-20"></div>
        <div className="container mx-auto px-4 relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight">
            Phương Tiện Di Chuyển
          </h1>
          <p className="text-lg md:text-xl text-emerald-100 max-w-3xl">
            Đặt vé phương tiện di chuyển nhanh chóng, tiện lợi với nhiều lựa
            chọn đa dạng.
          </p>
        </div>
      </div>

      {/* Search Form */}
      <div className="container mx-auto px-4 -mt-8 relative z-20">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <form onSubmit={handleSearch}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Điểm đi */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Điểm khởi hành <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchParams.from_location}
                    onChange={(e) =>
                      handleSearchInputChange("from_location", e.target.value)
                    }
                    onFocus={handleFromLocationFocus}
                    className="w-full border border-gray-300 rounded-lg p-3 pl-4 pr-10 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors shadow-sm hover:border-emerald-300"
                    placeholder="Nhập điểm khởi hành..."
                    required
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-emerald-600 bg-emerald-50 p-1 rounded-full">
                    <MapPin size={18} />
                  </div>
                  {/* From Location Suggestions */}
                  {showFromLocationSuggest &&
                    fromLocationSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                        {fromLocationSuggestions.map((location, index) => (
                          <div
                            key={index}
                            onClick={() =>
                              handleLocationSelect(location, "from_location")
                            }
                            className="px-4 py-2 hover:bg-emerald-50 cursor-pointer text-gray-900"
                          >
                            <MapPin
                              size={14}
                              className="inline mr-2 text-emerald-600"
                            />
                            {location}
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              </div>

              {/* Điểm đến */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Điểm đến <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchParams.to_location}
                    onChange={(e) =>
                      handleSearchInputChange("to_location", e.target.value)
                    }
                    onFocus={handleToLocationFocus}
                    className="w-full border border-gray-300 rounded-lg p-3 pl-4 pr-10 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors shadow-sm hover:border-emerald-300"
                    placeholder="Nhập điểm đến..."
                    required
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-emerald-600 bg-emerald-50 p-1 rounded-full">
                    <MapPin size={18} />
                  </div>
                  {/* To Location Suggestions */}
                  {showToLocationSuggest &&
                    toLocationSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                        {toLocationSuggestions.map((location, index) => (
                          <div
                            key={index}
                            onClick={() =>
                              handleLocationSelect(location, "to_location")
                            }
                            className="px-4 py-2 hover:bg-emerald-50 cursor-pointer text-gray-900"
                          >
                            <MapPin
                              size={14}
                              className="inline mr-2 text-emerald-600"
                            />
                            {location}
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              </div>

              {/* Ngày đi */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày khởi hành
                </label>
                <div className="relative">
                  <select
                    value={searchParams.date}
                    onChange={(e) =>
                      handleSearchInputChange("date", e.target.value)
                    }
                    disabled={
                      !searchParams.from_location ||
                      !searchParams.to_location ||
                      loadingDates
                    }
                    className="w-full border border-gray-300 rounded-lg p-3 pl-4 pr-10 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors shadow-sm hover:border-emerald-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {loadingDates
                        ? "Đang tải..."
                        : !searchParams.from_location ||
                          !searchParams.to_location
                        ? "Chọn điểm đi/đến trước"
                        : availableDates.length === 0
                        ? "Không có ngày khả dụng"
                        : "Chọn ngày"}
                    </option>
                    {availableDates.map((date) => {
                      // date = "YYYY-MM-DD" string từ backend
                      // Convert to DD/MM/YYYY for display
                      const [year, month, day] = date.split("-");
                      const displayText = `${day}/${month}/${year}`;
                      return (
                        <option key={date} value={date}>
                          {displayText}
                        </option>
                      );
                    })}
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-emerald-600 bg-emerald-50 p-1 rounded-full pointer-events-none">
                    <Calendar size={18} />
                  </div>
                </div>
              </div>

              {/* Giờ khởi hành */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giờ khởi hành
                </label>
                <div className="relative">
                  <select
                    value={searchParams.time}
                    onChange={(e) =>
                      handleSearchInputChange("time", e.target.value)
                    }
                    disabled={!searchParams.date || loadingTimes}
                    className="w-full border border-gray-300 rounded-lg p-3 pl-4 pr-10 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors shadow-sm hover:border-emerald-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {loadingTimes
                        ? "Đang tải..."
                        : !searchParams.date
                        ? "Chọn ngày trước"
                        : availableTimes.length === 0
                        ? "Không có giờ khả dụng"
                        : "Tất cả giờ"}
                    </option>
                    {availableTimes.map((time) => (
                      <option key={time} value={time}>
                        {time.substring(0, 5)}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-emerald-600 bg-emerald-50 p-1 rounded-full pointer-events-none">
                    <Clock size={18} />
                  </div>
                </div>
              </div>

              {/* Nút tìm kiếm */}
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 active:bg-emerald-800 transition-all transform active:scale-[0.99] shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  disabled={
                    loading ||
                    !searchParams.from_location ||
                    !searchParams.to_location
                  }
                >
                  {loading ? (
                    <>
                      <Loader size={20} className="animate-spin" />
                      <span>Tìm...</span>
                    </>
                  ) : (
                    <>
                      <Search size={20} />
                      <span>Tìm</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 py-8 lg:py-12">
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden mb-6 flex justify-between items-center">
          <button
            id="mobile-filter-toggle"
            onClick={() => setShowMobileFilter(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <SlidersHorizontal size={18} />
            <span>Bộ lọc</span>
          </button>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg pl-3 pr-8 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
              size={16}
            />
          </div>
        </div>

        {/* Content Layout */}
        <div
          className="flex flex-col lg:flex-row gap-8"
          ref={resultsContainerRef}
        >
          {/* Sidebar */}
          <SidebarFilter />

          {/* Mobile Filter Overlay */}
          {showMobileFilter && (
            <div
              className="fixed inset-0 bg-black/30 z-40 lg:hidden"
              onClick={() => setShowMobileFilter(false)}
            ></div>
          )}

          {/* Mobile Filter Panel */}
          {showMobileFilter && <SidebarFilter isMobile={true} />}

          {/* Results Area */}
          <div className="flex-1 min-w-0">
            {/* Results Header */}
            {!loading && transports.length > 0 && (
              <div className="hidden lg:flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-700">
                  Tìm thấy {pagination.total || 0} phương tiện
                </h2>
                <div className="flex items-center gap-2">
                  <label htmlFor="sort-by" className="text-sm text-gray-600">
                    Sắp xếp:
                  </label>
                  <div className="relative">
                    <select
                      id="sort-by"
                      value={sortBy}
                      onChange={(e) => handleSortChange(e.target.value)}
                      className="appearance-none bg-white border border-gray-300 rounded-lg pl-3 pr-8 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer"
                    >
                      {sortOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                      size={16}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center items-center py-20">
                <Loader size={36} className="animate-spin text-emerald-500" />
              </div>
            )}

            {/* Error State */}
            {!loading && error && (
              <div className="text-center text-red-600 font-medium bg-red-50 p-6 rounded-lg border border-red-200">
                <p>{error}</p>
              </div>
            )}

            {/* No Results State */}
            {!loading && !error && transports.length === 0 && (
              <div className="text-center text-gray-500 py-20">
                <Compass size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-xl font-semibold">
                  Không tìm thấy phương tiện phù hợp.
                </p>
                <p className="mt-2">
                  Vui lòng thử thay đổi bộ lọc hoặc tìm kiếm lại.
                </p>
                <button
                  onClick={resetFilters}
                  className="mt-4 px-5 py-2 bg-emerald-100 text-emerald-700 rounded-lg font-medium hover:bg-emerald-200 transition"
                >
                  Xóa bộ lọc
                </button>
              </div>
            )}

            {/* Transports Grid */}
            {!loading && !error && transports.length > 0 && (
              <div className="space-y-6">
                {transports.map((transport) => (
                  <TransportCard
                    key={transport.trip_id || transport.id}
                    transport={transport}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && !error && transports.length > 0 && pagination && (
              <div className="mt-8 flex justify-center">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      handlePageChange(Math.max(1, pagination.page - 1));
                    }}
                    disabled={pagination.page === 1 || loading}
                    className="px-3 py-2 border rounded-lg hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path
                        fillRule="evenodd"
                        d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"
                      />
                    </svg>
                    <span>Trước</span>
                  </button>

                  {Array.from(
                    {
                      length: Math.min(
                        5,
                        pagination.totalPages || pagination.total_pages || 1
                      ),
                    },
                    (_, i) => {
                      let pageNum;
                      const totalPages =
                        pagination.totalPages || pagination.total_pages || 1;

                      if (totalPages <= 5) {
                        // Nếu tổng số trang <= 5, hiển thị tất cả
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        // Nếu đang ở gần đầu, hiển thị 1-5
                        pageNum = i + 1;
                      } else if (pagination.page >= totalPages - 2) {
                        // Nếu đang ở gần cuối, hiển thị totalPages-4 đến totalPages
                        pageNum = totalPages - 4 + i;
                      } else {
                        // Ở giữa, hiển thị currentPage-2 đến currentPage+2
                        pageNum = pagination.page - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          disabled={loading}
                          className={`w-10 h-10 flex items-center justify-center rounded-lg ${
                            pagination.page === pageNum
                              ? "bg-emerald-600 text-white"
                              : "border hover:bg-emerald-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                  )}

                  <button
                    onClick={() => {
                      const totalPages =
                        pagination.totalPages || pagination.total_pages || 1;
                      handlePageChange(
                        Math.min(totalPages, pagination.page + 1)
                      );
                    }}
                    disabled={
                      pagination.page ===
                        (pagination.totalPages ||
                          pagination.total_pages ||
                          1) || loading
                    }
                    className="px-3 py-2 border rounded-lg hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <span>Sau</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transport;
