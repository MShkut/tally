// frontend/src/components/gifts/AddPersonManually.jsx
import React, { useState } from 'react';

import { useTheme } from 'contexts/ThemeContext';
import { ThemeToggle } from 'components/shared/ThemeToggle';
import { DatePicker } from 'components/shared/DatePicker';
import {
  FormGrid,
  FormField,
  StandardInput,
  FormSection,
  StandardFormLayout
} from 'components/shared/FormComponents';

export const AddPersonManually = ({ onAdd, onBack }) => {
  const { isDarkMode } = useTheme();
  const [person, setPerson] = useState({
    name: '',
    relationship: '',
    birthday: '',
    notes: '',
    applicableHolidays: ['christmas'], // Default to Christmas
    budgets: {}
  });

  const handleFieldChange = (field, value) => {
    setPerson(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAdd = () => {
    if (!person.name.trim()) return;
    
    const newPerson = {
      ...person,
      id: `person-${Date.now()}-${Math.random()}`,
      createdAt: new Date().toISOString()
    };
    
    onAdd(newPerson);
  };

  const canAdd = person.name.trim().length > 0;

  return (
    <>
      <ThemeToggle />
      <StandardFormLayout
        title="Add Gift Recipient"
        subtitle="Add a new person to your gift list"
        onBack={onBack}
        onNext={handleAdd}
        canGoNext={canAdd}
        nextLabel="Add Person"
        backLabel="Cancel"
      >
        
        {/* Personal Information */}
        <FormSection>
          <FormGrid>
            <FormField span={6}>
              <StandardInput
                label="Name"
                value={person.name}
                onChange={(value) => handleFieldChange('name', value)}
                placeholder="John Doe"
                required
              />
            </FormField>
            <FormField span={6}>
              <StandardInput
                label="Relationship"
                value={person.relationship}
                onChange={(value) => handleFieldChange('relationship', value)}
                placeholder="Friend, sister, coworker, etc."
              />
            </FormField>
          </FormGrid>
          
          <FormGrid>
            <FormField span={6}>
              <label className={`block text-sm font-light mb-2 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Birthday
              </label>
              <DatePicker
                value={person.birthday}
                onChange={(value) => handleFieldChange('birthday', value)}
                placeholder="Select birthday"
                useBudgetConstraints={false}
                align="right"
              />
            </FormField>
            <FormField span={6}>
              <StandardInput
                label="Notes"
                value={person.notes}
                onChange={(value) => handleFieldChange('notes', value)}
                placeholder="Gift preferences, sizes, interests, etc."
              />
            </FormField>
          </FormGrid>
        </FormSection>

        {/* Info Note */}
        <FormSection>
          <div className={`text-center text-sm font-light ${
            isDarkMode ? 'text-gray-500' : 'text-gray-400'
          }`}>
            You can set gift occasions and budgets after adding this person
          </div>
        </FormSection>

      </StandardFormLayout>
    </>
  );
};
