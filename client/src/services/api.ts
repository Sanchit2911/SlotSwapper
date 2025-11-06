// client/src/services/api.ts

import axios, { AxiosError } from "axios"; // **CHANGE: Imported AxiosError**
import { Event } from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// **CHANGES: Greatly improved response error handler**
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Check if the error has a response and data
    if (error.response && error.response.data) {
      const data = error.response.data as { message?: string; errors?: any[] };

      // 1. Check for our custom backend 'message'
      // This catches 400, 403, 404, 500 errors
      if (data.message) {
        // If it's a validation error, be more specific
        if (
          data.errors &&
          Array.isArray(data.errors) &&
          data.errors.length > 0
        ) {
          // Return the first validation error message
          return Promise.reject(new Error(data.errors[0].message));
        }
        // Otherwise, return the general message
        return Promise.reject(new Error(data.message));
      }
    }

    // 2. Handle 401 Unauthorized (e.g., expired token)
    if (error.response?.status === 401) {
      // Aggressive redirect can be bad UX.
      // It's better to let components handle this via an error.
      // localStorage.removeItem("token");
      // localStorage.removeItem("user");
      // window.location.href = "/login";
      return Promise.reject(
        new Error("Your session has expired. Please log in again.")
      );
    }

    // 3. Fallback for generic network errors
    return Promise.reject(
      new Error(error.message || "A network error occurred.")
    );
  }
);

// Auth API
export const authAPI = {
  signup: (data: { name: string; email: string; password: string }) =>
    api.post("/auth/signup", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  getMe: () => api.get("/auth/me"),
};

// Events API
export const eventsAPI = {
  getAll: () => api.get("/events"),
  create: (data: {
    title: string;
    startTime: string;
    endTime: string;
    status?: string;
  }) => api.post("/events", data),
  update: (id: string, data: Partial<Event>) =>
    api.patch(`/events/${id}`, data),
  delete: (id: string) => api.delete(`/events/${id}`),
};

// Swaps API
export const swapsAPI = {
  getAvailableSlots: () => api.get("/swaps/available-slots"),
  createRequest: (data: { mySlotId: string; theirSlotId: string }) =>
    api.post("/swaps/request", data),
  getIncoming: () => api.get("/swaps/incoming"),
  getOutgoing: () => api.get("/swaps/outgoing"),
  accept: (id: string) => api.post(`/swaps/${id}/accept`),
  reject: (id: string) => api.post(`/swaps/${id}/reject`),
  cancel: (id: string) => api.delete(`/swaps/${id}`),
};

// **ADDITION: A simple helper to use in all 'catch' blocks**
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return "An unknown error occurred.";
};

export default api;
