import { useState } from 'react';

export const useOnboarding = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    income: [],
    savings: { rate: 40, goals: [] },
    expenses: [],
    netWorth: { assets: [], liabilities: [] }
  });

  const totalSteps = 5;

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateFormData = (section, data) => {
    setFormData(prev => ({
      ...prev,
      [section]: data
    }));
  };

  return {
    currentStep,
    totalSteps,
    formData,
    nextStep,
    prevStep,
    updateFormData,
    setCurrentStep
  };
};
