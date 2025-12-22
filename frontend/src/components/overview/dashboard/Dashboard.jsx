import React from 'react';
// frontend/src/components/dashboard/Dashboard.jsx
import { useState, useEffect, useMemo } from 'react';

import { ThemeToggle } from 'components/shared/ThemeToggle';
import { useTheme } from 'contexts/ThemeContext';
import { apiService } from 'utils/apiService';
import { Currency } from 'utils/currency';
import {
  FormSection,
  SummaryCard,
  SectionBorder,
  TransactionListItem,
  EmptyState
} from 'components/shared/FormComponents';
import { BurgerMenu } from 'components/shared/BurgerMenu';
import { BudgetPerformanceSection } from 'components/overview/dashboard/BudgetPerformanceSection';
import { DashboardViewSelector, generateAvailableMonths } from 'components/overview/dashboard/DashboardViewSelector';
import { handleMenuAction } from 'utils/navigationHandler';
import { useBudgetMath } from 'hooks/useBudgetMath';

export const Dashboard = ({ onNavigate, onLogout }) => {
  const { isDarkMode } = useTheme();
  const budgetMath = useBudgetMath();
  const [menuOpen, setMenuOpen] = useState(false);
  const [onboardingData, setOnboardingData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);

  // Global view state
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'period'
  const [selectedMonth, setSelectedMonth] = useState(null); // null = current month

  // Process data based on current view mode using budgetMath hook
  const dashboardData = useMemo(() =>
    processDashboardData(onboardingData, transactions, viewMode, selectedMonth, categories, budgetMath),
    [onboardingData, transactions, viewMode, selectedMonth, categories, budgetMath]
  );

  // Calculate performance using budgetMath hook
  const performanceData = budgetMath.calculatePerformanceData(
    onboardingData,
    transactions,
    viewMode,
    selectedMonth,
    categories
  );

  // availableMonths calculated from data
  const availableMonths = generateAvailableMonths(onboardingData, transactions);

  // Handle menu state changes to prevent layout shift
  useEffect(() => {
    if (menuOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.paddingRight = '';
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.paddingRight = '';
      document.body.style.overflow = '';
    };
  }, [menuOpen]);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await apiService.loadUserData();
        const userTransactions = await apiService.loadTransactions();

        setOnboardingData(userData);
        setTransactions(userTransactions);

        // Build categories from user data
        if (userData?.expenses?.expenseCategories) {
          console.log('[Dashboard] Raw expense categories from userData:', userData.expenses.expenseCategories);

          const expenseCategories = userData.expenses.expenseCategories.map(cat => {
            // Convert amount from original frequency to monthly
            const yearlyAmount = Currency.toYearly(cat.amount, cat.frequency);
            const monthlyAmount = Currency.fromYearly(yearlyAmount, 'Monthly');

            return {
              id: cat.name.toLowerCase().replace(/\s+/g, '-'),
              name: cat.name,
              type: 'expense',
              amount: monthlyAmount,
              frequency: cat.frequency, // Preserve frequency for period calculations
              originalAmount: cat.amount // Preserve original amount for One-time/Yearly
            };
          });

          const incomeCategories = userData.income?.incomeSources?.map(source => ({
            id: source.name.toLowerCase().replace(/\s+/g, '-'),
            name: source.name,
            type: 'income'
          })) || [];

          const allCategories = [
            { id: 'uncategorized', name: 'Uncategorized', type: 'unknown' },
            ...incomeCategories,
            ...expenseCategories
          ];

          console.log('[Dashboard] Built expense categories:', expenseCategories);
          console.log('[Dashboard] All categories:', allCategories);
          setCategories(allCategories);
        } else {
          console.warn('[Dashboard] No expense categories found in userData');
        }

        if (!userData || !userData.onboardingComplete) {
          onNavigate('onboarding');
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };

    loadData();
  }, [onNavigate]);
  
  // Save selected month to sessionStorage
  useEffect(() => {
    if (selectedMonth) {
      sessionStorage.setItem('tally_selectedMonth', selectedMonth);
    }
  }, [selectedMonth]);
  
  // Load selected month on mount
  useEffect(() => {
    const savedMonth = sessionStorage.getItem('tally_selectedMonth');
    if (savedMonth && availableMonths.some(m => m.value === savedMonth)) {
      setSelectedMonth(savedMonth);
    }
  }, [availableMonths]);
  
  const handleMenuActionWrapper = (actionId) => {
    // Handle preferences specially to avoid recursion
    if (actionId === 'preferences') {
      setMenuOpen(false);
      onNavigate('settings');
      return;
    }
    handleMenuAction(actionId, onNavigate, () => setMenuOpen(false));
  };

  // Get current view label for display
  const getCurrentViewLabel = () => {
    if (viewMode === 'period') {
      return 'Period Total';
    } else if (selectedMonth) {
      const month = availableMonths.find(m => m.value === selectedMonth);
      return month ? month.label : 'Selected Month';
    } else {
      return 'This Month';
    }
  };

  return (
    <>
      <BurgerMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onAction={handleMenuActionWrapper}
        currentPage="dashboard"
        onLogout={onLogout}
      />
      
      <div className={`min-h-screen transition-colors duration-300 ${
        isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'
      }`}>
        
        {/* Fixed Controls */}
        <button
          onClick={() => setMenuOpen(true)}
          className={`
            fixed top-8 left-8 z-40 p-2 transition-colors duration-200
            ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}
          `}
          aria-label="Open menu"
        >
          <BurgerIcon />
        </button>

        <ThemeToggle />

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-6 py-12">
          
          {/* Header Section */}
          <div className="mb-16 ml-16">
            <h1 className={`text-6xl font-light leading-tight mb-4 ${
              isDarkMode ? 'text-white' : 'text-black'
            }`}>
              {dashboardData.household}
            </h1>
            <p className={`text-2xl font-light ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {dashboardData.period}
            </p>
          </div>

          {/* Global View Selector */}
          <DashboardViewSelector
            viewMode={viewMode}
            setViewMode={setViewMode}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            availableMonths={availableMonths}
          />


          {/* Budget Performance Section - Enhanced with 2 rows */}
          <BudgetPerformanceSection
            performanceData={performanceData}
          />

          {/* Single divider border */}
          <div className={`my-8 border-t ${
            isDarkMode ? 'border-gray-800' : 'border-gray-200'
          }`} />

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            
            {/* Left Column */}
            <div className="space-y-16">
              {/* Income */}
              <FormSection title="Income">
                {dashboardData.incomeBreakdown.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.incomeBreakdown.map((source, index) => (
                      <IncomeSourceItem key={index} source={source} viewMode={viewMode} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No income data"
                    description="Add income sources in onboarding to see breakdown"
                  />
                )}
              </FormSection>

              {/* Savings */}
              <FormSection title="Savings">
                {dashboardData.savingsGoals.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.savingsGoals.map((goal, index) => (
                      <CleanSavingsGoalItem key={index} goal={goal} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No savings goals"
                    description="Set up savings goals in your onboarding to track progress"
                  />
                )}
              </FormSection>
            </div>

            {/* Right Column */}
            <div className="space-y-16">
              {/* Expenses */}
              <FormSection title="Expenses">
                {dashboardData.budgetCategories.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.budgetCategories.map((category, index) => (
                      <BudgetCategoryItem key={index} category={category} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No budget categories"
                    description="Complete your onboarding to see budget breakdown"
                  />
                )}
              </FormSection>
            </div>
          </div>

          <div className="h-24"></div>
        </div>
      </div>
    </>
  );
};

// Helper components
const BurgerIcon = () => (
  <div className="w-5 h-5 flex flex-col justify-between">
    <div className="w-full h-0.5 bg-current transition-all duration-300" />
    <div className="w-full h-0.5 bg-current transition-all duration-300" />
    <div className="w-full h-0.5 bg-current transition-all duration-300" />
  </div>
);

const BudgetCategoryItem = React.memo(({ category }) => {
  const { isDarkMode } = useTheme();
  const percentage = category.budget > 0 ? (category.spent / category.budget) * 100 : 0;
  const isOverBudget = percentage > 100;

  return (
    <div className={`flex items-center justify-between py-4 border-b ${
      isDarkMode ? 'border-gray-800' : 'border-gray-200'
    }`}>
      <div className={`text-base font-light ${
        isDarkMode ? 'text-white' : 'text-black'
      }`}>
        {category.name}
      </div>
      <div className="flex items-center gap-4 min-w-80">
        <div className="flex-1 max-w-24">
          <div className={`w-full h-1 relative ${
            isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
          }`}>
            <div 
              className={`absolute top-0 left-0 h-full transition-all duration-300 ${
                isOverBudget 
                  ? 'bg-red-500' 
                  : isDarkMode ? 'bg-gray-400' : 'bg-gray-600'
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>
        <div className={`text-sm font-mono text-right min-w-24 ${
          isOverBudget 
            ? 'text-red-500' 
            : isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          ${category.spent.toLocaleString()} / ${category.budget.toLocaleString()}
        </div>
      </div>
    </div>
  );
});

const IncomeSourceItem = React.memo(({ source, viewMode }) => {
  const { isDarkMode } = useTheme();
  const percentage = source.expected > 0 ? (source.actual / source.expected) * 100 : 0;
  const isOverExpected = percentage > 100;

  return (
    <div className={`flex items-center justify-between py-4 border-b ${
      isDarkMode ? 'border-gray-800' : 'border-gray-200'
    }`}>
      <div className={`text-base font-light ${
        isDarkMode ? 'text-white' : 'text-black'
      }`}>
        {source.name}
      </div>
      <div className="flex items-center gap-4 min-w-80">
        <div className="flex-1 max-w-24">
          <div className={`w-full h-1 relative ${
            isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
          }`}>
            <div 
              className={`absolute top-0 left-0 h-full transition-all duration-300 ${
                isOverExpected 
                  ? 'bg-green-500' 
                  : isDarkMode ? 'bg-gray-400' : 'bg-gray-600'
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>
        <div className={`text-sm font-mono text-right min-w-24 ${
          isOverExpected 
            ? 'text-green-500' 
            : isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          ${source.actual.toLocaleString()} / ${source.expected.toLocaleString()}
        </div>
      </div>
    </div>
  );
});

const CleanSavingsGoalItem = React.memo(({ goal }) => {
  const { isDarkMode } = useTheme();
  const percentage = goal.target > 0 ? (goal.current / goal.target) * 100 : 0;
  const isOnTrack = percentage >= 100;
  
  return (
    <div className={`flex items-center justify-between py-4 border-b ${
      isDarkMode ? 'border-gray-800' : 'border-gray-200'
    }`}>
      <div className={`text-base font-light ${
        isDarkMode ? 'text-white' : 'text-black'
      }`}>
        {goal.name}
      </div>
      <div className="flex items-center gap-4 min-w-80">
        <div className="flex-1 max-w-24">
          <div className={`w-full h-1 relative ${
            isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
          }`}>
            <div 
              className={`absolute top-0 left-0 h-full transition-all duration-300 ${
                percentage >= 100 
                  ? 'bg-green-500' 
                  : percentage >= 90 
                    ? 'bg-yellow-500'
                    : isDarkMode ? 'bg-gray-400' : 'bg-gray-600'
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>
        <div className={`text-sm font-mono text-right min-w-24 ${
          isOnTrack 
            ? 'text-green-500' 
            : isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          ${goal.current.toLocaleString()} / ${goal.target.toLocaleString()}
        </div>
      </div>
    </div>
  );
});

// Enhanced data processing function using budgetMath hook
function processDashboardData(onboardingData, transactions, viewMode, selectedMonth, categories, budgetMath) {
  const household = getPersonalizedDashboardTitle(onboardingData?.household?.name);
  const period = formatPeriodInfo(onboardingData);

  // Filter transactions based on view mode using budgetMath
  const filteredTransactions = budgetMath.filterTransactionsByPeriod(
    transactions,
    viewMode,
    selectedMonth,
    onboardingData
  );

  const budgetCategories = processBudgetCategories(filteredTransactions, viewMode, categories, budgetMath, onboardingData, selectedMonth);
  const savingsGoals = processSavingsGoals(onboardingData, filteredTransactions, viewMode);
  const incomeBreakdown = processIncomeBreakdown(onboardingData, filteredTransactions, viewMode, budgetMath, selectedMonth);

  return {
    household,
    period,
    budgetCategories,
    savingsGoals,
    incomeBreakdown
  };
}

function processIncomeBreakdown(onboardingData, filteredTransactions, viewMode, budgetMath, selectedMonth) {
  const incomeSources = onboardingData?.income?.incomeSources || [];

  // For month view: Only show One-time/Yearly if there's a transaction for it
  // For period view: Show all sources
  let sourcesToDisplay = incomeSources;

  if (viewMode === 'month') {
    sourcesToDisplay = incomeSources.filter(source => {
      // Recurring frequencies (Weekly, Bi-weekly, Monthly) always show
      if (!['One-time', 'Yearly'].includes(source.frequency)) {
        return true;
      }

      // One-time/Yearly: Only show if there's a transaction in filteredTransactions
      const hasTransaction = filteredTransactions.some(t =>
        budgetMath.matchesIncomeSource(t, [source])
      );

      return hasTransaction;
    });
  }

  return sourcesToDisplay.map(source => {
    // Calculate expected income using budgetMath
    let expectedAmount = 0;

    if (viewMode === 'period') {
      // Period view logic
      if (source.frequency === 'One-time') {
        // One-time: Show full amount once
        expectedAmount = parseFloat(source.amount) || 0;
      } else if (source.frequency === 'Yearly') {
        // Yearly: Show full amount once
        expectedAmount = parseFloat(source.amount) || 0;
      } else {
        // Recurring: Convert to monthly then multiply by period duration
        const periodDuration = onboardingData?.period?.duration_months || 12;
        expectedAmount = budgetMath.calculatePeriodIncome([source], periodDuration);
      }
    } else {
      // Monthly view - for One-time/Yearly, use the full amount since it's in this month
      if (source.frequency === 'One-time' || source.frequency === 'Yearly') {
        expectedAmount = parseFloat(source.amount) || 0;
      } else {
        // Recurring: convert to monthly
        const yearlyAmount = Currency.toYearly(source.amount, source.frequency);
        expectedAmount = Currency.fromYearly(yearlyAmount, 'Monthly');
      }
    }

    // Calculate actual income from transactions using budgetMath
    const actualAmount = budgetMath.calculateActualIncome(filteredTransactions, [source]);

    return {
      name: source.name,
      expected: expectedAmount,
      actual: actualAmount
    };
  });
}

function processBudgetCategories(filteredTransactions, viewMode, categories, budgetMath, onboardingData, selectedMonth) {
  let categoriesToDisplay = categories.filter(category => category.type === 'expense');
  console.log('[processBudgetCategories] Expense categories to display:', categoriesToDisplay);
  console.log('[processBudgetCategories] Filtered transactions:', filteredTransactions.map(t => ({
    date: t.date,
    description: t.description,
    amount: t.amount,
    main_category: t.main_category,
    sub_category: t.sub_category
  })));

  // For month view: Only show One-time/Yearly if there's a transaction for it
  // For period view: Show all categories
  if (viewMode === 'month') {
    categoriesToDisplay = categoriesToDisplay.filter(category => {
      // Recurring frequencies (Weekly, Bi-weekly, Monthly) always show
      if (!['One-time', 'Yearly'].includes(category.frequency)) {
        return true;
      }

      // One-time/Yearly: Only show if there's a transaction in filteredTransactions
      const hasTransaction = filteredTransactions.some(t =>
        budgetMath.matchesCategory(t, [category])
      );

      return hasTransaction;
    });
  }

  return categoriesToDisplay
    .map(category => {
      // Calculate spent amount using budgetMath
      const matchingTransactions = filteredTransactions.filter(t => budgetMath.matchesCategory(t, [category]));
      console.log(`[processBudgetCategories] Category "${category.name}" matches ${matchingTransactions.length} transactions`, matchingTransactions);

      // Filter for expense transactions (main_category === 'expense')
      const expenseTransactions = matchingTransactions.filter(t =>
        t.main_category && t.main_category.toLowerCase() === 'expense'
      );
      console.log(`[processBudgetCategories] Category "${category.name}" has ${expenseTransactions.length} expense transactions`, expenseTransactions);

      // Sum up absolute values (handle both positive and negative amounts)
      const spent = expenseTransactions
        .reduce((sum, t) => Currency.add(sum, Currency.abs(t.amount)), 0);

      console.log(`[processBudgetCategories] Category "${category.name}" spent: $${spent}, budget: $${category.amount}`);

      // Adjust budget based on view mode and frequency
      let budget = category.amount || 0;
      const frequency = category.frequency || 'Monthly';

      if (viewMode === 'period') {
        // Period view logic
        if (frequency === 'One-time') {
          // One-time: Show full original amount once
          budget = category.originalAmount || category.amount || 0;
        } else if (frequency === 'Yearly') {
          // Yearly: Show full original amount once
          budget = category.originalAmount || category.amount || 0;
        } else {
          // Recurring: Multiply monthly by period duration
          const periodDuration = onboardingData?.period?.duration_months || 12;
          budget = Currency.multiply(budget, periodDuration);
        }
      } else {
        // Month view: For One-time/Yearly, use original amount; for recurring, use monthly
        if (frequency === 'One-time' || frequency === 'Yearly') {
          budget = category.originalAmount || category.amount || 0;
        }
        // Else: already has monthly amount in category.amount
      }

      return {
        name: category.name,
        spent: spent,
        budget: budget
      };
    });
}

function processSavingsGoals(onboardingData, filteredTransactions, viewMode) {
  const goals = onboardingData?.savingsAllocation?.savingsGoals || [];

  // For month view: Only show One-time/Yearly if there's a transaction for it
  // For period view: Show all goals
  let goalsToDisplay = goals;

  if (viewMode === 'month') {
    goalsToDisplay = goals.filter(goal => {
      // Recurring frequencies (Weekly, Bi-weekly, Monthly) always show
      const frequency = goal.frequency || 'Monthly';
      if (!['One-time', 'Yearly'].includes(frequency)) {
        return true;
      }

      // One-time/Yearly: Only show if there's a transaction
      const hasTransaction = filteredTransactions.some(t => {
        const categoryMatches = t.sub_category === goal.name ||
                               t.sub_category === `Savings: ${goal.name}`;

        const descriptionMatches = t.description &&
                                  t.description.toLowerCase().includes(goal.name.toLowerCase());

        return categoryMatches || descriptionMatches;
      });

      return hasTransaction;
    });
  }

  return goalsToDisplay.map(goal => {
    const actualSaved = calculateActualSavingsForGoal(goal.name, filteredTransactions);

    // Adjust target based on view mode and frequency
    const frequency = goal.frequency || 'Monthly';
    let target = parseFloat(goal.amount) || 0;

    if (viewMode === 'period') {
      // Period view: Convert frequency to period total
      const periodDuration = onboardingData?.period?.duration_months || 12;
      if (frequency === 'One-time') {
        // One-time: Use full amount
        target = parseFloat(goal.amount) || 0;
      } else if (frequency === 'Yearly') {
        // Yearly: Use full amount (already yearly)
        target = parseFloat(goal.amount) || 0;
      } else {
        // Recurring (Weekly, Bi-weekly, Monthly): Convert to monthly then multiply
        const yearlyAmount = Currency.toYearly(goal.amount, frequency);
        const monthlyAmount = Currency.fromYearly(yearlyAmount, 'Monthly');
        target = Currency.multiply(monthlyAmount, periodDuration);
      }
    } else {
      // Month view: Show appropriate monthly amount
      if (frequency === 'One-time' || frequency === 'Yearly') {
        // One-time/Yearly in month view: Use full amount (it's in this month)
        target = parseFloat(goal.amount) || 0;
      } else {
        // Recurring: Convert to monthly
        const yearlyAmount = Currency.toYearly(goal.amount, frequency);
        target = Currency.fromYearly(yearlyAmount, 'Monthly');
      }
    }

    return {
      name: goal.name,
      current: actualSaved,
      target: target,
      monthlyBudget: parseFloat(goal.amount) || 0
    };
  });
}

function calculateActualSavingsForGoal(goalName, filteredTransactions) {
  return filteredTransactions
    .filter(transaction => {
      const categoryMatches = transaction.sub_category === goalName ||
                             transaction.sub_category === `Savings: ${goalName}`;

      const descriptionMatches = transaction.description &&
                                transaction.description.toLowerCase().includes(goalName.toLowerCase());

      const isPositiveOrSavingsTransfer = transaction.amount > 0 ||
                                         (transaction.main_category?.toLowerCase() === 'savings');

      return (categoryMatches || descriptionMatches) && isPositiveOrSavingsTransfer;
    })
    .reduce((total, transaction) => total + Math.abs(transaction.amount), 0);
}

function formatPeriodInfo(onboardingData) {
  if (!onboardingData?.period) return 'Budget Period';

  const startDate = new Date(onboardingData.period.start_date);
  const durationMonths = onboardingData.period.duration_months;
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + durationMonths - 1);

  const now = new Date();
  const monthsElapsed = Math.max(1, Math.floor((now - startDate) / (1000 * 60 * 60 * 24 * 30)) + 1);
  const currentMonth = Math.min(monthsElapsed, durationMonths);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  return `${formatDate(startDate)} to ${formatDate(endDate)} • Month ${currentMonth} of ${durationMonths}`;
}

// Helper function to format dashboard title with full household name
function getPersonalizedDashboardTitle(householdName) {
  if (!householdName) return 'Your Dashboard';

  return `${householdName}'s Dashboard`;
}
