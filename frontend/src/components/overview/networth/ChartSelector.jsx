// frontend/src/components/overview/networth/ChartSelector.jsx
import React from 'react';
import { useTheme } from 'contexts/ThemeContext';
import { getUserCurrency } from 'utils/currency';

const getChartOptions = () => {
  const userCurrency = getUserCurrency();
  return [
    { value: 'fiat-total', label: `Total Net Worth (${userCurrency})` },
    { value: 'btc-equivalent', label: 'Portfolio Value (BTC Equivalent)' },
    { value: 'btc-holdings', label: 'Bitcoin Holdings' }
  ];
};

/**
 * Dropdown selector for choosing chart type
 */
export const ChartSelector = ({ value, onChange, position = 'left' }) => {
  const { isDarkMode } = useTheme();
  const chartOptions = getChartOptions();

  return (
    <div className="space-y-2">
      <label className={`block text-sm font-light ${
        isDarkMode ? 'text-gray-400' : 'text-gray-600'
      }`}>
        {position === 'left' ? 'Left Chart' : 'Right Chart'}
      </label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`
          w-full px-4 py-2 rounded-lg border font-light
          transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-offset-2
          ${isDarkMode
            ? 'bg-gray-900 border-gray-700 text-white focus:ring-blue-500 focus:ring-offset-black hover:border-gray-600'
            : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:ring-offset-white hover:border-gray-400'
          }
        `}
      >
        {chartOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};
