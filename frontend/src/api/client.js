import axios from "axios";

export const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
export const AUTH_STORAGE_KEY = "broker-platform:auth-token";
export const BROKER_AUTH_STORAGE_KEY = "broker-platform:broker-auth-token";

function createApiClient(storageKey) {
  const client = axios.create({
    baseURL: API_BASE_URL,
  });

  client.interceptors.request.use((config) => {
    const token = storageKey ? localStorage.getItem(storageKey) : null;

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  });

  return client;
}

const adminApi = createApiClient(AUTH_STORAGE_KEY);
export const brokerApi = createApiClient(BROKER_AUTH_STORAGE_KEY);
export const publicApi = createApiClient();

export default adminApi;
