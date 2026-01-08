/**
 * API Client
 * Centralized Axios instance for API calls
 */
import axios from "axios";

// Determine API base URL based on environment
const getApiBaseUrl = () => {
  // If we're in production (Vercel), use relative URL
  if (process.env.NODE_ENV === "production") {
    return "/api";
  }
  // In development, use env variable or fallback
  return process.env.REACT_APP_API_URL || "http://localhost:5000/api";
};

const API_BASE_URL = getApiBaseUrl();

// Export for components that need direct access
export { API_BASE_URL };

// Also export the raw base (without /api) for image URLs etc.
export const API_HOST =
  process.env.NODE_ENV === "production" ? "" : "http://localhost:5000";

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add any custom headers here
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
