// frontend/src/components/shared/DateRangePicker.jsx
import React, { useState, useEffect, useRef } from 'react';

import { useTheme } from 'contexts/ThemeContext';
import { 
  FormGrid,
  FormField
} from './FormComponents';

export const DateRangePicker = ({ 
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
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [startViewMonth, setStartViewMonth] = useState(dates.startDate.getMonth());
  const [startViewYear, setStartViewYear] = useState(dates.startDate.getFullYear());
  const [endViewMonth, setEndViewMonth] = useState(dates.endDate.getMonth());
  const [endViewYear, setEndViewYear] = useState(dates.endDate.getFullYear());

  const startCalendarRef = useRef(null);
  const endCalendarRef = useRef(null);

  // Utility functions
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Close calendars when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (startCalendarRef.current && !startCalendarRef.current.contains(event.target)) {
        setShowStartCalendar(false);
      }
      if (endCalendarRef.current && !endCalendarRef.current.contains(event.target)) {
        setShowEndCalendar(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    
    setDates({ startDate: newStartDate, endDate: newEndDate });
    setShowStartCalendar(false);
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
        setShowEndCalendar(false);
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
              ? `${isDarkMode ? 'bg-white text-black' : 'bg-black text-white'}`
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
      <FormGrid>
        {/* Start Date Picker */}
        <FormField span={6} mobileSpan={6}>
          <div className="relative" ref={startCalendarRef}>
            <label className={`block text-xl font-light mb-2 ${
              isDarkMode ? 'text-white' : 'text-black'
            }`}>
              Start Date
            </label>
            <button
              onClick={() => setShowStartCalendar(!showStartCalendar)}
              className={`w-full px-4 py-3 text-left text-lg font-light border transition-colors ${
                isDarkMode
                  ? 'bg-black border-gray-800 text-white hover:border-gray-600'
                  : 'bg-white border-gray-200 text-black hover:border-gray-400'
              }`}
            >
              {dates.startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </button>
            
            {/* Start Calendar Popup */}
            {showStartCalendar && (
              <div className={`absolute bottom-full left-0 mb-2 p-4 border rounded-lg z-50 ${
                isDarkMode 
                  ? 'bg-black border-gray-800 shadow-2xl shadow-black/50' 
                  : 'bg-white border-gray-200 shadow-xl shadow-gray-500/25'
              }`}>
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-4">
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
            )}
          </div>
        </FormField>

        {/* End Date Picker */}
        <FormField span={6} mobileSpan={6}>
          <div className="relative" ref={endCalendarRef}>
            <label className={`block text-xl font-light mb-2 ${
              isDarkMode ? 'text-white' : 'text-black'
            }`}>
              End Date
            </label>
            <button
              onClick={() => setShowEndCalendar(!showEndCalendar)}
              className={`w-full px-4 py-3 text-left text-lg font-light border transition-colors ${
                isDarkMode
                  ? 'bg-black border-gray-800 text-white hover:border-gray-600'
                  : 'bg-white border-gray-200 text-black hover:border-gray-400'
              }`}
            >
              {dates.endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </button>
            
            {/* End Calendar Popup */}
            {showEndCalendar && (
              <div className={`absolute bottom-full left-0 mb-2 p-4 border rounded-lg z-50 ${
                isDarkMode 
                  ? 'bg-black border-gray-800 shadow-2xl shadow-black/50' 
                  : 'bg-white border-gray-200 shadow-xl shadow-gray-500/25'
              }`}>
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-4">
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
            )}
          </div>
        </FormField>
      </FormGrid>
      
      {/* Simple Period Summary */}
      <div className={`mt-6 text-center ${
        isDarkMode ? 'text-gray-400' : 'text-gray-600'
      }`}>
        <div className="text-lg font-light">
          {Math.max(1, duration)} month{duration !== 1 ? 's' : ''} budget period
        </div>
      </div>
    </div>
  );
};