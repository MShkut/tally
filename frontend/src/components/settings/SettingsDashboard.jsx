// frontend/src/components/settings/SettingsDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTheme } from 'contexts/ThemeContext';
import { ThemeToggle } from 'components/shared/ThemeToggle';
import { BurgerMenu } from 'components/shared/BurgerMenu';
import { handleMenuAction } from 'utils/navigationHandler';
import { PreferencesTab } from './PreferencesTab';
import { APITab } from './APITab';
import { DataManagementTab } from './DataManagementTab';
import { AccountTab } from './AccountTab';

const TABS = {
  PREFERENCES: 'preferences',
  API: 'api',
  DATA: 'data',
  ACCOUNT: 'account'
};

export const SettingsDashboard = ({ onNavigate, onLogout }) => {
  const { isDarkMode } = useTheme();
  const { household } = useParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(TABS.PREFERENCES);

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
    handleMenuAction(actionId, onNavigate, onLogout, household);
  };

  return (
    <>
      <BurgerMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onAction={handleMenu}
        currentPage="settings"
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
            ${isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-700'}
          `}
          aria-label="Open menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>

        <div className="fixed top-8 right-8 z-40">
          <ThemeToggle />
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-8 py-16">
          {/* Header */}
          <div className="mb-12">
            <h1 className={`text-4xl font-light mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
              Settings
            </h1>
          </div>

          {/* Tab Navigation */}
          <div className={`flex gap-8 mb-12 border-b ${
            isDarkMode ? 'border-gray-800' : 'border-gray-200'
          }`}>
            <button
              onClick={() => setActiveTab(TABS.PREFERENCES)}
              className={`pb-4 px-2 font-light transition-colors duration-200 relative ${
                activeTab === TABS.PREFERENCES
                  ? isDarkMode
                    ? 'text-white'
                    : 'text-black'
                  : isDarkMode
                    ? 'text-gray-500 hover:text-gray-300'
                    : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Preferences
              {activeTab === TABS.PREFERENCES && (
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                  isDarkMode ? 'bg-white' : 'bg-black'
                }`} />
              )}
            </button>

            <button
              onClick={() => setActiveTab(TABS.API)}
              className={`pb-4 px-2 font-light transition-colors duration-200 relative ${
                activeTab === TABS.API
                  ? isDarkMode
                    ? 'text-white'
                    : 'text-black'
                  : isDarkMode
                    ? 'text-gray-500 hover:text-gray-300'
                    : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              API Keys
              {activeTab === TABS.API && (
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                  isDarkMode ? 'bg-white' : 'bg-black'
                }`} />
              )}
            </button>

            <button
              onClick={() => setActiveTab(TABS.DATA)}
              className={`pb-4 px-2 font-light transition-colors duration-200 relative ${
                activeTab === TABS.DATA
                  ? isDarkMode
                    ? 'text-white'
                    : 'text-black'
                  : isDarkMode
                    ? 'text-gray-500 hover:text-gray-300'
                    : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Data Management
              {activeTab === TABS.DATA && (
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                  isDarkMode ? 'bg-white' : 'bg-black'
                }`} />
              )}
            </button>

            <button
              onClick={() => setActiveTab(TABS.ACCOUNT)}
              className={`pb-4 px-2 font-light transition-colors duration-200 relative ${
                activeTab === TABS.ACCOUNT
                  ? isDarkMode
                    ? 'text-white'
                    : 'text-black'
                  : isDarkMode
                    ? 'text-gray-500 hover:text-gray-300'
                    : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Account
              {activeTab === TABS.ACCOUNT && (
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                  isDarkMode ? 'bg-white' : 'bg-black'
                }`} />
              )}
            </button>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === TABS.PREFERENCES && <PreferencesTab />}
            {activeTab === TABS.API && <APITab />}
            {activeTab === TABS.DATA && <DataManagementTab onNavigate={onNavigate} />}
            {activeTab === TABS.ACCOUNT && <AccountTab />}
          </div>
        </div>
      </div>
    </>
  );
};
