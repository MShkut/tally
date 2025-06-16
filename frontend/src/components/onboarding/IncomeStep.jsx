import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeToggle from '../shared/ThemeToggle';
import ProgressBar from '../shared/ProgressBar';
import NavigationButtons from '../shared/NavigationButtons';
import IncomeSource from './IncomeSource';

const IncomeStep = ({ onNext, onBack }) => {
  const { isDarkMode, currentTheme } = useTheme();
  const [incomeSources, setIncomeSources] = useState([
    { 
      id: 1, 
      name: 'Primary Job', 
      amount: '75000', 
      frequency: 'Yearly'
    },
    { 
      id: 2, 
      name: 'Side Hustle', 
      amount: '1250', 
      frequency: 'Monthly'
    }
  ]);

  const addIncomeSource = () => {
    const newId = Math.max(...incomeSources.map(s => s.id), 0) + 1;
    setIncomeSources([
      ...incomeSources,
      { id: newId, name: '', amount: '', frequency: 'Yearly' }
    ]);
  };

  const updateIncomeSource = (id, updatedSource) => {
    setIncomeSources(incomeSources.map(source => 
      source.id === id ? updatedSource : source
    ));
  };

  const deleteIncomeSource = (id) => {
    setIncomeSources(incomeSources.filter(source => source.id !== id));
  };

  const convertToYearly = (amount, frequency) => {
    const num = parseFloat(amount) || 0;
    switch (frequency) {
      case 'Weekly': return num * 52;
      case 'Bi-weekly': return num * 26;
      case 'Monthly': return num * 12;
      case 'Yearly': return num;
      default: return num;
    }
  };

  const totalYearlyIncome = incomeSources.reduce((total, source) => {
    return total + convertToYearly(source.amount, source.frequency);
  }, 0);

  const handleNext = () => {
    if (onNext) {
      onNext({ incomeSources, totalYearlyIncome });
    }
  };

  return (
    <div className={`min-h-screen transition-colors bg-gradient-to-br ${isDarkMode ? currentTheme.darkGradient : currentTheme.lightGradient} p-6`}>
      <ThemeToggle />
      <div className="max-w-2xl mx-auto">
        <ProgressBar currentStep={1} />
        
        <div className="text-center mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Let's Start with Your Income
          </h1>
        </div>

        <div className={`rounded-xl p-8 shadow-lg ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
          <div className="space-y-4 mb-6">
            {incomeSources.map((source) => (
              <IncomeSource
                key={source.id}
                source={source}
                onUpdate={(updatedSource) => updateIncomeSource(source.id, updatedSource)}
                onDelete={() => deleteIncomeSource(source.id)}
              />
            ))}
          </div>

          <button
            onClick={addIncomeSource}
            className={`w-full p-4 border-2 border-dashed rounded-lg transition-colors flex items-center justify-center space-x-2 ${
              isDarkMode 
                ? 'border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300' 
                : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700'
            }`}
          >
            <Plus className="w-5 h-5" />
            <span>Add another income source</span>
          </button>

          {totalYearlyIncome > 0 && (
            <div className={`mt-6 p-4 rounded-lg border transition-colors ${
              isDarkMode 
                ? currentTheme.accentDark
                : currentTheme.accentLight
            }`}>
              <p className={`text-lg font-semibold ${
                isDarkMode 
                  ? currentTheme.accentDark.includes('text-') 
                    ? '' 
                    : `text-${currentTheme.primary}-400`
                  : currentTheme.accentLight.includes('text-')
                    ? ''
                    : `text-${currentTheme.primary}-800`
              }`}>
                Total Yearly Income: ${totalYearlyIncome.toLocaleString()}
              </p>
              <p className={`text-sm mt-1 ${
                isDarkMode 
                  ? `text-${currentTheme.primary}-300`
                  : `text-${currentTheme.primary}-600`
              }`}>
                ≈ ${(totalYearlyIncome/12).toLocaleString()} per month
              </p>
            </div>
          )}

          <NavigationButtons
            onBack={onBack}
            onNext={handleNext}
            canGoNext={totalYearlyIncome > 0}
            showBack={false}
            useThemeColor={true}
          />
        </div>
      </div>
    </div>
  );
};

export default IncomeStep;
