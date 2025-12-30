/**
 * Hotels API
 */
import apiClient from "./client";

export const hotelsAPI = {
  getAll: (params) => apiClient.get("/hotels", { params }),

  getById: (id) => apiClient.get(`/hotels/${id}`),

  getRooms: (id) => apiClient.get(`/hotels/${id}/rooms`),

  create: (hotelData) => apiClient.post("/hotels", hotelData),

  update: (id, hotelData) => apiClient.put(`/hotels/${id}`, hotelData),

  delete: (id) => apiClient.delete(`/hotels/${id}`),
};

export default hotelsAPI;
