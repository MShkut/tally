// frontend/src/components/dashboard/SavingsProgressSection.jsx
import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const SavingsProgressSection = ({ data }) => {
  const { isDarkMode } = useTheme();
  const savingsProgress = data?.savings || [];

  return (
    <section>
      <h2 className={`
        text-sm font-medium uppercase tracking-wider mb-6
        ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}
      `}>
        Savings Progress
      </h2>
      
      <div className="space-y-5">
        {savingsProgress.map((goal) => (
          <SavingsGoalItem key={goal.title} goal={goal} />
        ))}
      </div>
    </section>
  );
};

const SavingsGoalItem = ({ goal }) => {
  const { isDarkMode } = useTheme();

  return (
    <div className={`
      py-5 border-b
      ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}
    `}>
      <div className={`
        text-base font-medium mb-2
        ${isDarkMode ? 'text-white' : 'text-black'}
      `}>
        {goal.name}
      </div>
      <div className="flex items-center gap-4">
        <div className={`
          flex-1 h-1 relative
          ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}
        `}>
          <div 
            className={`
              absolute top-0 left-0 h-full transition-all duration-300
              ${goal.isComplete ? 'bg-green-500' : isDarkMode ? 'bg-gray-500' : 'bg-gray-400'}
            `}
            style={{ width: `${Math.min(goal.percentage, 100)}%` }}
          />
        </div>
        <div className={`
          text-sm font-mono text-right min-w-20
          ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}
        `}>
          ${(goal.current / 1000).toFixed(1)}k / ${(goal.target / 1000).toFixed(0)}k
        </div>
      </div>
    </div>
  );
};

export default SavingsProgressSection;
