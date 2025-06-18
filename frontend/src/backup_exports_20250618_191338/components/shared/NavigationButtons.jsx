import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const NavigationButtons = ({ 
  onBack, 
  onNext, 
  canGoNext = true, 
  nextLabel = 'Continue',
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
          className={`text-lg font-light transition-colors ${
            isDarkMode 
              ? 'text-gray-400 hover:text-white border-b border-gray-700 hover:border-white pb-1' 
              : 'text-gray-600 hover:text-black border-b border-gray-300 hover:border-black pb-1'
          }`}
        >
          {backLabel}
        </button>
      ) : (
        <div />
      )}
      
      <button
        onClick={onNext}
        disabled={!canGoNext || nextLoading}
        className={`text-xl font-light transition-all ${
          canGoNext && !nextLoading
            ? isDarkMode
              ? 'text-white border-b-2 border-white hover:border-gray-400 pb-2'
              : 'text-black border-b-2 border-black hover:border-gray-600 pb-2'
            : isDarkMode
              ? 'text-gray-600 cursor-not-allowed pb-2'
              : 'text-gray-400 cursor-not-allowed pb-2'
        }`}
      >
        {nextLoading ? 'Processing...' : nextLabel}
      </button>
    </div>
  );
};


export default NavigationButtons;
