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

  const register = async (householdName, password) => {
    const user = await apiService.register(householdName, password);
    setUser(user);
    setIsRegistered(true);
    return user;
  };

  const login = async (password) => {
    const user = await apiService.login(password);
    setUser(user);
    return user;
  };

  const logout = async () => {
    await apiService.logout();
    setUser(null);
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
