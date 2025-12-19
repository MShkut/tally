// frontend/src/components/onboarding/OnboardingFlow.jsx
import { useState, useEffect } from 'react';

import { apiService } from 'utils/apiService';

import { IncomeStep } from './IncomeStep';
import { SavingsAllocationStep } from './SavingsAllocationStep';
import { ExpensesStep } from './ExpensesStep';

const STEPS = {
  INCOME: 'income',
  SAVINGS: 'savings',
  EXPENSES: 'expenses'
};

const STEP_ORDER = [
  STEPS.INCOME,
  STEPS.SAVINGS,
  STEPS.EXPENSES
];

export const OnboardingFlow = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(STEPS.INCOME);
  const [onboardingData, setOnboardingData] = useState({
    household: null,
    period: null,
    income: null,
    savingsAllocation: null,
    expenses: null
  });

  // Load any existing onboarding data on mount
  useEffect(() => {
    const loadExistingData = async () => {
      try {
        const userData = await apiService.loadUserData();
        console.log('[ONBOARDING FLOW] Loaded user data:', userData);

        if (userData && !userData.onboardingComplete) {
          setOnboardingData(userData);

          // Verify household data is present
          if (!userData.household) {
            console.error('[ONBOARDING FLOW] Missing household data in loaded userData');
          }

          // Determine which step to start on based on completed data
          if (userData.expenses) {
            setCurrentStep(STEPS.EXPENSES);
          } else if (userData.savingsAllocation) {
            setCurrentStep(STEPS.SAVINGS);
          } else {
            // Default to income step (household and period data already set during registration)
            setCurrentStep(STEPS.INCOME);
          }
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
        // Start fresh if data load fails
      }
    };

    loadExistingData();
  }, []);

  const getCurrentStepIndex = () => {
    return STEP_ORDER.indexOf(currentStep);
  };

  const handleStepNext = async (stepData) => {
    // Determine which section this step data belongs to
    let sectionKey;
    switch (currentStep) {
      case STEPS.INCOME:
        sectionKey = 'income';
        break;

      case STEPS.SAVINGS:
        sectionKey = 'savingsAllocation';
        break;

      case STEPS.EXPENSES:
        sectionKey = 'expenses';
        break;
    }

    // Update the specific section
    if (sectionKey) {
      const updatedData = {
        ...onboardingData,
        [sectionKey]: stepData
      };
      console.log(`[ONBOARDING FLOW] Saving ${sectionKey} data:`, updatedData);
      setOnboardingData(updatedData);
      try {
        await apiService.saveUserData(updatedData);
      } catch (error) {
        console.error(`Failed to save ${sectionKey} data:`, error);
        // Continue anyway - will retry on next save
      }
    }

    // Move to next step or complete
    const currentIndex = getCurrentStepIndex();
    if (currentIndex < STEP_ORDER.length - 1) {
      const nextStep = STEP_ORDER[currentIndex + 1];
      setCurrentStep(nextStep);
    } else {
      // Complete onboarding
      console.log('[ONBOARDING FLOW] Final step complete, calling handleOnboardingComplete');
      console.log('[ONBOARDING FLOW] Current onboardingData:', onboardingData);
      console.log('[ONBOARDING FLOW] Final stepData:', stepData);
      await handleOnboardingComplete({ ...onboardingData, [sectionKey]: stepData });
    }
  };

  const handleStepBack = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      const prevStep = STEP_ORDER[currentIndex - 1];
      setCurrentStep(prevStep);
    }
  };

  const handleOnboardingComplete = async (finalData) => {
    console.log('[ONBOARDING FLOW] Completing onboarding with data:', finalData);

    // Verify household data is present before completing
    if (!finalData.household || !finalData.household.id) {
      console.error('[ONBOARDING FLOW] ERROR: Missing household data at completion!', finalData);
      console.error('[ONBOARDING FLOW] Current onboardingData state:', onboardingData);
      // TODO: Show error to user instead of silently failing
      alert('Error: Missing household data. Please refresh and try again.');
      return;
    }

    const completedData = {
      ...finalData,
      onboardingComplete: true,
      completedAt: new Date().toISOString(),
      onboardingStep: null // Clear step tracking
    };

    try {
      await apiService.saveUserData(completedData);

      console.log('[ONBOARDING FLOW] Calling onComplete callback with:', completedData);
      if (onComplete) {
        onComplete(completedData);
      }
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      // TODO: Show error to user
      alert('Error saving onboarding data. Please try again.');
    }
  };

  const renderCurrentStep = () => {
    const commonProps = {
      savedData: onboardingData,
      onNext: handleStepNext,
      onBack: handleStepBack,
      showBack: getCurrentStepIndex() > 0
    };

    switch (currentStep) {
      case STEPS.INCOME:
        return <IncomeStep {...commonProps} />;

      case STEPS.SAVINGS:
        return (
          <SavingsAllocationStep
            {...commonProps}
            incomeData={onboardingData.income}
          />
        );

      case STEPS.EXPENSES:
        return (
          <ExpensesStep
            {...commonProps}
            incomeData={onboardingData.income}
            savingsData={onboardingData.savingsAllocation}
            nextLabel="Complete Setup"
          />
        );

      default:
        console.error('❌ Unknown step:', currentStep);
        return <IncomeStep {...commonProps} />;
    }
  };

  return (
    <div className="min-h-screen">
      {renderCurrentStep()}
    </div>
  );
};
