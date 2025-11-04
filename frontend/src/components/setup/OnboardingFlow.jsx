// frontend/src/components/onboarding/OnboardingFlow.jsx
import React, { useState, useEffect } from 'react';
import { apiService } from 'utils/apiService';
import { WelcomeStep } from './WelcomeStep';
import { IncomeStep } from './IncomeStep';
import { SavingsAllocationStep } from './SavingsAllocationStep';
import { ExpensesStep } from './ExpensesStep';

const STEPS = {
  WELCOME: 'welcome',
  INCOME: 'income',
  SAVINGS: 'savings',
  EXPENSES: 'expenses'
};

const STEP_ORDER = [
  STEPS.WELCOME,
  STEPS.INCOME,
  STEPS.SAVINGS,
  STEPS.EXPENSES
];

export const OnboardingFlow = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(STEPS.WELCOME);
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
        if (userData && !userData.onboardingComplete) {
          setOnboardingData(userData);

          // Determine which step to start on based on completed data
          if (userData.expenses) {
            setCurrentStep(STEPS.EXPENSES);
          } else if (userData.savingsAllocation) {
            setCurrentStep(STEPS.SAVINGS);
          } else if (userData.income) {
            setCurrentStep(STEPS.INCOME);
          } else if (userData.household && userData.period) {
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
      case STEPS.WELCOME:
        // Welcome step returns { household, period }
        const updatedWelcomeData = {
          ...onboardingData,
          household: stepData.household,
          period: stepData.period
        };
        setOnboardingData(updatedWelcomeData);
        try {
          await apiService.saveUserData(updatedWelcomeData);
        } catch (error) {
          console.error('Failed to save welcome data:', error);
          // Continue anyway - will retry on next save
        }
        break;

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

    // For non-welcome steps, update the specific section
    if (sectionKey) {
      const updatedData = {
        ...onboardingData,
        [sectionKey]: stepData
      };
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
      await handleOnboardingComplete(currentStep === STEPS.WELCOME ?
        { ...onboardingData, household: stepData.household, period: stepData.period } :
        { ...onboardingData, [sectionKey]: stepData }
      );
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
    const completedData = {
      ...finalData,
      onboardingComplete: true,
      completedAt: new Date().toISOString(),
      onboardingStep: null // Clear step tracking
    };

    try {
      await apiService.saveUserData(completedData);

      if (onComplete) {
        onComplete(completedData);
      }
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      // TODO: Show error to user
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
      case STEPS.WELCOME:
        return <WelcomeStep {...commonProps} />;
        
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
        return <WelcomeStep {...commonProps} />;
    }
  };

  return (
    <div className="min-h-screen">
      {renderCurrentStep()}
    </div>
  );
};
