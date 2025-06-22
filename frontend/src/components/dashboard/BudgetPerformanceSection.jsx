// frontend/src/components/dashboard/BudgetPerformanceSection.jsx - Simplified Version
import React from 'react';

import { useTheme } from 'contexts/ThemeContext';

// Simplified Budget Performance Section - no internal toggle, no category breakdown
export const BudgetPerformanceSection = ({ performanceData }) => {
  const { isDarkMode } = useTheme();

  return (
    <section className="mb-20">
      <h2 className={`text-2xl font-light mb-8 ${
        isDarkMode ? 'text-white' : 'text-black'
      }`}>
        Budget Performance
      </h2>

      {/* Performance Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
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
    </section>
  );
};

// Individual Performance Category Component - Simplified
const PerformanceCategory = ({ title, data, type }) => {
  const { isDarkMode } = useTheme();
  
  const getVarianceColor = (variance, type) => {
    if (variance === 0) return isDarkMode ? 'text-gray-400' : 'text-gray-600';
    
    if (type === 'income') {
      return variance > 0 ? 'text-green-500' : 'text-yellow-500';
    }
    if (type === 'expenses') {
      return variance > 0 ? 'text-red-500' : 'text-green-500';
    }
    if (type === 'savings') {
      return variance > 0 ? 'text-green-500' : 'text-yellow-500';
    }
    
    return isDarkMode ? 'text-gray-400' : 'text-gray-600';
  };

  const getVarianceLabel = (variance, type) => {
    if (variance === 0) return 'On target';
    
    const amount = Math.abs(variance);
    
    if (type === 'income') {
      return variance > 0 ? `+$${amount.toLocaleString()} above expected` : `$${amount.toLocaleString()} below expected`;
    }
    if (type === 'expenses') {
      return variance > 0 ? `$${amount.toLocaleString()} over budget` : `$${amount.toLocaleString()} under budget`;
    }
    if (type === 'savings') {
      return variance > 0 ? `+$${amount.toLocaleString()} ahead of plan` : `$${amount.toLocaleString()} behind plan`;
    }
    
    return `${variance > 0 ? 'over' : 'under'} by $${amount.toLocaleString()}`;
  };

  const percentage = data.planned > 0 ? (data.actual / data.planned) * 100 : 0;
  const variance = data.actual - data.planned;

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
          ${data.actual.toLocaleString()}
        </div>
        <div className={`text-base font-light ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          of ${data.planned.toLocaleString()} planned
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

// Enhanced data calculation functions that support specific month selection
export const calculateBudgetPerformance = (onboardingData, transactions, viewMode, selectedMonth) => {
  if (viewMode === 'period') {
    return calculatePeriodPerformance(onboardingData, transactions);
  } else {
    return calculateMonthPerformance(onboardingData, transactions, selectedMonth);
  }
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

  // Income Performance
  const plannedMonthlyIncome = (onboardingData?.income?.totalYearlyIncome || 0) / 12;
  const actualMonthlyIncome = monthlyTransactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  // Savings Performance
  const plannedMonthlySavings = onboardingData?.savingsAllocation?.monthlySavings || 0;
  const actualMonthlySavings = calculateActualMonthlySavings(monthlyTransactions, onboardingData);

  // Expenses Performance
  const expenseCategories = onboardingData?.expenses?.expenseCategories || [];
  const plannedMonthlyExpenses = expenseCategories.reduce((sum, cat) => 
    sum + (parseFloat(cat.amount) || 0), 0);
  const actualMonthlyExpenses = monthlyTransactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

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

  // Income Performance (prorated for elapsed months)
  const plannedPeriodIncome = ((onboardingData?.income?.totalYearlyIncome || 0) / 12) * monthsElapsed;
  const actualPeriodIncome = periodTransactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  // Savings Performance (prorated for elapsed months)
  const plannedPeriodSavings = (onboardingData?.savingsAllocation?.monthlySavings || 0) * monthsElapsed;
  const actualPeriodSavings = calculateActualPeriodSavings(periodTransactions, onboardingData);

  // Expenses Performance (prorated for elapsed months)
  const expenseCategories = onboardingData?.expenses?.expenseCategories || [];
  const plannedPeriodExpenses = expenseCategories.reduce((sum, cat) => 
    sum + ((parseFloat(cat.amount) || 0) * monthsElapsed), 0);
  const actualPeriodExpenses = periodTransactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

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

function calculateActualMonthlySavings(monthlyTransactions, onboardingData) {
  const savingsGoals = onboardingData?.savingsAllocation?.savingsGoals || [];
  const savingsKeywords = ['savings', 'emergency fund', 'investment', ...savingsGoals.map(g => g.name.toLowerCase())];
  
  return monthlyTransactions
    .filter(t => {
      const isSavingsCategory = savingsKeywords.some(keyword => 
        (t.category && t.category.toLowerCase().includes(keyword)) ||
        (t.description && t.description.toLowerCase().includes(keyword))
      );
      const isPositiveTransfer = t.amount > 0 && isSavingsCategory;
      const isSavingsTransfer = t.amount < 0 && t.description && 
        t.description.toLowerCase().includes('transfer') && isSavingsCategory;
      
      return isPositiveTransfer || isSavingsTransfer;
    })
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

function calculateActualPeriodSavings(periodTransactions, onboardingData) {
  const savingsGoals = onboardingData?.savingsAllocation?.savingsGoals || [];
  const savingsKeywords = ['savings', 'emergency fund', 'investment', ...savingsGoals.map(g => g.name.toLowerCase())];
  
  return periodTransactions
    .filter(t => {
      const isSavingsCategory = savingsKeywords.some(keyword => 
        (t.category && t.category.toLowerCase().includes(keyword)) ||
        (t.description && t.description.toLowerCase().includes(keyword))
      );
      const isPositiveTransfer = t.amount > 0 && isSavingsCategory;
      const isSavingsTransfer = t.amount < 0 && t.description && 
        t.description.toLowerCase().includes('transfer') && isSavingsCategory;
      
      return isPositiveTransfer || isSavingsTransfer;
    })
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
}
