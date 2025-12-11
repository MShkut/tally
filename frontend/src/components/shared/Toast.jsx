import React from 'react';
import { useEffect } from 'react';

import { useTheme } from 'contexts/ThemeContext';

export const Toast = ({ message, type = 'info', duration = 3000, onClose }) => {
  const { isDarkMode } = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return isDarkMode
          ? 'bg-green-900 bg-opacity-90 border-green-600 text-green-400'
          : 'bg-green-100 border-green-500 text-green-700';
      case 'error':
        return isDarkMode
          ? 'bg-red-900 bg-opacity-90 border-red-600 text-red-400'
          : 'bg-red-100 border-red-500 text-red-700';
      case 'warning':
        return isDarkMode
          ? 'bg-yellow-900 bg-opacity-90 border-yellow-600 text-yellow-400'
          : 'bg-yellow-100 border-yellow-500 text-yellow-700';
      default:
        return isDarkMode
          ? 'bg-blue-900 bg-opacity-90 border-blue-600 text-blue-400'
          : 'bg-blue-100 border-blue-500 text-blue-700';
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 z-[100] p-4 rounded-lg border-l-4 shadow-lg max-w-md animate-slide-in ${getTypeStyles()}`}
      style={{
        animation: 'slideIn 0.3s ease-out'
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="text-sm font-light whitespace-pre-line">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="text-lg leading-none opacity-70 hover:opacity-100 transition-opacity"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export const useToast = () => {
  const [toasts, setToasts] = React.useState([]);

  const showToast = (message, type = 'info', duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, duration }]);
  };

  const hideToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const ToastContainer = () => (
    <div className="fixed top-4 right-4 z-[100] space-y-2">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => hideToast(toast.id)}
        />
      ))}
    </div>
  );

  return { showToast, ToastContainer };
};
