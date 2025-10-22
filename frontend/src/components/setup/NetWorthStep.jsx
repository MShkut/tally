import React, { useState, useEffect } from 'react';

import { useTheme } from 'contexts/ThemeContext';
import { ThemeToggle } from 'components/shared/ThemeToggle';
import { SmartInput } from 'components/shared/SmartInput';
import { Currency } from 'utils/currency';
import { 
  FormGrid, 
  FormField, 
  StandardInput,
  RemoveButton,
  AddItemButton,
  FormSection,
  StandardFormLayout,
  SummaryCard,
  SectionBorder,
  useItemManager,
  validation
} from 'components/shared/FormComponents';
import { loadCategoriesWithCustom } from 'utils/categorySuggestions';

// Enhanced net worth item component with smart suggestions and item type selector
export const NetWorthItem = ({ item, onUpdate, onDelete, type, placeholder }) => {
  const { isDarkMode } = useTheme();

  // Get suggestions from unified categorySuggestions system
  const suggestions = loadCategoriesWithCustom(type === 'asset' ? 'assets' : 'liabilities');

  const handleSuggestionSelect = (suggestion) => {
    // When a suggestion is selected, update the name
    onUpdate({ ...item, name: suggestion.name });
  };

  // Determine item type (cash, debt, stock, crypto)
  const itemType = item.itemType || 'cash';

  // Item type options
  const itemTypeOptions = type === 'asset'
    ? [
        { value: 'cash', label: 'Cash/Bank' },
        { value: 'stock', label: 'Stock' },
        { value: 'crypto', label: 'Crypto' }
      ]
    : [
        { value: 'debt', label: 'Debt' }
      ];

  const handleItemTypeChange = (newType) => {
    onUpdate({
      ...item,
      itemType: newType,
      // Clear symbol/quantity when switching away from stock/crypto
      ...(newType !== 'stock' && newType !== 'crypto' ? { symbol: '', quantity: 0 } : {})
    });
  };

  return (
    <div className="py-8">
      {/* Item Type Selector (only for assets) */}
      {type === 'asset' && (
        <div className="mb-4">
          <div className="flex gap-2">
            {itemTypeOptions.map(option => (
              <button
                key={option.value}
                onClick={() => handleItemTypeChange(option.value)}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  itemType === option.value
                    ? isDarkMode
                      ? 'bg-white text-black'
                      : 'bg-black text-white'
                    : isDarkMode
                      ? 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
                      : 'bg-gray-100 text-gray-600 hover:text-black border border-gray-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stock/Crypto specific fields */}
      {(itemType === 'stock' || itemType === 'crypto') ? (
        <div className="grid grid-cols-12 gap-8 items-end">
          {/* Symbol: 4 columns */}
          <div className="col-span-4">
            <StandardInput
              label={itemType === 'stock' ? 'Stock Symbol' : 'Crypto Symbol'}
              value={item.symbol || ''}
              onChange={(value) => onUpdate({ ...item, symbol: value.toUpperCase() })}
              placeholder={itemType === 'stock' ? 'AAPL' : 'BTC'}
              className="[&_label]:text-2xl [&_label]:font-medium [&_input]:text-2xl [&_input]:font-medium [&_input]:pb-4"
            />
          </div>

          {/* Quantity: 3 columns */}
          <div className="col-span-3">
            <StandardInput
              label={itemType === 'stock' ? 'Shares' : 'Amount'}
              type="number"
              value={item.quantity || ''}
              onChange={(value) => onUpdate({ ...item, quantity: parseFloat(value) || 0 })}
              placeholder="0"
              className="[&_label]:text-2xl [&_label]:font-medium [&_input]:text-2xl [&_input]:font-medium [&_input]:pb-4"
            />
          </div>

          {/* Name: 4 columns */}
          <div className="col-span-4">
            <StandardInput
              label="Name (Optional)"
              value={item.name || ''}
              onChange={(value) => onUpdate({ ...item, name: value })}
              placeholder={itemType === 'stock' ? 'Apple Inc.' : 'Bitcoin'}
              className="[&_label]:text-2xl [&_label]:font-medium [&_input]:text-2xl [&_input]:font-medium [&_input]:pb-4"
            />
          </div>

          {/* Remove button: 1 column */}
          <div className="col-span-1">
            <div className="flex items-end h-full pb-4">
              <button
                onClick={onDelete}
                className="w-full text-center text-3xl font-light text-gray-400 hover:text-red-500 transition-colors"
                title="Remove this item"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Cash/Debt fields (original layout)
        <div className="grid grid-cols-12 gap-8 items-end">
          {/* Asset/Liability name with smart suggestions: 8 columns */}
          <div className="col-span-8">
            <SmartInput
              label={type === 'asset' ? 'Asset' : 'Liability'}
              value={item.name}
              onChange={(value) => onUpdate({ ...item, name: value })}
              onSuggestionSelect={handleSuggestionSelect}
              suggestions={suggestions}
              placeholder={placeholder}
              className="[&_label]:text-2xl [&_label]:font-medium [&_input]:text-2xl [&_input]:font-medium [&_input]:pb-4"
            />
          </div>

          {/* Amount: 3 columns */}
          <div className="col-span-3">
            <StandardInput
              label={type === 'asset' ? 'Value' : 'Balance Owed'}
              type="currency"
              value={item.amount}
              onChange={(value) => onUpdate({ ...item, amount: value })}
              prefix="$"
              className="[&_label]:text-2xl [&_label]:font-medium [&_input]:text-2xl [&_input]:font-medium [&_input]:pb-4"
            />
          </div>

          {/* Remove button: 1 column - matching other steps' pattern */}
          <div className="col-span-1">
            <div className="flex items-end h-full pb-4">
              <button
                onClick={onDelete}
                className="w-full text-center text-3xl font-light text-gray-400 hover:text-red-500 transition-colors"
                title="Remove this item"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const NetWorthStep = ({ onNext, onBack, incomeData, savingsData, expensesData, savedData = null }) => {
  const { 
    items: assets, 
    addItem: addAsset, 
    updateItem: updateAsset, 
    deleteItem: deleteAsset,
    hasItems: hasAssets,
    setItems: setAssets
  } = useItemManager();

  const { 
    items: liabilities, 
    addItem: addLiability, 
    updateItem: updateLiability, 
    deleteItem: deleteLiability,
    hasItems: hasLiabilities,
    setItems: setLiabilities
  } = useItemManager();

  // Pre-populate with saved data
  useEffect(() => {
    if (savedData?.netWorth) {
      console.log('🔄 Loading saved net worth data:', savedData.netWorth);
      
      if (savedData.netWorth.assets?.length > 0) {
        setAssets(savedData.netWorth.assets);
      }
      if (savedData.netWorth.liabilities?.length > 0) {
        setLiabilities(savedData.netWorth.liabilities);
      }
    }
  }, [savedData, setAssets, setLiabilities]);

  const addAssetItem = () => {
    addAsset({
      name: '', 
      amount: ''
    });
  };

  const addLiabilityItem = () => {
    addLiability({
      name: '', 
      amount: ''
    });
  };

  // Calculate totals using Currency system
  const totalAssets = assets.reduce((sum, asset) => 
    Currency.add(sum, asset.amount || 0), 0
  );

  const totalLiabilities = liabilities.reduce((sum, liability) => 
    Currency.add(sum, liability.amount || 0), 0
  );

  const netWorth = Currency.subtract(totalAssets, totalLiabilities);

  const handleNext = () => {
    if (onNext) {
      onNext({
        assets,
        liabilities,
        totalAssets,
        totalLiabilities,
        netWorth
      });
    }
  };

  return (
    <>
      <ThemeToggle />
      <StandardFormLayout
        title="Calculate Your Net Worth"
        subtitle="Add up everything you own and subtract what you owe. This gives you your complete financial picture."
        onBack={onBack}
        onNext={handleNext}
        nextLabel="Complete Setup"
        canGoNext={true}
        showBack={true}
      >
        {/* Assets Section - Full Width */}
        <FormSection title="Assets (What You Own)">
          {hasAssets && (
            <div className="space-y-0 mb-8">
              {assets.map((asset) => (
                <NetWorthItem
                  key={asset.id}
                  item={asset}
                  onUpdate={(updatedAsset) => updateAsset(asset.id, updatedAsset)}
                  onDelete={() => deleteAsset(asset.id)}
                  type="asset"
                  placeholder="Cash, bonds, equities, home value"
                />
              ))}
            </div>
          )}
          
          <AddItemButton 
            onClick={addAssetItem}
            children={!hasAssets ? 'Add your first asset' : 'Add another asset'}
          />
        </FormSection>

        {/* Liabilities Section - Full Width */}
        <FormSection title="Liabilities (What You Owe)">
          {hasLiabilities && (
            <div className="space-y-0 mb-8">
              {liabilities.map((liability) => (
                <NetWorthItem
                  key={liability.id}
                  item={liability}
                  onUpdate={(updatedLiability) => updateLiability(liability.id, updatedLiability)}
                  onDelete={() => deleteLiability(liability.id)}
                  type="liability"
                  placeholder="Mortgage, auto loan, student loans"
                />
              ))}
            </div>
          )}
          
          <AddItemButton 
            onClick={addLiabilityItem}
            children={!hasLiabilities ? 'Add your first liability' : 'Add another liability'}
          />
        </FormSection>

        {/* Net Worth Summary - Always Visible at Bottom */}
        <FormSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <SummaryCard
              title="Total Assets"
              value={totalAssets}
            />
            <SummaryCard
              title="Total Liabilities"
              value={totalLiabilities}
            />
            <SummaryCard
              title="Net Worth"
              value={Currency.format(netWorth, { showCents: false })}
              className={Currency.compare(netWorth, 0) > 0 ? "[&>div:first-child]:text-green-500" : 
                        Currency.compare(netWorth, 0) < 0 ? "[&>div:first-child]:text-red-500" : ""}
            />
          </div>
        </FormSection>

      </StandardFormLayout>
    </>
  );
};
