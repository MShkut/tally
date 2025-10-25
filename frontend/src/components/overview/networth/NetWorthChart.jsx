// frontend/src/components/overview/networth/NetWorthChart.jsx
import React from 'react';
import { useTheme } from 'contexts/ThemeContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Currency } from 'utils/currency';

/**
 * Reusable chart component for net worth visualizations
 * Supports three chart types: fiat-total, btc-equivalent, btc-holdings
 */
export const NetWorthChart = ({ data, chartType, title }) => {
  const { isDarkMode } = useTheme();

  if (!data || data.length === 0) {
    return (
      <div className={`p-12 rounded-lg border ${
        isDarkMode ? 'bg-gray-900/50 border-gray-800' : 'bg-gray-100/50 border-gray-200'
      }`}>
        <p className={`text-center ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          No data available for this chart
        </p>
      </div>
    );
  }

  // Chart configuration based on type
  const getChartConfig = () => {
    // Get user's currency settings
    const userCurrency = Currency.getUserCurrency();
    const currencySymbols = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥',
      'CAD': 'C$'
    };
    const currencySymbol = currencySymbols[userCurrency] || '$';

    switch (chartType) {
      case 'fiat-total':
        return {
          dataKey: 'value',
          yAxisFormatter: (value) => `${currencySymbol}${(value / 1000).toFixed(0)}k`,
          tooltipFormatter: (value) => Currency.formatWithUserCurrency(value),
          tooltipLabel: 'Net Worth',
          lineColor: isDarkMode ? '#60a5fa' : '#3b82f6' // blue-400 / blue-500
        };

      case 'btc-equivalent':
        return {
          dataKey: 'btcEquivalent',
          yAxisFormatter: (value) => `${value.toFixed(2)} BTC`,
          tooltipFormatter: (value) => `${value.toFixed(8)} BTC`,
          tooltipLabel: 'BTC Equivalent',
          lineColor: isDarkMode ? '#f59e0b' : '#d97706' // amber-500 / amber-600
        };

      case 'btc-holdings':
        return {
          dataKey: 'btcAmount',
          yAxisFormatter: (value) => `${value.toFixed(4)} BTC`,
          tooltipFormatter: (value) => `${value.toFixed(8)} BTC`,
          tooltipLabel: 'BTC Holdings',
          lineColor: isDarkMode ? '#f59e0b' : '#d97706' // amber-500 / amber-600
        };

      default:
        return {
          dataKey: 'value',
          yAxisFormatter: (value) => value.toFixed(2),
          tooltipFormatter: (value) => value.toFixed(2),
          tooltipLabel: 'Value',
          lineColor: isDarkMode ? '#60a5fa' : '#3b82f6'
        };
    }
  };

  const config = getChartConfig();

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;

    return (
      <div className={`p-3 rounded-lg shadow-lg border ${
        isDarkMode
          ? 'bg-gray-900 border-gray-700 text-white'
          : 'bg-white border-gray-200 text-gray-900'
      }`}>
        <p className="text-sm font-light mb-1">{data.date}</p>
        <p className="text-base font-medium">
          {config.tooltipLabel}: {config.tooltipFormatter(payload[0].value)}
        </p>
      </div>
    );
  };

  // Format x-axis dates
  const formatXAxis = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-4">
      {title && (
        <h3 className={`text-xl font-light ${isDarkMode ? 'text-white' : 'text-black'}`}>
          {title}
        </h3>
      )}

      <div className={`p-6 rounded-lg ${
        isDarkMode ? 'bg-gray-900/30' : 'bg-gray-50'
      }`}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDarkMode ? '#374151' : '#e5e7eb'}
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
              style={{ fontSize: '12px', fontWeight: '300' }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={config.yAxisFormatter}
              stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
              style={{ fontSize: '12px', fontWeight: '300' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey={config.dataKey}
              stroke={config.lineColor}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
