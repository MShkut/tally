import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeToggle from '../shared/ThemeToggle';
import NavigationButtons from '../shared/NavigationButtons';

// Simple IncomeSource component inline for now
const IncomeSource = ({ source, onUpdate, onDelete }) => {
  const { isDarkMode } = useTheme();

  const handleNameChange = (e) => {
    onUpdate({ ...source, name: e.target.value });
  };

  const handleAmountChange = (e) => {
    onUpdate({ ...source, amount: e.target.value });
  };

  const handleFrequencyChange = (e) => {
    onUpdate({ ...source, frequency: e.target.value });
  };

  return (
    <div className={`py-6 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-2">
          <label className={`block text-sm font-medium mb-2 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Source Name
          </label>
          <input
            type="text"
            value={source.name}
            onChange={handleNameChange}
            placeholder="Salary, Freelance, etc."
            className={`w-full px-0 py-3 border-0 border-b-2 bg-transparent transition-colors focus:outline-none ${
              isDarkMode 
                ? 'border-gray-700 text-white placeholder-gray-500 focus:border-white' 
                : 'border-gray-300 text-black placeholder-gray-400 focus:border-black'
            }`}
          />
        </div>
        
        <div>
          <label className={`block text-sm font-medium mb-2 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Amount
          </label>
          <div className="relative">
            <span className={`absolute left-0 top-3 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              $
            </span>
            <input
              type="text"
              value={source.amount}
              onChange={handleAmountChange}
              placeholder="75000"
              className={`w-full pl-6 px-0 py-3 border-0 border-b-2 bg-transparent transition-colors focus:outline-none ${
                isDarkMode 
                  ? 'border-gray-700 text-white placeholder-gray-500 focus:border-white' 
                  : 'border-gray-300 text-black placeholder-gray-400 focus:border-black'
              }`}
            />
          </div>
        </div>
        
        <div>
          <label className={`block text-sm font-medium mb-2 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Frequency
          </label>
          <select
            value={source.frequency}
            onChange={handleFrequencyChange}
            className={`w-full px-0 py-3 border-0 border-b-2 bg-transparent transition-colors focus:outline-none ${
              isDarkMode 
                ? 'border-gray-700 text-white focus:border-white' 
                : 'border-gray-300 text-black focus:border-black'
            }`}
          >
            <option value="Yearly">Yearly</option>
            <option value="Monthly">Monthly</option>
            <option value="Bi-weekly">Bi-weekly</option>
            <option value="Weekly">Weekly</option>
          </select>
        </div>
      </div>
      
      {/* Remove button */}
      <button
        onClick={onDelete}
        className={`mt-4 text-sm transition-colors ${
          isDarkMode 
            ? 'text-gray-500 hover:text-gray-300' 
            : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        Remove this income source
      </button>
    </div>
  );
};

const IncomeStep = ({ onNext, onBack }) => {
  const { isDarkMode } = useTheme();
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
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <ThemeToggle />
      <div className="max-w-4xl mx-auto px-6 py-12">
        
        <div className="mb-24">
          <h1 className={`text-5xl font-light leading-tight mb-4 ${
            isDarkMode ? 'text-white' : 'text-black'
          }`}>
            Let's Start with Your Income
          </h1>
          <p className={`text-xl font-light ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Enter all sources of regular income to build your financial foundation
          </p>
        </div>

        <div className="mb-16">
          <div className="space-y-6 mb-12">
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
            className={`w-full py-6 border-2 border-dashed transition-colors text-center ${
              isDarkMode 
                ? 'border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300' 
                : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700'
            }`}
          >
            <span className="text-lg font-light">Add another income source</span>
          </button>

          {totalYearlyIncome > 0 && (
            <div className={`mt-16 py-8 border-t border-b ${
              isDarkMode ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <div className="text-center">
                <div className={`text-4xl font-light mb-2 ${
                  isDarkMode ? 'text-white' : 'text-black'
                }`}>
                  ${totalYearlyIncome.toLocaleString()}
                </div>
                <div className={`text-lg font-light ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Total yearly income
                </div>
                <div className={`text-base mt-2 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-500'
                }`}>
                  ${(totalYearlyIncome/12).toLocaleString()} per month
                </div>
              </div>
            </div>
          )}

          <NavigationButtons
            onBack={onBack}
            onNext={handleNext}
            canGoNext={totalYearlyIncome > 0}
            showBack={true}
          />
        </div>
      </div>
    </div>
  );
};

export default IncomeStep;
