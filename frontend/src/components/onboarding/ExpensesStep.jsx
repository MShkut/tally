import React, { useState, useEffect } from 'react';

import { ThemeToggle } from 'components/shared/ThemeToggle';
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

// Clean expense category component matching IncomeSource and SavingsGoal layout
export const ExpenseCategory = ({ category, onUpdate, onDelete, availableBudget }) => {
  const categoryAmount = parseFloat(category.amount) || 0;
  const isOverBudget = categoryAmount > availableBudget;
  
  return (
    <div className="py-8">
      <div className="grid grid-cols-12 gap-8 items-end">
        {/* Category name: 8 columns - generous space */}
        <div className="col-span-8">
          <StandardInput
            label="Category Name"
            value={category.name}
            onChange={(value) => onUpdate({ ...category, name: value })}
            placeholder="Housing, groceries, transportation, healthcare"
            className="[&_label]:text-2xl [&_label]:font-medium [&_input]:text-2xl [&_input]:font-medium [&_input]:pb-4"
          />
        </div>
        
        {/* Monthly budget: 3 columns */}
        <div className="col-span-3">
          <StandardInput
            label="Monthly Budget"
            type="currency"
            value={category.amount}
            onChange={(value) => onUpdate({ ...category, amount: value })}
            prefix="$"
            error={isOverBudget ? `Exceeds available budget by $${(categoryAmount - availableBudget).toLocaleString()}` : null}
            className="[&_label]:text-2xl [&_label]:font-medium [&_input]:text-2xl [&_input]:font-medium [&_input]:pb-4"
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
  const { 
    items: expenseCategories, 
    addItem, 
    updateItem, 
    deleteItem,
    hasItems,
    setItems
  } = useItemManager();

  // Load saved data on mount
  useEffect(() => {
    if (savedData?.expenses?.expenseCategories?.length > 0) {
      console.log('🔄 Loading saved expense categories:', savedData.expenses.expenseCategories);
      setItems(savedData.expenses.expenseCategories);
    }
  }, [savedData, setItems]);

  // Calculate available budget for expenses
  const totalIncome = incomeData?.totalYearlyIncome || 0;
  const monthlyIncome = totalIncome / 12;
  const monthlySavings = savingsData?.monthlySavings || 0;
  const availableForExpenses = monthlyIncome - monthlySavings;

  const addExpenseCategory = () => {
    addItem({
      name: '', 
      amount: ''
    });
  };

  // Calculate totals
  const totalExpenses = expenseCategories.reduce((total, category) => {
    return total + (parseFloat(category.amount) || 0);
  }, 0);

  const remainingBudget = availableForExpenses - totalExpenses;
  const isOverBudget = remainingBudget < 0;

  // Validation
  const canContinue = totalExpenses > 0 && 
                     !isOverBudget && 
                     expenseCategories.every(category => 
                       validation.hasValidString(category.name) && 
                       validation.isPositiveNumber(category.amount)
                     );

  const handleNext = () => {
    if (onNext && canContinue) {
      onNext({
        expenseCategories,
        totalExpenses,
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

        {/* Expense Allocation Summary - Always visible */}
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
              value={totalExpenses}
              subtitle="Assigned to categories"
            />
            <SummaryCard
              title="Remaining to Allocate"
              value={remainingBudget}
              subtitle={remainingBudget < 0 ? `Over by $${Math.abs(remainingBudget).toLocaleString()}` : 
                       remainingBudget === 0 ? 'Fully allocated' : 'Available for new categories'}
            />
          </div>
        </FormSection>

      </StandardFormLayout>
    </>
  );
};
