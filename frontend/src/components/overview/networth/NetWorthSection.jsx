// frontend/src/components/dashboard/NetWorthSection.jsx
import React from 'react';

import { useTheme } from 'contexts/ThemeContext';

export const NetWorthSection = ({ data }) => {
  const { isDarkMode } = useTheme();
  const { netWorth } = data;

  const trendIndicator = netWorth.trend === 'up' ? '↑' : '↓';
  const trendColor = netWorth.trend === 'up' 
    ? isDarkMode ? 'text-green-400' : 'text-green-600'
    : isDarkMode ? 'text-red-400' : 'text-red-600';

  return (
    <section>
      <h2 className={`
        text-sm font-medium uppercase tracking-wider mb-6
        ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}
      `}>
        Net Worth
      </h2>
      <div className={`
        text-4xl font-light leading-none mb-2 font-mono
        ${trendColor}
      `}>
        ${netWorth.value.toLocaleString()}
      </div>
      <div className={`
        text-base font-light
        ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}
      `}>
        {trendIndicator} ${netWorth.change.toLocaleString()} this period
      </div>
    </section>
  );
}
