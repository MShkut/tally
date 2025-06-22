// frontend/src/components/dashboard/DashboardViewSelector.jsx
import React from 'react';

import { useTheme } from 'contexts/ThemeContext';
import { StandardSelect } from 'components/shared/FormComponents';

export const DashboardViewSelector = ({ 
  viewMode, 
  setViewMode, 
  selectedMonth, 
  setSelectedMonth,
  availableMonths 
}) => {
  const { isDarkMode } = useTheme();

  // Create options for the month selector
  const monthOptions = availableMonths.map(month => ({
    value: month.value,
    label: month.label
  }));

  const handleMonthChange = (value) => {
    setSelectedMonth(value);
    setViewMode('month');
  };

  // Get current month label for display
  const getCurrentMonthLabel = () => {
    if (selectedMonth) {
      const month = availableMonths.find(m => m.value === selectedMonth);
      return month ? month.label : 'Selected Month';
    } else {
      // Default to current month
      const now = new Date();
      return now.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
    }
  };

  return (
    <div className="flex items-center justify-center mb-16">
      <div className="flex items-center gap-0">
        
        {/* Month Selection using StandardSelect */}
        <div className="relative min-w-48">
          <StandardSelect
            value={selectedMonth || availableMonths[0]?.value || ''}
            onChange={handleMonthChange}
            options={monthOptions}
            className="[&_button]:border-b-2 [&_button]:border-t-0 [&_button]:border-l-0 [&_button]:border-r-0 [&_button]:rounded-none [&_button]:text-sm [&_button]:px-4 [&_button]:py-2"
          />
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
    // Fallback to current month if no period data
    const now = new Date();
    return [{
      value: `${now.getFullYear()}-${now.getMonth()}`,
      label: now.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      }),
      date: now,
      hasTransactions: transactions.length > 0
    }];
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
