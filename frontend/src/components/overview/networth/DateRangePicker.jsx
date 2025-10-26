// frontend/src/components/overview/networth/DateRangePicker.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from 'contexts/ThemeContext';

/**
 * Date range picker with calendar popups for chart filtering
 * Shows "All Time" by default when no range selected
 */
export const DateRangePicker = ({ startDate, endDate, onChange, earliestDate }) => {
  const { isDarkMode } = useTheme();
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [startViewMonth, setStartViewMonth] = useState(new Date().getMonth());
  const [startViewYear, setStartViewYear] = useState(new Date().getFullYear());
  const [endViewMonth, setEndViewMonth] = useState(new Date().getMonth());
  const [endViewYear, setEndViewYear] = useState(new Date().getFullYear());
  const startCalendarRef = useRef(null);
  const endCalendarRef = useRef(null);

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

  // Initialize view dates based on selected values
  useEffect(() => {
    if (startDate) {
      const date = new Date(startDate);
      setStartViewMonth(date.getMonth());
      setStartViewYear(date.getFullYear());
    } else if (earliestDate) {
      const date = new Date(earliestDate);
      setStartViewMonth(date.getMonth());
      setStartViewYear(date.getFullYear());
    }
  }, [startDate, earliestDate]);

  useEffect(() => {
    if (endDate) {
      const date = new Date(endDate);
      setEndViewMonth(date.getMonth());
      setEndViewYear(date.getFullYear());
    }
  }, [endDate]);

  const handleClearRange = () => {
    onChange({
      startDate: null,
      endDate: null
    });
  };

  const isAllTime = !startDate && !endDate;

  // Format date for display
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Generate available years from earliest date to current year
  const getAvailableYears = () => {
    const earliest = earliestDate ? new Date(earliestDate).getFullYear() : 1900;
    const current = new Date().getFullYear();
    const years = [];
    for (let year = earliest; year <= current; year++) {
      years.push(year);
    }
    return years;
  };

  const availableYears = getAvailableYears();

  // Calendar generation functions
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  // Handle date selection
  const handleStartDateClick = (day) => {
    const selectedDate = new Date(startViewYear, startViewMonth, day);
    const minDate = earliestDate ? new Date(earliestDate) : new Date(1900, 0, 1);
    const maxDate = endDate ? new Date(endDate) : new Date();

    if (selectedDate >= minDate && selectedDate <= maxDate) {
      const isoDate = selectedDate.toISOString().split('T')[0];
      onChange({
        startDate: isoDate,
        endDate
      });
      setShowStartCalendar(false);
    }
  };

  const handleEndDateClick = (day) => {
    const selectedDate = new Date(endViewYear, endViewMonth, day);
    const minDate = startDate ? new Date(startDate) : (earliestDate ? new Date(earliestDate) : new Date(1900, 0, 1));
    const maxDate = new Date();

    if (selectedDate >= minDate && selectedDate <= maxDate) {
      const isoDate = selectedDate.toISOString().split('T')[0];
      onChange({
        startDate,
        endDate: isoDate
      });
      setShowEndCalendar(false);
    }
  };

  // Generate calendar days
  const generateCalendarDays = (year, month, isStartCalendar) => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const today = new Date();
    const selectedDate = isStartCalendar
      ? (startDate ? new Date(startDate + 'T00:00:00') : null)
      : (endDate ? new Date(endDate + 'T00:00:00') : null);

    const minDate = isStartCalendar
      ? (earliestDate ? new Date(earliestDate) : new Date(1900, 0, 1))
      : (startDate ? new Date(startDate) : (earliestDate ? new Date(earliestDate) : new Date(1900, 0, 1)));
    const maxDate = isStartCalendar
      ? (endDate ? new Date(endDate) : new Date())
      : new Date();

    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-10 h-10" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isToday = date.getFullYear() === today.getFullYear() &&
                     date.getMonth() === today.getMonth() &&
                     date.getDate() === today.getDate();
      const isSelected = selectedDate &&
                        date.getFullYear() === selectedDate.getFullYear() &&
                        date.getMonth() === selectedDate.getMonth() &&
                        date.getDate() === selectedDate.getDate();
      const isOutsideRange = date < minDate || date > maxDate;

      days.push(
        <button
          key={day}
          onClick={() => isStartCalendar ? handleStartDateClick(day) : handleEndDateClick(day)}
          disabled={isOutsideRange}
          className={`w-10 h-10 text-sm rounded flex items-center justify-center transition-colors ${
            isOutsideRange
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

  // Navigation functions
  const navigateStartMonth = (direction) => {
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
  };

  const navigateEndMonth = (direction) => {
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
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className={`text-sm font-light ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Date Range {isAllTime && <span className={`ml-2 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>(All Time)</span>}
        </label>

        {!isAllTime && (
          <button
            onClick={handleClearRange}
            className={`text-sm font-light underline transition-colors duration-200 ${
              isDarkMode
                ? 'text-gray-400 hover:text-white'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            Clear (All Time)
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Start Date Calendar */}
        <div className="relative" ref={startCalendarRef}>
          <label className={`block text-xs font-light mb-1 ${
            isDarkMode ? 'text-gray-500' : 'text-gray-500'
          }`}>
            Start Date
          </label>
          <button
            onClick={() => {
              setShowStartCalendar(!showStartCalendar);
              setShowEndCalendar(false);
            }}
            className={`w-full px-3 py-2 rounded-lg border font-light text-sm text-left transition-colors duration-200 ${
              isDarkMode
                ? 'bg-gray-900 border-gray-700 text-white hover:border-gray-600'
                : 'bg-white border-gray-300 text-gray-900 hover:border-gray-400'
            }`}
          >
            {formatDateDisplay(startDate) || 'All time'}
          </button>

          {/* Start Date Calendar Popup */}
          {showStartCalendar && (
            <div className={`absolute top-full mt-2 left-0 p-4 border rounded-lg z-50 w-72 ${
              isDarkMode
                ? 'bg-black border-gray-800 shadow-2xl shadow-black/50'
                : 'bg-white border-gray-200 shadow-xl shadow-gray-500/25'
            }`}>
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => navigateStartMonth(-1)}
                  className={`p-2 rounded transition-colors ${
                    isDarkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100 text-black'
                  }`}
                >
                  ←
                </button>
                <div className="flex items-center gap-2">
                  <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    {monthNames[startViewMonth]}
                  </div>
                  <select
                    value={startViewYear}
                    onChange={(e) => setStartViewYear(parseInt(e.target.value))}
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
                  onClick={() => navigateStartMonth(1)}
                  className={`p-2 rounded transition-colors ${
                    isDarkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100 text-black'
                  }`}
                >
                  →
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                  <div key={day} className={`w-10 h-10 text-xs font-medium flex items-center justify-center ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {generateCalendarDays(startViewYear, startViewMonth, true)}
              </div>
            </div>
          )}
        </div>

        {/* End Date Calendar */}
        <div className="relative" ref={endCalendarRef}>
          <label className={`block text-xs font-light mb-1 ${
            isDarkMode ? 'text-gray-500' : 'text-gray-500'
          }`}>
            End Date
          </label>
          <button
            onClick={() => {
              setShowEndCalendar(!showEndCalendar);
              setShowStartCalendar(false);
            }}
            className={`w-full px-3 py-2 rounded-lg border font-light text-sm text-left transition-colors duration-200 ${
              isDarkMode
                ? 'bg-gray-900 border-gray-700 text-white hover:border-gray-600'
                : 'bg-white border-gray-300 text-gray-900 hover:border-gray-400'
            }`}
          >
            {formatDateDisplay(endDate) || 'Now'}
          </button>

          {/* End Date Calendar Popup */}
          {showEndCalendar && (
            <div className={`absolute top-full mt-2 right-0 p-4 border rounded-lg z-50 w-72 ${
              isDarkMode
                ? 'bg-black border-gray-800 shadow-2xl shadow-black/50'
                : 'bg-white border-gray-200 shadow-xl shadow-gray-500/25'
            }`}>
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => navigateEndMonth(-1)}
                  className={`p-2 rounded transition-colors ${
                    isDarkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100 text-black'
                  }`}
                >
                  ←
                </button>
                <div className="flex items-center gap-2">
                  <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    {monthNames[endViewMonth]}
                  </div>
                  <select
                    value={endViewYear}
                    onChange={(e) => setEndViewYear(parseInt(e.target.value))}
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
                  onClick={() => navigateEndMonth(1)}
                  className={`p-2 rounded transition-colors ${
                    isDarkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100 text-black'
                  }`}
                >
                  →
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                  <div key={day} className={`w-10 h-10 text-xs font-medium flex items-center justify-center ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {generateCalendarDays(endViewYear, endViewMonth, false)}
              </div>
            </div>
          )}
        </div>
      </div>

      {!isAllTime && (startDate || endDate) && (
        <div className={`text-xs font-light text-center ${
          isDarkMode ? 'text-gray-500' : 'text-gray-500'
        }`}>
          {startDate && formatDateDisplay(startDate)}
          {startDate && endDate && ' — '}
          {endDate && formatDateDisplay(endDate)}
        </div>
      )}
    </div>
  );
};
