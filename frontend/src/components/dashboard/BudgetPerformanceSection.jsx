// frontend/src/components/dashboard/BudgetPerformanceSection.jsx - Enhanced Version
import React from 'react';

import { useTheme } from 'contexts/ThemeContext';
import { convertToYearly } from 'utils/incomeHelpers';
import { Currency } from 'utils/currency';

// Enhanced Budget Performance Section with 2 rows
export const BudgetPerformanceSection = ({ performanceData, netWorthData }) => {
  const { isDarkMode } = useTheme();

  return (
    <section className="mb-20">
      <h2 className={`text-2xl font-light mb-8 ${
        isDarkMode ? 'text-white' : 'text-black'
      }`}>
        Budget Performance
      </h2>

      {/* First Row - Main Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-12">
        <PerformanceCategory
          title="Income"
          data={performanceData.income}
          type="income"
        />
        <PerformanceCategory
          title="Savings"
          data={performanceData.savings}
          type="savings"
        />
        <PerformanceCategory
          title="Expenses"
          data={performanceData.expenses}
          type="expenses"
        />
      </div>

      {/* Second Row - Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <NetWorthCategory
          title="Net Worth"
          data={netWorthData}
        />
        {/* Two empty slots for future expansion */}
        <div></div>
        <div></div>
      </div>
    </section>
  );
};

// Individual Performance Category Component
const PerformanceCategory = ({ title, data, type }) => {
  const { isDarkMode } = useTheme();
  
  const getVarianceColor = (variance, type) => {
    if (Currency.compare(variance, 0) === 0) return isDarkMode ? 'text-gray-400' : 'text-gray-600';
    
    if (type === 'income') {
      return Currency.compare(variance, 0) > 0 ? 'text-green-500' : 'text-yellow-500';
    }
    if (type === 'expenses') {
      return Currency.compare(variance, 0) > 0 ? 'text-red-500' : 'text-green-500';
    }
    if (type === 'savings') {
      return Currency.compare(variance, 0) > 0 ? 'text-green-500' : 'text-yellow-500';
    }
    
    return isDarkMode ? 'text-gray-400' : 'text-gray-600';
  };

  const getVarianceLabel = (variance, type) => {
    if (Currency.compare(variance, 0) === 0) return 'On target';
    
    const amount = Currency.abs(variance);
    const formattedAmount = Currency.format(amount, { showCents: false });
    
    if (type === 'income') {
      return Currency.compare(variance, 0) > 0 ? `${formattedAmount} above expected` : `${formattedAmount} below expected`;
    }
    if (type === 'expenses') {
      return Currency.compare(variance, 0) > 0 ? `${formattedAmount} over budget` : `${formattedAmount} under budget`;
    }
    if (type === 'savings') {
      return Currency.compare(variance, 0) > 0 ? `${formattedAmount} ahead of plan` : `${formattedAmount} behind plan`;
    }
    
    return `${Currency.compare(variance, 0) > 0 ? 'over' : 'under'} by ${formattedAmount}`;
  };

  const percentage = Currency.compare(data.planned, 0) > 0 ? 
    Currency.multiply(Currency.divide(data.actual, data.planned), 100) : 0;
  const variance = Currency.subtract(data.actual, data.planned);

  return (
    <div>
      {/* Category Title */}
      <h3 className={`text-sm font-medium uppercase tracking-wider mb-6 ${
        isDarkMode ? 'text-gray-500' : 'text-gray-400'
      }`}>
        {title}
      </h3>

      {/* Main Numbers */}
      <div className="mb-6">
        <div className={`text-3xl font-light leading-none mb-2 font-mono ${
          isDarkMode ? 'text-white' : 'text-black'
        }`}>
          {Currency.format(data.actual, { showCents: false })}
        </div>
        <div className={`text-base font-light ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          of {Currency.format(data.planned, { showCents: false })} planned
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="mb-4">
        <div className={`w-full h-1 relative mb-2 ${
          isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
        }`}>
          <div 
            className={`absolute top-0 left-0 h-full transition-all duration-300 ${
              percentage >= 100 
                ? type === 'expenses' 
                  ? 'bg-red-500'    // Over budget on expenses = bad
                  : 'bg-green-500'  // Over target on income/savings = good
                : percentage >= 90 
                  ? isDarkMode ? 'bg-gray-400' : 'bg-gray-600'
                  : 'bg-yellow-500'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <div className={`text-xs font-mono ${
          isDarkMode ? 'text-gray-500' : 'text-gray-500'
        }`}>
          {percentage.toFixed(0)}% of planned
        </div>
      </div>

      {/* Variance Display */}
      <div className={`text-sm font-light ${getVarianceColor(variance, type)}`}>
        {getVarianceLabel(variance, type)}
      </div>
    </div>
  );
};

// Net Worth Category Component
const NetWorthCategory = ({ title, data }) => {
  const { isDarkMode } = useTheme();
  
  const getTrendColor = (trend) => {
    if (Currency.compare(trend, 0) > 0) return 'text-green-500';
    if (Currency.compare(trend, 0) < 0) return 'text-red-500';
    return isDarkMode ? 'text-gray-400' : 'text-gray-600';
  };

  const getTrendLabel = (trend) => {
    if (Currency.compare(trend, 0) === 0) return 'No change this period';
    const amount = Currency.abs(trend);
    const formattedAmount = Currency.format(amount, { showCents: false });
    return Currency.compare(trend, 0) > 0 
      ? `+${formattedAmount} this period` 
      : `-${formattedAmount} this period`;
  };

  const trendArrow = Currency.compare(data.trend, 0) > 0 ? '↗' : Currency.compare(data.trend, 0) < 0 ? '↘' : '→';

  return (
    <div>
      {/* Category Title */}
      <h3 className={`text-sm font-medium uppercase tracking-wider mb-6 ${
        isDarkMode ? 'text-gray-500' : 'text-gray-400'
      }`}>
        {title}
      </h3>

      {/* Main Number */}
      <div className="mb-6">
        <div className={`text-3xl font-light leading-none mb-2 font-mono ${
          Currency.compare(data.value, 0) >= 0 
            ? isDarkMode ? 'text-white' : 'text-black'
            : 'text-red-500'
        }`}>
          {Currency.format(data.value, { showCents: false })}
        </div>
        <div className={`text-base font-light ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          {Currency.compare(data.value, 0) >= 0 ? 'Positive net worth' : 'Room to grow'}
        </div>
      </div>

      {/* Trend Indicator */}
      <div className="mb-4">
        <div className={`text-lg font-light ${getTrendColor(data.trend)}`}>
          {trendArrow}
        </div>
      </div>

      {/* Trend Display */}
      <div className={`text-sm font-light ${getTrendColor(data.trend)}`}>
        {getTrendLabel(data.trend)}
      </div>
    </div>
  );
};

// Enhanced data calculation functions
const calculateBudgetPerformance = (onboardingData, transactions, viewMode, selectedMonth) => {
  // Use currency system for all calculations
  const plannedMonthlyIncome = Currency.fromYearly(
    onboardingData?.income?.totalYearlyIncome || 0, 
    'Monthly'
  );

export const calculateNetWorthData = (onboardingData, viewMode) => {
  const netWorthValue = onboardingData?.netWorth?.netWorth || 0;
  
  // For now, we don't have historical data to calculate actual trend
  // In the future, this could track period-over-period changes
  const trend = 0; // Placeholder for future implementation
  
  return {
    value: netWorthValue,
    trend: trend
  };
};

function calculateMonthPerformance(onboardingData, transactions, selectedMonth) {
  let targetMonth, targetYear;
  
  if (selectedMonth) {
    // Parse selected month (format: "2024-5")
    const [year, month] = selectedMonth.split('-').map(Number);
    targetMonth = month;
    targetYear = year;
  } else {
    // Default to current month
    const now = new Date();
    targetMonth = now.getMonth();
    targetYear = now.getFullYear();
  }
  
  // Filter transactions for target month
  const monthlyTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate.getMonth() === targetMonth && 
           transactionDate.getFullYear() === targetYear;
  });

  // Income Performance - using Currency system
  const plannedMonthlyIncome = Currency.divide(onboardingData?.income?.totalYearlyIncome || 0, 12);
  const actualMonthlyIncome = monthlyTransactions
    .filter(t => Currency.isPositive(t.amount))
    .reduce((sum, t) => Currency.add(sum, t.amount), 0);

  // Savings Performance - using Currency system
  const plannedMonthlySavings = onboardingData?.savingsAllocation?.monthlySavings || 0;
  const actualMonthlySavings = calculateActualMonthlySavings(monthlyTransactions, onboardingData);

  // Expenses Performance - using Currency system
  const expenseCategories = onboardingData?.expenses?.expenseCategories || [];
  const plannedMonthlyExpenses = expenseCategories.reduce((sum, cat) => 
    Currency.add(sum, cat.amount || 0), 0);
  const actualMonthlyExpenses = monthlyTransactions
    .filter(t => Currency.compare(t.amount, 0) < 0)
    .reduce((sum, t) => Currency.add(sum, Currency.abs(t.amount)), 0);

  return {
    income: {
      planned: plannedMonthlyIncome,
      actual: actualMonthlyIncome
    },
    savings: {
      planned: plannedMonthlySavings,
      actual: actualMonthlySavings
    },
    expenses: {
      planned: plannedMonthlyExpenses,
      actual: actualMonthlyExpenses
    }
  };
}

function calculatePeriodPerformance(onboardingData, transactions) {
  const periodStart = new Date(onboardingData?.period?.start_date || new Date());
  
  // Filter transactions for current budget period
  const periodTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate >= periodStart;
  });

  // Calculate elapsed months in period
  const now = new Date();
  const monthsElapsed = Math.max(1, 
    ((now.getFullYear() - periodStart.getFullYear()) * 12) + 
    (now.getMonth() - periodStart.getMonth()) + 1
  );

  // Income Performance (prorated for elapsed months) - using Currency system
  const plannedPeriodIncome = Currency.multiply(
    Currency.divide(onboardingData?.income?.totalYearlyIncome || 0, 12), 
    monthsElapsed
  );
  const actualPeriodIncome = periodTransactions
    .filter(t => Currency.isPositive(t.amount))
    .reduce((sum, t) => Currency.add(sum, t.amount), 0);

  // Savings Performance (prorated for elapsed months) - using Currency system
  const plannedPeriodSavings = Currency.multiply(
    onboardingData?.savingsAllocation?.monthlySavings || 0, 
    monthsElapsed
  );
  const actualPeriodSavings = calculateActualPeriodSavings(periodTransactions, onboardingData);

  // Expenses Performance (prorated for elapsed months) - using Currency system
  const expenseCategories = onboardingData?.expenses?.expenseCategories || [];
  const plannedPeriodExpenses = expenseCategories.reduce((sum, cat) => 
    Currency.add(sum, Currency.multiply(cat.amount || 0, monthsElapsed)), 0);
  const actualPeriodExpenses = periodTransactions
    .filter(t => Currency.compare(t.amount, 0) < 0)
    .reduce((sum, t) => Currency.add(sum, Currency.abs(t.amount)), 0);

  return {
    income: {
      planned: plannedPeriodIncome,
      actual: actualPeriodIncome
    },
    savings: {
      planned: plannedPeriodSavings,
      actual: actualPeriodSavings
    },
    expenses: {
      planned: plannedPeriodExpenses,
      actual: actualPeriodExpenses
    }
  };
}

// FIXED: Handle category objects properly + Currency system
function calculateActualMonthlySavings(monthlyTransactions, onboardingData) {
  const savingsGoals = onboardingData?.savingsAllocation?.savingsGoals || [];
  const savingsKeywords = ['savings', 'emergency fund', 'investment', ...savingsGoals.map(g => g.name.toLowerCase())];
  
  return monthlyTransactions
    .filter(t => {
      // Check if category matches savings keywords
      const isSavingsCategory = savingsKeywords.some(keyword => {
        // Handle both string and object categories
        const categoryName = typeof t.category === 'string' 
          ? t.category.toLowerCase() 
          : (t.category && t.category.name ? t.category.name.toLowerCase() : '');
        
        return categoryName.includes(keyword);
      });
      
      // Check description for savings keywords
      const descriptionMatches = t.description && 
        savingsKeywords.some(keyword => t.description.toLowerCase().includes(keyword));
      
      const isPositiveTransfer = Currency.isPositive(t.amount) && (isSavingsCategory || descriptionMatches);
      const isSavingsTransfer = Currency.compare(t.amount, 0) < 0 && t.description && 
        t.description.toLowerCase().includes('transfer') && (isSavingsCategory || descriptionMatches);
      
      return isPositiveTransfer || isSavingsTransfer;
    })
    .reduce((sum, t) => Currency.add(sum, Currency.abs(t.amount)), 0);
}

// FIXED: Handle category objects properly + Currency system
function calculateActualPeriodSavings(periodTransactions, onboardingData) {
  const savingsGoals = onboardingData?.savingsAllocation?.savingsGoals || [];
  const savingsKeywords = ['savings', 'emergency fund', 'investment', ...savingsGoals.map(g => g.name.toLowerCase())];
  
  return periodTransactions
    .filter(t => {
      // Check if category matches savings keywords
      const isSavingsCategory = savingsKeywords.some(keyword => {
        // Handle both string and object categories
        const categoryName = typeof t.category === 'string' 
          ? t.category.toLowerCase() 
          : (t.category && t.category.name ? t.category.name.toLowerCase() : '');
        
        return categoryName.includes(keyword);
      });
      
      // Check description for savings keywords
      const descriptionMatches = t.description && 
        savingsKeywords.some(keyword => t.description.toLowerCase().includes(keyword));
      
      const isPositiveTransfer = Currency.isPositive(t.amount) && (isSavingsCategory || descriptionMatches);
      const isSavingsTransfer = Currency.compare(t.amount, 0) < 0 && t.description && 
        t.description.toLowerCase().includes('transfer') && (isSavingsCategory || descriptionMatches);
      
      return isPositiveTransfer || isSavingsTransfer;
    })
    .reduce((sum, t) => Currency.add(sum, Currency.abs(t.amount)), 0);
}
