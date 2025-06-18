// frontend/src/components/dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import BurgerMenu from './BurgerMenu';
import DashboardHeader from './DashboardHeader';
import ThisMonthSection from './ThisMonthSection';
import NetWorthSection from './NetWorthSection';
import BudgetHealthSection from './BudgetHealthSection';
import SavingsProgressSection from './SavingsProgressSection';
import RecentActivitySection from './RecentActivitySection';

const Dashboard = ({ onboardingData, transactions = [], onNavigate }) => {
  const { isDarkMode } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('total');
  const [selectedMonth, setSelectedMonth] = useState(null);

  // Calculate dashboard data from onboarding and transactions
  const dashboardData = calculateDashboardData(onboardingData, transactions, selectedPeriod, selectedMonth);

  const handleMenuAction = (action) => {
    setMenuOpen(false);
    if (onNavigate) {
      onNavigate(action);
    }
  };

  const handlePeriodChange = (period, month = null) => {
    setSelectedPeriod(period);
    setSelectedMonth(month);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-black' : 'bg-gray-50'
    }`}>
      {/* Burger Menu */}
      <BurgerMenu 
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onAction={handleMenuAction}
      />

      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <DashboardHeader 
          onboardingData={onboardingData}
          onMenuToggle={() => setMenuOpen(true)}
        />

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-20 mb-32">
          {/* Main Content - 2/3 width */}
          <main className="lg:col-span-2 space-y-20">
            <ThisMonthSection data={dashboardData} />
            <NetWorthSection data={dashboardData} />
            <BudgetHealthSection 
              data={dashboardData}
              selectedPeriod={selectedPeriod}
              selectedMonth={selectedMonth}
              onPeriodChange={handlePeriodChange}
              onboardingData={onboardingData}
            />
          </main>

          {/* Sidebar - 1/3 width */}
          <aside className="space-y-20">
            <SavingsProgressSection data={dashboardData} />
            <RecentActivitySection transactions={transactions} />
          </aside>
        </div>
      </div>
    </div>
  );
};

// Data calculation logic
function calculateDashboardData(onboardingData, transactions, selectedPeriod, selectedMonth) {
  if (!onboardingData) {
    return getDefaultDashboardData();
  }

  const {
    income = {},
    savings = {},
    allocation = {},
    expenses = {},
    netWorth = {}
  } = onboardingData;

  // Calculate period info
  const periodStartDate = new Date('2024-03-01'); // From onboarding
  const periodDurationMonths = 6; // From onboarding
  const currentDate = new Date();
  const monthsElapsed = Math.floor((currentDate - periodStartDate) / (1000 * 60 * 60 * 24 * 30.44));
  const daysRemainingInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate() - currentDate.getDate();

  // Calculate monthly values
  const monthlyIncome = (income.totalYearlyIncome || 90000) / 12;
  const monthlySavings = savings.monthlySavings || (monthlyIncome * 0.4);
  const monthlyExpenseBudget = monthlyIncome - monthlySavings;

  // Calculate spending from transactions (mock data for now)
  const currentMonthSpending = calculateCurrentMonthSpending(transactions);
  const netWorthValue = calculateNetWorth(netWorth, savings, monthsElapsed);
  const budgetHealth = calculateBudgetHealth(expenses, currentMonthSpending, selectedPeriod);
  const savingsProgress = calculateSavingsProgress(allocation, savings, monthsElapsed);

  return {
    period: {
      name: onboardingData.householdName || 'Your Budget',
      startDate: periodStartDate,
      duration: periodDurationMonths,
      currentMonth: monthsElapsed + 1,
      daysRemaining: daysRemainingInMonth,
      months: generatePeriodMonths(periodStartDate, periodDurationMonths)
    },
    thisMonth: {
      spent: currentMonthSpending,
      budget: monthlyExpenseBudget,
      percentage: Math.round((currentMonthSpending / monthlyExpenseBudget) * 100),
      daysRemaining: daysRemainingInMonth
    },
    netWorth: {
      value: netWorthValue.current,
      change: netWorthValue.change,
      trend: netWorthValue.trend
    },
    budgetHealth,
    savingsProgress,
    monthlyIncome,
    monthlySavings
  };
}

function calculateCurrentMonthSpending(transactions) {
  // For now, return mock data - this would calculate actual spending from transactions
  return 2847;
}

function calculateNetWorth(netWorthData, savingsData, monthsElapsed) {
  const baseNetWorth = (netWorthData?.totalAssets || 50000) - (netWorthData?.totalLiabilities || 15000);
  const monthlySavings = savingsData?.monthlySavings || 3000;
  const currentNetWorth = baseNetWorth + (monthlySavings * monthsElapsed);
  
  return {
    current: currentNetWorth,
    change: monthlySavings * monthsElapsed,
    trend: 'up'
  };
}

function calculateBudgetHealth(expensesData, currentSpending, selectedPeriod) {
  const categories = expensesData?.expenseCategories || [];
  
  return categories.map(category => {
    const budgetAmount = parseFloat(category.amount) || 0;
    // Mock spending data - would come from actual transactions
    const spentAmount = budgetAmount * (0.3 + Math.random() * 0.8);
    
    return {
      name: category.name,
      budget: budgetAmount,
      spent: spentAmount,
      percentage: Math.round((spentAmount / budgetAmount) * 100),
      isOverBudget: spentAmount > budgetAmount
    };
  });
}

function calculateSavingsProgress(allocationData, savingsData, monthsElapsed) {
  const goals = allocationData?.savingsGoals || [];
  const monthlyContributions = savingsData?.monthlySavings || 3000;
  
  return goals.map(goal => {
    const targetAmount = parseFloat(goal.amount) * 12; // Convert monthly to yearly target
    const currentAmount = monthlyContributions * monthsElapsed * 0.3; // Mock allocation
    
    return {
      name: goal.name,
      current: currentAmount,
      target: targetAmount,
      percentage: Math.round((currentAmount / targetAmount) * 100),
      isComplete: currentAmount >= targetAmount
    };
  });
}

function generatePeriodMonths(startDate, duration) {
  const months = [];
  for (let i = 0; i < duration; i++) {
    const month = new Date(startDate);
    month.setMonth(month.getMonth() + i);
    months.push({
      value: month.toISOString().slice(0, 7),
      label: month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      shortLabel: month.toLocaleDateString('en-US', { month: 'long' })
    });
  }
  return months;
}

function getDefaultDashboardData() {
  return {
    period: {
      name: 'Your Budget',
      startDate: new Date('2024-03-01'),
      duration: 6,
      currentMonth: 3,
      daysRemaining: 12,
      months: [
        { value: '2024-03', label: 'March 2024', shortLabel: 'March' },
        { value: '2024-04', label: 'April 2024', shortLabel: 'April' },
        { value: '2024-05', label: 'May 2024', shortLabel: 'May' },
        { value: '2024-06', label: 'June 2024', shortLabel: 'June' },
        { value: '2024-07', label: 'July 2024', shortLabel: 'July' },
        { value: '2024-08', label: 'August 2024', shortLabel: 'August' }
      ]
    },
    thisMonth: {
      spent: 2847,
      budget: 3200,
      percentage: 89,
      daysRemaining: 12
    },
    netWorth: {
      value: 47230,
      change: 1200,
      trend: 'up'
    },
    budgetHealth: [
      { name: 'Housing', budget: 1500, spent: 1247, percentage: 83, isOverBudget: false },
      { name: 'Food & Dining', budget: 600, spent: 612, percentage: 102, isOverBudget: true },
      { name: 'Transportation', budget: 300, spent: 180, percentage: 60, isOverBudget: false },
      { name: 'Entertainment', budget: 150, spent: 68, percentage: 45, isOverBudget: false },
      { name: 'Utilities', budget: 150, spent: 113, percentage: 75, isOverBudget: false }
    ],
    savingsProgress: [
      { name: 'Emergency Fund', current: 8400, target: 10000, percentage: 84, isComplete: false },
      { name: 'House Down Payment', current: 3200, target: 15000, percentage: 21, isComplete: false },
      { name: 'Vacation Fund', current: 3000, target: 3000, percentage: 100, isComplete: true }
    ],
    monthlyIncome: 7500,
    monthlySavings: 3000
  };
}

export default Dashboard;
