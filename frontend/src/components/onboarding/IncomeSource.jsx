import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import FrequencySelector from '../shared/FrequencySelector';

const IncomeSource = ({ source, onUpdate, onDelete }) => {
  const { isDarkMode } = useTheme();

  const handleNameChange = (e) => {
    onUpdate({ ...source, name: e.target.value });
  };

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    onUpdate({ ...source, amount: value });
  };

  const handleFrequencyChange = (newFrequency) => {
    onUpdate({ ...source, frequency: newFrequency });
  };

  const convertToYearly = (amount, frequency) => {
    const num = parseFloat(amount) || 0;
    switch (frequency) {
      case 'Weekly': return num * 52;
      case 'Bi-weekly': return num * 26;
      case 'Monthly': return num * 12;
      case 'Yearly': return num;
      case 'One-time': return 0;
      default: return num;
    }
  };

  const yearlyAmount = convertToYearly(source.amount, source.frequency);

  return (
    <div className={`py-8 border-b transition-colors ${
      isDarkMode ? 'border-gray-800' : 'border-gray-200'
    }`}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
        <div className="lg:col-span-2">
          <FrequencySelector 
            frequency={source.frequency}
            onChange={handleFrequencyChange}
          />
        </div>
        
        <div className="lg:col-span-6">
          <label className={`block text-sm font-medium mb-2 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Income source
          </label>
          <input
            type="text"
            placeholder={source.frequency === 'One-time' ? 'One-time income (bonus, gift, etc.)' : 'Income source name'}
            value={source.name}
            onChange={handleNameChange}
            className={`w-full bg-transparent border-0 border-b-2 pb-2 text-lg focus:outline-none transition-colors ${
              isDarkMode 
                ? 'border-gray-700 text-white placeholder-gray-500 focus:border-gray-500' 
                : 'border-gray-300 text-gray-900 placeholder-gray-400 focus:border-gray-500'
            }`}
          />
        </div>
        
        <div className="lg:col-span-3">
          <label className={`block text-sm font-medium mb-2 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Amount
          </label>
          <div className="relative">
            <span className={`absolute left-0 top-2 text-lg ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              $
            </span>
            <input
              type="text"
              placeholder="0"
              value={source.amount}
              onChange={handleAmountChange}
              className={`w-full bg-transparent border-0 border-b-2 pb-2 pl-6 text-lg focus:outline-none transition-colors ${
                isDarkMode 
                  ? 'border-gray-700 text-white placeholder-gray-500 focus:border-gray-500' 
                  : 'border-gray-300 text-gray-900 placeholder-gray-400 focus:border-gray-500'
              }`}
            />
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <button
            onClick={onDelete}
            className={`w-full py-2 text-sm transition-colors border-b ${
              isDarkMode 
                ? 'text-gray-500 hover:text-gray-300 border-transparent hover:border-gray-600' 
                : 'text-gray-400 hover:text-gray-600 border-transparent hover:border-gray-400'
            }`}
          >
            Remove
          </button>
        </div>
      </div>
      
      {source.amount && (
        <div className="mt-6">
          {source.frequency === 'One-time' ? (
            <div className={`text-sm font-light ${
              isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
            }`}>
              One-time income (not included in recurring budget calculations)
            </div>
          ) : source.frequency !== 'Yearly' ? (
            <div className={`text-sm font-light ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              ${yearlyAmount.toLocaleString()} per year
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default IncomeSource;
