// frontend/src/hooks/useDataManager.js
// React hook wrapper for apiService with automatic state management

import { useState, useEffect, useCallback } from 'react';
import { apiService } from 'utils/apiService';

/**
 * Custom hook for managing application data with React state
 * Provides automatic loading, error handling, and state updates
 *
 * @returns {Object} Data state and management functions
 */
export const useDataManager = () => {
  // Data state
  const [userData, setUserData] = useState(null);
  const [transactions, setTransactions] = useState([]);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // ============================================
  // LOAD FUNCTIONS
  // ============================================

  /**
   * Load user data (onboarding/budget data)
   */
  const loadUserData = useCallback(async () => {
    try {
      const data = await apiService.loadUserData();
      setUserData(data);
      return data;
    } catch (err) {
      console.error('Error loading user data:', err);
      setError(`Failed to load user data: ${err.message}`);
      return null;
    }
  }, []);

  /**
   * Load transactions
   */
  const loadTransactions = useCallback(async () => {
    try {
      const data = await apiService.loadTransactions();
      setTransactions(data);
      return data;
    } catch (err) {
      console.error('Error loading transactions:', err);
      setError(`Failed to load transactions: ${err.message}`);
      return [];
    }
  }, []);

  // ============================================
  // SAVE FUNCTIONS
  // ============================================

  /**
   * Save user data and update state
   * @param {Object} data - User data to save
   * @returns {boolean} Success status
   */
  const saveUserDataFn = useCallback(async (data) => {
    try {
      await apiService.saveUserData(data);
      setUserData(data);
      return true;
    } catch (err) {
      console.error('Error saving user data:', err);
      setError(`Failed to save user data: ${err.message}`);
      return false;
    }
  }, []);

  /**
   * Save transactions and update state
   * @param {Array} txns - Transactions to save
   * @returns {boolean} Success status
   */
  const saveTransactionsFn = useCallback(async (txns) => {
    try {
      await apiService.saveTransactions(txns);
      setTransactions(txns);
      return true;
    } catch (err) {
      console.error('Error saving transactions:', err);
      setError(`Failed to save transactions: ${err.message}`);
      return false;
    }
  }, []);

  // ============================================
  // UPDATE FUNCTIONS (with optimistic updates)
  // ============================================

  /**
   * Update a single transaction
   * @param {string} id - Transaction ID
   * @param {Object} updates - Fields to update
   * @returns {boolean} Success status
   */
  const updateTransactionFn = useCallback(async (id, updates) => {
    // Optimistic update
    const previousTransactions = [...transactions];
    const updatedTransactions = transactions.map(t =>
      t.id === id ? { ...t, ...updates } : t
    );
    setTransactions(updatedTransactions);

    try {
      // Note: apiService doesn't have updateTransaction, need to use saveTransactions
      await apiService.saveTransactions(updatedTransactions);
      return true;
    } catch (err) {
      console.error('Error updating transaction:', err);
      setError(`Failed to update transaction: ${err.message}`);
      // Rollback on error
      setTransactions(previousTransactions);
      return false;
    }
  }, [transactions]);


  // ============================================
  // DELETE FUNCTIONS (with optimistic updates)
  // ============================================

  /**
   * Delete a transaction
   * @param {string} id - Transaction ID
   * @returns {boolean} Success status
   */
  const deleteTransactionFn = useCallback(async (id) => {
    // Optimistic delete
    const previousTransactions = [...transactions];
    const updatedTransactions = transactions.filter(t => t.id !== id);
    setTransactions(updatedTransactions);

    try {
      await apiService.deleteTransaction(id);
      return true;
    } catch (err) {
      console.error('Error deleting transaction:', err);
      setError(`Failed to delete transaction: ${err.message}`);
      // Rollback on error
      setTransactions(previousTransactions);
      return false;
    }
  }, [transactions]);


  // ============================================
  // ERROR HANDLING
  // ============================================

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ============================================
  // MANUAL DATA LOADING
  // ============================================
  // Note: This hook no longer loads data automatically on mount.
  // Components should explicitly call the load functions they need.
  // This improves performance by avoiding unnecessary data fetching.

  // ============================================
  // RETURN HOOK API
  // ============================================

  return {
    // Data state
    userData,
    transactions,

    // UI state
    isLoading,
    error,
    clearError,

    // Save functions
    saveUserData: saveUserDataFn,
    saveTransactions: saveTransactionsFn,

    // Update functions
    updateTransaction: updateTransactionFn,

    // Delete functions
    deleteTransaction: deleteTransactionFn,

    // Reload functions (for manual refresh)
    reloadUserData: loadUserData,
    reloadTransactions: loadTransactions
  };
};
