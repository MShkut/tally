import React, { useState, useEffect, useRef } from 'react';

import { useTheme } from 'contexts/ThemeContext';

export const FrequencySelector = ({ 
  frequency, 
  onChange, 
  label = "Frequency",
  allowOneTime = false,
  className = ''
}) => {
  const { isDarkMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  
  // Base frequencies for recurring income/expenses
  const baseFrequencies = ['Weekly', 'Bi-weekly', 'Monthly', 'Yearly'];
  
  // Add one-time option for specific contexts (gifts, bonuses, etc.)
  const frequencies = allowOneTime 
    ? [...baseFrequencies, 'One-time']
    : baseFrequencies;
  
  const handleSelect = (selectedFrequency) => {
    onChange(selectedFrequency);
    setIsOpen(false);
    setFocusedIndex(-1);
    buttonRef.current?.focus();
  };

  // Handle keyboard navigation
  const handleKeyDown = (event) => {
    if (!isOpen) {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
        event.preventDefault();
        setIsOpen(true);
        setFocusedIndex(frequencies.indexOf(frequency));
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % frequencies.length);
        break;
      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex((prev) => (prev - 1 + frequencies.length) % frequencies.length);
        break;
      case 'Enter':
        event.preventDefault();
        if (focusedIndex >= 0) {
          handleSelect(frequencies[focusedIndex]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        setIsOpen(false);
        setFocusedIndex(-1);
        buttonRef.current?.focus();
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };
    
    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <label className={`block text-2xl font-medium mb-2 ${
        isDarkMode ? 'text-gray-400' : 'text-gray-500'
      }`}>
        {label}
      </label>
      
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`w-full bg-transparent border-0 border-b-2 pb-4 text-2xl font-medium focus:outline-none transition-colors px-0 py-3 text-left cursor-pointer whitespace-nowrap ${
          isDarkMode 
            ? 'border-gray-700 text-white hover:border-white focus:border-white' 
            : 'border-gray-300 text-black hover:border-black focus:border-black'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            {frequency}
          </div>
          
          {/* Dropdown arrow */}
          <div className={`
            text-xs transition-transform duration-200
            ${isDarkMode 
              ? 'text-gray-600' 
              : 'text-gray-400'
            }
            ${isOpen ? 'rotate-180' : ''}
          `}>
            ▼
          </div>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={`absolute top-full left-0 right-0 mt-1 py-2 shadow-lg border z-50 ${
          isDarkMode 
            ? 'bg-black border-gray-700' 
            : 'bg-white border-gray-300'
        }`}>
          {frequencies.map((freq, index) => (
            <button
              key={freq}
              type="button"
              onClick={() => handleSelect(freq)}
              className={`w-full px-4 py-3 text-left text-xl font-medium transition-colors ${
                freq === frequency
                  ? isDarkMode 
                    ? 'bg-gray-700 text-white' 
                    : 'bg-gray-100 text-black'
                  : focusedIndex === index
                    ? isDarkMode 
                      ? 'bg-gray-800 text-white' 
                      : 'bg-gray-50 text-black'
                    : isDarkMode 
                      ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                      : 'text-gray-700 hover:bg-gray-50 hover:text-black'
              }`}
            >
              {freq}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
