import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Plus,
  Trash2
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeToggle from '../shared/ThemeToggle';
import ProgressBar from '../shared/ProgressBar';
import { IconButton, ICON_CATEGORIES } from '../shared/IconSystem';
import { 
  Page, 
  Card, 
  Heading, 
  Description, 
  PrimaryButton, 
  SecondaryButton,
  SummaryCard,
  SummaryGrid,
  SummarySection,
  AddButton,
  Alert,
  Input
} from '../styled/StyledComponents';

// Budget Category Component
const BudgetCategory = ({ category, onUpdate, onDelete, isDarkMode, availableBudget }) => {
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
        <IconButton
          iconName={category.icon || 'Home'}
          category={ICON_CATEGORIES.EXPENSES}
          onIconChange={handleIconChange}
        />
        
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Category name (e.g., Housing, Food, Transportation)"
            value={category.name}
            onChange={handleNameChange}
          />
        </div>
        
        <div className="w-32">
          <Input
            type="text"
            placeholder="Monthly"
            value={category.amount}
            onChange={handleAmountChange}
            icon={DollarSign}
            className={isOverBudget ? 'border-red-500 bg-red-50' : ''}
          />
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
  const { isDarkMode, currentTheme } = useTheme();
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
    <Page>
      <ThemeToggle />
      <div className="max-w-4xl mx-auto p-6">
        <ProgressBar currentStep={4} />
        
        <div className="text-center mb-8">
          <Heading level={1}>Budget Your Expenses</Heading>
          <Description>
            You have ${availableForExpenses.toLocaleString()}/month for living expenses
          </Description>
        </div>

        <Card>
          {/* Budget Summary */}
          <SummarySection 
            title="Expense Budget Overview" 
            icon={isOverBudget ? AlertTriangle : CheckCircle}
            className={`mb-8 ${
              isOverBudget
                ? isDarkMode 
                  ? 'bg-red-900/20 border-red-800' 
                  : 'bg-red-50 border-red-200'
                : isDarkMode 
                  ? 'bg-blue-900/20 border-blue-800' 
                  : 'bg-blue-50 border-blue-200'
            }`}
          >
            <SummaryGrid cols={4}>
              <SummaryCard
                title="Available Budget"
                value={availableForExpenses}
                accent={true}
              />
              <SummaryCard
                title="Total Budgeted"
                value={totalBudgeted}
              />
              <SummaryCard
                title={isOverBudget ? 'Over Budget' : 'Remaining'}
                value={Math.abs(remainingBudget)}
                className={isOverBudget ? 'text-red-500' : ''}
              />
              <SummaryCard
                title="Budget Used"
                value={`${budgetPercentage.toFixed(0)}%`}
                className={budgetPercentage > 100 ? 'text-red-500' : ''}
              />
            </SummaryGrid>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className={`w-full bg-gray-200 rounded-full h-3 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                <div 
                  className={`h-3 rounded-full transition-all ${
                    isOverBudget ? 'bg-red-500' : budgetPercentage > 80 ? 'bg-yellow-500' : `bg-${currentTheme.primary}-500`
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
              <Alert type="error" className="mt-4">
                ⚠️ You're over budget by ${Math.abs(remainingBudget).toLocaleString()}. 
                Consider reducing some categories or increasing your income.
              </Alert>
            )}
          </SummarySection>

          {/* Expense Categories */}
          <div className="mb-8">
            <Heading level={3} className="mb-6">Monthly Expense Categories</Heading>
            
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
              
              <AddButton onClick={addExpenseCategory}>
                <Plus className="w-5 h-5" />
                <span>Add expense category</span>
              </AddButton>
            </div>
          </div>

          {/* Budget Tips */}
          <Alert type="info" className="mb-8">
            <h4 className="font-semibold mb-2">💡 Budgeting Tips</h4>
            <ul className="text-sm space-y-1">
              <li>• Start with fixed expenses (rent, utilities, insurance)</li>
              <li>• The 50/30/20 rule: 50% needs, 30% wants, 20% savings</li>
              <li>• Track actual spending to refine your budget over time</li>
              <li>• Leave some buffer for unexpected expenses</li>
            </ul>
          </Alert>

          {/* Navigation */}
          <div className="flex justify-between">
            <SecondaryButton onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </SecondaryButton>
            <PrimaryButton
              onClick={handleNext}
              disabled={expenseCategories.length === 0}
              className={isOverBudget ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
            >
              {isOverBudget ? 'Continue Anyway' : 'Next'} <ArrowRight className="w-4 h-4 ml-2" />
            </PrimaryButton>
          </div>
        </Card>
      </div>
    </Page>
  );
};

export default ExpensesStep;
