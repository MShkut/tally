// frontend/src/components/dashboard/BudgetPerformanceSection.jsx - Enhanced Version
// Note: Calculation functions removed - now using useBudgetMath() hook in parent components

import { useTheme } from 'contexts/ThemeContext';
import { Currency } from 'utils/currency';

// Enhanced Budget Performance Section
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

// Individual Performance Category Component
const PerformanceCategory = ({ title, data, type }) => {
  const { isDarkMode } = useTheme();
  
  const getVarianceColor = (variance, actual, planned, type) => {
    // Calculate percentage of actual vs planned
    const percentage = Currency.compare(planned, 0) > 0 ?
      Currency.multiply(Currency.divide(actual, planned), 100) : 0;

    if (type === 'income' || type === 'savings') {
      // Income & Savings: higher is better
      // Red: < 70%, Yellow: 70-99%, Green: >= 100%
      if (percentage < 70) return 'text-red-500';
      if (percentage < 100) return 'text-yellow-500';
      return 'text-green-500'; // >= 100%
    }

    if (type === 'expenses') {
      // Expenses: lower is better
      // Green: < 70%, Yellow: 70-99%, Red: >= 100%
      if (percentage < 70) return 'text-green-500';
      if (percentage < 100) return 'text-yellow-500';
      return 'text-red-500'; // >= 100%
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
      <div className={`text-sm font-light ${getVarianceColor(variance, data.actual, data.planned, type)}`}>
        {getVarianceLabel(variance, type)}
      </div>
    </div>
  );
};

// All calculation functions removed - now using useBudgetMath() hook in Dashboard.jsx
// This component now only handles UI display
