/**
 * Route Configuration - Single Source of Truth
 * Dùng cho: App.js routing, Header navigation, Breadcrumbs
 */

// ==============================================
// ROUTE PATHS (backwards compatible export)
// ==============================================
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  PROFILE: "/profile",

  // Services
  TOURS: "/tours",
  TOUR_DETAIL: "/tours/:id",
  TOUR_BOOKING: "/tours/:id/booking",
  TOUR_BOOKING_SUCCESS: "/tours/booking/success",

  HOTELS: "/hotels",
  HOTEL_DETAIL: "/hotels/:id",
  HOTEL_BOOKING: "/hotels/:id/booking",
  HOTEL_BOOKING_SUCCESS: "/hotels/booking/success",

  FLIGHTS: "/flights",
  FLIGHT_DETAIL: "/flights/:id",
  FLIGHT_BOOKING: "/flights/:id/booking",
  FLIGHT_BOOKING_SUCCESS: "/flights/booking/success",

  TRANSPORT: "/transport",
  TRANSPORT_DETAIL: "/transport/:id",
  TRANSPORT_BOOKING: "/transport/:id/booking",
  TRANSPORT_BOOKING_SUCCESS: "/transport/booking/success",

  // Destinations
  DESTINATIONS: "/destinations",
  DESTINATION_DETAIL: "/destinations/:id",

  // Content
  BLOG: "/blog",
  BLOG_CATEGORY: "/blog/:category",
  BLOG_POST: "/blog/post/:id",
  ABOUT: "/about",

  // User
  WISHLIST: "/wishlist",
  BOOKINGS: "/profile/bookings",
  REVIEWS: "/profile/reviews",

  // Admin
  ADMIN: "/admin",
  ADMIN_DASHBOARD: "/admin/dashboard",
  ADMIN_USERS: "/admin/users",
  ADMIN_TOURS: "/admin/tours",
  ADMIN_HOTELS: "/admin/hotels",
  ADMIN_FLIGHTS: "/admin/flights",
  ADMIN_TRANSPORT: "/admin/transport",
  ADMIN_DESTINATIONS: "/admin/destinations",
  ADMIN_BOOKINGS: "/admin/bookings",
  ADMIN_PROMOTIONS: "/admin/promotions",
  ADMIN_POSTS: "/admin/posts",
  ADMIN_REVIEWS: "/admin/reviews",
  ADMIN_PROFILE: "/admin/profile",
};

// ==============================================
// ROUTE NAMES (Vietnamese) - for Breadcrumbs
// ==============================================
export const ROUTE_NAMES = {
  // Main pages
  "/": "Trang chủ",
  "/tours": "Tour Du Lịch",
  "/hotels": "Khách Sạn",
  "/flights": "Vé Máy Bay",
  "/transport": "Vé Xe/Tàu",
  "/destinations": "Điểm Đến",
  "/blog": "Blog Du Lịch",
  "/about": "Giới Thiệu",
  "/wishlist": "Yêu Thích",

  // Auth
  "/login": "Đăng Nhập",
  "/register": "Đăng Ký",

  // User
  "/profile": "Tài Khoản",
  "/profile/bookings": "Lịch Sử Đặt Chỗ",
  "/profile/reviews": "Đánh Giá Của Tôi",

  // Actions
  booking: "Đặt Chỗ",
  success: "Thành Công",

  // Tour types
  type: "Loại Tour",
  region: "Vùng Miền",

  // Regions
  "miền-bắc": "Miền Bắc",
  "miền-trung": "Miền Trung",
  "miền-nam": "Miền Nam",

  // Tour categories
  "tour-khám-phá": "Tour Khám Phá",
  "tour-nghỉ-dưỡng": "Tour Nghỉ Dưỡng",
  "tour-mạo-hiểm": "Tour Mạo Hiểm",

  // Admin
  "/admin": "Quản Trị",
  "/admin/dashboard": "Dashboard",
  "/admin/users": "Người Dùng",
  "/admin/tours": "Quản Lý Tour",
  "/admin/hotels": "Quản Lý Khách Sạn",
  "/admin/flights": "Quản Lý Chuyến Bay",
  "/admin/transport": "Quản Lý Vận Chuyển",
  "/admin/destinations": "Quản Lý Điểm Đến",
  "/admin/bookings": "Quản Lý Đặt Chỗ",
  "/admin/promotions": "Khuyến Mãi",
  "/admin/posts": "Bài Viết",
  "/admin/reviews": "Đánh Giá",
  "/admin/profile": "Hồ Sơ Admin",
};

// ==============================================
// BREADCRUMB HELPERS
// ==============================================

/**
 * Segments that should be hidden in breadcrumbs
 * These are "virtual" route segments that don't represent actual pages
 */
export const HIDDEN_SEGMENTS = [
  "post", // /blog/post/:id -> hide "post", show blog title
  "type", // /tours/type/:type -> hide "type"
  "region", // /tours/region/:region -> hide "region"
];

/**
 * Get display name for a route segment
 * @param {string} segment - URL segment (e.g., "tours", "booking")
 * @param {string} fullPath - Full current path for context
 * @param {string} dynamicTitle - Optional dynamic title for the current page
 * @returns {string} Vietnamese display name
 */
export const getRouteName = (segment, fullPath = "", dynamicTitle = "") => {
  // If dynamic title is provided (e.g., blog post title), use it
  if (dynamicTitle) {
    return dynamicTitle;
  }

  // Check full path first
  if (ROUTE_NAMES[fullPath]) {
    return ROUTE_NAMES[fullPath];
  }

  // Check segment
  if (ROUTE_NAMES[`/${segment}`]) {
    return ROUTE_NAMES[`/${segment}`];
  }

  if (ROUTE_NAMES[segment]) {
    return ROUTE_NAMES[segment];
  }

  // Check for numeric ID or UUID - will be replaced by dynamic title from context
  if (/^\d+$/.test(segment) || /^[0-9a-f-]{36}$/i.test(segment)) {
    return null; // Return null to signal "use dynamic title"
  }

  // Capitalize first letter as fallback
  return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
};

/**
 * Pages that should not show breadcrumbs
 */
export const EXCLUDED_BREADCRUMB_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
];

/**
 * Check if path should show breadcrumbs
 */
export const shouldShowBreadcrumbs = (pathname) => {
  if (pathname === "/") return false;
  return !EXCLUDED_BREADCRUMB_PATHS.some((path) => pathname.startsWith(path));
};

export default ROUTES;
