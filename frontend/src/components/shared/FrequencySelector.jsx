import React from 'react';

import { useTheme } from 'contexts/ThemeContext';
import { editorial } from 'utils/editorialStyles';

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
      <label className={editorial.forms.label(isDarkMode)}>
        {label}
      </label>
      
      <button
        type="button"
        onClick={cycleFrequency}
        className={`
          ${editorial.forms.input(isDarkMode)}
          text-left group cursor-pointer
        `}
      >
        <div className="flex items-center justify-between">
          <div className={editorial.typography.body}>
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
