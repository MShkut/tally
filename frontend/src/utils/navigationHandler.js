// frontend/src/utils/navigationHandler.js
// Universal Navigation Handler - Single source of truth for all menu navigation

import { dataManager } from './dataManager';

/**
 * Universal navigation handler for burger menu actions
 * @param {string} actionId - The menu action ID
 * @param {function} onNavigate - Navigation function from parent component
 * @param {function} onClose - Function to close the menu
 * @param {function} setShowResetConfirm - Function to show reset confirmation (optional)
 * @returns {boolean} - Returns true if action was handled, false if not implemented
 */
export const handleMenuAction = (actionId, onNavigate, onClose, setShowResetConfirm = null) => {
  // Close menu first for most actions, but not for reset-data
  if (actionId !== 'reset-data') {
    onClose();
  }
  
  switch (actionId) {
    // Overview Actions
    case 'dashboard':
      onNavigate('dashboard');
      return true;
      
    case 'networth':
      onNavigate('networth');
      return true;

    // Main Actions
    case 'import':
      onNavigate('import');
      return true;
      
    case 'gifts':
      onNavigate('gifts');
      return true;

    // Edit Actions
    case 'edit-income':
      onNavigate('edit-income');
      return true;
      
    case 'edit-savings':
      onNavigate('edit-savings');
      return true;
      
    case 'edit-expenses':
      onNavigate('edit-expenses');
      return true;
      
    case 'edit-networth':
      onNavigate('edit-networth');
      return true;

    // Period Management
    case 'plan-next-period':
      onNavigate('plan-next-period');
      return true;
      
    case 'start-next-period':
      onNavigate('onboarding');
      return true;

    // Data Management
    case 'export':
      handleDataExport();
      return true;

    case 'reset-data':
      if (setShowResetConfirm) {
        // If component has reset confirmation modal, show it
        setShowResetConfirm(true);
      } else {
        // Otherwise, confirm with browser alert
        if (window.confirm('Are you sure you want to reset all data? This cannot be undone.')) {
          handleDataReset(onNavigate);
        }
      }
      return true;

    // Auth actions
    case 'logout':
      // This will be handled by the component that has access to the onLogout handler
      // We return false to signal this needs to be handled externally
      return 'logout';

    // Unhandled actions
    default:
      console.warn(`Navigation action '${actionId}' not implemented`);
      return false;
  }
};

/**
 * Handle data export
 */
const handleDataExport = () => {
  try {
    const exportData = dataManager.exportData();
    
    // Create downloadable file
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    // Create download link
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tally-export-${new Date().toISOString().split('T')[0]}.json`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
    
    console.log('✅ Data exported successfully');
  } catch (error) {
    console.error('❌ Failed to export data:', error);
    alert('Failed to export data. Please try again.');
  }
};

/**
 * Handle data reset
 */
const handleDataReset = (onNavigate) => {
  try {
    dataManager.resetAllData();
    console.log('✅ All data reset successfully');
    
    // Force reload to ensure clean state
    window.location.reload();
  } catch (error) {
    console.error('❌ Failed to reset data:', error);
    alert('Failed to reset data. Please try again.');
  }
};

/**
 * Get available menu items based on user data
 * This centralizes the logic for determining which menu items to show
 */
export const getMenuItems = () => {
  // Check if user has gifts category
  const userData = dataManager.loadUserData();
  const hasGiftsCategory = userData?.expenses?.expenseCategories?.some(
    cat => cat.name.toLowerCase() === 'gifts'
  ) || false;

  const overviewItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'networth', label: 'Net Worth' }
  ];

  const actionsItems = [
    { id: 'import', label: 'Transaction Import' },
    { id: 'edit-income', label: 'Edit Income Sources' },
    { id: 'edit-savings', label: 'Edit Savings Plan' },
    { id: 'edit-expenses', label: 'Edit Expenses' },
    { id: 'plan-next-period', label: 'Plan Next Period' }
  ];

  // Add gift management if category exists
  if (hasGiftsCategory) {
    actionsItems.splice(1, 0, {
      id: 'gifts',
      label: 'Gift Management'
    });
  }

  const toolsItems = [
    // Empty for now - future expansion
  ];

  const settingsItems = [
    { id: 'export', label: 'Export Data' },
    { id: 'logout', label: 'Logout' },
    { id: 'reset-data', label: 'Reset All Data', danger: true }
  ];

  return {
    overview: overviewItems,
    actions: actionsItems,
    tools: toolsItems,
    settings: settingsItems
  };
};

/**
 * Check if current page matches menu item
 */
export const isCurrentPage = (itemId, currentPage) => {
  return currentPage === itemId;
};
