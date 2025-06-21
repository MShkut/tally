import React from 'react';

import { useTheme } from 'contexts/ThemeContext';

export const FrequencySelector = ({ 
  frequency, 
  onChange, 
  label = "Frequency",
  allowOneTime = false,
  className = ''
}) => {
  const { isDarkMode } = useTheme();
  
  // Base frequencies for recurring income/expenses
  const baseFrequencies = ['Weekly', 'Bi-weekly', 'Monthly', 'Yearly'];
  
  // Add one-time option for specific contexts (gifts, bonuses, etc.)
  const frequencies = allowOneTime 
    ? [...baseFrequencies, 'One-time']
    : baseFrequencies;
  
  const cycleFrequency = () => {
    const currentIndex = frequencies.indexOf(frequency);
    const nextIndex = (currentIndex + 1) % frequencies.length;
    onChange(frequencies[nextIndex]);
  };

  return (
    <div className={className}>
      <label className={`block text-2xl font-medium mb-2 ${
        isDarkMode ? 'text-gray-400' : 'text-gray-500'
      }`}>
        {label}
      </label>
      
      <button
        type="button"
        onClick={cycleFrequency}
        className={`w-full bg-transparent border-0 border-b-2 pb-4 text-2xl font-medium focus:outline-none transition-colors px-0 py-3 text-left group cursor-pointer whitespace-nowrap ${
          isDarkMode 
            ? 'border-gray-700 text-white hover:border-white focus:border-white' 
            : 'border-gray-300 text-black hover:border-black focus:border-black'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            {frequency}
          </div>
          
          {/* Subtle click indicator */}
          <div className={`
            text-xs transition-all duration-200
            ${isDarkMode 
              ? 'text-gray-600 group-hover:text-gray-400' 
              : 'text-gray-400 group-hover:text-gray-600'
            }
          `}>
            ⟲
          </div>
        </div>
      </button>
    </div>
  );
};
