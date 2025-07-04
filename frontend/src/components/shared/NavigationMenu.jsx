import React from 'react';
import { 
  X, Upload, BarChart3, Calculator, Settings
} from 'lucide-react';

import { useTheme } from 'contexts/ThemeContext';

export const NavigationMenu = ({ isOpen, onClose, onNavigate, currentPage = 'transactions' }) => {
  const { isDarkMode } = useTheme();

  if (!isOpen) return null;

  const menuItems = [
    {
      id: 'transactions',
      label: 'Import Transactions',
      icon: Upload,
      status: 'active'
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      status: 'soon'
    },
    {
      id: 'calculators',
      label: 'Calculators',
      icon: Calculator,
      status: 'soon'
    },
    {
      id: 'gifts',
      label: 'Gifts',
      icon: X, // Placeholder icon, you might want to choose a relevant one
      status: 'active'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      status: 'soon'
    }
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />
      <div className={`fixed top-0 left-0 h-full w-64 z-50 transform transition-transform ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } border-r `}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className={`text-2xl font-light ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Tally
            </h2>
            <button onClick={onClose} className={`p-2  ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              const isSoon = item.status === 'soon';
              
              return (
                <button
                  key={item.id}
                  onClick={() => !isSoon && onNavigate(item.id)}
                  disabled={isSoon}
                  className={`w-full flex items-center gap-3 px-4 py-3  transition-colors ${
                    isActive
                      ? isDarkMode 
                        ? 'text-gray-500 bg-blue-900/20 border border-gray-300' 
                        : 'text-gray-500 bg-blue-50 border border-gray-300'
                      : isSoon
                        ? isDarkMode
                          ? 'text-gray-500 cursor-not-allowed'
                          : 'text-gray-400 cursor-not-allowed'
                        : isDarkMode 
                          ? 'text-gray-300 hover:bg-gray-700' 
                          : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                  {isSoon && (
                    <span className="ml-auto text-xs bg-yellow-100 text-yellow-800 px-2 py-1 ">
                      Soon
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
}
