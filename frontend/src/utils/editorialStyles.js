// src/utils/editorialStyles.js
// Editorial Design System - Consistent styling across the app

export const editorial = {
  // Typography hierarchy
  typography: {
    hero: "text-5xl font-extralight leading-tight",
    heading: "text-3xl font-light leading-tight", 
    subheading: "text-base font-medium uppercase tracking-wider text-gray-500",
    body: "text-base font-normal leading-relaxed",
    caption: "text-sm font-normal text-gray-500"
  },

  // Layout patterns
  layout: {
    page: (isDarkMode) => `min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`,
    container: "max-w-6xl mx-auto px-6",
    section: "mb-20",
    grid: "grid grid-cols-1 lg:grid-cols-3 gap-20"
  },

  // Clean separators (no cards)
  separators: {
    border: (isDarkMode) => `border-t pt-8 ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`,
    subtle: (isDarkMode) => `border-b pb-8 ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`
  },

  // Interactive elements
  interactive: {
    button: (isDarkMode) => `transition-colors hover:border-current ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-black'}`,
    underline: "border-b border-transparent hover:border-current transition-colors"
  },

  // Form elements
  forms: {
    input: (isDarkMode) => `w-full px-0 py-3 border-0 border-b-2 bg-transparent transition-colors ${isDarkMode ? 'border-gray-700 text-white placeholder-gray-500 focus:border-white' : 'border-gray-300 text-black placeholder-gray-400 focus:border-black'} focus:outline-none`,
    label: (isDarkMode) => `block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`
  }
};

// Helper function to combine editorial classes
export const buildEditorialClass = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

// Remove all decorative elements
export const cleanClassName = (className) => {
  return className
    .replace(/rounded-\w+/g, '') // Remove rounded corners
    .replace(/shadow-\w+/g, '')  // Remove shadows
    .replace(/bg-gradient-\w+/g, '') // Remove gradients
    .replace(/from-\w+-\d+/g, '') // Remove gradient colors
    .replace(/to-\w+-\d+/g, '')   // Remove gradient colors
    .trim()
    .replace(/\s+/g, ' '); // Clean up extra spaces
};
