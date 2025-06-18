// frontend/src/App.jsx
import React, { useState } from 'react'
import { ThemeProvider } from './contexts/ThemeContext'
import { useOnboarding } from './hooks/useOnboarding'
import IncomeStep from './components/onboarding/IncomeStep'
import SavingsStep from './components/onboarding/SavingsStep'
import SavingsAllocationStep from './components/onboarding/SavingsAllocationStep'
import ExpensesStep from './components/onboarding/ExpensesStep'
import NetWorthStep from './components/onboarding/NetWorthStep'
import TransactionImport from './components/dashboard/TransactionImport'
import Dashboard from './components/dashboard/Dashboard'

function OnboardingFlow({ onComplete, onBack }) {
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
    // Complete the onboarding with full data
    const completeData = { 
      ...formData, 
      netWorth: netWorthData,
      householdName: 'Smith Family', // This would come from a household setup step
      periodStartDate: new Date('2024-03-01'),
      periodDuration: 6
    };
    console.log('🎉 Onboarding Complete! Full data:', completeData);
    onComplete(completeData);
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
            onBack={onBack}
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
        return <IncomeStep onNext={handleIncomeNext} onBack={onBack} />;
    }
  };

  return renderStep();
}

function App() {
  const [currentView, setCurrentView] = useState('onboarding'); // 'onboarding', 'import', 'dashboard'
  const [onboardingData, setOnboardingData] = useState(null);
  const [transactions, setTransactions] = useState([]);

  const handleOnboardingComplete = (data) => {
    setOnboardingData(data);
    setCurrentView('import');
  };

  const handleBackToOnboarding = () => {
    setCurrentView('onboarding');
  };

  const handleImportComplete = (importedTransactions = []) => {
    if (importedTransactions.length > 0) {
      setTransactions(importedTransactions);
    }
    setCurrentView('dashboard');
  };

  const handleNavigateFromDashboard = (destination) => {
    switch (destination) {
      case 'import':
      case 'transactions':
        setCurrentView('import');
        break;
      case 'onboarding':
        setCurrentView('onboarding');
        break;
      case 'dashboard':
        setCurrentView('dashboard');
        break;
      default:
        console.log(`Navigation to ${destination} not yet implemented`);
        break;
    }
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'onboarding':
        return (
          <OnboardingFlow 
            onComplete={handleOnboardingComplete}
            onBack={null}
          />
        );
      case 'import':
        return (
          <TransactionImport 
            onboardingData={onboardingData}
            onBack={handleBackToOnboarding}
            onComplete={handleImportComplete}
          />
        );
      case 'dashboard':
        return (
          <Dashboard 
            onboardingData={onboardingData}
            transactions={transactions}
            onNavigate={handleNavigateFromDashboard}
          />
        );
      default:
        return (
          <OnboardingFlow 
            onComplete={handleOnboardingComplete}
            onBack={null}
          />
        );
    }
  };

  return (
    <ThemeProvider>
      {renderCurrentView()}
    </ThemeProvider>
  )
}

export default App
