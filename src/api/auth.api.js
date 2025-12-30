/**
 * Auth API
 * Authentication related API calls
 */
import apiClient from "./client";

export const authAPI = {
  login: (credentials) => apiClient.post("/auth/login", credentials),

  register: (userData) => apiClient.post("/auth/register", userData),

  logout: () => apiClient.post("/auth/logout"),

  changePassword: (passwordData) =>
    apiClient.put("/auth/change-password", passwordData),

  getProfile: () => apiClient.get("/users/profile"),
};

export default authAPI;
