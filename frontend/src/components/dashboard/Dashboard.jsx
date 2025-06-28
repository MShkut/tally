// frontend/src/components/dashboard/Dashboard.jsx
import React, { useState, useEffect, useMemo } from 'react';

import { ThemeToggle } from 'components/shared/ThemeToggle';
import { useTheme } from 'contexts/ThemeContext';
import { dataManager } from 'utils/dataManager';
import { Currency } from 'utils/currency';
import { 
  FormSection,
  SummaryCard,
  SectionBorder,
  TransactionListItem,
  EmptyState
} from 'components/shared/FormComponents';
import { BurgerMenu } from 'components/dashboard/BurgerMenu';
import { BudgetPerformanceSection, calculateBudgetPerformance, calculateNetWorthData } from 'components/dashboard/BudgetPerformanceSection';
import { DashboardViewSelector, generateAvailableMonths } from 'components/dashboard/DashboardViewSelector';
import { handleMenuAction } from 'utils/navigationHandler';

export const Dashboard = ({ onNavigate }) => {
  const { isDarkMode } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [onboardingData, setOnboardingData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
    
  // Global view state
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'period'
  const [selectedMonth, setSelectedMonth] = useState(null); // null = current month
  
  // Process data based on current view mode
  const dashboardData = useMemo(() => 
    processDashboardData(onboardingData, transactions, viewMode, selectedMonth, categories),
    [onboardingData, transactions, viewMode, selectedMonth, categories]
  );
  
  const performanceData = calculateBudgetPerformance(onboardingData, transactions, viewMode, selectedMonth, categories);
  const netWorthData = calculateNetWorthData(onboardingData, viewMode);
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
    const userData = dataManager.loadUserData();
    const userTransactions = dataManager.loadTransactions();
    
    setOnboardingData(userData);
    setTransactions(userTransactions);
    
    // Build categories from user data
    if (userData?.expenses?.expenseCategories) {
      const expenseCategories = userData.expenses.expenseCategories.map(cat => {
        // Convert amount from original frequency to monthly
        const yearlyAmount = Currency.toYearly(cat.amount, cat.frequency);
        const monthlyAmount = Currency.fromYearly(yearlyAmount, 'Monthly');
        
        return {
          id: cat.name.toLowerCase().replace(/\s+/g, '-'),
          name: cat.name,
          type: 'expense',
          amount: monthlyAmount
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
      
      setCategories(allCategories);
    }

    if (!userData || !userData.onboardingComplete) {
      onNavigate('onboarding');
    }
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
            netWorthData={netWorthData}
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

const BudgetCategoryItem = ({ category }) => {
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
};

const IncomeSourceItem = ({ source, viewMode }) => {
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
};

const CleanSavingsGoalItem = ({ goal }) => {
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
};

// Enhanced data processing function
function processDashboardData(onboardingData, transactions, viewMode, selectedMonth, categories) {
  const household = getPersonalizedDashboardTitle(onboardingData?.household?.name);
  const period = formatPeriodInfo(onboardingData);
  
  // Filter transactions based on view mode
  const filteredTransactions = getFilteredTransactions(transactions, viewMode, selectedMonth, onboardingData);
  
  const budgetCategories = processBudgetCategories(onboardingData, filteredTransactions, viewMode, categories);
  const savingsGoals = processSavingsGoals(onboardingData, filteredTransactions, viewMode);
  const netWorth = processNetWorth(onboardingData);
  const incomeBreakdown = processIncomeBreakdown(onboardingData, filteredTransactions, viewMode);

  return {
    household,
    period,
    budgetCategories,
    savingsGoals,
    netWorth,
    incomeBreakdown
  };
}

function processIncomeBreakdown(onboardingData, filteredTransactions, viewMode) {
  const incomeSources = onboardingData?.income?.incomeSources || [];
  
  return incomeSources.map(source => {
    // Calculate expected income based on view mode and frequency
    let expectedAmount = 0;
    const sourceAmount = parseFloat(source.amount) || 0;
    
    if (viewMode === 'period') {
      const periodStart = new Date(onboardingData?.period?.start_date || new Date());
      const now = new Date();
      const monthsElapsed = Math.max(1, 
        ((now.getFullYear() - periodStart.getFullYear()) * 12) + 
        (now.getMonth() - periodStart.getMonth()) + 1
      );
      
      // Convert to yearly based on frequency
      let yearlyAmount = sourceAmount;
      switch(source.frequency) {
        case 'Weekly': yearlyAmount = sourceAmount * 52; break;
        case 'Bi-weekly': yearlyAmount = sourceAmount * 26; break;
        case 'Monthly': yearlyAmount = sourceAmount * 12; break;
        case 'Yearly': yearlyAmount = sourceAmount; break;
        default: yearlyAmount = sourceAmount * 12;
      }
      
      expectedAmount = (yearlyAmount / 12) * monthsElapsed;
    } else {
      // Monthly view - convert frequency to monthly
      switch(source.frequency) {
        case 'Weekly': expectedAmount = sourceAmount * 4.33; break;
        case 'Bi-weekly': expectedAmount = sourceAmount * 2.17; break;
        case 'Monthly': expectedAmount = sourceAmount; break;
        case 'Yearly': expectedAmount = sourceAmount / 12; break;
        default: expectedAmount = sourceAmount;
      }
    }
    
    // Better income matching from transactions
    const actualAmount = filteredTransactions
      .filter(t => {
        if (t.amount <= 0) return false; // Only positive amounts for income
        
        // Match by category
        if (t.category) {
          if (typeof t.category === 'string') {
            return t.category === source.name || 
                   t.category.toLowerCase() === source.name.toLowerCase();
          }
          if (typeof t.category === 'object') {
            return t.category.name === source.name ||
                   t.category.name?.toLowerCase() === source.name.toLowerCase();
          }
        }
        
        // Match by description keywords
        if (t.description) {
          const desc = t.description.toLowerCase();
          const sourceName = source.name.toLowerCase();
          
          if (desc.includes(sourceName)) return true;
          
          // Common income keywords
          if (sourceName.includes('salary') && desc.includes('payroll')) return true;
          if (sourceName.includes('freelance') && (desc.includes('contract') || desc.includes('freelance'))) return true;
        }
        
        return false;
      })
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      name: source.name,
      expected: expectedAmount,
      actual: actualAmount
    };
  });
}

function getFilteredTransactions(transactions, viewMode, selectedMonth, onboardingData) {
  if (viewMode === 'period') {
    const periodStart = new Date(onboardingData?.period?.start_date || new Date());
    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= periodStart;
    });
  } else {
    let targetMonth, targetYear;
    
    if (selectedMonth) {
      const [year, month] = selectedMonth.split('-').map(Number);
      targetMonth = month;
      targetYear = year;
    } else {
      const now = new Date();
      targetMonth = now.getMonth();
      targetYear = now.getFullYear();
    }
    
    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === targetMonth && 
             transactionDate.getFullYear() === targetYear;
    });
  }
}

function processBudgetCategories(onboardingData, filteredTransactions, viewMode, categories) {
  return categories
    .filter(category => category.type === 'expense')
    .map(category => {
      // Calculate spent amount using currency precision
      const spent = filteredTransactions
        .filter(t => matchesCategory(t, category))
        .filter(t => Currency.compare(t.amount, 0) < 0)
        .reduce((sum, t) => Currency.add(sum, Currency.abs(t.amount)), 0);
      
      // Adjust budget based on view mode
      let budget = category.amount || 0;
      if (viewMode === 'period') {
        const monthsElapsed = calculateMonthsElapsed(onboardingData);
        budget = Currency.multiply(budget, monthsElapsed);
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
  
  return goals.map(goal => {
    const actualSaved = calculateActualSavingsForGoal(goal.name, filteredTransactions);
    
    // Adjust target based on view mode
    let target = (parseFloat(goal.amount) || 0) * 12; // Annual target
    if (viewMode === 'month') {
      target = parseFloat(goal.amount) || 0; // Monthly target
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
      const categoryMatches = transaction.category === goalName ||
                             transaction.category === `Savings: ${goalName}` ||
                             (typeof transaction.category === 'object' && 
                              transaction.category?.name === goalName);
      
      const descriptionMatches = transaction.description && 
                                transaction.description.toLowerCase().includes(goalName.toLowerCase());
      
      const isPositiveOrSavingsTransfer = transaction.amount > 0 || 
                                         (transaction.category && 
                                          transaction.category.toLowerCase && 
                                          transaction.category.toLowerCase().includes('savings'));
      
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

function processNetWorth(onboardingData) {
  const netWorthValue = onboardingData?.netWorth?.netWorth || 0;
  return {
    value: netWorthValue,
    subtitle: netWorthValue >= 0 ? 'Positive net worth' : 'Room to grow'
  };
}

// Helper functions
function matchesCategory(transaction, category) {
  if (!transaction.category || !category) return false;
  
  // Handle both string and object categories
  const transactionCategoryName = typeof transaction.category === 'string' 
    ? transaction.category 
    : transaction.category.name;
  
  return transactionCategoryName?.toLowerCase() === category.name.toLowerCase();
}

function calculateMonthsElapsed(onboardingData) {
  if (!onboardingData?.period?.start_date) return 1;
  
  const periodStart = new Date(onboardingData.period.start_date);
  const now = new Date();
  
  return Math.max(1, 
    ((now.getFullYear() - periodStart.getFullYear()) * 12) + 
    (now.getMonth() - periodStart.getMonth()) + 1
  );
}

// Helper function to extract first name and format dashboard title
function getPersonalizedDashboardTitle(householdName) {
  if (!householdName) return 'Your Dashboard';
  
  // Extract first name from household name
  // Handle formats like: "John", "Jane & John", "Smith Family", "John, Jane & Bob"
  const firstName = householdName
    .split(/[\s,&]+/)[0]  // Split by space, comma, or ampersand
    .trim();              // Remove any whitespace
  
  if (!firstName) return 'Your Dashboard';
  
  return `${firstName}'s Dashboard`;
}
