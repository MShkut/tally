import React from 'react';
import { PiggyBank, Briefcase, Home, Target, Landmark, Car, CreditCard, Building } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const IconSelector = ({ currentIcon, currentColor, onIconChange, type = 'asset' }) => {
  const { isDarkMode } = useTheme();

  const iconSets = {
    asset: {
      icons: [PiggyBank, Briefcase, Home, Target, Landmark, Car],
      colors: ['text-green-500', 'text-blue-500', 'text-orange-500', 'text-purple-500', 'text-gray-600', 'text-yellow-500']
    },
    liability: {
      icons: [CreditCard, Home, Car, Building],
      colors: ['text-red-500', 'text-orange-500', 'text-purple-500', 'text-gray-600']
    }
  };

  const handleIconClick = () => {
    const { icons, colors } = iconSets[type];
    const currentIndex = icons.findIndex(icon => icon === currentIcon);
    const nextIndex = (currentIndex + 1) % icons.length;
    
    onIconChange(icons[nextIndex], colors[nextIndex]);
  };

  const IconComponent = currentIcon || iconSets[type].icons[0];
  const iconColor = currentColor || iconSets[type].colors[0];

  return (
    <button
      onClick={handleIconClick}
      className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
        isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
      }`}
      title="Click to change icon"
    >
      <IconComponent className={`w-5 h-5 ${iconColor}`} />
    </button>
  );
};

export default IconSelector;
