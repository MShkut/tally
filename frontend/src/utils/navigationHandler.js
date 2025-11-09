// frontend/src/utils/navigationHandler.js
// Universal Navigation Handler - Single source of truth for all menu navigation

import { apiService } from './apiService';

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

    // Main Actions
    case 'import':
      onNavigate('import');
      return true;

    case 'alltransactions':
      onNavigate('alltransactions');
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

    // Period Management
    case 'plan-next-period':
      onNavigate('plan-next-period');
      return true;
      
    case 'start-next-period':
      onNavigate('onboarding');
      return true;

    // Settings & Data Management
    case 'settings':
      onNavigate('settings');
      return true;

    case 'save':
      handleDataSave();
      return true;

    case 'import-data':
      // This will be handled by the component that has the import modal
      // We return 'import-data' to signal it needs external handling
      return 'import-data';

    case 'export':
      handleDataExport();
      return true;

    case 'change-password':
      // This will be handled by the component that has the change password modal
      // We return 'change-password' to signal it needs external handling
      return 'change-password';

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
      if (import.meta.env.DEV) {
        console.warn(`Navigation action '${actionId}' not implemented`);
      }
      return false;
  }
};

/**
 * Handle manual data save
 * In backend mode, all saves happen automatically via API calls
 * This function is now a no-op since data is always persisted to backend
 */
const handleDataSave = async () => {
  try {
    // With backend API, all data is saved automatically on every change
    // No manual save needed, but we can still show a confirmation
    alert('✓ All data is automatically saved to the backend');
    if (import.meta.env.DEV) {
      console.log('✅ Data auto-saved via backend API');
    }
  } catch (error) {
    console.error('❌ Save confirmation failed:', error);
    alert('Data is automatically saved. No manual action needed.');
  }
};

/**
 * Handle data export
 */
const handleDataExport = async () => {
  try {
    console.log('[EXPORT] Loading all data from backend...');

    // Load all data from backend
    const [userData, transactions, settings] = await Promise.all([
      apiService.loadUserData().catch(() => null),
      apiService.loadTransactions().catch(() => []),
      apiService.loadSettings().catch(() => null)
    ]);

    // Build export object
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      userData,
      transactions,
      settings
    };

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

    console.log('[EXPORT] ✅ Data exported successfully');
  } catch (error) {
    console.error('[EXPORT] ❌ Failed to export data:', error);
    alert('Failed to export data. Please try again.');
  }
};

/**
 * Handle data reset
 * Note: Backend reset requires backend API endpoint support
 * For now, we'll logout and show message to re-register
 */
const handleDataReset = async (onNavigate) => {
  try {
    console.log('[RESET] Logging out and clearing session...');

    // Logout from backend (clears session)
    await apiService.logout();

    if (import.meta.env.DEV) {
      console.log('✅ Logged out successfully');
    }

    // Show message that user needs to re-register to reset data
    alert('✓ Logged out. Register again to start fresh with new data.');

    // Force reload to login/register screen
    window.location.href = '/';
  } catch (error) {
    console.error('❌ Failed to reset data:', error);
    alert('Failed to reset. Please try logging out manually.');
  }
};

/**
 * Get available menu items based on user data
 * This centralizes the logic for determining which menu items to show
 */
export const getMenuItems = async () => {
  try {
    const dashboardItems = [
      { id: 'dashboard', label: 'Overview' }
    ];

    const yourPlanItems = [
      { id: 'plan-next-period', label: 'Plan Next Period' },
      { id: 'edit-income', label: 'Edit Income Sources' },
      { id: 'edit-savings', label: 'Edit Savings Plan' },
      { id: 'edit-expenses', label: 'Edit Expenses' }
    ];

    const actionsItems = [
      { id: 'import', label: 'Import Transactions' },
      { id: 'alltransactions', label: 'View and Edit Transactions' }
    ];

    const settingsItems = [
      { id: 'settings', label: 'Settings' },
      { id: 'logout', label: 'Logout' }
    ];

    return {
      dashboard: dashboardItems,
      yourPlan: yourPlanItems,
      actions: actionsItems,
      settings: settingsItems
    };
  } catch (error) {
    console.error('[MENU] Failed to load menu items:', error);
    // Return default menu if loading fails
    return {
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
    };
  }
};

/**
 * Check if current page matches menu item
 */
export const isCurrentPage = (itemId, currentPage) => {
  return currentPage === itemId;
};
