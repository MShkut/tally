// frontend/src/components/overview/networth/AssetManager.jsx
import React, { useState, useEffect } from 'react';
import { useTheme } from 'contexts/ThemeContext';
import { dataManager } from 'utils/dataManager';
import { Currency } from 'utils/currency';

const ASSET_CATEGORIES = [
  'Stock',
  'Bitcoin',
  'Property',
  'Cash',
  'Retirement Accounts',
  'Bonds',
  'Other'
];

export const AssetManager = ({ onEdit, onDelete }) => {
  const { isDarkMode } = useTheme();
  const [assets, setAssets] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [expandedItems, setExpandedItems] = useState({});

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = () => {
    const items = dataManager.loadNetWorthItems();
    const assetItems = items.filter(item => item.type === 'asset');
    setAssets(assetItems);
  };

  // Group assets by category
  const groupedAssets = ASSET_CATEGORIES.reduce((acc, category) => {
    const categoryAssets = assets.filter(asset => asset.category === category);
    if (categoryAssets.length > 0) {
      acc[category] = categoryAssets;
    }
    return acc;
  }, {});

  // Initialize all categories as expanded
  useEffect(() => {
    const initialExpanded = {};
    Object.keys(groupedAssets).forEach(category => {
      initialExpanded[category] = true;
    });
    setExpandedCategories(initialExpanded);
  }, [assets]);

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  if (assets.length === 0) {
    return (
      <div className={`p-12 rounded-lg ${isDarkMode ? 'bg-gray-900/30' : 'bg-gray-100/50'}`}>
        <p className={`text-base font-light ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          No assets yet. Add your first asset in the Import tab.
        </p>
      </div>
    );
  }

  // Group assets by category and then by name
  const groupedByItem = {};
  Object.entries(groupedAssets).forEach(([category, categoryAssets]) => {
    const itemGroups = {};
    categoryAssets.forEach(asset => {
      if (!itemGroups[asset.name]) {
        itemGroups[asset.name] = [];
      }
      itemGroups[asset.name].push(asset);
    });
    groupedByItem[category] = itemGroups;
  });

  const toggleItem = (itemKey) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemKey]: !prev[itemKey]
    }));
  };

  return (
    <div className="space-y-12">
      {Object.entries(groupedByItem).map(([category, itemGroups]) => (
        <div key={category}>
          {/* Category Header - Clickable */}
          <button
            onClick={() => toggleCategory(category)}
            className={`flex items-center gap-2 text-2xl font-light mb-6 ${
              isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-700'
            } transition-colors duration-200`}
          >
            <span>{category}</span>
            <span className="text-xl">
              {expandedCategories[category] ? '−' : '+'}
            </span>
          </button>

          {/* Category Items */}
          {expandedCategories[category] && (
            <div className="ml-6 space-y-4">
              {category === 'Bitcoin' ? (
                // Bitcoin category - skip item nesting, show transactions directly
                (() => {
                  const [itemName, itemAssets] = Object.entries(itemGroups)[0];
                  return (
                    <div>
                      {/* Column Headers */}
                      <div className={`py-2 border-b-2 ${
                        isDarkMode ? 'border-gray-700' : 'border-gray-300'
                      }`} style={{display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1rem'}}>
                        <div className="col-span-2 text-left">
                          <p className={`text-xs uppercase tracking-wider font-medium ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-400'
                          }`}>
                            Purchase Date
                          </p>
                        </div>
                        <div className="col-span-1 text-right">
                          <p className={`text-xs uppercase tracking-wider font-medium ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-400'
                          }`}>
                            Quantity
                          </p>
                        </div>
                        <div className="col-span-2 text-right">
                          <p className={`text-xs uppercase tracking-wider font-medium ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-400'
                          }`}>
                            Cost Basis
                          </p>
                        </div>
                        <div className="col-span-2 text-right">
                          <p className={`text-xs uppercase tracking-wider font-medium ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-400'
                          }`}>
                            Current Value
                          </p>
                        </div>
                        <div className="col-span-2 text-right">
                          <p className={`text-xs uppercase tracking-wider font-medium ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-400'
                          }`}>
                            Profit/Loss
                          </p>
                        </div>
                        <div className="col-span-3 text-right">
                          <p className={`text-xs uppercase tracking-wider font-medium ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-400'
                          }`}>
                            Actions
                          </p>
                        </div>
                      </div>

                      {/* Transaction Rows */}
                      <div>
                        {itemAssets.map((asset) => (
                          <AssetCard
                            key={asset.id}
                            asset={asset}
                            onEdit={() => onEdit(asset)}
                            onDelete={() => onDelete(asset)}
                            isDarkMode={isDarkMode}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })()
              ) : (
                // All other categories - show nested item structure
                Object.entries(itemGroups).map(([itemName, itemAssets]) => {
                  const itemKey = `${category}-${itemName}`;
                  const isExpanded = expandedItems[itemKey];

                  return (
                    <div key={itemKey}>
                      {/* Item Name Header - Collapsible */}
                      <button
                        onClick={() => toggleItem(itemKey)}
                        className={`flex items-center gap-2 text-lg font-medium mb-2 ${
                          isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-700'
                        } transition-colors`}
                      >
                        <span>{itemName}</span>
                        <span className="text-base">
                          {isExpanded ? '−' : '+'}
                        </span>
                      </button>

                      {/* Transaction History for this item */}
                      {isExpanded && (
                        <div>
                          {/* Column Headers */}
                          <div className={`py-2 border-b-2 ${
                            isDarkMode ? 'border-gray-700' : 'border-gray-300'
                          }`} style={{display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1rem'}}>
                            <div className="col-span-2 text-left">
                              <p className={`text-xs uppercase tracking-wider font-medium ${
                                isDarkMode ? 'text-gray-500' : 'text-gray-400'
                              }`}>
                                Purchase Date
                              </p>
                            </div>
                            <div className="col-span-1 text-right">
                              <p className={`text-xs uppercase tracking-wider font-medium ${
                                isDarkMode ? 'text-gray-500' : 'text-gray-400'
                              }`}>
                                Quantity
                              </p>
                            </div>
                            <div className="col-span-2 text-right">
                              <p className={`text-xs uppercase tracking-wider font-medium ${
                                isDarkMode ? 'text-gray-500' : 'text-gray-400'
                              }`}>
                                Cost Basis
                              </p>
                            </div>
                            <div className="col-span-2 text-right">
                              <p className={`text-xs uppercase tracking-wider font-medium ${
                                isDarkMode ? 'text-gray-500' : 'text-gray-400'
                              }`}>
                                Current Value
                              </p>
                            </div>
                            <div className="col-span-2 text-right">
                              <p className={`text-xs uppercase tracking-wider font-medium ${
                                isDarkMode ? 'text-gray-500' : 'text-gray-400'
                              }`}>
                                Profit/Loss
                              </p>
                            </div>
                            <div className="col-span-3 text-right">
                              <p className={`text-xs uppercase tracking-wider font-medium ${
                                isDarkMode ? 'text-gray-500' : 'text-gray-400'
                              }`}>
                                Actions
                              </p>
                            </div>
                          </div>

                          {/* Transaction Rows */}
                          <div>
                            {itemAssets.map((asset) => (
                              <AssetCard
                                key={asset.id}
                                asset={asset}
                                onEdit={() => onEdit(asset)}
                                onDelete={() => onDelete(asset)}
                                isDarkMode={isDarkMode}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const AssetCard = ({ asset, onEdit, onDelete, isDarkMode }) => {
  const costBasis = asset.totalCost || (asset.purchaseValue * asset.quantity);
  const currentValue = asset.currentValue || costBasis;
  const profitLoss = currentValue - costBasis;
  const profitLossPercent = costBasis > 0 ? (profitLoss / costBasis) * 100 : 0;

  return (
    <div className={`py-4 border-b ${
      isDarkMode ? 'border-gray-800' : 'border-gray-200'
    }`} style={{display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1rem', alignItems: 'center'}}>
      {/* Purchase Date */}
      <div className="col-span-2 text-left">
        <p className={`text-sm font-mono ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          {new Date(asset.purchaseDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </p>
      </div>

      {/* Quantity */}
      <div className="col-span-1 text-right">
        <p className={`text-sm font-mono ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          {asset.quantity}
        </p>
      </div>

      {/* Cost Basis */}
      <div className="col-span-2 text-right">
        <p className={`text-sm font-mono ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          {Currency.formatWithUserCurrency(costBasis)}
        </p>
      </div>

      {/* Current Value */}
      <div className="col-span-2 text-right">
        <p className={`text-sm font-mono ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          {Currency.formatWithUserCurrency(currentValue)}
        </p>
      </div>

      {/* Profit/Loss */}
      <div className="col-span-2 text-right">
        <p className={`text-sm font-mono ${
          profitLoss >= 0
            ? 'text-green-500'
            : 'text-red-500'
        }`}>
          {profitLoss >= 0 ? '+' : ''}{Currency.formatWithUserCurrency(profitLoss)}
        </p>
        <p className={`text-xs font-mono ${
          profitLoss >= 0
            ? isDarkMode ? 'text-green-400' : 'text-green-600'
            : isDarkMode ? 'text-red-400' : 'text-red-600'
        }`}>
          {profitLoss >= 0 ? '+' : ''}{profitLossPercent.toFixed(2)}%
        </p>
      </div>

      {/* Action Buttons */}
      <div className="col-span-3 flex justify-end gap-2">
        <button
          onClick={onEdit}
          className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
            isDarkMode
              ? 'bg-gray-800 text-white hover:bg-gray-700'
              : 'bg-gray-200 text-black hover:bg-gray-300'
          }`}
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="px-3 py-1 text-sm font-medium rounded transition-colors text-red-500 hover:bg-red-500 hover:text-white border border-red-500"
        >
          Delete
        </button>
      </div>
    </div>
  );
};
