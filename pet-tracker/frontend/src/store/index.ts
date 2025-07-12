import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './rootReducer';
import authReducer from './slices/authSlice';

// Preload state from localStorage
const preloadedState = {
  auth: {
    token: localStorage.getItem('token'),
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    isAuthenticated: Boolean(localStorage.getItem('token')),
  },
};

const store = configureStore({
  reducer: {
    auth: authReducer,
  },
  preloadedState, // Use the preloaded state
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;