// frontend/src/App.jsx
import { useEffect, Component } from 'react';

import { ThemeProvider } from 'contexts/ThemeContext';
import { AuthProvider, useAuth } from 'contexts/AuthContext';
import { AppRouter } from 'components/routing/AppRouter';
import { LoginScreen } from 'components/auth/LoginScreen';
import { RegisterScreen } from 'components/auth/RegisterScreen';
import { ConnectionStatus } from 'components/shared/ConnectionStatus';
import { cleanupOldLocalStorage } from 'utils/cleanupLocalStorage';
import { loadUserCurrencyFromAPI } from 'utils/currency';
import { apiService } from 'utils/apiService';

// Error Boundary Component
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ERROR BOUNDARY] Caught error:', error);
    console.error('[ERROR BOUNDARY] Error info:', errorInfo);
    console.error('[ERROR BOUNDARY] Component stack:', errorInfo.componentStack);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8">
          <div className="max-w-2xl w-full bg-slate-800 rounded-lg p-8 text-white">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Application Error</h1>
            <p className="mb-4">Something went wrong. Please check the console for details.</p>
            <div className="bg-slate-900 p-4 rounded overflow-auto max-h-96">
              <pre className="text-xs text-red-300">{this.state.error?.toString()}</pre>
              <pre className="text-xs text-gray-400 mt-2">{this.state.errorInfo?.componentStack}</pre>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function AppContent() {
  const { user, loading, isRegistered, isAuthenticated, logout } = useAuth();

  console.log('[APP] Render state:', { loading, isRegistered, isAuthenticated, hasUser: !!user });

  // Load user currency when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadUserCurrencyFromAPI(apiService).catch(error => {
        console.error('[APP] Failed to load user currency:', error);
      });
    }
  }, [isAuthenticated]);

  // Show loading state while checking authentication
  if (loading) {
    console.log('[APP] Showing loading screen');
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  // Show registration screen if no user registered yet
  if (!isRegistered) {
    console.log('[APP] Showing registration screen');
    return <RegisterScreen />;
  }

  // Show login screen if registered but not authenticated
  if (!isAuthenticated) {
    console.log('[APP] Showing login screen');
    return <LoginScreen />;
  }

  // Show main app if authenticated
  console.log('[APP] Showing main app');
  return <AppRouter onLogout={logout} />;
}

export function App() {
  // Clean up old localStorage data on first load
  useEffect(() => {
    cleanupOldLocalStorage();
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
          <ConnectionStatus />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

