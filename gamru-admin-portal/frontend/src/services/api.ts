import axios, { AxiosRequestConfig, type AxiosInstance } from 'axios';
import type { ApiResponse } from '@/types';

/**
 * Main Axios Instance
 */
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor
 * Add Access Token Automatically
 */
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  const expiry = sessionStorage.getItem('token_expiry');

  if (token && expiry && Date.now() < Number(expiry)) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (res) => res.data,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.clear();
    }

    return Promise.reject(error.response?.data ?? { message: 'Something went wrong' });
  }
);

/**
 * Common Methods - generic-typed for full type-safety on responses
 */
const apiService = {
  get: <T = unknown>(
    url: string,
    params?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> =>
    api.get(url, { params, ...config }) as unknown as Promise<ApiResponse<T>>,

  post: <T = unknown>(
    url: string,
    payload: unknown = {},
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> =>
    api.post(url, payload, config) as unknown as Promise<ApiResponse<T>>,

  put: <T = unknown>(
    url: string,
    payload: unknown = {},
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> => api.put(url, payload, config) as unknown as Promise<ApiResponse<T>>,

  patch: <T = unknown>(
    url: string,
    payload: unknown = {},
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> =>
    api.patch(url, payload, config) as unknown as Promise<ApiResponse<T>>,

  delete: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    api.delete(url, config) as unknown as Promise<ApiResponse<T>>,
};

export default apiService;
