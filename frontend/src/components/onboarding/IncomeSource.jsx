import React from 'react';
import { DollarSign, Trash2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import FrequencySelector from '../shared/FrequencySelector';
import { Input, Description } from '../styled/StyledComponents';

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
          <Input
            type="text"
            placeholder={source.frequency === 'One-time' ? 'One-time income (bonus, gift, etc.)' : 'Income source name'}
            value={source.name}
            onChange={handleNameChange}
          />
        </div>
        
        <div className="flex-1">
          <Input
            type="text"
            placeholder="0"
            value={source.amount}
            onChange={handleAmountChange}
            icon={DollarSign}
          />
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
        <div className="mt-2">
          {source.frequency === 'One-time' ? (
            <Description className="font-medium text-yellow-600">
              💡 One-time income (not included in recurring budget calculations)
            </Description>
          ) : source.frequency !== 'Yearly' ? (
            <Description>≈ ${yearlyAmount.toLocaleString()} per year</Description>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default IncomeSource;
