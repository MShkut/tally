// frontend/src/components/onboarding/OnboardingFlow.jsx
import React, { useState, useEffect } from 'react';
import { dataManager } from 'utils/dataManager';
import { WelcomeStep } from './WelcomeStep';
import { IncomeStep } from './IncomeStep';
import { SavingsAllocationStep } from './SavingsAllocationStep';
import { ExpensesStep } from './ExpensesStep';
import { NetWorthStep } from './NetWorthStep';

const STEPS = {
  WELCOME: 'welcome',
  INCOME: 'income',
  SAVINGS: 'savings',
  EXPENSES: 'expenses',
  NETWORTH: 'networth'
};

const STEP_ORDER = [
  STEPS.WELCOME,
  STEPS.INCOME,
  STEPS.SAVINGS,
  STEPS.EXPENSES,
  STEPS.NETWORTH
];

export const OnboardingFlow = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(STEPS.WELCOME);
  const [onboardingData, setOnboardingData] = useState({});

  // Load any existing onboarding data on mount
  useEffect(() => {
    const userData = dataManager.loadUserData();
    if (userData && !userData.onboardingComplete) {
      setOnboardingData(userData);
    }
  }, []);

  const getCurrentStepIndex = () => {
    return STEP_ORDER.indexOf(currentStep);
  };

  const handleStepNext = (stepData) => {
    const updatedData = {
      ...onboardingData,
      ...stepData
    };
    
    setOnboardingData(updatedData);
    
    // Save progress after each step
    dataManager.saveUserData(updatedData);
    
    // Move to next step
    const currentIndex = getCurrentStepIndex();
    if (currentIndex < STEP_ORDER.length - 1) {
      setCurrentStep(STEP_ORDER[currentIndex + 1]);
    } else {
      // Complete onboarding
      handleOnboardingComplete(updatedData);
    }
  };

  const handleStepBack = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      setCurrentStep(STEP_ORDER[currentIndex - 1]);
    }
  };

  const handleOnboardingComplete = (finalData) => {
    const completedData = {
      ...finalData,
      onboardingComplete: true,
      completedAt: new Date().toISOString()
    };
    
    dataManager.saveUserData(completedData);
    console.log('🎉 Onboarding completed:', completedData);
    
    if (onComplete) {
      onComplete(completedData);
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
          />
        );
        
      case STEPS.NETWORTH:
        return (
          <NetWorthStep 
            {...commonProps}
            incomeData={onboardingData.income}
            savingsData={onboardingData.savingsAllocation}
            expensesData={onboardingData.expenses}
            nextLabel="Complete Setup"
          />
        );
        
      default:
        return <WelcomeStep {...commonProps} />;
    }
  };

  return (
    <div className="min-h-screen">
      {renderCurrentStep()}
    </div>
  );
};
