// frontend/src/components/settings/PreferencesTab.jsx
import React, { useState, useEffect } from 'react';
import { useTheme } from 'contexts/ThemeContext';
import { dataManager } from 'utils/dataManager';

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' }
];

export const PreferencesTab = () => {
  const { isDarkMode } = useTheme();
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [householdName, setHouseholdName] = useState('');
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    // Load settings
    const settings = dataManager.loadSettings();
    if (settings) {
      setSelectedCurrency(settings.currency || 'USD');
    }

    // Load household name
    const userData = dataManager.loadUserData();
    if (userData?.householdName) {
      setHouseholdName(userData.householdName);
    }
  }, []);

  const handleCurrencyChange = async (e) => {
    const newCurrency = e.target.value;
    setSelectedCurrency(newCurrency);

    // Save to dataManager
    const settings = dataManager.loadSettings();
    await dataManager.saveSettings({
      ...settings,
      currency: newCurrency
    });

    setSaveStatus('Currency saved!');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  const handleHouseholdNameSave = async () => {
    if (!householdName.trim()) {
      setSaveStatus('Household name cannot be empty');
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }

    try {
      const userData = dataManager.loadUserData();
      await dataManager.saveUserData({
        ...userData,
        householdName: householdName.trim()
      });

      setSaveStatus('✓ Household name updated');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Failed to update household name:', error);
      setSaveStatus('Failed to update household name');
      setTimeout(() => setSaveStatus(''), 5000);
    }
  };

  return (
    <div className="space-y-12 max-w-2xl">
      {/* Household Name */}
      <div className="space-y-4">
        <div>
          <h3 className={`text-lg font-light mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
            Household Name
          </h3>
          <p className={`text-sm font-light ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Your household name appears in the dashboard header and URLs
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-light mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Household Name
            </label>
            <input
              type="text"
              value={householdName}
              onChange={(e) => setHouseholdName(e.target.value)}
              placeholder="Enter household name"
              className={`w-full px-4 py-2 rounded-lg font-light transition-colors ${
                isDarkMode
                  ? 'bg-gray-900 border border-gray-800 text-white placeholder-gray-600 focus:border-gray-700'
                  : 'bg-white border border-gray-300 text-black placeholder-gray-400 focus:border-gray-400'
              } focus:outline-none`}
            />
          </div>

          <button
            onClick={handleHouseholdNameSave}
            className={`px-6 py-2 rounded-lg font-light transition-all ${
              isDarkMode
                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            Save Household Name
          </button>
        </div>
      </div>

      {/* Currency Selection */}
      <div className="space-y-4">
        <div>
          <h3 className={`text-lg font-light mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
            Currency
          </h3>
          <p className={`text-sm font-light ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Select your preferred currency for displaying values
          </p>
        </div>

        <div className="space-y-2">
          <label className={`block text-sm font-light ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Preferred Currency
          </label>
          <select
            value={selectedCurrency}
            onChange={handleCurrencyChange}
            className={`w-full px-4 py-2 rounded-lg font-light transition-colors ${
              isDarkMode
                ? 'bg-gray-900 border border-gray-800 text-white focus:border-gray-700'
                : 'bg-white border border-gray-300 text-black focus:border-gray-400'
            } focus:outline-none`}
          >
            {CURRENCIES.map(currency => (
              <option key={currency.code} value={currency.code}>
                {currency.code} - {currency.name} ({currency.symbol})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Status Message */}
      {saveStatus && (
        <div className={`p-4 rounded-lg border-l-4 ${
          saveStatus.startsWith('✓')
            ? isDarkMode
              ? 'bg-green-900/20 border-green-600 text-green-400'
              : 'bg-green-100 border-green-500 text-green-700'
            : isDarkMode
            ? 'bg-red-900/20 border-red-600 text-red-400'
            : 'bg-red-100 border-red-500 text-red-700'
        }`}>
          <p className="text-sm font-light">{saveStatus}</p>
        </div>
      )}
    </div>
  );
};
