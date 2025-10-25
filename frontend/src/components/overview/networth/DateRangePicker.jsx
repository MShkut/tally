// frontend/src/components/overview/networth/DateRangePicker.jsx
import React from 'react';
import { useTheme } from 'contexts/ThemeContext';

/**
 * Simple date range picker for chart filtering
 * Shows "All Time" by default when no range selected
 */
export const DateRangePicker = ({ startDate, endDate, onChange, earliestDate }) => {
  const { isDarkMode } = useTheme();

  const handleStartChange = (e) => {
    onChange({
      startDate: e.target.value || null,
      endDate
    });
  };

  const handleEndChange = (e) => {
    onChange({
      startDate,
      endDate: e.target.value || null
    });
  };

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
        <div className="space-y-1">
          <label className={`text-xs font-light ${
            isDarkMode ? 'text-gray-500' : 'text-gray-500'
          }`}>
            Start Date
          </label>
          <input
            type="date"
            value={startDate || ''}
            onChange={handleStartChange}
            min={earliestDate ? new Date(earliestDate).toISOString().split('T')[0] : undefined}
            max={endDate || new Date().toISOString().split('T')[0]}
            placeholder="All time"
            className={`
              w-full px-3 py-2 rounded-lg border font-light text-sm
              transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-2
              ${isDarkMode
                ? 'bg-gray-900 border-gray-700 text-white focus:ring-blue-500 focus:ring-offset-black hover:border-gray-600'
                : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:ring-offset-white hover:border-gray-400'
              }
            `}
          />
        </div>

        <div className="space-y-1">
          <label className={`text-xs font-light ${
            isDarkMode ? 'text-gray-500' : 'text-gray-500'
          }`}>
            End Date
          </label>
          <input
            type="date"
            value={endDate || ''}
            onChange={handleEndChange}
            min={startDate || (earliestDate ? new Date(earliestDate).toISOString().split('T')[0] : undefined)}
            max={new Date().toISOString().split('T')[0]}
            placeholder="Now"
            className={`
              w-full px-3 py-2 rounded-lg border font-light text-sm
              transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-2
              ${isDarkMode
                ? 'bg-gray-900 border-gray-700 text-white focus:ring-blue-500 focus:ring-offset-black hover:border-gray-600'
                : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:ring-offset-white hover:border-gray-400'
              }
            `}
          />
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
