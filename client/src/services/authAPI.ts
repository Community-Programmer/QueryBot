import axios, { type AxiosResponse } from 'axios';
import type { AuthResponse, LoginRequest, SignupRequest, User } from '@/types/auth';
import { config } from '@/config/env';

// Create axios instance with base configuration
const API_BASE_URL = config.API_BASE_URL;

// Main API instance with interceptors
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important: This allows cookies to be sent with requests
});

// Simple API instance without interceptors for auth operations
const simpleApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only try to refresh for 401 errors on protected endpoints, avoid infinite loops
    if (
      error.response?.status === 401 && 
      !originalRequest._retry && 
      originalRequest.url !== '/auth/refresh' &&
      originalRequest.url !== '/auth/login' &&
      originalRequest.url !== '/auth/signup'
    ) {
      originalRequest._retry = true;

      try {
        console.log('🔄 Access token expired, attempting refresh for:', originalRequest.url);
        
        // Use simpleApi to avoid recursion
        const refreshResponse = await simpleApi.post('/auth/refresh');
        
        console.log('✅ Token refresh successful:', refreshResponse.data);
        
        // Retry the original request
        console.log('🔄 Retrying original request:', originalRequest.url);
        return api(originalRequest);
      } catch (refreshError: any) {
        console.log('❌ Token refresh failed:', refreshError.response?.data || refreshError.message);
        
        // If refresh token is also expired (401) or invalid, redirect to login
        if (refreshError.response?.status === 401) {
          console.log('🚪 Refresh token expired, redirecting to login');
          window.location.href = '/auth';
        }
        
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export class AuthAPI {
  static async login(credentials: LoginRequest): Promise<AuthResponse> {
    // Use simpleApi to avoid interceptor loops during login
    const response: AxiosResponse<AuthResponse> = await simpleApi.post('/auth/login', credentials);
    return response.data;
  }

  static async signup(userData: SignupRequest): Promise<AuthResponse> {
    // Use simpleApi to avoid interceptor loops during signup
    const response: AxiosResponse<AuthResponse> = await simpleApi.post('/auth/signup', userData);
    return response.data;
  }

  static async getProfile(): Promise<{ success: boolean; message: string; data: { user: User } }> {
    const response = await api.get('/auth/profile');
    return response.data;
  }

  static async checkAuth(): Promise<{ success: boolean; message: string; data: { user: User } }> {
    // Use main api instance to enable automatic token refresh
    const response = await api.get('/auth/check');
    return response.data;
  }

  static async refreshToken(): Promise<{ success: boolean; message: string }> {
    // Use simpleApi to avoid recursive calls in interceptor
    const response = await simpleApi.post('/auth/refresh');
    return response.data;
  }

  static async logout(): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/auth/logout');
    return response.data;
  }
}

export default api;