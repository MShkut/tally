// AuthContext - Manages authentication state across the app
import { createContext, useContext, useState, useEffect } from 'react';

import { apiService } from 'utils/apiService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log('[AUTH] Checking authentication status...');

      // Check if any user is registered
      const registered = await apiService.checkRegistrationStatus();
      console.log('[AUTH] Registration status:', registered);
      setIsRegistered(registered);

      if (registered) {
        // Try to get current user (will fail if not logged in)
        try {
          console.log('[AUTH] Attempting to get current user...');
          const currentUser = await apiService.getCurrentUser();
          console.log('[AUTH] Current user:', currentUser);
          setUser(currentUser);
        } catch (error) {
          // Not logged in, that's okay
          console.log('[AUTH] Not logged in (expected):', error.message);
          setUser(null);
        }
      }
    } catch (error) {
      console.error('[AUTH] Auth check failed:', error);
      console.error('[AUTH] Error stack:', error.stack);
      // Set safe defaults on error
      setIsRegistered(false);
      setUser(null);
    } finally {
      console.log('[AUTH] Auth check complete, loading=false');
      setLoading(false);
    }
  };

  const register = async (householdName, password, initialData = null) => {
    const user = await apiService.register(householdName, password);
    setUser(user);
    setIsRegistered(true);

    // If initialData provided, save it immediately after registration
    if (initialData) {
      try {
        await apiService.saveUserData(initialData);
        console.log('[AUTH] Initial data saved successfully');
      } catch (error) {
        console.error('[AUTH] Failed to save initial data:', error);
        // Don't fail registration if data save fails - user can retry
      }
    }

    // Prefetch dashboard data in background
    prefetchDashboardData();

    return user;
  };

  const login = async (password) => {
    const user = await apiService.login(password);
    setUser(user);

    // Prefetch dashboard data in background for instant dashboard load
    prefetchDashboardData();

    return user;
  };

  const prefetchDashboardData = () => {
    // Start loading critical dashboard data in background
    // These will be cached by apiService, so when Dashboard mounts, data is ready
    Promise.all([
      apiService.loadUserData().catch(err => console.warn('[Prefetch] UserData failed:', err)),
      apiService.loadTransactions({ limit: 100, offset: 0 }).catch(err => console.warn('[Prefetch] Transactions failed:', err)),
      apiService.loadSettings().catch(err => console.warn('[Prefetch] Settings failed:', err))
    ]).then(() => {
      console.log('[Prefetch] Dashboard data preloaded successfully');
    });
  };

  const logout = async () => {
    await apiService.logout();
    setUser(null);
    // Clear API cache on logout for security
    apiService.clearCache();
  };

  const value = {
    user,
    loading,
    isRegistered,
    register,
    login,
    logout,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
