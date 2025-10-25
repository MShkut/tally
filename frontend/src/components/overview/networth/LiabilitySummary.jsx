// frontend/src/components/overview/networth/LiabilitySummary.jsx
import React, { useMemo } from 'react';
import { useTheme } from 'contexts/ThemeContext';
import { Currency } from 'utils/currency';
import { groupItemsByCategory } from 'utils/netWorthCalculations';

const LIABILITY_CATEGORIES = [
  'Mortgage',
  'Student Loans',
  'Auto Loans',
  'Credit Cards',
  'Personal Loans',
  'Other'
];

export const LiabilitySummary = ({ items }) => {
  const { isDarkMode } = useTheme();

  const groupedLiabilities = useMemo(() => {
    const grouped = groupItemsByCategory(items, 'liability');

    // Filter to only include predefined categories that have items
    const filtered = {};
    LIABILITY_CATEGORIES.forEach(category => {
      if (grouped[category] && grouped[category].length > 0) {
        filtered[category] = grouped[category];
      }
    });

    return filtered;
  }, [items]);

  const hasLiabilities = Object.keys(groupedLiabilities).length > 0;

  if (!hasLiabilities) {
    return (
      <div>
        <h2 className={`text-2xl font-light mb-8 ${isDarkMode ? 'text-white' : 'text-black'}`}>
          Liabilities
        </h2>
        <div className={`p-12 rounded-lg ${isDarkMode ? 'bg-gray-900/30' : 'bg-gray-100/50'}`}>
          <p className={`text-base font-light ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            No liabilities yet. Add your first liability in the Import tab.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className={`text-2xl font-light ${isDarkMode ? 'text-white' : 'text-black'}`}>
        Liabilities
      </h2>

      {Object.entries(groupedLiabilities).map(([category, categoryLiabilities]) => {
        // Group liabilities by name and calculate totals per name
        const itemSummaries = {};
        categoryLiabilities.forEach(liability => {
          const itemName = liability.name;

          if (!itemSummaries[itemName]) {
            itemSummaries[itemName] = {
              currentBalance: 0,
              originalAmount: 0
            };
          }

          const originalAmount = liability.totalCost || liability.purchaseValue;
          const currentBalance = liability.currentValue || originalAmount;

          itemSummaries[itemName].currentBalance += currentBalance;
          itemSummaries[itemName].originalAmount += originalAmount;
        });

        // Calculate category totals
        let categoryCurrentBalance = 0;
        let categoryOriginalAmount = 0;
        Object.values(itemSummaries).forEach(summary => {
          categoryCurrentBalance += summary.currentBalance;
          categoryOriginalAmount += summary.originalAmount;
        });
        const categoryPaidOff = categoryOriginalAmount - categoryCurrentBalance;
        const categoryPaidOffPercent = categoryOriginalAmount > 0 ? (categoryPaidOff / categoryOriginalAmount) * 100 : 0;

        return (
          <div key={category} className="space-y-4">
            {/* Category Header */}
            <h3 className={`text-lg font-light ${isDarkMode ? 'text-white' : 'text-black'}`}>
              {category}
            </h3>

            {/* Column Headers */}
            <div className={`grid grid-cols-12 gap-4 pb-3 border-b ${
              isDarkMode ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <div className="col-span-6">
                <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Name
                </p>
              </div>
              <div className="col-span-3 text-right">
                <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Balance
                </p>
              </div>
              <div className="col-span-3 text-right">
                <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Paid Off
                </p>
              </div>
            </div>

            {/* Item Rows */}
            {Object.entries(itemSummaries).map(([itemName, summary]) => {
              const paidOff = summary.originalAmount - summary.currentBalance;
              const paidOffPercent = summary.originalAmount > 0 ? (paidOff / summary.originalAmount) * 100 : 0;

              return (
                <div key={itemName} className={`grid grid-cols-12 gap-4 py-2 border-b ${
                  isDarkMode ? 'border-gray-800' : 'border-gray-200'
                }`}>
                  <div className="col-span-6">
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {itemName}
                    </p>
                  </div>
                  <div className="col-span-3 text-right">
                    <p className={`text-sm font-mono ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {Currency.formatWithUserCurrency(summary.currentBalance)}
                    </p>
                  </div>
                  <div className="col-span-3 text-right">
                    <p className={`text-sm font-mono ${
                      paidOff > 0 ? 'text-green-500' : isDarkMode ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      {paidOff > 0 ? '-' : ''}{Currency.formatWithUserCurrency(Math.abs(paidOff))}
                    </p>
                    <p className={`text-xs font-mono ${
                      paidOff > 0 ? 'text-green-500' : isDarkMode ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      {paidOffPercent.toFixed(1)}%
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Category Total - only show if more than 1 item */}
            {Object.keys(itemSummaries).length > 1 && (
              <div className={`grid grid-cols-12 gap-4 pt-2 border-t-2 ${
                isDarkMode ? 'border-gray-700' : 'border-gray-300'
              }`}>
                <div className="col-span-6">
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Total {category}
                  </p>
                </div>
                <div className="col-span-3 text-right">
                  <p className={`text-sm font-mono font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {Currency.formatWithUserCurrency(categoryCurrentBalance)}
                  </p>
                </div>
                <div className="col-span-3 text-right">
                  <p className={`text-sm font-mono font-medium ${
                    categoryPaidOff > 0 ? 'text-green-500' : isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    {categoryPaidOff > 0 ? '-' : ''}{Currency.formatWithUserCurrency(Math.abs(categoryPaidOff))}
                  </p>
                  <p className={`text-xs font-mono font-medium ${
                    categoryPaidOff > 0 ? 'text-green-500' : isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    {categoryPaidOffPercent.toFixed(1)}%
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
