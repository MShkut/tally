// frontend/src/components/gifts/PersonEdit.jsx
import React, { useState } from 'react';

import { useTheme } from 'contexts/ThemeContext';
import { ThemeToggle } from 'components/shared/ThemeToggle';
import {
  FormGrid,
  FormField,
  StandardInput,
  FormSection,
  StandardFormLayout,
  useItemManager
} from 'components/shared/FormComponents';
import { dataManager } from 'utils/dataManager';
import { Currency } from 'utils/currency';

export const PersonEdit = ({ person, people, onSave, onBack }) => {
  const { isDarkMode } = useTheme();
  const [editedPerson, setEditedPerson] = useState({
    ...person,
    applicableHolidays: person.applicableHolidays || [],
    budgets: person.budgets || {}
  });

  const holidays = [
    { id: 'birthday', name: 'Birthday', type: 'personal' },
    { id: 'christmas', name: 'Christmas', type: 'fixed', date: 'Dec 25' },
    { id: 'mothers-day', name: "Mother's Day", type: 'calculated', date: '2nd Sunday in May' },
    { id: 'fathers-day', name: "Father's Day", type: 'calculated', date: '3rd Sunday in June' },
    { id: 'valentines', name: "Valentine's Day", type: 'fixed', date: 'Feb 14' },
    { id: 'anniversary', name: 'Anniversary', type: 'personal' }
  ];

  const handleFieldChange = (field, value) => {
    setEditedPerson(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleHoliday = (holidayId) => {
    setEditedPerson(prev => {
      const holidays = prev.applicableHolidays || [];
      const newHolidays = holidays.includes(holidayId)
        ? holidays.filter(h => h !== holidayId)
        : [...holidays, holidayId];
      
      // Remove budget for unchecked holidays
      const newBudgets = { ...prev.budgets };
      if (!newHolidays.includes(holidayId)) {
        delete newBudgets[holidayId];
      }
      
      return {
        ...prev,
        applicableHolidays: newHolidays,
        budgets: newBudgets
      };
    });
  };

  const handleBudgetChange = (holidayId, amount) => {
    setEditedPerson(prev => ({
      ...prev,
      budgets: {
        ...prev.budgets,
        [holidayId]: amount
      }
    }));
  };

  const handleSave = () => {
    // Update person in the people array
    const updatedPeople = people.map(p => 
      p.id === person.id ? editedPerson : p
    );
    
    // Save to localStorage
    dataManager.saveGiftData({
      people: updatedPeople,
      occasions: [], // TODO: Handle occasions
      lastUpdated: new Date().toISOString()
    });
    
    onSave(editedPerson);
  };

  const getTotalBudget = () => {
    return Object.values(editedPerson.budgets).reduce(
      (sum, amount) => sum + (parseFloat(amount) || 0), 0
    );
  };

  return (
    <>
      <ThemeToggle />
      <StandardFormLayout
        title={`Edit: ${person.name}`}
        subtitle="Update personal information and set gift budgets for each occasion"
        onBack={onBack}
        onNext={handleSave}
        canGoNext={true}
        nextLabel="Save Changes"
        backLabel="Cancel"
      >
        
        {/* Personal Information */}
        <FormSection title="Personal Information">
          <FormGrid>
            <FormField span={6}>
              <StandardInput
                label="Name"
                value={editedPerson.name}
                onChange={(value) => handleFieldChange('name', value)}
                required
              />
            </FormField>
            <FormField span={6}>
              <StandardInput
                label="Relationship"
                value={editedPerson.relationship || ''}
                onChange={(value) => handleFieldChange('relationship', value)}
                placeholder="Friend, sister, coworker, etc."
              />
            </FormField>
          </FormGrid>
          
          <FormGrid>
            <FormField span={4}>
              <StandardInput
                label="Birthday"
                type="date"
                value={editedPerson.birthday || ''}
                onChange={(value) => handleFieldChange('birthday', value)}
              />
            </FormField>
            <FormField span={4}>
              <StandardInput
                label="Email"
                type="email"
                value={editedPerson.email || ''}
                onChange={(value) => handleFieldChange('email', value)}
              />
            </FormField>
            <FormField span={4}>
              <StandardInput
                label="Phone"
                type="tel"
                value={editedPerson.phone || ''}
                onChange={(value) => handleFieldChange('phone', value)}
              />
            </FormField>
          </FormGrid>
          
          <FormGrid>
            <FormField span={12}>
              <StandardInput
                label="Notes"
                value={editedPerson.notes || ''}
                onChange={(value) => handleFieldChange('notes', value)}
                placeholder="Gift preferences, sizes, interests, etc."
              />
            </FormField>
          </FormGrid>
        </FormSection>

        {/* Holiday Selection and Budgets */}
        <FormSection title="Gift Occasions & Budgets">
          <div className="space-y-8">
            {holidays.map(holiday => {
              const isChecked = editedPerson.applicableHolidays.includes(holiday.id);
              const showBirthday = holiday.id === 'birthday' && editedPerson.birthday;
              const shouldShow = holiday.id !== 'birthday' || showBirthday;
              
              if (!shouldShow) return null;
              
              return (
                <div key={holiday.id} className={`
                  py-6 border-b
                  ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}
                `}>
                  <FormGrid>
                    <FormField span={1}>
                      <div className="flex items-center h-full pb-4">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleHoliday(holiday.id)}
                          className="w-5 h-5"
                        />
                      </div>
                    </FormField>
                    <FormField span={7}>
                      <div className="pb-4">
                        <div className={`text-lg font-light ${
                          isDarkMode ? 'text-white' : 'text-black'
                        }`}>
                          {holiday.name}
                        </div>
                        {holiday.date && (
                          <div className={`text-sm font-light mt-1 ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-400'
                          }`}>
                            {holiday.date}
                          </div>
                        )}
                      </div>
                    </FormField>
                    <FormField span={4}>
                      {isChecked && (
                        <StandardInput
                          label="Budget"
                          type="currency"
                          value={editedPerson.budgets[holiday.id] || ''}
                          onChange={(value) => handleBudgetChange(holiday.id, value)}
                          prefix="$"
                          placeholder="0.00"
                        />
                      )}
                    </FormField>
                  </FormGrid>
                </div>
              );
            })}
          </div>
          
          {/* Total Budget Summary */}
          <div className={`
            mt-8 pt-8 border-t text-center
            ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}
          `}>
            <div className={`text-sm font-light mb-2 ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`}>
              Total Annual Gift Budget
            </div>
            <div className={`text-3xl font-light ${
              isDarkMode ? 'text-white' : 'text-black'
            }`}>
              {Currency.format(getTotalBudget())}
            </div>
          </div>
        </FormSection>

      </StandardFormLayout>
    </>
  );
};
