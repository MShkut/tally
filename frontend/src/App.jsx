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
      // Wait for container mode detection to complete
      await dataManager.detectContainerMode();

      const inContainerMode = dataManager.containerMode;
      setContainerMode(inContainerMode);

      console.log('[AUTH] Container mode:', inContainerMode ? 'YES' : 'NO');

      // If not in container mode, skip auth and go straight to app
      if (!inContainerMode) {
        console.log('[AUTH] LocalStorage mode - skipping authentication');
        setIsAuthenticated(true);
        setIsCheckingAuth(false);
        return;
      }

      // In container mode - check authentication
      console.log('[AUTH] Container mode detected - checking authentication');
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
        console.log('[AUTH] Not authenticated - showing login screen');
        setIsAuthenticated(false);
      }

      setIsCheckingAuth(false);
    };

    checkAuth();
  }, []);

  const handleLoginSuccess = async () => {
    // Check if there's any data in localStorage (from pre-login import)
    const localUserData = dataManager.loadUserData();

    // Sync data from container after successful login
    await dataManager.syncFromContainer();

    // If we had localStorage data (from import before login), save it to container
    if (localUserData && localUserData.household) {
      console.log('[AUTH] Found localStorage data - syncing to container after login');
      // Update containerData with localStorage data
      dataManager.containerData.userData = localUserData;
      const localTransactions = dataManager.loadTransactions();
      if (localTransactions && localTransactions.length > 0) {
        dataManager.containerData.transactions = localTransactions;
      }
      const localNetWorth = dataManager.loadNetWorthItems();
      if (localNetWorth && localNetWorth.length > 0) {
        dataManager.containerData.netWorthItems = localNetWorth;
      }
      const localGiftData = dataManager.loadGiftData();
      if (localGiftData) {
        dataManager.containerData.giftData = localGiftData;
      }
      // Save to container
      await dataManager.saveToContainer();
      console.log('[AUTH] ✓ LocalStorage data synced to container');
    }

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

