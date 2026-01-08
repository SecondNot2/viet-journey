/**
 * API Configuration
 * This file provides centralized API URL configuration
 * Import { API_URL, API_HOST } from this file instead of defining locally
 */

// Determine API base URL based on environment
const getApiBaseUrl = () => {
  // If we're in production (Vercel), use relative URL
  if (process.env.NODE_ENV === "production") {
    return "/api";
  }
  // In development, use env variable or fallback
  return process.env.REACT_APP_API_URL || "http://localhost:5000/api";
};

// API_URL - Use for API calls (includes /api prefix)
export const API_URL = getApiBaseUrl();

// API_HOST - Use for image/static URLs (no /api prefix)
export const API_HOST =
  process.env.NODE_ENV === "production" ? "" : "http://localhost:5000";

// For backward compatibility with code using API_URL without /api
// This removes /api suffix for legacy code patterns
export const API_BASE = API_HOST;

export default API_URL;
