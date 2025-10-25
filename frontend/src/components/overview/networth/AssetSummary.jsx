// frontend/src/components/overview/networth/AssetSummary.jsx
import React, { useMemo } from 'react';
import { useTheme } from 'contexts/ThemeContext';
import { Currency } from 'utils/currency';
import { groupItemsByCategory } from 'utils/netWorthCalculations';

const ASSET_CATEGORIES = [
  'Stock',
  'Bitcoin',
  'Property',
  'Cash',
  'Retirement Accounts',
  'Bonds',
  'Other'
];

export const AssetSummary = ({ items, onRefresh, isRefreshing, refreshStatus }) => {
  const { isDarkMode } = useTheme();

  const groupedAssets = useMemo(() => {
    const grouped = groupItemsByCategory(items, 'asset');

    // Filter to only include predefined categories that have items
    const filtered = {};
    ASSET_CATEGORIES.forEach(category => {
      if (grouped[category] && grouped[category].length > 0) {
        filtered[category] = grouped[category];
      }
    });

    return filtered;
  }, [items]);

  const hasAssets = Object.keys(groupedAssets).length > 0;

  if (!hasAssets) {
    return (
      <div>
        <h2 className={`text-2xl font-light mb-8 ${isDarkMode ? 'text-white' : 'text-black'}`}>
          Assets
        </h2>
        <div className={`p-12 rounded-lg ${isDarkMode ? 'bg-gray-900/30' : 'bg-gray-100/50'}`}>
          <p className={`text-base font-light ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            No assets yet. Add your first asset in the Import tab.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with refresh icon */}
      <div className="flex items-center gap-3">
        <h2 className={`text-2xl font-light ${isDarkMode ? 'text-white' : 'text-black'}`}>
          Assets
        </h2>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className={`p-1.5 rounded-lg transition-all ${
              isDarkMode
                ? 'hover:bg-gray-800 text-gray-400 hover:text-white disabled:text-gray-700'
                : 'hover:bg-gray-200 text-gray-600 hover:text-black disabled:text-gray-400'
            } ${isRefreshing ? 'cursor-not-allowed animate-spin' : 'cursor-pointer'}`}
            title={isRefreshing ? 'Refreshing...' : 'Refresh prices'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
          </button>
        )}
        {refreshStatus && (
          <p className={`text-xs font-light ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
            {refreshStatus}
          </p>
        )}
      </div>

      {Object.entries(groupedAssets).map(([category, categoryAssets]) => {
        const isBitcoin = category === 'Bitcoin';

        if (isBitcoin) {
          // Bitcoin special handling: show BTC amount, current price, current value, profit/loss
          let totalBTC = 0;
          let totalCurrentValue = 0;
          let totalCostBasis = 0;

          categoryAssets.forEach(asset => {
            totalBTC += asset.quantity;
            const costBasis = asset.totalCost || (asset.purchaseValue * asset.quantity);
            const currentValue = asset.currentValue || costBasis;
            totalCurrentValue += currentValue;
            totalCostBasis += costBasis;
          });

          const currentPricePerBTC = totalBTC > 0 ? totalCurrentValue / totalBTC : 0;
          const profitLoss = totalCurrentValue - totalCostBasis;
          const profitLossPercent = totalCostBasis > 0 ? (profitLoss / totalCostBasis) * 100 : 0;

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
                <div className="col-span-3">
                  <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Amount
                  </p>
                </div>
                <div className="col-span-3 text-right">
                  <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Current Price
                  </p>
                </div>
                <div className="col-span-3 text-right">
                  <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Current Value
                  </p>
                </div>
                <div className="col-span-3 text-right">
                  <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Profit/Loss
                  </p>
                </div>
              </div>

              {/* Bitcoin Row (no total row) */}
              <div className={`grid grid-cols-12 gap-4 py-2`}>
                <div className="col-span-3">
                  <p className={`text-sm font-mono ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {totalBTC.toFixed(8)}
                  </p>
                </div>
                <div className="col-span-3 text-right">
                  <p className={`text-sm font-mono ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {Currency.formatWithUserCurrency(currentPricePerBTC)}
                  </p>
                </div>
                <div className="col-span-3 text-right">
                  <p className={`text-sm font-mono ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {Currency.formatWithUserCurrency(totalCurrentValue)}
                  </p>
                </div>
                <div className="col-span-3 text-right">
                  <p className={`text-sm font-mono ${profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {profitLoss >= 0 ? '+' : ''}{Currency.formatWithUserCurrency(profitLoss)}
                  </p>
                  <p className={`text-xs font-mono ${profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {profitLoss >= 0 ? '+' : ''}{profitLossPercent.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          );
        } else {
          // All other assets: group by name and show item rows with category total
          const itemSummaries = {};
          categoryAssets.forEach(asset => {
            const itemName = asset.name;

            if (!itemSummaries[itemName]) {
              itemSummaries[itemName] = {
                quantity: 0,
                currentValue: 0,
                costBasis: 0
              };
            }

            const costBasis = asset.totalCost || (asset.purchaseValue * asset.quantity);
            const currentValue = asset.currentValue || costBasis;

            itemSummaries[itemName].quantity += asset.quantity;
            itemSummaries[itemName].currentValue += currentValue;
            itemSummaries[itemName].costBasis += costBasis;
          });

          // Calculate category totals
          let categoryCurrentValue = 0;
          let categoryCostBasis = 0;
          Object.values(itemSummaries).forEach(summary => {
            categoryCurrentValue += summary.currentValue;
            categoryCostBasis += summary.costBasis;
          });
          const categoryProfitLoss = categoryCurrentValue - categoryCostBasis;
          const categoryProfitLossPercent = categoryCostBasis > 0 ? (categoryProfitLoss / categoryCostBasis) * 100 : 0;

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
                <div className="col-span-3">
                  <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Name
                  </p>
                </div>
                <div className="col-span-3 text-right">
                  <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Current Price
                  </p>
                </div>
                <div className="col-span-3 text-right">
                  <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Current Value
                  </p>
                </div>
                <div className="col-span-3 text-right">
                  <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Profit/Loss
                  </p>
                </div>
              </div>

              {/* Item Rows */}
              {Object.entries(itemSummaries).map(([itemName, summary]) => {
                const currentPrice = summary.quantity > 0 ? summary.currentValue / summary.quantity : 0;
                const profitLoss = summary.currentValue - summary.costBasis;
                const profitLossPercent = summary.costBasis > 0 ? (profitLoss / summary.costBasis) * 100 : 0;

                return (
                  <div key={itemName} className={`grid grid-cols-12 gap-4 py-2 border-b ${
                    isDarkMode ? 'border-gray-800' : 'border-gray-200'
                  }`}>
                    <div className="col-span-3">
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {itemName}
                      </p>
                    </div>
                    <div className="col-span-3 text-right">
                      <p className={`text-sm font-mono ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {Currency.formatWithUserCurrency(currentPrice)}
                      </p>
                    </div>
                    <div className="col-span-3 text-right">
                      <p className={`text-sm font-mono ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {Currency.formatWithUserCurrency(summary.currentValue)}
                      </p>
                    </div>
                    <div className="col-span-3 text-right">
                      <p className={`text-sm font-mono ${profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {profitLoss >= 0 ? '+' : ''}{Currency.formatWithUserCurrency(profitLoss)}
                      </p>
                      <p className={`text-xs font-mono ${profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {profitLoss >= 0 ? '+' : ''}{profitLossPercent.toFixed(1)}%
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
                  <div className="col-span-3">
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Total {category}
                    </p>
                  </div>
                  <div className="col-span-3 text-right">
                    {/* Empty space for current price */}
                  </div>
                  <div className="col-span-3 text-right">
                    <p className={`text-sm font-mono font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {Currency.formatWithUserCurrency(categoryCurrentValue)}
                    </p>
                  </div>
                  <div className="col-span-3 text-right">
                    <p className={`text-sm font-mono font-medium ${categoryProfitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {categoryProfitLoss >= 0 ? '+' : ''}{Currency.formatWithUserCurrency(categoryProfitLoss)}
                    </p>
                    <p className={`text-xs font-mono font-medium ${categoryProfitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {categoryProfitLoss >= 0 ? '+' : ''}{categoryProfitLossPercent.toFixed(1)}%
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        }
      })}
    </div>
  );
};
