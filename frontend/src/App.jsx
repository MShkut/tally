// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';

import { ThemeProvider } from 'contexts/ThemeContext';
import { AppRouter } from 'components/routing/AppRouter';
import { LoginScreen } from 'components/auth/LoginScreen';
import { Auth } from 'utils/auth';
import { dataManager } from 'utils/dataManager';

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [containerMode, setContainerMode] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      // First, check if we're in container mode
      const inContainerMode = dataManager.containerMode;
      setContainerMode(inContainerMode);

      // If not in container mode, skip auth and go straight to app
      if (!inContainerMode) {
        setIsAuthenticated(true);
        setIsCheckingAuth(false);
        return;
      }

      // In container mode - check authentication
      const authenticated = Auth.isAuthenticated();

      if (authenticated) {
        // Try to sync data - if it fails due to auth, user will need to re-login
        try {
          await dataManager.syncFromContainer();
          setIsAuthenticated(true);
        } catch (error) {
          // Auth token is invalid/expired, need to re-login
          Auth.logout();
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }

      setIsCheckingAuth(false);
    };

    checkAuth();
  }, []);

  const handleLoginSuccess = async () => {
    // Sync data from container after successful login
    await dataManager.syncFromContainer();
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    Auth.logout();
    setIsAuthenticated(false);
  };

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  // Show login screen only if in container mode and not authenticated
  if (containerMode && !isAuthenticated) {
    return (
      <ThemeProvider>
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      </ThemeProvider>
    );
  }

  // Show main app if authenticated
  return (
    <ThemeProvider>
      <AppRouter onLogout={handleLogout} />
    </ThemeProvider>
  );
}

