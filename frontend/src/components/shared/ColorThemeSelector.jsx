import React, { useState } from 'react';
import { Palette, ChevronDown } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const ColorThemeSelector = () => {
  const { isDarkMode, colorTheme, changeColorTheme, availableThemes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const handleThemeChange = (themeKey) => {
    changeColorTheme(themeKey);
    setIsOpen(false);
  };

  const getThemePreview = (themeKey) => {
    const theme = availableThemes[themeKey];
    const colors = {
      blue: 'bg-blue-500',
      purple: 'bg-purple-500', 
      green: 'bg-green-500',
      orange: 'bg-orange-500',
      rose: 'bg-rose-500',
      indigo: 'bg-indigo-500'
    };
    return colors[theme.primary] || 'bg-gray-500';
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700' 
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        <Palette className="w-4 h-4" />
        <div className={`w-4 h-4 rounded-full ${getThemePreview(colorTheme)}`} />
        <span className="text-sm font-medium">{availableThemes[colorTheme].name}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute top-full mt-2 right-0 w-64 rounded-lg border shadow-lg z-50 ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-600' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="p-2">
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(availableThemes).map(([themeKey, theme]) => (
                <button
                  key={themeKey}
                  onClick={() => handleThemeChange(themeKey)}
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-all hover:scale-105 ${
                    colorTheme === themeKey
                      ? isDarkMode
                        ? 'bg-gray-700 ring-2 ring-gray-500'
                        : 'bg-gray-100 ring-2 ring-gray-400'
                      : isDarkMode
                        ? 'hover:bg-gray-700'
                        : 'hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full ${getThemePreview(themeKey)} flex-shrink-0`} />
                  <div className="text-left">
                    <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {theme.name}
                    </div>
                    <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {themeKey.charAt(0).toUpperCase() + themeKey.slice(1)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default ColorThemeSelector;
