import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const ProgressBar = ({ currentStep, totalSteps = 5 }) => {
  const { isDarkMode } = useTheme();

  return (
    <div className="mb-16">
      <div className="flex justify-center items-center space-x-4 mb-8">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((stepNum) => (
          <React.Fragment key={stepNum}>
            <div className={`
              w-8 h-8 flex items-center justify-center text-sm font-light transition-all
              ${stepNum <= currentStep 
                ? isDarkMode ? 'text-white' : 'text-black'
                : isDarkMode ? 'text-gray-600' : 'text-gray-400'
              }
            `}>
              {stepNum}
            </div>
            {stepNum < totalSteps && (
              <div className={`
                w-12 h-px transition-colors
                ${stepNum < currentStep 
                  ? isDarkMode ? 'bg-white' : 'bg-black'
                  : isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
                }
              `} />
            )}
          </React.Fragment>
        ))}
      </div>
      <div className={`text-center text-sm font-light ${
        isDarkMode ? 'text-gray-500' : 'text-gray-500'
      }`}>
        Step {currentStep} of {totalSteps}
      </div>
    </div>
  );
};

export default ProgressBar;
