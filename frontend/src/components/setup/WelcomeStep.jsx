// frontend/src/components/onboarding/WelcomeStep.jsx
import React, { useState, useEffect } from 'react';

import { useTheme } from 'contexts/ThemeContext';
import { ThemeToggle } from 'components/shared/ThemeToggle';
import { DateRangePicker } from 'components/shared/DateRangePicker';
import { ImportDataModal } from 'components/shared/ImportDataModal';
import { dataManager } from 'utils/dataManager';
import {
  FormGrid,
  FormField,
  StandardInput,
  FormSection,
  StandardFormLayout,
  validation
} from 'components/shared/FormComponents';

export const WelcomeStep = ({ onNext, savedData = null }) => {
  const { isDarkMode } = useTheme();
  const [formData, setFormData] = useState({
    householdName: ''
  });
  const [periodData, setPeriodData] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);

  // Pre-populate form with saved data
  useEffect(() => {
    if (savedData) {
      setFormData({
        householdName: savedData.household?.name || ''
      });
    }
  }, [savedData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDateRangeChange = (dateRange) => {
    setPeriodData(dateRange);
  };

  const handleNext = () => {
    if (canContinue) {
      // Generate unique household ID (timestamp-based)
      const householdId = `household-${Date.now()}`;

      const welcomeData = {
        household: {
          id: householdId,
          name: formData.householdName,
          created_date: new Date().toISOString().split('T')[0]
        },
        period: {
          duration_months: periodData.durationMonths,
          start_date: periodData.startDate,
          end_date: periodData.endDate,
          period_number: 1
        }
      };

      onNext(welcomeData);
    }
  };

  // Validation: need valid name and valid period
  const canContinue = validation.hasValidString(formData.householdName) &&
                     periodData &&
                     periodData.durationMonths >= 1 &&
                     periodData.durationMonths <= 12;

  const handleImportSuccess = () => {
    // After successful import, redirect to dashboard
    // Get the household ID from imported data
    const userData = dataManager.loadUserData();
    if (userData?.household?.id) {
      window.location.href = `/${userData.household.id}/dashboard`;
    } else {
      // Fallback: reload to re-detect data
      window.location.reload();
    }
  };

  // Development helper to load complete sample data and skip to dashboard
  const loadCompleteSampleData = () => {
    if (import.meta.env.DEV) {
      const today = new Date();
      const sixMonthsFromNow = new Date(today);
      sixMonthsFromNow.setMonth(today.getMonth() + 6);

      // Create complete onboarding data
      const householdId = `household-${Date.now()}`;
      const completeData = {
        household: {
          id: householdId,
          name: 'Test Household',
          created_date: today.toISOString().split('T')[0]
        },
        period: {
          duration_months: 6,
          start_date: today.toISOString().split('T')[0],
          end_date: sixMonthsFromNow.toISOString().split('T')[0],
          period_number: 1
        },
        income: {
          incomeSources: [
            { id: '1', name: 'Salary', amount: '5000', frequency: 'Monthly' },
            { id: '2', name: 'Freelance Work', amount: '1500', frequency: 'Monthly' }
          ],
          totalYearlyIncome: 78000,
          monthlyIncome: 6500
        },
        savingsAllocation: {
          savingsRate: 20,
          monthlySavings: 1300,
          emergencyFund: { hasExisting: false, monthlyAmount: '' },
          savingsGoals: [
            { id: '1', name: 'Emergency Fund', amount: '500' },
            { id: '2', name: 'Vacation', amount: '300' },
            { id: '3', name: 'Down Payment', amount: '500' }
          ]
        },
        expenses: {
          expenseCategories: [
            { id: '1', name: 'Housing', amount: '2000', frequency: 'Monthly' },
            { id: '2', name: 'Groceries', amount: '600', frequency: 'Monthly' },
            { id: '3', name: 'Transportation', amount: '400', frequency: 'Monthly' },
            { id: '4', name: 'Utilities', amount: '200', frequency: 'Monthly' },
            { id: '5', name: 'Entertainment', amount: '300', frequency: 'Monthly' }
          ],
          totalExpenses: 3500,
          availableForExpenses: 5200,
          remainingBudget: 1700
        },
        netWorth: {
          assets: [
            { id: '1', name: 'Savings Account', amount: '10000' },
            { id: '2', name: 'Investment Account', amount: '25000' }
          ],
          liabilities: [
            { id: '1', name: 'Car Loan', amount: '15000' }
          ]
        },
        onboardingComplete: true,
        onboardingCompletedDate: today.toISOString()
      };

      // Save complete data
      dataManager.saveUserData(completeData);

      // Navigate directly to dashboard using householdId
      window.location.href = `/${householdId}/dashboard`;
    }
  };

  return (
    <>
      <ThemeToggle />
      <div>
        <StandardFormLayout
          title="Welcome to Tally"
          subtitle="A privacy-first approach to organizing your financial life. All data stays on your device, giving you complete control over your financial information."
          onNext={handleNext}
          canGoNext={canContinue}
          nextLabel="Begin Financial Setup"
          showBack={false}
          className="flex items-center justify-center"
        >
        <div className="max-w-3xl mx-auto">
          <FormSection>
            <FormGrid>
              {/* Name Input - Full width */}
              <FormField span={12}>
                <StandardInput
                  label="Your name(s)"
                  value={formData.householdName}
                  onChange={(value) => handleInputChange('householdName', value)}
                  placeholder="John, Jane & John, Smith Family"
                  className={`[&_label]:text-2xl [&_label]:font-light [&_input]:text-2xl [&_input]:font-medium [&_input]:pb-4 ${
                    isDarkMode ? '[&_label]:text-white' : '[&_label]:text-black'
                  }`}
                />
              </FormField>
            </FormGrid>
          </FormSection>
          
          {/* Budget Period Selector */}
          <FormSection title="Your Budget Period (1-12 months)">
            <DateRangePicker
              onDateRangeChange={handleDateRangeChange}
              initialStartDate={savedData?.period?.start_date}
              initialEndDate={savedData?.period?.end_date}
              maxMonths={12}
            />
          </FormSection>

          {/* Import Existing Data Option */}
          <div className="mt-8 text-center">
            <p className={`text-sm mb-3 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Already have Tally data?
            </p>
            <button
              onClick={() => setShowImportModal(true)}
              className={`text-sm font-medium px-6 py-2 border rounded transition-colors ${
                isDarkMode
                  ? 'border-gray-600 text-gray-300 hover:border-gray-400 hover:text-white'
                  : 'border-gray-300 text-gray-700 hover:border-gray-600 hover:text-black'
              }`}
            >
              Import Existing Data
            </button>
          </div>

          {/* DEV-ONLY: Quick load button */}
          {import.meta.env.DEV && (
            <div className="mt-8 text-center">
              <button
                onClick={loadCompleteSampleData}
                className={`text-sm font-light px-4 py-2 border rounded transition-colors ${
                  isDarkMode
                    ? 'border-gray-600 text-gray-400 hover:border-gray-400 hover:text-white'
                    : 'border-gray-300 text-gray-600 hover:border-gray-600 hover:text-black'
                }`}
              >
                [DEV] Load Complete Sample Data & Go to Dashboard
              </button>
            </div>
          )}
        </div>

        </StandardFormLayout>
      </div>

      {/* Import Data Modal */}
      <ImportDataModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={handleImportSuccess}
      />
    </>
  );
};
