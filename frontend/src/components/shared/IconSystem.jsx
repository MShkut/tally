// frontend/src/components/shared/IconSystem.jsx
import React, { useState } from 'react';
import { 
  Target, Home, Car, GraduationCap, PiggyBank, Heart, Briefcase, Plane, Coffee, Gift,
  CreditCard, Building, Smartphone, Landmark, Utensils, Zap, Shirt, Gamepad2,
  DollarSign, TrendingUp, Shield, Wallet, Calculator
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

// Universal icon registry - single source of truth
export const ICON_REGISTRY = {
  // Financial/Savings Goals
  Target: { icon: Target, color: 'text-blue-500', category: 'goals' },
  PiggyBank: { icon: PiggyBank, color: 'text-pink-500', category: 'goals' },
  Shield: { icon: Shield, color: 'text-green-500', category: 'goals' },
  Wallet: { icon: Wallet, color: 'text-purple-500', category: 'goals' },
  
  // Lifestyle/Assets
  Home: { icon: Home, color: 'text-green-500', category: ['goals', 'assets', 'expenses'] },
  Car: { icon: Car, color: 'text-red-500', category: ['goals', 'assets', 'expenses'] },
  Plane: { icon: Plane, color: 'text-blue-400', category: ['goals', 'expenses'] },
  
  // Career/Income
  Briefcase: { icon: Briefcase, color: 'text-gray-600', category: ['goals', 'assets'] },
  GraduationCap: { icon: GraduationCap, color: 'text-purple-500', category: ['goals', 'liabilities'] },
  
  // Personal/Lifestyle
  Heart: { icon: Heart, color: 'text-red-400', category: ['goals', 'expenses'] },
  Coffee: { icon: Coffee, color: 'text-yellow-600', category: ['goals', 'expenses'] },
  Gift: { icon: Gift, color: 'text-orange-500', category: ['goals'] },
  
  // Financial Instruments
  Landmark: { icon: Landmark, color: 'text-gray-600', category: ['assets'] },
  CreditCard: { icon: CreditCard, color: 'text-red-500', category: ['liabilities'] },
  Building: { icon: Building, color: 'text-gray-600', category: ['liabilities', 'assets'] },
  
  // Expenses
  Utensils: { icon: Utensils, color: 'text-green-500', category: ['expenses'] },
  Zap: { icon: Zap, color: 'text-yellow-500', category: ['expenses'] },
  Shirt: { icon: Shirt, color: 'text-purple-500', category: ['expenses'] },
  Gamepad2: { icon: Gamepad2, color: 'text-indigo-500', category: ['expenses'] },
  Smartphone: { icon: Smartphone, color: 'text-pink-500', category: ['liabilities', 'expenses'] },
  
  // Financial Concepts
  TrendingUp: { icon: TrendingUp, color: 'text-green-500', category: ['assets'] },
  Calculator: { icon: Calculator, color: 'text-blue-500', category: ['general'] },
  DollarSign: { icon: DollarSign, color: 'text-green-600', category: ['general'] }
};

// Get icons by category
export const getIconsByCategory = (category) => {
  return Object.entries(ICON_REGISTRY).filter(([name, data]) => {
    if (Array.isArray(data.category)) {
      return data.category.includes(category);
    }
    return data.category === category;
  }).reduce((acc, [name, data]) => {
    acc[name] = data;
    return acc;
  }, {});
};

// Icon categories for different use cases
export const ICON_CATEGORIES = {
  SAVINGS_GOALS: 'goals',
  ASSETS: 'assets', 
  LIABILITIES: 'liabilities',
  EXPENSES: 'expenses',
  GENERAL: 'general'
};

// Universal Icon Picker Component
export const IconPicker = ({ 
  currentIcon, 
  onIconSelect, 
  category = 'general',
  isOpen,
  onToggle,
  className = ''
}) => {
  const { isDarkMode } = useTheme();
  const availableIcons = getIconsByCategory(category);
  
  return (
    <div className={`relative ${className}`}>
      {isOpen && (
        <div className={`absolute top-12 left-0 z-50 p-3 rounded-lg border shadow-lg ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-600' 
            : 'bg-white border-gray-200'
        }`} style={{ width: '240px' }}>
          <div className="grid grid-cols-5 gap-2 max-h-32 overflow-y-auto">
            {Object.entries(availableIcons).map(([iconName, iconData]) => {
              const IconComponent = iconData.icon;
              return (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => {
                    onIconSelect(iconName);
                    onToggle();
                  }}
                  className={`p-2 rounded hover:bg-gray-100 transition-colors ${
                    currentIcon === iconName 
                      ? isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100' 
                      : isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <IconComponent className={`w-4 h-4 ${iconData.color}`} />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Universal Icon Button Component
export const IconButton = ({ 
  iconName, 
  category = 'general',
  onIconChange,
  className = '',
  size = 'w-5 h-5'
}) => {
  const { isDarkMode } = useTheme();
  const [showPicker, setShowPicker] = useState(false);
  
  const iconData = ICON_REGISTRY[iconName];
  const IconComponent = iconData?.icon || Target;
  const iconColor = iconData?.color || 'text-blue-500';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className={`p-2 rounded-lg border transition-colors hover:scale-105 ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-600 hover:bg-gray-700' 
            : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
        } ${className}`}
        title="Click to change icon"
      >
        <IconComponent className={`${size} ${iconColor}`} />
      </button>
      
      <IconPicker
        currentIcon={iconName}
        onIconSelect={onIconChange}
        category={category}
        isOpen={showPicker}
        onToggle={() => setShowPicker(false)}
      />
      
      {/* Close picker when clicking outside */}
      {showPicker && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowPicker(false)}
        />
      )}
    </div>
  );
};

// Get icon component and color by name
export const getIconData = (iconName) => {
  return ICON_REGISTRY[iconName] || ICON_REGISTRY.Target;
};

// Render icon by name
export const IconByName = ({ iconName, className = '', size = 'w-5 h-5' }) => {
  const iconData = getIconData(iconName);
  const IconComponent = iconData.icon;
  
  return <IconComponent className={`${size} ${iconData.color} ${className}`} />;
};

export default {
  ICON_REGISTRY,
  ICON_CATEGORIES,
  getIconsByCategory,
  IconPicker,
  IconButton,
  getIconData,
  IconByName
};
