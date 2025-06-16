// frontend/src/utils/themeUtils.js

/**
 * Theme utility functions to eliminate repetitive styling code
 * This centralizes all theme logic in one place
 */

// Common background classes - no more repeating this everywhere!
export const backgrounds = {
  page: (isDarkMode) => isDarkMode 
    ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
    : 'bg-gradient-to-br from-gray-50 via-white to-gray-50',
  
  card: (isDarkMode) => isDarkMode 
    ? 'bg-gray-800 border border-gray-700' 
    : 'bg-white border border-gray-200',
  
  cardSecondary: (isDarkMode) => isDarkMode 
    ? 'bg-gray-700' 
    : 'bg-gray-50',
  
  input: (isDarkMode) => isDarkMode 
    ? 'bg-gray-800 border-gray-600' 
    : 'bg-white border-gray-300',
  
  button: (isDarkMode) => isDarkMode 
    ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' 
    : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
};

// Common text classes - centralized text colors
export const text = {
  primary: (isDarkMode) => isDarkMode ? 'text-white' : 'text-gray-900',
  secondary: (isDarkMode) => isDarkMode ? 'text-gray-400' : 'text-gray-600',
  muted: (isDarkMode) => isDarkMode ? 'text-gray-500' : 'text-gray-500',
  button: (isDarkMode) => isDarkMode ? 'text-gray-300' : 'text-gray-700'
};

// Common border classes
export const borders = {
  default: (isDarkMode) => isDarkMode ? 'border-gray-700' : 'border-gray-200',
  input: (isDarkMode) => isDarkMode ? 'border-gray-600' : 'border-gray-300',
  hover: (isDarkMode) => isDarkMode ? 'hover:border-gray-500' : 'hover:border-gray-400'
};

// Focus ring utilities for accessibility
export const focusRing = {
  default: (isDarkMode) => `focus:ring-2 focus:ring-offset-2 ${
    isDarkMode ? 'focus:ring-offset-gray-900' : 'focus:ring-offset-white'
  }`,
  
  accent: (isDarkMode, currentTheme) => {
    const ring = focusRing.default(isDarkMode);
    return `${ring} focus:ring-${currentTheme.primary}-500`;
  }
};

// Build complete class strings - no more manual className building!
export const buildClasses = {
  // Standard card component
  card: (isDarkMode, className = '') => 
    `rounded-xl shadow-lg p-8 ${backgrounds.card(isDarkMode)} ${className}`,
  
  // Page container with gradient
  page: (isDarkMode, gradient = null, className = '') => {
    const bgClass = gradient || backgrounds.page(isDarkMode);
    return `min-h-screen transition-colors duration-300 ${bgClass} ${className}`;
  },
  
  // Input field with all styling
  input: (isDarkMode, className = '') => 
    `w-full px-4 py-3 rounded-lg border transition-colors duration-200 ${backgrounds.input(isDarkMode)} ${text.primary(isDarkMode)} placeholder-gray-400 ${focusRing.default(isDarkMode)} ${className}`,
  
  // Secondary button with theme
  buttonSecondary: (isDarkMode, className = '') => 
    `flex items-center gap-2 px-6 py-3 rounded-lg font-medium border transition-all duration-200 ${backgrounds.button(isDarkMode)} ${text.button(isDarkMode)} ${borders.input(isDarkMode)} ${focusRing.default(isDarkMode)} disabled:opacity-50 disabled:cursor-not-allowed ${className}`,
  
  // Primary heading
  heading: (isDarkMode, size = 'text-2xl', className = '') => 
    `${size} font-semibold ${text.primary(isDarkMode)} ${className}`,
  
  // Secondary text/description
  description: (isDarkMode, className = '') => 
    `${text.secondary(isDarkMode)} ${className}`,
  
  // Dashed border button (like "Add Another")
  buttonDashed: (isDarkMode, className = '') => 
    `w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 border-dashed transition-all duration-200 ${isDarkMode ? 'border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300' : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700'} ${className}`
};

// Generate accent color styles using your existing theme system
export const getAccentStyles = (currentTheme, isDarkMode) => ({
  // Primary button with current accent color
  button: (disabled = false) => {
    if (disabled) {
      return {
        backgroundColor: isDarkMode ? '#374151' : '#d1d5db',
        borderColor: isDarkMode ? '#374151' : '#d1d5db',
        color: isDarkMode ? '#6b7280' : '#9ca3af'
      };
    }
    return {
      backgroundColor: currentTheme.primary === 'blue' ? '#3b82f6' : 
                      currentTheme.primary === 'purple' ? '#8b5cf6' :
                      currentTheme.primary === 'green' ? '#10b981' :
                      currentTheme.primary === 'orange' ? '#f59e0b' :
                      currentTheme.primary === 'rose' ? '#ec4899' :
                      currentTheme.primary === 'indigo' ? '#6366f1' : '#3b82f6',
      color: 'white',
      border: 'none'
    };
  },
  
  // Hover effect for accent buttons
  buttonHover: (currentTheme) => ({
    backgroundColor: currentTheme.primary === 'blue' ? '#2563eb' : 
                    currentTheme.primary === 'purple' ? '#7c3aed' :
                    currentTheme.primary === 'green' ? '#059669' :
                    currentTheme.primary === 'orange' ? '#d97706' :
                    currentTheme.primary === 'rose' ? '#db2777' :
                    currentTheme.primary === 'indigo' ? '#5856eb' : '#2563eb'
  }),
  
  // Accent background (light version)
  backgroundLight: (currentTheme, isDarkMode) => {
    if (isDarkMode) {
      return currentTheme.accentDark || 'bg-blue-900/20 border border-blue-700';
    }
    return currentTheme.accentLight || 'bg-blue-50 border border-blue-200';
  },
  
  // Accent text color  
  text: (currentTheme) => `text-${currentTheme.primary}-600`,
  
  // Accent border
  border: (currentTheme) => `border-${currentTheme.primary}-500`
});

// Event handlers for accent hover effects
export const createAccentHover = (currentTheme, disabled = false) => ({
  onMouseEnter: (e) => {
    if (!disabled && e.target) {
      const hoverStyles = getAccentStyles({}, false).buttonHover(currentTheme);
      Object.assign(e.target.style, hoverStyles);
    }
  },
  
  onMouseLeave: (e) => {
    if (!disabled && e.target) {
      const normalStyles = getAccentStyles(currentTheme, false).button(false);
      Object.assign(e.target.style, normalStyles);
    }
  }
});

// Validation helpers - avoid repeating validation logic
export const validation = {
  hasValidInput: (value, min = 0) => {
    const num = parseFloat(value);
    return value && value.toString().trim() && !isNaN(num) && num > min;
  },
  
  hasValidString: (value, minLength = 1) => {
    return value && value.toString().trim().length >= minLength;
  },
  
  isPositiveNumber: (value) => {
    const num = parseFloat(value);
    return !isNaN(num) && num > 0;
  }
};

// Currency formatting helpers
export const formatCurrency = (amount, options = {}) => {
  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 0,
    currency = 'USD'
  } = options;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits
  }).format(amount);
};

// Calculate totals - common financial calculations
export const calculations = {
  convertToMonthly: (amount, frequency) => {
    const multipliers = {
      'Weekly': 4.33,
      'Bi-weekly': 2.17, 
      'Monthly': 1,
      'Yearly': 1/12,
      'One-time': 0
    };
    return (parseFloat(amount) || 0) * (multipliers[frequency] || 1);
  },
  
  convertToYearly: (amount, frequency) => {
    const multipliers = {
      'Weekly': 52,
      'Bi-weekly': 26,
      'Monthly': 12, 
      'Yearly': 1,
      'One-time': 1
    };
    return (parseFloat(amount) || 0) * (multipliers[frequency] || 1);
  },
  
  calculatePercentage: (part, total) => {
    if (!total || total === 0) return 0;
    return (part / total) * 100;
  }
};
