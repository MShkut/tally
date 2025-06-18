// frontend/src/components/dashboard/BudgetHealthSection.jsx
import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const BudgetHealthSection = ({ 
  data, 
  selectedPeriod, 
  selectedMonth, 
  onPeriodChange, 
  onboardingData 
}) => {
  const { isDarkMode } = useTheme();
  const { budget, period } = data;
  const budgetHealth = budget?.categories || [];

  return (
    <section>
      <div className="flex items-center justify-between mb-8">
        <h2 className={`
          text-sm font-medium uppercase tracking-wider
          ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}
        `}>
          Budget Health
        </h2>
        <PeriodSelector 
          selectedPeriod={selectedPeriod}
          selectedMonth={selectedMonth}
          months={period.months}
          onPeriodChange={onPeriodChange}
        />
      </div>
      
      <div className={`
        mb-6 pb-4 border-b
        ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}
      `}>
        <div className={`
          text-base font-light
          ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}
        `}>
          Total period average per month • Click Month to see individual breakdown
        </div>
      </div>

      <div className="space-y-4">
        {budgetHealth.map((category) => (
          <BudgetItem key={category.name} category={category} />
        ))}
      </div>
    </section>
  );
};

const PeriodSelector = ({ selectedPeriod, selectedMonth, months, onPeriodChange }) => {
  const { isDarkMode } = useTheme();
  const [showMonthDropdown, setShowMonthDropdown] = React.useState(false);

  const handleTotalClick = () => {
    onPeriodChange('total');
    setShowMonthDropdown(false);
  };

  const handleMonthClick = (month) => {
    onPeriodChange('month', month);
    setShowMonthDropdown(false);
  };

  return (
    <div className="flex items-center gap-0 relative">
      <button
        onClick={handleTotalClick}
        className={`
          px-4 py-2 text-sm transition-all duration-200 border-b-2
          ${selectedPeriod === 'total' 
            ? isDarkMode 
              ? 'text-white border-white' 
              : 'text-black border-black'
            : isDarkMode 
              ? 'text-gray-500 border-transparent hover:text-gray-300' 
              : 'text-gray-400 border-transparent hover:text-gray-600'
          }
        `}
      >
        Total
      </button>
      <div className="relative">
        <button
          onClick={() => setShowMonthDropdown(!showMonthDropdown)}
          className={`
            px-4 py-2 text-sm transition-all duration-200 border-b-2
            ${selectedPeriod === 'month' 
              ? isDarkMode 
                ? 'text-white border-white' 
                : 'text-black border-black'
              : isDarkMode 
                ? 'text-gray-500 border-transparent hover:text-gray-300' 
                : 'text-gray-400 border-transparent hover:text-gray-600'
            }
          `}
        >
          {selectedPeriod === 'month' && selectedMonth 
            ? selectedMonth.shortLabel + ' ▼'
            : 'Month ▼'
          }
        </button>
        
        {showMonthDropdown && (
          <div className={`
            absolute top-full right-0 mt-2 py-2 min-w-32 border shadow-lg z-10
            ${isDarkMode 
              ? 'bg-black border-gray-800 shadow-gray-900' 
              : 'bg-white border-gray-200 shadow-gray-300'
            }
          `}>
            {months.map((month) => (
              <button
                key={month.value}
                onClick={() => handleMonthClick(month)}
                className={`
                  block w-full text-left px-4 py-2 text-sm transition-colors duration-200
                  ${isDarkMode 
                    ? 'text-gray-300 hover:bg-gray-900 hover:text-white' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-black'
                  }
                `}
              >
                {month.shortLabel}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const BudgetItem = ({ category }) => {
  const { isDarkMode } = useTheme();

  return (
    <div className={`
      flex items-center justify-between py-4 border-b
      ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}
    `}>
      <div className={`
        text-base font-normal
        ${isDarkMode ? 'text-white' : 'text-black'}
      `}>
        {category.name}
      </div>
      <div className="flex items-center gap-4 min-w-80">
        <div className="flex-1 max-w-24">
          <div className={`
            w-full h-0.5 relative
            ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}
          `}>
            <div 
              className={`
                absolute top-0 left-0 h-full transition-all duration-300
                ${category.isOverBudget 
                  ? 'bg-red-500' 
                  : isDarkMode ? 'bg-gray-400' : 'bg-gray-600'
                }
              `}
              style={{ width: `${Math.min(category.percentage, 100)}%` }}
            />
          </div>
        </div>
        <div className={`
          text-sm font-mono text-right min-w-24
          ${category.isOverBudget 
            ? 'text-red-500' 
            : isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }
        `}>
          ${category.spent.toLocaleString()} / ${category.budget.toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export default BudgetHealthSection;
