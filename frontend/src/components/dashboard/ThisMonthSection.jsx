// frontend/src/components/dashboard/ThisMonthSection.jsx
import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const ThisMonthSection = ({ data }) => {
  const { isDarkMode } = useTheme();
  const { thisMonth } = data;

  return (
    <section>
      <h2 className={`
        text-sm font-medium uppercase tracking-wider mb-6
        ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}
      `}>
        This Month
      </h2>
      <div className={`
        text-5xl font-extralight leading-none mb-2 font-mono
        ${isDarkMode ? 'text-white' : 'text-black'}
      `}>
        ${thisMonth.spent.toLocaleString()} / ${thisMonth.budget.toLocaleString()}
      </div>
      <div className={`
        text-base font-light
        ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}
      `}>
        {thisMonth.percentage}% used • {thisMonth.daysRemaining} days remaining
      </div>
    </section>
  );
};

export default ThisMonthSection;
