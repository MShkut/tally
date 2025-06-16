import React, { useState } from 'react';
import { 
  Shield, 
  Wallet, 
  ArrowLeft, 
  ArrowRight, 
  Target,
  Plus,
  Trash2,
  Home,
  Car,
  GraduationCap,
  PiggyBank,
  Heart,
  Briefcase,
  Plane,
  Coffee,
  Gift
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeToggle from '../shared/ThemeToggle';
import ProgressBar from '../shared/ProgressBar';

// Available icons for goals
const availableIcons = [
  { name: 'Target', icon: Target, color: 'text-blue-500' },
  { name: 'Home', icon: Home, color: 'text-green-500' },
  { name: 'Car', icon: Car, color: 'text-red-500' },
  { name: 'GraduationCap', icon: GraduationCap, color: 'text-purple-500' },
  { name: 'PiggyBank', icon: PiggyBank, color: 'text-pink-500' },
  { name: 'Heart', icon: Heart, color: 'text-red-400' },
  { name: 'Briefcase', icon: Briefcase, color: 'text-gray-600' },
  { name: 'Plane', icon: Plane, color: 'text-blue-400' },
  { name: 'Coffee', icon: Coffee, color: 'text-yellow-600' },
  { name: 'Gift', icon: Gift, color: 'text-orange-500' }
];

// Goal Component
const SavingsGoal = ({ goal, onUpdate, onDelete, isDarkMode }) => {
  const [showIconPicker, setShowIconPicker] = useState(false);
  
  const getIconComponent = (iconName) => {
    const iconData = availableIcons.find(item => item.name === iconName);
    return iconData ? iconData.icon : Target;
  };

  const getIconColor = (iconName) => {
    const iconData = availableIcons.find(item => item.name === iconName);
    return iconData ? iconData.color : 'text-blue-500';
  };
  
  const IconComponent = getIconComponent(goal.icon);

  const handleNameChange = (e) => {
    onUpdate({ ...goal, name: e.target.value });
  };

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    onUpdate({ ...goal, amount: value });
  };

  const handleIconChange = (iconName) => {
    onUpdate({ ...goal, icon: iconName });
    setShowIconPicker(false);
  };

  return (
    <div className={`p-4 rounded-lg border transition-colors ${
      isDarkMode 
        ? 'bg-gray-700 border-gray-600' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0 relative">
          <button
            type="button"
            onClick={() => setShowIconPicker(!showIconPicker)}
            className={`p-2 rounded-lg border transition-colors hover:scale-105 ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-600 hover:bg-gray-700' 
                : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
            }`}
          >
            <IconComponent className={`w-5 h-5 ${getIconColor(goal.icon)}`} />
          </button>
          
          {showIconPicker && (
            <div className={`absolute top-12 left-0 z-10 p-3 rounded-lg border shadow-lg ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-600' 
                : 'bg-white border-gray-200'
            }`} style={{ width: '240px' }}>
              <div className="grid grid-cols-5 gap-2 max-h-32 overflow-y-auto">
                {availableIcons.map((iconData) => {
                  const IconComp = iconData.icon;
                  return (
                    <button
                      key={iconData.name}
                      type="button"
                      onClick={() => handleIconChange(iconData.name)}
                      className={`p-2 rounded hover:bg-gray-100 transition-colors ${
                        goal.icon === iconData.name 
                          ? isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100' 
                          : isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                      }`}
                    >
                      <IconComp className={`w-4 h-4 ${iconData.color}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <input
            type="text"
            placeholder="Goal name (e.g., Vacation, House Down Payment)"
            value={goal.name}
            onChange={handleNameChange}
            className={`w-full px-3 py-2 rounded-lg border transition-colors ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
          />
        </div>
        
        <div className="w-32">
          <div className="relative">
            <span className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>$</span>
            <input
              type="text"
              placeholder="Monthly"
              value={goal.amount}
              onChange={handleAmountChange}
              className={`w-full pl-8 pr-3 py-2 rounded-lg border transition-colors ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
        </div>
        
        <button
          onClick={onDelete}
          className={`p-2 rounded-lg transition-colors ${
            isDarkMode 
              ? 'text-red-400 hover:bg-red-900/20' 
              : 'text-red-600 hover:bg-red-50'
          }`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
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
  const estimatedMonthlyExpenses = (totalIncome * 0.5) / 12; // 50% of income for expenses
  const emergencyFundMin = estimatedMonthlyExpenses * 3; // 3 months of expenses
  const emergencyFundMax = estimatedMonthlyExpenses * 6; // 6 months of expenses

  const addSavingsGoal = () => {
    setSavingsGoals([...savingsGoals, { 
      id: Date.now(),
      name: '', 
      amount: '', 
      icon: 'Target'
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
    <div className={`min-h-screen transition-colors ${isDarkMode ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-green-50 to-white'} p-6`}>
      <ThemeToggle />
      <div className="max-w-4xl mx-auto">
        <ProgressBar currentStep={3} isDarkMode={isDarkMode} />
        
        <div className="text-center mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Where are your savings going?
          </h1>
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
            You have ${monthlySavings.toLocaleString()}/month to allocate toward your goals
          </p>
        </div>

        <div className={`rounded-xl p-8 shadow-lg ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
          {/* Summary Section */}
          <div className={`mb-8 p-4 rounded-lg border transition-colors ${
            isDarkMode 
              ? 'bg-green-900/20 border-green-800' 
              : 'bg-green-50 border-green-200'
          }`}>
            <div className="flex items-center mb-3">
              <Wallet className="w-5 h-5 text-green-500 mr-2" />
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Savings Allocation
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-800'}`}>
                  ${monthlySavings.toLocaleString()}
                </div>
                <div className={`text-sm ${isDarkMode ? 'text-green-300' : 'text-green-600'}`}>
                  Available Monthly
                </div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${
                  remainingAmount >= 0 
                    ? isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    : 'text-red-500'
                }`}>
                  ${Math.abs(remainingAmount).toLocaleString()}
                </div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {remainingAmount >= 0 ? 'Unallocated' : 'Over Budget'}
                </div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${
                  allocationPercentage <= 100 
                    ? isDarkMode ? 'text-purple-400' : 'text-purple-600'
                    : 'text-red-500'
                }`}>
                  {allocationPercentage.toFixed(0)}%
                </div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Allocated
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <div className={`w-full bg-gray-200 rounded-full h-2 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                <div 
                  className={`h-2 rounded-full transition-all ${
                    allocationPercentage <= 100 ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(allocationPercentage, 100)}%` }}
                />
              </div>
            </div>

            {remainingAmount < 0 && (
              <div className={`mt-3 p-3 rounded-lg ${isDarkMode ? 'bg-red-900/30' : 'bg-red-100'}`}>
                <p className="text-sm text-red-600">
                  ⚠️ Your allocations exceed available savings by ${Math.abs(remainingAmount).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Emergency Fund */}
            <div className="lg:col-span-1">
              <div className={`p-6 rounded-lg border-l-4 transition-colors ${
                emergencyFund.hasExisting 
                  ? isDarkMode
                    ? 'border-green-500 bg-green-900/20'
                    : 'border-green-500 bg-green-50'
                  : isDarkMode 
                    ? 'border-red-500 bg-gray-700' 
                    : 'border-red-500 bg-red-50'
              }`}>
                <div className="flex items-center mb-4">
                  <Shield className={`w-6 h-6 mr-3 ${
                    emergencyFund.hasExisting ? 'text-green-500' : 'text-red-500'
                  }`} />
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Emergency Fund
                  </h3>
                  {!emergencyFund.hasExisting && (
                    <span className="ml-2 px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                      PRIORITY
                    </span>
                  )}
                </div>
                
                {!emergencyFund.hasExisting && (
                  <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    3-6 months of expenses. Your financial safety net.
                  </p>
                )}
                
                {/* Checkbox for existing emergency fund */}
                <div className={emergencyFund.hasExisting ? '' : 'mb-4'}>
                  <label className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={emergencyFund.hasExisting}
                        onChange={(e) => setEmergencyFund(prev => ({ 
                          ...prev, 
                          hasExisting: e.target.checked,
                          monthlyAmount: e.target.checked ? '0' : prev.monthlyAmount
                        }))}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 border-2 rounded transition-colors ${
                        emergencyFund.hasExisting
                          ? 'bg-green-500 border-green-500'
                          : isDarkMode
                            ? 'border-gray-500 bg-gray-800'
                            : 'border-gray-300 bg-white'
                      }`}>
                        {emergencyFund.hasExisting && (
                          <svg className="w-3 h-3 text-white ml-0.5 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className={`ml-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      I already have an adequate emergency fund
                    </span>
                  </label>
                </div>

                {!emergencyFund.hasExisting && (
                  <>
                    <div className="relative">
                      <span className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-sm ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>$</span>
                      <input
                        type="text"
                        placeholder="Monthly amount"
                        value={emergencyFund.monthlyAmount}
                        onChange={(e) => setEmergencyFund(prev => ({ 
                          ...prev, 
                          monthlyAmount: e.target.value.replace(/[^0-9.]/g, '') 
                        }))}
                        className={`w-full pl-8 pr-4 py-3 rounded-lg border transition-colors ${
                          isDarkMode 
                            ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                    </div>
                    <div className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      <div>Suggested: ${Math.round(emergencyFundMin).toLocaleString()} - ${Math.round(emergencyFundMax).toLocaleString()}</div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Savings Goals */}
            <div className="lg:col-span-2">
              <div className="flex items-center mb-4">
                <Target className="w-6 h-6 text-blue-500 mr-3" />
                <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Savings Goals
                </h3>
              </div>

              <div className="space-y-4">
                {savingsGoals.map((goal) => (
                  <SavingsGoal
                    key={goal.id}
                    goal={goal}
                    onUpdate={(updatedGoal) => updateSavingsGoal(goal.id, updatedGoal)}
                    onDelete={() => deleteSavingsGoal(goal.id)}
                    isDarkMode={isDarkMode}
                  />
                ))}
                
                <button
                  onClick={addSavingsGoal}
                  className={`w-full p-4 border-2 border-dashed rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                    isDarkMode 
                      ? 'border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300' 
                      : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700'
                  }`}
                >
                  <Plus className="w-5 h-5" />
                  <span>Add savings goal</span>
                </button>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <button
              onClick={onBack}
              className={`flex items-center px-6 py-3 transition-colors ${
                isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </button>
            <button
              onClick={handleNext}
              disabled={totalAllocatedSavings() === 0}
              className={`flex items-center px-6 py-3 rounded-lg transition-colors ${
                totalAllocatedSavings() > 0
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : isDarkMode 
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavingsAllocationStep;
