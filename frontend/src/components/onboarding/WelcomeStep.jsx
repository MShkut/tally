import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeToggle from '../shared/ThemeToggle';

const WelcomeStep = ({ onNext }) => {
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

  const canContinue = formData.householdName.trim() && formData.periodDuration;

  const getDurationDescription = (months) => {
    if (months === 1) return "Perfect for short-term planning and getting started";
    if (months <= 3) return "Ideal for life transitions and focused goal periods";
    if (months <= 6) return "The most natural planning cycle for most people";
    if (months <= 9) return "Great for school years and longer projects";
    return "Traditional annual budgeting for stable life phases";
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <ThemeToggle />
      <div className="max-w-4xl mx-auto px-6 py-12">
        
        <div className="mb-24">
          <h1 className={`text-5xl font-light leading-tight mb-4 ${
            isDarkMode ? 'text-white' : 'text-black'
          }`}>
            Personal Finance Tracker
          </h1>
          <p className={`text-xl font-light ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            A privacy-first approach to understanding your financial life. 
            All data stays on your device, giving you complete control over your financial information.
          </p>
        </div>

        <div className="mb-16">
          <label className={`block text-sm font-medium mb-6 uppercase tracking-wider ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Who is this budget for?
          </label>
          <input
            type="text"
            value={formData.householdName}
            onChange={(e) => handleInputChange('householdName', e.target.value)}
            placeholder="Jane & John, Smith Family, or just Sarah..."
            className={`w-full max-w-md px-0 py-4 border-0 border-b-2 bg-transparent text-2xl font-light transition-colors focus:outline-none ${
              isDarkMode 
                ? 'border-gray-700 text-white placeholder-gray-500 focus:border-white' 
                : 'border-gray-300 text-black placeholder-gray-400 focus:border-black'
            }`}
          />
        </div>

        <div className="mb-16">
          <label className={`block text-sm font-medium mb-6 uppercase tracking-wider ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            How many months should we plan for?
          </label>
          
          <div className="flex items-center gap-4 mb-8">
            <input
              type="number"
              min="1"
              max="12"
              value={formData.periodDuration}
              onChange={(e) => handleInputChange('periodDuration', parseInt(e.target.value) || 1)}
              className={`w-20 px-0 py-4 border-0 border-b-2 bg-transparent text-3xl font-light transition-colors focus:outline-none ${
                isDarkMode 
                  ? 'border-gray-700 text-white focus:border-white' 
                  : 'border-gray-300 text-black focus:border-black'
              }`}
            />
            <span className={`text-2xl font-light ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {formData.periodDuration === 1 ? 'month' : 'months'}
            </span>
          </div>

          <p className={`text-lg font-light mb-12 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {getDurationDescription(formData.periodDuration)}
          </p>
        </div>

        <div className={`mb-16 py-8 border-l-2 pl-8 ${
          isDarkMode ? 'border-gray-700' : 'border-gray-300'
        }`}>
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

        <div className="text-center">
          <button
            onClick={handleNext}
            disabled={!canContinue}
            className={`px-12 py-4 text-xl font-light transition-all border-b-2 ${
              canContinue
                ? isDarkMode
                  ? 'text-white border-white hover:border-gray-400'
                  : 'text-black border-black hover:border-gray-600'
                : isDarkMode
                  ? 'text-gray-600 border-gray-600 cursor-not-allowed'
                  : 'text-gray-400 border-gray-400 cursor-not-allowed'
            }`}
          >
            Begin Financial Setup
          </button>
          
          {!canContinue && (
            <p className={`text-base font-light mt-4 ${
              isDarkMode ? 'text-gray-500' : 'text-gray-500'
            }`}>
              Please enter a name and choose a planning period to continue
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default WelcomeStep;
