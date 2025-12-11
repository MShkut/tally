import { useState, useEffect } from 'react';

import { useTheme } from 'contexts/ThemeContext';

/**
 * Connection Status Indicator
 * Shows a notification when user goes offline/online
 */
export function ConnectionStatus() {
  const { isDarkMode } = useTheme();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      console.log('[Connection] Back online');
      setIsOnline(true);
      setShowNotification(true);

      // Hide notification after 3 seconds
      setTimeout(() => setShowNotification(false), 3000);
    };

    const handleOffline = () => {
      console.log('[Connection] Went offline');
      setIsOnline(false);
      setShowNotification(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Don't show anything if online and no notification
  if (isOnline && !showNotification) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
      <div className={`
        px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 transition-all
        ${isOnline
          ? isDarkMode
            ? 'bg-green-900 border border-green-700 text-green-100'
            : 'bg-green-100 border border-green-300 text-green-900'
          : isDarkMode
            ? 'bg-red-900 border border-red-700 text-red-100'
            : 'bg-red-100 border border-red-300 text-red-900'
        }
      `}>
        {/* Status Icon */}
        <div className={`
          w-3 h-3 rounded-full animate-pulse
          ${isOnline ? 'bg-green-500' : 'bg-red-500'}
        `} />

        {/* Status Message */}
        <span className="text-sm font-medium">
          {isOnline ? 'Back online' : 'No internet connection'}
        </span>

        {/* Close button for online notification */}
        {isOnline && showNotification && (
          <button
            onClick={() => setShowNotification(false)}
            className={`
              ml-2 text-lg leading-none hover:opacity-70 transition-opacity
              ${isDarkMode ? 'text-green-300' : 'text-green-700'}
            `}
            aria-label="Close"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Inline Connection Status Badge
 * For use in headers or navigation
 */
export function ConnectionBadge() {
  const { isDarkMode } = useTheme();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="flex items-center gap-2">
      <div className={`
        w-2 h-2 rounded-full
        ${isOnline
          ? 'bg-green-500'
          : 'bg-red-500 animate-pulse'
        }
      `} />
      <span className={`text-xs ${
        isDarkMode ? 'text-gray-400' : 'text-gray-600'
      }`}>
        {isOnline ? 'Online' : 'Offline'}
      </span>
    </div>
  );
}
