import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { IconButton, ICON_CATEGORIES } from './IconSystem';

const IconSelector = ({ currentIcon, currentColor, onIconChange, type = 'asset' }) => {
  const { isDarkMode } = useTheme();

  // Map the legacy type prop to the new category system
  const getIconCategory = (type) => {
    switch (type) {
      case 'asset':
        return ICON_CATEGORIES.ASSETS;
      case 'liability':
        return ICON_CATEGORIES.LIABILITIES;
      case 'expense':
        return ICON_CATEGORIES.EXPENSES;
      case 'goal':
        return ICON_CATEGORIES.SAVINGS_GOALS;
      default:
        return ICON_CATEGORIES.GENERAL;
    }
  };

  // Handle icon change - for backward compatibility, we'll just pass the icon name
  // The color is now handled automatically by the icon system
  const handleIconChange = (iconName) => {
    // For backward compatibility with existing components that expect (icon, color)
    if (onIconChange) {
      onIconChange(iconName, null); // color is now automatic
    }
  };

  return (
    <IconButton
      iconName={currentIcon || 'Target'}
      category={getIconCategory(type)}
      onIconChange={handleIconChange}
      className="flex-shrink-0"
    />
  );
};

export default IconSelector;
