import React, { useState } from 'react';
import ThemeToggle from '../shared/ThemeToggle';
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
const SavingsGoal = ({ goal, onUpdate, onDelete }) => {
  return (
    <FormGrid>
      {/* Goal name: 8 columns */}
      <FormField span={8}>
        <StandardInput
          label="Savings goal"
          value={goal.name}
          onChange={(value) => onUpdate({ ...goal, name: value })}
          placeholder="Down payment, vacation, retirement"
        />
      </FormField>
      
      {/* Monthly amount: 3 columns */}
      <FormField span={3}>
        <StandardInput
          label="Monthly amount"
          type="currency"
          value={goal.amount}
          onChange={(value) => onUpdate({ ...goal, amount: value })}
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

// Custom savings rate input component
const SavingsRateInput = ({ savingsRate, onChange, isDarkMode }) => {
  const handleSavingsRateChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, ''); // Only allow numbers
    const numValue = parseInt(value) || 0;
    
    // Clamp between 0 and 100
    const clampedValue = Math.max(0, Math.min(100, numValue));
    onChange(clampedValue);
  };

  return (
    <div className="flex items-center gap-6 mb-8">
      <div className="relative">
        <input
          type="text"
          value={savingsRate}
          onChange={handleSavingsRateChange}
          placeholder="20"
          className={`w-24 bg-transparent border-0 border-b-2 pb-2 pr-8 text-4xl font-light focus:outline-none transition-colors ${
            isDarkMode 
              ? 'border-gray-700 text-white placeholder-gray-500 focus:border-white' 
              : 'border-gray-300 text-gray-900 placeholder-gray-400 focus:border-black'
          }`}
        />
        <span className={`absolute right-0 top-2 text-4xl font-light ${
          isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          %
        </span>
      </div>
      <div className={`text-base font-light ${
        isDarkMode ? 'text-gray-400' : 'text-gray-600'
      }`}>
        of your income saved each month
      </div>
    </div>
  );
};

const SavingsAllocationStep = ({ onNext, onBack, incomeData }) => {
  const { isDarkMode } = useTheme();
  
  // Savings rate state - default to 20% as requested
  const [savingsRate, setSavingsRate] = useState(20);
  
  const [emergencyFund, setEmergencyFund] = useState({
    hasExisting: false,
    monthlyAmount: ''
  });

  // Use professional item manager for savings goals
  const { 
    items: savingsGoals, 
    addItem, 
    updateItem, 
    deleteItem,
    hasItems 
  } = useItemManager();

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
  const emergencyFundMin = estimatedMonthlyExpenses * 3;
  const emergencyFundMax = estimatedMonthlyExpenses * 6;

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
        <FormSection title="">
          <label className={`block text-sm font-medium mb-6 uppercase tracking-wider ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Savings Rate
          </label>
          
          <SavingsRateInput 
            savingsRate={savingsRate}
            onChange={setSavingsRate}
            isDarkMode={isDarkMode}
          />

          {/* Validation message */}
          {savingsRate > 50 && (
            <div className={`mb-6 text-sm ${
              isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
            }`}>
              That's an ambitious savings rate! Make sure you have enough left for essential expenses.
            </div>
          )}
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
        <FormSection title="Emergency Fund">
          <div className="mb-6">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={emergencyFund.hasExisting}
                onChange={(e) => setEmergencyFund(prev => ({ 
                  ...prev, 
                  hasExisting: e.target.checked,
                  monthlyAmount: e.target.checked ? '' : prev.monthlyAmount
                }))}
                className={isDarkMode ? 'text-white' : 'text-black'}
              />
              <span className={`text-lg font-light ${
                isDarkMode ? 'text-white' : 'text-black'
              }`}>
                I already have a sufficient emergency fund
              </span>
            </label>
          </div>

          {!emergencyFund.hasExisting && (
            <FormGrid>
              <FormField span={4}>
                <StandardInput
                  label="Monthly emergency fund contribution"
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

      </StandardFormLayout>
    </>
  );
};

export default SavingsAllocationStep;
