// LiabilitiesSummary.jsx - Liabilities summary section
import React from 'react';
import { useTheme } from 'contexts/ThemeContext';
import { Currency } from 'utils/currency';
import { groupAccountsByCategory } from 'utils/networthChartUtils';

export const LiabilitiesSummary = ({ accounts, total }) => {
  const { isDarkMode } = useTheme();

  const grouped = groupAccountsByCategory(accounts);
  const categories = Object.keys(grouped.liabilities);

  return (
    <div className={`p-6 rounded-lg border ${
      isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
    }`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-medium">Liabilities</h2>
        <div className="text-2xl font-medium text-red-500">
          {Currency.format(total)}
        </div>
      </div>

      {accounts.length === 0 ? (
        <div className={`text-center py-8 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          <p className="mb-2">No liabilities tracked</p>
          <p className="text-sm">Great! Keep it that way</p>
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map(category => {
            const categoryAccounts = grouped.liabilities[category];
            const categoryTotal = categoryAccounts.reduce((sum, acc) => sum + (acc.current_value || 0), 0);

            return (
              <div key={category} className="space-y-2">
                <div className={`flex justify-between items-center pb-2 border-b ${
                  isDarkMode ? 'border-gray-800' : 'border-gray-200'
                }`}>
                  <div className="font-medium">{category}</div>
                  <div className="text-sm">{Currency.format(categoryTotal)}</div>
                </div>

                {categoryAccounts.map(account => (
                  <div
                    key={account.id}
                    className={`flex justify-between items-center pl-4 py-1 text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{account.name}</span>
                      {account.linked_budget_category && (
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'
                        }`}>
                          🔗 {account.linked_budget_category}
                        </span>
                      )}
                    </div>
                    <div>{Currency.format(account.current_value || 0)}</div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
