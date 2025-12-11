// frontend/src/components/overviews/EditWrapper.jsx
import { useState, useEffect } from 'react';

import { apiService } from 'utils/apiService';
import { IncomeStep } from 'components/setup/IncomeStep';
import { SavingsAllocationStep } from 'components/setup/SavingsAllocationStep';
import { ExpensesStep } from 'components/setup/ExpensesStep';

export const EditWrapper = ({ editType, onComplete, onCancel, returnTo = 'dashboard' }) => {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await apiService.loadUserData();
        setUserData(data);
      } catch (error) {
        console.error('[EditWrapper] Error loading data:', error);
      }
    };

    loadData();
  }, []);

  const handleSave = async (updatedData) => {
    try {
      // Merge the updated data with existing user data
      const currentData = await apiService.loadUserData();
      const newData = {
        ...currentData,
        [editType]: updatedData
      };

      // Save to localStorage
      await apiService.saveUserData(newData);

      // Return to the screen they came from
      onComplete(returnTo);
    } catch (error) {
      console.error('[EditWrapper] Error saving data:', error);
    }
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

    default:
      return null;
  }
};
