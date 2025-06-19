import React from 'react';
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

// Clean expense category component using 12-column grid
const ExpenseCategory = ({ category, onUpdate, onDelete, availableBudget }) => {
  const categoryAmount = parseFloat(category.amount) || 0;
  const isOverBudget = categoryAmount > availableBudget;
  
  return (
    <FormGrid>
      {/* Category name: 8 columns */}
      <FormField span={8}>
        <StandardInput
          label="Category Name"
          value={category.name}
          onChange={(value) => onUpdate({ ...category, name: value })}
          placeholder="Housing, groceries, transportation, healthcare"
        />
      </FormField>
      
      {/* Monthly budget: 3 columns */}
      <FormField span={3}>
        <StandardInput
          label="Monthly Budget"
          type="currency"
          value={category.amount}
          onChange={(value) => onUpdate({ ...category, amount: value })}
          prefix="$"
          error={isOverBudget ? `Exceeds available budget by $${(categoryAmount - availableBudget).toLocaleString()}` : null}
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

const ExpensesStep = ({ onNext, onBack, incomeData, savingsData }) => {
  // Use professional item manager
  const { 
    items: expenseCategories, 
    addItem, 
    updateItem, 
    deleteItem,
    hasItems 
  } = useItemManager();

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
        
        {/* Budget Overview */}
        <SectionBorder />
        <FormSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <SummaryCard
              title="Monthly Income"
              value={monthlyIncome}
            />
            <SummaryCard
              title="Monthly Savings"
              value={monthlySavings}
            />
            <SummaryCard
              title="Available for Expenses"
              value={availableForExpenses}
              accent={true}
            />
          </div>
        </FormSection>

        {/* Expense Categories Section */}
        <FormSection title="Monthly Expense Categories">
          {hasItems && (
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
          )}

          <AddItemButton 
            onClick={addExpenseCategory}
            children={!hasItems ? 'Add your first expense category' : 'Add another expense category'}
          />
        </FormSection>

        {/* Budget Summary */}
        {totalExpenses > 0 && (
          <>
            <SectionBorder />
            <FormSection>
              <div className="text-center">
                <SummaryCard
                  title="Total monthly expenses"
                  value={`$${totalExpenses.toLocaleString()} / $${availableForExpenses.toLocaleString()}`}
                  subtitle={isOverBudget 
                    ? `Over budget by $${Math.abs(remainingBudget).toLocaleString()}` 
                    : remainingBudget > 0 
                      ? `Remaining: $${remainingBudget.toLocaleString()}`
                      : 'Budget fully allocated'
                  }
                  accent={!isOverBudget}
                />
              </div>
            </FormSection>
          </>
        )}

        {/* Helpful Tips */}
        <div className={`py-8 border-l-2 pl-8 border-gray-300`}>
          <h3 className={`text-xl font-light mb-4 text-black`}>
            Essential vs. Lifestyle Categories
          </h3>
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600`}>
            <div>
              <strong>Essential:</strong> Housing, utilities, groceries, transportation, insurance, minimum debt payments
            </div>
            <div>
              <strong>Lifestyle:</strong> Dining out, entertainment, shopping, subscriptions, personal care, hobbies
            </div>
          </div>
          <p className={`mt-4 text-sm text-gray-600`}>
            Start with essentials first, then add lifestyle categories. You can always adjust these amounts later.
          </p>
        </div>

      </StandardFormLayout>
    </>
  );
};

export default ExpensesStep;
