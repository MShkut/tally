// frontend/src/utils/themeUtils.js
// Theme utility functions - aligned with editorial design philosophy

// Build consistent class strings
export const buildClasses = {
  // Page layouts
  page: (isDarkMode, className = '') => `
    min-h-screen transition-colors duration-300 
    ${isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'} 
    ${className}
  `.trim(),

  // Typography
  heading: (isDarkMode, sizeClass = 'text-2xl', className = '') => `
    font-light 
    ${isDarkMode ? 'text-white' : 'text-black'} 
    ${sizeClass} 
    ${className}
  `.trim(),

  description: (isDarkMode, className = '') => `
    font-light 
    ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} 
    ${className}
  `.trim(),

  // Form elements
  input: (isDarkMode, className = '') => `
    w-full px-0 py-3 border-0 border-b-2 bg-transparent 
    transition-colors focus:outline-none
    ${isDarkMode 
      ? 'border-gray-700 text-white placeholder-gray-500 focus:border-white' 
      : 'border-gray-300 text-black placeholder-gray-400 focus:border-black'
    } 
    ${className}
  `.trim(),

  // Buttons - NO ACCENT COLORS
  button: (isDarkMode, className = '') => `
    text-lg font-light transition-colors border-b border-transparent 
    hover:border-current pb-1
    ${isDarkMode 
      ? 'text-gray-400 hover:text-white' 
      : 'text-gray-600 hover:text-black'
    } 
    ${className}
  `.trim(),

  buttonPrimary: (isDarkMode, className = '') => `
    text-xl font-light border-b-2 pb-2 transition-all
    ${isDarkMode
      ? 'text-white border-white hover:border-gray-400'
      : 'text-black border-black hover:border-gray-600'
    } 
    ${className}
  `.trim(),

  // Remove all card styling - violates editorial principles
  card: () => {
    if (import.meta.env.DEV) {
      console.warn('Card components violate editorial design. Use clean sections with borders instead.');
    }
    return '';
  },

  // Clean borders
  border: (isDarkMode, className = '') => `
    border-t 
    ${isDarkMode ? 'border-gray-800' : 'border-gray-200'} 
    ${className}
  `.trim(),

  // Dashed borders for add buttons
  buttonDashed: (isDarkMode, className = '') => `
    w-full py-6 border-2 border-dashed transition-colors text-center
    ${isDarkMode 
      ? 'border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300' 
      : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700'
    } 
    ${className}
  `.trim(),

  // Secondary buttons
  buttonSecondary: (isDarkMode, className = '') => `
    px-4 py-2 text-sm transition-colors
    ${isDarkMode 
      ? 'text-gray-400 hover:text-gray-300' 
      : 'text-gray-600 hover:text-gray-700'
    } 
    ${className}
  `.trim()
};

// NO ACCENT COLORS - This violates editorial design
export const getAccentStyles = () => {
  if (import.meta.env.DEV) {
    console.warn('Accent colors violate editorial design principles. Use only black/white/gray.');
  }
  return {
    text: () => '',
    background: () => '',
    backgroundLight: () => '',
    button: () => ({})
  };
};

// NO ACCENT HOVER - This violates editorial design
export const createAccentHover = () => {
  if (import.meta.env.DEV) {
    console.warn('Accent colors violate editorial design principles.');
  }
  return {};
};
