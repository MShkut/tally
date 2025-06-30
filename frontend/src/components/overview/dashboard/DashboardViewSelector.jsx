// frontend/src/components/dashboard/DashboardViewSelector.jsx
import React, { useEffect, useRef } from 'react';

import { useTheme } from 'contexts/ThemeContext';

export const DashboardViewSelector = ({ 
  viewMode, 
  setViewMode, 
  selectedMonth, 
  setSelectedMonth,
  availableMonths 
}) => {
  const { isDarkMode } = useTheme();
  const tabsRef = useRef(null);

  const handleMonthChange = (value) => {
    setSelectedMonth(value);
    setViewMode('month');
  };

  const handlePeriodTotal = () => {
    setViewMode('period');
    setSelectedMonth(null);
  };

  // Determine which tab is currently active
  const getActiveTab = () => {
    if (viewMode === 'period') return 'period';
    return selectedMonth || availableMonths[0]?.value || '';
  };

  // Handle keyboard navigation
  const handleKeyDown = (event, tabValue, tabType) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (tabType === 'period') {
        handlePeriodTotal();
      } else {
        handleMonthChange(tabValue);
      }
    }
    
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      const tabs = tabsRef.current?.querySelectorAll('[role="tab"]');
      if (!tabs) return;
      
      const currentIndex = Array.from(tabs).findIndex(tab => tab === event.target);
      let nextIndex;
      
      if (event.key === 'ArrowLeft') {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
      } else {
        nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
      }
      
      tabs[nextIndex]?.focus();
    }
  };

  // Auto-focus on mount if no selection
  useEffect(() => {
    if (!selectedMonth && viewMode !== 'period' && availableMonths.length > 0) {
      setSelectedMonth(availableMonths[0].value);
    }
  }, [availableMonths, selectedMonth, viewMode, setSelectedMonth]);

  const activeTab = getActiveTab();

  return (
    <div className="flex items-center justify-center mb-8">
      <div 
        ref={tabsRef}
        className="flex items-center gap-0" 
        role="tablist"
        aria-label="Select time period"
      >
        
        {/* Month Tabs */}
        {availableMonths.map((month, index) => {
          const isActive = activeTab === month.value;
          
          return (
            <button
              key={month.value}
              role="tab"
              tabIndex={isActive ? 0 : -1}
              aria-selected={isActive}
              aria-controls={`tabpanel-${month.value}`}
              onClick={() => handleMonthChange(month.value)}
              onKeyDown={(e) => handleKeyDown(e, month.value, 'month')}
              style={{ outline: 'none', boxShadow: 'none' }}
              className={`px-4 py-2 text-base transition-all duration-200 border-b-2 ${
                isActive
                  ? isDarkMode 
                    ? 'text-white border-white' 
                    : 'text-black border-black'
                  : isDarkMode 
                    ? 'text-gray-500 border-transparent hover:text-gray-300 hover:border-gray-600' 
                    : 'text-gray-400 border-transparent hover:text-gray-600 hover:border-gray-300'
              }`}
            >
              {month.label}
            </button>
          );
        })}

        {/* Period Total Tab */}
        <button
          role="tab"
          tabIndex={viewMode === 'period' ? 0 : -1}
          aria-selected={viewMode === 'period'}
          aria-controls="tabpanel-period"
          onClick={handlePeriodTotal}
          onKeyDown={(e) => handleKeyDown(e, null, 'period')}
          style={{ outline: 'none', boxShadow: 'none' }}
          className={`px-4 py-2 text-base transition-all duration-200 border-b-2 ${
            viewMode === 'period'
              ? isDarkMode 
                ? 'text-white border-white' 
                : 'text-black border-black'
              : isDarkMode 
                ? 'text-gray-500 border-transparent hover:text-gray-300 hover:border-gray-600' 
                : 'text-gray-400 border-transparent hover:text-gray-600 hover:border-gray-300'
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
