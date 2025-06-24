// frontend/src/components/dashboard/BurgerMenu.jsx
import React, { useEffect, useState } from 'react';

import { useTheme } from 'contexts/ThemeContext';
import { ConfirmationModal } from 'components/shared/FormComponents';
import { dataManager } from 'utils/dataManager';

export const BurgerMenu = ({ isOpen, onClose, onAction, currentPage = 'dashboard' }) => {
  const { isDarkMode } = useTheme();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
        setShowResetConfirm(false);
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

  // Define menu items based on current page context
  const getMenuItems = () => {
    // Check if user has gifts category
    const userData = dataManager.loadUserData();
    const hasGiftsCategory = userData?.expenses?.expenseCategories?.some(
      cat => cat.name.toLowerCase() === 'gifts'
    ) || false;

    const baseActions = [
      { id: 'import', label: 'Import transactions', primary: currentPage !== 'import' },
      { id: 'start-next-period', label: 'Start next period' }
    ];

    const baseNavigate = [
      { id: 'dashboard', label: 'Dashboard', active: currentPage === 'dashboard' },
      { id: 'import', label: 'Transaction Import', active: currentPage === 'import' }
    ];

    // Add gifts to navigation if gifts category exists
    if (hasGiftsCategory) {
      baseNavigate.push({
        id: 'gifts',
        label: 'Gift Management',
        active: currentPage === 'gifts'
      });
    }

    const baseSettings = [
      { id: 'export', label: 'Export data' },
      { id: 'reset-data', label: 'Reset all data', danger: true }
    ];

    return {
      actions: baseActions,
      navigate: baseNavigate,
      settings: baseSettings
    };
  };

  const menuItems = getMenuItems();

  const handleResetConfirm = () => {
    onAction('reset-data');
    setShowResetConfirm(false);
    onClose();
  };

  const handleMenuItemClick = (actionId) => {
    if (actionId === 'reset-data') {
      setShowResetConfirm(true);
    } else {
      onAction(actionId);
    }
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
              Stash
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
              onAction={handleMenuItemClick}
              isDarkMode={isDarkMode}
              currentPage={currentPage}
            />
            <MenuSection 
              title="Navigate" 
              items={menuItems.navigate} 
              onAction={handleMenuItemClick}
              isDarkMode={isDarkMode}
              currentPage={currentPage}
            />
            <MenuSection 
              title="Settings" 
              items={menuItems.settings} 
              onAction={handleMenuItemClick}
              isDarkMode={isDarkMode}
              currentPage={currentPage}
            />
          </div>

          {/* Footer Note */}
          <div className={`mt-16 pt-8 border-t border-current border-opacity-10 ${
            isDarkMode ? 'text-gray-500' : 'text-gray-400'
          }`}>
            <p className="text-xs font-light">
              {currentPage === 'dashboard' ? 'Dashboard View' : 
               currentPage === 'import' ? 'Transaction Import' : 'Current Page'}
            </p>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal using FormComponents */}
      <ConfirmationModal
        isOpen={showResetConfirm}
        title="Reset All Data?"
        description="This will permanently delete all your financial data, including:"
        details={[
          'Onboarding setup and budget configuration',
          'All imported and manual transactions',
          'Savings goals and net worth data',
          'Theme preferences'
        ]}
        warningText="This action cannot be undone."
        confirmText="Reset All Data"
        cancelText="Cancel"
        onConfirm={handleResetConfirm}
        onCancel={() => setShowResetConfirm(false)}
        confirmDanger={true}
      />
    </>
  );
};

const MenuSection = ({ title, items, onAction, isDarkMode, currentPage }) => (
  <div>
    <h3 className={`
      text-xs font-medium uppercase tracking-wider mb-4
      ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}
    `}>
      {title}
    </h3>
    <div className="space-y-1">
      {items.map(item => {
        const isCurrentPage = item.active || 
          (item.id === 'dashboard' && currentPage === 'dashboard') ||
          (item.id === 'import' && currentPage === 'import');
        
        return (
          <button
            key={item.id}
            onClick={() => onAction(item.id)}
            className={`
              block w-full text-left py-3 text-base transition-all duration-200
              border-b border-transparent hover:border-current
              ${item.danger 
                ? 'text-red-500 hover:text-red-400' 
                : isCurrentPage
                  ? isDarkMode ? 'text-white font-medium border-gray-600' : 'text-black font-medium border-gray-400'
                  : item.primary 
                    ? isDarkMode ? 'text-white font-medium' : 'text-black font-medium'
                    : isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-black'
              }
            `}
          >
            {item.label}
            {isCurrentPage && (
              <span className={`ml-2 text-xs ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>
                •
              </span>
            )}
          </button>
        );
      })}
    </div>
  </div>
);


