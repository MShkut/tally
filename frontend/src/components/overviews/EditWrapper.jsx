// frontend/src/components/overviews/EditWrapper.jsx
import React, { useState, useEffect } from 'react';

import { dataManager } from 'utils/dataManager';
import { IncomeStep } from 'components/onboarding/IncomeStep';
import { SavingsAllocationStep } from 'components/onboarding/SavingsAllocationStep';
import { ExpensesStep } from 'components/onboarding/ExpensesStep';
import { NetWorthStep } from 'components/onboarding/NetWorthStep';

export const EditWrapper = ({ editType, onComplete, onCancel, returnTo = 'dashboard' }) => {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const data = dataManager.loadUserData();
    setUserData(data);
  }, []);

  const handleSave = (updatedData) => {
    // Merge the updated data with existing user data
    const currentData = dataManager.loadUserData();
    const newData = {
      ...currentData,
      [editType]: updatedData
    };
    
    // Save to localStorage
    dataManager.saveUserData(newData);
    
    // Return to the screen they came from
    onComplete(returnTo);
  };

  const handleBack = () => {
    // Cancel and return to previous screen without saving
    onCancel(returnTo);
  };

  if (!userData) {
    return <div>Loading...</div>;
  }

  // Override the navigation buttons for edit mode
  const getEditProps = (StepComponent) => {
    return {
      onNext: handleSave,
      onBack: handleBack,
      savedData: userData,
      nextLabel: 'Save Changes',
      backLabel: 'Cancel'
    };
  };

  // Render the appropriate step component in edit mode
  switch (editType) {
    case 'income':
      return (
        <IncomeStep
          {...getEditProps(IncomeStep)}
        />
      );
      
    case 'savingsAllocation':
      return (
        <SavingsAllocationStep
          {...getEditProps(SavingsAllocationStep)}
          incomeData={userData.income}
        />
      );
      
    case 'expenses':
      return (
        <ExpensesStep
          {...getEditProps(ExpensesStep)}
          incomeData={userData.income}
          savingsData={userData.savingsAllocation}
        />
      );
      
    case 'netWorth':
      return (
        <NetWorthStep
          {...getEditProps(NetWorthStep)}
          incomeData={userData.income}
          savingsData={userData.savingsAllocation}
          expensesData={userData.expenses}
        />
      );
      
    default:
      return null;
  }
};
