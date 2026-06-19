import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "/api";

export const apiClient = axios.create({
  baseURL,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json"
  }
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("velura_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export function getApiError(error, fallback = "Something went wrong. Please try again.") {
  return error?.response?.data?.message || error?.message || fallback;
}

export function buildApiUrl(path) {
  const normalizedBase = baseURL.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${normalizedBase}${normalizedPath}`;
}
