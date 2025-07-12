import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { auth } from '../../services/api';
import axios from 'axios';
interface User {
  _id: string;
  name?: string;
  email: string;
  role: string;
  department?: string;
  badgeNumber?: string;
  photo?: string
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null
};

// Regular user login
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await auth.login(email, password);
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Department officer login
export const officerLogin = createAsyncThunk(
  'auth/officerLogin',
  async ({ email, badgeNumber, password }: { email: string; badgeNumber: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await auth.officerLogin(email, badgeNumber, password);
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const signup = createAsyncThunk(
  'auth/signup',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await auth.signup(email, password);
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const handleAuthSuccess = (state: AuthState, action: any) => {
  // Check different possible response structures
  const user = action.payload.user || action.payload.data?.user;
  const token = action.payload.token || action.payload.data?.token;
  
  if (!user || !token) {
    throw new Error('Invalid authentication response structure');
  }

  state.loading = false;
  state.user = user;
  state.token = token;
  state.isAuthenticated = true;
  localStorage.setItem('token', token);
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`; 
  localStorage.setItem('user', JSON.stringify(user));
};

export const logout = createAsyncThunk('auth/logout', async () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Regular Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.data.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        localStorage.setItem('token', action.payload.token);
        localStorage.setItem('user', JSON.stringify(action.payload.data.user));
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as any)?.error || 'Login failed';
      })

      // Officer Login
      .addCase(officerLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(officerLogin.fulfilled, (state, action) => {
        try {
          handleAuthSuccess(state, action);
        } catch (error) {
          state.loading = false;
          state.error = 'Invalid authentication response';
        }
      })
      .addCase(officerLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as any)?.error || 'Officer login failed';
      })

      // Signup
      .addCase(signup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.data.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        localStorage.setItem('token', action.payload.token);
        localStorage.setItem('user', JSON.stringify(action.payload.data.user));
      })
      .addCase(signup.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as any)?.error || 'Signup failed';
      })

      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      });
  }
});

export const { logout: logoutAction, setCredentials, clearError } = authSlice.actions;

export default authSlice.reducer;