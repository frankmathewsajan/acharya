import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ApiError } from './types';

// API Base URL
export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1/';

// Create axios instance with default configuration
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor to add auth token
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling and token refresh
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    async (error) => {
      const originalRequest = error.config;

      // Handle 401 errors and token refresh
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          try {
            const response = await axios.post(`${client.defaults.baseURL}users/auth/refresh/`, {
              refresh: refreshToken,
            });
            
            const { access } = response.data;
            localStorage.setItem('access_token', access);
            
            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${access}`;
            return client(originalRequest);
          } catch (refreshError) {
            // Refresh failed, redirect to login
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            window.location.href = '/auth';
            return Promise.reject(refreshError);
          }
        } else {
          // No refresh token, redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/auth';
        }
      }

      // Transform error response
      const apiError: ApiError = {
        success: false,
        message: error.response?.data?.message || error.message || 'An error occurred',
        timestamp: new Date().toISOString(),
        errors: error.response?.data?.errors || ['An error occurred'],
        status: error.response?.status,
      };

      return Promise.reject(apiError);
    }
  );

  return client;
};

export const apiClient = createApiClient();

// Utility function to handle API responses
export const handleApiResponse = <T>(response: AxiosResponse<T>): T => {
  return response.data;
};

// Utility function to handle file uploads
export const uploadFile = async (file: File, endpoint: string): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post(endpoint, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return handleApiResponse(response);
};

// Generic API methods
export const api = {
  get: <T>(url: string, params?: any): Promise<T> =>
    apiClient.get(url, { params }).then(handleApiResponse),
  
  post: <T>(url: string, data?: any): Promise<T> =>
    apiClient.post(url, data).then(handleApiResponse),
  
  patch: <T>(url: string, data?: any): Promise<T> =>
    apiClient.patch(url, data).then(handleApiResponse),
  
  put: <T>(url: string, data?: any): Promise<T> =>
    apiClient.put(url, data).then(handleApiResponse),
  
  delete: <T>(url: string): Promise<T> =>
    apiClient.delete(url).then(handleApiResponse),
};