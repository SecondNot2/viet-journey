/**
 * Route Constants
 */
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  PROFILE: "/profile",

  // Services
  TOURS: "/tours",
  TOUR_DETAIL: "/tours/:id",
  HOTELS: "/hotels",
  HOTEL_DETAIL: "/hotels/:id",
  FLIGHTS: "/flights",
  TRANSPORT: "/transport",

  // Destinations
  DESTINATIONS: "/destinations",
  DESTINATION_DETAIL: "/destinations/:id",

  // Content
  BLOG: "/blog",
  BLOG_DETAIL: "/blog/:slug",
  ABOUT: "/about",
  CONTACT: "/contact",

  // User
  WISHLIST: "/wishlist",
  BOOKINGS: "/bookings",

  // Admin
  ADMIN: "/admin",
  ADMIN_DASHBOARD: "/admin/dashboard",
  ADMIN_USERS: "/admin/users",
  ADMIN_TOURS: "/admin/tours",
  ADMIN_HOTELS: "/admin/hotels",
  ADMIN_FLIGHTS: "/admin/flights",
  ADMIN_BOOKINGS: "/admin/bookings",
  ADMIN_PROMOTIONS: "/admin/promotions",
  ADMIN_POSTS: "/admin/posts",
  ADMIN_REVIEWS: "/admin/reviews",
};

export default ROUTES;
