// frontend/src/components/settings/APITab.jsx
import React, { useState, useEffect } from 'react';
import { useTheme } from 'contexts/ThemeContext';
import { dataManager } from 'utils/dataManager';

export const APITab = () => {
  const { isDarkMode } = useTheme();
  const [finnhubApiKey, setFinnhubApiKey] = useState('');
  const [alphaVantageApiKey, setAlphaVantageApiKey] = useState('');
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    // Load API keys from settings
    const settings = dataManager.loadSettings();
    if (settings) {
      setFinnhubApiKey(settings.finnhubApiKey || '');
      setAlphaVantageApiKey(settings.alphaVantageApiKey || '');
    }
  }, []);

  const handleFinnhubApiKeyChange = (e) => {
    setFinnhubApiKey(e.target.value);
  };

  const handleAlphaVantageApiKeyChange = (e) => {
    setAlphaVantageApiKey(e.target.value);
  };

  const handleFinnhubApiKeySave = async () => {
    const settings = dataManager.loadSettings();
    await dataManager.saveSettings({
      ...settings,
      finnhubApiKey: finnhubApiKey.trim()
    });

    setSaveStatus('✓ Finnhub API key saved!');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  const handleAlphaVantageApiKeySave = async () => {
    const settings = dataManager.loadSettings();
    await dataManager.saveSettings({
      ...settings,
      alphaVantageApiKey: alphaVantageApiKey.trim()
    });

    setSaveStatus('✓ Alpha Vantage API key saved!');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  return (
    <div className="space-y-12 max-w-2xl">
      {/* Finnhub API Key */}
      <div className="space-y-4">
        <div>
          <h3 className={`text-lg font-light mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
            Finnhub API Key
          </h3>
          <p className={`text-sm font-light ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            For US stocks and cryptocurrency. Free tier: 60 calls/minute. Get a free API key at{' '}
            <a
              href="https://finnhub.io/register"
              target="_blank"
              rel="noopener noreferrer"
              className={`underline ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
            >
              finnhub.io
            </a>
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-light mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              API Key
            </label>
            <input
              type="text"
              value={finnhubApiKey}
              onChange={handleFinnhubApiKeyChange}
              placeholder="Enter your Finnhub API key"
              className={`w-full px-4 py-2 rounded-lg font-light font-mono transition-colors ${
                isDarkMode
                  ? 'bg-gray-900 border border-gray-800 text-white placeholder-gray-600 focus:border-gray-700'
                  : 'bg-white border border-gray-300 text-black placeholder-gray-400 focus:border-gray-400'
              } focus:outline-none`}
            />
          </div>

          <button
            onClick={handleFinnhubApiKeySave}
            className={`px-6 py-2 rounded-lg font-light transition-all ${
              isDarkMode
                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            Save API Key
          </button>
        </div>
      </div>

      {/* Alpha Vantage API Key */}
      <div className="space-y-4">
        <div>
          <h3 className={`text-lg font-light mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
            Alpha Vantage API Key
          </h3>
          <p className={`text-sm font-light ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            For international stocks (Canadian TSX, UK, etc.). Free tier: 25 calls/day. Get a free API key at{' '}
            <a
              href="https://www.alphavantage.co/support/#api-key"
              target="_blank"
              rel="noopener noreferrer"
              className={`underline ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
            >
              alphavantage.co
            </a>
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-light mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              API Key
            </label>
            <input
              type="text"
              value={alphaVantageApiKey}
              onChange={handleAlphaVantageApiKeyChange}
              placeholder="Enter your Alpha Vantage API key"
              className={`w-full px-4 py-2 rounded-lg font-light font-mono transition-colors ${
                isDarkMode
                  ? 'bg-gray-900 border border-gray-800 text-white placeholder-gray-600 focus:border-gray-700'
                  : 'bg-white border border-gray-300 text-black placeholder-gray-400 focus:border-gray-400'
              } focus:outline-none`}
            />
          </div>

          <button
            onClick={handleAlphaVantageApiKeySave}
            className={`px-6 py-2 rounded-lg font-light transition-all ${
              isDarkMode
                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            Save API Key
          </button>
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
