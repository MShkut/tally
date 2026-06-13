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

      // Check if any user is registered in the database
      const registered = await apiService.checkRegistrationStatus();
      console.log('[AUTH] Registration status:', registered);
      setIsRegistered(registered);

      // If no user exists, show registration screen
      if (!registered) {
        console.log('[AUTH] No user registered, showing registration screen');
        setUser(null);
        sessionStorage.removeItem('tally_session_active');
        setLoading(false);
        return;
      }

      // User exists - check if they have an active session
      const sessionActive = sessionStorage.getItem('tally_session_active');
      if (!sessionActive) {
        console.log('[AUTH] User registered but no active session - showing login screen');
        setUser(null);
        setLoading(false);
        return;
      }

      // Session exists - try to get current user
      try {
        console.log('[AUTH] Attempting to get current user...');
        const currentUser = await apiService.getCurrentUser();
        console.log('[AUTH] Current user:', currentUser);
        setUser(currentUser);
      } catch (error) {
        // Session invalid or expired
        console.log('[AUTH] Session invalid:', error.message);
        setUser(null);
        sessionStorage.removeItem('tally_session_active');
      }
    } catch (error) {
      console.error('[AUTH] Auth check failed:', error);
      console.error('[AUTH] Error stack:', error);
      // Set safe defaults on error
      setIsRegistered(false);
      setUser(null);
      sessionStorage.removeItem('tally_session_active');
    } finally {
      console.log('[AUTH] Auth check complete, loading=false');
      setLoading(false);
    }
  };

  const register = async (householdName, password, initialData = null) => {
    const user = await apiService.register(householdName, password);
    setUser(user);
    setIsRegistered(true);

    // Security: Set session flag (clears on browser close)
    sessionStorage.setItem('tally_session_active', 'true');
    console.log('[AUTH] Session flag set');

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

  // Activates an already-registered, already-imported account: switches
  // AppContent from RegisterScreen to AppRouter. Used by the registration
  // screen's "Import Existing Data" flow, where the account is created and
  // populated via apiService.register()/importData() *before* the app's
  // auth state flips — otherwise AppRouter's DefaultRedirect would see an
  // empty user_data row and bounce to onboarding before the import finishes.
  const completeRegistration = (user) => {
    setUser(user);
    setIsRegistered(true);

    sessionStorage.setItem('tally_session_active', 'true');
    console.log('[AUTH] Session flag set');

    prefetchDashboardData();
  };

  const login = async (password) => {
    const user = await apiService.login(password);
    setUser(user);

    // Security: Set session flag (clears on browser close)
    sessionStorage.setItem('tally_session_active', 'true');
    console.log('[AUTH] Session flag set');

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
    // Security: Clear session flag
    sessionStorage.removeItem('tally_session_active');
    console.log('[AUTH] Session flag cleared');
    // Clear API cache on logout for security
    apiService.clearCache();
  };

  const value = {
    user,
    loading,
    isRegistered,
    register,
    completeRegistration,
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
