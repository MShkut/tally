// frontend/src/components/onboarding/PlanNextPeriod.jsx
import { useState, useEffect } from 'react';

import { useTheme } from 'contexts/ThemeContext';
import { ThemeToggle } from 'components/shared/ThemeToggle';
import { PeriodSelector } from 'components/shared/PeriodSelector';
import {
  FormSection,
  StandardFormLayout,
  SummaryCard
} from 'components/shared/FormComponents';
import { apiService } from 'utils/apiService';
import { convertToYearly } from 'utils/incomeHelpers';
import { formatDate } from 'utils/dateUtils';

export const PlanNextPeriod = ({ onComplete, onCancel }) => {
  const { isDarkMode } = useTheme();
  const [currentData, setCurrentData] = useState(null);
  const [periodData, setPeriodData] = useState(null);
  const [step, setStep] = useState('period'); // 'period', 'review'

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await apiService.loadUserData();
        setCurrentData(userData);
      } catch (error) {
        console.error('[PlanNextPeriod] Error loading data:', error);
      }
    };

    loadData();
  }, []);

  const handlePeriodChange = (period) => {
    setPeriodData(period);
  };

  const handleNext = async () => {
    if (step === 'period' && periodData) {
      setStep('review');
    } else if (step === 'review') {
      try {
        // Create new period with existing data
        const newPeriodData = {
          ...currentData,
          period: {
            duration_months: periodData.durationMonths,
            start_date: periodData.startDate,
            end_date: periodData.endDate,
            period_number: (currentData?.period?.period_number || 0) + 1,
            previous_period: currentData?.period
          },
          onboardingComplete: true,
          completedAt: new Date().toISOString()
        };

        // Save the new period data. Transactions are not cleared or archived —
        // they remain in full history; the Dashboard's "period" view filters
        // them down to this period's date range.
        await apiService.saveUserData(newPeriodData);

        onComplete();
      } catch (error) {
        console.error('[PlanNextPeriod] Error saving new period:', error);
      }
    }
  };

  const handleBack = () => {
    if (step === 'review') {
      setStep('period');
    } else {
      onCancel();
    }
  };

  if (!currentData) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'
      }`}>
        <div className="text-xl font-light">Loading budget data...</div>
      </div>
    );
  }

  const canContinue = step === 'period' ? periodData !== null : true;

  if (step === 'period') {
    return (
      <>
        <ThemeToggle />
        <StandardFormLayout
          title="Plan New Budget Period"
          subtitle="Your current budget will carry over to the new period. Review and adjust as needed."
          onNext={handleNext}
          onBack={handleBack}
          canGoNext={canContinue}
          nextLabel="Review Budget"
          backLabel="Cancel"
        >
          <div className="max-w-3xl mx-auto">
            {/* Current Period Summary */}
            <FormSection title="Current Period Summary">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center">
                <SummaryCard
                  title="Period"
                  value={`${currentData?.period?.duration_months || 0} months`}
                  subtitle={`${formatPeriodDates(currentData?.period)}`}
                />
                <SummaryCard
                  title="Budget"
                  value={calculateMonthlyBudget(currentData)}
                  subtitle="Monthly average"
                />
              </div>
            </FormSection>
            
            {/* New Period Selection */}
            <FormSection title="Select Your Next Budget Period">
              <PeriodSelector 
                onPeriodChange={handlePeriodChange}
                maxMonths={12}
              />
            </FormSection>
          </div>
        </StandardFormLayout>
      </>
    );
  }

  // Review step
  return (
    <>
      <ThemeToggle />
      <StandardFormLayout
        title="Review Your Budget"
        subtitle="Your income, savings, and expense categories will carry over to the new period. You can adjust them after starting."
        onNext={handleNext}
        onBack={handleBack}
        canGoNext={true}
        nextLabel="Start New Period"
        backLabel="Back"
      >
        <div className="max-w-4xl mx-auto">
          {/* Income Summary */}
          <FormSection title="Income Sources">
            <div className="space-y-4">
              {(currentData?.income?.incomeSources || []).map((source, index) => (
                <div key={index} className={`flex justify-between py-4 border-b ${
                  isDarkMode ? 'border-gray-800' : 'border-gray-200'
                }`}>
                  <div>
                    <div className={`text-lg font-light ${
                      isDarkMode ? 'text-white' : 'text-black'
                    }`}>{source.name}</div>
                    <div className={`text-sm font-light ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-400'
                    }`}>{source.frequency}</div>
                  </div>
                  <div className={`text-lg font-mono ${
                    isDarkMode ? 'text-white' : 'text-black'
                  }`}>
                    ${parseFloat(source.amount).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
            <div className={`text-center mt-8 text-base font-light ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`}>
              You can edit income sources after starting the new period
            </div>
          </FormSection>

          {/* Savings Summary */}
          <FormSection title="Savings Plan">
            <div className="space-y-4">
              <div className={`flex justify-between py-4 border-b ${
                isDarkMode ? 'border-gray-800' : 'border-gray-200'
              }`}>
                <div className={`text-lg font-light ${
                  isDarkMode ? 'text-white' : 'text-black'
                }`}>Savings Rate</div>
                <div className={`text-lg font-mono ${
                  isDarkMode ? 'text-white' : 'text-black'
                }`}>
                  {currentData?.savingsAllocation?.savingsRate || 0}%
                </div>
              </div>
              {(currentData?.savingsAllocation?.savingsGoals || []).map((goal, index) => (
                <div key={index} className={`flex justify-between py-4 border-b ${
                  isDarkMode ? 'border-gray-800' : 'border-gray-200'
                }`}>
                  <div className={`text-lg font-light ${
                    isDarkMode ? 'text-white' : 'text-black'
                  }`}>{goal.name}</div>
                  <div className={`text-lg font-mono ${
                    isDarkMode ? 'text-white' : 'text-black'
                  }`}>
                    ${parseFloat(goal.amount).toLocaleString()}/mo
                  </div>
                </div>
              ))}
            </div>
          </FormSection>

          {/* Expense Categories Summary */}
          <FormSection title="Expense Categories">
            <div className="space-y-4">
              {(currentData?.expenses?.expenseCategories || []).map((category, index) => (
                <div key={index} className={`flex justify-between py-4 border-b ${
                  isDarkMode ? 'border-gray-800' : 'border-gray-200'
                }`}>
                  <div>
                    <div className={`text-lg font-light ${
                      isDarkMode ? 'text-white' : 'text-black'
                    }`}>{category.name}</div>
                    <div className={`text-sm font-light ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-400'
                    }`}>{category.frequency || 'Monthly'}</div>
                  </div>
                  <div className={`text-lg font-mono ${
                    isDarkMode ? 'text-white' : 'text-black'
                  }`}>
                    ${parseFloat(category.amount).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </FormSection>
        </div>
      </StandardFormLayout>
    </>
  );
};

// Helper functions
function formatPeriodDates(period) {
  if (!period) return '';

  // Format dates with month and year only
  const start = formatDate(period.start_date, { month: 'short', year: 'numeric' });
  const end = formatDate(period.end_date || period.start_date, { month: 'short', year: 'numeric' });

  return `${start} - ${end}`;
}

function calculateMonthlyBudget(userData) {
  if (!userData) return 0;
  
  const monthlyIncome = (userData.income?.totalYearlyIncome || 0) / 12;
  const monthlySavings = userData.savingsAllocation?.monthlySavings || 0;
  
  return monthlyIncome - monthlySavings;
}
