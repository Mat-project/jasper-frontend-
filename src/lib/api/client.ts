/**
 * Axios HTTP client with JWT authentication interceptors.
 *
 * Features:
 * - Reads NEXT_PUBLIC_API_BASE_URL or NEXT_PUBLIC_API_URL dynamically
 * - Attaches Bearer token to all requests
 * - Automatically refreshes access token on 401
 * - Queues parallel requests during token refresh
 * - Clears auth state on refresh failure
 */
import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";

const TOKEN_KEY = "eoms_access";
const REFRESH_KEY = "eoms_refresh";

export const getBaseUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
  if (envUrl) {
    return envUrl.endsWith("/") ? envUrl.slice(0, -1) : envUrl;
  }
  return "";
};

// ── Create axios instance ────────────────────────────────────────────────────
const apiClient: AxiosInstance = axios.create({
  baseURL: getBaseUrl(),
  timeout: 30_000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: false,
});

// ── Token helpers ────────────────────────────────────────────────────────────
export const getAccessToken = (): string | null =>
  Cookies.get(TOKEN_KEY) ?? null;

export const getRefreshToken = (): string | null =>
  Cookies.get(REFRESH_KEY) ?? null;

export const setTokens = (access: string, refresh: string): void => {
  const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
  Cookies.set(TOKEN_KEY, access, { expires: 1 / 96, secure: isSecure, sameSite: "Lax" }); // 15 min
  Cookies.set(REFRESH_KEY, refresh, { expires: 7, secure: isSecure, sameSite: "Lax" }); // 7 days
};

export const clearTokens = (): void => {
  Cookies.remove(TOKEN_KEY);
  Cookies.remove(REFRESH_KEY);
};

// ── Helper for Token Refresh Endpoint ───────────────────────────────────────
const getRefreshEndpoint = (): string => {
  const base = (apiClient.defaults.baseURL || getBaseUrl()).replace(/\/+$/, "");
  if (base.endsWith("/api")) {
    return `${base}/v1/auth/refresh/`;
  }
  return `${base}/api/v1/auth/refresh/`;
};

// ── Request interceptor — attach access token ────────────────────────────────
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Allow Axios to auto-detect FormData and set the multipart boundary
    if (config.data instanceof FormData && config.headers) {
      delete config.headers["Content-Type"];
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — refresh on 401 ───────────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (reason: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null): void => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else if (token) {
      resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = (error.config || {}) as AxiosRequestConfig & {
      _retry?: boolean;
    };
    const requestUrl = originalRequest.url || "";
    const isAuthEndpoint = requestUrl.includes("/auth/login") || requestUrl.includes("/token") || requestUrl.includes("/login");

    // Only intercept 401 errors, avoid infinite loops, and skip auth endpoints
    if (error.response?.status !== 401 || originalRequest._retry || isAuthEndpoint) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue this request while refresh is in progress
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        if (originalRequest.headers) {
          originalRequest.headers["Authorization"] = `Bearer ${token}`;
        }
        return apiClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      processQueue(new Error("No refresh token"));
      clearTokens();
      window.location.href = "/login";
      return Promise.reject(error);
    }

    try {
      const response = await axios.post(
        getRefreshEndpoint(),
        { refresh: refreshToken }
      );
      const { access } = response.data;
      setTokens(access, refreshToken);
      processQueue(null, access);
      if (originalRequest.headers) {
        originalRequest.headers["Authorization"] = `Bearer ${access}`;
      }
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);
      clearTokens();
      window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default apiClient;
