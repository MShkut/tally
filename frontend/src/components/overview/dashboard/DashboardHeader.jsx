import React from 'react';

import { useTheme } from 'contexts/ThemeContext';

export const DashboardHeader = ({ onboardingData, onMenuToggle }) => {
  const { isDarkMode, toggleTheme } = useTheme();

  // Extract period information from localStorage data
  const householdName = onboardingData?.household?.name || 'Your Budget';
  const periodInfo = formatPeriodInfo(onboardingData);

  return (
    <header className={`
      border-b py-8 mb-20 relative
      ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}
    `}>
      {/* Left Controls */}
      <div className="absolute top-8 left-0 flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className={`
            p-2 transition-colors duration-200
            ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}
          `}
          aria-label="Open menu"
        >
          <BurgerIcon />
        </button>
      </div>

      {/* Right Controls */}
      <div className="absolute top-8 right-0">
        <button
          onClick={toggleTheme}
          className={`
            text-lg transition-colors duration-200 p-1
            ${isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}
          `}
          aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
        >
          {isDarkMode ? '◐' : '◑'}
        </button>
      </div>

      {/* Title Content */}
      <div className="ml-16">
        <h1 className={`
          text-2xl font-medium mb-2
          ${isDarkMode ? 'text-white' : 'text-black'}
        `}>
          {householdName}
        </h1>
        <p className={`
          text-base font-light
          ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}
        `}>
          {periodInfo}
        </p>
      </div>
    </header>
  );
};

const BurgerIcon = () => (
  <div className="w-5 h-5 flex flex-col justify-between">
    <div className="w-full h-0.5 bg-current transition-all duration-300" />
    <div className="w-full h-0.5 bg-current transition-all duration-300" />
    <div className="w-full h-0.5 bg-current transition-all duration-300" />
  </div>
);

function formatPeriodInfo(onboardingData) {
  if (!onboardingData?.period) {
    return 'March 2024 to August 2024 • Month 3 of 6';
  }

  // Extract period information from localStorage data
  const startDate = new Date(onboardingData.period.start_date);
  const durationMonths = onboardingData.period.duration_months;
  
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + durationMonths - 1);

  // Calculate current month in period
  const now = new Date();
  const monthsElapsed = Math.max(1, Math.floor((now - startDate) / (1000 * 60 * 60 * 24 * 30)) + 1);
  const currentMonth = Math.min(monthsElapsed, durationMonths);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  return `${formatDate(startDate)} to ${formatDate(endDate)} • Month ${currentMonth} of ${durationMonths}`;
}
