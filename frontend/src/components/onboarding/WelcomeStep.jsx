import React, { useState } from 'react';

import { useTheme } from 'contexts/ThemeContext';
import { ThemeToggle } from 'components/shared/ThemeToggle';
import { 
  FormGrid, 
  FormField, 
  StandardInput,
  StandardSelect,
  FormSection,
  StandardFormLayout,
  SummaryCard,
  SectionBorder,
  validation
} from '../shared/FormComponents';

// Custom duration selector component using FormComponents patterns
export const DurationSelector = ({ value, onChange }) => {
  const { isDarkMode } = useTheme();

  const handleChange = (e) => {
    const numValue = parseInt(e.target.value) || 1;
    const clampedValue = Math.max(1, Math.min(12, numValue));
    onChange(clampedValue);
  };

  const getDurationDescription = (months) => {
    if (months === 1) return "Perfect for short-term planning and getting started";
    if (months <= 3) return "Ideal for life transitions and focused goal periods";
    if (months <= 6) return "The most natural planning cycle for most people";
    if (months <= 9) return "Great for school years and longer projects";
    return "Traditional annual budgeting for stable life phases";
  };

  return (
    <FormSection>
      <FormGrid>
        <FormField span={3}>
          <StandardInput
            label="Planning Period"
            type="number"
            value={value}
            onChange={handleChange}
            min="1"
            max="12"
          />
        </FormField>
        <FormField span={9}>
          <div className={`flex items-end h-full pb-3`}>
            <div>
              <span className={`text-2xl font-light ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {value === 1 ? 'month' : 'months'}
              </span>
              <p className={`text-base font-light mt-2 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {getDurationDescription(value)}
              </p>
            </div>
          </div>
        </FormField>
      </FormGrid>
    </FormSection>
  );
};

export const WelcomeStep = ({ onNext }) => {
  const { isDarkMode } = useTheme();
  const [formData, setFormData] = useState({
    householdName: '',
    periodDuration: 6
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNext = () => {
    if (canContinue) {
      // Format data to match what useOnboarding expects
      const welcomeData = {
        household: {
          name: formData.householdName,
          created_date: new Date().toISOString().split('T')[0]
        },
        period: {
          duration_months: formData.periodDuration,
          start_date: new Date().toISOString().split('T')[0],
          period_number: 1
        }
      };
      
      console.log('WelcomeStep sending:', welcomeData);
      onNext(welcomeData);
    }
  };

  const canContinue = validation.hasValidString(formData.householdName) && formData.periodDuration;

  return (
    <>
      <ThemeToggle />
      <StandardFormLayout
        title="Personal Finance Tracker"
        subtitle="A privacy-first approach to understanding your financial life. All data stays on your device, giving you complete control over your financial information."
        onNext={handleNext}
        canGoNext={canContinue}
        nextLabel="Begin Financial Setup"
        showBack={false}
      >
        
        {/* Household Name Section */}
        <FormSection>
          <FormGrid>
            <FormField span={8}>
              <StandardInput
                label="Who is this budget for?"
                value={formData.householdName}
                onChange={(value) => handleInputChange('householdName', value)}
                placeholder="Jane & John, Smith Family, or just Sarah..."
                required
              />
            </FormField>
          </FormGrid>
        </FormSection>

        {/* Duration Section */}
        <FormSection title="How many months should we plan for?">
          <DurationSelector
            value={formData.periodDuration}
            onChange={(value) => handleInputChange('periodDuration', value)}
          />
        </FormSection>

        {/* Privacy Notice */}
        <SectionBorder />
        <div className={`py-8 border-l-4 ${
          isDarkMode ? 'border-gray-700 bg-gray-900/20' : 'border-gray-300 bg-gray-100'
        } pl-8`}>
          <h3 className={`text-xl font-light mb-4 ${
            isDarkMode ? 'text-white' : 'text-black'
          }`}>
            Your Data Stays Private
          </h3>
          <p className={`text-base font-light leading-relaxed ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Everything you enter is stored locally on your device. We never see your financial data, 
            and you can export or delete it anytime.
          </p>
        </div>

        {/* Validation Message */}
        {!canContinue && (
          <div className={`text-center mt-8 text-base font-light ${
            isDarkMode ? 'text-gray-500' : 'text-gray-500'
          }`}>
            Please enter a name and choose a planning period to continue
          </div>
        )}

      </StandardFormLayout>
    </>
  );
}
