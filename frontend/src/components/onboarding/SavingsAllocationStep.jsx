import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeToggle from '../shared/ThemeToggle';
import ProgressBar from '../shared/ProgressBar';
import NavigationButtons from '../shared/NavigationButtons';

// Goal Component
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
                ? 'border-gray-700 text-white placeholder-gray-500 focus:border-gray-500' 
                : 'border-gray-300 text-gray-900 placeholder-gray-400 focus:border-gray-500'
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
                  ? 'border-gray-700 text-white placeholder-gray-500 focus:border-gray-500' 
                  : 'border-gray-300 text-gray-900 placeholder-gray-400 focus:border-gray-500'
              }`}
            />
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <button
            onClick={onDelete}
            className={`w-full py-2 text-sm transition-colors border-b ${
              isDarkMode 
                ? 'text-gray-500 hover:text-gray-300 border-transparent hover:border-gray-600' 
                : 'text-gray-400 hover:text-gray-600 border-transparent hover:border-gray-400'
            }`}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};

const SavingsAllocationStep = ({ onNext, onBack, incomeData, savingsData }) => {
  const { isDarkMode } = useTheme();
  const [emergencyFund, setEmergencyFund] = useState({
    hasExisting: false,
    monthlyAmount: ''
  });
  const [savingsGoals, setSavingsGoals] = useState([]);

  // Calculate derived values from previous steps
  const totalIncome = incomeData?.totalYearlyIncome || 90000;
  const monthlySavings = savingsData?.monthlySavings || (totalIncome * 0.4) / 12;
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
      <div className="max-w-6xl mx-auto px-6 py-12">
        <ProgressBar currentStep={3} />
        
        <div className="mb-24">
          <h1 className={`text-5xl font-light leading-tight mb-4 ${
            isDarkMode ? 'text-white' : 'text-black'
          }`}>
            Where are your savings going?
          </h1>
          <p className={`text-xl font-light ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            You have ${monthlySavings.toLocaleString()}/month to allocate toward your goals
          </p>
        </div>

        {/* Summary Section */}
        <div className={`py-12 mb-16 border-t border-b ${
          isDarkMode ? 'border-gray-800' : 'border-gray-200'
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center mb-8">
            <div>
              <div className={`text-3xl font-light mb-2 ${
                isDarkMode ? 'text-white' : 'text-black'
              }`}>
                ${monthlySavings.toLocaleString()}
              </div>
              <div className={`text-lg font-light ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Available Monthly
              </div>
            </div>
            
            <div>
              <div className={`text-3xl font-light mb-2 ${
                remainingAmount < 0 ? 'text-red-500' : isDarkMode ? 'text-white' : 'text-black'
              }`}>
                ${Math.abs(remainingAmount).toLocaleString()}
              </div>
              <div className={`text-lg font-light ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {remainingAmount >= 0 ? 'Unallocated' : 'Over Budget'}
              </div>
            </div>
            
            <div>
              <div className={`text-3xl font-light mb-2 ${
                allocationPercentage > 100 ? 'text-red-500' : isDarkMode ? 'text-white' : 'text-black'
              }`}>
                {allocationPercentage.toFixed(0)}%
              </div>
              <div className={`text-lg font-light ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Allocated
              </div>
            </div>
          </div>
          
          <div className={`w-full h-1 rounded-full ${
            isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
          }`}>
            <div 
              className={`h-1 rounded-full transition-all ${
                allocationPercentage <= 100 
                  ? isDarkMode ? 'bg-white' : 'bg-black'
                  : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(allocationPercentage, 100)}%` }}
            />
          </div>

          {remainingAmount < 0 && (
            <div className={`mt-6 p-4 border-l-4 border-red-500 ${
              isDarkMode ? 'bg-red-900/20' : 'bg-red-50'
            }`}>
              <p className="text-red-500 font-light">
                Your allocations exceed available savings by ${Math.abs(remainingAmount).toLocaleString()}
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Emergency Fund */}
          <div>
            <h2 className={`text-2xl font-light mb-8 ${
              isDarkMode ? 'text-white' : 'text-black'
            }`}>
              Emergency Fund
            </h2>
            
            <div className={`p-8 border-l-4 mb-8 ${
              emergencyFund.hasExisting 
                ? 'border-green-500' + (isDarkMode ? ' bg-green-900/20' : ' bg-green-50')
                : 'border-red-500' + (isDarkMode ? ' bg-red-900/20' : ' bg-red-50')
            }`}>
              {!emergencyFund.hasExisting && (
                <>
                  <div className="text-red-500 text-sm font-medium mb-4">PRIORITY</div>
                  <p className={`mb-6 font-light ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    3-6 months of expenses. Your financial safety net.
                  </p>
                </>
              )}
              
              <label className={`flex items-center mb-6 cursor-pointer ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <input
                  type="checkbox"
                  checked={emergencyFund.hasExisting}
                  onChange={(e) => setEmergencyFund(prev => ({ 
                    ...prev, 
                    hasExisting: e.target.checked,
                    monthlyAmount: e.target.checked ? '0' : prev.monthlyAmount
                  }))}
                  className="mr-3"
                />
                <span className="font-light">I already have an adequate emergency fund</span>
              </label>

              {!emergencyFund.hasExisting && (
                <>
                  <div className="relative mb-4">
                    <span className={`absolute left-0 top-2 text-lg ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      $
                    </span>
                    <input
                      type="text"
                      placeholder="Monthly amount"
                      value={emergencyFund.monthlyAmount}
                      onChange={(e) => setEmergencyFund(prev => ({ 
                        ...prev, 
                        monthlyAmount: e.target.value.replace(/[^0-9.]/g, '') 
                      }))}
                      className={`w-full bg-transparent border-0 border-b-2 pb-2 pl-6 text-lg focus:outline-none transition-colors ${
                        isDarkMode 
                          ? 'border-gray-700 text-white placeholder-gray-500 focus:border-gray-500' 
                          : 'border-gray-300 text-gray-900 placeholder-gray-400 focus:border-gray-500'
                      }`}
                    />
                  </div>
                  <p className={`text-sm font-light ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Suggested: ${Math.round(emergencyFundMin).toLocaleString()} - ${Math.round(emergencyFundMax).toLocaleString()}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Savings Goals */}
          <div>
            <h2 className={`text-2xl font-light mb-8 ${
              isDarkMode ? 'text-white' : 'text-black'
            }`}>
              Savings Goals
            </h2>

            <div className="mb-8">
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
              <span className="text-lg font-light">Add savings goal</span>
            </button>
          </div>
        </div>

        <NavigationButtons
          onBack={onBack}
          onNext={handleNext}
          canGoNext={totalAllocatedSavings() > 0}
          className="mt-16"
        />
      </div>
    </div>
  );
};

export default SavingsAllocationStep;
