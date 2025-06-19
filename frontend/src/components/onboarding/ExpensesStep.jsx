import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeToggle from '../shared/ThemeToggle';
import NavigationButtons from '../shared/NavigationButtons';

// ExpenseCategory component inline
const ExpenseCategory = ({ category, onUpdate, onDelete, availableBudget, isDarkMode }) => {
  const handleNameChange = (e) => {
    onUpdate({ ...category, name: e.target.value });
  };

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    onUpdate({ ...category, amount: value });
  };

  const categoryAmount = parseFloat(category.amount) || 0;
  const isOverBudget = categoryAmount > availableBudget;

  return (
    <div className={`py-6 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <label className={`block text-sm font-medium mb-2 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Category Name
          </label>
          <input
            type="text"
            value={category.name}
            onChange={handleNameChange}
            placeholder="Housing, Transportation, Food..."
            className={`w-full px-0 py-3 border-0 border-b-2 bg-transparent transition-colors focus:outline-none ${
              isDarkMode 
                ? 'border-gray-700 text-white placeholder-gray-500 focus:border-white' 
                : 'border-gray-300 text-black placeholder-gray-400 focus:border-black'
            }`}
          />
        </div>
        
        <div>
          <label className={`block text-sm font-medium mb-2 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Monthly Budget
          </label>
          <div className="relative">
            <span className={`absolute left-0 top-3 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              $
            </span>
            <input
              type="text"
              placeholder="0"
              value={category.amount}
              onChange={handleAmountChange}
              className={`w-full bg-transparent border-0 border-b-2 pb-2 pl-6 text-lg focus:outline-none transition-colors ${
                isOverBudget
                  ? 'border-red-500 text-red-500'
                  : isDarkMode 
                    ? 'border-gray-700 text-white placeholder-gray-500 focus:border-white' 
                    : 'border-gray-300 text-gray-900 placeholder-gray-400 focus:border-black'
              }`}
            />
          </div>
        </div>
      </div>
      
      {/* Remove button */}
      <button
        onClick={onDelete}
        className={`mt-4 text-sm transition-colors ${
          isDarkMode 
            ? 'text-gray-500 hover:text-gray-300' 
            : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        Remove this category
      </button>
      
      {isOverBudget && (
        <div className="mt-4 text-red-500 text-sm font-light">
          Exceeds available budget by ${(categoryAmount - availableBudget).toLocaleString()}
        </div>
      )}
    </div>
  );
};

const ExpensesStep = ({ onNext, onBack, incomeData, savingsData, allocationData }) => {
  const { isDarkMode } = useTheme();
  const [expenseCategories, setExpenseCategories] = useState([
    { id: 1, name: 'Housing', amount: '1500' },
    { id: 2, name: 'Transportation', amount: '400' },
    { id: 3, name: 'Food & Dining', amount: '600' },
    { id: 4, name: 'Utilities', amount: '200' }
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
      amount: ''
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
  const totalExpenses = expenseCategories.reduce((total, category) => {
    return total + (parseFloat(category.amount) || 0);
  }, 0);

  const remainingBudget = availableForExpenses - totalExpenses;
  const isOverBudget = remainingBudget < 0;

  const handleNext = () => {
    if (onNext) {
      onNext({
        expenseCategories,
        totalExpenses,
        availableForExpenses,
        remainingBudget
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
            Plan Your Monthly Expenses
          </h1>
          <p className={`text-xl font-light ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Allocate your remaining income to expense categories. Start with the essentials.
          </p>
        </div>

        {/* Budget Overview */}
        <div className={`mb-16 py-8 border-t border-b ${
          isDarkMode ? 'border-gray-800' : 'border-gray-200'
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className={`text-2xl font-light mb-2 ${
                isDarkMode ? 'text-white' : 'text-black'
              }`}>
                ${monthlyIncome.toLocaleString()}
              </div>
              <div className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Monthly Income
              </div>
            </div>
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
                ${availableForExpenses.toLocaleString()}
              </div>
              <div className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Available for Expenses
              </div>
            </div>
          </div>
        </div>

        {/* Expense Categories */}
        <div className="mb-16">
          <h2 className={`text-2xl font-light mb-6 ${
            isDarkMode ? 'text-white' : 'text-black'
          }`}>
            Monthly Expense Categories
          </h2>

          <div className="space-y-6 mb-8">
            {expenseCategories.map((category) => (
              <ExpenseCategory
                key={category.id}
                category={category}
                onUpdate={(updatedCategory) => updateExpenseCategory(category.id, updatedCategory)}
                onDelete={() => deleteExpenseCategory(category.id)}
                availableBudget={availableForExpenses}
                isDarkMode={isDarkMode}
              />
            ))}
          </div>

          <button
            onClick={addExpenseCategory}
            className={`w-full py-6 border-2 border-dashed transition-colors text-center ${
              isDarkMode 
                ? 'border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300' 
                : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700'
            }`}
          >
            <span className="text-lg font-light">Add expense category</span>
          </button>
        </div>

        {/* Budget Summary */}
        {totalExpenses > 0 && (
          <div className={`mb-16 py-8 border-t border-b ${
            isDarkMode ? 'border-gray-800' : 'border-gray-200'
          }`}>
            <div className="text-center">
              <div className={`text-3xl font-light mb-2 ${
                isOverBudget 
                  ? 'text-red-500'
                  : isDarkMode ? 'text-white' : 'text-black'
              }`}>
                ${totalExpenses.toLocaleString()} / ${availableForExpenses.toLocaleString()}
              </div>
              <div className={`text-lg font-light ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Total monthly expenses
              </div>
              {remainingBudget !== 0 && (
                <div className={`text-base mt-2 ${
                  isOverBudget
                    ? 'text-red-500'
                    : isDarkMode ? 'text-gray-500' : 'text-gray-500'
                }`}>
                  {isOverBudget ? 'Over budget by' : 'Remaining:'} ${Math.abs(remainingBudget).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Helpful Tips */}
        <div className={`mb-16 py-8 border-l-2 pl-8 ${
          isDarkMode ? 'border-gray-700' : 'border-gray-300'
        }`}>
          <h3 className={`text-xl font-light mb-4 ${
            isDarkMode ? 'text-white' : 'text-black'
          }`}>
            Common Expense Categories
          </h3>
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 text-sm ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            <div>
              <strong>Essential:</strong> Housing, Utilities, Groceries, Transportation, Insurance, Minimum Debt Payments
            </div>
            <div>
              <strong>Lifestyle:</strong> Dining Out, Entertainment, Shopping, Subscriptions, Personal Care, Hobbies
            </div>
          </div>
          <p className={`mt-4 text-sm ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Start with essentials first, then add lifestyle categories. You can always adjust these amounts later.
          </p>
        </div>

        <NavigationButtons
          onBack={onBack}
          onNext={handleNext}
          canGoNext={totalExpenses > 0 && !isOverBudget}
          showBack={true}
        />
      </div>
    </div>
  );
};

export default ExpensesStep;
