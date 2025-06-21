import React, { useState } from 'react';

import { useTheme } from 'contexts/ThemeContext';
import { ThemeToggle } from 'components/shared/ThemeToggle';
import { 
  FormGrid, 
  FormField, 
  StandardInput,
  FormSection,
  StandardFormLayout,
  validation
} from '../shared/FormComponents';

export const WelcomeStep = ({ onNext }) => {
  const [formData, setFormData] = useState({
    householdName: '',
    periodDuration: ''
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDurationChange = (inputValue) => {
    // Only allow numbers 1-12
    const cleanValue = inputValue.replace(/[^0-9]/g, '');
    
    if (cleanValue === '') {
      handleInputChange('periodDuration', '');
      return;
    }
    
    const numValue = parseInt(cleanValue);
    if (numValue >= 1 && numValue <= 12) {
      handleInputChange('periodDuration', cleanValue);
    }
  };

  const handleNext = () => {
    if (canContinue) {
      const welcomeData = {
        household: {
          name: formData.householdName,
          created_date: new Date().toISOString().split('T')[0]
        },
        period: {
          duration_months: parseInt(formData.periodDuration),
          start_date: new Date().toISOString().split('T')[0],
          period_number: 1
        }
      };
      
      onNext(welcomeData);
    }
  };

  const getMonthText = () => {
    return 'months';
  };

  // Validation: need valid name and valid period duration (1-12)
  const canContinue = validation.hasValidString(formData.householdName) && 
                     formData.periodDuration && 
                     parseInt(formData.periodDuration) >= 1 && 
                     parseInt(formData.periodDuration) <= 12;

  return (
    <>
      <ThemeToggle />
      <StandardFormLayout
        title="Welcome to Stash"
        subtitle="A privacy-first approach to organizing your financial life. All data stays on your device, giving you complete control over your financial information."
        onNext={handleNext}
        canGoNext={canContinue}
        nextLabel="Begin Financial Setup"
        showBack={false}
        className="flex items-center justify-center [&_h1]:text-6xl [&_h1]:font-medium [&_p]:text-2xl [&_p]:font-medium [&_button]:text-2xl [&_button]:font-medium"
      >
        <div className="max-w-2xl mx-auto transform scale-125 origin-center">
          <FormSection>
            <FormGrid>
              {/* Name Input - Takes majority of space */}
              <FormField span={8}>
                <StandardInput
                  label="Your name(s)"
                  value={formData.householdName}
                  onChange={(value) => handleInputChange('householdName', value)}
                  placeholder="John, Jane & John, Smith Family"
                  required
                  className="[&_label]:text-2xl [&_label]:font-medium [&_input]:text-2xl [&_input]:font-medium [&_input]:pb-4 [&_span]:text-2xl [&_span]:font-medium"
                />
              </FormField>
              
              {/* Duration Input - Compact */}
              <FormField span={4}>
                <StandardInput
                  label="Budget period"
                  value={formData.periodDuration}
                  onChange={handleDurationChange}
                  placeholder="6"
                  suffix={getMonthText()}
                  required
                  className="[&_label]:text-2xl [&_label]:font-medium [&_input]:text-2xl [&_input]:font-medium [&_input]:pb-4"
                />
              </FormField>
            </FormGrid>
          </FormSection>
        </div>

      </StandardFormLayout>
    </>
  );
}
