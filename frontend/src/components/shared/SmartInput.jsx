// frontend/src/components/shared/SmartInput.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from 'contexts/ThemeContext';

export const SmartInput = ({
  label,
  value,
  onChange,
  onSuggestionSelect,
  suggestions = [],
  placeholder = '',
  className = '',
  ...props
}) => {
  const { isDarkMode } = useTheme();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const scrollableContainerRef = useRef(null);

  // Filter suggestions based on input value
  useEffect(() => {
    if (value && suggestions.length > 0) {
      const filtered = suggestions.filter(suggestion => {
        const includesInput = suggestion.name.toLowerCase().includes(value.toLowerCase());
        // Don't show exact matches - if user typed exactly what they want, don't suggest it
        const isExactMatch = suggestion.name.toLowerCase() === value.toLowerCase();
        return includesInput && !isExactMatch;
      });
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0 && value.length > 0);
      setFocusedIndex(-1); // Reset focus when suggestions change
    } else {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
      setFocusedIndex(-1);
    }
  }, [value, suggestions]);

  const handleSuggestionSelect = (suggestion) => {
    onSuggestionSelect(suggestion);
    setShowSuggestions(false);
    setFocusedIndex(-1);
    inputRef.current?.focus();
  };

  // Scroll focused item into view
  const scrollIntoView = (index) => {
    if (scrollableContainerRef.current && filteredSuggestions.length > 3) {
      const container = scrollableContainerRef.current;
      const itemHeight = 60; // Approximate height of each item (py-3 + text + padding)
      const containerHeight = 192; // maxHeight we set
      const scrollTop = container.scrollTop;
      const itemTop = index * itemHeight;
      const itemBottom = itemTop + itemHeight;

      // Scroll down if item is below visible area
      if (itemBottom > scrollTop + containerHeight) {
        container.scrollTop = itemBottom - containerHeight;
      }
      // Scroll up if item is above visible area
      else if (itemTop < scrollTop) {
        container.scrollTop = itemTop;
      }
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (event) => {
    if (!showSuggestions || filteredSuggestions.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        const nextIndex = (focusedIndex + 1) % filteredSuggestions.length;
        setFocusedIndex(nextIndex);
        scrollIntoView(nextIndex);
        break;
      case 'ArrowUp':
        event.preventDefault();
        const prevIndex = focusedIndex <= 0 ? filteredSuggestions.length - 1 : focusedIndex - 1;
        setFocusedIndex(prevIndex);
        scrollIntoView(prevIndex);
        break;
      case 'Enter':
        event.preventDefault();
        if (focusedIndex >= 0) {
          handleSuggestionSelect(filteredSuggestions[focusedIndex]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        setShowSuggestions(false);
        setFocusedIndex(-1);
        break;
    }
  };

  // Handle blur - hide suggestions when clicking/tabbing away
  const handleBlur = (event) => {
    // Only hide if focus is moving outside the container
    // Longer timeout to prevent double-click issues
    setTimeout(() => {
      if (containerRef.current && !containerRef.current.contains(document.activeElement)) {
        setShowSuggestions(false);
        setFocusedIndex(-1);
      }
    }, 150);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className={`block text-2xl font-medium mb-2 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          {label}
        </label>
      )}
      
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`w-full bg-transparent border-0 border-b-2 pb-4 text-2xl font-medium focus:outline-none transition-colors py-3 ${
          isDarkMode 
            ? 'border-gray-700 text-white placeholder-gray-500 focus:border-white' 
            : 'border-gray-300 text-black placeholder-gray-400 focus:border-black'
        }`}
        {...props}
      />

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        filteredSuggestions.length <= 3 ? (
          // Non-scrollable container for few items - no scrollbar space at all
          <div className={`absolute top-full left-0 right-0 mt-2 border shadow-lg z-50 ${
            isDarkMode 
              ? 'bg-black border-gray-700 shadow-gray-900' 
              : 'bg-white border-gray-200 shadow-gray-300'
          }`}>
            {filteredSuggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSuggestionSelect(suggestion);
                }}
                onMouseEnter={() => setFocusedIndex(index)}
                className={`w-full px-4 py-3 text-left text-lg font-light transition-colors duration-200 block ${
                  focusedIndex === index
                    ? isDarkMode 
                      ? 'bg-gray-800 text-white' 
                      : 'bg-gray-100 text-black'
                    : isDarkMode 
                      ? 'text-gray-300 hover:bg-gray-900 hover:text-white' 
                      : 'text-gray-700 hover:bg-gray-50 hover:text-black'
                }`}
                style={{ margin: 0, border: 'none' }}
              >
                {suggestion.name}
              </button>
            ))}
          </div>
        ) : (
          // Scrollable container for many items
          <div 
            ref={scrollableContainerRef}
            className={`absolute top-full left-0 right-0 mt-2 border shadow-lg z-50 overflow-y-auto ${
              isDarkMode 
                ? 'bg-black border-gray-700 shadow-gray-900' 
                : 'bg-white border-gray-200 shadow-gray-300'
            }`}
            style={{ maxHeight: '192px' }}
          >
            {filteredSuggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSuggestionSelect(suggestion);
                }}
                onMouseEnter={() => setFocusedIndex(index)}
                className={`w-full px-4 py-3 text-left text-lg font-light transition-colors duration-200 block ${
                  focusedIndex === index
                    ? isDarkMode 
                      ? 'bg-gray-800 text-white' 
                      : 'bg-gray-100 text-black'
                    : isDarkMode 
                      ? 'text-gray-300 hover:bg-gray-900 hover:text-white' 
                      : 'text-gray-700 hover:bg-gray-50 hover:text-black'
                }`}
                style={{ margin: 0, border: 'none' }}
              >
                {suggestion.name}
              </button>
            ))}
          </div>
        )
      )}
    </div>
  );
};
