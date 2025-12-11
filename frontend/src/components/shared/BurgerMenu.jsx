import React from 'react';
// frontend/src/components/dashboard/BurgerMenu.jsx
import { useEffect, useState } from 'react';

import { useTheme } from 'contexts/ThemeContext';
import { ConfirmationModal } from 'components/shared/FormComponents';
import { ImportDataModal } from 'components/shared/ImportDataModal';
import { ChangePasswordModal } from 'components/shared/ChangePasswordModal';
import { handleMenuAction, getMenuItems, isCurrentPage } from 'utils/navigationHandler';

export const BurgerMenu = ({ isOpen, onClose, onAction, currentPage = 'dashboard', onLogout }) => {
  const { isDarkMode } = useTheme();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [menuItems, setMenuItems] = useState(null);

  // Load menu items async
  useEffect(() => {
    const loadMenuItems = async () => {
      try {
        const items = await getMenuItems();
        setMenuItems(items);
      } catch (error) {
        console.error('[MENU] Failed to load menu items:', error);
        // Set default menu items on error
        setMenuItems({
          dashboard: [
            { id: 'dashboard', label: 'Overview' }
          ],
          yourPlan: [
            { id: 'plan-next-period', label: 'Plan Next Period' },
            { id: 'edit-income', label: 'Edit Income Sources' },
            { id: 'edit-savings', label: 'Edit Savings Plan' },
            { id: 'edit-expenses', label: 'Edit Expenses' }
          ],
          actions: [
            { id: 'import', label: 'Import Transactions' },
            { id: 'alltransactions', label: 'View and Edit Transactions' }
          ],
          settings: [
            { id: 'settings', label: 'Settings' },
            { id: 'logout', label: 'Logout' }
          ]
        });
      }
    };

    loadMenuItems();
  }, []);

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

  const handleResetConfirm = () => {
    // Handle the actual reset
    handleMenuAction('reset-data', onAction, onClose, null);
    setShowResetConfirm(false);
  };

  const handleMenuItemClick = (actionId) => {
    // Handle logout specially
    if (actionId === 'logout' && onLogout) {
      onClose();
      onLogout();
      return;
    }

    // Handle import-data specially (show modal)
    if (actionId === 'import-data') {
      setShowImportModal(true);
      onClose();
      return;
    }

    // Handle change-password specially (show modal)
    if (actionId === 'change-password') {
      setShowChangePasswordModal(true);
      onClose();
      return;
    }

    // Call the parent's action handler
    // Parent components pass different handlers (handleMenu, handleMenuActionWrapper, etc.)
    // They are responsible for navigation logic
    if (onAction) {
      onAction(actionId);
    }
  };

  return (
    <>
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
            onClick={onClose}
          />

          {/* Menu Panel */}
      <div className={`
        fixed top-0 left-0 h-full w-80 z-50 transform transition-transform duration-300
        ${isDarkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'} border-r
        overflow-y-auto
      `}>
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-current border-opacity-10">
            <h2 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
              Tally
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
          {!menuItems ? (
            <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Loading menu...
            </div>
          ) : (
            <div className="space-y-10">
              <MenuSection
                title="Dashboards"
                items={menuItems.dashboard}
                onAction={handleMenuItemClick}
                isDarkMode={isDarkMode}
                currentPage={currentPage}
              />
              <MenuSection
                title="Actions"
                items={menuItems.actions}
                onAction={handleMenuItemClick}
                isDarkMode={isDarkMode}
                currentPage={currentPage}
              />
              <MenuSection
                title="Your Plan"
                items={menuItems.yourPlan}
                onAction={handleMenuItemClick}
                isDarkMode={isDarkMode}
                currentPage={currentPage}
              />
              <MenuSection
                title="Other"
                items={menuItems.settings}
                onAction={handleMenuItemClick}
                isDarkMode={isDarkMode}
                currentPage={currentPage}
              />
            </div>
          )}
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <div style={{ zIndex: showResetConfirm ? 60 : -1 }}>
        <ConfirmationModal
          isOpen={showResetConfirm}
          title="Reset All Data?"
          description="This will permanently delete all your financial data, including:"
          details={[
            'Onboarding setup and budget configuration',
            'All imported and manual transactions',
            'Savings goals',
            'Theme preferences'
          ]}
          warningText="This action cannot be undone."
          confirmText="Reset All Data"
          cancelText="Cancel"
          onConfirm={handleResetConfirm}
          onCancel={() => setShowResetConfirm(false)}
          confirmDanger={true}
        />
      </div>
        </>
      )}

      {/* Import Data Modal */}
      <ImportDataModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => setShowImportModal(false)}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        onSuccess={() => setShowChangePasswordModal(false)}
      />
    </>
  );
};

const MenuSection = ({ title, items, onAction, isDarkMode, currentPage }) => {
  // Load initial state from localStorage, default to collapsed (true)
  const storageKey = `menu-section-${title.toLowerCase().replace(/\s+/g, '-')}`;
  const [isCollapsed, setIsCollapsed] = React.useState(() => {
    const saved = localStorage.getItem(storageKey);
    return saved !== null ? saved === 'true' : true; // Default to collapsed
  });

  // Save state to localStorage whenever it changes
  const handleToggle = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem(storageKey, String(newState));
  };

  return (
    <div>
      <button
        onClick={handleToggle}
        className={`
          w-full flex items-center justify-between mb-4
          text-xs font-medium uppercase tracking-wider
          ${isDarkMode ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-500'}
          transition-colors duration-200
        `}
      >
        <span>{title}</span>
        <span className={`text-lg transform transition-transform duration-200 ${isCollapsed ? 'rotate-0' : 'rotate-90'}`}>
          ›
        </span>
      </button>
      <div
        className={`space-y-1 overflow-hidden transition-all duration-300 ${
          isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'
        }`}
      >
        {items.map(item => {
          const isActive = isCurrentPage(item.id, currentPage);

          return (
            <button
              key={item.id}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAction(item.id);
              }}
              className={`
                block w-full text-left py-3 text-base transition-all duration-200
                border-b border-transparent hover:border-current
                ${item.danger
                  ? 'text-red-500 hover:text-red-400'
                  : isActive
                    ? isDarkMode ? 'text-white font-medium border-gray-600' : 'text-black font-medium border-gray-400'
                    : isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-black'
                }
              `}
            >
              {item.label}
              {isActive && (
                <span className={`ml-2 text-xl ${
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
};
