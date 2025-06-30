import React, { useState, useEffect } from 'react';

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

// Enhanced net worth item component with smart suggestions
export const NetWorthItem = ({ item, onUpdate, onDelete, type, placeholder }) => {
  // Get suggestions from unified categorySuggestions system
  const suggestions = loadCategoriesWithCustom(type === 'asset' ? 'assets' : 'liabilities');
  
  const handleSuggestionSelect = (suggestion) => {
    // When a suggestion is selected, update the name
    onUpdate({ ...item, name: suggestion.name });
  };

  return (
    <div className="py-8">
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
