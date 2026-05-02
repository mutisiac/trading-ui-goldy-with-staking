import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_URL?.replace(/\/+$/, "") ||
  "http://localhost:8080";

/**
 * Shared Axios instance for the WhatsApp Campaigner backend.
 * - Sends cookies (`withCredentials`) for httpOnly session cookies.
 * - Attaches `Authorization: Bearer <token>` from localStorage when calling the API origin (same as previous fetch monkey-patch).
 */
export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && config.headers && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData && config.headers) {
    delete config.headers["Content-Type"];
  }
  return config;
});

export default api;
