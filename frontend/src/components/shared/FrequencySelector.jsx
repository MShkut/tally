import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const FrequencySelector = ({ frequency, onChange, width = 'auto' }) => {
  const { isDarkMode } = useTheme();
  
  const frequencies = ['Weekly', 'Bi-weekly', 'Monthly', 'Yearly', 'One-time'];
  
  const cycleFrequency = () => {
    const currentIndex = frequencies.indexOf(frequency);
    const nextIndex = (currentIndex + 1) % frequencies.length;
    onChange(frequencies[nextIndex]);
  };

  const getFrequencyIcon = (freq) => {
    switch (freq) {
      case 'Weekly': return '⚡';
      case 'Bi-weekly': return '🔄';
      case 'Monthly': return '📅';
      case 'Yearly': return '🎯';
      case 'One-time': return '💰';
      default: return '📅';
    }
  };

  const widthClass = width === 'auto' ? '' : width === 'fixed' ? 'w-36' : width;

  return (
    <button
      type="button"
      onClick={cycleFrequency}
      className={`
        ${widthClass} h-10 px-4 py-2 rounded-lg border transition-all 
        flex items-center justify-center space-x-2 hover:scale-105
        ${isDarkMode 
          ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600' 
          : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
        }
      `}
    >
      <span>{getFrequencyIcon(frequency)}</span>
      <span className="font-medium text-center">{frequency}</span>
    </button>
  );
};

export default FrequencySelector;
