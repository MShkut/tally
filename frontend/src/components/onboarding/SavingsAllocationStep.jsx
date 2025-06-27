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
        {/* Goal name: 8 columns - generous space */}
        <div className="col-span-8">
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
        
        {/* Monthly amount: 3 columns */}
        <div className="col-span-3">
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

// Compact savings rate section with dual input - % or $ amount
export const SavingsRateSection = ({ savingsRate, monthlySavings, onSavingsRateChange, onMonthlySavingsChange, totalIncome }) => {
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
            placeholder="20%"
            className="[&_label]:text-2xl [&_label]:font-medium [&_input]:text-2xl [&_input]:font-medium [&_input]:pb-4"
          />
        </div>
        
        {/* OR divider: 1 column */}
        <div className="col-span-1 text-center">
          <div className={`text-xl font-light pb-4 ${
            isDarkMode ? 'text-gray-500' : 'text-gray-400'
          }`}>
            or
          </div>
        </div>
        
        {/* Monthly savings amount: 4 columns */}
        <div className="col-span-4">
          <StandardInput
            label="Monthly Savings Amount"
            type="currency"
            value={monthlySavings}
            onChange={onMonthlySavingsChange}
            prefix="$"
            placeholder="0.00"
            className="[&_label]:text-2xl [&_label]:font-medium [&_input]:text-2xl [&_input]:font-medium [&_input]:pb-4"
          />
        </div>
        
        {/* Spacer: 4 columns */}
        <div className="col-span-4">
          {totalIncome > 0 && monthlySavings && (
            <div className={`text-base font-light pb-4 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Monthly income: ${(totalIncome / 12).toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Emergency fund section with conditional monthly amount
export const EmergencyFundSection = ({ emergencyFund, onUpdate, monthlyExpenses = 0 }) => {
  const { isDarkMode } = useTheme();
  
  const emergencyFundMin = monthlyExpenses * 3;
  const emergencyFundMax = monthlyExpenses * 6;

  return (
    <FormSection>
      <h3 className="text-3xl font-light leading-tight mb-8">Emergency Fund</h3>
      
      <div className="py-8">
        <div className="grid grid-cols-12 gap-8 items-end">
          {/* Checkbox: 2 columns */}
          <div className="col-span-2">
            <div className="flex items-end h-full pb-4">
              <input
                type="checkbox"
                checked={emergencyFund.hasExisting}
                onChange={(e) => onUpdate({ 
                  ...emergencyFund, 
                  hasExisting: e.target.checked,
                  monthlyAmount: e.target.checked ? '' : emergencyFund.monthlyAmount
                })}
                className="w-6 h-6"
              />
            </div>
          </div>
          
          {/* Label: 4 columns */}
          <div className="col-span-4">
            <label className={`text-2xl font-medium ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              I already have an emergency fund
            </label>
          </div>
          
          {/* Monthly amount (conditional): 3 columns */}
          <div className="col-span-3">
            {!emergencyFund.hasExisting && (
              <StandardInput
                label="Monthly Amount"
                type="currency"
                value={emergencyFund.monthlyAmount}
                onChange={(value) => onUpdate({ ...emergencyFund, monthlyAmount: value })}
                prefix="$"
                placeholder="0.00"
                className="[&_label]:text-2xl [&_label]:font-medium [&_input]:text-2xl [&_input]:font-medium [&_input]:pb-4"
              />
            )}
          </div>
          
          {/* Spacer: 3 columns */}
          <div className="col-span-3"></div>
        </div>
        
        {/* Recommendation text (conditional) */}
        <div className={`transition-opacity duration-300 ${
          !emergencyFund.hasExisting && monthlyExpenses > 0 
            ? 'opacity-100' 
            : 'opacity-0'
        }`}>
          <div className="grid grid-cols-12 gap-8 items-center">
            <div className="col-span-12">
              <p className={`text-base font-light ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Recommended: ${emergencyFundMin.toLocaleString()} - ${emergencyFundMax.toLocaleString()} 
                <span className="ml-2">
                  (3-6 months of your ${monthlyExpenses.toLocaleString()} monthly expenses)
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </FormSection>
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
      return defaultMonthlySavings.toFixed(2);
    }
    return '';
  };

  const [savingsRate, setSavingsRate] = useState(getInitialSavingsRate);
  const [monthlySavings, setMonthlySavings] = useState(getInitialMonthlySavings);
  const [emergencyFund, setEmergencyFund] = useState({
    hasExisting: false,
    monthlyAmount: ''
  });
  const [hasInitialized, setHasInitialized] = useState(false);

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
      setMonthlySavings(defaultMonthlySavings.toFixed(2));
      setSavingsRate(20);
      setHasInitialized(true);
    }
    // If income changes and we have initialized, update the dollar amount to match current %
    else if (hasInitialized && totalIncome > 0 && savingsRate > 0) {
      const newMonthlySavings = (totalIncome * savingsRate / 100) / 12;
      setMonthlySavings(newMonthlySavings.toFixed(2));
    }
  }, [totalIncome, hasInitialized, savingsRate, savedData]);

  // Load saved data properly
  useEffect(() => {
    if (savedData?.savingsAllocation) {
      const saved = savedData.savingsAllocation;
      console.log('🔄 Loading saved savings data:', saved);
      
      if (saved.savingsRate) setSavingsRate(saved.savingsRate);
      if (saved.monthlySavings) {
        setMonthlySavings(saved.monthlySavings.toString());
      }
      if (saved.emergencyFund) setEmergencyFund(saved.emergencyFund);
      if (saved.savingsGoals?.length > 0) setItems(saved.savingsGoals);
      setHasInitialized(true); // Mark as initialized when loading saved data
    }
  }, [savedData, setItems]);

  // Handle savings rate change - update monthly savings when user enters %
  const handleSavingsRateChange = (newRateString) => {
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

  const addSavingsGoal = () => {
    addItem({
      name: '', 
      amount: ''
    });
  };

  // Calculate totals
  const totalAllocatedSavings = () => {
    const emergency = emergencyFund.hasExisting ? 0 : 
      Currency.toCents(emergencyFund.monthlyAmount) / 100;
    const goals = savingsGoals.reduce((sum, goal) => 
      Currency.add(sum, goal.amount || 0), 0
    );
    return Currency.add(emergency, goals);
  };

  const monthlySavingsAmount = parseFloat(monthlySavings) || 0;
  const remainingAmount = monthlySavingsAmount - totalAllocatedSavings();

  const handleNext = () => {
    if (onNext) {
      onNext({
        savingsRate,
        monthlySavings: monthlySavingsAmount,
        yearlySavings: monthlySavingsAmount * 12,
        emergencyFund,
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
        subtitle="How much of your income do you want to save? Then allocate those savings to specific goals."
        onNext={handleNext}
        onBack={onBack}
        nextLabel="Continue to Expenses"
        backLabel="Back to Income"
        isValid={monthlySavingsAmount > 0}
      >
        {/* Savings Rate Section */}
        <SavingsRateSection
          savingsRate={savingsRate}
          monthlySavings={monthlySavings}
          onSavingsRateChange={handleSavingsRateChange}
          onMonthlySavingsChange={handleMonthlySavingsChange}
          totalIncome={totalIncome}
        />

        {/* Emergency Fund Section */}
        <EmergencyFundSection
          emergencyFund={emergencyFund}
          onUpdate={setEmergencyFund}
          monthlyExpenses={3000} // TODO: Get from actual expense data
        />

        {/* Savings Goals Section */}
        <FormSection>
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-3xl font-light leading-tight">Savings Goals</h3>
            <AddItemButton 
              onClick={addSavingsGoal}
              label="Add Goal"
            />
          </div>

          {hasItems ? (
            <div className="space-y-1">
              {savingsGoals.map((goal, index) => (
                <SavingsGoal
                  key={goal.id || index}
                  goal={goal}
                  onUpdate={(updatedGoal) => updateItem(index, updatedGoal)}
                  onDelete={() => deleteItem(index)}
                  savingsSuggestions={savingsSuggestions}
                />
              ))}
            </div>
          ) : (
            <div className={`text-base font-light ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`}>
              Add specific savings goals to track your progress
            </div>
          )}
        </FormSection>

        {/* Summary Section */}
        {monthlySavingsAmount > 0 && (
          <SummaryCard
            title="Savings Allocation Summary"
            items={[
              { 
                label: 'Total Monthly Savings', 
                value: Currency.format(monthlySavingsAmount) 
              },
              { 
                label: 'Emergency Fund', 
                value: emergencyFund.hasExisting 
                  ? 'Already have one' 
                  : Currency.format(emergencyFund.monthlyAmount || 0)
              },
              { 
                label: 'Goals Total', 
                value: Currency.format(
                  savingsGoals.reduce((sum, goal) => 
                    Currency.add(sum, goal.amount || 0), 0
                  )
                )
              },
              { 
                label: 'Unallocated', 
                value: Currency.format(Math.max(0, remainingAmount)),
                highlight: remainingAmount !== 0 
              }
            ]}
          />
        )}
      </StandardFormLayout>
    </>
  );
};
