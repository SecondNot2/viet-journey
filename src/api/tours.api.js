/**
 * Tours API
 */
import apiClient from "./client";

export const toursAPI = {
  getAll: (params) => apiClient.get("/tours", { params }),

  getFeatured: () => apiClient.get("/tours/featured"),

  getById: (id) => apiClient.get(`/tours/${id}`),

  create: (tourData) => apiClient.post("/tours", tourData),

  update: (id, tourData) => apiClient.put(`/tours/${id}`, tourData),

  delete: (id) => apiClient.delete(`/tours/${id}`),
};

export default toursAPI;
