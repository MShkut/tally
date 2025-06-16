import React from 'react'
import { ThemeProvider } from './contexts/ThemeContext'
import { useOnboarding } from './hooks/useOnboarding'
import IncomeStep from './components/onboarding/IncomeStep'
import SavingsStep from './components/onboarding/SavingsStep'
import SavingsAllocationStep from './components/onboarding/SavingsAllocationStep'
import ExpensesStep from './components/onboarding/ExpensesStep'
import NetWorthStep from './components/onboarding/NetWorthStep'

function OnboardingFlow() {
  const { currentStep, nextStep, prevStep, formData, updateFormData } = useOnboarding();

  const handleIncomeNext = (incomeData) => {
    updateFormData('income', incomeData);
    nextStep();
  };

  const handleSavingsNext = (savingsData) => {
    updateFormData('savings', savingsData);
    nextStep();
  };

  const handleAllocationNext = (allocationData) => {
    updateFormData('allocation', allocationData);
    nextStep();
  };

  const handleExpensesNext = (expensesData) => {
    updateFormData('expenses', expensesData);
    nextStep();
  };

  const handleNetWorthNext = (netWorthData) => {
    updateFormData('netWorth', netWorthData);
    // Complete the onboarding!
    console.log('🎉 Onboarding Complete! Full data:', formData);
    alert('Congratulations! Your financial profile is complete. 🎉\n\nCheck the console for your full data.');
  };

  const handleBack = () => {
    prevStep();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <IncomeStep 
            onNext={handleIncomeNext}
            onBack={handleBack}
          />
        );
      case 2:
        return (
          <SavingsStep
            onNext={handleSavingsNext}
            onBack={handleBack}
            incomeData={formData.income}
          />
        );
      case 3:
        return (
          <SavingsAllocationStep
            onNext={handleAllocationNext}
            onBack={handleBack}
            incomeData={formData.income}
            savingsData={formData.savings}
          />
        );
      case 4:
        return (
          <ExpensesStep
            onNext={handleExpensesNext}
            onBack={handleBack}
            incomeData={formData.income}
            savingsData={formData.savings}
            allocationData={formData.allocation}
          />
        );
      case 5:
        return (
          <NetWorthStep
            onNext={handleNetWorthNext}
            onBack={handleBack}
            incomeData={formData.income}
            savingsData={formData.savings}
            allocationData={formData.allocation}
            expensesData={formData.expenses}
          />
        );
      default:
        return <IncomeStep onNext={handleIncomeNext} onBack={handleBack} />;
    }
  };

  return renderStep();
}

function App() {
  return (
    <ThemeProvider>
      <OnboardingFlow />
    </ThemeProvider>
  )
}

export default App
