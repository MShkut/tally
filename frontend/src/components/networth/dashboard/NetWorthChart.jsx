// NetWorthChart.jsx - Chart visualization for net worth over time
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from 'contexts/ThemeContext';
import { generateNetworthChartData, getDefaultDateRange } from 'utils/networthChartUtils';
import { Currency } from 'utils/currency';

export const NetWorthChart = ({ chartView, dateRange }) => {
  const { isDarkMode } = useTheme();
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadChartData();
  }, [chartView, dateRange]);

  const loadChartData = async () => {
    setIsLoading(true);
    try {
      // Calculate date range
      const { startDate, endDate } = calculateDateRange(dateRange);

      // Generate chart data
      const data = await generateNetworthChartData(startDate, endDate, chartView);
      setChartData(data);
    } catch (error) {
      console.error('Error loading chart data:', error);
      setChartData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDateRange = (range) => {
    const end = new Date();
    const start = new Date();

    switch (range) {
      case '1M':
        start.setMonth(start.getMonth() - 1);
        break;
      case '3M':
        start.setMonth(start.getMonth() - 3);
        break;
      case '6M':
        start.setMonth(start.getMonth() - 6);
        break;
      case '1Y':
        start.setFullYear(start.getFullYear() - 1);
        break;
      case 'All':
        // Go back 5 years for "All"
        start.setFullYear(start.getFullYear() - 5);
        break;
      default:
        start.setMonth(start.getMonth() - 6);
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  };

  const formatYAxis = (value) => {
    if (chartView === 'btc' || chartView === 'btc_holdings') {
      return `${value.toFixed(4)} BTC`;
    } else if (chartView === 'gold' || chartView === 'gold_holdings') {
      return `${value.toFixed(2)} oz`;
    } else {
      return Currency.format(value * 100); // Convert back to cents
    }
  };

  const formatTooltip = (value) => {
    if (chartView === 'btc' || chartView === 'btc_holdings') {
      return `${value.toFixed(8)} BTC`;
    } else if (chartView === 'gold' || chartView === 'gold_holdings') {
      return `${value.toFixed(4)} oz`;
    } else {
      return Currency.format(value * 100);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-sm text-gray-500">Loading chart...</div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <p className="text-lg mb-2">No data available</p>
          <p className="text-sm">Add accounts and update balances to see your net worth chart</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={isDarkMode ? '#374151' : '#E5E7EB'}
          />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            stroke={isDarkMode ? '#9CA3AF' : '#6B7280'}
            style={{ fontSize: '12px' }}
          />
          <YAxis
            tickFormatter={formatYAxis}
            stroke={isDarkMode ? '#9CA3AF' : '#6B7280'}
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            formatter={formatTooltip}
            labelFormatter={formatDate}
            contentStyle={{
              backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
              border: `1px solid ${isDarkMode ? '#374151' : '#E5E7EB'}`,
              borderRadius: '6px',
              color: isDarkMode ? '#F3F4F6' : '#111827'
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={isDarkMode ? '#3B82F6' : '#2563EB'}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
