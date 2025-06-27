// frontend/src/components/shared/DateRangeCalendar.jsx
import React, { useState, useEffect } from 'react';

import { useTheme } from 'contexts/ThemeContext';

export const DateRangeCalendar = ({ 
  onDateRangeChange, 
  initialStartDate = null,
  initialEndDate = null,
  maxMonths = 12,
  className = ''
}) => {
  const { isDarkMode } = useTheme();
  
  // Initialize dates
  const getInitialDates = () => {
    if (initialStartDate && initialEndDate) {
      return {
        startDate: new Date(initialStartDate),
        endDate: new Date(initialEndDate)
      };
    }
    
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1); // First of current month
    const end = new Date(start.getFullYear(), start.getMonth() + 11, 1); // 12 months later
    end.setMonth(end.getMonth() + 1, 0); // Last day of 12th month
    
    return { startDate: start, endDate: end };
  };

  const [dates, setDates] = useState(getInitialDates());
  const [startViewMonth, setStartViewMonth] = useState(dates.startDate.getMonth());
  const [startViewYear, setStartViewYear] = useState(dates.startDate.getFullYear());
  const [endViewMonth, setEndViewMonth] = useState(dates.endDate.getMonth());
  const [endViewYear, setEndViewYear] = useState(dates.endDate.getFullYear());

  // Utility functions
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Handle date selection
  const handleStartDateClick = (day) => {
    const newStartDate = new Date(startViewYear, startViewMonth, day);
    const maxEndDate = new Date(newStartDate);
    maxEndDate.setMonth(maxEndDate.getMonth() + maxMonths);
    maxEndDate.setDate(0); // Last day of max month
    
    let newEndDate = dates.endDate;
    if (dates.endDate < newStartDate || dates.endDate > maxEndDate) {
      // Auto-set to 12 months later if current end is invalid
      newEndDate = new Date(maxEndDate);
    }
    
    const newDates = { startDate: newStartDate, endDate: newEndDate };
    setDates(newDates);
    
    // Update end calendar view if needed
    if (newEndDate.getMonth() !== endViewMonth || newEndDate.getFullYear() !== endViewYear) {
      setEndViewMonth(newEndDate.getMonth());
      setEndViewYear(newEndDate.getFullYear());
    }
  };

  const handleEndDateClick = (day) => {
    const newEndDate = new Date(endViewYear, endViewMonth, day);
    
    // Validate end date is after start and within 12 months
    if (newEndDate >= dates.startDate) {
      const maxEndDate = new Date(dates.startDate);
      maxEndDate.setMonth(maxEndDate.getMonth() + maxMonths);
      maxEndDate.setDate(0); // Last day of max month
      
      if (newEndDate <= maxEndDate) {
        setDates({ ...dates, endDate: newEndDate });
      }
    }
  };

  // Navigation functions
  const navigateMonth = (direction, calendar) => {
    if (calendar === 'start') {
      const newMonth = startViewMonth + direction;
      if (newMonth < 0) {
        setStartViewMonth(11);
        setStartViewYear(startViewYear - 1);
      } else if (newMonth > 11) {
        setStartViewMonth(0);
        setStartViewYear(startViewYear + 1);
      } else {
        setStartViewMonth(newMonth);
      }
    } else {
      const newMonth = endViewMonth + direction;
      if (newMonth < 0) {
        setEndViewMonth(11);
        setEndViewYear(endViewYear - 1);
      } else if (newMonth > 11) {
        setEndViewMonth(0);
        setEndViewYear(endViewYear + 1);
      } else {
        setEndViewMonth(newMonth);
      }
    }
  };

  // Render calendar grid
  const renderCalendar = (year, month, selectedDate, onDateClick, isEndCalendar = false) => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];
    
    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8"></div>);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isSelected = selectedDate && 
        date.getDate() === selectedDate.getDate() &&
        date.getMonth() === selectedDate.getMonth() &&
        date.getFullYear() === selectedDate.getFullYear();
      
      // For end calendar, check if date is valid (after start and within 12 months)
      let isValid = true;
      if (isEndCalendar) {
        const maxEndDate = new Date(dates.startDate);
        maxEndDate.setMonth(maxEndDate.getMonth() + maxMonths);
        maxEndDate.setDate(0);
        isValid = date >= dates.startDate && date <= maxEndDate;
      }
      
      days.push(
        <button
          key={day}
          onClick={() => isValid && onDateClick(day)}
          disabled={!isValid}
          className={`w-8 h-8 text-sm rounded flex items-center justify-center transition-colors ${
            isSelected
              ? `${isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}`
              : isValid
              ? `${isDarkMode ? 'text-white hover:bg-gray-700' : 'text-black hover:bg-gray-100'}`
              : `${isDarkMode ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 cursor-not-allowed'}`
          }`}
        >
          {day}
        </button>
      );
    }
    
    return days;
  };

  // Calculate duration and notify parent
  useEffect(() => {
    if (onDateRangeChange) {
      const duration = Math.ceil((dates.endDate - dates.startDate) / (1000 * 60 * 60 * 24 * 30.44)); // Approximate months
      
      onDateRangeChange({
        startDate: dates.startDate.toISOString(),
        endDate: dates.endDate.toISOString(),
        durationMonths: Math.max(1, Math.min(maxMonths, duration)),
        displayStart: dates.startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        displayEnd: dates.endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      });
    }
  }, [dates]);

  const duration = Math.ceil((dates.endDate - dates.startDate) / (1000 * 60 * 60 * 24 * 30.44));

  return (
    <div className={className}>
      <div className="flex gap-8 justify-center">
        {/* Start Date Calendar */}
        <div className="flex flex-col items-center">
          <div className="mb-4">
            <h3 className={`text-2xl font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
              Start Date
            </h3>
          </div>
          
          {/* Month Navigation */}
          <div className="flex items-center justify-between w-full mb-4">
            <button
              onClick={() => navigateMonth(-1, 'start')}
              className={`p-2 rounded ${isDarkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100 text-black'}`}
            >
              ←
            </button>
            <div className={`text-center font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
              {monthNames[startViewMonth]} {startViewYear}
            </div>
            <button
              onClick={() => navigateMonth(1, 'start')}
              className={`p-2 rounded ${isDarkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100 text-black'}`}
            >
              →
            </button>
          </div>
          
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className={`w-8 h-8 text-xs font-medium flex items-center justify-center ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {renderCalendar(startViewYear, startViewMonth, dates.startDate, handleStartDateClick)}
          </div>
        </div>

        {/* End Date Calendar */}
        <div className="flex flex-col items-center">
          <div className="mb-4">
            <h3 className={`text-2xl font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
              End Date
            </h3>
          </div>
          
          {/* Month Navigation */}
          <div className="flex items-center justify-between w-full mb-4">
            <button
              onClick={() => navigateMonth(-1, 'end')}
              className={`p-2 rounded ${isDarkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100 text-black'}`}
            >
              ←
            </button>
            <div className={`text-center font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
              {monthNames[endViewMonth]} {endViewYear}
            </div>
            <button
              onClick={() => navigateMonth(1, 'end')}
              className={`p-2 rounded ${isDarkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100 text-black'}`}
            >
              →
            </button>
          </div>
          
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className={`w-8 h-8 text-xs font-medium flex items-center justify-center ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {renderCalendar(endViewYear, endViewMonth, dates.endDate, handleEndDateClick, true)}
          </div>
        </div>
      </div>
      
      {/* Period Summary */}
      <div className={`mt-8 p-6 border text-center ${
        isDarkMode ? 'border-gray-800 text-white' : 'border-gray-200 text-black'
      }`}>
        <div className="text-2xl font-light mb-2">
          {dates.startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} — {dates.endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
        <div className={`text-lg font-light ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          {Math.max(1, duration)} month{duration !== 1 ? 's' : ''} budget period
        </div>
      </div>
    </div>
  );
};