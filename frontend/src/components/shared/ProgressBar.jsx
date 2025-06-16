// frontend/src/components/shared/ProgressBar.jsx
import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { text } from '../../utils/themeUtils';

const ProgressBar = ({ currentStep, totalSteps = 5 }) => {
  const { isDarkMode, currentTheme } = useTheme();

  return (
    <div className="mb-8">
      <div className="flex justify-center items-center space-x-4">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((stepNum) => (
          <div key={stepNum} className="flex items-center">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
              ${stepNum <= currentStep 
                ? `bg-${currentTheme.primary}-600 text-white` 
                : isDarkMode 
                  ? 'bg-gray-700 text-gray-400' 
                  : 'bg-gray-200 text-gray-600'
              }
            `}>
              {stepNum}
            </div>
            {stepNum < totalSteps && (
              <div className={`
                w-12 h-1 mx-2 transition-colors
                ${stepNum < currentStep 
                  ? `bg-${currentTheme.primary}-600` 
                  : isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }
              `} />
            )}
          </div>
        ))}
      </div>
      <div className={`text-center mt-4 text-sm ${text.secondary(isDarkMode)}`}>
        Step {currentStep} of {totalSteps}
      </div>
    </div>
  );
};

export default ProgressBar;
