import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode

  // Load saved preference on mount
  useEffect(() => {
    const savedMode = localStorage.getItem('theme-mode');
    if (savedMode === 'light') {
      setIsDarkMode(false);
    }
  }, []);

  // Save preference when it changes
  useEffect(() => {
    localStorage.setItem('theme-mode', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    if (isDarkMode) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    
    // Set body background for editorial style
    if (isDarkMode) {
      document.body.style.backgroundColor = '#000000';
    } else {
      document.body.style.backgroundColor = '#fafafa';
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <ThemeContext.Provider value={{
      isDarkMode,
      toggleTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

// useTheme is the default export (used everywhere)
// ThemeProvider is named export (used only in App.jsx)
export default useTheme;
