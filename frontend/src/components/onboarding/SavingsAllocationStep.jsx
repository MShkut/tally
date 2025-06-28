// frontend/src/components/onboarding/SavingsAllocationStep.jsx
import React, { useState, useEffect } from 'react';

import { useTheme } from 'contexts/ThemeContext';
import { ThemeToggle } from 'components/shared/ThemeToggle';
import { FrequencySelector } from 'components/shared/FrequencySelector';
import { SmartInput } from 'components/shared/SmartInput';
import { Currency } from 'utils/currency';
import { 
  StandardInput,
  AddItemButton,
  FormSection,
  StandardFormLayout,
  SummaryCard,
  useItemManager,
  validation
} from '../shared/FormComponents';
import { 
  loadCategoriesWithCustom, 
  saveCustomCategory 
} from 'utils/categorySuggestions';
import { convertToYearly } from 'utils/incomeHelpers';

// Horizontal savings goal component matching IncomeSource layout
export const SavingsGoal = ({ goal, onUpdate, onDelete, savingsSuggestions }) => {
  return (
    <div className="py-8">
      <div className="grid grid-cols-12 gap-8 items-end">
        {/* Goal name: 7 columns - generous space like income */}
        <div className="col-span-7">
          <SmartInput
            label="Savings Goal"
            value={goal.name}
            onChange={(value) => onUpdate({ ...goal, name: value })}
            onSuggestionSelect={(suggestion) => onUpdate({ ...goal, name: suggestion.name })}
            suggestions={savingsSuggestions}
            placeholder="Down payment, vacation, retirement"
            className="[&_label]:text-2xl [&_label]:font-medium [&_input]:text-2xl [&_input]:font-medium [&_input]:pb-4"
          />
        </div>
        
        {/* Monthly amount: 4 columns like income */}
        <div className="col-span-4">
          <StandardInput
            label="Monthly Amount"
            type="currency"
            value={goal.amount}
            onChange={(value) => onUpdate({ ...goal, amount: value })}
            prefix="$"
            className="[&_label]:text-2xl [&_label]:font-medium [&_input]:text-2xl [&_input]:font-medium [&_input]:pb-4"
          />
        </div>
        
        {/* Remove button: 1 column */}
        <div className="col-span-1">
          <div className="flex items-end h-full pb-4">
            <button
              onClick={onDelete}
              className="w-full text-center text-3xl font-light text-gray-400 hover:text-red-500 transition-colors"
              title="Remove this savings goal"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Savings rate section matching income categories format
export const SavingsRateSection = ({ savingsRate, monthlySavings, onSavingsRateChange, onMonthlySavingsChange, onFieldBlur, totalIncome }) => {
  const { isDarkMode } = useTheme();

  return (
    <div className="py-8">
      <div className="grid grid-cols-12 gap-8 items-end">
        {/* Savings rate %: 3 columns */}
        <div className="col-span-3">
          <StandardInput
            label="Savings Rate"
            value={savingsRate > 0 ? `${savingsRate}%` : ''}
            onChange={onSavingsRateChange}
            onBlur={onFieldBlur}
            placeholder="20%"
            className="[&_label]:text-2xl [&_label]:font-medium [&_input]:text-2xl [&_input]:font-medium [&_input]:pb-4"
          />
        </div>
        
        {/* OR divider: 1 column */}
        <div className="col-span-1 text-center">
          <div className={`text-xl font-light pb-4 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            or
          </div>
        </div>
        
        {/* Monthly savings amount: 4 columns */}
        <div className="col-span-4">
          <StandardInput
            label="Monthly Amount"
            type="currency"
            value={monthlySavings}
            onChange={onMonthlySavingsChange}
            onBlur={onFieldBlur}
            prefix="$"
            placeholder="0.00"
            className="[&_label]:text-2xl [&_label]:font-medium [&_input]:text-2xl [&_input]:font-medium [&_input]:pb-4"
          />
        </div>
        
        {/* Spacer: 4 columns */}
        <div className="col-span-4">
        </div>
      </div>
    </div>
  );
};


export const SavingsAllocationStep = ({ onNext, onBack, incomeData, savedData = null }) => {
  const { isDarkMode } = useTheme();
  const [savingsSuggestions, setSavingsSuggestions] = useState([]);

  useEffect(() => {
    setSavingsSuggestions(loadCategoriesWithCustom('savings'));
  }, []);

  // Calculate initial values based on income
  const totalIncome = incomeData?.totalYearlyIncome || 0;
  
  // Initialize with calculated default values
  const getInitialSavingsRate = () => {
    if (savedData?.savingsAllocation?.savingsRate) {
      return savedData.savingsAllocation.savingsRate;
    }
    return 20; // Default 20%
  };

  const getInitialMonthlySavings = () => {
    if (savedData?.savingsAllocation?.monthlySavings) {
      return savedData.savingsAllocation.monthlySavings.toString();
    }
    // Calculate 20% of income as default
    if (totalIncome > 0) {
      const defaultMonthlySavings = (totalIncome * 20 / 100) / 12;
      return defaultMonthlySavings.toString();
    }
    return '';
  };

  const [savingsRate, setSavingsRate] = useState(getInitialSavingsRate);
  const [monthlySavings, setMonthlySavings] = useState(getInitialMonthlySavings);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [activeField, setActiveField] = useState(null); // Track which field is being edited

  const { 
    items: savingsGoals, 
    addItem, 
    updateItem, 
    deleteItem,
    hasItems,
    setItems
  } = useItemManager();

  // Handle income changes and initialization properly
  useEffect(() => {
    // Only set defaults if we haven't initialized and there's no saved data
    if (!hasInitialized && totalIncome > 0 && !savedData?.savingsAllocation) {
      const defaultMonthlySavings = (totalIncome * 20 / 100) / 12;
      setMonthlySavings(Currency.formatInput(defaultMonthlySavings));
      setSavingsRate(20);
      setHasInitialized(true);
    }
    // If income changes and we have initialized, update the dollar amount to match current %
    // But only if user is not actively editing the monthly savings field
    else if (hasInitialized && totalIncome > 0 && savingsRate > 0 && activeField !== 'monthlySavings') {
      const newMonthlySavings = (totalIncome * savingsRate / 100) / 12;
      setMonthlySavings(Currency.formatInput(newMonthlySavings));
    }
  }, [totalIncome, hasInitialized, savingsRate, savedData]);

  // Load saved data properly
  useEffect(() => {
    if (savedData?.savingsAllocation) {
      const saved = savedData.savingsAllocation;
      console.log('🔄 Loading saved savings data:', saved);
      
      if (saved.savingsRate) setSavingsRate(saved.savingsRate);
      if (saved.monthlySavings) {
        setMonthlySavings(Currency.formatInput(saved.monthlySavings));
      }
      if (saved.savingsGoals?.length > 0) setItems(saved.savingsGoals);
      setHasInitialized(true); // Mark as initialized when loading saved data
    }
  }, [savedData, setItems]);

  // Handle savings rate change - update monthly savings when user enters %
  const handleSavingsRateChange = (newRateString) => {
    setActiveField('savingsRate');
    const cleanValue = newRateString.replace(/[^0-9]/g, '');
    const newRate = parseInt(cleanValue) || 0;
    const clampedRate = Math.max(0, Math.min(100, newRate));
    
    setSavingsRate(clampedRate);
    
    if (clampedRate > 0 && totalIncome > 0) {
      const newMonthlySavings = Currency.fromYearly(
        Currency.multiply(totalIncome, clampedRate / 100), 
        'Monthly'
      );
      setMonthlySavings(Currency.formatInput(newMonthlySavings));
    } else if (clampedRate === 0) {
      setMonthlySavings('');
    }
  };

  // Handle monthly savings change - update savings rate
  const handleMonthlySavingsChange = (newMonthlySavings) => {
    setActiveField('monthlySavings');
    setMonthlySavings(newMonthlySavings);
    
    if (newMonthlySavings === '') {
      setSavingsRate(0);
      return;
    }
    
    if (totalIncome > 0) {
      const monthlyIncome = totalIncome / 12;
      const savingsAmount = parseFloat(newMonthlySavings) || 0;
      const newRate = Math.round((savingsAmount / monthlyIncome) * 100);
      setSavingsRate(Math.max(0, Math.min(100, newRate)));
    }
  };

  // Clear active field when user finishes editing
  const handleFieldBlur = () => {
    setActiveField(null);
  };

  const addSavingsGoal = () => {
    addItem({
      name: '', 
      amount: ''
    });
  };

  // Calculate totals
  const totalAllocatedSavings = () => {
    return savingsGoals.reduce((sum, goal) => 
      Currency.add(sum, goal.amount || 0), 0
    );
  };

  const monthlySavingsAmount = parseFloat(monthlySavings) || 0;
  const remainingAmount = monthlySavingsAmount - totalAllocatedSavings();

  const handleNext = () => {
    if (onNext) {
      onNext({
        savingsRate,
        monthlySavings: monthlySavingsAmount,
        yearlySavings: monthlySavingsAmount * 12,
        savingsGoals,
        totalAllocated: totalAllocatedSavings(),
        remainingAmount
      });
    }
  };

  return (
    <>
      <ThemeToggle />
      <StandardFormLayout
        title="Set Your Savings Rate"
        subtitle="How much of your income do you want to save? Then allocate those savings to specific goals like emergency fund, vacation, down payment, etc."
        onNext={handleNext}
        onBack={onBack}
        nextLabel="Continue"
        backLabel="Back"
        isValid={monthlySavingsAmount > 0}
      >
        {/* Savings Rate Section */}
        <FormSection>
          <SavingsRateSection
            savingsRate={savingsRate}
            monthlySavings={monthlySavings}
            onSavingsRateChange={handleSavingsRateChange}
            onMonthlySavingsChange={handleMonthlySavingsChange}
            onFieldBlur={handleFieldBlur}
            totalIncome={totalIncome}
          />
        </FormSection>


        {/* Savings Goals Section */}
        <FormSection>
          {hasItems && (
            <div className="space-y-0 mb-8">
              {savingsGoals.map((goal) => (
                <SavingsGoal
                  key={goal.id}
                  goal={goal}
                  onUpdate={(updatedGoal) => updateItem(goal.id, updatedGoal)}
                  onDelete={() => deleteItem(goal.id)}
                  savingsSuggestions={savingsSuggestions}
                />
              ))}
            </div>
          )}

          <AddItemButton 
            onClick={addSavingsGoal}
            children={!hasItems ? 'Add your first savings goal' : 'Add another savings goal'}
          />
        </FormSection>

        {/* Summary Section */}
        <FormSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <SummaryCard
              title="Monthly Savings"
              value={monthlySavingsAmount}
              accent={true}
            />
            <SummaryCard
              title="Savings Goals"
              value={`${savingsGoals.length} goal${savingsGoals.length === 1 ? '' : 's'}`}
            />
            <SummaryCard
              title={remainingAmount < 0 ? "Overallocated" : "Unallocated"}
              value={Currency.format(Math.abs(remainingAmount), { showCents: true })}
              className={remainingAmount < 0 ? "[&>div:first-child]:text-red-500" : ""}
            />
          </div>
        </FormSection>
      </StandardFormLayout>
    </>
  );
};
