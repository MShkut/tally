// frontend/src/components/dashboard/BurgerMenu.jsx
import React, { useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const BurgerMenu = ({ isOpen, onClose, onAction }) => {
  const { isDarkMode } = useTheme();

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const menuItems = {
    actions: [
      { id: 'import', label: 'Import transactions', primary: true },
      { id: 'add', label: 'Add transaction manually' },
      { id: 'budget', label: 'View detailed budget' },
      { id: 'plan', label: 'Plan next period' }
    ],
    navigate: [
      { id: 'dashboard', label: 'Dashboard' },
      { id: 'transactions', label: 'Transaction History' },
      { id: 'goals', label: 'Savings Goals' },
      { id: 'reports', label: 'Reports & Analysis' }
    ],
    settings: [
      { id: 'export', label: 'Export data' },
      { id: 'backup', label: 'Backup & sync' },
      { id: 'categories', label: 'Manage categories' },
      { id: 'preferences', label: 'Preferences' }
    ]
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Menu Panel */}
      <div className={`
        fixed top-0 left-0 h-full w-80 z-50 transform transition-transform duration-300
        ${isDarkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'} border-r
      `}>
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-12 pb-6 border-b border-current border-opacity-10">
            <h2 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
              Menu
            </h2>
            <button 
              onClick={onClose}
              className={`text-2xl leading-none transition-colors duration-200 ${
                isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'
              }`}
            >
              ×
            </button>
          </div>
          
          {/* Menu Sections */}
          <div className="space-y-10">
            <MenuSection 
              title="Actions" 
              items={menuItems.actions} 
              onAction={onAction}
              isDarkMode={isDarkMode}
            />
            <MenuSection 
              title="Navigate" 
              items={menuItems.navigate} 
              onAction={onAction}
              isDarkMode={isDarkMode}
            />
            <MenuSection 
              title="Settings" 
              items={menuItems.settings} 
              onAction={onAction}
              isDarkMode={isDarkMode}
            />
          </div>
        </div>
      </div>
    </>
  );
};

const MenuSection = ({ title, items, onAction, isDarkMode }) => (
  <div>
    <h3 className={`
      text-xs font-medium uppercase tracking-wider mb-4
      ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}
    `}>
      {title}
    </h3>
    <div className="space-y-1">
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => onAction(item.id)}
          className={`
            block w-full text-left py-3 text-base transition-all duration-200
            border-b border-transparent hover:border-current
            ${item.primary 
              ? isDarkMode ? 'text-white font-medium' : 'text-black font-medium'
              : isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-black'
            }
          `}
        >
          {item.label}
        </button>
      ))}
    </div>
  </div>
);

export default BurgerMenu;
