// frontend/src/components/dashboard/DashboardViewSelector.jsx
import React from 'react';

import { useTheme } from 'contexts/ThemeContext';

export const DashboardViewSelector = ({ 
  viewMode, 
  setViewMode, 
  selectedMonth, 
  setSelectedMonth,
  availableMonths 
}) => {
  const { isDarkMode } = useTheme();

  return (
    <div className="flex items-center justify-center mb-16">
      <div className="flex items-center gap-0 border-b border-gray-300 dark:border-gray-700">
        
        {/* Month Selection */}
        <div className="relative">
          <select
            value={selectedMonth || 'current'}
            onChange={(e) => {
              const value = e.target.value;
              if (value === 'current') {
                setSelectedMonth(null);
                setViewMode('month');
              } else {
                setSelectedMonth(value);
                setViewMode('month');
              }
            }}
            className={`px-4 py-2 text-sm bg-transparent border-0 focus:outline-none transition-all duration-200 border-b-2 appearance-none cursor-pointer ${
              viewMode === 'month'
                ? isDarkMode 
                  ? 'text-white border-white' 
                  : 'text-black border-black'
                : isDarkMode 
                  ? 'text-gray-500 border-transparent hover:text-gray-300' 
                  : 'text-gray-400 border-transparent hover:text-gray-600'
            }`}
          >
            <option value="current">This Month</option>
            {availableMonths.map(month => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
          <div className={`absolute right-1 top-1/2 transform -translate-y-1/2 pointer-events-none text-xs ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            ▼
          </div>
        </div>

        {/* Period Total Button */}
        <button
          onClick={() => setViewMode('period')}
          className={`px-4 py-2 text-sm transition-all duration-200 border-b-2 ${
            viewMode === 'period'
              ? isDarkMode 
                ? 'text-white border-white' 
                : 'text-black border-black'
              : isDarkMode 
                ? 'text-gray-500 border-transparent hover:text-gray-300' 
                : 'text-gray-400 border-transparent hover:text-gray-600'
          }`}
        >
          Period Total
        </button>
      </div>
    </div>
  );
};

// Helper function to generate available months for the current budget period
export const generateAvailableMonths = (onboardingData, transactions) => {
  const months = [];
  
  if (!onboardingData?.period?.start_date) {
    return months;
  }

  const periodStart = new Date(onboardingData.period.start_date);
  const periodDuration = onboardingData.period.duration_months || 6;
  const now = new Date();
  
  // Generate months from period start to now (or period end, whichever is earlier)
  for (let i = 0; i < periodDuration; i++) {
    const monthDate = new Date(periodStart);
    monthDate.setMonth(periodStart.getMonth() + i);
    
    // Stop if we've reached future months
    if (monthDate > now) break;
    
    // Check if this month has any transactions
    const hasTransactions = transactions.some(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === monthDate.getMonth() && 
             transactionDate.getFullYear() === monthDate.getFullYear();
    });

    months.push({
      value: `${monthDate.getFullYear()}-${monthDate.getMonth()}`,
      label: monthDate.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      }),
      date: monthDate,
      hasTransactions
    });
  }

  return months.reverse(); // Most recent first
};
