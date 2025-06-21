import React, { useEffect } from 'react';

import { ThemeToggle } from 'components/shared/ThemeToggle';
import { FrequencySelector } from 'components/shared/FrequencySelector';
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
  validation,
  formatCurrency
} from '../shared/FormComponents';
import { 
  convertToYearly,
  calculateTotalYearlyIncome,
  analyzeIncomeDistribution
} from 'utils/incomeHelpers';

// Income Source component using shared utilities
export const IncomeSource = ({ source, onUpdate, onDelete }) => {
  const yearlyAmount = convertToYearly(source.amount, source.frequency);
  const showYearlyEquivalent = source.amount && source.frequency !== 'Yearly';

  return (
    <div className="py-6">
      <FormGrid>
        {/* Income source name: 8 columns (largest) */}
        <FormField span={8}>
          <StandardInput
            label="Income Source"
            value={source.name}
            onChange={(value) => onUpdate({ ...source, name: value })}
            placeholder="Salary, consulting, freelance, investments"
            required
            className="[&_label]:text-2xl [&_label]:font-medium [&_input]:text-2xl [&_input]:font-medium [&_input]:pb-4"
          />
        </FormField>
        
        {/* Amount: 2 columns (middle) */}
        <FormField span={2}>
          <StandardInput
            label="Amount"
            type="currency"
            value={source.amount}
            onChange={(value) => onUpdate({ ...source, amount: value })}
            prefix="$"
            required
            className="[&_label]:text-2xl [&_label]:font-medium [&_input]:text-2xl [&_input]:font-medium [&_input]:pb-4 [&_span]:text-2xl"
          />
        </FormField>
        
        {/* Frequency selector: 2 columns (right) */}
        <FormField span={2}>
          <FrequencySelector
            frequency={source.frequency}
            onChange={(value) => onUpdate({ ...source, frequency: value })}
            allowOneTime={true}
            className="[&_label]:text-2xl [&_label]:font-medium [&_button]:text-2xl [&_button]:font-medium [&_button]:pb-4"
          />
        </FormField>
      </FormGrid>
      
      {/* Remove button - below the row */}
      <div className="text-right mt-2">
        <button
          onClick={onDelete}
          className="text-xl font-light text-gray-500 hover:text-gray-700 transition-colors"
        >
          Remove
        </button>
      </div>
      
      {/* Yearly equivalent display */}
      {showYearlyEquivalent && (
        <div className="text-xl font-light text-gray-500 italic mt-2">
          ≈ {formatCurrency(yearlyAmount)} per year
        </div>
      )}
    </div>
  );
};

export const IncomeStep = ({ onNext, onBack, savedData = null }) => {
  // Use professional item manager for income sources
  const { 
    items: incomeSources, 
    addItem, 
    updateItem, 
    deleteItem,
    hasItems,
    setItems 
  } = useItemManager();

  // 🔧 FIX: Load saved data when component mounts
  useEffect(() => {
    if (savedData?.income?.incomeSources?.length > 0) {
      console.log('🔄 Loading saved income sources:', savedData.income.incomeSources);
      setItems(savedData.income.incomeSources);
    }
  }, [savedData, setItems]);

  const addIncomeSource = () => {
    addItem({
      name: '', 
      amount: '', 
      frequency: 'Monthly'
    });
  };

  // Use utility functions for calculations
  const totalYearlyIncome = calculateTotalYearlyIncome(incomeSources);
  const monthlyIncome = totalYearlyIncome / 12;
  const insights = analyzeIncomeDistribution(incomeSources);
  
  // Simple validation - just check if we have valid data
  const canContinue = totalYearlyIncome > 0 && incomeSources.every(source => 
    validation.hasValidString(source.name) && validation.isPositiveNumber(source.amount)
  );

  const handleNext = () => {
    if (onNext && canContinue) {
      onNext({ 
        incomeSources, 
        totalYearlyIncome, 
        monthlyIncome,
        insights 
      });
    }
  };

  return (
    <>
      <ThemeToggle />
      <StandardFormLayout
        title="Your Income Sources"
        subtitle="Start by entering all sources of regular income. This forms the foundation of your financial plan."
        onBack={onBack}
        onNext={handleNext}
        canGoNext={canContinue}
        nextLabel="Continue to Savings"
        showBack={true}
      >
        
        {/* Income Sources Section */}
        <FormSection>
          {hasItems ? (
            <div className="space-y-0 mb-8">
              {incomeSources.map((source) => (
                <IncomeSource
                  key={source.id}
                  source={source}
                  onUpdate={(updatedSource) => updateItem(source.id, updatedSource)}
                  onDelete={() => deleteItem(source.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="text-2xl font-light mb-2">No income sources yet</div>
              <div className="text-xl font-light">Add your first income source to get started</div>
            </div>
          )}

          <AddItemButton 
            onClick={addIncomeSource}
            children={!hasItems ? 'Add your first income source' : 'Add another income source'}
          />
        </FormSection>

        {/* Summary Section */}
        {totalYearlyIncome > 0 && (
          <>
            <SectionBorder />
            <FormSection>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <SummaryCard
                  title="Total Yearly Income"
                  value={totalYearlyIncome}
                  accent={true}
                />
                <SummaryCard
                  title="Monthly Income" 
                  value={monthlyIncome}
                  subtitle="Available for budgeting"
                />
                <SummaryCard
                  title="Income Sources"
                  value={`${incomeSources.length} source${incomeSources.length === 1 ? '' : 's'}`}
                  subtitle={insights?.isDiversified ? 'Well diversified' : 'Consider diversifying'}
                />
              </div>
            </FormSection>
          </>
        )}

      </StandardFormLayout>
    </>
  );
};
