// NetWorthDashboard.jsx - Main net worth dashboard view
import React, { useState } from 'react';
import { useTheme } from 'contexts/ThemeContext';
import { useNetworth } from 'hooks/useNetworth';
import { NetWorthChart } from './NetWorthChart';
import { AssetsSummary } from './AssetsSummary';
import { LiabilitiesSummary } from './LiabilitiesSummary';
import { UpdatePricesModal } from './UpdatePricesModal';
import { currency } from 'utils/currency';

export const NetWorthDashboard = () => {
  const { isDarkMode } = useTheme();
  const { summary, accounts, isLoading } = useNetworth();
  const [showUpdatePrices, setShowUpdatePrices] = useState(false);
  const [chartView, setChartView] = useState('currency');
  const [dateRange, setDateRange] = useState('6M');

  // Get available chart views based on holdings
  const getAvailableViews = () => {
    const views = [{ value: 'currency', label: 'Net Worth (Currency)' }];

    // Check if user has BTC or Gold holdings
    const hasBTC = accounts.some(acc =>
      acc.tracking_method === 'quantity_based' // Would check holdings for BTC
    );
    const hasGold = accounts.some(acc =>
      acc.tracking_method === 'quantity_based' // Would check holdings for Gold
    );

    if (hasBTC) {
      views.push(
        { value: 'btc', label: 'Net Worth (BTC)' },
        { value: 'btc_holdings', label: 'Bitcoin Holdings' }
      );
    }

    if (hasGold) {
      views.push(
        { value: 'gold', label: 'Net Worth (Gold oz)' },
        { value: 'gold_holdings', label: 'Gold Holdings' }
      );
    }

    return views;
  };

  const availableViews = getAvailableViews();

  if (isLoading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg font-light">Loading net worth data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-light mb-2">Net Worth</h1>
          <div className="flex items-baseline gap-4">
            <div className={`text-5xl font-medium ${
              summary.netWorth >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {currency.format(summary.netWorth)}
            </div>
            {summary.netWorth > 0 && (
              <div className="text-sm text-gray-500">
                {/* Would show change vs previous period */}
              </div>
            )}
          </div>
        </div>

        {/* Chart Section */}
        <div className={`mb-8 p-6 rounded-lg border ${
          isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}>
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">
              {/* Chart View Selector */}
              {availableViews.length > 1 && (
                <select
                  value={chartView}
                  onChange={(e) => setChartView(e.target.value)}
                  className={`px-3 py-1 rounded border text-sm ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-700 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  {availableViews.map(view => (
                    <option key={view.value} value={view.value}>
                      {view.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Date Range Selector */}
            <div className="flex gap-1">
              {['1M', '3M', '6M', '1Y', 'All'].map(range => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-3 py-1 text-sm rounded ${
                    dateRange === range
                      ? isDarkMode
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-500 text-white'
                      : isDarkMode
                        ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          <NetWorthChart chartView={chartView} dateRange={dateRange} />

          <div className="mt-4">
            <button
              onClick={() => setShowUpdatePrices(true)}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                isDarkMode
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              🔄 Update Prices
            </button>
          </div>
        </div>

        {/* Assets and Liabilities Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AssetsSummary accounts={accounts.filter(a => a.type === 'asset')} total={summary.assets} />
          <LiabilitiesSummary accounts={accounts.filter(a => a.type === 'liability')} total={summary.liabilities} />
        </div>

        {/* Actions */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={() => window.location.href = '/' + window.location.pathname.split('/')[1] + '/networth/import'}
            className={`px-6 py-3 rounded font-medium transition-colors ${
              isDarkMode
                ? 'border border-gray-700 text-gray-300 hover:border-gray-600 hover:bg-gray-900'
                : 'border border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            📥 Import Historical Data
          </button>

          <button
            onClick={() => window.location.href = '/' + window.location.pathname.split('/')[1] + '/networth/items'}
            className={`px-6 py-3 rounded font-medium transition-colors ${
              isDarkMode
                ? 'border border-gray-700 text-gray-300 hover:border-gray-600 hover:bg-gray-900'
                : 'border border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            📋 View & Edit Net Worth Items
          </button>
        </div>
      </div>

      {/* Update Prices Modal */}
      {showUpdatePrices && (
        <UpdatePricesModal
          accounts={accounts}
          onClose={() => setShowUpdatePrices(false)}
        />
      )}
    </div>
  );
};
