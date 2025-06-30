// frontend/src/components/shared/DatePicker.jsx
// Simple single date picker component based on DateRangePicker calendar logic

import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from 'contexts/ThemeContext';
import { StandardSelect } from './FormComponents';

export const DatePicker = ({ 
  value, 
  onChange, 
  placeholder = 'Select date',
  className = '' 
}) => {
  const { isDarkMode } = useTheme();
  const [showCalendar, setShowCalendar] = useState(false);
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const calendarRef = useRef(null);

  // Initialize view month/year from value or default to current month
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      setViewMonth(date.getMonth());
      setViewYear(date.getFullYear());
    } else {
      // If no value, make sure we're showing current month
      const now = new Date();
      setViewMonth(now.getMonth());
      setViewYear(now.getFullYear());
    }
  }, [value]);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
    };

    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCalendar]);

  // Utility functions
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Handle date selection
  const handleDateClick = (day) => {
    const selectedDate = new Date(viewYear, viewMonth, day);
    const isoDate = selectedDate.toISOString().split('T')[0];
    onChange(isoDate);
    setShowCalendar(false);
  };

  // Navigate months
  const navigateMonth = (direction) => {
    const newMonth = viewMonth + direction;
    if (newMonth < 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else if (newMonth > 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(newMonth);
    }
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
    const today = new Date();
    const selectedDate = value ? new Date(value + 'T00:00:00') : null; // Fix timezone issues
    
    const days = [];
    
    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-12 h-10" />);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(viewYear, viewMonth, day);
      // Better date comparison - compare year, month, day separately
      const isToday = date.getFullYear() === today.getFullYear() && 
                     date.getMonth() === today.getMonth() && 
                     date.getDate() === today.getDate();
      const isSelected = selectedDate && 
                        date.getFullYear() === selectedDate.getFullYear() && 
                        date.getMonth() === selectedDate.getMonth() && 
                        date.getDate() === selectedDate.getDate();
      
      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          className={`w-12 h-10 text-sm rounded flex items-center justify-center transition-colors ${
            isSelected
              ? isDarkMode ? 'bg-white text-black' : 'bg-black text-white'
              : isToday
              ? isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-black'
              : isDarkMode ? 'text-white hover:bg-gray-700' : 'text-black hover:bg-gray-100'
          }`}
        >
          {day}
        </button>
      );
    }
    
    return days;
  };

  // Format display value
  const displayValue = value 
    ? new Date(value).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      })
    : '';

  return (
    <div className={`relative ${className}`} ref={calendarRef}>
      {/* Date input field - matching DateRangePicker styling */}
      <button
        onClick={() => setShowCalendar(!showCalendar)}
        className={`w-full py-2 border-0 border-b-2 bg-transparent text-base font-light text-left focus:outline-none transition-colors ${
          isDarkMode 
            ? 'border-gray-600 text-gray-100 hover:border-gray-400' 
            : 'border-gray-300 text-gray-900 hover:border-gray-600'
        }`}
      >
        {displayValue || placeholder}
      </button>

      {/* Calendar popup - fixed width that breaks out of column constraints */}
      {showCalendar && (
        <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-4 border rounded-lg z-50 w-80 ${
          isDarkMode 
            ? 'bg-black border-gray-800 shadow-2xl shadow-black/50' 
            : 'bg-white border-gray-200 shadow-xl shadow-gray-500/25'
        }`}>
          {/* Month/Year Selectors */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <StandardSelect
              value={viewMonth}
              onChange={(value) => setViewMonth(parseInt(value))}
              options={monthNames.map((month, index) => ({
                value: index,
                label: month
              }))}
              className="[&_button]:text-sm [&_button]:py-1"
            />
            <StandardSelect
              value={viewYear}
              onChange={(value) => setViewYear(parseInt(value))}
              options={Array.from({ length: 10 }, (_, i) => {
                const year = new Date().getFullYear() - 5 + i;
                return { value: year, label: year.toString() };
              })}
              className="[&_button]:text-sm [&_button]:py-1"
            />
          </div>
          
          {/* Month Navigation Arrows */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateMonth(-1)}
              className={`p-2 rounded ${isDarkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100 text-black'}`}
            >
              ←
            </button>
            <div className={`text-center font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
              {monthNames[viewMonth]} {viewYear}
            </div>
            <button
              onClick={() => navigateMonth(1)}
              className={`p-2 rounded ${isDarkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100 text-black'}`}
            >
              →
            </button>
          </div>
          
          {/* Calendar Grid - much wider cells with proper spacing */}
          <div className="grid grid-cols-7 gap-3 mb-3">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className={`w-12 h-10 text-sm font-medium flex items-center justify-center ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-3">
            {generateCalendarDays()}
          </div>
        </div>
      )}
    </div>
  );
};