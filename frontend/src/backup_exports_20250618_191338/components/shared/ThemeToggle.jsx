import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const ThemeToggle = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <div className="fixed top-8 right-8 z-50">
      <button
        onClick={toggleTheme}
        className={`
          p-3 transition-colors focus:outline-none
          ${isDarkMode 
            ? 'text-gray-400 hover:text-gray-300' 
            : 'text-gray-600 hover:text-gray-800'
          }
        `}
        title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
      >
        <span className="text-xl">{isDarkMode ? '◐' : '◑'}</span>
      </button>
    </div>
  );
};


export default ThemeToggle;
