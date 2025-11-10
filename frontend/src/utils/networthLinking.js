// networthLinking.js - Utilities for linking budget transactions to net worth accounts
import { apiService } from './apiService';

/**
 * Handle net worth account updates when a transaction is created or updated
 * @param {Object} transaction - The transaction that was created/updated
 * @param {string} context - 'savings' or 'expenses' context
 */
export const handleTransactionForNetworth = async (transaction, context) => {
  try {
    // Get all net worth accounts
    const accounts = await apiService.getNetworthAccounts();

    // Find account linked to this transaction's category
    const linkedAccount = accounts.find(account =>
      account.linked_budget_category === transaction.category &&
      account.linked_budget_context === context &&
      account.tracking_method === 'simple' // Only auto-link simple accounts
    );

    if (!linkedAccount) {
      return; // No linked account found
    }

    // Create or update snapshot for the transaction date
    const amount = Math.abs(transaction.amount || 0);

    // Get existing snapshots to calculate new balance
    const snapshots = await apiService.getAccountSnapshots(linkedAccount.id);
    const existingSnapshot = snapshots.find(s => s.date === transaction.date);

    let newBalance;
    if (linkedAccount.type === 'asset') {
      // For assets (savings), positive transactions increase balance
      newBalance = existingSnapshot
        ? existingSnapshot.balance + amount
        : amount;
    } else {
      // For liabilities (expenses), positive amounts increase debt
      newBalance = existingSnapshot
        ? existingSnapshot.balance + amount
        : amount;
    }

    // Create/update snapshot
    await apiService.createSnapshot({
      account_id: linkedAccount.id,
      date: transaction.date,
      balance: newBalance,
      source: 'transaction'
    });

    console.log(`Updated net worth account "${linkedAccount.name}" from transaction`);
  } catch (error) {
    console.error('Error handling transaction for net worth:', error);
    // Don't throw - transaction should succeed even if net worth update fails
  }
};

/**
 * Handle net worth account updates when a transaction is deleted
 * @param {Object} transaction - The transaction that was deleted
 * @param {string} context - 'savings' or 'expenses' context
 */
export const handleTransactionDeletionForNetworth = async (transaction, context) => {
  try {
    // Get all net worth accounts
    const accounts = await apiService.getNetworthAccounts();

    // Find account linked to this transaction's category
    const linkedAccount = accounts.find(account =>
      account.linked_budget_category === transaction.category &&
      account.linked_budget_context === context &&
      account.tracking_method === 'simple'
    );

    if (!linkedAccount) {
      return; // No linked account found
    }

    // Get existing snapshots
    const snapshots = await apiService.getAccountSnapshots(linkedAccount.id);
    const existingSnapshot = snapshots.find(s => s.date === transaction.date);

    if (!existingSnapshot) {
      return; // No snapshot to update
    }

    // Subtract the transaction amount from the snapshot
    const amount = Math.abs(transaction.amount || 0);
    const newBalance = existingSnapshot.balance - amount;

    if (newBalance <= 0) {
      // If balance becomes zero or negative, we might want to delete the snapshot
      // For now, we'll set it to 0
      await apiService.createSnapshot({
        account_id: linkedAccount.id,
        date: transaction.date,
        balance: Math.max(0, newBalance),
        source: 'transaction'
      });
    } else {
      await apiService.createSnapshot({
        account_id: linkedAccount.id,
        date: transaction.date,
        balance: newBalance,
        source: 'transaction'
      });
    }

    console.log(`Updated net worth account "${linkedAccount.name}" after transaction deletion`);
  } catch (error) {
    console.error('Error handling transaction deletion for net worth:', error);
    // Don't throw - transaction deletion should succeed even if net worth update fails
  }
};

/**
 * Determine the context (savings/expenses) based on transaction amount and category
 * @param {Object} transaction - The transaction
 * @param {Array} categories - Budget categories
 * @returns {string|null} Context ('savings' or 'expenses') or null if not found
 */
export const getTransactionContext = (transaction, categories) => {
  if (!transaction.category) return null;

  const category = categories.find(c => c.category === transaction.category);
  return category ? category.context : null;
};
