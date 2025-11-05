import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { AuthState, LoginRequest, SignupRequest } from '@/types/auth';
import { AuthAPI } from '@/services/authAPI';

// Initial state - no tokens stored in client, authentication checked via API
const initialState: AuthState = {
  user: null,
  accessToken: null, // Not stored in client anymore
  refreshToken: null, // Not stored in client anymore
  isAuthenticated: false, // Will be determined by API call
  isLoading: false,
  error: null,
};

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await AuthAPI.login(credentials);
      // Tokens are now set as httpOnly cookies by the server
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
      // Tokens are now set as httpOnly cookies by the server
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

export const checkAuthentication = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      const response = await AuthAPI.checkAuth();
      return response.data.user;
    } catch (error: any) {
      // If auth check fails, user is not authenticated (don't treat as error)
      return rejectWithValue(null); // Use null instead of error message
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
      // Cookies are cleared by the server
      return null;
    } catch (error: any) {
      // Even if API call fails, consider user logged out
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
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      
      // Check authentication cases
      .addCase(checkAuthentication.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(checkAuthentication.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(checkAuthentication.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null; // Don't show error for failed auth check
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

export const { clearError, clearAuth } = authSlice.actions;

export default authSlice.reducer;