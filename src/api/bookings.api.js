/**
 * Bookings API
 */
import apiClient from "./client";

export const bookingsAPI = {
  getAll: (params) => apiClient.get("/bookings", { params }),

  getById: (id) => apiClient.get(`/bookings/${id}`),

  create: (bookingData) => apiClient.post("/bookings", bookingData),

  updateStatus: (id, status) =>
    apiClient.put(`/bookings/${id}/status`, { status }),

  cancel: (id) => apiClient.delete(`/bookings/${id}`),
};

export default bookingsAPI;
