import { useState, useEffect } from 'react';
import { dataManager } from 'utils/dataManager';

export const useOnboarding = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    // Household and Period data
    household: {
      name: '',
      created_date: null
    },
    period: {
      duration_months: 6,
      start_date: null,
      period_number: 1,
      end_date: null
    },
    // Financial data
    income: [],
    savingsAllocation: {
      savingsRate: 20, 
      monthlySavings: 0,
      emergencyFund: { hasExisting: false, monthlyAmount: '' },
      savingsGoals: []
    },
    expenses: [],
    netWorth: { assets: [], liabilities: [] }
  });

  const totalSteps = 5;

  // Load saved data on hook initialization
  useEffect(() => {
    const savedData = dataManager.loadUserData();
    if (savedData && !savedData.onboardingComplete) {
      console.log('📖 Loading saved onboarding progress:', savedData);
      
      // Restore form data
      setFormData(prevData => ({
        ...prevData,
        ...savedData
      }));
      
      // Restore current step
      const savedStep = savedData.onboardingStep || 0;
      setCurrentStep(savedStep);
    }
  }, []);

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateFormData = (section, data) => {
    setFormData(prev => ({
      ...prev,
      [section]: data
    }));
  };

  // Special handler for welcome step data
  const setHouseholdAndPeriod = (welcomeData) => {
    const endDate = new Date(welcomeData.period.start_date);
    endDate.setMonth(endDate.getMonth() + welcomeData.period.duration_months);
    
    setFormData(prev => ({
      ...prev,
      household: welcomeData.household,
      period: {
        ...welcomeData.period,
        end_date: endDate.toISOString().split('T')[0]
      }
    }));
  };

  return {
    currentStep,
    totalSteps,
    formData,
    nextStep,
    prevStep,
    updateFormData,
    setCurrentStep,
    setHouseholdAndPeriod
  };
};

export const UseOnboarding = useOnboarding;
