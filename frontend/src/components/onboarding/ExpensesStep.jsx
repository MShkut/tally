import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Home,
  Car,
  Utensils,
  Zap,
  Heart,
  Coffee,
  Shirt,
  Gamepad2,
  Plus,
  Trash2
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeToggle from '../shared/ThemeToggle';
import ProgressBar from '../shared/ProgressBar';

// Available icons for expense categories
const expenseIcons = [
  { name: 'Home', icon: Home, color: 'text-blue-500' },
  { name: 'Car', icon: Car, color: 'text-red-500' },
  { name: 'Utensils', icon: Utensils, color: 'text-green-500' },
  { name: 'Zap', icon: Zap, color: 'text-yellow-500' },
  { name: 'Heart', icon: Heart, color: 'text-pink-500' },
  { name: 'Coffee', icon: Coffee, color: 'text-orange-500' },
  { name: 'Shirt', icon: Shirt, color: 'text-purple-500' },
  { name: 'Gamepad2', icon: Gamepad2, color: 'text-indigo-500' }
];

// Budget Category Component
const BudgetCategory = ({ category, onUpdate, onDelete, isDarkMode, availableBudget }) => {
  const [showIconPicker, setShowIconPicker] = useState(false);
  
  const getIconComponent = (iconName) => {
    const iconData = expenseIcons.find(item => item.name === iconName);
    return iconData ? iconData.icon : Home;
  };

  const getIconColor = (iconName) => {
    const iconData = expenseIcons.find(item => item.name === iconName);
    return iconData ? iconData.color : 'text-blue-500';
  };
  
  const IconComponent = getIconComponent(category.icon);
  const categoryAmount = parseFloat(category.amount) || 0;
  const isOverBudget = categoryAmount > availableBudget;

  const handleNameChange = (e) => {
    onUpdate({ ...category, name: e.target.value });
  };

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    onUpdate({ ...category, amount: value });
  };

  const handleIconChange = (iconName) => {
    onUpdate({ ...category, icon: iconName });
    setShowIconPicker(false);
  };

  return (
    <div className={`p-4 rounded-lg border transition-colors ${
      isOverBudget 
        ? isDarkMode 
          ? 'border-red-500 bg-red-900/20' 
          : 'border-red-300 bg-red-50'
        : isDarkMode 
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
            <IconComponent className={`w-5 h-5 ${getIconColor(category.icon)}`} />
          </button>
          
          {showIconPicker && (
            <div className={`absolute top-12 left-0 z-10 p-3 rounded-lg border shadow-lg ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-600' 
                : 'bg-white border-gray-200'
            }`} style={{ width: '200px' }}>
              <div className="grid grid-cols-4 gap-2">
                {expenseIcons.map((iconData) => {
                  const IconComp = iconData.icon;
                  return (
                    <button
                      key={iconData.name}
                      type="button"
                      onClick={() => handleIconChange(iconData.name)}
                      className={`p-2 rounded hover:bg-gray-100 transition-colors ${
                        category.icon === iconData.name 
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
            placeholder="Category name (e.g., Housing, Food, Transportation)"
            value={category.name}
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
            <DollarSign className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <input
              type="text"
              placeholder="Monthly"
              value={category.amount}
              onChange={handleAmountChange}
              className={`w-full pl-10 pr-3 py-2 rounded-lg border transition-colors ${
                isOverBudget
                  ? 'border-red-500 bg-red-50'
                  : isDarkMode 
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
      
      {isOverBudget && (
        <div className="mt-2 flex items-center text-red-600 text-sm">
          <AlertTriangle className="w-4 h-4 mr-1" />
          <span>Exceeds available budget by ${(categoryAmount - availableBudget).toLocaleString()}</span>
        </div>
      )}
    </div>
  );
};

const ExpensesStep = ({ onNext, onBack, incomeData, savingsData, allocationData }) => {
  const { isDarkMode } = useTheme();
  const [expenseCategories, setExpenseCategories] = useState([
    { id: 1, name: 'Housing', amount: '1500', icon: 'Home' },
    { id: 2, name: 'Transportation', amount: '400', icon: 'Car' },
    { id: 3, name: 'Food & Dining', amount: '600', icon: 'Utensils' },
    { id: 4, name: 'Utilities', amount: '200', icon: 'Zap' }
  ]);

  // Calculate available budget for expenses
  const totalIncome = incomeData?.totalYearlyIncome || 0;
  const monthlyIncome = totalIncome / 12;
  const monthlySavings = savingsData?.monthlySavings || 0;
  const availableForExpenses = monthlyIncome - monthlySavings;

  const addExpenseCategory = () => {
    setExpenseCategories([...expenseCategories, { 
      id: Date.now(),
      name: '', 
      amount: '', 
      icon: 'Home'
    }]);
  };

  const updateExpenseCategory = (id, updatedCategory) => {
    setExpenseCategories(expenseCategories.map(category => 
      category.id === id ? updatedCategory : category
    ));
  };

  const deleteExpenseCategory = (id) => {
    setExpenseCategories(expenseCategories.filter(category => category.id !== id));
  };

  // Calculate totals
  const totalBudgeted = expenseCategories.reduce((sum, category) => 
    sum + (parseFloat(category.amount) || 0), 0
  );

  const remainingBudget = availableForExpenses - totalBudgeted;
  const budgetPercentage = (totalBudgeted / availableForExpenses) * 100;
  const isOverBudget = totalBudgeted > availableForExpenses;

  const handleNext = () => {
    if (onNext) {
      onNext({
        expenseCategories,
        totalBudgeted,
        availableForExpenses,
        remainingBudget
      });
    }
  };

  return (
    <div className={`min-h-screen transition-colors ${isDarkMode ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-orange-50 to-white'} p-6`}>
      <ThemeToggle />
      <div className="max-w-4xl mx-auto">
        <ProgressBar currentStep={4} isDarkMode={isDarkMode} />
        
        <div className="text-center mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Budget Your Expenses
          </h1>
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
            You have ${availableForExpenses.toLocaleString()}/month for living expenses
          </p>
        </div>

        <div className={`rounded-xl p-8 shadow-lg ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
          {/* Budget Summary */}
          <div className={`mb-8 p-6 rounded-lg border transition-colors ${
            isOverBudget
              ? isDarkMode 
                ? 'bg-red-900/20 border-red-800' 
                : 'bg-red-50 border-red-200'
              : isDarkMode 
                ? 'bg-blue-900/20 border-blue-800' 
                : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-center mb-4">
              {isOverBudget ? (
                <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
              ) : (
                <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
              )}
              <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Expense Budget Overview
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  ${availableForExpenses.toLocaleString()}
                </div>
                <div className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-500'}`}>
                  Available Budget
                </div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                  ${totalBudgeted.toLocaleString()}
                </div>
                <div className={`text-sm ${isDarkMode ? 'text-purple-300' : 'text-purple-500'}`}>
                  Total Budgeted
                </div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${
                  isOverBudget 
                    ? 'text-red-500' 
                    : isDarkMode ? 'text-green-400' : 'text-green-600'
                }`}>
                  ${Math.abs(remainingBudget).toLocaleString()}
                </div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {isOverBudget ? 'Over Budget' : 'Remaining'}
                </div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${
                  budgetPercentage <= 100 
                    ? isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                    : 'text-red-500'
                }`}>
                  {budgetPercentage.toFixed(0)}%
                </div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Budget Used
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className={`w-full bg-gray-200 rounded-full h-3 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                <div 
                  className={`h-3 rounded-full transition-all ${
                    isOverBudget ? 'bg-red-500' : budgetPercentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>0%</span>
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>100%</span>
              </div>
            </div>

            {isOverBudget && (
              <div className={`mt-4 p-3 rounded-lg ${isDarkMode ? 'bg-red-900/30' : 'bg-red-100'}`}>
                <p className="text-sm text-red-600 font-medium">
                  ⚠️ You're over budget by ${Math.abs(remainingBudget).toLocaleString()}. 
                  Consider reducing some categories or increasing your income.
                </p>
              </div>
            )}
          </div>

          {/* Expense Categories */}
          <div className="mb-8">
            <h3 className={`text-xl font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Monthly Expense Categories
            </h3>
            
            <div className="space-y-4">
              {expenseCategories.map((category) => (
                <BudgetCategory
                  key={category.id}
                  category={category}
                  onUpdate={(updatedCategory) => updateExpenseCategory(category.id, updatedCategory)}
                  onDelete={() => deleteExpenseCategory(category.id)}
                  isDarkMode={isDarkMode}
                  availableBudget={availableForExpenses}
                />
              ))}
              
              <button
                onClick={addExpenseCategory}
                className={`w-full p-4 border-2 border-dashed rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                  isDarkMode 
                    ? 'border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300' 
                    : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700'
                }`}
              >
                <Plus className="w-5 h-5" />
                <span>Add expense category</span>
              </button>
            </div>
          </div>

          {/* Budget Tips */}
          <div className={`p-4 rounded-lg border mb-8 ${
            isDarkMode 
              ? 'bg-gray-700/50 border-gray-600' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              💡 Budgeting Tips
            </h4>
            <ul className={`text-sm space-y-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <li>• Start with fixed expenses (rent, utilities, insurance)</li>
              <li>• The 50/30/20 rule: 50% needs, 30% wants, 20% savings</li>
              <li>• Track actual spending to refine your budget over time</li>
              <li>• Leave some buffer for unexpected expenses</li>
            </ul>
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
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
              disabled={expenseCategories.length === 0}
              className={`flex items-center px-6 py-3 rounded-lg transition-colors ${
                expenseCategories.length > 0
                  ? isOverBudget
                    ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                    : 'bg-orange-600 text-white hover:bg-orange-700'
                  : isDarkMode 
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isOverBudget ? 'Continue Anyway' : 'Next'} <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpensesStep;
