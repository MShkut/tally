import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeToggle from '../shared/ThemeToggle';
import NavigationButtons from '../shared/NavigationButtons';

// SavingsGoal component inline
const SavingsGoal = ({ goal, onUpdate, onDelete, isDarkMode }) => {
  const handleNameChange = (e) => {
    onUpdate({ ...goal, name: e.target.value });
  };

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    onUpdate({ ...goal, amount: value });
  };

  return (
    <div className={`py-6 border-b transition-colors ${
      isDarkMode ? 'border-gray-800' : 'border-gray-200'
    }`}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
        <div className="lg:col-span-8">
          <label className={`block text-sm font-medium mb-2 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Savings goal
          </label>
          <input
            type="text"
            placeholder="Goal name (e.g., Vacation, House Down Payment)"
            value={goal.name}
            onChange={handleNameChange}
            className={`w-full bg-transparent border-0 border-b-2 pb-2 text-lg focus:outline-none transition-colors ${
              isDarkMode 
                ? 'border-gray-700 text-white placeholder-gray-500 focus:border-white' 
                : 'border-gray-300 text-gray-900 placeholder-gray-400 focus:border-black'
            }`}
          />
        </div>
        
        <div className="lg:col-span-3">
          <label className={`block text-sm font-medium mb-2 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Monthly amount
          </label>
          <div className="relative">
            <span className={`absolute left-0 top-2 text-lg ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              $
            </span>
            <input
              type="text"
              placeholder="0"
              value={goal.amount}
              onChange={handleAmountChange}
              className={`w-full bg-transparent border-0 border-b-2 pb-2 pl-6 text-lg focus:outline-none transition-colors ${
                isDarkMode 
                  ? 'border-gray-700 text-white placeholder-gray-500 focus:border-white' 
                  : 'border-gray-300 text-gray-900 placeholder-gray-400 focus:border-black'
              }`}
            />
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <button
            onClick={onDelete}
            className={`w-full py-2 text-sm transition-colors ${
              isDarkMode 
                ? 'text-gray-500 hover:text-gray-300' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};

const SavingsAllocationStep = ({ onNext, onBack, incomeData }) => {
  const { isDarkMode } = useTheme();
  
  // Savings rate state
  const [savingsRate, setSavingsRate] = useState(40);
  
  const [emergencyFund, setEmergencyFund] = useState({
    hasExisting: false,
    monthlyAmount: ''
  });
  const [savingsGoals, setSavingsGoals] = useState([]);

  // Calculate derived values
  const totalIncome = incomeData?.totalYearlyIncome || 90000;
  const monthlySavings = (totalIncome * savingsRate / 100) / 12;
  const estimatedMonthlyExpenses = (totalIncome * 0.5) / 12;
  const emergencyFundMin = estimatedMonthlyExpenses * 3;
  const emergencyFundMax = estimatedMonthlyExpenses * 6;

  const addSavingsGoal = () => {
    setSavingsGoals([...savingsGoals, { 
      id: Date.now(),
      name: '', 
      amount: ''
    }]);
  };

  const updateSavingsGoal = (id, updatedGoal) => {
    setSavingsGoals(savingsGoals.map(goal => 
      goal.id === id ? updatedGoal : goal
    ));
  };

  const deleteSavingsGoal = (id) => {
    setSavingsGoals(savingsGoals.filter(goal => goal.id !== id));
  };

  // Calculate totals
  const totalAllocatedSavings = () => {
    const emergency = emergencyFund.hasExisting ? 0 : (parseFloat(emergencyFund.monthlyAmount) || 0);
    const goals = savingsGoals.reduce((sum, goal) => 
      sum + (parseFloat(goal.amount) || 0), 0
    );
    return emergency + goals;
  };

  const remainingAmount = monthlySavings - totalAllocatedSavings();
  const allocationPercentage = (totalAllocatedSavings() / monthlySavings) * 100;

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
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <ThemeToggle />
      <div className="max-w-4xl mx-auto px-6 py-12">
        
        <div className="mb-24">
          <h1 className={`text-5xl font-light leading-tight mb-4 ${
            isDarkMode ? 'text-white' : 'text-black'
          }`}>
            Set Your Savings Rate
          </h1>
          <p className={`text-xl font-light ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            How much of your income do you want to save? Then allocate those savings to specific goals.
          </p>
        </div>

        {/* Savings Rate Slider */}
        <div className="mb-16">
          <label className={`block text-sm font-medium mb-6 uppercase tracking-wider ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Savings Rate
          </label>
          
          <div className="flex items-center gap-6 mb-8">
            <input
              type="range"
              min="0"
              max="80"
              value={savingsRate}
              onChange={(e) => setSavingsRate(parseInt(e.target.value))}
              className="flex-1"
            />
            <div className={`text-4xl font-light min-w-20 ${
              isDarkMode ? 'text-white' : 'text-black'
            }`}>
              {savingsRate}%
            </div>
          </div>

          <div className={`py-8 border-t border-b ${
            isDarkMode ? 'border-gray-800' : 'border-gray-200'
          }`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className={`text-2xl font-light mb-2 ${
                  isDarkMode ? 'text-white' : 'text-black'
                }`}>
                  ${monthlySavings.toLocaleString()}
                </div>
                <div className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Monthly Savings
                </div>
              </div>
              <div>
                <div className={`text-2xl font-light mb-2 ${
                  isDarkMode ? 'text-white' : 'text-black'
                }`}>
                  ${((totalIncome * (100 - savingsRate) / 100) / 12).toLocaleString()}
                </div>
                <div className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Monthly Spending
                </div>
              </div>
              <div>
                <div className={`text-2xl font-light mb-2 ${
                  isDarkMode ? 'text-white' : 'text-black'
                }`}>
                  ${(totalIncome * savingsRate / 100).toLocaleString()}
                </div>
                <div className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Yearly Savings
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Fund */}
        <div className="mb-16">
          <h2 className={`text-2xl font-light mb-6 ${
            isDarkMode ? 'text-white' : 'text-black'
          }`}>
            Emergency Fund
          </h2>
          
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
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Monthly emergency fund contribution
              </label>
              <div className="relative max-w-xs">
                <span className={`absolute left-0 top-3 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  $
                </span>
                <input
                  type="text"
                  value={emergencyFund.monthlyAmount}
                  onChange={(e) => setEmergencyFund(prev => ({ 
                    ...prev, 
                    monthlyAmount: e.target.value.replace(/[^0-9.]/g, '') 
                  }))}
                  placeholder="500"
                  className={`w-full pl-6 px-0 py-3 border-0 border-b-2 bg-transparent text-lg transition-colors focus:outline-none ${
                    isDarkMode 
                      ? 'border-gray-700 text-white placeholder-gray-500 focus:border-white' 
                      : 'border-gray-300 text-black placeholder-gray-400 focus:border-black'
                  }`}
                />
              </div>
              <p className={`mt-4 text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Recommended: ${emergencyFundMin.toLocaleString()} - ${emergencyFundMax.toLocaleString()} 
                (3-6 months of expenses)
              </p>
            </div>
          )}
        </div>

        {/* Savings Goals */}
        <div className="mb-16">
          <h2 className={`text-2xl font-light mb-6 ${
            isDarkMode ? 'text-white' : 'text-black'
          }`}>
            Specific Savings Goals
          </h2>

          <div className="space-y-6 mb-8">
            {savingsGoals.map((goal) => (
              <SavingsGoal
                key={goal.id}
                goal={goal}
                onUpdate={(updatedGoal) => updateSavingsGoal(goal.id, updatedGoal)}
                onDelete={() => deleteSavingsGoal(goal.id)}
                isDarkMode={isDarkMode}
              />
            ))}
          </div>

          <button
            onClick={addSavingsGoal}
            className={`w-full py-6 border-2 border-dashed transition-colors text-center ${
              isDarkMode 
                ? 'border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300' 
                : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700'
            }`}
          >
            <span className="text-lg font-light">Add a savings goal</span>
          </button>
        </div>

        {/* Allocation Summary */}
        {totalAllocatedSavings() > 0 && (
          <div className={`mb-16 py-8 border-t border-b ${
            isDarkMode ? 'border-gray-800' : 'border-gray-200'
          }`}>
            <div className="text-center">
              <div className={`text-3xl font-light mb-2 ${
                isDarkMode ? 'text-white' : 'text-black'
              }`}>
                ${totalAllocatedSavings().toLocaleString()} / ${monthlySavings.toLocaleString()}
              </div>
              <div className={`text-lg font-light ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Monthly savings allocated ({allocationPercentage.toFixed(0)}%)
              </div>
              {remainingAmount > 0 && (
                <div className={`text-base mt-2 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-500'
                }`}>
                  ${remainingAmount.toLocaleString()} unallocated
                </div>
              )}
            </div>
          </div>
        )}

        <NavigationButtons
          onBack={onBack}
          onNext={handleNext}
          canGoNext={true}
          showBack={true}
        />
      </div>
    </div>
  );
};

export default SavingsAllocationStep;
