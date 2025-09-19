// Enhanced API Client with Better Error Handling
// lib/api/enhancedClient.ts

import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

export interface StandardApiResponse<T = any> {
  success: boolean;
  message: string;
  timestamp: string;
  data?: T;
  errors?: any[];
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  timestamp: string;
  errors: any[];
  status?: number;
}

// Enhanced API Client Class
export class EnhancedApiClient {
  private client: AxiosInstance;
  
  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    this.setupInterceptors();
  }
  
  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Log request for debugging
        console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
          params: config.params,
          data: config.data
        });
        
        return config;
      },
      (error) => {
        console.error('🚫 Request Error:', error);
        return Promise.reject(error);
      }
    );
    
    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log successful response
        console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
          status: response.status,
          data: response.data
        });
        
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as any;
        
        // Handle 401 errors with token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            await this.refreshToken();
            const token = this.getAuthToken();
            if (token && originalRequest) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            this.handleAuthFailure();
            return Promise.reject(refreshError);
          }
        }
        
        // Format error response
        const formattedError = this.formatError(error);
        console.error('❌ API Error:', formattedError);
        
        return Promise.reject(formattedError);
      }
    );
  }
  
  private getAuthToken(): string | null {
    return localStorage.getItem('access_token');
  }
  
  private async refreshToken(): Promise<void> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    try {
      const response = await axios.post(`${this.client.defaults.baseURL}users/auth/refresh/`, {
        refresh: refreshToken,
      });
      
      const { access } = response.data;
      localStorage.setItem('access_token', access);
    } catch (error) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      throw error;
    }
  }
  
  private handleAuthFailure(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    window.location.href = '/auth';
  }
  
  private formatError(error: AxiosError): ApiErrorResponse {
    const response = error.response;
    
    return {
      success: false,
      message: response?.data?.message || error.message || 'An error occurred',
      timestamp: new Date().toISOString(),
      errors: response?.data?.errors || [error.message],
      status: response?.status,
    };
  }
  
  // Standardized HTTP methods
  async get<T>(url: string, params?: any): Promise<StandardApiResponse<T>> {
    const response = await this.client.get(url, { params });
    return this.normalizeResponse(response.data);
  }
  
  async post<T>(url: string, data?: any): Promise<StandardApiResponse<T>> {
    const response = await this.client.post(url, data);
    return this.normalizeResponse(response.data);
  }
  
  async patch<T>(url: string, data?: any): Promise<StandardApiResponse<T>> {
    const response = await this.client.patch(url, data);
    return this.normalizeResponse(response.data);
  }
  
  async put<T>(url: string, data?: any): Promise<StandardApiResponse<T>> {
    const response = await this.client.put(url, data);
    return this.normalizeResponse(response.data);
  }
  
  async delete<T>(url: string): Promise<StandardApiResponse<T>> {
    const response = await this.client.delete(url);
    return this.normalizeResponse(response.data);
  }
  
  private normalizeResponse<T>(data: any): StandardApiResponse<T> {
    // Handle different response formats
    if (data.success !== undefined) {
      // Already in standard format
      return data;
    }
    
    // Handle Django REST Framework paginated responses
    if (data.results !== undefined) {
      return {
        success: true,
        message: 'Data retrieved successfully',
        timestamp: new Date().toISOString(),
        data: {
          results: data.results,
          pagination: {
            count: data.count,
            next: data.next,
            previous: data.previous,
            page_size: data.results.length,
          }
        } as T
      };
    }
    
    // Handle direct data responses
    return {
      success: true,
      message: 'Operation completed successfully',
      timestamp: new Date().toISOString(),
      data: data as T
    };
  }
}

// Singleton instance
const apiClient = new EnhancedApiClient(
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1/'
);

export default apiClient;

// Utility functions for data extraction
export function extractApiData<T>(response: StandardApiResponse<T>): T {
  if (response.data) {
    // Handle paginated responses
    if (typeof response.data === 'object' && 'results' in response.data) {
      return (response.data as any).results;
    }
    return response.data;
  }
  return [] as unknown as T;
}

export function extractErrorMessage(error: any): string {
  if (error?.message) {
    return error.message;
  }
  if (error?.errors && Array.isArray(error.errors) && error.errors.length > 0) {
    return error.errors[0];
  }
  return 'An unexpected error occurred';
}

// Hook for API error handling
export function useApiErrorHandler() {
  const showError = (error: any) => {
    const message = extractErrorMessage(error);
    // Use your toast/notification system here
    console.error('API Error:', message);
  };
  
  return { showError };
}