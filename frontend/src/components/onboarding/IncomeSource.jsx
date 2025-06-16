import React from 'react';
import { DollarSign, Trash2 } from 'lucide-react';
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
    <div className={`p-4 rounded-lg border transition-colors ${
      isDarkMode 
        ? 'bg-gray-700 border-gray-600' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          <FrequencySelector 
            frequency={source.frequency}
            onChange={handleFrequencyChange}
            width="w-32"
          />
        </div>
        
        <div className="flex-1">
          <input
            type="text"
            placeholder={source.frequency === 'One-time' ? 'One-time income (bonus, gift, etc.)' : 'Income source name'}
            value={source.name}
            onChange={handleNameChange}
            className={`w-full px-3 py-2 rounded-lg border transition-colors ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
          />
        </div>
        
        <div className="flex-1">
          <div className="relative">
            <DollarSign className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <input
              type="text"
              placeholder="0"
              value={source.amount}
              onChange={handleAmountChange}
              className={`w-full pl-10 pr-3 py-2 rounded-lg border transition-colors ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
        </div>
        
        <button
          onClick={onDelete}
          className={`p-2 rounded-lg transition-colors ${
            isDarkMode 
              ? 'text-red-400 hover:bg-red-900/20' 
              : 'text-red-600 hover:bg-red-50'
          }`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      
      {source.amount && (
        <div className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {source.frequency === 'One-time' ? (
            <span className={`font-medium ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
              💡 One-time income (not included in recurring budget calculations)
            </span>
          ) : source.frequency !== 'Yearly' ? (
            <span>≈ ${yearlyAmount.toLocaleString()} per year</span>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default IncomeSource;
