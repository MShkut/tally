// frontend/src/components/shared/DatePicker.jsx
// Simple single date picker component based on DateRangePicker calendar logic

import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from 'contexts/ThemeContext';
import { dataManager } from 'utils/dataManager';

export const DatePicker = ({
  value,
  onChange,
  placeholder = 'Select date',
  className = '',
  align = 'right', // 'left' or 'right'
  useBudgetConstraints = true // Set to false to allow all historical dates
}) => {
  const { isDarkMode } = useTheme();
  const [showCalendar, setShowCalendar] = useState(false);
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const calendarRef = useRef(null);

  // Get budget period constraints (or use unlimited for net worth)
  const getBudgetPeriodConstraints = () => {
    if (!useBudgetConstraints) {
      // For net worth and other non-budget uses: allow all historical dates
      return {
        startDate: new Date(1900, 0, 1), // Far past
        endDate: new Date() // Today (future dates still restricted)
      };
    }

    try {
      const userData = dataManager.loadUserData();
      const period = userData?.period;

      if (period?.start_date && period?.end_date) {
        const startDate = new Date(period.start_date);
        const endDate = new Date(period.end_date);

        return {
          startDate: startDate,
          endDate: endDate
        };
      }
    } catch (error) {
      console.warn('Could not load budget period constraints:', error);
    }

    // Fallback to current year if no period defined
    const now = new Date();
    return {
      startDate: new Date(now.getFullYear(), 0, 1), // Jan 1 of current year
      endDate: new Date(now.getFullYear(), 11, 31)  // Dec 31 of current year
    };
  };

  const budgetPeriod = getBudgetPeriodConstraints();

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
    
    // Check if date is within budget period
    if (selectedDate >= budgetPeriod.startDate && selectedDate <= budgetPeriod.endDate) {
      const isoDate = selectedDate.toISOString().split('T')[0];
      onChange(isoDate);
      setShowCalendar(false);
    }
  };

  // Check if navigation is allowed in given direction
  const canNavigateMonth = (direction) => {
    const newMonth = viewMonth + direction;
    let newYear = viewYear;
    let finalMonth = newMonth;

    if (newMonth < 0) {
      finalMonth = 11;
      newYear = viewYear - 1;
    } else if (newMonth > 11) {
      finalMonth = 0;
      newYear = viewYear + 1;
    }

    // Check if the new month/year is within budget period
    const newDate = new Date(newYear, finalMonth, 1);
    const periodStart = new Date(budgetPeriod.startDate.getFullYear(), budgetPeriod.startDate.getMonth(), 1);
    const periodEnd = new Date(budgetPeriod.endDate.getFullYear(), budgetPeriod.endDate.getMonth(), 1);

    return newDate >= periodStart && newDate <= periodEnd;
  };

  // Navigate months (constrained to budget period)
  const navigateMonth = (direction) => {
    if (!canNavigateMonth(direction)) return;

    const newMonth = viewMonth + direction;
    let newYear = viewYear;
    let finalMonth = newMonth;

    if (newMonth < 0) {
      finalMonth = 11;
      newYear = viewYear - 1;
    } else if (newMonth > 11) {
      finalMonth = 0;
      newYear = viewYear + 1;
    }

    setViewMonth(finalMonth);
    setViewYear(newYear);
  };

  // Handle year change from dropdown
  const handleYearChange = (newYear) => {
    setViewYear(parseInt(newYear));
  };

  // Generate available years based on constraints
  const getAvailableYears = () => {
    const startYear = budgetPeriod.startDate.getFullYear();
    const endYear = budgetPeriod.endDate.getFullYear();
    const years = [];
    for (let year = startYear; year <= endYear; year++) {
      years.push(year);
    }
    return years;
  };

  const availableYears = getAvailableYears();

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
      const isOutsidePeriod = date < budgetPeriod.startDate || date > budgetPeriod.endDate;
      
      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          disabled={isOutsidePeriod}
          className={`w-12 h-10 text-sm rounded flex items-center justify-center transition-colors ${
            isOutsidePeriod
              ? 'text-gray-400 cursor-not-allowed opacity-50'
              : isSelected
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

      {/* Calendar popup - positioned based on align prop */}
      {showCalendar && (
        <div className={`absolute top-0 p-4 border rounded-lg z-50 w-80 ${
          align === 'left' ? 'left-0' : 'left-full ml-4'
        } ${
          isDarkMode
            ? 'bg-black border-gray-800 shadow-2xl shadow-black/50'
            : 'bg-white border-gray-200 shadow-xl shadow-gray-500/25'
        }`}>
          {/* Month/Year Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateMonth(-1)}
              disabled={!canNavigateMonth(-1)}
              className={`p-2 rounded transition-colors ${
                !canNavigateMonth(-1)
                  ? 'text-gray-400 cursor-not-allowed opacity-50'
                  : isDarkMode
                    ? 'hover:bg-gray-700 text-white'
                    : 'hover:bg-gray-100 text-black'
              }`}
            >
              ←
            </button>
            <div className="flex items-center gap-2">
              <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                {monthNames[viewMonth]}
              </div>
              <select
                value={viewYear}
                onChange={(e) => handleYearChange(e.target.value)}
                className={`font-medium px-2 py-1 rounded border transition-colors ${
                  isDarkMode
                    ? 'bg-gray-900 border-gray-700 text-white hover:border-gray-600'
                    : 'bg-white border-gray-300 text-black hover:border-gray-400'
                } focus:outline-none cursor-pointer`}
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => navigateMonth(1)}
              disabled={!canNavigateMonth(1)}
              className={`p-2 rounded transition-colors ${
                !canNavigateMonth(1)
                  ? 'text-gray-400 cursor-not-allowed opacity-50'
                  : isDarkMode
                    ? 'hover:bg-gray-700 text-white'
                    : 'hover:bg-gray-100 text-black'
              }`}
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
