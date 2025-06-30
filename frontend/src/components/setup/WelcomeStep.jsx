// frontend/src/components/onboarding/WelcomeStep.jsx
import React, { useState, useEffect } from 'react';

import { useTheme } from 'contexts/ThemeContext';
import { ThemeToggle } from 'components/shared/ThemeToggle';
import { DateRangePicker } from 'components/shared/DateRangePicker';
import { 
  FormGrid, 
  FormField, 
  StandardInput,
  FormSection,
  StandardFormLayout,
  validation
} from 'components/shared/FormComponents';

export const WelcomeStep = ({ onNext, savedData = null }) => {
  const { isDarkMode } = useTheme();
  const [formData, setFormData] = useState({
    householdName: ''
  });
  const [periodData, setPeriodData] = useState(null);

  // Pre-populate form with saved data
  useEffect(() => {
    if (savedData) {
      console.log('🔄 Pre-populating welcome step:', savedData);
      setFormData({
        householdName: savedData.household?.name || ''
      });
    }
  }, [savedData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDateRangeChange = (dateRange) => {
    setPeriodData(dateRange);
  };

  const handleNext = () => {
    if (canContinue) {
      const welcomeData = {
        household: {
          name: formData.householdName,
          created_date: new Date().toISOString().split('T')[0]
        },
        period: {
          duration_months: periodData.durationMonths,
          start_date: periodData.startDate,
          end_date: periodData.endDate,
          period_number: 1
        }
      };
      
      onNext(welcomeData);
    }
  };

  // Validation: need valid name and valid period
  const canContinue = validation.hasValidString(formData.householdName) && 
                     periodData && 
                     periodData.durationMonths >= 1 && 
                     periodData.durationMonths <= 12;

  return (
    <>
      <ThemeToggle />
      <div>
        <StandardFormLayout
          title="Welcome to Tally"
          subtitle="A privacy-first approach to organizing your financial life. All data stays on your device, giving you complete control over your financial information."
          onNext={handleNext}
          canGoNext={canContinue}
          nextLabel="Begin Financial Setup"
          showBack={false}
          className="flex items-center justify-center"
        >
        <div className="max-w-3xl mx-auto">
          <FormSection>
            <FormGrid>
              {/* Name Input - Full width */}
              <FormField span={12}>
                <StandardInput
                  label="Your name(s)"
                  value={formData.householdName}
                  onChange={(value) => handleInputChange('householdName', value)}
                  placeholder="John, Jane & John, Smith Family"
                  className={`[&_label]:text-2xl [&_label]:font-light [&_input]:text-2xl [&_input]:font-medium [&_input]:pb-4 ${
                    isDarkMode ? '[&_label]:text-white' : '[&_label]:text-black'
                  }`}
                />
              </FormField>
            </FormGrid>
          </FormSection>
          
          {/* Budget Period Selector */}
          <FormSection title="Your Budget Period (1-12 months)">
            <DateRangePicker 
              onDateRangeChange={handleDateRangeChange}
              initialStartDate={savedData?.period?.start_date}
              initialEndDate={savedData?.period?.end_date}
              maxMonths={12}
            />
          </FormSection>
        </div>

        </StandardFormLayout>
      </div>
    </>
  );
};
