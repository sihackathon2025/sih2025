// lib/AuthContext.js

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { InteractionManager, AppState } from 'react-native';
import api from './api';

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const segments = useSegments();
  
  // Refs for state management
  const isMountedRef = useRef(true);
  const redirectingRef = useRef(false);
  const logoutInProgressRef = useRef(false);
  const loginInProgressRef = useRef(false);
  const navigationTimeoutRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    isMountedRef.current = true;
    
    // Handle app state changes
    const handleAppStateChange = (nextAppState) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to foreground - validate user session
        if (user && isAuthenticated) {
          validateSession();
        }
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      isMountedRef.current = false;
      subscription?.remove();
      // Clear any pending navigation timeouts
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  const safeSetState = (setter, value) => {
    if (isMountedRef.current && !logoutInProgressRef.current) {
      setter(value);
    }
  };

  const clearAllStoredData = async () => {
    try {
      const clearPromises = [
        SecureStore.deleteItemAsync('currentUser').catch(() => {}),
        SecureStore.deleteItemAsync('accessToken').catch(() => {}),
        SecureStore.deleteItemAsync('refreshToken').catch(() => {})
      ];
      await Promise.allSettled(clearPromises);
      console.log("All auth data cleared successfully");
    } catch (error) {
      console.error("Error clearing stored data:", error);
    }
  };

  const resetAuthState = () => {
    if (isMountedRef.current) {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  const validateSession = async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (!token) {
        throw new Error('No token found');
      }
      
      // Optional: Make a light API call to validate session
      // await api.get('/users/profile/');
    } catch (error) {
      console.log("Session validation failed, logging out:", error.message);
      await logout(true); // Skip navigation during validation
    }
  };

  const loadUser = async () => {
    if (logoutInProgressRef.current) return;

    try {
      const storedUser = await SecureStore.getItemAsync('currentUser');
      if (storedUser && isMountedRef.current && !logoutInProgressRef.current) {
        const userData = JSON.parse(storedUser);
        safeSetState(setUser, userData);
        safeSetState(setIsAuthenticated, true);
      }
    } catch (e) {
      console.error("Failed to load user from storage", e);
      await clearAllStoredData();
    } finally {
      if (isMountedRef.current && !logoutInProgressRef.current) {
        safeSetState(setIsLoading, false);
      }
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    // Don't run redirect logic during critical operations
    if (
      isLoading ||
      redirectingRef.current ||
      !isMountedRef.current ||
      logoutInProgressRef.current ||
      loginInProgressRef.current
    ) {
      return;
    }

    const isAuthRoute = segments[0] === '(auth)';

    if (!user && !isAuthenticated && !isAuthRoute && !isLoading) {
      // Stay on public screens
      return;
    }

    if (user && isAuthenticated && (isAuthRoute || segments.length === 0)) {
      // User is authenticated and needs redirect
      safeNavigate(user.role);
    }
  }, [user, isAuthenticated, segments, isLoading]);

  const safeNavigate = (role) => {
    if (
      redirectingRef.current ||
      !isMountedRef.current ||
      logoutInProgressRef.current ||
      loginInProgressRef.current
    ) {
      return;
    }

    redirectingRef.current = true;

    // Clear any existing navigation timeout
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }

    // Use InteractionManager to ensure smooth navigation
    InteractionManager.runAfterInteractions(() => {
      navigationTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current && !logoutInProgressRef.current) {
          try {
            let targetRoute = '/';

            switch (role) {
              case 'asha_worker':
                targetRoute = '/ashaDashboard';
                break;
              case 'admin':
                targetRoute = '/adminDashboard';
                break;
              case 'clinic':
                targetRoute = '/clinicDashboard';
                break;
              case 'ngo':
                targetRoute = '/ngoDashboard';
                break;
              default:
                targetRoute = '/';
            }

            console.log(`Navigating to: ${targetRoute}`);
            router.replace(targetRoute);
          } catch (error) {
            console.error("Navigation error:", error);
          }
        }

        // Reset navigation flag after delay
        setTimeout(() => {
          redirectingRef.current = false;
        }, 500);
      }, 100);
    });
  };

  const login = async (email, password) => {
    if (!isMountedRef.current || logoutInProgressRef.current || loginInProgressRef.current) {
      return { success: false, error: "Login unavailable" };
    }

    try {
      loginInProgressRef.current = true;
      safeSetState(setIsLoading, true);

      const response = await api.post("/users/login/", { email, password });

      if (!isMountedRef.current || logoutInProgressRef.current) {
        return { success: false, error: "Login interrupted" };
      }

      const { user: userData } = response.data;

      // Validate user data
      if (!userData || !userData.role) {
        throw new Error("Invalid user data received");
      }

      // Store all data
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

      // Update state only if still valid
      if (isMountedRef.current && !logoutInProgressRef.current) {
        safeSetState(setUser, userData);
        safeSetState(setIsAuthenticated, true);
      }

      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: error.response?.data?.detail ||
          error.response?.data?.error ||
          error.message ||
          "Login failed"
      };
    } finally {
      loginInProgressRef.current = false;
      safeSetState(setIsLoading, false);
    }
  };

  const logout = async (skipNavigation = false) => {
    // Prevent multiple logout calls
    if (logoutInProgressRef.current) {
      console.log("Logout already in progress, skipping...");
      return;
    }

    try {
      logoutInProgressRef.current = true;
      redirectingRef.current = true;

      console.log("Starting logout process...");

      // Clear any pending navigation timeouts
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
        navigationTimeoutRef.current = null;
      }

      // Step 1: Clear all state immediately
      resetAuthState();

      // Step 2: Clear stored data
      await clearAllStoredData();

      console.log("Logout state cleared");

      // Step 3: Navigate with extra safety measures
      if (!skipNavigation && isMountedRef.current) {
        // Use InteractionManager for smoother navigation
        InteractionManager.runAfterInteractions(() => {
          // Multiple navigation attempts with fallbacks
          const attemptNavigation = (attempt = 1) => {
            if (!isMountedRef.current || attempt > 3) {
              console.log("Navigation attempts exhausted or component unmounted");
              return;
            }

            try {
              console.log(`Navigation attempt ${attempt} to landing page`);
              router.replace('/');
            } catch (error) {
              console.error(`Navigation attempt ${attempt} failed:`, error);

              // Retry with increasing delay
              setTimeout(() => {
                attemptNavigation(attempt + 1);
              }, attempt * 100);
            }
          };

          // Start navigation attempts after a short delay
          setTimeout(() => {
            attemptNavigation();
          }, 200);
        });
      }

    } catch (error) {
      console.error("Logout error:", error);

      // Ensure state is cleared even on error
      resetAuthState();

      if (!skipNavigation && isMountedRef.current) {
        try {
          router.replace('/');
        } catch (navError) {
          console.error("Emergency navigation failed:", navError);
        }
      }
    } finally {
      // Reset flags after delay to prevent race conditions
      setTimeout(() => {
        logoutInProgressRef.current = false;
        redirectingRef.current = false;
        console.log("Logout process completed");
      }, 1000);
    }
  };

  const contextValue = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    validateSession
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}