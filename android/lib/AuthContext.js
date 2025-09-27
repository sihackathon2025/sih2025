// lib/AuthContext.js

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import api from './api';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();
  const isMountedRef = useRef(true);
  const redirectingRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const safeSetState = (setter, value) => {
    if (isMountedRef.current) {
      setter(value);
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await SecureStore.getItemAsync('currentUser');
        if (storedUser && isMountedRef.current) {
          const userData = JSON.parse(storedUser);
          safeSetState(setUser, userData);
        }
      } catch (e) {
        console.error("Failed to load user from storage", e);
        // Clear corrupted data
        try {
          await SecureStore.deleteItemAsync('currentUser');
        } catch (clearError) {
          console.error("Failed to clear corrupted user data", clearError);
        }
      } finally {
        safeSetState(setIsLoading, false);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    // Don't run redirect logic until loading is complete or if already redirecting
    if (isLoading || redirectingRef.current || !isMountedRef.current) {
      return;
    }
    
    const isAuthRoute = segments[0] === '(auth)';

    if (!user && !isAuthRoute) {
      // Stay on public screens - no action needed
      return;
    } 
    
    if (user && isAuthRoute) {
      // User is signed in but on auth screen - redirect to dashboard
      redirectUser(user.role);
    } else if (user && segments.length === 0) {
      // User is signed in and at root - redirect to dashboard
      redirectUser(user.role);
    }

  }, [user, segments, isLoading]);

  const redirectUser = (role) => {
    if (redirectingRef.current || !isMountedRef.current) {
      return;
    }

    redirectingRef.current = true;
    
    // Use setTimeout to prevent navigation conflicts
    setTimeout(() => {
      if (isMountedRef.current) {
        try {
          if (role === 'asha_worker') {
            router.replace('/ashaDashboard');
          } else if (role === 'admin') {
            router.replace('/adminDashboard');
          } else {
            router.replace('/');
          }
        } catch (error) {
          console.error("Navigation error:", error);
        }
      }
      redirectingRef.current = false;
    }, 100);
  };

  const login = async (email, password) => {
    if (!isMountedRef.current) {
      return { success: false, error: "Component unmounted" };
    }

    try {
      const response = await api.post("/users/login/", { email, password });
      
      if (!isMountedRef.current) {
        return { success: false, error: "Component unmounted" };
      }

      const { user: userData } = response.data;
      
      // Store all data before updating state
      const storePromises = [
        SecureStore.setItemAsync('currentUser', JSON.stringify(userData))
      ];

      if (response.data.access) {
        storePromises.push(SecureStore.setItemAsync('accessToken', response.data.access));
      }
      
      if (response.data.refresh) {
        storePromises.push(SecureStore.setItemAsync('refreshToken', response.data.refresh));
      }

      await Promise.all(storePromises);
      
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        safeSetState(setUser, userData);
      }
      
      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 
               error.response?.data?.error || 
               "Login failed" 
      };
    }
  };

  const logout = async () => {
    try {
      // Set redirecting flag to prevent conflicts
      redirectingRef.current = true;

      // Clear user state first
      safeSetState(setUser, null);

      // Clear stored data
      const clearPromises = [
        SecureStore.deleteItemAsync('currentUser').catch(() => {}),
        SecureStore.deleteItemAsync('accessToken').catch(() => {}),
        SecureStore.deleteItemAsync('refreshToken').catch(() => {})
      ];

      await Promise.allSettled(clearPromises);

      // Navigate after a brief delay
      if (isMountedRef.current) {
        setTimeout(() => {
          if (isMountedRef.current) {
            try {
              router.replace('/');
            } catch (error) {
              console.error("Navigation error during logout:", error);
            }
          }
          redirectingRef.current = false;
        }, 100);
      }
    } catch (error) {
      console.error("Logout error:", error);
      // Even if logout fails, clear local state
      safeSetState(setUser, null);
      redirectingRef.current = false;
      
      if (isMountedRef.current) {
        router.replace('/');
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}