import React, { useState, useEffect } from 'react'; // ← FIXED: Added useEffect

import { useTheme } from 'contexts/ThemeContext';
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

// Clean savings goal component using 12-column grid
export const SavingsGoal = ({ goal, onUpdate, onDelete }) => {
  return (
    <FormGrid>
      {/* Goal name: 8 columns */}
      <FormField span={8}>
        <StandardInput
          label="Savings Goal"
          value={goal.name}
          onChange={(value) => onUpdate({ ...goal, name: value })}
          placeholder="Down payment, vacation, retirement"
          required
        />
      </FormField>
      
      {/* Monthly amount: 3 columns */}
      <FormField span={3}>
        <StandardInput
          label="Monthly Amount"
          type="currency"
          value={goal.amount}
          onChange={(value) => onUpdate({ ...goal, amount: value })}
          prefix="$"
          required
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

// Standardized savings rate input using FormComponents
export const SavingsRateSection = ({ savingsRate, onChange }) => {
  const { isDarkMode } = useTheme();

  const handleSavingsRateChange = (value) => {
    const cleanValue = value.replace(/[^0-9]/g, ''); // Only allow numbers
    const numValue = parseInt(cleanValue) || 0;
    
    // Clamp between 0 and 100
    const clampedValue = Math.max(0, Math.min(100, numValue));
    onChange(clampedValue);
  };

  return (
    <FormGrid>
      <FormField span={3}>
        <StandardInput
          label="Savings Rate"
          value={savingsRate}
          onChange={handleSavingsRateChange}
          placeholder="20"
          suffix="%"
        />
      </FormField>
      <FormField span={9}>
        <div className={`flex items-end h-full pb-3`}>
          <div>
            <p className={`text-lg font-light ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              of your income saved each month
            </p>
            {savingsRate > 50 && (
              <p className={`text-sm mt-2 ${
                isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
              }`}>
                That's an ambitious savings rate! Make sure you have enough left for essential expenses.
              </p>
            )}
          </div>
        </div>
      </FormField>
    </FormGrid>
  );
};

// Emergency fund section using FormComponents
export const EmergencyFundSection = ({ emergencyFund, setEmergencyFund, estimatedMonthlyExpenses }) => {
  const { isDarkMode } = useTheme();
  
  const emergencyFundMin = estimatedMonthlyExpenses * 3;
  const emergencyFundMax = estimatedMonthlyExpenses * 6;

  return (
    <FormSection title="Emergency Fund">
      <FormGrid>
        <FormField span={12}>
          <label className="flex items-center gap-3 mb-6">
            <input
              type="checkbox"
              checked={emergencyFund.hasExisting}
              onChange={(e) => setEmergencyFund(prev => ({ 
                ...prev, 
                hasExisting: e.target.checked,
                monthlyAmount: e.target.checked ? '' : prev.monthlyAmount
              }))}
              className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-black'}`}
            />
            <span className={`text-lg font-light ${
              isDarkMode ? 'text-white' : 'text-black'
            }`}>
              I already have a sufficient emergency fund
            </span>
          </label>
        </FormField>
      </FormGrid>

      {!emergencyFund.hasExisting && (
        <FormGrid>
          <FormField span={4}>
            <StandardInput
              label="Monthly Emergency Fund Contribution"
              type="currency"
              value={emergencyFund.monthlyAmount}
              onChange={(value) => setEmergencyFund(prev => ({ 
                ...prev, 
                monthlyAmount: value 
              }))}
              prefix="$"
            />
          </FormField>
          <FormField span={8}>
            <div className={`flex items-end h-full pb-3`}>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Recommended: ${emergencyFundMin.toLocaleString()} - ${emergencyFundMax.toLocaleString()} 
                (3-6 months of expenses)
              </p>
            </div>
          </FormField>
        </FormGrid>
      )}
    </FormSection>
  );
};

export const SavingsAllocationStep = ({ onNext, onBack, incomeData, savedData = null }) => {
  const { isDarkMode } = useTheme(); // ← FIXED: Added useTheme for tips section
  
  // ← FIXED: Only declare state once
  const [savingsRate, setSavingsRate] = useState(20);
  const [emergencyFund, setEmergencyFund] = useState({
    hasExisting: false,
    monthlyAmount: ''
  });

  // ← FIXED: Only declare useItemManager once
  const { 
    items: savingsGoals, 
    addItem, 
    updateItem, 
    deleteItem,
    hasItems,
    setItems
  } = useItemManager();

  // Pre-populate with saved data
  useEffect(() => {
    if (savedData?.savingsAllocation) {
      const saved = savedData.savingsAllocation;
      console.log('🔄 Loading saved savings data:', saved);
      
      if (saved.savingsRate) setSavingsRate(saved.savingsRate);
      if (saved.emergencyFund) setEmergencyFund(saved.emergencyFund);
      if (saved.savingsGoals?.length > 0) setItems(saved.savingsGoals);
    }
  }, [savedData, setItems]);

  const addSavingsGoal = () => {
    addItem({
      name: '', 
      amount: ''
    });
  };

  // Calculate derived values
  const totalIncome = incomeData?.totalYearlyIncome || 0;
  const monthlySavings = (totalIncome * savingsRate / 100) / 12;
  const estimatedMonthlyExpenses = (totalIncome * 0.5) / 12;

  // Calculate totals
  const totalAllocatedSavings = () => {
    const emergency = emergencyFund.hasExisting ? 0 : (parseFloat(emergencyFund.monthlyAmount) || 0);
    const goals = savingsGoals.reduce((sum, goal) => 
      sum + (parseFloat(goal.amount) || 0), 0
    );
    return emergency + goals;
  };

  const remainingAmount = monthlySavings - totalAllocatedSavings();
  const allocationPercentage = monthlySavings > 0 ? (totalAllocatedSavings() / monthlySavings) * 100 : 0;

  const handleNext = () => {
    if (onNext) {
      onNext({
        // Include savings rate data
        savingsRate,
        monthlySavings,
        yearlySavings: totalIncome * savingsRate / 100,
        // Include allocation data
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
            onChange={setSavingsRate}
          />
        </FormSection>

        {/* Summary Section */}
        <SectionBorder />
        <FormSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <SummaryCard
              title="Monthly Savings"
              value={monthlySavings}
              accent={true}
            />
            <SummaryCard
              title="Monthly Spending"
              value={((totalIncome * (100 - savingsRate) / 100) / 12)}
            />
            <SummaryCard
              title="Yearly Savings"
              value={(totalIncome * savingsRate / 100)}
            />
          </div>
        </FormSection>

        {/* Emergency Fund Section */}
        <EmergencyFundSection
          emergencyFund={emergencyFund}
          setEmergencyFund={setEmergencyFund}
          estimatedMonthlyExpenses={estimatedMonthlyExpenses}
        />

        {/* Savings Goals Section */}
        <FormSection title="Specific Savings Goals">
          {hasItems && (
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
          )}

          <AddItemButton 
            onClick={addSavingsGoal}
            children={!hasItems ? 'Add your first savings goal' : 'Add another savings goal'}
          />
        </FormSection>

        {/* Allocation Summary */}
        {totalAllocatedSavings() > 0 && (
          <>
            <SectionBorder />
            <FormSection>
              <div className="text-center">
                <SummaryCard
                  title={`Monthly savings allocated (${allocationPercentage.toFixed(0)}%)`}
                  value={`$${totalAllocatedSavings().toLocaleString()} / $${monthlySavings.toLocaleString()}`}
                  subtitle={remainingAmount > 0 ? `$${remainingAmount.toLocaleString()} unallocated` : 'Fully allocated'}
                  accent={true}
                />
              </div>
            </FormSection>
          </>
        )}

        {/* Helpful Tips */}
        <div className={`mt-16 p-8 border-l-4 ${
          isDarkMode ? 'border-gray-700 bg-gray-900/20' : 'border-gray-300 bg-gray-100'
        }`}>
          <h3 className={`text-xl font-light mb-4 ${
            isDarkMode ? 'text-white' : 'text-black'
          }`}>
            Savings Strategy Tips
          </h3>
          <div className={`space-y-3 text-base font-light ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            <p>• Emergency fund should cover 3-6 months of expenses</p>
            <p>• Aim for at least 10-20% savings rate if possible</p>
            <p>• Automate transfers to make saving effortless</p>
            <p>• Review and adjust your goals quarterly</p>
          </div>
        </div>

      </StandardFormLayout>
    </>
  );
}
