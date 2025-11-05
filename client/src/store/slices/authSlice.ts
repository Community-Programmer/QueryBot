import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, LoginRequest, SignupRequest } from '@/types/auth';
import { AuthAPI } from '@/services/authAPI';

// Initial state
const initialState: AuthState = {
  user: null,
  accessToken: localStorage.getItem('querybot_access_token'),
  refreshToken: localStorage.getItem('querybot_refresh_token'),
  isAuthenticated: !!localStorage.getItem('querybot_access_token'),
  isLoading: false,
  error: null,
};

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await AuthAPI.login(credentials);
      
      // Store tokens in localStorage
      localStorage.setItem('querybot_access_token', response.data.access_token);
      localStorage.setItem('querybot_refresh_token', response.data.refresh_token);
      
      return response;
    } catch (error: any) {
      if (error.code === 'NETWORK_ERROR' || !error.response) {
        return rejectWithValue('Network error. Please check your connection and try again.');
      }
      const errorMessage = error.response?.data?.message || 'Login failed. Please check your credentials.';
      return rejectWithValue(errorMessage);
    }
  }
);

export const signupUser = createAsyncThunk(
  'auth/signup',
  async (userData: SignupRequest, { rejectWithValue }) => {
    try {
      const response = await AuthAPI.signup(userData);
      
      // Store tokens in localStorage
      localStorage.setItem('querybot_access_token', response.data.access_token);
      localStorage.setItem('querybot_refresh_token', response.data.refresh_token);
      
      return response;
    } catch (error: any) {
      if (error.code === 'NETWORK_ERROR' || !error.response) {
        return rejectWithValue('Network error. Please check your connection and try again.');
      }
      
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      const validationErrors = error.response?.data?.errors;
      
      if (validationErrors) {
        // Handle validation errors
        const errorString = Object.entries(validationErrors)
          .map(([field, messages]: [string, any]) => `${field}: ${messages.join(', ')}`)
          .join('\n');
        return rejectWithValue(errorString);
      }
      
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchUserProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await AuthAPI.getProfile();
      return response.data.user;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch profile';
      return rejectWithValue(errorMessage);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await AuthAPI.logout();
      
      // Clear tokens from localStorage
      localStorage.removeItem('querybot_access_token');
      localStorage.removeItem('querybot_refresh_token');
      
      return null;
    } catch (error: any) {
      // Even if API call fails, clear local storage
      localStorage.removeItem('querybot_access_token');
      localStorage.removeItem('querybot_refresh_token');
      
      const errorMessage = error.response?.data?.message || 'Logout failed';
      return rejectWithValue(errorMessage);
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearAuth: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('querybot_access_token');
      localStorage.removeItem('querybot_refresh_token');
    },
    updateTokens: (state, action: PayloadAction<{ accessToken: string; refreshToken?: string }>) => {
      state.accessToken = action.payload.accessToken;
      if (action.payload.refreshToken) {
        state.refreshToken = action.payload.refreshToken;
      }
      state.isAuthenticated = true;
      
      localStorage.setItem('querybot_access_token', action.payload.accessToken);
      if (action.payload.refreshToken) {
        localStorage.setItem('querybot_refresh_token', action.payload.refreshToken);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.data.user;
        state.accessToken = action.payload.data.access_token;
        state.refreshToken = action.payload.data.refresh_token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      
      // Signup cases
      .addCase(signupUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.data.user;
        state.accessToken = action.payload.data.access_token;
        state.refreshToken = action.payload.data.refresh_token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      
      // Fetch profile cases
      .addCase(fetchUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Logout cases
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        // Even if logout API call fails, clear the state
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearAuth, updateTokens } = authSlice.actions;

export default authSlice.reducer;