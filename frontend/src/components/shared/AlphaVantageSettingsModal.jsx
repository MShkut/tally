// frontend/src/components/shared/AlphaVantageSettingsModal.jsx
import React, { useState, useEffect } from 'react';
import { useTheme } from 'contexts/ThemeContext';
import { alphaVantage } from 'utils/alphaVantageService';

export const AlphaVantageSettingsModal = ({ isOpen, onClose, onSuccess }) => {
  const { isDarkMode } = useTheme();
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Load existing API key
      const existing = alphaVantage.getApiKey();
      setApiKey(existing || '');
      setError(null);
    }
  }, [isOpen]);

  const handleSave = () => {
    setError(null);
    setSaving(true);

    try {
      alphaVantage.setApiKey(apiKey);

      if (apiKey.trim() === '') {
        alert('✓ AlphaVantage API key removed');
      } else {
        alert('✓ AlphaVantage API key saved');
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('[ALPHAVANTAGE] Save API key error:', err);
      setError(err.message || 'Failed to save API key');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setApiKey('');
    setError(null);
    setShowKey(false);
    onClose();
  };

  const handleTestKey = async () => {
    if (!apiKey || apiKey.trim() === '') {
      setError('Please enter an API key first');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Temporarily set key for testing
      const oldKey = alphaVantage.getApiKey();
      alphaVantage.setApiKey(apiKey);

      // Test with a simple stock quote (AAPL)
      await alphaVantage.fetchStockPrice('AAPL');

      alert('✓ API key is valid!');

      // Restore old key if test passed
      if (oldKey !== apiKey) {
        alphaVantage.setApiKey(oldKey || '');
      }
    } catch (err) {
      console.error('[ALPHAVANTAGE] Test API key error:', err);
      setError(err.message || 'API key test failed');

      // Restore old key
      const oldKey = alphaVantage.getApiKey();
      if (oldKey && oldKey !== apiKey) {
        alphaVantage.setApiKey(oldKey);
      }
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-75 z-[60] flex items-center justify-center p-4"
        onClick={handleCancel}
      >
        {/* Modal */}
        <div
          className={`max-w-lg w-full p-8 rounded-lg ${
            isDarkMode ? 'bg-black border border-gray-800' : 'bg-white border border-gray-200'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="mb-6">
            <h2 className={`text-2xl font-light mb-2 ${
              isDarkMode ? 'text-white' : 'text-black'
            }`}>
              AlphaVantage API Settings
            </h2>
            <p className={`text-sm mb-4 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Configure your AlphaVantage API key for stock and crypto price tracking
            </p>
            <div className={`text-xs space-y-1 ${
              isDarkMode ? 'text-gray-500' : 'text-gray-500'
            }`}>
              <p>• Free tier: 25 API calls per day</p>
              <p>• Get your free API key at: <a
                href="https://www.alphavantage.co/support/#api-key"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-blue-400"
              >
                alphavantage.co/support/#api-key
              </a></p>
            </div>
          </div>

          {/* API Key Input */}
          <div className="mb-6">
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={saving}
                className={`w-full px-4 py-2 pr-12 rounded border ${
                  isDarkMode
                    ? 'bg-gray-900 border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-black'
                } disabled:opacity-50 font-mono text-sm`}
                placeholder="Enter your AlphaVantage API key"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm ${
                  isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className={`mb-6 p-4 rounded border ${
              isDarkMode
                ? 'bg-red-900 bg-opacity-20 border-red-800 text-red-400'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Info Box */}
          <div className={`mb-6 p-4 rounded border ${
            isDarkMode
              ? 'bg-blue-900 bg-opacity-10 border-blue-800 text-blue-400'
              : 'bg-blue-50 border-blue-200 text-blue-700'
          }`}>
            <p className="text-xs">
              Your API key is stored locally in your browser and is only used to fetch
              stock and cryptocurrency prices from AlphaVantage. It is never sent to any
              other server.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-4 justify-end">
            <button
              onClick={handleTestKey}
              disabled={saving || !apiKey}
              className={`px-6 py-2 text-sm font-medium rounded transition-colors ${
                isDarkMode
                  ? 'text-blue-400 border border-blue-800 hover:bg-blue-900 hover:bg-opacity-20'
                  : 'text-blue-600 border border-blue-300 hover:bg-blue-50'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {saving ? 'Testing...' : 'Test Key'}
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className={`px-6 py-2 text-sm font-medium rounded transition-colors ${
                isDarkMode
                  ? 'text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600'
                  : 'text-gray-700 hover:text-black border border-gray-300 hover:border-gray-400'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`px-6 py-2 text-sm font-medium rounded transition-colors ${
                isDarkMode
                  ? 'bg-white text-black hover:bg-gray-100'
                  : 'bg-black text-white hover:bg-gray-800'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {saving ? 'Saving...' : 'Save API Key'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
