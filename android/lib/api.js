// lib/api.js

import axios from 'axios';
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";

// AUTH CONFIG
const AUTH_CONFIG = {
  ACCESS_TOKEN_KEY: "accessToken",
  CURRENT_USER_KEY: "currentUser",
  REFRESH_TOKEN_KEY: "refreshToken",
};

// Helper functions for secure storage with error handling
export const getAccessToken = async () => {
  try {
    return await SecureStore.getItemAsync(AUTH_CONFIG.ACCESS_TOKEN_KEY);
  } catch (error) {
    console.error("Failed to get access token:", error);
    return null;
  }
};

export const getRefreshToken = async () => {
  try {
    return await SecureStore.getItemAsync(AUTH_CONFIG.REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error("Failed to get refresh token:", error);
    return null;
  }
};

export const getCurrentUser = async () => {
  try {
    const user = await SecureStore.getItemAsync(AUTH_CONFIG.CURRENT_USER_KEY);
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error("Failed to get current user:", error);
    return null;
  }
};

export const setAccessToken = async (token) => {
  try {
    await SecureStore.setItemAsync(AUTH_CONFIG.ACCESS_TOKEN_KEY, token);
    return true;
  } catch (error) {
    console.error("Failed to set access token:", error);
    return false;
  }
};

export const setRefreshToken = async (token) => {
  try {
    await SecureStore.setItemAsync(AUTH_CONFIG.REFRESH_TOKEN_KEY, token);
    return true;
  } catch (error) {
    console.error("Failed to set refresh token:", error);
    return false;
  }
};

export const clearAuth = async () => {
  try {
    const clearPromises = [
      SecureStore.deleteItemAsync(AUTH_CONFIG.ACCESS_TOKEN_KEY).catch(() => {}),
      SecureStore.deleteItemAsync(AUTH_CONFIG.CURRENT_USER_KEY).catch(() => {}),
      SecureStore.deleteItemAsync(AUTH_CONFIG.REFRESH_TOKEN_KEY).catch(() => {})
    ];
    
    await Promise.allSettled(clearPromises);
    console.log("Auth data cleared successfully");
  } catch (error) {
    console.error("Failed to clear auth:", error);
  }
};

// AXIOS INSTANCE CONFIGURATION
const API_BASE_URL = "http://192.168.237.67:8000/api"; // Update with your actual IP
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 
    "Content-Type": "application/json",
  },
  timeout: 15000, // 15 second timeout to prevent hanging requests
});

// Request tracking for debugging
let requestId = 0;
let isRefreshing = false;
let refreshSubscribers = [];

// Helper function to add subscribers waiting for token refresh
const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

// Helper function to notify all subscribers when refresh is complete
const onTokenRefreshed = (token) => {
  refreshSubscribers.map(cb => cb(token));
  refreshSubscribers = [];
};

// REQUEST INTERCEPTOR
api.interceptors.request.use(
  async (config) => {
    // Add request ID for debugging
    config.metadata = { requestId: ++requestId, startTime: new Date() };
    
    try {
      const token = await getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Failed to get token for request:", error);
      // Don't fail the request, just proceed without token
    }
    
    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// RESPONSE INTERCEPTOR
api.interceptors.response.use(
  (response) => {
    // Log successful requests in development
    if (__DEV__ && response.config.metadata) {
      const duration = new Date() - response.config.metadata.startTime;
      console.log(`✅ Request ${response.config.metadata.requestId} completed in ${duration}ms`);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Log failed requests in development
    if (__DEV__ && originalRequest?.metadata) {
      const duration = new Date() - originalRequest.metadata.startTime;
      console.log(`❌ Request ${originalRequest.metadata.requestId} failed after ${duration}ms:`, error.message);
    }

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            } else {
              resolve(Promise.reject(error));
            }
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await getRefreshToken();
        
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        // Create a new axios instance for refresh to avoid interceptor loops
        const refreshResponse = await axios.post(`${API_BASE_URL}/users/token/refresh/`, {
          refresh: refreshToken
        }, {
          timeout: 10000,
          headers: { "Content-Type": "application/json" }
        });

        const { access } = refreshResponse.data;
        
        if (access) {
          // Save new token
          await setAccessToken(access);
          
          // Update the authorization header
          originalRequest.headers.Authorization = `Bearer ${access}`;
          
          // Notify all waiting requests
          onTokenRefreshed(access);
          
          // Retry the original request
          return api(originalRequest);
        } else {
          throw new Error("No access token in refresh response");
        }
        
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError.message);
        
        // Notify waiting requests of failure
        onTokenRefreshed(null);
        
        // Clear auth data and redirect to login
        await clearAuth();
        
        // Use setTimeout to prevent navigation conflicts
        setTimeout(() => {
          try {
            router.replace("/");
          } catch (navError) {
            console.error("Navigation error after token refresh failure:", navError);
          }
        }, 100);
        
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle network errors
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        error.message = "Request timeout. Please check your connection and try again.";
      } else if (error.code === 'NETWORK_ERROR') {
        error.message = "Network error. Please check your internet connection.";
      } else {
        error.message = "Connection error. Please check your network and try again.";
      }
      console.error("Network error:", error.message);
    }

    // Handle server errors
    if (error.response?.status >= 500) {
      error.message = "Server error. Please try again later.";
      console.error("Server error:", error.response.status, error.response.data);
    }

    // Handle client errors (400-499, except 401 which we handled above)
    if (error.response?.status >= 400 && error.response?.status < 500 && error.response?.status !== 401) {
      console.error("Client error:", error.response.status, error.response.data);
    }

    return Promise.reject(error);
  }
);

// Export the configured axios instance as default
export default api;

// Additional utility functions
export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch (error) {
    console.error("Error checking token expiry:", error);
    return true;
  }
};

export const getTokenExpiryTime = (token) => {
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return new Date(payload.exp * 1000);
  } catch (error) {
    console.error("Error getting token expiry time:", error);
    return null;
  }
};

// Health check function
export const healthCheck = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/health/`, { timeout: 5000 });
    return response.status === 200;
  } catch (error) {
    console.error("Health check failed:", error.message);
    return false;
  }
};