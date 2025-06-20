import React, { useState, useEffect } from 'react';

import { useTheme } from 'contexts/ThemeContext';
import { dataManager } from 'utils/dataManager';

import { BurgerMenu } from 'components/dashboard/BurgerMenu'; 
import { ThisMonthSection } from 'components/dashboard/ThisMonthSection';
import { NetWorthSection } from 'components/dashboard/NetWorthSection';
import { BudgetHealthSection } from 'components/dashboard/BudgetHealthSection';
import { SavingsProgressSection } from 'components/dashboard/SavingsProgressSection';
import { RecentActivitySection } from 'components/dashboard/RecentActivitySection';
import { DashboardHeader } from 'components/dashboard/DashboardHeader';

export const Dashboard = ({ onNavigate }) => {
  const { isDarkMode } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [onboardingData, setOnboardingData] = useState(null);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    // Load data from localStorage
    const userData = dataManager.loadUserData();
    const userTransactions = dataManager.loadTransactions();
    
    setOnboardingData(userData);
    setTransactions(userTransactions);

    // If no onboarding data, redirect to onboarding
    if (!userData || !userData.onboardingComplete) {
      onNavigate('onboarding');
    }
  }, [onNavigate]);

  // Handle menu actions
  const handleMenuAction = (actionId) => {
    setMenuOpen(false);
    
    switch (actionId) {
      case 'import':
        onNavigate('import');
        break;
      case 'start-next-period':
        onNavigate('onboarding');
        break;
      case 'export':
        // Handle export functionality
        const exportData = dataManager.exportData();
        console.log('Export data:', exportData);
        // You could download as JSON file here
        break;
      case 'dashboard':
        // Already on dashboard, just close menu
        break;
      default:
        console.log(`Action ${actionId} not implemented`);
    }
  };

  if (!onboardingData) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'
      }`}>
        <div className="text-xl font-light">Loading your dashboard...</div>
      </div>
    );
  }

  // Process localStorage data into dashboard format
  const dashboardData = {
    household: onboardingData?.household?.name || 'Your Budget',
    period: onboardingData?.period?.duration_months ? 
      `${onboardingData.period.duration_months}-month budget period` : 
      'Budget Period',
    thisMonth: {
      spent: calculateMonthlySpending(transactions),
      budget: calculateMonthlyBudget(onboardingData),
      percentage: calculateBudgetPercentage(transactions, onboardingData),
      daysRemaining: getDaysRemainingInMonth()
    },
    netWorth: {
      value: onboardingData?.netWorth?.netWorth || 0,
      change: 1200, // You could calculate this from historical data
      trend: 'up'
    },
    budget: {
      totalSpent: calculateMonthlySpending(transactions),
      totalBudget: calculateMonthlyBudget(onboardingData),
      categories: processBudgetCategories(onboardingData, transactions)
    },
    savings: processSavingsGoals(onboardingData),
    recentActivity: transactions?.slice(-5).reverse() || []
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <BurgerMenu 
        isOpen={menuOpen} 
        onClose={() => setMenuOpen(false)}
        onAction={handleMenuAction}
      />
      
      <div className="max-w-6xl mx-auto px-6">
        <DashboardHeader 
          onboardingData={onboardingData}
          onMenuToggle={() => setMenuOpen(true)}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-20 mb-24">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-20">
            <ThisMonthSection data={dashboardData} />
            <NetWorthSection data={dashboardData} />
            <BudgetHealthSection data={dashboardData} />
          </div>

          {/* Sidebar */}
          <aside className="space-y-20">
            <SavingsProgressSection data={dashboardData} />
            <RecentActivitySection data={dashboardData} />
          </aside>
        </div>
      </div>
    </div>
  );
};

// Helper functions to process localStorage data
function calculateMonthlySpending(transactions) {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  return transactions
    .filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear &&
             t.amount < 0; // Only expenses
    })
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

function calculateMonthlyBudget(onboardingData) {
  return onboardingData?.expenses?.totalExpenses || 0;
}

function calculateBudgetPercentage(transactions, onboardingData) {
  const spent = calculateMonthlySpending(transactions);
  const budget = calculateMonthlyBudget(onboardingData);
  return budget > 0 ? Math.round((spent / budget) * 100) : 0;
}

function getDaysRemainingInMonth() {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return lastDay.getDate() - now.getDate();
}

function processBudgetCategories(onboardingData, transactions) {
  const categories = onboardingData?.expenses?.expenseCategories || [];
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  return categories.map(category => {
    const spent = transactions
      .filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === currentMonth && 
               transactionDate.getFullYear() === currentYear &&
               t.category === category.name &&
               t.amount < 0;
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    return {
      name: category.name,
      spent: spent,
      budget: parseFloat(category.amount) || 0
    };
  });
}

function processSavingsGoals(onboardingData) {
  const goals = onboardingData?.savingsAllocation?.savingsGoals || [];
  
  return goals.map(goal => ({
    title: goal.name,
    current: parseFloat(goal.amount) * 6 || 0, // Estimate current progress
    target: parseFloat(goal.amount) * 12 || 0 // Annual target
  }));
}
