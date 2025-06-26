// frontend/src/components/onboarding/ExpensesStep.jsx
import React, { useState, useEffect } from 'react';

import { useTheme } from 'contexts/ThemeContext';
import { ThemeToggle } from 'components/shared/ThemeToggle';
import { FrequencySelector } from 'components/shared/FrequencySelector';
import { SmartInput } from 'components/shared/SmartInput';
import { Currency } from 'utils/currency';
import { 
  FormGrid, 
  FormField, 
  StandardInput,
  AddItemButton,
  FormSection,
  StandardFormLayout,
  SummaryCard,
  SectionBorder,
  useItemManager,
  validation
} from '../shared/FormComponents';
import { 
  loadCategoriesWithCustom, 
  saveCustomCategory 
} from 'utils/categorySuggestions';
import { convertToYearly } from 'utils/incomeHelpers';

// Clean expense category component with fixed currency calculations
export const ExpenseCategory = ({ category, onUpdate, onDelete, availableBudget, suggestions }) => {
  const { isDarkMode } = useTheme();
  
  // Calculate monthly equivalent based on frequency using currency system
  const monthlyAmount = category.frequency ? 
    Currency.fromYearly(Currency.toYearly(category.amount, category.frequency), 'Monthly') : 
    parseFloat(category.amount) || 0;
  
  const isOverBudget = Currency.compare(monthlyAmount, availableBudget) > 0;
  const overBudgetAmount = isOverBudget ? 
    Currency.subtract(monthlyAmount, availableBudget) : 0;
  
  const handleSuggestionSelect = (suggestion) => {
    // If it's the gifts category, show hint
    if (suggestion.special === 'gift-management') {
      // The hint is already shown in the suggestion dropdown
    }
    
    // Update with suggestion's common frequency if current is default
    if (category.frequency === 'Monthly' && suggestion.commonFrequencies) {
      onUpdate({ 
        ...category, 
        name: suggestion.name,
        frequency: suggestion.commonFrequencies[0] 
      });
    }
  };
  
  return (
    <div className="py-8">
      <div className="grid grid-cols-12 gap-8 items-end">
        {/* Category name: 6 columns */}
        <div className="col-span-6">
          <SmartInput
            label="Category Name"
            value={category.name}
            onChange={(value) => onUpdate({ ...category, name: value })}
            onSuggestionSelect={handleSuggestionSelect}
            suggestions={suggestions}
            placeholder="Housing, groceries, transportation, healthcare"
            className="[&_label]:text-2xl [&_label]:font-medium [&_input]:text-2xl [&_input]:font-medium [&_input]:pb-4"
          />
        </div>
        
        {/* Amount: 3 columns */}
        <div className="col-span-3">
          <StandardInput
            label="Amount"
            type="currency"
            value={category.amount}
            onChange={(value) => onUpdate({ ...category, amount: value })}
            prefix="$"
            error={isOverBudget ? 
              `Exceeds available budget by ${Currency.format(overBudgetAmount)}` : null
            }
            className="[&_label]:text-2xl [&_label]:font-medium [&_input]:text-2xl [&_input]:font-medium [&_input]:pb-4"
          />
        </div>
        
        {/* Frequency: 2 columns */}
        <div className="col-span-2">
          <FrequencySelector
            frequency={category.frequency || 'Monthly'}
            onChange={(value) => onUpdate({ ...category, frequency: value })}
            allowOneTime={true}
          />
        </div>
        
        {/* Remove button: 1 column - matching IncomeSource pattern */}
        <div className="col-span-1">
          <div className="flex items-end h-full pb-4">
            <button
              onClick={onDelete}
              className="w-full text-center text-3xl font-light text-gray-400 hover:text-red-500 transition-colors"
              title="Remove this expense category"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ExpensesStep = ({ onNext, onBack, incomeData, savingsData, savedData = null }) => {
  const { isDarkMode } = useTheme();
  const { 
    items: expenseCategories, 
    addItem, 
    updateItem, 
    deleteItem,
    hasItems,
    setItems
  } = useItemManager();
  
  // Load category suggestions including custom ones
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    setSuggestions(loadCategoriesWithCustom('expenses'));
  }, []);

  // Load saved data on mount
  useEffect(() => {
    if (savedData?.expenses?.expenseCategories?.length > 0) {
      console.log('🔄 Loading saved expense categories:', savedData.expenses.expenseCategories);
      setItems(savedData.expenses.expenseCategories);
    }
  }, [savedData, setItems]);

  // Calculate available budget for expenses using currency system
  const totalIncome = incomeData?.totalYearlyIncome || 0;
  const monthlyIncome = Currency.fromYearly(totalIncome, 'Monthly');
  const monthlySavings = savingsData?.monthlySavings || 0;
  const availableForExpenses = Currency.subtract(monthlyIncome, monthlySavings);

  const addExpenseCategory = () => {
    addItem({
      name: '', 
      amount: '',
      frequency: 'Monthly' // Default frequency
    });
  };

  // Calculate totals using currency system
  const totalMonthlyExpenses = expenseCategories.reduce((total, category) => {
    const monthlyEquivalent = category.frequency ? 
      Currency.fromYearly(Currency.toYearly(category.amount, category.frequency), 'Monthly') : 
      parseFloat(category.amount) || 0;
    return Currency.add(total, monthlyEquivalent);
  }, 0);

  const remainingBudget = Currency.subtract(availableForExpenses, totalMonthlyExpenses);
  const isOverBudget = Currency.compare(remainingBudget, 0) < 0;

  // Enhanced validation using currency system
  const canContinue = totalMonthlyExpenses > 0 && 
                     !isOverBudget && 
                     expenseCategories.every(category => 
                       validation.hasValidString(category.name) && 
                       validation.isValidCurrency(category.amount)
                     );

  const handleNext = () => {
    if (onNext && canContinue) {
      // Save any custom categories
      expenseCategories.forEach(category => {
        if (!suggestions.find(s => s.name.toLowerCase() === category.name.toLowerCase())) {
          saveCustomCategory('expenses', category);
        }
      });
      
      onNext({
        expenseCategories,
        totalExpenses: totalMonthlyExpenses,
        availableForExpenses,
        remainingBudget
      });
    }
  };

  return (
    <>
      <ThemeToggle />
      <StandardFormLayout
        title="Plan Your Monthly Expenses"
        subtitle="Allocate your remaining income to expense categories. Start with the essentials."
        onBack={onBack}
        onNext={handleNext}
        canGoNext={canContinue}
        showBack={true}
      >
        {/* Expense Categories Section */}
        <FormSection title="Monthly Expense Categories">
          {hasItems ? (
            <div className="space-y-0 mb-8">
              {expenseCategories.map((category) => (
                <ExpenseCategory
                  key={category.id}
                  category={category}
                  onUpdate={(updatedCategory) => updateItem(category.id, updatedCategory)}
                  onDelete={() => deleteItem(category.id)}
                  availableBudget={availableForExpenses}
                  suggestions={suggestions}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="text-2xl font-light mb-2">No expense categories yet</div>
              <div className="text-xl font-light">Add your first expense category to get started</div>
            </div>
          )}

          <AddItemButton 
            onClick={addExpenseCategory}
            children={!hasItems ? 'Add your first expense category' : 'Add another expense category'}
          />
        </FormSection>

        {/* Expense Allocation Summary - Fixed currency formatting */}
        <FormSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <SummaryCard
              title="Available for Expenses"
              value={availableForExpenses}
              subtitle="Your monthly expense budget"
              accent={true}
            />
            <SummaryCard
              title="Currently Allocated"
              value={totalMonthlyExpenses}
              subtitle="Monthly equivalent"
            />
            <SummaryCard
              title="Remaining to Allocate"
              value={Currency.abs(remainingBudget)}
              subtitle={isOverBudget ? 
                       `Over by ${Currency.format(Currency.abs(remainingBudget))}` : 
                       Currency.isEqual(remainingBudget, 0) ? 'Fully allocated' : 'Available for new categories'}
            />
          </div>
        </FormSection>

      </StandardFormLayout>
    </>
  );
};
