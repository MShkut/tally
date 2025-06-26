// Updated Dashboard component with requested changes
import React, { useState, useEffect, useMemo } from 'react';
import { ThemeToggle } from 'components/shared/ThemeToggle';
import { useTheme } from 'contexts/ThemeContext';
import { dataManager } from 'utils/dataManager';
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
import { ManualTransactionEntry } from './ManualTransactionEntry';
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
  processDashboardData(onboardingData, transactions, viewMode, selectedMonth),
  [onboardingData, transactions, viewMode, selectedMonth]
    );
  const performanceData = calculateBudgetPerformance(onboardingData, transactions, viewMode, selectedMonth);
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
  
  // Build categories from user data - FIXED VERSION
  if (userData?.expenses?.expenseCategories) {
    const expenseCategories = userData.expenses.expenseCategories.map(cat => ({
      id: cat.name.toLowerCase().replace(/\s+/g, '-'),
      name: cat.name,
      type: 'expense',
      // Add budget for reference
      budget: parseFloat(cat.amount) || 0
    }));
    
    const incomeCategories = userData.income?.incomeSources?.map(source => ({
      id: source.name.toLowerCase().replace(/\s+/g, '-'),
      name: source.name,
      type: 'income'
    })) || [];
    
    // Add uncategorized as fallback
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
  
  useEffect(() => {
    const userData = dataManager.loadUserData();
    const userTransactions = dataManager.loadTransactions();
    
    setOnboardingData(userData);
    setTransactions(userTransactions);

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
  onAction={handleMenuActionWrapper}  // Use the wrapper
  currentPage="gifts"
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

          {/* View Context Indicator */}
          <div className={`text-center mb-12 text-sm font-light ${
            isDarkMode ? 'text-gray-500' : 'text-gray-400'
          }`}>
            Showing data for: {getCurrentViewLabel()}
          </div>

          {/* Budget Performance Section - Enhanced with 2 rows */}
          <BudgetPerformanceSection 
            performanceData={performanceData}
            netWorthData={netWorthData}
          />

          <SectionBorder />

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            
            {/* Left Column */}
            <div className="space-y-16">
              {/* Budget Categories */}
              <FormSection title="Budget Categories">
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

              {/* Income Breakdown */}
              <FormSection title="Income Breakdown">
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
            </div>

            {/* Right Column */}
            <div className="space-y-16">
              {/* Savings Progress - Cleaned up without comments */}
              <FormSection title="Savings Goals">
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

// New Income Source Item component
const IncomeSourceItem = ({ source, viewMode }) => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className={`flex items-center justify-between py-4 border-b ${
      isDarkMode ? 'border-gray-800' : 'border-gray-200'
    }`}>
      <div className={`text-base font-light ${
        isDarkMode ? 'text-white' : 'text-black'
      }`}>
        {source.name}
      </div>
      <div className="flex items-center gap-4">
        <div className={`text-sm font-mono text-right ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          ${source.actual.toLocaleString()} / ${source.expected.toLocaleString()}
        </div>
      </div>
    </div>
  );
};

// Cleaned up Savings Goal component without comments
const CleanSavingsGoalItem = ({ goal }) => {
  const { isDarkMode } = useTheme();
  const percentage = goal.target > 0 ? (goal.current / goal.target) * 100 : 0;
  
  return (
    <div className={`py-4 border-b ${
      isDarkMode ? 'border-gray-800' : 'border-gray-200'
    }`}>
      <div className={`text-base font-light mb-2 ${
        isDarkMode ? 'text-white' : 'text-black'
      }`}>
        {goal.name}
      </div>
      
      <div className="flex items-center gap-4">
        <div className={`flex-1 h-1 relative ${
          isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
        }`}>
          <div 
            className={`absolute top-0 left-0 h-full transition-all duration-300 ${
              percentage >= 100 
                ? 'bg-green-500' 
                : percentage >= 90 
                  ? isDarkMode ? 'bg-gray-500' : 'bg-gray-400'
                  : 'bg-yellow-500'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <div className={`text-sm font-mono text-right min-w-20 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          ${(goal.current / 1000).toFixed(1)}k / ${(goal.target / 1000).toFixed(0)}k
        </div>
      </div>
    </div>
  );
};

// Enhanced data processing that includes income breakdown
function processDashboardData(onboardingData, transactions, viewMode, selectedMonth) {
  const household = onboardingData?.household?.name || 'Your Budget';
  const period = formatPeriodInfo(onboardingData);
  
  // Filter transactions based on view mode
  const filteredTransactions = getFilteredTransactions(transactions, viewMode, selectedMonth, onboardingData);
  
  const budgetCategories = processBudgetCategories(onboardingData, filteredTransactions, viewMode);
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
        default: yearlyAmount = sourceAmount * 12; // Default to monthly
      }
      
      expectedAmount = (yearlyAmount / 12) * monthsElapsed;
    } else {
      // Monthly view - convert frequency to monthly
      switch(source.frequency) {
        case 'Weekly': expectedAmount = sourceAmount * 4.33; break;
        case 'Bi-weekly': expectedAmount = sourceAmount * 2.17; break;
        case 'Monthly': expectedAmount = sourceAmount; break;
        case 'Yearly': expectedAmount = sourceAmount / 12; break;
        default: expectedAmount = sourceAmount; // Assume monthly
      }
    }
    
    // FIXED: Better income matching from transactions
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
          
          // Direct name match
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

function processBudgetCategories(onboardingData, filteredTransactions, viewMode) {
  const categories = onboardingData?.expenses?.expenseCategories || [];
  
  return categories.map(category => {
    // FIXED: Proper category matching logic
    const spent = filteredTransactions
      .filter(t => {
        // Handle different category formats
        if (!t.category) return false;
        
        // If category is a string, match directly
        if (typeof t.category === 'string') {
          return t.category === category.name || 
                 t.category.toLowerCase() === category.name.toLowerCase();
        }
        
        // If category is an object, match by name or id
        if (typeof t.category === 'object') {
          const categoryId = category.name.toLowerCase().replace(/\s+/g, '-');
          return t.category.name === category.name || 
                 t.category.id === categoryId ||
                 t.category.name?.toLowerCase() === category.name.toLowerCase();
        }
        
        return false;
      })
      .filter(t => t.amount < 0) // Only expenses (negative amounts)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    // Adjust budget based on view mode
    let budget = parseFloat(category.amount) || 0;
    if (viewMode === 'period') {
      const periodStart = new Date(onboardingData?.period?.start_date || new Date());
      const now = new Date();
      const monthsElapsed = Math.max(1, 
        ((now.getFullYear() - periodStart.getFullYear()) * 12) + 
        (now.getMonth() - periodStart.getMonth()) + 1
      );
      budget = budget * monthsElapsed;
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
