// frontend/src/components/overview/networth/NetWorthDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTheme } from 'contexts/ThemeContext';
import { ThemeToggle } from 'components/shared/ThemeToggle';
import { BurgerMenu } from 'components/shared/BurgerMenu';
import { dataManager } from 'utils/dataManager';
import { Currency } from 'utils/currency';
import { handleMenuAction } from 'utils/navigationHandler';
import { calculateNetWorth, backfillAllPrices } from 'utils/netWorthCalculations';
import { alphaVantage } from 'utils/alphaVantageService';
import { OverviewTab } from './OverviewTab';
import { ManageTab } from './ManageTab';
import { ImportTab } from './ImportTab';

const TABS = {
  OVERVIEW: 'overview',
  MANAGE: 'manage',
  IMPORT: 'import'
};

export const NetWorthDashboard = ({ onNavigate, onLogout }) => {
  const { isDarkMode } = useTheme();
  const { household } = useParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(TABS.OVERVIEW);
  const [netWorthItems, setNetWorthItems] = useState([]);
  const previousTab = React.useRef(activeTab);

  // Load net worth data
  useEffect(() => {
    const loadData = () => {
      const items = dataManager.loadNetWorthItems();
      setNetWorthItems(items);
    };

    loadData();
  }, [activeTab]); // Reload when tab changes to pick up any changes

  // Auto-backfill prices when leaving Import tab
  useEffect(() => {
    // Check if we're leaving the Import tab
    if (previousTab.current === TABS.IMPORT && activeTab !== TABS.IMPORT) {
      const hasApiKey = alphaVantage.hasApiKey();

      if (hasApiKey && netWorthItems.length > 0) {
        // Trigger backfill in background (don't await, let it run)
        backfillAllPrices(netWorthItems).then(results => {
          if (import.meta.env.DEV) {
            console.log('[AUTO_BACKFILL] Backfill completed:', results);
          }
        }).catch(error => {
          if (import.meta.env.DEV) {
            console.error('[AUTO_BACKFILL] Backfill failed:', error);
          }
        });
      }
    }

    previousTab.current = activeTab;
  }, [activeTab, netWorthItems]);

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

  const handleMenu = (actionId) => {
    setMenuOpen(false);
    handleMenuAction(actionId, onNavigate, () => {}, null);
  };

  const totalNetWorth = calculateNetWorth(netWorthItems);

  return (
    <>
      <BurgerMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onAction={handleMenu}
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
          <div className="mb-12 ml-16">
            <div className="flex items-baseline gap-4">
              <h1 className={`text-6xl font-light leading-tight ${
                isDarkMode ? 'text-white' : 'text-black'
              }`}>
                Net Worth
              </h1>
              {netWorthItems.length > 0 && (
                <>
                  <span className={`text-4xl font-light ${
                    isDarkMode ? 'text-white' : 'text-black'
                  }`}>
                    —
                  </span>
                  <span className={`text-4xl font-light ${
                    isDarkMode ? 'text-white' : 'text-black'
                  }`}>
                    {Currency.formatWithUserCurrency(totalNetWorth)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className={`border-b mb-12 ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="flex gap-8">
              <button
                onClick={() => setActiveTab(TABS.OVERVIEW)}
                className={`py-4 px-2 text-lg font-light transition-colors duration-200 relative ${
                  activeTab === TABS.OVERVIEW
                    ? isDarkMode
                      ? 'text-white'
                      : 'text-black'
                    : isDarkMode
                    ? 'text-gray-500 hover:text-gray-300'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Overview
                {activeTab === TABS.OVERVIEW && (
                  <div
                    className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                      isDarkMode ? 'bg-white' : 'bg-black'
                    }`}
                  />
                )}
              </button>

              <button
                onClick={() => setActiveTab(TABS.MANAGE)}
                className={`py-4 px-2 text-lg font-light transition-colors duration-200 relative ${
                  activeTab === TABS.MANAGE
                    ? isDarkMode
                      ? 'text-white'
                      : 'text-black'
                    : isDarkMode
                    ? 'text-gray-500 hover:text-gray-300'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Manage
                {activeTab === TABS.MANAGE && (
                  <div
                    className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                      isDarkMode ? 'bg-white' : 'bg-black'
                    }`}
                  />
                )}
              </button>

              <button
                onClick={() => setActiveTab(TABS.IMPORT)}
                className={`py-4 px-2 text-lg font-light transition-colors duration-200 relative ${
                  activeTab === TABS.IMPORT
                    ? isDarkMode
                      ? 'text-white'
                      : 'text-black'
                    : isDarkMode
                    ? 'text-gray-500 hover:text-gray-300'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Import
                {activeTab === TABS.IMPORT && (
                  <div
                    className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                      isDarkMode ? 'bg-white' : 'bg-black'
                    }`}
                  />
                )}
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="mt-12">
            <div className="transition-opacity duration-200">
              {activeTab === TABS.OVERVIEW && <OverviewTab />}
              {activeTab === TABS.MANAGE && <ManageTab />}
              {activeTab === TABS.IMPORT && <ImportTab />}
            </div>
          </div>

          <div className="h-24"></div>
        </div>
      </div>
    </>
  );
};

// Helper component
const BurgerIcon = () => (
  <div className="w-5 h-5 flex flex-col justify-between">
    <div className="w-full h-0.5 bg-current transition-all duration-300" />
    <div className="w-full h-0.5 bg-current transition-all duration-300" />
    <div className="w-full h-0.5 bg-current transition-all duration-300" />
  </div>
);
