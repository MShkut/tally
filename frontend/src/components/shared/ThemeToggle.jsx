// frontend/src/components/shared/ThemeToggle.jsx
import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import ColorThemeSelector from './ColorThemeSelector';
import { buildClasses } from '../../utils/themeUtils';

const ThemeToggle = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <div className="fixed top-6 right-6 flex items-center space-x-3 z-50">
      <ColorThemeSelector />
      
      <button
        onClick={toggleTheme}
        className={`
          p-3 rounded-full transition-all shadow-lg
          ${isDarkMode 
            ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' 
            : 'bg-white text-gray-600 hover:bg-gray-50'
          }
        `}
        title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
      >
        {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>
    </div>
  );
};

export default ThemeToggle;
