import React, { useState, useEffect } from 'react';

import { useTheme } from 'contexts/ThemeContext';
import { ThemeToggle } from 'components/shared/ThemeToggle';
import { 
  StandardInput,
  AddItemButton,
  FormSection,
  StandardFormLayout,
  SummaryCard,
  useItemManager,
  validation
} from '../shared/FormComponents';

// Horizontal savings goal component matching IncomeSource layout
export const SavingsGoal = ({ goal, onUpdate, onDelete }) => {
  return (
    <div className="py-8">
      <div className="grid grid-cols-12 gap-8 items-end">
        {/* Goal name: 8 columns - generous space */}
        <div className="col-span-8">
          <StandardInput
            label="Savings Goal"
            value={goal.name}
            onChange={(value) => onUpdate({ ...goal, name: value })}
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
            value={savingsRate > 0 ? savingsRate.toString() : ''}
            onChange={onSavingsRateChange}
            placeholder="20"
            suffix="%"
            className="[&_label]:text-2xl [&_label]:font-medium [&_input]:text-2xl [&_input]:font-medium [&_input]:pb-4"
          />
        </div>
        
        {/* Monthly savings amount: 4 columns */}
        <div className="col-span-4">
          <StandardInput
            label="Monthly Savings"
            type="currency"
            value={monthlySavings}
            onChange={onMonthlySavingsChange}
            prefix="$"
            placeholder=""
            className="[&_label]:text-2xl [&_label]:font-medium [&_input]:text-2xl [&_input]:font-medium [&_input]:pb-4"
          />
        </div>
        
        {/* Description: 5 columns */}
        <div className="col-span-5">
          <div className="flex items-end h-full pb-3">
            <div>
              <p className={`text-lg font-light ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                to allocate to emergency fund and savings goals
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Custom checkbox component that fits editorial theme
const EditorialCheckbox = ({ checked, onChange, label, isDarkMode }) => {
  return (
    <label className="flex items-center gap-4 cursor-pointer group">
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="sr-only"
        />
        {/* Fixed size container to prevent movement */}
        <div className={`
          w-6 h-6 border-2 transition-colors duration-200 flex items-center justify-center
          ${checked 
            ? isDarkMode ? 'border-white bg-white' : 'border-black bg-black'
            : isDarkMode ? 'border-gray-600 bg-transparent' : 'border-gray-300 bg-transparent'
          }
        `}>
          {/* Checkmark positioned absolutely to not affect layout */}
          {checked && (
            <span className={`
              text-sm font-light leading-none
              ${isDarkMode ? 'text-black' : 'text-white'}
            `}>
              ✓
            </span>
          )}
        </div>
      </div>
      <span className={`text-2xl font-medium transition-colors duration-200 ${
        isDarkMode ? 'text-white group-hover:text-gray-300' : 'text-black group-hover:text-gray-700'
      }`}>
        {label}
      </span>
    </label>
  );
};

// Compact horizontal emergency fund section
export const EmergencyFundSection = ({ emergencyFund, setEmergencyFund, savingsRate, totalIncome }) => {
  const { isDarkMode } = useTheme();
  
  // Calculate monthly expenses based on their savings rate
  const expenseRate = 100 - savingsRate; // If 20% savings, then 80% expenses
  const monthlyExpenses = totalIncome > 0 ? (totalIncome * expenseRate / 100) / 12 : 0;
  const emergencyFundMin = monthlyExpenses * 3;
  const emergencyFundMax = monthlyExpenses * 6;

  return (
    <FormSection title="Emergency Fund">
      <div>
        {/* Top row - checkbox and input field - always same height */}
        <div className="grid grid-cols-12 gap-8 items-end min-h-[80px]">
          {/* Checkbox: 8 columns - fixed position */}
          <div className="col-span-8 flex items-end pb-4">
            <EditorialCheckbox
              checked={emergencyFund.hasExisting}
              onChange={(e) => setEmergencyFund(prev => ({ 
                ...prev, 
                hasExisting: e.target.checked,
                monthlyAmount: e.target.checked ? '' : prev.monthlyAmount
              }))}
              label="I already have a sufficient emergency fund"
              isDarkMode={isDarkMode}
            />
          </div>
          
          {/* Monthly contribution: 4 columns - always present but conditionally visible */}
          <div className={`col-span-4 transition-opacity duration-200 ${
            emergencyFund.hasExisting ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}>
            <StandardInput
              label="Monthly Contribution"
              type="currency"
              value={emergencyFund.monthlyAmount}
              onChange={(value) => setEmergencyFund(prev => ({ 
                ...prev, 
                monthlyAmount: value 
              }))}
              prefix="$"
              className="[&_label]:text-2xl [&_label]:font-medium [&_input]:text-2xl [&_input]:font-medium [&_input]:pb-4"
            />
          </div>
        </div>

        {/* Recommendation row - fixed height container, content fades in/out */}
        <div className={`min-h-[24px] transition-opacity duration-200 ${
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
  
  // Calculate initial values based on income
  const totalIncome = incomeData?.totalYearlyIncome || 0;
  
  // ✅ FIX: Initialize with calculated default values
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

  // ✅ FIX: Handle income changes and initialization properly
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

  // ✅ FIX: Load saved data properly
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
    if (newRateString === '') {
      setSavingsRate(0);
      setMonthlySavings('');
      return;
    }
    
    const cleanValue = newRateString.replace(/[^0-9]/g, '');
    const newRate = parseInt(cleanValue) || 0;
    const clampedRate = Math.max(0, Math.min(100, newRate));
    
    setSavingsRate(clampedRate);
    
    if (clampedRate > 0 && totalIncome > 0) {
      const newMonthlySavings = (totalIncome * clampedRate / 100) / 12;
      setMonthlySavings(newMonthlySavings.toFixed(2));
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
    const emergency = emergencyFund.hasExisting ? 0 : (parseFloat(emergencyFund.monthlyAmount) || 0);
    const goals = savingsGoals.reduce((sum, goal) => 
      sum + (parseFloat(goal.amount) || 0), 0
    );
    return emergency + goals;
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
        onBack={onBack}
        onNext={handleNext}
        canGoNext={true}
        showBack={true}
      >
        
        {/* Savings Rate Section */}
        <FormSection>
          <SavingsRateSection 
            savingsRate={savingsRate}
            monthlySavings={monthlySavings}
            onSavingsRateChange={handleSavingsRateChange}
            onMonthlySavingsChange={handleMonthlySavingsChange}
            totalIncome={totalIncome}
          />
        </FormSection>

        {/* Emergency Fund Section */}
        <EmergencyFundSection
          emergencyFund={emergencyFund}
          setEmergencyFund={setEmergencyFund}
          savingsRate={savingsRate}
          totalIncome={totalIncome}
        />

        {/* Savings Goals Section */}
        <FormSection title="Specific Savings Goals">
          {hasItems ? (
            <div className="space-y-0 mb-8">
              {savingsGoals.map((goal) => (
                <SavingsGoal
                  key={goal.id}
                  goal={goal}
                  onUpdate={(updatedGoal) => updateItem(goal.id, updatedGoal)}
                  onDelete={() => deleteItem(goal.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="text-2xl font-light mb-2">No savings goals yet</div>
              <div className="text-xl font-light">Add your first savings goal to get started</div>
            </div>
          )}

          <AddItemButton 
            onClick={addSavingsGoal}
            children={!hasItems ? 'Add your first savings goal' : 'Add another savings goal'}
          />
        </FormSection>

        {/* Savings Summary */}
        {(totalAllocatedSavings() > 0 || monthlySavingsAmount > 0) && (
          <FormSection>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <SummaryCard
                title="Total Monthly Savings"
                value={monthlySavingsAmount}
                subtitle="Your full savings budget"
                accent={true}
              />
              <SummaryCard
                title="Currently Allocated"
                value={totalAllocatedSavings()}
                subtitle="Emergency fund + goals"
              />
              <SummaryCard
                title="Available for New Goals"
                value={remainingAmount}
                subtitle={remainingAmount < 0 ? 'Over allocated!' : remainingAmount === 0 ? 'Fully allocated' : 'Ready to allocate'}
              />
            </div>
          </FormSection>
        )}

      </StandardFormLayout>
    </>
  );
};
