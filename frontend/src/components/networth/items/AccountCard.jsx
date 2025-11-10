// AccountCard.jsx - Display card for individual net worth account
import React, { useState, useEffect } from 'react';
import { useTheme } from 'contexts/ThemeContext';
import { Currency } from 'utils/currency';
import { apiService } from 'utils/apiService';

export const AccountCard = ({ account, onEdit, onDelete }) => {
  const { isDarkMode } = useTheme();
  const [currentValue, setCurrentValue] = useState(0);
  const [holdings, setHoldings] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (account.tracking_method === 'quantity_based' && isExpanded) {
      loadHoldings();
    } else if (account.tracking_method === 'simple') {
      setCurrentValue(account.current_value || 0);
    }
  }, [account, isExpanded]);

  const loadHoldings = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getAccountHoldings(account.id);
      setHoldings(data);

      // Calculate total value
      const total = data.reduce((sum, holding) => sum + (holding.current_value || 0), 0);
      setCurrentValue(total);
    } catch (error) {
      console.error('Error loading holdings:', error);
      setHoldings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const categoryIcons = {
    // Assets
    'Cash': '💵',
    'Chequing': '🏦',
    'Savings': '💰',
    'Investments': '📈',
    'Retirement': '🏖️',
    'Real Estate': '🏠',
    'Vehicles': '🚗',
    'Crypto': '₿',
    'Precious Metals': '🥇',
    'Other Assets': '📦',
    // Liabilities
    'Credit Card': '💳',
    'Loan': '🏦',
    'Mortgage': '🏡',
    'Student Loan': '🎓',
    'Line of Credit': '📊',
    'Other Liabilities': '📋'
  };

  const icon = categoryIcons[account.category] || (account.type === 'asset' ? '💼' : '📉');

  return (
    <div className={`rounded-lg border transition-colors ${
      isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
    }`}>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="text-2xl">{icon}</div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-medium">{account.name}</h3>
                {account.linked_budget_category && (
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'
                  }`}>
                    🔗 {account.linked_budget_category}
                  </span>
                )}
              </div>

              <div className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {account.category}
                {account.tracking_method === 'quantity_based' && (
                  <span className="ml-2">• Quantity-based</span>
                )}
              </div>

              {account.notes && (
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {account.notes}
                </p>
              )}
            </div>
          </div>

          <div className="text-right ml-4">
            <div className={`text-2xl font-medium ${
              account.type === 'asset' ? 'text-green-500' : 'text-red-500'
            }`}>
              {account.type === 'liability' && '-'}
              {Currency.format(currentValue)}
            </div>

            <div className="flex gap-2 mt-2">
              <button
                onClick={onEdit}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  isDarkMode
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                Edit
              </button>
              <button
                onClick={onDelete}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  isDarkMode
                    ? 'bg-red-900 hover:bg-red-800 text-red-200'
                    : 'bg-red-100 hover:bg-red-200 text-red-700'
                }`}
              >
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Holdings Section for Quantity-based Accounts */}
        {account.tracking_method === 'quantity_based' && (
          <div className="mt-4">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`text-sm font-medium ${
                isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
              }`}
            >
              {isExpanded ? '▼' : '▶'} {holdings.length} Holdings
            </button>

            {isExpanded && (
              <div className="mt-3 space-y-2">
                {isLoading ? (
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Loading holdings...
                  </div>
                ) : holdings.length === 0 ? (
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    No holdings yet. Edit this account to add holdings.
                  </div>
                ) : (
                  holdings.map(holding => (
                    <div
                      key={holding.id}
                      className={`p-3 rounded border ${
                        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{holding.name}</div>
                          {holding.ticker_symbol && (
                            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {holding.ticker_symbol}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {Currency.format(holding.current_value || 0)}
                          </div>
                          <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {holding.current_quantity} @ {Currency.format(holding.current_price || 0)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
