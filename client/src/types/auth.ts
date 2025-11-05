export interface User {
  id: string;
  fullname: string;
  email: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    access_token: string;
    refresh_token: string;
    token_type: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  fullname: string;
  email: string;
  password: string;
  confirm_password: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ApiError {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
}