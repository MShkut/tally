// frontend/src/components/shared/SmartInput.jsx
import React, { useState, useEffect, useRef } from 'react';

import { useTheme } from 'contexts/ThemeContext';

export const SmartInput = ({ 
  label, 
  value = '', 
  onChange, 
  onSuggestionSelect,
  suggestions = [],
  placeholder = '',
  required = false,
  className = '',
  inputClassName = '',
  ...props 
}) => {
  const { isDarkMode } = useTheme();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [ghostText, setGhostText] = useState('');
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Filter suggestions based on input
  const getFilteredSuggestions = () => {
    if (!value || value.length < 1) return [];
    
    const searchValue = value.toLowerCase();
    return suggestions.filter(suggestion => {
      // Check main name
      if (suggestion.name.toLowerCase().startsWith(searchValue)) {
        return true;
      }
      // Check keywords/aliases
      if (suggestion.keywords) {
        return suggestion.keywords.some(keyword => 
          keyword.toLowerCase().includes(searchValue)
        );
      }
      return false;
    }).slice(0, 3); // Max 3 suggestions
  };

  const filteredSuggestions = getFilteredSuggestions();

  // Update ghost text
  useEffect(() => {
    if (filteredSuggestions.length > 0 && value.length > 0) {
      const firstMatch = filteredSuggestions[0];
      const searchValue = value.toLowerCase();
      
      // If the suggestion starts with what user typed
      if (firstMatch.name.toLowerCase().startsWith(searchValue)) {
        setGhostText(firstMatch.name);
      } else {
        setGhostText('');
      }
    } else {
      setGhostText('');
    }
  }, [value, filteredSuggestions]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions || filteredSuggestions.length === 0) {
      if (e.key === 'Tab' && ghostText && ghostText !== value) {
        e.preventDefault();
        acceptGhostText();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > -1 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          selectSuggestion(filteredSuggestions[selectedIndex]);
        } else if (ghostText && ghostText !== value) {
          acceptGhostText();
        }
        break;
      case 'Tab':
        if (ghostText && ghostText !== value) {
          e.preventDefault();
          acceptGhostText();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const acceptGhostText = () => {
    if (ghostText) {
      const suggestion = filteredSuggestions.find(s => s.name === ghostText);
      if (suggestion) {
        selectSuggestion(suggestion);
      }
    }
  };

  const selectSuggestion = (suggestion) => {
    onChange(suggestion.name);
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    }
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
    setShowSuggestions(true);
    setSelectedIndex(-1);
  };

  const handleInputFocus = () => {
    if (filteredSuggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = (e) => {
    // Delay to allow click on suggestion
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(e.relatedTarget)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    }, 200);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        inputRef.current && 
        !inputRef.current.contains(event.target) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className={`block text-2xl font-medium mb-2 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="relative">
        {/* Ghost text display */}
        {ghostText && ghostText !== value && (
          <div 
            className={`
              absolute inset-0 pointer-events-none flex items-center
              text-2xl font-medium pb-4
              ${isDarkMode ? 'text-gray-700' : 'text-gray-300'}
            `}
            style={{ paddingTop: '12px' }}
          >
            <span className="invisible">{value}</span>
            <span>{ghostText.substring(value.length)}</span>
          </div>
        )}
        
        {/* Actual input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`
            w-full bg-transparent border-0 border-b-2 pb-4 text-2xl font-medium 
            focus:outline-none transition-colors px-0 py-3 relative z-10
            ${isDarkMode 
              ? 'border-gray-700 text-white placeholder-gray-500 focus:border-white' 
              : 'border-gray-300 text-black placeholder-gray-400 focus:border-black'
            } ${inputClassName}
          `}
          {...props}
        />
      </div>
      
      {/* Suggestions dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className={`
            absolute top-full left-0 right-0 mt-2 border z-50
            ${isDarkMode 
              ? 'bg-black border-gray-700' 
              : 'bg-white border-gray-200'
            }
          `}
        >
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={suggestion.name}
              type="button"
              onClick={() => selectSuggestion(suggestion)}
              className={`
                w-full px-4 py-3 text-left transition-colors text-lg font-light
                ${index === selectedIndex
                  ? isDarkMode 
                    ? 'bg-gray-800 text-white' 
                    : 'bg-gray-100 text-black'
                  : isDarkMode 
                    ? 'text-gray-300 hover:bg-gray-900 hover:text-white' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-black'
                }
              `}
            >
              <div>{suggestion.name}</div>
              {suggestion.hint && (
                <div className={`text-sm mt-1 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  {suggestion.hint}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
