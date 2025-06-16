// frontend/src/components/styled/StyledComponents.jsx
import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

// Card component with consistent styling and shadow
export const Card = ({ children, className = '' }) => {
  const { isDarkMode } = useTheme();
  
  const cardClasses = `
    rounded-xl shadow-lg p-8 transition-colors
    ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}
    ${className}
  `;
  
  return (
    <div className={cardClasses}>
      {children}
    </div>
  );
};

// Page wrapper with consistent gradient background
export const Page = ({ children, customGradient = null, className = '' }) => {
  const { isDarkMode } = useTheme();
  
  const backgroundClass = customGradient || 
    (isDarkMode 
      ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
      : 'bg-gradient-to-br from-gray-50 via-white to-gray-50');
  
  return (
    <div className={`min-h-screen transition-colors duration-300 ${backgroundClass} ${className}`}>
      {children}
    </div>
  );
};

// Heading components with consistent theming
export const Heading = ({ children, level = 2, size = null, className = '' }) => {
  const { isDarkMode } = useTheme();
  const sizeClass = size || (level === 1 ? 'text-3xl' : level === 2 ? 'text-2xl' : 'text-xl');
  const Tag = `h${level}`;
  
  return (
    <Tag className={`${sizeClass} font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} ${className}`}>
      {children}
    </Tag>
  );
};

// Description/secondary text
export const Description = ({ children, className = '' }) => {
  const { isDarkMode } = useTheme();
  return (
    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} ${className}`}>
      {children}
    </p>
  );
};

// Primary button with accent color theming
export const PrimaryButton = ({ 
  children, 
  onClick, 
  disabled = false, 
  loading = false,
  className = '',
  ...props 
}) => {
  const { isDarkMode, currentTheme } = useTheme();
  
  const baseClasses = `
    flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium 
    transition-all duration-200 shadow-lg focus:outline-none focus:ring-2 
    focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-white
    ${isDarkMode ? 'focus:ring-offset-gray-900' : 'focus:ring-offset-white'}
    ${className}
  `;

  const buttonStyle = {
    backgroundColor: disabled || loading ? (isDarkMode ? '#374151' : '#d1d5db') : 
      currentTheme.primary === 'blue' ? '#3b82f6' : 
      currentTheme.primary === 'purple' ? '#8b5cf6' :
      currentTheme.primary === 'green' ? '#10b981' :
      currentTheme.primary === 'orange' ? '#f59e0b' :
      currentTheme.primary === 'rose' ? '#ec4899' :
      currentTheme.primary === 'indigo' ? '#6366f1' : '#3b82f6'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={baseClasses}
      style={buttonStyle}
      {...props}
    >
      {loading ? (
        <>
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Processing...
        </>
      ) : (
        children
      )}
    </button>
  );
};

// Secondary button with subtle styling
export const SecondaryButton = ({ 
  children, 
  onClick, 
  disabled = false,
  className = '',
  ...props 
}) => {
  const { isDarkMode } = useTheme();
  
  const buttonClasses = `
    flex items-center gap-2 px-6 py-3 rounded-lg font-medium border 
    transition-all duration-200 focus:outline-none focus:ring-2 
    focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
    ${isDarkMode 
      ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 focus:ring-offset-gray-900' 
      : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200 focus:ring-offset-white'
    }
    ${className}
  `;
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={buttonClasses}
      {...props}
    >
      {children}
    </button>
  );
};
