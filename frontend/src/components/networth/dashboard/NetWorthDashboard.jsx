// NetWorthDashboard.jsx - Main net worth dashboard view
import React, { useState, useEffect } from 'react';
import { ThemeToggle } from 'components/shared/ThemeToggle';
import { useTheme } from 'contexts/ThemeContext';
import { useNetworth } from 'hooks/useNetworth';
import { BurgerMenu } from 'components/shared/BurgerMenu';
import { FormSection } from 'components/shared/FormComponents';
import { handleMenuAction } from 'utils/navigationHandler';
import { NetWorthChart } from './NetWorthChart';
import { AssetsSummary } from './AssetsSummary';
import { LiabilitiesSummary } from './LiabilitiesSummary';
import { UpdatePricesModal } from './UpdatePricesModal';
import { currency } from 'utils/currency';

export const NetWorthDashboard = ({ onNavigate, onLogout }) => {
  const { isDarkMode } = useTheme();
  const { summary, accounts, isLoading } = useNetworth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showUpdatePrices, setShowUpdatePrices] = useState(false);
  const [chartView, setChartView] = useState('currency');
  const [dateRange, setDateRange] = useState('6M');

  // Handle menu state changes to prevent layout shift
  useEffect(() => {
    if (menuOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.paddingRight = '';
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.paddingRight = '';
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const handleMenuActionWrapper = (actionId) => {
    handleMenuAction(actionId, onNavigate, () => setMenuOpen(false));
  };

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
    <>
      <BurgerMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onAction={handleMenuActionWrapper}
        currentPage="networth"
        onLogout={onLogout}
      />

      <div className={`min-h-screen transition-colors duration-300 ${
        isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'
      }`}>

        {/* Fixed Controls */}
        <button
          onClick={() => setMenuOpen(true)}
          className={`
            fixed top-8 left-8 z-40 p-2 transition-colors duration-200
            ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}
          `}
          aria-label="Open menu"
        >
          <BurgerIcon />
        </button>

        <ThemeToggle />

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-6 py-12">

          {/* Header Section */}
          <div className="mb-16 ml-16">
            <h1 className={`text-6xl font-light leading-tight mb-4 ${
              isDarkMode ? 'text-white' : 'text-black'
            }`}>
              Net Worth
            </h1>
            <div className="flex items-baseline gap-4">
              <div className={`text-4xl font-light ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {currency.format(summary.netWorth)}
              </div>
            </div>
          </div>

          {/* Chart Controls */}
          <div className="mb-8 flex justify-between items-center">
            <div className="flex gap-2">
              {/* Chart View Selector */}
              {availableViews.length > 1 && (
                <select
                  value={chartView}
                  onChange={(e) => setChartView(e.target.value)}
                  className={`px-4 py-2 rounded border font-light ${
                    isDarkMode
                      ? 'bg-black border-gray-800 text-white hover:border-gray-700'
                      : 'bg-white border-gray-200 text-gray-900 hover:border-gray-300'
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
            <div className="flex gap-2">
              {['1M', '3M', '6M', '1Y', 'All'].map(range => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-4 py-2 rounded font-light transition-colors ${
                    dateRange === range
                      ? isDarkMode
                        ? 'bg-white text-black'
                        : 'bg-black text-white'
                      : isDarkMode
                        ? 'text-gray-400 hover:text-white border border-gray-800 hover:border-gray-700'
                        : 'text-gray-600 hover:text-black border border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* Chart Section */}
          <div className="mb-16">
            <NetWorthChart chartView={chartView} dateRange={dateRange} />
          </div>

          {/* Update Prices Button */}
          <div className="mb-8">
            <button
              onClick={() => setShowUpdatePrices(true)}
              className={`px-6 py-3 rounded font-light transition-colors ${
                isDarkMode
                  ? 'bg-white text-black hover:bg-gray-100'
                  : 'bg-black text-white hover:bg-gray-900'
              }`}
            >
              Update Prices
            </button>
          </div>

          {/* Single divider border */}
          <div className={`my-8 border-t ${
            isDarkMode ? 'border-gray-800' : 'border-gray-200'
          }`} />

          {/* Two Column Layout - Assets and Liabilities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Left Column - Assets */}
            <div className="space-y-16">
              <FormSection title="Assets">
                <AssetsSummary
                  accounts={accounts.filter(a => a.type === 'asset')}
                  total={summary.assets}
                />
              </FormSection>
            </div>

            {/* Right Column - Liabilities */}
            <div className="space-y-16">
              <FormSection title="Liabilities">
                <LiabilitiesSummary
                  accounts={accounts.filter(a => a.type === 'liability')}
                  total={summary.liabilities}
                />
              </FormSection>
            </div>
          </div>

          <div className="h-24"></div>
        </div>
      </div>

      {/* Update Prices Modal */}
      {showUpdatePrices && (
        <UpdatePricesModal
          accounts={accounts}
          onClose={() => setShowUpdatePrices(false)}
        />
      )}
    </>
  );
};

// Helper components
const BurgerIcon = () => (
  <div className="w-5 h-5 flex flex-col justify-between">
    <div className="w-full h-0.5 bg-current transition-all duration-300" />
    <div className="w-full h-0.5 bg-current transition-all duration-300" />
    <div className="w-full h-0.5 bg-current transition-all duration-300" />
  </div>
);
