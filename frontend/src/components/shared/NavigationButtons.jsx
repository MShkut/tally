import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const NavigationButtons = ({ 
  onBack, 
  onNext, 
  canGoNext = true, 
  nextLabel = 'Next',
  backLabel = 'Back',
  showBack = true,
  nextLoading = false,
  className = ''
}) => {
  const { isDarkMode } = useTheme();

  return (
    <div className={`flex justify-between items-center mt-16 ${className}`}>
      {showBack ? (
        <button 
          onClick={onBack}
          className={`px-6 py-3 transition-colors border-b-2 border-transparent hover:border-current focus:outline-none ${
            isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <span className="text-lg font-light">{backLabel}</span>
        </button>
      ) : (
        <div />
      )}
      
      <button
        onClick={onNext}
        disabled={!canGoNext || nextLoading}
        className={`px-8 py-4 text-lg font-light transition-colors border-b-2 border-transparent focus:outline-none ${
          canGoNext && !nextLoading
            ? isDarkMode 
              ? 'text-white hover:border-white' 
              : 'text-black hover:border-black'
            : isDarkMode 
              ? 'text-gray-600 cursor-not-allowed' 
              : 'text-gray-400 cursor-not-allowed'
        }`}
      >
        {nextLoading ? (
          <span>Processing...</span>
        ) : (
          <span>{nextLabel}</span>
        )}
      </button>
    </div>
  );
};

export default NavigationButtons;
