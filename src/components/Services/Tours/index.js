// --- START OF FILE index.js (Tours) ---

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";

// --- Configuration ---
const PLACEHOLDER_IMAGE = "/images/placeholder.jpg"; // Ensure this image exists in your public folder

// --- Helper Functions ---
const getImageUrl = (imagePath) => {
  if (!imagePath) return PLACEHOLDER_IMAGE;
  if (imagePath.startsWith("http")) return imagePath;
  return `${API_URL}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
};

const formatPrice = (price) => {
  // Convert to number if it's a string
  const numPrice = typeof price === "string" ? parseFloat(price) : price;

  // Check if it's a valid number
  if (
    typeof numPrice !== "number" ||
    isNaN(numPrice) ||
    numPrice === null ||
    numPrice === undefined
  ) {
    return "Liên hệ";
  }

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  }).format(numPrice);
};

// --- Filter Options ---
// Type icons mapping
const typeIconsMap = {
  domestic: MapPin,
  international: Compass,
  adventure: Mountain,
  cultural: Landmark,
  beach: Waves,
  mountain: Mountain,
};

const typeLabelsMap = {
  domestic: "Tour trong nước",
  international: "Tour quốc tế",
  adventure: "Tour mạo hiểm",
  cultural: "Tour văn hóa",
  beach: "Tour biển",
  mountain: "Tour núi",
};

const regionOptions = [
  { value: "all", label: "Tất cả khu vực" },
  { value: "north", label: "Miền Bắc" },
  { value: "central", label: "Miền Trung" },
  { value: "south", label: "Miền Nam" },
];

// Price range options
const priceRangeOptions = [
  { value: "all", label: "Tất cả mức giá", min: 0, max: null },
  { value: "0-5", label: "Dưới 5 triệu", min: 0, max: 5000000 },
  { value: "5-10", label: "5 - 10 triệu", min: 5000000, max: 10000000 },
  { value: "10-20", label: "10 - 20 triệu", min: 10000000, max: 20000000 },
  { value: "20-30", label: "20 - 30 triệu", min: 20000000, max: 30000000 },
  { value: "30+", label: "Trên 30 triệu", min: 30000000, max: null },
];

const durationOptions = [
  { value: "all", label: "Tất cả thời gian" },
  { value: "1-3", label: "1-3 ngày", min: 1, max: 3 },
  { value: "4-7", label: "4-7 ngày", min: 4, max: 7 },
  { value: "8-14", label: "8-14 ngày", min: 8, max: 14 },
  { value: "15+", label: "> 14 ngày", min: 15, max: null },
];

const ratingOptions = [
  { value: "all", label: "Tất cả" },
  { value: 4.5, label: "Từ 4.5 sao" },
  { value: 4, label: "Từ 4 sao" },
  { value: 3.5, label: "Từ 3.5 sao" },
  { value: 3, label: "Từ 3 sao" },
];

const sortOptions = [
  { value: "rating_desc", label: "Phổ biến nhất" }, // Default to rating desc
  { value: "price_asc", label: "Giá thấp đến cao" },
  { value: "price_desc", label: "Giá cao đến thấp" },
  { value: "duration_asc", label: "Thời gian ngắn nhất" },
  { value: "duration_desc", label: "Thời gian dài nhất" },
  { value: "reviews_desc", label: "Nhiều đánh giá nhất" },
  { value: "created_at_desc", label: "Mới nhất" },
];

const difficultyOptions = [
  { value: "all", label: "Mọi cấp độ" },
  { value: "easy", label: "Dễ" },
  { value: "moderate", label: "Trung bình" },
  { value: "challenging", label: "Thử thách" },
  { value: "extreme", label: "Khó" },
];

// --- Default State Values ---
const DEFAULT_FILTERS = {
  location: "",
  keyword: "",
  region: "all",
  type: "all",
  price_range: "all", // Thay đổi từ min_price/max_price sang price_range
  min_rating: "all",
  duration_min: null,
  duration_max: null,
  difficulty_level: "all",
  start_date: null, // Thêm filter theo ngày khởi hành
  page: 1,
  limit: 9,
};

const DEFAULT_SORT_BY = "rating_desc"; // Default sort

// --- Main Component ---
const Tours = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sortBy, setSortBy] = useState(DEFAULT_SORT_BY);
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availableTypes, setAvailableTypes] = useState([]); // Dynamic tour types from DB
  const [pagination, setPagination] = useState({
    page: 1,
    total_pages: 1,
    total: 0,
  });
  const [collapse, setCollapse] = useState({
    // State for sidebar collapse sections
    price: false,
    type: false,
    region: false,
    duration: false,
    rating: false,
    difficulty: false,
  });
  const [showMobileFilter, setShowMobileFilter] = useState(false); // For mobile filter display
  const resultsContainerRef = useRef(null);
  const sidebarRef = useRef(null); // Ref for the sidebar/mobile filter
  const isInitialMount = useRef(true); // Track initial mount

  // States for search params (separate from filters)
  const [searchParams, setSearchParams] = useState({
    destination: "",
    departure_date: "",
    participants: {
      adults: 2,
      children: 0,
      infants: 0,
    },
  });
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showLocationSuggest, setShowLocationSuggest] = useState(false);
  const [loadingLocationSuggest, setLoadingLocationSuggest] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const participantsModalRef = useRef(null);
  const [tourSuggestions, setTourSuggestions] = useState([]);
  const [showTourSuggestions, setShowTourSuggestions] = useState(false);
  const [loadingTourSuggestions, setLoadingTourSuggestions] = useState(false);
  const tourSuggestionsRef = useRef(null);

  // State cho available dates
  const [availableDates, setAvailableDates] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loadingDates, setLoadingDates] = useState(false);
  const datePickerRef = useRef(null);

  // Read URL search params on mount and set to search input
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get("search");

    if (searchQuery) {
      setSearchParams((prev) => ({
        ...prev,
        destination: searchQuery,
      }));
      // Tự động trigger search khi có URL param
      setFilters((prev) => ({
        ...prev,
        location: searchQuery,
      }));
      setHasSearched(true);
    }
  }, []); // Run only once on mount

  // Close participants modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        participantsModalRef.current &&
        !participantsModalRef.current.contains(event.target)
      ) {
        setShowParticipantsModal(false);
      }
    };

    if (showParticipantsModal) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showParticipantsModal]);

  // --- Data Fetching ---
  // Fetch available tour types from DB
  const fetchAvailableTypes = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/tours/available-types`);
      setAvailableTypes(res.data.types || []);
    } catch (err) {
      console.error("[DEBUG] Error fetching available types:", err);
      setAvailableTypes([]);
    }
  };

  const fetchTours = async (
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

      // Add filters to params if they are not default values
      if (currentFilters.location) params.location = currentFilters.location;
      if (currentFilters.keyword) params.keyword = currentFilters.keyword;
      if (currentFilters.region !== "all")
        params.region = currentFilters.region;
      if (currentFilters.type !== "all") params.type = currentFilters.type;

      // Handle price_range filter
      if (currentFilters.price_range && currentFilters.price_range !== "all") {
        const priceRange = priceRangeOptions.find(
          (opt) => opt.value === currentFilters.price_range
        );
        if (priceRange) {
          if (priceRange.min > 0) params.min_price = priceRange.min;
          if (priceRange.max !== null) params.max_price = priceRange.max;
        }
      }

      if (currentFilters.min_rating !== "all")
        params.min_rating = parseFloat(currentFilters.min_rating);
      if (currentFilters.duration_min !== null)
        params.duration_min = currentFilters.duration_min;
      if (currentFilters.duration_max !== null)
        params.duration_max = currentFilters.duration_max;
      if (
        currentFilters.difficulty_level &&
        currentFilters.difficulty_level !== "all"
      )
        params.difficulty_level = currentFilters.difficulty_level;
      if (currentFilters.start_date)
        params.start_date = currentFilters.start_date; // Thêm filter theo ngày

      // Add sorting parameters
      const [sortField, sortOrder] = currentSortBy.split("_");
      params.sort_by = sortField;
      params.sort_order = sortOrder || "desc"; // Default to desc if order not specified

      console.debug("[DEBUG] Calling API /api/tours with params:", params);
      const res = await axios.get(`${API_URL}/api/tours`, { params });
      console.debug("[DEBUG] API Response /api/tours:", res.data);

      if (res.data && res.data.tours && res.data.pagination) {
        setTours(res.data.tours);
        setPagination(res.data.pagination);
      } else {
        // Handle cases where the structure might be different or empty
        setTours(res.data?.tours || []);
        setPagination(
          res.data?.pagination || { page: 1, total_pages: 1, total: 0 }
        );
        if (!res.data?.tours || res.data.tours.length === 0) {
          console.log("No tours found matching criteria.");
          // Optionally set an error or message state here if needed
        }
      }
    } catch (err) {
      console.error("[DEBUG] Error fetching tours:", err);
      setError(
        `Failed to load tours: ${
          err.response?.data?.error || err.message
        }. Please try again.`
      );
      setTours([]);
      setPagination({ page: 1, total_pages: 1, total: 0 });
    } finally {
      setLoading(false);
    }
  };

  // Fetch location suggestions (improved following Transport pattern)
  const fetchLocationSuggestions = async (q) => {
    if (!q || q.trim().length < 2) {
      setLocationSuggestions([]);
      setShowLocationSuggest(false);
      return;
    }

    setLoadingLocationSuggest(true);
    try {
      const res = await axios.get(`${API_URL}/api/tours/locations/suggest`, {
        params: { q: q.trim() },
      });

      console.debug("[DEBUG] Location suggestions response:", res.data);

      // Backend returns { locations: [...] } - array of strings
      const suggestions = res.data.locations || [];

      setLocationSuggestions(suggestions.slice(0, 10)); // Limit to 10
      setShowLocationSuggest(suggestions.length > 0);
    } catch (err) {
      setLocationSuggestions([]);
      setShowLocationSuggest(false);
      console.error("[DEBUG] Lỗi gợi ý địa điểm:", err);
    } finally {
      setLoadingLocationSuggest(false);
    }
  };

  // Fetch tour suggestions (khi click vào ô tìm kiếm)
  const fetchTourSuggestions = async (q = "") => {
    setLoadingTourSuggestions(true);
    try {
      const res = await axios.get(`${API_URL}/api/tours/suggestions`, {
        params: { q: q.trim() },
      });

      const suggestions = res.data.suggestions || [];
      setTourSuggestions(suggestions);
      setShowTourSuggestions(true);
    } catch (err) {
      setTourSuggestions([]);
      setShowTourSuggestions(false);
      console.error("[DEBUG] Lỗi gợi ý tours:", err);
    } finally {
      setLoadingTourSuggestions(false);
    }
  };

  // Fetch available dates dựa trên location đã chọn
  const fetchAvailableDates = async () => {
    if (!searchParams.destination || !searchParams.destination.trim()) {
      setAvailableDates([]);
      return;
    }

    setLoadingDates(true);
    try {
      const res = await axios.get(`${API_URL}/api/tours/available-dates`, {
        params: {
          location: searchParams.destination.trim(),
          type: filters.type !== "all" ? filters.type : undefined,
        },
      });

      console.debug("[DEBUG] Available dates response:", res.data);

      const dates = res.data.dates || [];

      // Ensure uniqueness by date (in case backend returns duplicates)
      const uniqueDates = Array.from(
        new Map(dates.map((item) => [item.date || item, item])).values()
      );

      setAvailableDates(uniqueDates);
    } catch (err) {
      setAvailableDates([]);
      console.error("[DEBUG] Lỗi lấy ngày khả dụng:", err);
    } finally {
      setLoadingDates(false);
    }
  };

  // --- Effects ---
  // Fetch all tours and available types on initial load
  useEffect(() => {
    fetchTours(filters, sortBy);
    fetchAvailableTypes(); // Fetch dynamic tour types
    isInitialMount.current = false; // Mark as mounted
  }, []); // Only run once on mount

  // Fetch when filters or sort change (after initial mount)
  useEffect(() => {
    // Skip lần mount đầu tiên (đã được handle bởi useEffect trên)
    if (isInitialMount.current) {
      return;
    }

    // Fetch tours với filters hiện tại (không cần check hasSearched)
    fetchTours(filters, sortBy);

    // KHÔNG tự động scroll khi thay đổi filter
    // Chỉ scroll khi user click "Tìm tour" (được handle trong handleSearch)
  }, [
    filters.page,
    filters.region,
    filters.type,
    filters.price_range, // Thay min_price/max_price bằng price_range
    filters.min_rating,
    filters.duration_min,
    filters.duration_max,
    filters.difficulty_level,
    filters.start_date, // Thêm start_date vào dependency
    sortBy,
  ]); // All filters and sort

  // Effect for closing mobile filter when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        // Add a check to ensure the click wasn't on the toggle button itself
        if (
          !event.target.closest ||
          !event.target.closest("#mobile-filter-toggle")
        ) {
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

  // Cleanup debounce timer on component unmount
  useEffect(() => {
    return () => {
      if (locationDebounceRef.current) {
        clearTimeout(locationDebounceRef.current);
      }
    };
  }, []);

  // Close tour suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        tourSuggestionsRef.current &&
        !tourSuggestionsRef.current.contains(event.target)
      ) {
        setShowTourSuggestions(false);
      }
    };

    if (showTourSuggestions) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showTourSuggestions]);

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target)
      ) {
        setShowDatePicker(false);
      }
    };

    if (showDatePicker) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDatePicker]);

  // --- Handlers ---
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
      page: 1, // Reset page number when filters change
    }));
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    setFilters((prev) => ({ ...prev, page: 1 })); // Reset page when sort changes
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      setFilters((prev) => ({ ...prev, page: newPage }));

      // Scroll to results khi chuyển trang
      setTimeout(() => {
        resultsContainerRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  };

  const handleDurationChange = (value) => {
    const selectedOption = durationOptions.find((opt) => opt.value === value);
    // Backend expects duration in days, but DB stores in minutes
    // So we send days directly to backend
    setFilters((prev) => ({
      ...prev,
      duration_min: selectedOption?.min ?? null,
      duration_max: selectedOption?.max ?? null,
      page: 1,
    }));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSortBy(DEFAULT_SORT_BY);
    setSearchParams({
      destination: "",
      departure_date: "",
      participants: {
        adults: 2,
        children: 0,
        infants: 0,
      },
    });
    setHasSearched(false);
    setError(null);
    // Don't automatically hide mobile filter on reset
  };

  const handleSelectTour = (tourId) => {
    if (tourId) {
      navigate(`/tours/${tourId}`);
    } else {
      console.error("Invalid tour ID for navigation:", tourId);
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();

    // Validation - chỉ yêu cầu điểm đến
    if (!searchParams.destination || !searchParams.destination.trim()) {
      setError("Vui lòng nhập điểm đến để tìm kiếm");
      return;
    }

    // Clear error
    setError(null);

    // Reset về filters mặc định, giữ destination và departure_date từ search
    const newFilters = {
      ...DEFAULT_FILTERS,
      location: searchParams.destination,
      start_date: searchParams.departure_date || null, // Thêm filter theo ngày khởi hành
      page: 1,
    };

    setFilters(newFilters);
    setHasSearched(true);
    setShowLocationSuggest(false);
    setShowParticipantsModal(false);

    // Gọi API tìm kiếm ngay lập tức
    await fetchTours(newFilters, sortBy);

    // Scroll to results after a short delay
    setTimeout(() => {
      resultsContainerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  // Debounce timer ref for location autocomplete
  const locationDebounceRef = useRef(null);

  const handleSearchInputChange = (field, value) => {
    setSearchParams((prev) => ({ ...prev, [field]: value }));

    if (field === "destination") {
      // Clear previous debounce timer
      if (locationDebounceRef.current) {
        clearTimeout(locationDebounceRef.current);
      }

      if (value && value.trim().length >= 2) {
        setLoadingLocationSuggest(true);
        setShowLocationSuggest(true);
        // Debounce API call by 300ms
        locationDebounceRef.current = setTimeout(() => {
          fetchLocationSuggestions(value);
        }, 300);
      } else {
        setLocationSuggestions([]);
        setShowLocationSuggest(false);
        setLoadingLocationSuggest(false);
      }
    }
  };

  const handleLocationSelect = (location) => {
    setSearchParams((prev) => ({ ...prev, destination: location }));
    setLocationSuggestions([]);
    setShowLocationSuggest(false);
  };

  const handleParticipantChange = (type, operation) => {
    setSearchParams((prev) => {
      const current = prev.participants[type];
      let newValue = current;

      if (operation === "add") {
        newValue = current + 1;
      } else if (operation === "subtract") {
        newValue = Math.max(type === "adults" ? 1 : 0, current - 1);
      }

      // Validate total participants
      const newParticipants = { ...prev.participants, [type]: newValue };
      const total =
        newParticipants.adults +
        newParticipants.children +
        newParticipants.infants;

      if (total > 20) {
        return prev; // Don't update if exceeds limit
      }

      return {
        ...prev,
        participants: newParticipants,
      };
    });
  };

  // --- Helper Functions ---
  const getRegionLabel = (regionId) => {
    const option = regionOptions.find((opt) => opt.value === regionId);
    return option ? option.label : regionId;
  };

  const getTypeLabel = (type) => {
    const labels = {
      domestic: "Tour trong nước",
      international: "Tour quốc tế",
      adventure: "Tour mạo hiểm",
      cultural: "Tour văn hóa",
      beach: "Tour biển",
      mountain: "Tour núi",
    };
    return labels[type] || type;
  };

  const getTypeBadgeColor = (type) => {
    const colors = {
      domestic: "bg-blue-50 text-blue-700",
      international: "bg-purple-50 text-purple-700",
      adventure: "bg-orange-50 text-orange-700",
      cultural: "bg-red-50 text-red-700",
      beach: "bg-cyan-50 text-cyan-700",
      mountain: "bg-emerald-50 text-emerald-700",
    };
    return colors[type] || "bg-gray-50 text-gray-700";
  };

  const getDaysRemaining = (endDate) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = Math.abs(end - today);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDuration = (duration) => {
    // Duration is stored as DAYS in database (not minutes)
    if (!duration || duration === 0) return "0 ngày";

    // Convert to number if it's a string
    const days = typeof duration === "string" ? parseInt(duration) : duration;

    if (isNaN(days)) return "0 ngày";

    // If duration is less than 1, assume it's in days with decimal (e.g., 0.5 days = 12 hours)
    if (days < 1) {
      const hours = Math.round(days * 24);
      return `${hours} giờ`;
    }

    return `${days} ngày`;
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

      {/* --- Filter Sections --- */}

      {/* Price Range */}
      <div className="sidebar-section pb-6 mb-6">
        <div
          className="flex justify-between items-center cursor-pointer mb-3"
          onClick={() => setCollapse((c) => ({ ...c, price: !c.price }))}
        >
          <h4 className="text-md font-semibold text-gray-800">Mức giá</h4>
          <ChevronDown
            className={`transition-transform ${
              collapse.price ? "rotate-180" : ""
            }`}
            size={20}
          />
        </div>
        {!collapse.price && (
          <div className="space-y-2 animate-fade-in">
            {priceRangeOptions.map((option) => (
              <label
                key={option.value}
                className={`flex items-center space-x-3 cursor-pointer p-2 rounded-lg transition-all ${
                  filters.price_range === option.value
                    ? "bg-emerald-50 text-emerald-900"
                    : "hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="priceRange"
                  value={option.value}
                  checked={filters.price_range === option.value}
                  onChange={(e) =>
                    handleFilterChange("price_range", e.target.value)
                  }
                  className="form-radio h-4 w-4 border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="flex items-center gap-2">
                  <DollarSign
                    size={16}
                    className={
                      filters.price_range === option.value
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

      {/* Tour Type - Dynamic from DB */}
      <div className="sidebar-section pb-6 mb-6">
        <div
          className="flex justify-between items-center cursor-pointer mb-3"
          onClick={() => setCollapse((c) => ({ ...c, type: !c.type }))}
        >
          <h4 className="text-md font-semibold text-gray-800">
            Loại hình tour
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
            {/* Tất cả */}
            <label
              className={`flex items-center space-x-3 cursor-pointer p-2 rounded-lg transition-all ${
                filters.type === "all"
                  ? "bg-emerald-50 text-emerald-900"
                  : "hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="tourType"
                value="all"
                checked={filters.type === "all"}
                onChange={(e) => handleFilterChange("type", e.target.value)}
                className="form-radio h-4 w-4 border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <div
                className={`flex items-center gap-2 ${
                  filters.type === "all" ? "text-emerald-900" : "text-gray-600"
                }`}
              >
                <Tag
                  size={18}
                  className={
                    filters.type === "all"
                      ? "text-emerald-600"
                      : "text-gray-400"
                  }
                />
                <span className="text-sm">Tất cả loại hình</span>
              </div>
            </label>

            {/* Dynamic types from DB */}
            {availableTypes.map((type) => {
              const IconComponent = typeIconsMap[type] || Tag;
              const label = typeLabelsMap[type] || type;
              return (
                <label
                  key={type}
                  className={`flex items-center space-x-3 cursor-pointer p-2 rounded-lg transition-all ${
                    filters.type === type
                      ? "bg-emerald-50 text-emerald-900"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="tourType"
                    value={type}
                    checked={filters.type === type}
                    onChange={(e) => handleFilterChange("type", e.target.value)}
                    className="form-radio h-4 w-4 border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div
                    className={`flex items-center gap-2 ${
                      filters.type === type
                        ? "text-emerald-900"
                        : "text-gray-600"
                    }`}
                  >
                    <IconComponent
                      size={18}
                      className={
                        filters.type === type
                          ? "text-emerald-600"
                          : "text-gray-400"
                      }
                    />
                    <span className="text-sm">{label}</span>
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Region */}
      <div className="sidebar-section pb-6 mb-6">
        <div
          className="flex justify-between items-center cursor-pointer mb-3"
          onClick={() => setCollapse((c) => ({ ...c, region: !c.region }))}
        >
          <h4 className="text-md font-semibold text-gray-800">Khu vực</h4>
          <ChevronDown
            className={`transition-transform ${
              collapse.region ? "rotate-180" : ""
            }`}
            size={20}
          />
        </div>
        {!collapse.region && (
          <div className="space-y-2 animate-fade-in">
            {regionOptions.map((option) => (
              <label
                key={option.value}
                className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-emerald-50"
              >
                <input
                  type="radio"
                  name="tourRegion"
                  value={option.value}
                  checked={filters.region === option.value}
                  onChange={(e) => handleFilterChange("region", e.target.value)}
                  className="form-radio text-emerald-600 h-4 w-4 border-gray-300 focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Duration */}
      <div className="sidebar-section pb-6 mb-6">
        <div
          className="flex justify-between items-center cursor-pointer mb-3"
          onClick={() => setCollapse((c) => ({ ...c, duration: !c.duration }))}
        >
          <h4 className="text-md font-semibold text-gray-800">Thời gian</h4>
          <ChevronDown
            className={`transition-transform ${
              collapse.duration ? "rotate-180" : ""
            }`}
            size={20}
          />
        </div>
        {!collapse.duration && (
          <div className="space-y-2 animate-fade-in">
            {durationOptions.map((option) => (
              <label
                key={option.value}
                className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-emerald-50"
              >
                <input
                  type="radio"
                  name="tourDuration"
                  value={option.value}
                  // Check based on calculated min/max values
                  checked={
                    (filters.duration_min === option.min &&
                      filters.duration_max === option.max) ||
                    (option.value === "all" &&
                      filters.duration_min === null &&
                      filters.duration_max === null)
                  }
                  onChange={(e) => handleDurationChange(e.target.value)}
                  className="form-radio text-emerald-600 h-4 w-4 border-gray-300 focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Rating */}
      <div className="sidebar-section pb-6 mb-6">
        <div
          className="flex justify-between items-center cursor-pointer mb-3"
          onClick={() => setCollapse((c) => ({ ...c, rating: !c.rating }))}
        >
          <h4 className="text-md font-semibold text-gray-800">Đánh giá</h4>
          <ChevronDown
            className={`transition-transform ${
              collapse.rating ? "rotate-180" : ""
            }`}
            size={20}
          />
        </div>
        {!collapse.rating && (
          <div className="space-y-2 animate-fade-in">
            {ratingOptions.map((option) => (
              <label
                key={option.value}
                className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-emerald-50"
              >
                <input
                  type="radio"
                  name="tourRating"
                  value={option.value}
                  checked={String(filters.min_rating) === String(option.value)}
                  onChange={(e) =>
                    handleFilterChange("min_rating", e.target.value)
                  }
                  className="form-radio text-emerald-600 h-4 w-4 border-gray-300 focus:ring-emerald-500"
                />
                <Star size={16} className="text-yellow-400 fill-current" />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Difficulty Level */}
      <div className="sidebar-section pb-6 mb-6">
        <div
          className="flex justify-between items-center cursor-pointer mb-3"
          onClick={() =>
            setCollapse((c) => ({ ...c, difficulty: !c.difficulty }))
          }
        >
          <h4 className="text-md font-semibold text-gray-800">Độ khó</h4>
          <ChevronDown
            className={`transition-transform ${
              collapse.difficulty ? "rotate-180" : ""
            }`}
            size={20}
          />
        </div>
        {!collapse.difficulty && (
          <div className="space-y-2 animate-fade-in">
            {difficultyOptions.map((option) => (
              <label
                key={option.value}
                className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-emerald-50"
              >
                <input
                  type="radio"
                  name="tourDifficulty"
                  value={option.value}
                  checked={filters.difficulty_level === option.value}
                  onChange={(e) =>
                    handleFilterChange("difficulty_level", e.target.value)
                  }
                  className="form-radio text-emerald-600 h-4 w-4 border-gray-300 focus:ring-emerald-500"
                />
                {/* Optional: Add icons for difficulty */}
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </aside>
  );

  // --- Tour Card Component ---
  const TourCard = ({ tour }) => {
    // Debug log để kiểm tra giá trị price
    console.debug("[DEBUG] Tour Card - Tour data:", {
      id: tour.id,
      title: tour.title,
      price: tour.price,
      priceType: typeof tour.price,
      discounted_price: tour.discounted_price,
      discountedPriceType: typeof tour.discounted_price,
    });

    const isPromo = tour.promotions && tour.promotions.length > 0;
    const daysRemaining = isPromo
      ? getDaysRemaining(tour.promotions[0].end_date)
      : null;

    // Format schedule info
    const getScheduleHighlights = (schedules) => {
      if (!schedules || schedules.length === 0) {
        return null;
      }

      const highlights = {
        totalDays: schedules.length,
        startPoint: schedules[0]?.title,
        endPoint: schedules[schedules.length - 1]?.title,
        transportation: [
          ...new Set(schedules.map((s) => s.transportation).filter(Boolean)),
        ],
        accommodation: [
          ...new Set(schedules.map((s) => s.accommodation).filter(Boolean)),
        ],
        meals: [...new Set(schedules.map((s) => s.meals).filter(Boolean))],
      };

      return highlights;
    };

    const scheduleInfo = getScheduleHighlights(tour.schedules);

    // Format difficulty level
    const getDifficultyLabel = (level) => {
      const labels = {
        easy: "Dễ",
        moderate: "Trung bình",
        challenging: "Thử thách",
        difficult: "Khó",
      };
      return labels[level] || level;
    };

    // Format tour type
    const getTypeIcon = (type) => {
      switch (type) {
        case "domestic":
          return <MapPin size={16} className="text-blue-500" />;
        case "international":
          return <Compass size={16} className="text-purple-500" />;
        case "adventure":
          return <Mountain size={16} className="text-orange-500" />;
        case "cultural":
          return <Landmark size={16} className="text-red-500" />;
        case "beach":
          return <Waves size={16} className="text-cyan-500" />;
        case "mountain":
          return <Mountain size={16} className="text-emerald-500" />;
        default:
          return <Tag size={16} className="text-gray-500" />;
      }
    };

    return (
      <div
        key={tour.id}
        className={`tour-card rounded-xl overflow-hidden transition-all duration-300 relative ${
          isPromo
            ? "promo-tour-card"
            : "bg-white border border-gray-100 shadow-md hover:shadow-lg"
        }`}
      >
        {/* Tag khuyến mãi */}
        {isPromo && (
          <>
            <div className="absolute top-0 right-0 z-30 px-4 py-1 bg-orange-500 text-white font-bold text-sm rounded-bl-2xl shadow-md flex items-center gap-1">
              <Tag size={14} />
              {tour.promotions[0].type === "percentage"
                ? `-${tour.promotions[0].discount}%`
                : `-${formatPrice(tour.promotions[0].discount)}`}
            </div>
            <div className="absolute top-0 left-0 z-20 flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-orange-400 to-orange-300 text-white font-bold rounded-br-2xl shadow-md">
              <Star size={14} className="fill-current" />
              <span>{tour.promotions[0].title || "Khuyến mãi HOT"}</span>
            </div>
          </>
        )}

        <div className="flex flex-col lg:flex-row">
          {/* Left Column: Image */}
          <div className="lg:w-1/3 relative">
            <div className="relative h-64 lg:h-full">
              <img
                src={getImageUrl(tour.image)}
                alt={tour.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = PLACEHOLDER_IMAGE;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>

            {/* Tour Type Badge */}
            <div
              className={`absolute bottom-3 left-3 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 ${getTypeBadgeColor(
                tour.type
              )}`}
            >
              {getTypeIcon(tour.type)}
              <span>{getTypeLabel(tour.type)}</span>
            </div>
          </div>

          {/* Right Column: Content */}
          <div className="lg:w-2/3 p-6 pt-10">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {tour.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-gray-500" />
                    <span className="text-gray-600">
                      {tour.location}
                      {tour.destination_name && ` - ${tour.destination_name}`}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  {isPromo ? (
                    <>
                      <div className="text-2xl font-bold text-orange-600">
                        {formatPrice(tour.discounted_price)}
                      </div>
                      <div className="flex flex-col items-end">
                        <p className="text-sm text-gray-400 line-through">
                          {formatPrice(tour.price)}
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
                      {formatPrice(tour.price)}
                    </div>
                  )}
                  <p className="text-sm text-gray-500">/người</p>
                </div>
              </div>

              {/* Details Row */}
              <div className="flex flex-wrap items-center gap-4 mb-4">
                {/* Rating */}
                {tour.rating > 0 && (
                  <div className="flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg">
                    <Star
                      size={16}
                      className="text-yellow-500 fill-yellow-500"
                    />
                    <span className="font-medium text-gray-700">
                      {Number(tour.rating).toFixed(1)}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({tour.review_count || 0})
                    </span>
                  </div>
                )}

                {/* Duration */}
                <div className="flex items-center gap-1.5 text-gray-600">
                  <Clock size={16} />
                  <span>{formatDuration(tour.duration)}</span>
                </div>

                {/* Group Size */}
                <div className="flex items-center gap-1.5 text-gray-600">
                  <Users size={16} />
                  <span>{tour.group_size || "10-15"} khách</span>
                </div>

                {/* Difficulty */}
                {tour.difficulty_level && (
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Mountain size={16} />
                    <span>{getDifficultyLabel(tour.difficulty_level)}</span>
                  </div>
                )}

                {/* Region */}
                {tour.region && (
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Compass size={16} />
                    <span>{getRegionLabel(tour.region)}</span>
                  </div>
                )}
              </div>

              {/* Schedule Highlights */}
              {scheduleInfo && (
                <div className="mb-4">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarCheck size={16} className="text-emerald-500" />
                      <span className="font-medium text-gray-900">
                        {formatDuration(tour.duration)}
                      </span>
                    </div>

                    {scheduleInfo.startPoint && scheduleInfo.endPoint && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin size={16} className="text-emerald-500" />
                        <span className="text-gray-500">Hành trình: </span>
                        <span className="font-medium text-gray-900">
                          {scheduleInfo.startPoint}
                          <span className="mx-2 text-gray-400">→</span>
                          {scheduleInfo.endPoint}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {scheduleInfo.transportation?.length > 0 && (
                      <div className="flex items-start gap-2 bg-gray-50 p-2 rounded-lg">
                        <Car
                          size={16}
                          className="text-emerald-500 mt-1 flex-shrink-0"
                        />
                        <div className="text-sm">
                          <span className="text-gray-500">Di chuyển: </span>
                          <span className="font-medium text-gray-900">
                            {scheduleInfo.transportation.join(", ")}
                          </span>
                        </div>
                      </div>
                    )}

                    {scheduleInfo.accommodation?.length > 0 && (
                      <div className="flex items-start gap-2 bg-gray-50 p-2 rounded-lg">
                        <Hotel
                          size={16}
                          className="text-emerald-500 mt-1 flex-shrink-0"
                        />
                        <div className="text-sm">
                          <span className="text-gray-500">Nghỉ dưỡng: </span>
                          <span className="font-medium text-gray-900">
                            {scheduleInfo.accommodation.join(", ")}
                          </span>
                        </div>
                      </div>
                    )}

                    {scheduleInfo.meals?.length > 0 && (
                      <div className="flex items-start gap-2 bg-gray-50 p-2 rounded-lg">
                        <Utensils
                          size={16}
                          className="text-emerald-500 mt-1 flex-shrink-0"
                        />
                        <div className="text-sm">
                          <span className="text-gray-500">Ẩm thực: </span>
                          <span className="font-medium text-gray-900">
                            {scheduleInfo.meals.join(", ")}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Services */}
              <div className="flex flex-wrap gap-3 mb-4">
                {tour.included_services &&
                  tour.included_services.slice(0, 3).map((service, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-full text-sm text-gray-700 transition-colors"
                    >
                      <Check size={14} className="text-emerald-600" />
                      <span>{service}</span>
                    </div>
                  ))}
                {tour.included_services &&
                  tour.included_services.length > 3 && (
                    <span className="text-sm text-gray-500">
                      +{tour.included_services.length - 3} dịch vụ khác
                    </span>
                  )}
              </div>

              {/* Footer */}
              <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {tour.start_dates && tour.start_dates.length > 0 && (
                    <div className="text-sm text-gray-600 flex items-center gap-1">
                      <Calendar size={16} className="text-emerald-500" />
                      <span>{tour.start_dates.length} lịch khởi hành</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectTour(tour.id);
                  }}
                  className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm text-sm font-medium flex items-center gap-2"
                >
                  <span>Xem chi tiết</span>
                  <ChevronDown className="w-4 h-4 transform -rotate-90" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Promotion Description */}
        {isPromo && tour.promotions[0].description && (
          <div className="px-6 py-3 bg-orange-50/50 border-t border-orange-100">
            <p className="text-sm text-gray-600">
              <span className="font-medium text-orange-600">Ưu đãi: </span>
              {tour.promotions[0].description}
            </p>
          </div>
        )}
      </div>
    );
  };

  // --- Main Render ---
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* CSS Styles */}
      <style>{`
        /* Custom styling for date inputs */
        .date-input-custom::-webkit-calendar-picker-indicator {
          opacity: 0;
          position: absolute;
          top: 0;
          right: 0;
          width: 100%;
          height: 100%;
          cursor: pointer;
        }

        /* Animation for fade in */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out forwards;
        }
        
        /* Card hover effect */
        .tour-card {
          transition: all 0.3s ease;
        }
        .tour-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }

        /* Promo tour card đặc biệt */
        .promo-tour-card {
          box-shadow: 0 8px 32px -8px #fb923c99, 0 2px 8px -2px #fb923c33;
          border-radius: 1.2rem;
          border-width: 2px;
          border-color: #fb923c;
          background: linear-gradient(90deg, #fff7ed 60%, #ffedd5 100%);
          position: relative;
        }
        .promo-tour-card:hover {
          box-shadow: 0 16px 40px -8px #fb923cbb, 0 4px 16px -2px #fb923c44;
          background: linear-gradient(90deg, #fff7ed 40%, #ffedd5 100%);
        }

        /* Custom scrollbar */
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

        /* Sidebar styles */
        .sidebar-filter { min-width: 270px; max-width: 320px; }
        @media (max-width: 1023px) { .sidebar-filter { display: none; } }
        .sidebar-section { border-bottom: 1px solid #f1f5f9; }
        .sidebar-section:last-child { border-bottom: none; }
        .sidebar-toggle { cursor: pointer; }

        /* Pulse animation for promo tag */
        @keyframes pulse-slow {
          50% { opacity: .7; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 py-16 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-transparent opacity-20"></div>{" "}
        <div className="container mx-auto px-4 relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight">
            Tour Du Lịch Việt Nam
          </h1>
          <p className="text-lg md:text-xl text-emerald-100 max-w-3xl">
            Khám phá vẻ đẹp bất tận, trải nghiệm văn hóa độc đáo và ẩm thực
            phong phú cùng các tour chọn lọc.
          </p>
        </div>
      </div>
      {/* Search Form */}
      <div className="container mx-auto px-4 -mt-8 relative z-20">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          {/* Hiển thị lỗi nếu có */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSearch}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 mb-4">
              {/* Điểm đến */}
              <div className="relative col-span-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Điểm đến
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchParams.destination}
                    onChange={(e) =>
                      handleSearchInputChange("destination", e.target.value)
                    }
                    onFocus={() => {
                      if (
                        searchParams.destination &&
                        searchParams.destination.trim() !== ""
                      ) {
                        fetchLocationSuggestions(searchParams.destination);
                      }
                    }}
                    onBlur={() =>
                      setTimeout(() => setShowLocationSuggest(false), 200)
                    }
                    className="w-full border border-gray-300 rounded-lg p-3 pl-4 pr-10 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors shadow-sm hover:border-emerald-300"
                    placeholder="Nhập điểm đến..."
                    autoComplete="off"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-emerald-600 bg-emerald-50 p-1 rounded-full">
                    <MapPin size={18} />
                  </div>
                  {/* Gợi ý địa điểm */}
                  {showLocationSuggest && locationSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto divide-y divide-gray-100 animate-fade-in">
                      {locationSuggestions.map((location, index) => (
                        <div
                          key={index}
                          className="px-4 py-3 hover:bg-emerald-50 cursor-pointer transition-colors flex items-center gap-3"
                          onClick={() => handleLocationSelect(location)}
                        >
                          <MapPin
                            size={18}
                            className="text-emerald-500 flex-shrink-0"
                          />
                          <span className="font-medium text-gray-800">
                            {location}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {loadingLocationSuggest && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 flex items-center justify-center">
                      <Loader
                        size={16}
                        className="animate-spin text-emerald-500 mr-2"
                      />
                      <span className="text-sm text-gray-500">
                        Đang tìm kiếm địa điểm...
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Ngày khởi hành */}
              <div className="relative col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày khởi hành{" "}
                  <span className="text-gray-400 text-xs">(Tùy chọn)</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        searchParams.destination &&
                        searchParams.destination.trim()
                      ) {
                        setShowDatePicker(!showDatePicker);
                        if (!showDatePicker && availableDates.length === 0) {
                          fetchAvailableDates();
                        }
                      } else {
                        setError("Vui lòng chọn điểm đến trước");
                        setTimeout(() => setError(null), 3000);
                      }
                    }}
                    className="w-full text-left border border-gray-300 rounded-lg p-3 pl-4 pr-10 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors shadow-sm hover:border-emerald-300 bg-white"
                  >
                    {searchParams.departure_date
                      ? new Date(
                          searchParams.departure_date
                        ).toLocaleDateString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })
                      : "Chọn ngày khởi hành..."}
                  </button>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-emerald-600 bg-emerald-50 p-1 rounded-full pointer-events-none">
                    <CalendarDays size={18} />
                  </div>

                  {/* Date Picker Dropdown */}
                  {showDatePicker && (
                    <div
                      ref={datePickerRef}
                      className="absolute z-50 mt-2 w-full bg-white rounded-lg shadow-xl border border-gray-200 max-h-80 overflow-y-auto animate-fade-in"
                    >
                      {loadingDates ? (
                        <div className="p-4 flex items-center justify-center">
                          <Loader
                            size={20}
                            className="animate-spin text-emerald-500 mr-2"
                          />
                          <span className="text-sm text-gray-500">
                            Đang tải ngày khả dụng...
                          </span>
                        </div>
                      ) : !searchParams.destination ||
                        !searchParams.destination.trim() ? (
                        <div className="p-4 text-center text-gray-500">
                          <CalendarDays
                            size={32}
                            className="mx-auto mb-2 text-gray-300"
                          />
                          <p className="text-sm">
                            Vui lòng chọn điểm đến trước
                          </p>
                        </div>
                      ) : availableDates.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                          {availableDates.map((dateItem, index) => {
                            const date = dateItem.date || dateItem;
                            const availableSeats =
                              dateItem.available_seats || 0;
                            const isDisabled = availableSeats === 0;
                            const dateObj = new Date(date);
                            const isSelected =
                              searchParams.departure_date === date;

                            return (
                              <button
                                key={date}
                                type="button"
                                onClick={() => {
                                  if (!isDisabled) {
                                    handleSearchInputChange(
                                      "departure_date",
                                      date
                                    );
                                    setShowDatePicker(false);
                                  }
                                }}
                                disabled={isDisabled}
                                className={`w-full text-left px-4 py-3 transition-colors flex items-center justify-between ${
                                  isDisabled
                                    ? "bg-gray-50 cursor-not-allowed opacity-50"
                                    : isSelected
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "hover:bg-emerald-50"
                                }`}
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  <CalendarDays
                                    size={16}
                                    className={
                                      isDisabled
                                        ? "text-gray-300"
                                        : isSelected
                                        ? "text-emerald-600"
                                        : "text-gray-400"
                                    }
                                  />
                                  <div className="flex-1">
                                    <div
                                      className={`font-medium ${
                                        isDisabled
                                          ? "text-gray-400"
                                          : "text-gray-800"
                                      }`}
                                    >
                                      {dateObj.toLocaleDateString("vi-VN", {
                                        weekday: "long",
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                      })}
                                    </div>
                                    {typeof dateItem === "object" && (
                                      <div className="flex items-center gap-2 mt-1">
                                        <span
                                          className={`text-xs ${
                                            isDisabled
                                              ? "text-red-500"
                                              : availableSeats < 5
                                              ? "text-orange-600"
                                              : "text-emerald-600"
                                          }`}
                                        >
                                          {isDisabled
                                            ? "Hết chỗ"
                                            : `Còn ${availableSeats} chỗ`}
                                        </span>
                                        {dateItem.tour_count > 1 && (
                                          <span className="text-xs text-gray-500">
                                            • {dateItem.tour_count} tour
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {isSelected && !isDisabled && (
                                  <div className="text-emerald-600">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-5 w-5"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-4 text-center text-gray-500">
                          <CalendarDays
                            size={32}
                            className="mx-auto mb-2 text-gray-300"
                          />
                          <p className="text-sm">Không có ngày khởi hành nào</p>
                          <p className="text-xs mt-1">cho điểm đến này</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Số người tham gia */}
              <div className="relative col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số người tham gia{" "}
                  <span className="text-gray-400 text-xs">(Tùy chọn)</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setShowParticipantsModal(!showParticipantsModal)
                    }
                    className="w-full text-left border border-gray-300 rounded-lg p-3 pl-4 pr-10 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors shadow-sm hover:border-emerald-300 bg-white"
                  >
                    {`${
                      searchParams.participants.adults +
                      searchParams.participants.children +
                      searchParams.participants.infants
                    } người`}
                  </button>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-emerald-600 bg-emerald-50 p-1 rounded-full">
                    <Users size={18} />
                  </div>

                  {/* Modal Số người tham gia */}
                  {showParticipantsModal && (
                    <div
                      ref={participantsModalRef}
                      className="absolute z-50 mt-2 w-full bg-white rounded-lg shadow-xl border border-gray-200 p-5 animate-fade-in"
                    >
                      {/* Người lớn */}
                      <div className="flex items-center justify-between mb-5">
                        <div>
                          <p className="font-medium text-gray-800">Người lớn</p>
                          <p className="text-sm text-gray-500">
                            Từ 13 tuổi trở lên
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              handleParticipantChange("adults", "subtract")
                            }
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={searchParams.participants.adults <= 1}
                          >
                            <span className="text-gray-600 font-bold">-</span>
                          </button>
                          <span className="w-8 text-center font-medium">
                            {searchParams.participants.adults}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleParticipantChange("adults", "add")
                            }
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
                          >
                            <span className="text-emerald-600 font-bold">
                              +
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Trẻ em */}
                      <div className="flex items-center justify-between mb-5">
                        <div>
                          <p className="font-medium text-gray-800">Trẻ em</p>
                          <p className="text-sm text-gray-500">5-12 tuổi</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              handleParticipantChange("children", "subtract")
                            }
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={searchParams.participants.children <= 0}
                          >
                            <span className="text-gray-600 font-bold">-</span>
                          </button>
                          <span className="w-8 text-center font-medium">
                            {searchParams.participants.children}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleParticipantChange("children", "add")
                            }
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
                          >
                            <span className="text-emerald-600 font-bold">
                              +
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Trẻ nhỏ */}
                      <div className="flex items-center justify-between mb-5">
                        <div>
                          <p className="font-medium text-gray-800">Trẻ nhỏ</p>
                          <p className="text-sm text-gray-500">Dưới 5 tuổi</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              handleParticipantChange("infants", "subtract")
                            }
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={searchParams.participants.infants <= 0}
                          >
                            <span className="text-gray-600 font-bold">-</span>
                          </button>
                          <span className="w-8 text-center font-medium">
                            {searchParams.participants.infants}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleParticipantChange("infants", "add")
                            }
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
                          >
                            <span className="text-emerald-600 font-bold">
                              +
                            </span>
                          </button>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-200 mt-3">
                        <button
                          type="button"
                          onClick={() => setShowParticipantsModal(false)}
                          className="w-full bg-emerald-100 text-emerald-700 font-medium py-2 rounded-lg hover:bg-emerald-200 transition-colors"
                        >
                          Xác nhận
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Nút tìm kiếm */}
              <div className="col-span-2 flex items-end">
                <button
                  type="submit"
                  className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 active:bg-emerald-800 transition-all transform active:scale-[0.99] shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader size={20} className="animate-spin" />
                      <span>Đang tìm...</span>
                    </>
                  ) : (
                    <>
                      <Search size={20} />
                      <span>Tìm tour</span>
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
          {/* Mobile Sort (Optional) */}
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
        {/* Content Layout (Sidebar + Results) */}
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
            {/* Results Header (Desktop Sort) */}
            <div className="hidden lg:flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-1">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader className="animate-spin" size={20} />
                      Đang tìm tour...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span className="text-emerald-600">
                        {pagination.total || 0}
                      </span>{" "}
                      tour phù hợp
                    </span>
                  )}
                </h2>
                {!loading && pagination.total > 0 && (
                  <div>
                    <p className="text-sm text-gray-500">
                      Trang {pagination.page} / {pagination.total_pages}
                    </p>
                    {/* Active filters */}
                    {hasSearched &&
                      (filters.location || filters.start_date) && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {filters.location && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs">
                              <MapPin size={12} />
                              {filters.location}
                            </span>
                          )}
                          {filters.start_date && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                              <CalendarDays size={12} />
                              {new Date(filters.start_date).toLocaleDateString(
                                "vi-VN",
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                }
                              )}
                            </span>
                          )}
                        </div>
                      )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <label
                  htmlFor="sort-by"
                  className="text-sm font-medium text-gray-600"
                >
                  Sắp xếp:
                </label>
                <div className="relative">
                  <select
                    id="sort-by"
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded-lg pl-3 pr-10 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer hover:border-emerald-400 transition-colors"
                  >
                    {sortOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                    size={16}
                  />
                </div>
              </div>
            </div>

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
            {!loading && !error && tours.length === 0 && (
              <div className="text-center text-gray-500 py-20">
                <Compass size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-xl font-semibold">
                  Không tìm thấy tour phù hợp.
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

            {/* Tours Grid */}
            {!loading && !error && tours.length > 0 && (
              <div className="space-y-6">
                {tours.map((tour) => (
                  <TourCard key={tour.id} tour={tour} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && !error && pagination.total_pages > 1 && (
              <div className="mt-8 flex justify-center pb-6">
                <div className="flex items-center gap-2">
                  {/* Previous Button */}
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1 || loading}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
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

                  {/* Page Numbers */}
                  {Array.from(
                    { length: Math.min(5, pagination.total_pages) },
                    (_, i) => {
                      let pageNum;
                      if (pagination.total_pages <= 5) {
                        // Nếu tổng số trang <= 5, hiển thị tất cả
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        // Nếu đang ở gần đầu, hiển thị 1-5
                        pageNum = i + 1;
                      } else if (
                        pagination.page >=
                        pagination.total_pages - 2
                      ) {
                        // Nếu đang ở gần cuối, hiển thị totalPages-4 đến totalPages
                        pageNum = pagination.total_pages - 4 + i;
                      } else {
                        // Ở giữa, hiển thị currentPage-2 đến currentPage+2
                        pageNum = pagination.page - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          disabled={loading}
                          className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
                            pagination.page === pageNum
                              ? "bg-emerald-600 text-white font-semibold"
                              : "border border-gray-300 hover:bg-emerald-50 text-gray-700"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                  )}

                  {/* Next Button */}
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={
                      pagination.page === pagination.total_pages || loading
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
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
          </div>{" "}
          {/* End Results Area */}
        </div>{" "}
        {/* End Content Layout */}
      </div>{" "}
      {/* End Main Content Area */}
    </div> // End Root Div
  );
};

export default Tours;
// --- END OF FILE index.js (Tours) ---
