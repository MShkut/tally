// frontend/src/components/overview/networth/LiabilityManager.jsx
import React, { useState, useEffect } from 'react';
import { useTheme } from 'contexts/ThemeContext';
import { dataManager } from 'utils/dataManager';
import { Currency } from 'utils/currency';

const LIABILITY_CATEGORIES = [
  'Mortgage',
  'Student Loans',
  'Auto Loans',
  'Credit Cards',
  'Personal Loans',
  'Other'
];

export const LiabilityManager = ({ onEdit, onDelete }) => {
  const { isDarkMode } = useTheme();
  const [liabilities, setLiabilities] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [expandedItems, setExpandedItems] = useState({});

  useEffect(() => {
    loadLiabilities();
  }, []);

  const loadLiabilities = () => {
    const items = dataManager.loadNetWorthItems();
    const liabilityItems = items.filter(item => item.type === 'liability');
    setLiabilities(liabilityItems);
  };

  // Group liabilities by category
  const groupedLiabilities = LIABILITY_CATEGORIES.reduce((acc, category) => {
    const categoryLiabilities = liabilities.filter(liability => liability.category === category);
    if (categoryLiabilities.length > 0) {
      acc[category] = categoryLiabilities;
    }
    return acc;
  }, {});

  // Initialize all categories as expanded
  useEffect(() => {
    const initialExpanded = {};
    Object.keys(groupedLiabilities).forEach(category => {
      initialExpanded[category] = true;
    });
    setExpandedCategories(initialExpanded);
  }, [liabilities]);

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  if (liabilities.length === 0) {
    return (
      <div className={`p-12 rounded-lg ${isDarkMode ? 'bg-gray-900/30' : 'bg-gray-100/50'}`}>
        <p className={`text-base font-light ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          No liabilities yet. Add your first liability in the Import tab.
        </p>
      </div>
    );
  }

  // Group liabilities by category and then by name
  const groupedByItem = {};
  Object.entries(groupedLiabilities).forEach(([category, categoryLiabilities]) => {
    const itemGroups = {};
    categoryLiabilities.forEach(liability => {
      if (!itemGroups[liability.name]) {
        itemGroups[liability.name] = [];
      }
      itemGroups[liability.name].push(liability);
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
              {Object.keys(itemGroups).length === 1 ? (
                // Single item in category - show transactions directly
                (() => {
                  const [itemName, itemLiabilities] = Object.entries(itemGroups)[0];
                  return (
                    <div>
                      {/* Column Headers */}
                      <div className={`py-2 border-b-2 ${
                        isDarkMode ? 'border-gray-700' : 'border-gray-300'
                      }`} style={{display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1rem'}}>
                        <div className="col-span-3 text-left">
                          <p className={`text-xs uppercase tracking-wider font-medium ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-400'
                          }`}>
                            Origination Date
                          </p>
                        </div>
                        <div className="col-span-3 text-right">
                          <p className={`text-xs uppercase tracking-wider font-medium ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-400'
                          }`}>
                            Original Amount
                          </p>
                        </div>
                        <div className="col-span-2 text-right">
                          <p className={`text-xs uppercase tracking-wider font-medium ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-400'
                          }`}>
                            Current Balance
                          </p>
                        </div>
                        <div className="col-span-2 text-right">
                          <p className={`text-xs uppercase tracking-wider font-medium ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-400'
                          }`}>
                            Paid Off
                          </p>
                        </div>
                        <div className="col-span-2 text-right">
                          <p className={`text-xs uppercase tracking-wider font-medium ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-400'
                          }`}>
                            Actions
                          </p>
                        </div>
                      </div>

                      {/* Transaction Rows */}
                      <div>
                        {itemLiabilities.map((liability) => (
                          <LiabilityCard
                            key={liability.id}
                            liability={liability}
                            onEdit={() => onEdit(liability)}
                            onDelete={() => onDelete(liability)}
                            isDarkMode={isDarkMode}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })()
              ) : (
                // Multiple items in category - show nested structure
                Object.entries(itemGroups).map(([itemName, itemLiabilities]) => {
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
                            <div className="col-span-3 text-left">
                              <p className={`text-xs uppercase tracking-wider font-medium ${
                                isDarkMode ? 'text-gray-500' : 'text-gray-400'
                              }`}>
                                Origination Date
                              </p>
                            </div>
                            <div className="col-span-3 text-right">
                              <p className={`text-xs uppercase tracking-wider font-medium ${
                                isDarkMode ? 'text-gray-500' : 'text-gray-400'
                              }`}>
                                Original Amount
                              </p>
                            </div>
                            <div className="col-span-2 text-right">
                              <p className={`text-xs uppercase tracking-wider font-medium ${
                                isDarkMode ? 'text-gray-500' : 'text-gray-400'
                              }`}>
                                Current Balance
                              </p>
                            </div>
                            <div className="col-span-2 text-right">
                              <p className={`text-xs uppercase tracking-wider font-medium ${
                                isDarkMode ? 'text-gray-500' : 'text-gray-400'
                              }`}>
                                Paid Off
                              </p>
                            </div>
                            <div className="col-span-2 text-right">
                              <p className={`text-xs uppercase tracking-wider font-medium ${
                                isDarkMode ? 'text-gray-500' : 'text-gray-400'
                              }`}>
                                Actions
                              </p>
                            </div>
                          </div>

                          {/* Transaction Rows */}
                          <div>
                            {itemLiabilities.map((liability) => (
                              <LiabilityCard
                                key={liability.id}
                                liability={liability}
                                onEdit={() => onEdit(liability)}
                                onDelete={() => onDelete(liability)}
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

const LiabilityCard = ({ liability, onEdit, onDelete, isDarkMode }) => {
  const originalAmount = liability.totalCost || (liability.purchaseValue * liability.quantity);
  const currentBalance = liability.currentValue || originalAmount;
  const paidOff = originalAmount - currentBalance;
  const paidOffPercent = originalAmount > 0 ? (paidOff / originalAmount) * 100 : 0;

  return (
    <div className={`py-4 border-b ${
      isDarkMode ? 'border-gray-800' : 'border-gray-200'
    }`} style={{display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1rem', alignItems: 'center'}}>
      {/* Origination Date */}
      <div className="col-span-3 text-left">
        <p className={`text-sm font-mono ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          {new Date(liability.purchaseDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </p>
      </div>

      {/* Original Amount */}
      <div className="col-span-3 text-right">
        <p className={`text-sm font-mono ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          {Currency.formatWithUserCurrency(originalAmount)}
        </p>
      </div>

      {/* Current Balance */}
      <div className="col-span-2 text-right">
        <p className={`text-sm font-mono ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          {Currency.formatWithUserCurrency(currentBalance)}
        </p>
      </div>

      {/* Paid Off */}
      <div className="col-span-2 text-right">
        <p className={`text-sm font-mono ${
          paidOff > 0
            ? 'text-green-500'
            : isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          {Currency.formatWithUserCurrency(paidOff)}
        </p>
        <p className={`text-xs font-mono ${
          paidOff > 0
            ? isDarkMode ? 'text-green-400' : 'text-green-600'
            : isDarkMode ? 'text-gray-500' : 'text-gray-500'
        }`}>
          {paidOffPercent.toFixed(2)}%
        </p>
      </div>

      {/* Action Buttons */}
      <div className="col-span-2 flex justify-end gap-2">
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
