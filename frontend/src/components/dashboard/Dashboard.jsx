// Updated Dashboard component with requested changes
import React, { useState, useEffect, useMemo } from 'react';

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

export const Dashboard = ({ onNavigate }) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [onboardingData, setOnboardingData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  
  // Global view state
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'period'
  const [selectedMonth, setSelectedMonth] = useState(null); // null = current month

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
    const availableMonths = generateAvailableMonths(onboardingData, transactions);
    if (savedMonth && availableMonths.some(m => m.value === savedMonth)) {
      setSelectedMonth(savedMonth);
    }
  }, [availableMonths]);
  
    const handleMenuAction = (actionId) => {
    setMenuOpen(false);
    
    switch (actionId) {
      case 'import':
        onNavigate('import');
        break;
      case 'gifts':
        onNavigate('gifts');
        break;
      case 'start-next-period':
        onNavigate('onboarding');
        break;
      case 'export':
        const exportData = dataManager.exportData();
        console.log('Export data:', exportData);
        break;
      case 'reset-data':
        dataManager.resetAllData();
        onNavigate('onboarding');
        break;
      case 'dashboard':
        break;
      case 'gifts':
        onNavigate('gifts');
        break;
      case 'networth':
        onNavigate('networth');
        break;
      case 'edit-income':
        onNavigate('edit-income');
        break;
      case 'edit-savings':
        onNavigate('edit-savings');
        break;
      case 'edit-expenses':
        onNavigate('edit-expenses');
        break;
      case 'plan-next-period':
        onNavigate('plan-next-period');
        break;
      default:
        console.log(`Action ${actionId} not implemented`);
    }
  };

  if (!onboardingData) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'
      }`}>
        <div className="text-xl font-light">Loading your dashboard...</div>
      </div>
    );
  }

  // Process data based on current view mode
  const dashboardData = useMemo(() => 
  processDashboardData(onboardingData, transactions, viewMode, selectedMonth),
  [onboardingData, transactions, viewMode, selectedMonth]
);
  const performanceData = calculateBudgetPerformance(onboardingData, transactions, viewMode, selectedMonth);
  const netWorthData = calculateNetWorthData(onboardingData, viewMode);
  const availableMonths = generateAvailableMonths(onboardingData, transactions);

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
        onAction={handleMenuAction}
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

        <div className="fixed top-8 right-8 z-40">
          <button
            onClick={toggleTheme}
            className={`
              p-3 transition-colors focus:outline-none
              ${isDarkMode 
                ? 'text-gray-400 hover:text-gray-300' 
                : 'text-gray-600 hover:text-gray-800'
              }
            `}
            title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
          >
            <span className="text-xl">{isDarkMode ? '◐' : '◑'}</span>
          </button>
        </div>

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
    // Calculate expected income based on view mode
    let expectedAmount = 0;
    if (viewMode === 'period') {
      const periodStart = new Date(onboardingData?.period?.start_date || new Date());
      const now = new Date();
      const monthsElapsed = Math.max(1, 
        ((now.getFullYear() - periodStart.getFullYear()) * 12) + 
        (now.getMonth() - periodStart.getMonth()) + 1
      );
      // Convert to yearly, then prorate for elapsed months
      const yearlyAmount = parseFloat(source.amount) * (source.frequency === 'Monthly' ? 12 : 
                                                        source.frequency === 'Yearly' ? 1 :
                                                        source.frequency === 'Weekly' ? 52 :
                                                        source.frequency === 'Bi-weekly' ? 26 : 12);
      expectedAmount = (yearlyAmount / 12) * monthsElapsed;
    } else {
      // Monthly view
      expectedAmount = source.frequency === 'Monthly' ? parseFloat(source.amount) :
                      source.frequency === 'Yearly' ? parseFloat(source.amount) / 12 :
                      source.frequency === 'Weekly' ? parseFloat(source.amount) * 4.33 :
                      source.frequency === 'Bi-weekly' ? parseFloat(source.amount) * 2.17 :
                      parseFloat(source.amount);
    }
    
    // Calculate actual income from transactions (this is simplified - in reality you'd need better matching)
    const actualAmount = filteredTransactions
      .filter(t => t.amount > 0 && 
        (t.description?.toLowerCase().includes(source.name.toLowerCase()) ||
         t.category === source.name ||
         (t.description?.toLowerCase().includes('salary') && source.name.toLowerCase().includes('salary'))
        )
      )
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
    const spent = filteredTransactions
      .filter(t => t.category === category.name && t.amount < 0)
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
