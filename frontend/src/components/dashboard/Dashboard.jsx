// frontend/src/components/dashboard/Dashboard.jsx
// Fix the imports to use named imports instead of default imports
import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import BurgerMenu from './BurgerMenu'; 
import ThisMonthSection from './ThisMonthSection';
import NetWorthSection from './NetWorthSection';
import BudgetHealthSection from './BudgetHealthSection';
import SavingsProgressSection from './SavingsProgressSection';
import RecentActivitySection from './RecentActivitySection';
import DashboardHeader from './DashboardHeader';

const Dashboard = ({ onboardingData }) => {
  const { isDarkMode } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  // Sample data structure - replace with real data processing
  const dashboardData = {
    household: 'Smith Family Budget',
    period: 'March 2024 to August 2024 • Month 3 of 6',
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
    budget: {
      totalSpent: 2847,
      totalBudget: 3200,
      categories: [
        { name: 'Housing', spent: 1247, budget: 1500 },
        { name: 'Food & Dining', spent: 612, budget: 600 },
        { name: 'Transportation', spent: 180, budget: 300 },
        { name: 'Entertainment', spent: 68, budget: 150 },
        { name: 'Utilities', spent: 113, budget: 150 }
      ]
    },
    savings: [
      { title: 'Emergency Fund', current: 8400, target: 10000 },
      { title: 'House Down Payment', current: 3200, target: 15000 },
      { title: 'Vacation Fund', current: 3000, target: 3000 }
    ],
    recentActivity: [
      { description: 'Grocery Store', amount: -67.43, date: '2024-03-15' },
      { description: 'Salary Deposit', amount: 2800.00, date: '2024-03-14' },
      { description: 'Electric Bill', amount: -89.12, date: '2024-03-13' },
      { description: 'Coffee Shop', amount: -4.75, date: '2024-03-12' },
      { description: 'Gas Station', amount: -45.20, date: '2024-03-11' }
    ]
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <BurgerMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      
      <div className="max-w-6xl mx-auto px-6">
        <DashboardHeader 
          data={dashboardData}
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

export default Dashboard;
