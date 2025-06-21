import React from 'react';

import { ThemeToggle } from 'components/shared/ThemeToggle';
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
} from '../shared/FormComponents';

// Clean net worth item component using 12-column grid
export const NetWorthItem = ({ item, onUpdate, onDelete, type, placeholder }) => {
  return (
    <FormGrid>
      {/* Asset/Liability name: 8 columns */}
      <FormField span={8}>
        <StandardInput
          label={type === 'asset' ? 'Asset' : 'Liability'}
          value={item.name}
          onChange={(value) => onUpdate({ ...item, name: value })}
          placeholder={placeholder}
        />
      </FormField>
      
      {/* Amount: 3 columns */}
      <FormField span={3}>
        <StandardInput
          label={type === 'asset' ? 'Value' : 'Balance Owed'}
          type="currency"
          value={item.amount}
          onChange={(value) => onUpdate({ ...item, amount: value })}
          prefix="$"
        />
      </FormField>
      
      {/* Remove button: 1 column */}
      <RemoveButton 
        onClick={onDelete}
        children="Remove"
      />
    </FormGrid>
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

  // 🔧 FIX: Pre-populate with saved data
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

  // Calculate totals
  const totalAssets = assets.reduce((sum, asset) => 
    sum + (parseFloat(asset.amount) || 0), 0
  );

  const totalLiabilities = liabilities.reduce((sum, liability) => 
    sum + (parseFloat(liability.amount) || 0), 0
  );

  const netWorth = totalAssets - totalLiabilities;

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
        
        {/* Net Worth Summary */}
        {(totalAssets > 0 || totalLiabilities > 0) && (
          <>
            <SectionBorder />
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
                  value={`${netWorth >= 0 ? '' : '-'}$${Math.abs(netWorth).toLocaleString()}`}
                  subtitle={netWorth >= 0 ? 'Positive net worth' : 'Room to grow'}
                  accent={netWorth >= 0}
                />
              </div>
            </FormSection>
          </>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Assets Section */}
          <div>
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
          </div>

          {/* Liabilities Section */}
          <div>
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
          </div>
        </div>

        {/* Privacy & Next Steps */}
        <div className={`mt-16 p-8 border-l-4 border-gray-300 bg-gray-100`}>
          <h3 className={`text-xl font-light mb-4 text-black`}>
            Your Privacy Matters
          </h3>
          <div className={`space-y-3 text-base font-light text-gray-600`}>
            <p>All your financial data stays on your device - we never see it</p>
            <p>Import bank transactions via CSV for automatic categorization</p>
            <p>Track progress toward your savings goals over time</p>
            <p>Get insights into spending patterns and budget optimization</p>
          </div>
        </div>

      </StandardFormLayout>
    </>
  );
}
