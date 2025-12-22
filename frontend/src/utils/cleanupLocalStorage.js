// Cleanup utility to remove old localStorage data from pre-backend era
// This ensures users migrating from localStorage-based app to backend don't have stale data

const OLD_STORAGE_KEYS = [
  'financeTracker_userData',
  'financeTracker_transactions',
  'financeTracker_giftData',
  'financeTracker_settings',
  'financeTracker_version',
  'merchantMappings',
  'tally_categoryMappings',
  // Custom category keys (dynamic)
  'customCategories_expenses',
  'customCategories_savings',
  'customCategories_income',
  // CSV mapping preferences (these can stay but let's clean old ones)
  'csvColumnMappings',
  'defaultColumnMapping'
];

// Keys that should be KEPT (don't remove these)
const KEEP_KEYS = [
  'theme-mode'                     // User theme preference
];

/**
 * Clean up old localStorage data from pre-backend version
 * Run this once on app startup to ensure clean migration
 */
export function cleanupOldLocalStorage() {
  // Check if we've already done cleanup
  const cleanupDone = localStorage.getItem('tally_localStorage_cleaned');

  if (cleanupDone === 'v1') {
    // Already cleaned up, skip
    return;
  }

  console.log('[CLEANUP] Removing old localStorage data from pre-backend version...');

  let removedCount = 0;

  // Remove old keys
  OLD_STORAGE_KEYS.forEach(key => {
    if (localStorage.getItem(key) !== null) {
      localStorage.removeItem(key);
      removedCount++;
      console.log(`[CLEANUP] Removed: ${key}`);
    }
  });

  // Mark cleanup as done
  localStorage.setItem('tally_localStorage_cleaned', 'v1');

  if (removedCount > 0) {
    console.log(`[CLEANUP] ✓ Removed ${removedCount} old localStorage items`);
  } else {
    console.log('[CLEANUP] ✓ No old data to clean up');
  }
}

/**
 * Force cleanup (useful for debugging or manual cleanup)
 */
export function forceCleanupAllLocalStorage() {
  console.log('[CLEANUP] Force removing ALL localStorage data except theme...');

  const theme = localStorage.getItem('theme-mode');

  localStorage.clear();

  if (theme) {
    localStorage.setItem('theme-mode', theme);
  }

  localStorage.setItem('tally_localStorage_cleaned', 'v1');

  console.log('[CLEANUP] ✓ All old data cleared');
}

/**
 * Debug: List all current localStorage keys
 */
export function listLocalStorageKeys() {
  console.log('[DEBUG] Current localStorage keys:');
  Object.keys(localStorage).forEach(key => {
    const value = localStorage.getItem(key);
    const size = new Blob([value]).size;
    const isOld = OLD_STORAGE_KEYS.includes(key);
    const shouldKeep = KEEP_KEYS.includes(key);
    console.log(`  ${key}: ${size} bytes ${isOld ? '[OLD]' : ''} ${shouldKeep ? '[KEEP]' : ''}`);
  });
}
