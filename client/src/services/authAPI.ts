import axios, { type AxiosResponse } from 'axios';
import type { AuthResponse, LoginRequest, SignupRequest, User } from '@/types/auth';
import { config } from '@/config/env';

// Create axios instance with base configuration
const API_BASE_URL = config.API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('querybot_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('querybot_refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          });

          const { access_token } = response.data.data;
          localStorage.setItem('querybot_access_token', access_token);

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('querybot_access_token');
        localStorage.removeItem('querybot_refresh_token');
        window.location.href = '/auth';
      }
    }

    return Promise.reject(error);
  }
);

export class AuthAPI {
  static async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await api.post('/auth/login', credentials);
    return response.data;
  }

  static async signup(userData: SignupRequest): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await api.post('/auth/signup', userData);
    return response.data;
  }

  static async getProfile(): Promise<{ success: boolean; message: string; data: { user: User } }> {
    const response = await api.get('/auth/profile');
    return response.data;
  }

  static async refreshToken(): Promise<{ success: boolean; message: string; data: { access_token: string; token_type: string } }> {
    const refreshToken = localStorage.getItem('querybot_refresh_token');
    const response = await api.post('/auth/refresh', {}, {
      headers: {
        Authorization: `Bearer ${refreshToken}`,
      },
    });
    return response.data;
  }

  static async logout(): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/auth/logout');
    return response.data;
  }
}

export default api;