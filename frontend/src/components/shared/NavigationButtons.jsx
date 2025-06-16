import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const NavigationButtons = ({ 
  onBack, 
  onNext, 
  canGoNext = true, 
  nextLabel = 'Next',
  backLabel = 'Back',
  showBack = true,
  useThemeColor = true
}) => {
  const { isDarkMode, currentTheme } = useTheme();

  const getNextButtonStyles = () => {
    if (!canGoNext) {
      return isDarkMode 
        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
        : 'bg-gray-200 text-gray-400 cursor-not-allowed';
    }

    if (useThemeColor) {
      return `${currentTheme.accent} text-white`;
    }

    return 'bg-blue-600 text-white hover:bg-blue-700';
  };

  return (
    <div className="flex justify-between mt-8">
      {showBack ? (
        <button
          onClick={onBack}
          className={`flex items-center px-6 py-3 transition-colors ${
            isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> {backLabel}
        </button>
      ) : (
        <div />
      )}
      
      <button
        onClick={onNext}
        disabled={!canGoNext}
        className={`flex items-center px-6 py-3 rounded-lg transition-colors ${getNextButtonStyles()}`}
      >
        {nextLabel} <ArrowRight className="w-4 h-4 ml-2" />
      </button>
    </div>
  );
};

export default NavigationButtons;
