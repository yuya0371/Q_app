import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/authStore';

// Base URL will be configured based on environment
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

// トークンリフレッシュ用のエンドポイント
const REFRESH_TOKEN_URL = '/auth/refresh';

// リフレッシュ中フラグ（同時リフレッシュ防止）
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

// リフレッシュ完了を待っているリクエストを処理
const onRefreshed = (newToken: string) => {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
};

// リフレッシュ完了を待つサブスクライバーを追加
const addRefreshSubscriber = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const state = useAuthStore.getState();
    const token = state.accessToken;
    console.log('[API]', config.method?.toUpperCase(), config.url);
    console.log('[API] Token exists:', !!token, 'isAuthenticated:', state.isAuthenticated);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // デバッグ用: トークンの最初と最後の数文字を表示
      console.log('[API] Token preview:', token.substring(0, 20) + '...' + token.substring(token.length - 10));
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // デバッグ用: エラーレスポンスの詳細をログ
    console.log('[API] Error response:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
    });

    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      // リフレッシュトークンエンドポイント自体が401の場合はログアウト
      if (originalRequest.url === REFRESH_TOKEN_URL) {
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshToken) {
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }

      // 既にリフレッシュ中の場合は待機
      if (isRefreshing) {
        return new Promise((resolve) => {
          addRefreshSubscriber((newToken: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            resolve(api(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        // トークンリフレッシュリクエスト
        const response = await axios.post(`${API_BASE_URL}${REFRESH_TOKEN_URL}`, {
          refreshToken,
        });

        // API GatewayのCognitoUserPoolsAuthorizerはID Tokenを期待するため、idTokenを使用
        const { idToken: newIdToken, refreshToken: newRefreshToken } = response.data.data;
        const currentUser = useAuthStore.getState().user;

        if (currentUser) {
          useAuthStore.getState().setAuth(currentUser, newIdToken, newRefreshToken);
        }

        // 待機中のリクエストを処理
        onRefreshed(newIdToken);

        // 元のリクエストをリトライ
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newIdToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        // リフレッシュ失敗、ログアウト
        useAuthStore.getState().logout();
        refreshSubscribers = [];
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// API response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
}

// API methods
export const apiClient = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    api.get<ApiResponse<T>>(url, config).then((res) => res.data),

  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    api.post<ApiResponse<T>>(url, data, config).then((res) => res.data),

  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    api.put<ApiResponse<T>>(url, data, config).then((res) => res.data),

  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    api.patch<ApiResponse<T>>(url, data, config).then((res) => res.data),

  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    api.delete<ApiResponse<T>>(url, config).then((res) => res.data),
};

export default api;
