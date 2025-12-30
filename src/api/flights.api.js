/**
 * Flights API
 */
import apiClient from "./client";

export const flightsAPI = {
  getAll: (params) => apiClient.get("/flights", { params }),

  getById: (id) => apiClient.get(`/flights/${id}`),

  create: (flightData) => apiClient.post("/flights", flightData),

  update: (id, flightData) => apiClient.put(`/flights/${id}`, flightData),

  delete: (id) => apiClient.delete(`/flights/${id}`),
};

export default flightsAPI;
