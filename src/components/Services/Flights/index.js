// index.js flights

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plane,
  Calendar,
  Users,
  Search,
  Clock,
  Briefcase,
  Coffee,
  Wifi,
  Power,
  Monitor,
  ChevronDown,
  Loader,
  ArrowLeftRight,
  Wallet,
  Tag,
  Hotel,
  Map,
  Bus,
} from "lucide-react";
import axios from "axios";
import { API_URL, API_HOST } from "../../../config/api";
import PopularDestinations from "../../common/PopularDestinations";
import ServiceSuggestions from "../../common/ServiceSuggestions";

// Alias for backward compatibility
const API_BASE_URL = API_URL;

// Cấu hình URL cơ sở cho axios
// Cấu hình URL cơ sở cho axios - REMOVED to avoid double /api/api prefix globally
// axios.defaults.baseURL = API_BASE_URL;

// Dữ liệu mẫu cho các chuyến bay
const sampleFlights = [
  {
    id: "VN123",
    airline: "Vietnam Airlines",
    airlineLogo: "path_to_logo/vietnam_airlines.png",
    from: "Hà Nội",
    to: "Hồ Chí Minh",
    departureTime: "07:00",
    arrivalTime: "09:10",
    price: 1200000,
    duration: "2h 10m",
    seats: 45,
    baggage: {
      cabin: "7 kg",
      checked: "23 kg",
    },
    amenities: ["meal", "wifi", "power", "entertainment"],
    aircraft: "Airbus A321",
    flightNumber: "VN123",
  },
  {
    id: "VJ456",
    airline: "Vietjet Air",
    airlineLogo: "path_to_logo/vietjet.png",
    from: "Hà Nội",
    to: "Hồ Chí Minh",
    departureTime: "08:30",
    arrivalTime: "10:40",
    price: 850000,
    duration: "2h 10m",
    seats: 32,
    baggage: {
      cabin: "7 kg",
      checked: "20 kg",
    },
    amenities: ["meal"],
    aircraft: "Airbus A320",
    flightNumber: "VJ456",
  },
  {
    id: "BL789",
    airline: "Bamboo Airways",
    airlineLogo: "path_to_logo/bamboo.png",
    from: "Hà Nội",
    to: "Hồ Chí Minh",
    departureTime: "10:15",
    arrivalTime: "12:25",
    price: 1050000,
    duration: "2h 10m",
    seats: 28,
    baggage: {
      cabin: "7 kg",
      checked: "20 kg",
    },
    amenities: ["meal", "wifi", "entertainment"],
    aircraft: "Boeing 787",
    flightNumber: "BL789",
  },
];

const cities = [
  "Hà Nội",
  "Hồ Chí Minh",
  "Đà Nẵng",
  "Nha Trang",
  "Phú Quốc",
  "Huế",
  "Đà Lạt",
  "Hải Phòng",
];

const FlightSearch = () => {
  const navigate = useNavigate();
  const [tripType, setTripType] = useState("oneway"); // Mặc định là một chiều

  // Read URL parameters on mount
  const urlParams = new URLSearchParams(window.location.search);
  const initialToLocation = urlParams.get("to") || "";
  const initialFromLocation = urlParams.get("from") || "";

  const [searchParams, setSearchParams] = useState({
    from_location: initialFromLocation,
    to_location: initialToLocation,
    departure_date: "",
    returnDate: "",
    passengers: {
      adults: 1,
      children: 0,
      infants: 0,
    },
    class: "economy",
  });
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  // ✅ Init searchPerformed/hasSearched dựa trên URL params để tránh race condition
  const [searchPerformed, setSearchPerformed] = useState(
    !!(initialToLocation || initialFromLocation)
  );
  const [hasSearched, setHasSearched] = useState(
    !!(initialToLocation || initialFromLocation)
  );
  // Track để effects khác biết init đã hoàn thành
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [noFlightsMessage, setNoFlightsMessage] = useState("");
  const [showPassengerModal, setShowPassengerModal] = useState(false);
  const [suggestions, setSuggestions] = useState({ from: [], to: [] });
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [sortBy, setSortBy] = useState("price");
  // Thêm state cho phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFlights, setTotalFlights] = useState(0);
  const [filters, setFilters] = useState({
    stops: [], // Điểm dừng: 0 = bay thẳng, 1 = 1 điểm dừng, 2 = 2 điểm dừng
    airlines: [], // Hãng hàng không
    departureTime: [], // Khung giờ cất cánh: sáng, chiều, tối
    arrivalTime: [], // Khung giờ hạ cánh: sáng, chiều, tối
    durationRange: { min: 0, max: 24 }, // Thời gian bay tính theo giờ
    amenities: [], // Tiện ích
    priceRange: { min: 0, max: 10000000 }, // Khoảng giá
  });
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [cityOptions, setCityOptions] = useState({
    from_locations: [],
    to_locations: [],
  });
  const [loadingCities, setLoadingCities] = useState(false);
  const [airlineOptions, setAirlineOptions] = useState([]); // Danh sách hãng bay từ database
  // Thêm state cho thu gọn từng filter
  const [collapse, setCollapse] = useState({
    stops: false,
    airlines: false,
    time: false,
    amenities: false,
    price: false,
  });
  const [popularDestinations, setPopularDestinations] = useState([]);
  const [loadingDestinations, setLoadingDestinations] = useState(true);

  const passengerModalRef = useRef(null);
  const filterModalRef = useRef(null);
  // Thêm ref cho phần layout 2 cột để scrolling
  const resultsContainerRef = useRef(null);

  // Hàm cuộn lên đầu của phần kết quả
  const scrollToResults = () => {
    if (resultsContainerRef.current) {
      // Thêm setTimeout để đảm bảo DOM đã được cập nhật
      setTimeout(() => {
        resultsContainerRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 200);
    } else {
      console.warn("[DEBUG] Không tìm thấy ref của phần kết quả để cuộn");
    }
  };

  // Load danh sách điểm đi/đến từ database
  const fetchCities = async () => {
    setLoadingCities(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/flights/cities`);
      if (res.data && res.data.from_locations && res.data.to_locations) {
        setCityOptions({
          from_locations: res.data.from_locations,
          to_locations: res.data.to_locations,
        });
        console.debug("[DEBUG] Danh sách điểm đi/đến:", res.data);
      }
    } catch (err) {
      console.error("[DEBUG] Lỗi khi lấy danh sách điểm đi/đến:", err);
    } finally {
      setLoadingCities(false);
    }
  };

  // Fetch location suggestions
  const fetchLocationSuggestions = async (q, field) => {
    if (!q || q.trim() === "") {
      if (field === "from") {
        setSuggestions((prev) => ({ ...prev, from: [] }));
        setShowFromSuggestions(false);
      } else {
        setSuggestions((prev) => ({ ...prev, to: [] }));
        setShowToSuggestions(false);
      }
      return;
    }

    setLoadingSuggestions(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/flights/locations/suggest`, {
        params: { q, field },
      });

      const locations = res.data.locations || [];

      if (field === "from") {
        setSuggestions((prev) => ({ ...prev, from: locations }));
        setShowFromSuggestions(locations.length > 0);
      } else {
        setSuggestions((prev) => ({ ...prev, to: locations }));
        setShowToSuggestions(locations.length > 0);
      }
    } catch (err) {
      console.error("[DEBUG] Lỗi khi lấy gợi ý:", err);
      if (field === "from") {
        setSuggestions((prev) => ({ ...prev, from: [] }));
        setShowFromSuggestions(false);
      } else {
        setSuggestions((prev) => ({ ...prev, to: [] }));
        setShowToSuggestions(false);
      }
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Handle location select from suggestions
  const handleLocationSelect = async (location, field) => {
    setSearchParams((prev) => ({ ...prev, [field]: location }));

    if (field === "from_location") {
      setShowFromSuggestions(false);
      // ✅ Fetch destinations từ điểm đi này
      try {
        const res = await axios.get(
          `${API_BASE_URL}/flights/destinations/${encodeURIComponent(location)}`
        );
        if (res.data?.destinations) {
          setSuggestions((prev) => ({ ...prev, to: res.data.destinations }));
        }
      } catch (err) {
        console.error("[DEBUG] Lỗi khi lấy điểm đến:", err);
      }
    } else {
      setShowToSuggestions(false);
      // ✅ Fetch origins đến điểm đến này
      try {
        const res = await axios.get(
          `${API_BASE_URL}/flights/origins/${encodeURIComponent(location)}`
        );
        if (res.data?.origins) {
          setSuggestions((prev) => ({ ...prev, from: res.data.origins }));
        }
      } catch (err) {
        console.error("[DEBUG] Lỗi khi lấy điểm đi:", err);
      }
    }
  };

  // Hàm xử lý URL ảnh
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return "/images/placeholder.png";
    if (imageUrl.startsWith("http")) return imageUrl;
    if (imageUrl.startsWith("/uploads")) return `${API_HOST}${imageUrl}`;
    return `${API_HOST}/${imageUrl}`.replace(/\/\//g, "/");
  };

  // Load danh sách điểm đến phổ biến
  const fetchPopularDestinations = async () => {
    setLoadingDestinations(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/destinations/featured`);
      if (response.data && response.data.length > 0) {
        // Xử lý URL ảnh cho mỗi điểm đến
        const destinationsWithProcessedImages = response.data.map((dest) => ({
          ...dest,
          image: getImageUrl(dest.image),
          main_image: getImageUrl(dest.main_image),
        }));
        setPopularDestinations(destinationsWithProcessedImages);
      }
    } catch (err) {
      console.error("[ERROR] Lỗi khi lấy danh sách điểm đến phổ biến:", err);
    } finally {
      setLoadingDestinations(false);
    }
  };

  // Load danh sách điểm đi/đến và tất cả chuyến bay khi component mount
  useEffect(() => {
    fetchCities();
    loadAirlines(); // Tải danh sách hãng bay
    fetchPopularDestinations();

    // Kiểm tra URL params - nếu có thì search theo params, không thì load all
    if (initialToLocation || initialFromLocation) {
      // Có URL params từ trang khác (blog), tự động trigger search
      fetchFlights({
        from: initialFromLocation,
        to: initialToLocation,
        ...filters,
      }).finally(() => setIsInitialized(true));
    } else {
      // Không có URL params, load tất cả chuyến bay
      loadAllFlights().finally(() => setIsInitialized(true));
    }
  }, []);

  // Hàm tải tất cả chuyến bay khi mới vào trang
  const loadAllFlights = async () => {
    try {
      setLoading(true);

      // Gọi API để lấy tất cả chuyến bay với sắp xếp
      const query = new URLSearchParams();
      query.append("limit", itemsPerPage); // Số lượng chuyến bay mỗi trang
      query.append("page", currentPage); // Trang hiện tại
      query.append(
        "sort_by",
        sortBy === "departure" ? "departure_time" : sortBy
      );

      const response = await axios.get(
        `${API_BASE_URL}/flights?${query.toString()}`
      );

      if (response.data && response.data.flights) {
        // Mapping dữ liệu
        const mapped = response.data.flights.map(mapFlightData);
        setFlights(mapped);

        // Cập nhật thông tin phân trang
        if (response.data.pagination) {
          const { total_pages, total } = response.data.pagination;
          setTotalPages(total_pages || 1);
          setTotalFlights(total || mapped.length);
          console.log(
            `[DEBUG] Phân trang: tổng ${total} chuyến bay, ${total_pages} trang`
          );
        } else {
          // Nếu API không trả về thông tin phân trang, tính toán dựa trên dữ liệu
          setTotalFlights(mapped.length);
          setTotalPages(Math.ceil(mapped.length / itemsPerPage));
          console.log(
            `[DEBUG] Phân trang (tự tính): ${mapped.length} chuyến bay`
          );
        }

        console.debug(
          "[DEBUG] Đã tải " + mapped.length + " chuyến bay trang " + currentPage
        );
      } else {
        // Nếu không có dữ liệu, sử dụng dữ liệu mẫu
        setFlights(sampleFlights.map(mapFlightData));
        setTotalFlights(sampleFlights.length);
        setTotalPages(Math.ceil(sampleFlights.length / itemsPerPage));
        console.debug("[DEBUG] Sử dụng dữ liệu mẫu cho chuyến bay ban đầu");
      }
    } catch (error) {
      console.error("[DEBUG] Lỗi khi tải danh sách chuyến bay ban đầu:", error);
      // Sử dụng dữ liệu mẫu nếu có lỗi
      setFlights(sampleFlights.map(mapFlightData));
      setTotalFlights(sampleFlights.length);
      setTotalPages(Math.ceil(sampleFlights.length / itemsPerPage));
    } finally {
      setLoading(false);
    }

    // Trả về Promise đã resolved
    return Promise.resolve();
  };

  // Hàm fetch chuyến bay từ backend với filter
  const fetchFlights = async (params = {}) => {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams();

      console.log(
        "[DEBUG] fetchFlights được gọi với params:",
        JSON.stringify(params)
      );

      // ✅ Chỉ áp dụng tham số tìm kiếm nếu người dùng đã thực hiện tìm kiếm
      if (params.from) query.append("from_location", params.from);
      if (params.to) query.append("to_location", params.to);

      // ✅ Date formatting - ensure YYYY-MM-DD string format
      if (params.departDate) {
        let formattedDate = params.departDate;

        // If Date object, convert to YYYY-MM-DD
        if (params.departDate instanceof Date) {
          const year = params.departDate.getFullYear();
          const month = String(params.departDate.getMonth() + 1).padStart(
            2,
            "0"
          );
          const day = String(params.departDate.getDate()).padStart(2, "0");
          formattedDate = `${year}-${month}-${day}`;
        }

        query.append("departure_date", formattedDate);
      }

      // Xử lý sortBy một cách chi tiết hơn
      if (sortBy) {
        switch (sortBy) {
          case "price":
            query.append("sort_by", "price");
            query.append("sort_order", "asc");
            break;
          case "price_desc":
            query.append("sort_by", "price");
            query.append("sort_order", "desc");
            break;
          case "duration":
            query.append("sort_by", "duration");
            query.append("sort_order", "asc");
            break;
          case "duration_desc":
            query.append("sort_by", "duration");
            query.append("sort_order", "desc");
            break;
          case "departure":
            query.append("sort_by", "departure_time");
            query.append("sort_order", "asc");
            break;
          case "departure_desc":
            query.append("sort_by", "departure_time");
            query.append("sort_order", "desc");
            break;
          default:
            query.append("sort_by", "price");
            query.append("sort_order", "asc");
        }
      }

      // Thêm thông tin phân trang
      query.append("limit", itemsPerPage);
      query.append("page", currentPage);

      // Luôn áp dụng bộ lọc bất kể đã tìm kiếm hay chưa
      // Giá vé
      if (params.priceRange) {
        const { min, max } = params.priceRange;
        if (min !== undefined) {
          query.append("min_price", min);
        }
        if (max !== undefined) {
          query.append("max_price", max);
        }
      }

      // Thời gian bay
      if (params.durationRange) {
        const { min, max } = params.durationRange;
        if (min !== undefined) {
          const minInMinutes = min * 60;
          query.append("duration_min", minInMinutes);
        }
        if (max !== undefined) {
          const maxInMinutes = max * 60;
          query.append("duration_max", maxInMinutes);
        }
      }

      // Tiện ích
      if (params.amenities && params.amenities.length > 0) {
        query.append("amenities", params.amenities.join(","));
      }

      // Hãng bay
      if (params.airlines && params.airlines.length > 0) {
        query.append("airlines", params.airlines.join(","));
      }

      // Giờ cất cánh
      if (params.departureTime && params.departureTime.length > 0) {
        query.append("departure_time_slots", params.departureTime.join(","));
      }

      // Giờ hạ cánh
      if (params.arrivalTime && params.arrivalTime.length > 0) {
        query.append("arrival_time_slots", params.arrivalTime.join(","));
      }

      const apiUrl = `${API_BASE_URL}/flights?${query.toString()}`;

      // Gọi API
      const res = await axios.get(apiUrl);

      // Kiểm tra dữ liệu phản hồi
      if (!res.data) {
        throw new Error("API trả về dữ liệu rỗng");
      }

      if (res.data && res.data.flights) {
        // Mapping dữ liệu
        const mapped = res.data.flights.map(mapFlightData);
        setFlights(mapped);

        // ✅ Cập nhật thông tin phân trang từ backend (dùng pagination.total)
        let totalCount = 0;
        if (res.data.pagination) {
          const { total, total_pages } = res.data.pagination;
          totalCount = total || 0;
          setTotalFlights(totalCount);
          setTotalPages(total_pages || 1);

          // Đảm bảo trang hiện tại không vượt quá tổng số trang
          if (currentPage > total_pages) {
            setCurrentPage(1);
          }

          console.log(
            `[DEBUG] Phân trang: tổng ${total} chuyến bay, ${total_pages} trang`
          );
        } else {
          // Fallback: tính dựa trên số lượng flights trong response
          totalCount = mapped.length;
          setTotalFlights(totalCount);
          const calculatedPages = Math.ceil(totalCount / itemsPerPage);
          setTotalPages(calculatedPages);

          if (currentPage > calculatedPages) {
            setCurrentPage(1);
          }
        }

        // Kiểm tra nếu không có chuyến bay
        if (totalCount === 0) {
          setNoFlightsMessage(
            "Không tìm thấy chuyến bay phù hợp với tiêu chí tìm kiếm"
          );
        } else {
          setNoFlightsMessage("");
        }

        setError("");
      } else {
        setFlights([]);
        setTotalFlights(0);
        setTotalPages(1);
        setCurrentPage(1);
        setNoFlightsMessage("Không tìm thấy chuyến bay phù hợp");
        console.warn("[DEBUG] Không có dữ liệu flights từ backend", res.data);
      }
    } catch (err) {
      setFlights([]);
      setTotalFlights(0);
      setTotalPages(1);

      // Xử lý chi tiết lỗi
      if (err.response) {
        // Lỗi từ phản hồi của server
        console.error(
          `[DEBUG] Lỗi API (${err.response.status}):`,
          err.response.data
        );
        if (err.response.status === 404) {
          setError("Không tìm thấy dữ liệu chuyến bay phù hợp");
        } else if (err.response.status === 400) {
          setError(
            `Lỗi dữ liệu: ${
              err.response.data.message ||
              "Vui lòng kiểm tra lại thông tin tìm kiếm"
            }`
          );
        } else if (err.response.status >= 500) {
          setError("Lỗi hệ thống. Vui lòng thử lại sau");
        } else {
          setError(
            `Lỗi: ${
              err.response.data.message || "Không thể tìm kiếm chuyến bay"
            }`
          );
        }
      } else if (err.request) {
        // Không nhận được phản hồi từ server
        console.error(
          "[DEBUG] Không nhận được phản hồi từ server:",
          err.request
        );
        setError(
          "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng"
        );
      } else {
        // Lỗi khác
        console.error("[DEBUG] Lỗi khi fetch flights:", err.message);
        setError("Lỗi khi tìm kiếm chuyến bay. Vui lòng thử lại sau.");
      }
    } finally {
      setLoading(false);
    }

    // Trả về Promise đã resolved
    return Promise.resolve();
  };

  // Theo dõi thay đổi của sortBy để tải lại danh sách khi chưa tìm kiếm
  useEffect(() => {
    // Đảm bảo chỉ tải lại khi sortBy thay đổi và không phải khi component mới mount
    if (sortBy) {
      if (!searchPerformed) {
        loadAllFlights().then(() => scrollToResults());
      } else {
        fetchFlights({
          from: searchParams.from_location,
          to: searchParams.to_location,
          departDate: searchParams.departure_date,
          ...filters,
        }).then(() => scrollToResults());
      }
    }
  }, [sortBy]);

  // Hàm tải danh sách hãng hàng không
  const loadAirlines = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/flights/airlines`);

      if (
        response.data &&
        response.data.airlines &&
        response.data.airlines.length > 0
      ) {
        setAirlineOptions(response.data.airlines);
        console.log(
          "[DEBUG] Đã tải được " +
            response.data.airlines.length +
            " hãng hàng không:",
          response.data.airlines
        );
      } else {
        // Nếu không có dữ liệu từ API, sử dụng một số hãng mặc định
        const defaultAirlines = [
          "Vietnam Airlines",
          "Vietjet Air",
          "Bamboo Airways",
          "Vietravel Airlines",
          "Pacific Airlines",
        ];
        setAirlineOptions(defaultAirlines);
        console.log(
          "[DEBUG] Sử dụng danh sách hãng hàng không mặc định:",
          defaultAirlines
        );
      }
    } catch (error) {
      console.error("[DEBUG] Lỗi khi tải danh sách hãng hàng không:", error);
      // Sử dụng danh sách mặc định trong trường hợp có lỗi
      const defaultAirlines = [
        "Vietnam Airlines",
        "Vietjet Air",
        "Bamboo Airways",
        "Vietravel Airlines",
        "Pacific Airlines",
      ];
      setAirlineOptions(defaultAirlines);
    }
  };

  // Function để chuyển đổi dữ liệu từ backend sang định dạng frontend
  const mapFlightData = (flight) => {
    // Chuyển đổi thời gian về dạng HH:mm
    const formatTime = (dt) => {
      if (!dt) return "";
      const d = new Date(dt);
      return d.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    };
    // Tính duration (phút -> "Xh Ym")
    const formatDuration = (min) => {
      if (!min) return "";
      const h = Math.floor(min / 60);
      const m = min % 60;
      return `${h}h ${m}m`;
    };

    // ✅ Xử lý JSON baggage từ database (baggage_info từ flight_routes hoặc baggage từ flights cũ)
    let parsedBaggage = { cabin: "7 kg", checked: "20 kg" };
    const baggageData = flight.baggage_info || flight.baggage;
    if (baggageData) {
      try {
        // Kiểm tra nếu baggage đã là object (đã được parse bởi mysql2)
        if (typeof baggageData === "object" && baggageData !== null) {
          parsedBaggage = baggageData;
        } else {
          parsedBaggage = JSON.parse(baggageData);
        }
      } catch (err) {
        console.error("[DEBUG] Lỗi khi parse baggage:", err);
      }
    }

    // ✅ Xử lý JSON amenities từ database (amenities_info từ flight_routes hoặc amenities từ flights cũ)
    let parsedAmenities = ["meal"];
    const amenitiesData = flight.amenities_info || flight.amenities;
    if (amenitiesData) {
      try {
        // Kiểm tra nếu amenities đã là array (đã được parse bởi mysql2)
        if (Array.isArray(amenitiesData)) {
          parsedAmenities = amenitiesData;
        } else {
          parsedAmenities = JSON.parse(amenitiesData);
        }
      } catch (err) {
        console.error("[DEBUG] Lỗi khi parse amenities:", err);
      }
    }

    // Xử lý seat_classes mới với định dạng:
    // {
    //   "first": { "price": 1500000, "total_seats": 10, "available_seats": 8 },
    //   "economy": { "price": 0.0, "total_seats": 120, "available_seats": 110 },
    //   ...
    // }
    let seatClasses = {
      economy: { price: 0, total_seats: 120, available_seats: 110 },
      premium_economy: { price: 300000, total_seats: 30, available_seats: 28 },
      business: { price: 800000, total_seats: 20, available_seats: 18 },
      first: { price: 1500000, total_seats: 10, available_seats: 8 },
    };

    if (flight.seat_classes) {
      try {
        if (
          typeof flight.seat_classes === "object" &&
          flight.seat_classes !== null
        ) {
          seatClasses = flight.seat_classes;
        } else {
          const parsed = JSON.parse(flight.seat_classes);
          // Kiểm tra định dạng cũ (giá trị số) hoặc định dạng mới (object)
          if (
            typeof parsed.economy === "number" ||
            typeof parsed.first === "number"
          ) {
            // Định dạng cũ
            seatClasses = {
              economy: {
                price: parsed.economy || 0,
                total_seats: 120,
                available_seats: 110,
              },
              premium_economy: {
                price: parsed.premium_economy || 300000,
                total_seats: 30,
                available_seats: 28,
              },
              business: {
                price: parsed.business || 800000,
                total_seats: 20,
                available_seats: 18,
              },
              first: {
                price: parsed.first || 1500000,
                total_seats: 10,
                available_seats: 8,
              },
            };
          } else {
            // Định dạng mới
            seatClasses = parsed;
          }
        }
      } catch (err) {
        console.error("[DEBUG] Lỗi khi parse seat_classes:", err);
      }
    }

    // ✅ Xử lý đường dẫn hình ảnh hãng hàng không (từ airlines table hoặc flights cũ)
    let airlineImagePath = `${API_HOST}/images/placeholder.png`; // Đường dẫn mặc định
    const airlineImage = flight.airline_image; // Từ JOIN với airlines table

    if (airlineImage) {
      if (airlineImage.startsWith("http")) {
        airlineImagePath = airlineImage;
      } else if (airlineImage.startsWith("/")) {
        airlineImagePath = `${API_HOST}${airlineImage}`;
      } else {
        airlineImagePath = `${API_HOST}/${airlineImage}`;
      }
    }

    // Lấy promotion trực tiếp từ backend trả về
    const promotion = flight.promotion || null;

    // Cập nhật hàm calculateTotalPrice để tính cả khuyến mãi
    const calculateTotalPrice = (seatClass) => {
      const basePrice = Number(flight.price) || 0;
      const seatPrice = seatClasses[seatClass]?.price || 0;
      const totalBeforeDiscount = basePrice + seatPrice;
      if (promotion) {
        if (promotion.type === "percentage") {
          return (
            totalBeforeDiscount -
            (totalBeforeDiscount * promotion.discount) / 100
          );
        } else {
          return Math.max(0, totalBeforeDiscount - promotion.discount);
        }
      }
      return totalBeforeDiscount;
    };

    // Tính số ngày còn lại của khuyến mãi
    const getDaysRemaining = (endDate) => {
      if (!endDate) return null;
      const daysRemaining = Math.ceil(
        (new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24)
      );
      return daysRemaining > 0 ? daysRemaining : 0;
    };

    return {
      // ✅ Use schedule_id as primary ID (for navigation & booking)
      id: flight.schedule_id || flight.id,
      schedule_id: flight.schedule_id || flight.id,

      // Airline info
      airline: flight.airline,
      airlineLogo: airlineImagePath,

      // Location & time
      from: flight.from_location,
      to: flight.to_location,
      departureTime: formatTime(
        flight.departure_datetime || flight.departure_time
      ),
      arrivalTime: formatTime(flight.arrival_datetime || flight.arrival_time),

      // Pricing
      price: Number(flight.price) || Number(flight.base_price) || 0, // Giá đã tính từ backend (COALESCE)
      seatClasses: seatClasses, // Thông tin giá vé theo hạng ghế
      calculateTotalPrice: calculateTotalPrice, // Thêm hàm tính tổng giá vé

      // Flight details
      duration: formatDuration(flight.duration), // Backend trả về fr.duration (phút)
      durationMinutes: flight.duration, // Giữ nguyên để tính toán
      seats: flight.seats,
      baggage: parsedBaggage,
      amenities: parsedAmenities,
      flightNumber: flight.flight_number_template || flight.flight_number,
      status: flight.flight_status || flight.status || "scheduled",

      // New fields from flight_schedules
      flight_date: flight.flight_date,
      discount_percentage: flight.discount_percentage || 0,

      // Thêm thông tin khuyến mãi
      promotion: promotion,
      discountedPrice: promotion
        ? calculateTotalPrice(searchParams.class)
        : null,
      daysRemaining: promotion
        ? getDaysRemaining(promotion.promotion_end_date || promotion.endDate)
        : null,
    };
  };

  // Thay đổi: filter realtime - mỗi khi thay đổi filter sẽ gọi fetchFlights với filters mới
  const handleFilterChangeRealtime = (field, value) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [field]: value };
      // Gọi fetchFlights với filters mới, nhưng không truyền params tìm kiếm nếu chưa tìm kiếm
      const searchParamsObj = hasSearched
        ? {
            from: searchParams.from_location,
            to: searchParams.to_location,
            departDate: searchParams.departure_date,
          }
        : {};

      fetchFlights({
        ...searchParamsObj,
        ...newFilters,
      }).then(() => {
        // Cuộn đến phần kết quả sau khi dữ liệu được tải
        scrollToResults();
      });
      return newFilters;
    });
  };

  // Xóa hoàn toàn logic filter local trong applyFilter, chỉ giữ lại fetchFlights
  const applyFilter = (customFilters) => {
    const f = customFilters || filters;
    // Chỉ truyền các tham số tìm kiếm nếu đã tìm kiếm thực sự
    const searchParamsObj = hasSearched
      ? {
          from: searchParams.from_location,
          to: searchParams.to_location,
          departDate: searchParams.departure_date,
        }
      : {};

    fetchFlights({
      ...searchParamsObj,
      ...f,
    });
  };

  // Theo dõi thay đổi của trang hiện tại để tải dữ liệu
  useEffect(() => {
    // Skip effect này nếu chưa initialized (tránh race condition với mount effect)
    if (!isInitialized) return;

    if (searchPerformed) {
      // Đã thực hiện tìm kiếm, tải lại với thông số tìm kiếm nếu đã tìm kiếm thực sự
      const searchOptions = hasSearched
        ? {
            from: searchParams.from_location,
            to: searchParams.to_location,
            departDate: searchParams.departure_date,
          }
        : {};

      fetchFlights({
        ...searchOptions,
        ...filters,
      }).then(() => {
        // Cuộn đến phần kết quả sau khi dữ liệu được tải
        scrollToResults();
      });
    } else {
      // Chưa tìm kiếm, tải tất cả chuyến bay
      loadAllFlights().then(() => {
        // Cuộn đến phần kết quả sau khi dữ liệu được tải
        scrollToResults();
      });
    }
  }, [currentPage]);

  // Tìm kiếm khi submit form
  const handleSearch = async (e) => {
    if (e) e.preventDefault();

    try {
      // Đóng tất cả gợi ý khi người dùng nhấn nút tìm kiếm
      setSuggestions({ from: [], to: [] });

      setLoading(true);
      setError(null);
      setNoFlightsMessage("");

      // Validate các trường input
      if (!searchParams.from_location || !searchParams.to_location) {
        setError("Vui lòng nhập địa điểm đi và đến");
        setLoading(false);
        return;
      }

      if (!searchParams.departure_date) {
        setError("Vui lòng chọn ngày đi");
        setLoading(false);
        return;
      }

      // Validate ngày về nếu là khứ hồi
      if (tripType === "roundtrip") {
        if (!searchParams.returnDate) {
          setError("Vui lòng chọn ngày về cho chuyến khứ hồi");
          setLoading(false);
          return;
        }

        // Kiểm tra ngày về phải lớn hơn ngày đi
        const departDate = new Date(searchParams.departure_date);
        const returnDate = new Date(searchParams.returnDate);

        if (returnDate <= departDate) {
          setError("Ngày về phải sau ngày đi");
          setLoading(false);
          return;
        }
      }

      // Reset bộ lọc về mặc định khi thực hiện tìm kiếm mới
      setFilters({
        stops: [],
        airlines: [],
        departureTime: [],
        arrivalTime: [],
        durationRange: { min: 0, max: 24 },
        amenities: [],
        priceRange: { min: 0, max: 10000000 },
      });

      // Reset trang về 1 khi tìm kiếm mới
      setCurrentPage(1);

      // Nếu chưa có danh sách hãng bay, tải lại
      if (airlineOptions.length === 0) {
        loadAirlines();
      }

      // Gọi fetchFlights với tham số tìm kiếm
      const searchResult = await fetchFlights({
        from: searchParams.from_location,
        to: searchParams.to_location,
        departDate: searchParams.departure_date,
      });

      // Đánh dấu đã thực hiện tìm kiếm sau khi có kết quả
      setSearchPerformed(true);
      setHasSearched(true);

      // Đảm bảo dữ liệu đã được tải xong trước khi cuộn
      setTimeout(() => {
        scrollToResults();
      }, 100);
    } catch (error) {
      console.error("[ERROR] Lỗi khi tìm kiếm chuyến bay:", error);
      setFlights([]);
      setError("Đã xảy ra lỗi. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        passengerModalRef.current &&
        !passengerModalRef.current.contains(event.target)
      ) {
        setShowPassengerModal(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handleInputChange = (field, value) => {
    setSearchParams({ ...searchParams, [field]: value });

    if (field === "from_location") {
      if (value && value.trim() !== "") {
        fetchLocationSuggestions(value, "from");
      } else {
        setSuggestions((prev) => ({ ...prev, from: [] }));
        setShowFromSuggestions(false);
      }
    } else if (field === "to_location") {
      if (value && value.trim() !== "") {
        fetchLocationSuggestions(value, "to");
      } else {
        setSuggestions((prev) => ({ ...prev, to: [] }));
        setShowToSuggestions(false);
      }
    }
  };

  // Validate input - không reset về mặc định
  const validateAndResetInput = (field) => {
    setTimeout(() => {
      // Kiểm tra nếu có gợi ý đang hiển thị thì không làm gì
      if (
        (field === "from_location" && suggestions.from.length > 0) ||
        (field === "to_location" && suggestions.to.length > 0)
      ) {
        return;
      }
      // Không reset về giá trị mặc định, chỉ đóng gợi ý khi blur
    }, 200);
  };

  const handlePassengerChange = (type, operation) => {
    const newPassengers = { ...searchParams.passengers };
    if (operation === "add") {
      newPassengers[type]++;
    } else if (operation === "subtract" && newPassengers[type] > 0) {
      newPassengers[type]--;
    }
    setSearchParams({ ...searchParams, passengers: newPassengers });
  };

  const getAmenityIcon = (amenity) => {
    switch (amenity) {
      case "meal":
        return <Coffee className="w-4 h-4" />;
      case "wifi":
        return <Wifi className="w-4 h-4" />;
      case "power":
        return <Power className="w-4 h-4" />;
      case "entertainment":
        return <Monitor className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const handleSelectFlight = (flightId) => {
    // Truyền thông tin hành khách và hạng ghế qua state của navigate
    navigate(`/flights/${flightId}`, {
      state: {
        passengers: searchParams.passengers,
        class: searchParams.class,
      },
    });
  };

  // Xử lý thay đổi filter
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  // Xử lý khi chọn một thành phố từ danh sách gợi ý
  const handleCitySelection = (field, value) => {
    handleInputChange(field, value);

    // Chỉ đóng gợi ý khi người dùng thực sự chọn một thành phố
    if (field === "from_location") {
      setSuggestions((prev) => ({ ...prev, from: [] }));
    } else if (field === "to_location") {
      setSuggestions((prev) => ({ ...prev, to: [] }));
    }
  };

  // Hàm đặt lại hoàn toàn bộ lọc và tìm kiếm
  const resetSearchAndFilters = () => {
    // Đặt lại bộ lọc
    setFilters({
      stops: [],
      airlines: [],
      departureTime: [],
      arrivalTime: [],
      durationRange: { min: 0, max: 24 },
      amenities: [],
      priceRange: { min: 0, max: 10000000 },
    });

    // Reset lại trạng thái tìm kiếm
    setHasSearched(false);

    // Vẫn giữ trạng thái searchPerformed để không làm mất list chuyến bay
    // nhưng sẽ không áp dụng các tham số tìm kiếm nữa
    setCurrentPage(1);

    // Tải lại tất cả chuyến bay (không áp dụng tham số tìm kiếm)
    loadAllFlights().then(() => {
      // Cuộn đến phần kết quả sau khi dữ liệu được tải
      scrollToResults();
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* CSS cho các style tùy chỉnh */}
      <style>
        {`
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
          .flight-card {
            transition: all 0.3s ease;
          }
          .flight-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          }
          /* Promo flight card đặc biệt */
          .promo-flight-card {
            box-shadow: 0 8px 32px -8px #fb923c99, 0 2px 8px -2px #fb923c33;
            border-radius: 1.2rem;
            border-width: 2px;
            border-color: #fb923c;
            background: linear-gradient(90deg, #fff7ed 60%, #ffedd5 100%);
            position: relative;
          }
          .promo-flight-card:hover {
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
          .sidebar-filter { min-width: 270px; max-width: 320px; }
          @media (max-width: 1023px) { .sidebar-filter { display: none; } }
          .sidebar-section { border-bottom: 1px solid #f1f5f9; }
          .sidebar-section:last-child { border-bottom: none; }
          .sidebar-toggle { cursor: pointer; }
        `}
      </style>

      {/* Hero Section với overlay gradient và background image */}
      <div className="relative bg-emerald-600 text-white py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-emerald-700 opacity-90"></div>
        <div
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage: "url('/assets/img/hero-bg.jpg')" }}
        ></div>
        <div className="container mx-auto px-4 relative z-10">
          <h1 className="text-4xl font-bold mb-4">Đặt Vé Máy Bay</h1>
          <p className="text-emerald-100 text-lg max-w-2xl">
            Tìm và đặt vé máy bay với giá tốt nhất cho chuyến đi của bạn. Chúng
            tôi cung cấp hàng ngàn lựa chọn từ các hãng bay hàng đầu.
          </p>
        </div>
      </div>

      {/* Search Form - full width */}
      <div className="container mx-auto px-4 -mt-8 relative z-20">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          {/* Hiển thị thông báo lỗi nếu có */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 flex-shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}
          <form onSubmit={handleSearch}>
            {/* Trip Type Selection */}
            <div className="flex gap-4 mb-6">
              <label className="flex items-center relative pl-8 cursor-pointer group">
                <input
                  type="radio"
                  name="tripType"
                  value="roundtrip"
                  checked={tripType === "roundtrip"}
                  onChange={(e) => setTripType(e.target.value)}
                  className="absolute opacity-0 w-0 h-0"
                />
                <span className="absolute left-0 top-0 w-6 h-6 bg-white border border-gray-300 rounded-full transition-all group-hover:border-emerald-400"></span>
                <span
                  className={`absolute left-0 top-0 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                    tripType === "roundtrip" ? "bg-white" : ""
                  }`}
                >
                  {tripType === "roundtrip" && (
                    <span className="w-3.5 h-3.5 bg-emerald-500 rounded-full"></span>
                  )}
                </span>
                <span className="ml-2 text-gray-700 group-hover:text-emerald-700 font-medium">
                  Khứ hồi
                </span>
              </label>
              <label className="flex items-center relative pl-8 cursor-pointer group">
                <input
                  type="radio"
                  name="tripType"
                  value="oneway"
                  checked={tripType === "oneway"}
                  onChange={(e) => setTripType(e.target.value)}
                  className="absolute opacity-0 w-0 h-0"
                />
                <span className="absolute left-0 top-0 w-6 h-6 bg-white border border-gray-300 rounded-full transition-all group-hover:border-emerald-400"></span>
                <span
                  className={`absolute left-0 top-0 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                    tripType === "oneway" ? "bg-white" : ""
                  }`}
                >
                  {tripType === "oneway" && (
                    <span className="w-3.5 h-3.5 bg-emerald-500 rounded-full"></span>
                  )}
                </span>
                <span className="ml-2 text-gray-700 group-hover:text-emerald-700 font-medium">
                  Một chiều
                </span>
              </label>
            </div>

            {/* Hàng 1: Điểm đi & đến */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 mb-4">
              {/* Điểm đi */}
              <div className="relative col-span-3 ">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Điểm đi
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="from_location"
                    value={searchParams.from_location}
                    onChange={(e) =>
                      handleInputChange("from_location", e.target.value)
                    }
                    onBlur={() => validateAndResetInput("from_location")}
                    onFocus={async () => {
                      // ✅ Nếu đã có điểm đến, hiển thị origins đến điểm đến này
                      if (
                        searchParams.to_location &&
                        searchParams.to_location.trim() !== ""
                      ) {
                        try {
                          const res = await axios.get(
                            `${API_BASE_URL}/flights/origins/${encodeURIComponent(
                              searchParams.to_location
                            )}`
                          );
                          if (res.data?.origins) {
                            setSuggestions((prev) => ({
                              ...prev,
                              from: res.data.origins,
                            }));
                            setShowFromSuggestions(res.data.origins.length > 0);
                          }
                        } catch (err) {
                          console.error("[DEBUG] Lỗi khi lấy điểm đi:", err);
                          // Fallback: hiển thị tất cả
                          if (cityOptions.from_locations.length > 0) {
                            setSuggestions((prev) => ({
                              ...prev,
                              from: cityOptions.from_locations,
                            }));
                            setShowFromSuggestions(true);
                          }
                        }
                      } else if (
                        searchParams.from_location &&
                        searchParams.from_location.trim() !== ""
                      ) {
                        // Nếu đang có text trong ô, gọi suggest API
                        fetchLocationSuggestions(
                          searchParams.from_location,
                          "from"
                        );
                      } else {
                        // Hiển thị tất cả
                        if (cityOptions.from_locations.length > 0) {
                          setSuggestions((prev) => ({
                            ...prev,
                            from: cityOptions.from_locations,
                          }));
                          setShowFromSuggestions(true);
                        }
                      }
                    }}
                    className="w-full border border-gray-300 rounded-lg p-3 pl-4 pr-10 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors shadow-sm hover:border-emerald-300"
                    placeholder={
                      loadingCities
                        ? "Đang tải..."
                        : "Nhập điểm đi (VD: Hà Nội)"
                    }
                    disabled={loadingCities}
                  />
                  {loadingCities ? (
                    <Loader
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 animate-spin"
                      size={20}
                    />
                  ) : (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-emerald-600 bg-emerald-50 p-1 rounded-full">
                      <Plane size={18} />
                    </div>
                  )}
                  {showFromSuggestions && suggestions.from.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {suggestions.from.map((city) => (
                        <div
                          key={city}
                          className="px-4 py-2 hover:bg-emerald-50 cursor-pointer text-gray-900"
                          onClick={() => {
                            handleLocationSelect(city, "from_location");
                          }}
                        >
                          <Plane
                            size={14}
                            className="inline mr-2 text-emerald-600"
                          />
                          {city}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Hoán đổi điểm đi và điểm đến */}
              <div className="relative col-span-1 self-center mt-6">
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      // Sử dụng setSearchParams để cập nhật cả hai trường cùng lúc
                      setSearchParams((prev) => ({
                        ...prev,
                        from_location: prev.to_location,
                        to_location: prev.from_location,
                      }));
                      // Xóa các gợi ý đang hiển thị
                      setSuggestions({ from: [], to: [] });
                    }}
                    className="text-emerald-600 bg-emerald-50 p-2 rounded-full hover:bg-emerald-100 transition-colors transform hover:rotate-180 duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    aria-label="Hoán đổi điểm đi và điểm đến"
                    title="Hoán đổi điểm đi và điểm đến"
                  >
                    <ArrowLeftRight size={20} />
                  </button>
                </div>
              </div>

              {/* Điểm đến */}
              <div className="relative col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Điểm đến
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="to_location"
                    value={searchParams.to_location}
                    onChange={(e) =>
                      handleInputChange("to_location", e.target.value)
                    }
                    onBlur={() => validateAndResetInput("to_location")}
                    onFocus={async () => {
                      // ✅ Nếu đã có điểm đi, hiển thị destinations từ điểm đi
                      if (
                        searchParams.from_location &&
                        searchParams.from_location.trim() !== ""
                      ) {
                        try {
                          const res = await axios.get(
                            `${API_BASE_URL}/flights/destinations/${encodeURIComponent(
                              searchParams.from_location
                            )}`
                          );
                          if (res.data?.destinations) {
                            setSuggestions((prev) => ({
                              ...prev,
                              to: res.data.destinations,
                            }));
                            setShowToSuggestions(
                              res.data.destinations.length > 0
                            );
                          }
                        } catch (err) {
                          console.error("[DEBUG] Lỗi khi lấy điểm đến:", err);
                          // Fallback: hiển thị tất cả
                          if (cityOptions.to_locations.length > 0) {
                            setSuggestions((prev) => ({
                              ...prev,
                              to: cityOptions.to_locations,
                            }));
                            setShowToSuggestions(true);
                          }
                        }
                      } else if (
                        searchParams.to_location &&
                        searchParams.to_location.trim() !== ""
                      ) {
                        // Nếu đang có text trong ô, gọi suggest API
                        fetchLocationSuggestions(
                          searchParams.to_location,
                          "to"
                        );
                      } else {
                        // Hiển thị tất cả
                        if (cityOptions.to_locations.length > 0) {
                          setSuggestions((prev) => ({
                            ...prev,
                            to: cityOptions.to_locations,
                          }));
                          setShowToSuggestions(true);
                        }
                      }
                    }}
                    className="w-full border border-gray-300 rounded-lg p-3 pl-4 pr-10 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors shadow-sm hover:border-emerald-300"
                    placeholder={
                      loadingCities
                        ? "Đang tải..."
                        : "Nhập điểm đến (VD: TP. Hồ Chí Minh)"
                    }
                    disabled={loadingCities}
                  />
                  {loadingCities ? (
                    <Loader
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 animate-spin"
                      size={20}
                    />
                  ) : (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-emerald-600 bg-emerald-50 p-1 rounded-full">
                      <Plane className="rotate-180" size={18} />
                    </div>
                  )}
                  {showToSuggestions && suggestions.to.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {suggestions.to.map((city) => (
                        <div
                          key={city}
                          className="px-4 py-2 hover:bg-emerald-50 cursor-pointer text-gray-900"
                          onClick={() => {
                            handleLocationSelect(city, "to_location");
                          }}
                        >
                          <Plane
                            size={14}
                            className="inline mr-2 text-emerald-600 rotate-180"
                          />
                          {city}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Depart Date */}
              <div className="relative col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày đi
                  {(!searchParams.from_location ||
                    !searchParams.to_location) && (
                    <span className="text-xs text-gray-500 ml-2">
                      (Vui lòng chọn điểm đi và đến trước)
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="departure_date"
                    value={searchParams.departure_date}
                    onChange={(e) =>
                      setSearchParams({
                        ...searchParams,
                        departure_date: e.target.value,
                      })
                    }
                    min={new Date().toISOString().split("T")[0]}
                    disabled={
                      !searchParams.from_location || !searchParams.to_location
                    }
                    className={`w-full border rounded-lg p-3 pl-4 pr-10 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors shadow-sm date-input-custom ${
                      !searchParams.from_location || !searchParams.to_location
                        ? "bg-gray-100 cursor-not-allowed border-gray-200"
                        : "border-gray-300 hover:border-emerald-300"
                    }`}
                  />
                  <div
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full ${
                      !searchParams.from_location || !searchParams.to_location
                        ? "text-gray-400 bg-gray-100"
                        : "text-emerald-600 bg-emerald-50"
                    }`}
                  >
                    <Calendar size={18} />
                  </div>
                </div>
              </div>

              {/* Return Date - chỉ hiển thị khi loại chuyến bay là khứ hồi */}
              {tripType === "roundtrip" ? (
                <div className="relative col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày về
                    {(!searchParams.from_location ||
                      !searchParams.to_location ||
                      !searchParams.departure_date) && (
                      <span className="text-xs text-gray-500 ml-2">
                        (Chọn ngày đi trước)
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      name="returnDate"
                      value={searchParams.returnDate}
                      onChange={(e) =>
                        setSearchParams({
                          ...searchParams,
                          returnDate: e.target.value,
                        })
                      }
                      min={
                        searchParams.departure_date ||
                        new Date().toISOString().split("T")[0]
                      }
                      disabled={
                        !searchParams.from_location ||
                        !searchParams.to_location ||
                        !searchParams.departure_date
                      }
                      className={`w-full border rounded-lg p-3 pl-4 pr-10 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors shadow-sm date-input-custom ${
                        !searchParams.from_location ||
                        !searchParams.to_location ||
                        !searchParams.departure_date
                          ? "bg-gray-100 cursor-not-allowed border-gray-200"
                          : "border-gray-300 hover:border-emerald-300"
                      }`}
                    />
                    <div
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full ${
                        !searchParams.from_location ||
                        !searchParams.to_location ||
                        !searchParams.departure_date
                          ? "text-gray-400 bg-gray-100"
                          : "text-emerald-600 bg-emerald-50"
                      }`}
                    >
                      <Calendar size={18} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative hidden md:block lg:hidden">
                  {/* Placeholder để giữ layout khi không hiển thị ngày về */}
                </div>
              )}
            </div>

            {/* Passengers and Class */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hành khách
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowPassengerModal(!showPassengerModal)}
                    className="w-full text-left border border-gray-300 rounded-lg p-3 pl-4 pr-10 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors shadow-sm hover:border-emerald-300 bg-white"
                  >
                    {`${searchParams.passengers.adults} người lớn, ${searchParams.passengers.children} trẻ em, ${searchParams.passengers.infants} em bé`}
                  </button>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-emerald-600 bg-emerald-50 p-1 rounded-full">
                    <Users size={18} />
                  </div>
                </div>

                {/* Passenger Selection Modal */}
                {showPassengerModal && (
                  <div
                    ref={passengerModalRef}
                    className="absolute z-50 mt-2 w-full bg-white rounded-lg shadow-xl border border-gray-200 p-5 animate-fade-in"
                  >
                    {/* Adults */}
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <p className="font-medium text-gray-800">Người lớn</p>
                        <p className="text-sm text-gray-500">&gt; 12 tuổi</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            handlePassengerChange("adults", "subtract")
                          }
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={searchParams.passengers.adults <= 1}
                        >
                          <span className="text-gray-600 font-bold">-</span>
                        </button>
                        <span className="w-8 text-center font-medium">
                          {searchParams.passengers.adults}
                        </span>
                        <button
                          type="button"
                          onClick={() => handlePassengerChange("adults", "add")}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
                        >
                          <span className="text-emerald-600 font-bold">+</span>
                        </button>
                      </div>
                    </div>

                    {/* Children */}
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <p className="font-medium text-gray-800">Trẻ em</p>
                        <p className="text-sm text-gray-500">2-12 tuổi</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            handlePassengerChange("children", "subtract")
                          }
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={searchParams.passengers.children <= 0}
                        >
                          <span className="text-gray-600 font-bold">-</span>
                        </button>
                        <span className="w-8 text-center font-medium">
                          {searchParams.passengers.children}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handlePassengerChange("children", "add")
                          }
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
                        >
                          <span className="text-emerald-600 font-bold">+</span>
                        </button>
                      </div>
                    </div>

                    {/* Infants */}
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-800">Em bé</p>
                        <p className="text-sm text-gray-500">&lt; 2 tuổi</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            handlePassengerChange("infants", "subtract")
                          }
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={searchParams.passengers.infants <= 0}
                        >
                          <span className="text-gray-600 font-bold">-</span>
                        </button>
                        <span className="w-8 text-center font-medium">
                          {searchParams.passengers.infants}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handlePassengerChange("infants", "add")
                          }
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
                        >
                          <span className="text-emerald-600 font-bold">+</span>
                        </button>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200 mt-3">
                      <button
                        type="button"
                        onClick={() => setShowPassengerModal(false)}
                        className="w-full bg-emerald-100 text-emerald-700 font-medium py-2 rounded-lg hover:bg-emerald-200 transition-colors"
                      >
                        Xác nhận
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hạng ghế
                </label>
                <div className="relative">
                  <select
                    value={searchParams.class}
                    onChange={(e) =>
                      setSearchParams({
                        ...searchParams,
                        class: e.target.value,
                      })
                    }
                    className="w-full appearance-none border border-gray-300 rounded-lg p-3 pl-4 pr-10 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all cursor-pointer"
                  >
                    <option value="economy">Phổ thông</option>
                    <option value="premium_economy">Phổ thông đặc biệt</option>
                    <option value="business">Thương gia</option>
                    <option value="first">Hạng nhất</option>
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-emerald-600 pointer-events-none">
                    <ChevronDown size={20} />
                  </div>
                </div>
              </div>
            </div>

            {/* Search Button */}
            <div className="mt-6">
              <button
                type="submit"
                className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 active:bg-emerald-800 transition-all transform active:scale-[0.99] shadow-md hover:shadow-lg disabled:bg-emerald-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={loading || loadingCities}
              >
                {loading ? (
                  <>
                    <Loader size={20} className="animate-spin" />
                    <span>Đang tìm kiếm...</span>
                  </>
                ) : (
                  <>
                    <Search size={20} />
                    <span>Tìm chuyến bay</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Layout 2 cột: sidebar + content chỉ cho phần kết quả */}
      <div
        className="container mx-auto px-4 flex flex-row gap-8 relative"
        ref={resultsContainerRef}
      >
        {/* Sidebar Filter (desktop) */}
        <aside className="sidebar-filter bg-white rounded-xl shadow-lg p-6 h-fit sticky top-28 hidden lg:block max-h-[85vh] overflow-auto custom-scrollbar">
          <div className="flex justify-between mb-4">
            <label className="block text-xl font-bold text-emerald-700 mb-2">
              Bộ lọc
            </label>
            <button
              onClick={() => {
                resetSearchAndFilters();
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-emerald-700 hover:bg-emerald-50"
            >
              Đặt lại
            </button>
          </div>
          {/* Số điểm dừng */}
          <div className="sidebar-section mb-4">
            <div
              className="flex justify-between items-center sidebar-toggle"
              onClick={() => setCollapse((c) => ({ ...c, stops: !c.stops }))}
            >
              <h4 className="text-sm font-medium text-gray-700">
                Số điểm dừng
              </h4>
              <ChevronDown
                className={`transition-transform ${
                  collapse.stops ? "rotate-180" : ""
                }`}
                size={18}
              />
            </div>
            {!collapse.stops && (
              <div className="flex flex-col gap-2 mt-2 flex-wrap">
                {[
                  { value: 0, label: "Bay thẳng" },
                  { value: 1, label: "1 điểm dừng" },
                  { value: 2, label: "2 điểm dừng" },
                  { value: 3, label: "Nhiều điểm dừng" },
                ].map((stop) => (
                  <label
                    key={stop.value}
                    className="block w-auto p-2 border rounded-lg cursor-pointer hover:bg-emerald-50 hover:border-emerald-200 transition-colors mb-1"
                  >
                    <input
                      type="checkbox"
                      checked={filters.stops.includes(stop.value)}
                      onChange={(e) => {
                        const newStops = e.target.checked
                          ? [...filters.stops, stop.value]
                          : filters.stops.filter((s) => s !== stop.value);
                        handleFilterChangeRealtime("stops", newStops);
                      }}
                      className="form-checkbox text-emerald-600 h-4 w-4 rounded mr-2"
                    />
                    <span>{stop.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          {/* Hãng hàng không */}
          <div className="sidebar-section mb-4">
            <div
              className="flex justify-between items-center sidebar-toggle"
              onClick={() =>
                setCollapse((c) => ({ ...c, airlines: !c.airlines }))
              }
            >
              <h4 className="text-sm font-medium text-gray-700">
                Hãng hàng không
              </h4>
              <ChevronDown
                className={`transition-transform ${
                  collapse.airlines ? "rotate-180" : ""
                }`}
                size={18}
              />
            </div>
            {!collapse.airlines && (
              <div className="flex flex-col gap-2 mt-2 flex-wrap">
                {airlineOptions.length > 0 ? (
                  airlineOptions.map((airline) => (
                    <label
                      key={airline}
                      className="block w-auto p-2 border rounded-lg cursor-pointer hover:bg-emerald-50 hover:border-emerald-200 transition-colors mb-1"
                    >
                      <input
                        type="checkbox"
                        checked={filters.airlines.includes(airline)}
                        onChange={(e) => {
                          const newAirlines = e.target.checked
                            ? [...filters.airlines, airline]
                            : filters.airlines.filter((a) => a !== airline);
                          handleFilterChangeRealtime("airlines", newAirlines);
                        }}
                        className="form-checkbox text-emerald-600 h-4 w-4 rounded mr-2"
                      />
                      <span>{airline}</span>
                    </label>
                  ))
                ) : (
                  <div className="col-span-2 text-gray-500 italic flex items-center justify-center py-2">
                    <Loader
                      size={16}
                      className="animate-spin mr-2 text-emerald-500"
                    />
                    <span>Đang tải hãng hàng không...</span>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Thời gian bay */}
          <div className="sidebar-section mb-4">
            <div
              className="flex justify-between items-center sidebar-toggle"
              onClick={() => setCollapse((c) => ({ ...c, time: !c.time }))}
            >
              <h4 className="text-sm font-medium text-gray-700">
                Thời gian bay
              </h4>
              <ChevronDown
                className={`transition-transform ${
                  collapse.time ? "rotate-180" : ""
                }`}
                size={18}
              />
            </div>
            {!collapse.time && (
              <div className="space-y-6 mt-2">
                {/* Giờ cất cánh */}
                <div>
                  <h5 className="text-xs font-medium text-gray-600 mb-1">
                    Giờ cất cánh
                  </h5>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Đêm đến Sáng", value: "00:00-06:00" },
                      { label: "Sáng đến Trưa", value: "06:00-12:00" },
                      { label: "Trưa đến Tối", value: "12:00-18:00" },
                      { label: "Tối đến Đêm", value: "18:00-24:00" },
                    ].map((slot) => (
                      <label
                        key={slot.value}
                        className={`flex flex-col items-center border rounded-lg px-2 py-2 cursor-pointer transition-colors text-center ${
                          filters.departureTime.includes(slot.value)
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : "border-gray-200 bg-white text-gray-700"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={filters.departureTime.includes(slot.value)}
                          onChange={(e) => {
                            const newDepartureTime = e.target.checked
                              ? [...filters.departureTime, slot.value]
                              : filters.departureTime.filter(
                                  (t) => t !== slot.value
                                );
                            handleFilterChangeRealtime(
                              "departureTime",
                              newDepartureTime
                            );
                          }}
                          className="hidden"
                        />
                        <span className="text-xs font-semibold">
                          {slot.label}
                        </span>
                        <span className="text-base font-bold text-emerald-600">
                          {slot.value}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                {/* Giờ hạ cánh */}
                <div>
                  <h5 className="text-xs font-medium text-gray-600 mb-1">
                    Giờ hạ cánh
                  </h5>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Đêm đến Sáng", value: "00:00-06:00" },
                      { label: "Sáng đến Trưa", value: "06:00-12:00" },
                      { label: "Trưa đến Tối", value: "12:00-18:00" },
                      { label: "Tối đến Đêm", value: "18:00-24:00" },
                    ].map((slot) => (
                      <label
                        key={slot.value}
                        className={`flex flex-col items-center border rounded-lg px-2 py-2 cursor-pointer transition-colors text-center ${
                          filters.arrivalTime.includes(slot.value)
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : "border-gray-200 bg-white text-gray-700"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={filters.arrivalTime.includes(slot.value)}
                          onChange={(e) => {
                            const newArrivalTime = e.target.checked
                              ? [...filters.arrivalTime, slot.value]
                              : filters.arrivalTime.filter(
                                  (t) => t !== slot.value
                                );
                            handleFilterChangeRealtime(
                              "arrivalTime",
                              newArrivalTime
                            );
                          }}
                          className="hidden"
                        />
                        <span className="text-xs font-semibold">
                          {slot.label}
                        </span>
                        <span className="text-base font-bold text-emerald-600">
                          {slot.value}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                {/* Thời gian bay (slider) */}
                <div>
                  <h5 className="text-xs font-medium text-gray-600 mb-1">
                    Thời gian bay
                  </h5>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-gray-500">
                      {filters.durationRange.min}h
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="32"
                      step="1"
                      value={filters.durationRange.min}
                      onChange={(e) => {
                        const newMin = parseInt(e.target.value);
                        const newMax = Math.max(
                          newMin,
                          filters.durationRange.max
                        );
                        handleFilterChangeRealtime("durationRange", {
                          min: newMin,
                          max: newMax,
                        });
                      }}
                      className="w-full h-2 bg-emerald-100 rounded-lg appearance-none cursor-pointer"
                    />
                    <input
                      type="range"
                      min="0"
                      max="32"
                      step="1"
                      value={filters.durationRange.max}
                      onChange={(e) => {
                        const newMax = parseInt(e.target.value);
                        const newMin = Math.min(
                          filters.durationRange.min,
                          newMax
                        );
                        handleFilterChangeRealtime("durationRange", {
                          min: newMin,
                          max: newMax,
                        });
                      }}
                      className="w-full h-2 bg-emerald-100 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-xs text-gray-500">
                      {filters.durationRange.max}h
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>0h</span>
                    <span>32h</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Tiện ích */}
          <div className="sidebar-section mb-4">
            <div
              className="flex justify-between items-center sidebar-toggle"
              onClick={() =>
                setCollapse((c) => ({ ...c, amenities: !c.amenities }))
              }
            >
              <h4 className="text-sm font-medium text-gray-700">Tiện ích</h4>
              <ChevronDown
                className={`transition-transform ${
                  collapse.amenities ? "rotate-180" : ""
                }`}
                size={18}
              />
            </div>
            {!collapse.amenities && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {[
                  {
                    value: "meal",
                    label: "Bữa ăn",
                    icon: <Coffee size={14} className="mr-1" />,
                  },
                  {
                    value: "wifi",
                    label: "Wifi",
                    icon: <Wifi size={14} className="mr-1" />,
                  },
                  {
                    value: "power",
                    label: "Nguồn điện",
                    icon: <Power size={14} className="mr-1" />,
                  },
                  {
                    value: "entertainment",
                    label: "Giải trí",
                    icon: <Monitor size={14} className="mr-1" />,
                  },
                ].map((amenity) => (
                  <label
                    key={amenity.value}
                    className="flex items-center space-x-2"
                  >
                    <input
                      type="checkbox"
                      checked={filters.amenities.includes(amenity.value)}
                      onChange={(e) => {
                        const newAmenities = e.target.checked
                          ? [...filters.amenities, amenity.value]
                          : filters.amenities.filter(
                              (a) => a !== amenity.value
                            );
                        handleFilterChangeRealtime("amenities", newAmenities);
                      }}
                      className="form-checkbox text-emerald-600 h-4 w-4 rounded"
                    />
                    <span className="flex items-center">
                      {amenity.icon}
                      <span>{amenity.label}</span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
          {/* Giá vé */}
          <div className="sidebar-section mb-6">
            <div
              className="flex justify-between items-center sidebar-toggle"
              onClick={() => setCollapse((c) => ({ ...c, price: !c.price }))}
            >
              <h4 className="text-sm font-medium text-gray-700">
                Giá vé/hành khách
              </h4>
              <ChevronDown
                className={`transition-transform ${
                  collapse.price ? "rotate-180" : ""
                }`}
                size={18}
              />
            </div>
            {!collapse.price && (
              <div className="px-2 mt-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{formatPrice(filters.priceRange.min)}</span>
                  <span>{formatPrice(filters.priceRange.max)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10000000"
                  step="100000"
                  value={filters.priceRange.max}
                  onChange={(e) => {
                    handleFilterChangeRealtime("priceRange", {
                      ...filters.priceRange,
                      max: parseInt(e.target.value),
                    });
                  }}
                  className="w-full h-2 bg-emerald-100 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )}
          </div>
        </aside>
        {/* Main Content: Kết quả tìm kiếm */}
        <div className="flex-1 min-w-0">
          {/* Header cho kết quả tìm kiếm */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {searchPerformed ? "Kết quả tìm kiếm" : "Tất cả chuyến bay"}
              </h2>
              {searchPerformed ? (
                <div className="flex items-center text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
                  <span className="font-medium text-emerald-700">
                    {searchParams.from_location}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mx-2 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                  <span className="font-medium text-emerald-700">
                    {searchParams.to_location}
                  </span>
                  {searchParams.departure_date && (
                    <>
                      <span className="mx-2 text-gray-400">•</span>
                      <span>
                        {new Date(
                          searchParams.departure_date
                        ).toLocaleDateString("vi-VN")}
                      </span>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-gray-600">
                  Các chuyến bay phổ biến hoặc tìm kiếm để xem chuyến bay phù
                  hợp
                </p>
              )}
            </div>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    // Hiển thị trạng thái loading
                    setLoading(true);
                  }}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                >
                  <option value="price">Giá thấp nhất</option>
                  <option value="price_desc">Giá cao nhất</option>
                  <option value="duration">Thời gian bay ngắn nhất</option>
                  <option value="duration_desc">Thời gian bay dài nhất</option>
                  <option value="departure">Giờ khởi hành sớm nhất</option>
                  <option value="departure_desc">
                    Giờ khởi hành muộn nhất
                  </option>
                </select>
                <ChevronDown
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none"
                  size={16}
                />
              </div>
            </div>
          </div>

          {/* Search Results Count */}
          <div className="mb-6 text-gray-600">
            <p>
              {loading ? (
                <span className="flex items-center">
                  <Loader size={16} className="animate-spin mr-2" />
                  Đang tải chuyến bay...
                </span>
              ) : (
                `Đã tìm thấy ${totalFlights} chuyến bay`
              )}
            </p>
          </div>

          {/* Flight Cards */}
          <div className="space-y-5">
            {flights.map((flight) => {
              const isPromo = !!flight.promotion;
              return (
                <div
                  key={flight.id}
                  className={
                    `flight-card rounded-xl overflow-hidden transition-all duration-300 ` +
                    (isPromo
                      ? "border-2 border-orange-400 bg-orange-50 shadow-lg relative promo-flight-card"
                      : "bg-white border border-gray-100 shadow-md hover:shadow-lg")
                  }
                >
                  {/* Tag % giảm ở góc trên bên phải */}
                  {isPromo && (
                    <>
                      <div className="absolute top-0 right-0 z-30 px-4 py-1 bg-orange-500 text-white font-bold text-sm rounded-bl-2xl shadow-md flex items-center gap-1">
                        <Tag size={14} />
                        {flight.promotion.type === "percentage"
                          ? `-${flight.promotion.discount}%`
                          : `-${formatPrice(flight.promotion.discount)}`}
                      </div>
                      <div className="absolute top-0 left-0 z-20 flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-orange-400 to-orange-300 text-white font-bold rounded-br-2xl shadow-md">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-5 h-5 mr-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 17.75l-6.172 3.245 1.179-6.873L2 9.755l6.908-1.004L12 2.5l3.092 6.251L22 9.755l-5.007 4.367 1.179 6.873z"
                          />
                        </svg>
                        <span>
                          {flight.promotion.title || "Khuyến mãi HOT"}
                        </span>
                      </div>
                    </>
                  )}
                  {/* Icon khuyến mãi góc trái */}
                  {isPromo && (
                    <div className="absolute top-0 left-0 z-20 flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-orange-400 to-orange-300 text-white font-bold rounded-br-2xl shadow-md">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 17.75l-6.172 3.245 1.179-6.873L2 9.755l6.908-1.004L12 2.5l3.092 6.251L22 9.755l-5.007 4.367 1.179 6.873z"
                        />
                      </svg>
                      <span>Khuyến mãi HOT</span>
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between">
                      {/* Airline Info */}
                      <div className="mb-4 md:mb-0 border-b md:border-b-0 pb-4 md:pb-0 md:pr-6 md:border-r border-gray-100">
                        <div className="flex items-center gap-4 mb-2">
                          <img
                            src={flight.airlineLogo}
                            alt={flight.airline}
                            className="w-24 h-24 object-contain rounded border border-gray-100 p-1 bg-white shadow-sm"
                            onError={(e) => {
                              // Fallback sang placeholder nếu ảnh không load được
                              e.target.src = `${API_HOST}/images/placeholder.png`;
                              e.target.onerror = null; // Tránh lặp vô hạn
                            }}
                          />
                          <div>
                            <h3 className="font-semibold text-lg">
                              {flight.airline}
                            </h3>
                            <span className="text-sm text-gray-500">
                              {flight.flightNumber}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-emerald-600 mt-1">
                          <div className="flex space-x-1">
                            {flight.amenities &&
                              flight.amenities.map((amenity, idx) => (
                                <span
                                  key={idx}
                                  className="w-6 h-6 flex items-center justify-center bg-emerald-50 rounded-full"
                                >
                                  {amenity === "meal" ? (
                                    <Coffee size={14} />
                                  ) : amenity === "wifi" ? (
                                    <Wifi size={14} />
                                  ) : amenity === "power" ? (
                                    <Power size={14} />
                                  ) : (
                                    <Monitor size={14} />
                                  )}
                                </span>
                              ))}
                          </div>
                          <span className="text-xs text-gray-500">
                            {flight.baggage.cabin} + {flight.baggage.checked}
                          </span>
                        </div>
                      </div>

                      {/* Flight Route - Đặt ở vị trí giữa */}
                      <div className="flex-grow flex items-center gap-4 justify-between md:justify-center mb-4 md:mb-0">
                        <div className="text-center">
                          <div className="text-2xl font-bold">
                            {flight.departureTime}
                          </div>
                          <div className="text-sm text-gray-500">
                            {flight.from}
                          </div>
                        </div>
                        <div className="flex flex-col items-center mx-4">
                          <div className="text-xs text-gray-500 mb-1">
                            {flight.duration}
                          </div>
                          <div className="w-full flex items-center">
                            <div className="h-0.5 w-10 md:w-16 lg:w-24 bg-gray-200"></div>
                            <Plane
                              className="mx-2 text-emerald-500 transform rotate-90"
                              size={16}
                            />
                            <div className="h-0.5 w-10 md:w-16 lg:w-24 bg-gray-200"></div>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {flight.status === "scheduled"
                              ? "Bay thẳng"
                              : flight.status}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">
                            {flight.arrivalTime}
                          </div>
                          <div className="text-sm text-gray-500">
                            {flight.to}
                          </div>
                        </div>
                      </div>

                      {/* Price & Booking - Đặt ở vị trí cuối */}
                      <div className="md:ml-6 md:pl-6 md:border-l border-gray-100 text-right mt-4 md:mt-8">
                        {flight.promotion ? (
                          <>
                            <div className="text-2xl font-bold text-orange-600">
                              {formatPrice(
                                flight.calculateTotalPrice(searchParams.class)
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <p className="text-sm text-gray-400 line-through">
                                {formatPrice(
                                  Number(flight.price) +
                                    (flight.seatClasses[searchParams.class]
                                      ?.price || 0)
                                )}
                              </p>
                              {flight.daysRemaining && (
                                <p className="text-xs text-orange-500">
                                  Còn {flight.daysRemaining} ngày
                                </p>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="text-2xl font-bold text-emerald-600">
                            {formatPrice(
                              flight.calculateTotalPrice(searchParams.class)
                            )}
                          </div>
                        )}
                        <div className="flex flex-col items-end gap-1">
                          <p className="text-sm text-gray-500">
                            {searchParams.class === "economy"
                              ? "Phổ thông"
                              : searchParams.class === "premium_economy"
                              ? "Phổ thông đặc biệt"
                              : searchParams.class === "business"
                              ? "Thương gia"
                              : "Hạng nhất"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {flight.seatClasses[searchParams.class]
                              ?.available_seats || flight.seats}{" "}
                            chỗ trống
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Flight Details Footer */}
                  <div className="border-t border-gray-100 p-4 bg-emerald-50/50 flex flex-wrap items-center justify-between">
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                          {flight.status === "scheduled"
                            ? "Đúng giờ"
                            : flight.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={14} className="text-gray-400" />
                        <span>Thời gian bay: {flight.duration}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Briefcase size={14} className="text-gray-400" />
                        <span>
                          Hành lý: {flight.baggage.cabin} +{" "}
                          {flight.baggage.checked}
                        </span>
                      </div>
                      {flight.promotion && (
                        <div className="flex items-center gap-1">
                          <Wallet size={14} className="text-red-500" />
                          <span className="text-red-500 font-medium">
                            {flight.promotion.title || "Khuyến mãi"}:{" "}
                            {flight.promotion.type === "percentage"
                              ? `Giảm ${flight.promotion.discount}%`
                              : `Giảm ${formatPrice(
                                  flight.promotion.discount
                                )}`}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Nút Chọn - Đặt dưới Footer */}
                    <button
                      onClick={() => handleSelectFlight(flight.id)}
                      className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm text-sm font-medium mt-2 md:mt-0"
                    >
                      Chọn chuyến bay
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Component */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setCurrentPage(Math.max(1, currentPage - 1));
                    // Không cần gọi scrollToResults ở đây vì sẽ được gọi qua useEffect
                  }}
                  disabled={currentPage === 1 || loading}
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

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    // Nếu tổng số trang <= 5, hiển thị tất cả
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    // Nếu đang ở gần đầu, hiển thị 1-5
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    // Nếu đang ở gần cuối, hiển thị totalPages-4 đến totalPages
                    pageNum = totalPages - 4 + i;
                  } else {
                    // Ở giữa, hiển thị currentPage-2 đến currentPage+2
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => {
                        setCurrentPage(pageNum);
                        // Không cần gọi scrollToResults ở đây vì sẽ được gọi qua useEffect
                      }}
                      disabled={loading}
                      className={`w-10 h-10 flex items-center justify-center rounded-lg ${
                        currentPage === pageNum
                          ? "bg-emerald-600 text-white"
                          : "border hover:bg-emerald-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => {
                    setCurrentPage(Math.min(totalPages, currentPage + 1));
                    // Không cần gọi scrollToResults ở đây vì sẽ được gọi qua useEffect
                  }}
                  disabled={currentPage === totalPages || loading}
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

      {/* Popular Destinations - full width */}
      <PopularDestinations
        destinations={popularDestinations}
        loading={loadingDestinations}
      />

      {/* Suggestions for Other Services */}
      <ServiceSuggestions
        services={[
          {
            id: "hotels",
            title: "Khách Sạn",
            description: "Hơn 1000+ khách sạn, homestay giá tốt",
            icon: Hotel,
            path: "/hotels",
            color: "blue",
          },
          {
            id: "tours",
            title: "Tour Du Lịch",
            description: "Khám phá vẻ đẹp Việt Nam & thế giới",
            icon: Map,
            path: "/tours",
            color: "green",
          },
          {
            id: "transport",
            title: "Vé Xe & Tàu",
            description: "Di chuyển dễ dàng, tiết kiệm",
            icon: Bus,
            path: "/transport",
            color: "orange",
          },
        ]}
      />
    </div>
  );
};

export default FlightSearch;
