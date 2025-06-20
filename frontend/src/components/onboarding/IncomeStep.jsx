import React from 'react';

import { ThemeToggle } from 'components/shared/ThemeToggle';
import { 
  FormGrid, 
  FormField, 
  StandardInput,
  StandardSelect,
  RemoveButton,
  AddItemButton,
  FormSection,
  StandardFormLayout,
  SummaryCard,
  SectionBorder,
  useItemManager,
  validation
} from '../shared/FormComponents';

// Clean income source component using 12-column grid
export const IncomeSource = ({ source, onUpdate, onDelete }) => {
  const frequencyOptions = [
    { value: 'Yearly', label: 'Yearly' },
    { value: 'Monthly', label: 'Monthly' },
    { value: 'Bi-weekly', label: 'Bi-weekly' },
    { value: 'Weekly', label: 'Weekly' }
  ];

  return (
    <FormGrid>
      {/* Income source name: 6 columns */}
      <FormField span={6}>
        <StandardInput
          label="Source Name"
          value={source.name}
          onChange={(value) => onUpdate({ ...source, name: value })}
          placeholder="Salary, consulting, investment income"
        />
      </FormField>
      
      {/* Amount: 3 columns */}
      <FormField span={3}>
        <StandardInput
          label="Amount"
          type="currency"
          value={source.amount}
          onChange={(value) => onUpdate({ ...source, amount: value })}
          prefix="$"
        />
      </FormField>
      
      {/* Frequency: 2 columns */}
      <FormField span={2}>
        <StandardSelect
          label="Frequency"
          value={source.frequency}
          onChange={(value) => onUpdate({ ...source, frequency: value })}
          options={frequencyOptions}
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

export const IncomeStep = ({ onNext, onBack }) => {
  // Use professional item manager
  const { 
    items: incomeSources, 
    addItem, 
    updateItem, 
    deleteItem,
    hasItems 
  } = useItemManager();

  const addIncomeSource = () => {
    addItem({
      name: '', 
      amount: '', 
      frequency: 'Yearly'
    });
  };

  // Financial calculations
  const convertToYearly = (amount, frequency) => {
    const num = parseFloat(amount) || 0;
    const multipliers = {
      'Weekly': 52,
      'Bi-weekly': 26,
      'Monthly': 12,
      'Yearly': 1
    };
    return num * (multipliers[frequency] || 1);
  };

  const totalYearlyIncome = incomeSources.reduce((total, source) => {
    return total + convertToYearly(source.amount, source.frequency);
  }, 0);

  const monthlyIncome = totalYearlyIncome / 12;

  // Validation
  const canContinue = totalYearlyIncome > 0 && incomeSources.every(source => 
    validation.hasValidString(source.name) && validation.isPositiveNumber(source.amount)
  );

  const handleNext = () => {
    if (onNext && canContinue) {
      onNext({ incomeSources, totalYearlyIncome, monthlyIncome });
    }
  };

  return (
    <>
      <ThemeToggle />
      <StandardFormLayout
        title="Let's Start with Your Income"
        subtitle="Enter all sources of regular income to build your financial foundation"
        onBack={onBack}
        onNext={handleNext}
        canGoNext={canContinue}
        showBack={true}
      >
        
        {/* Income Sources Section */}
        <FormSection>
          {hasItems && (
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center">
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
              </div>
            </FormSection>
          </>
        )}

      </StandardFormLayout>
    </>
  );
}
