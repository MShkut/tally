// frontend/src/contexts/ThemeContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Your existing color themes - keeping them exactly as they were
const availableThemes = {
  blue: {
    name: 'Ocean Blue',
    primary: 'blue',
    accent: 'bg-blue-600 hover:bg-blue-700',
    accentLight: 'bg-blue-50 border border-blue-200',
    accentDark: 'bg-blue-900/20 border border-blue-700',
    lightGradient: 'from-blue-50 to-cyan-100',
    darkGradient: 'from-blue-900 to-cyan-900'
  },
  purple: {
    name: 'Royal Purple',
    primary: 'purple',
    accent: 'bg-purple-600 hover:bg-purple-700',
    accentLight: 'bg-purple-50 border border-purple-200',
    accentDark: 'bg-purple-900/20 border border-purple-700',
    lightGradient: 'from-purple-50 to-pink-100',
    darkGradient: 'from-purple-900 to-pink-900'
  },
  green: {
    name: 'Forest Green',
    primary: 'green',
    accent: 'bg-green-600 hover:bg-green-700',
    accentLight: 'bg-green-50 border border-green-200',
    accentDark: 'bg-green-900/20 border border-green-700',
    lightGradient: 'from-green-50 to-emerald-100',
    darkGradient: 'from-green-900 to-emerald-900'
  },
  orange: {
    name: 'Sunset Orange',
    primary: 'orange',
    accent: 'bg-orange-600 hover:bg-orange-700',
    accentLight: 'bg-orange-50 border border-orange-200',
    accentDark: 'bg-orange-900/20 border border-orange-700',
    lightGradient: 'from-orange-50 to-red-100',
    darkGradient: 'from-orange-900 to-red-900'
  },
  rose: {
    name: 'Rose Pink',
    primary: 'rose',
    accent: 'bg-rose-600 hover:bg-rose-700',
    accentLight: 'bg-rose-50 border border-rose-200',
    accentDark: 'bg-rose-900/20 border border-rose-700',
    lightGradient: 'from-rose-50 to-pink-100',
    darkGradient: 'from-rose-900 to-pink-900'
  },
  indigo: {
    name: 'Deep Indigo',
    primary: 'indigo',
    accent: 'bg-indigo-600 hover:bg-indigo-700',
    accentLight: 'bg-indigo-50 border border-indigo-200',
    accentDark: 'bg-indigo-900/20 border border-indigo-700',
    lightGradient: 'from-indigo-50 to-purple-100',
    darkGradient: 'from-indigo-900 to-purple-900'
  }
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [colorTheme, setColorTheme] = useState('blue');

  // Load saved preferences on mount
  useEffect(() => {
    const savedMode = localStorage.getItem('theme-mode');
    const savedColorTheme = localStorage.getItem('color-theme');
    
    if (savedMode === 'dark') {
      setIsDarkMode(true);
    }
    if (savedColorTheme && availableThemes[savedColorTheme]) {
      setColorTheme(savedColorTheme);
    }
  }, []);

  // Save preferences when they change
  useEffect(() => {
    localStorage.setItem('theme-mode', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('color-theme', colorTheme);
  }, [colorTheme]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply dark mode class
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    if (isDarkMode) {
    document.body.style.backgroundColor = '#000000';
    } else {
    document.body.style.backgroundColor = '#fafafa';
    }
    // Set CSS custom properties for the current theme
    const theme = availableThemes[colorTheme];
    const colorValues = {
      blue: { primary: '#3b82f6', hover: '#2563eb', light: '#dbeafe', dark: '#1e40af' },
      purple: { primary: '#8b5cf6', hover: '#7c3aed', light: '#ede9fe', dark: '#6d28d9' },
      green: { primary: '#10b981', hover: '#059669', light: '#d1fae5', dark: '#047857' },
      orange: { primary: '#f59e0b', hover: '#d97706', light: '#fef3c7', dark: '#b45309' },
      rose: { primary: '#ec4899', hover: '#db2777', light: '#fce7f3', dark: '#be185d' },
      indigo: { primary: '#6366f1', hover: '#5856eb', light: '#e0e7ff', dark: '#4f46e5' }
    };
    
    const colors = colorValues[colorTheme] || colorValues.blue;
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-primary-hover', colors.hover);
    root.style.setProperty('--color-primary-light', colors.light);
    root.style.setProperty('--color-primary-dark', colors.dark);
    
  }, [isDarkMode, colorTheme]);

  const currentTheme = availableThemes[colorTheme];

  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  const changeColorTheme = (themeName) => {
    if (availableThemes[themeName]) {
      setColorTheme(themeName);
    }
  };

  return (
    <ThemeContext.Provider value={{
      // Mode state
      isDarkMode,
      toggleTheme,
      
      // Color theme state  
      colorTheme,
      changeColorTheme,
      currentTheme,
      availableThemes,
      
      // Legacy support for existing components
      theme: {
        gradient: isDarkMode ? currentTheme.darkGradient : currentTheme.lightGradient,
        accent: isDarkMode ? 'text-white' : `text-${currentTheme.primary}-600`,
        button: currentTheme.accent
      }
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
