// UpdatePricesModal.jsx - Batch update prices for all holdings
import React, { useState, useEffect } from 'react';
import { useTheme } from 'contexts/ThemeContext';
import { apiService } from 'utils/apiService';
import { currency } from 'utils/currency';

export const UpdatePricesModal = ({ accounts, onClose }) => {
  const { isDarkMode } = useTheme();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [priceUpdates, setPriceUpdates] = useState({});
  const [holdings, setHoldings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadHoldings();
  }, [accounts]);

  const loadHoldings = async () => {
    setIsLoading(true);
    try {
      const allHoldings = [];

      // Load holdings for all quantity-based accounts
      for (const account of accounts.filter(a => a.tracking_method === 'quantity_based')) {
        const result = await apiService.getAccountHoldings(account.id);
        if (result.data) {
          for (const holding of result.data) {
            allHoldings.push({
              ...holding,
              accountName: account.name
            });
          }
        }
      }

      setHoldings(allHoldings);

      // Initialize price updates with current prices
      const initialPrices = {};
      allHoldings.forEach(holding => {
        initialPrices[holding.id] = (holding.current_price || 0) / 100; // Convert cents to base unit
      });
      setPriceUpdates(initialPrices);
    } catch (error) {
      console.error('Error loading holdings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePriceChange = (holdingId, value) => {
    setPriceUpdates(prev => ({
      ...prev,
      [holdingId]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Build updates array
      const updates = [];
      for (const [holdingId, price] of Object.entries(priceUpdates)) {
        const holding = holdings.find(h => h.id === parseInt(holdingId));
        if (holding && price !== (holding.current_price || 0) / 100) {
          updates.push({
            holdingId: parseInt(holdingId),
            date,
            price_per_unit: Math.round(price * 100) // Convert to cents
          });
        }
      }

      if (updates.length > 0) {
        await apiService.batchUpdatePrices(updates);
      }

      onClose();
      window.location.reload(); // Reload to see updated values
    } catch (error) {
      console.error('Error saving price updates:', error);
      alert('Failed to save price updates. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-2xl rounded-lg ${
        isDarkMode ? 'bg-gray-900' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`p-6 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <h2 className="text-2xl font-medium">Update Prices</h2>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Update current prices for all your holdings
          </p>
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {/* Date Selector */}
          <div className="mb-6">
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className={`w-full px-3 py-2 rounded border ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-700 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-gray-500">
              Loading holdings...
            </div>
          ) : holdings.length === 0 ? (
            <div className={`text-center py-8 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <p>No quantity-based holdings to update</p>
              <p className="text-sm mt-2">Add investment holdings to use this feature</p>
            </div>
          ) : (
            <div className="space-y-4">
              {holdings.map(holding => (
                <div key={holding.id} className={`p-4 rounded border ${
                  isDarkMode ? 'border-gray-800' : 'border-gray-200'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium">{holding.name}</div>
                      {holding.symbol && (
                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {holding.symbol}
                        </div>
                      )}
                      <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        in {holding.accountName}
                      </div>
                    </div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Quantity: {holding.current_quantity || 0}
                    </div>
                  </div>

                  <div className="flex gap-4 items-center">
                    <div className="flex-1">
                      <label className={`block text-xs mb-1 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Price per unit
                      </label>
                      <div className="flex items-center gap-2">
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={priceUpdates[holding.id] || ''}
                          onChange={(e) => handlePriceChange(holding.id, parseFloat(e.target.value) || 0)}
                          className={`flex-1 px-3 py-2 rounded border ${
                            isDarkMode
                              ? 'bg-gray-800 border-gray-700 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <div className={`text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Total value
                      </div>
                      <div className="font-medium">
                        {currency.format((priceUpdates[holding.id] || 0) * (holding.current_quantity || 0) * 100)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-6 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-200'} flex justify-end gap-3`}>
          <button
            onClick={onClose}
            disabled={isSaving}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              isDarkMode
                ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || holdings.length === 0}
            className={`px-6 py-2 rounded font-medium transition-colors ${
              isSaving || holdings.length === 0
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : isDarkMode
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isSaving ? 'Saving...' : 'Save Updates'}
          </button>
        </div>
      </div>
    </div>
  );
};
