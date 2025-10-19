// frontend/src/hooks/useDataManager.js
// React hook wrapper for dataManager with automatic state management

import { useState, useEffect, useCallback } from 'react';
import { dataManager } from 'utils/dataManager';

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
  const [giftData, setGiftData] = useState(null);
  const [netWorthItems, setNetWorthItems] = useState([]);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // ============================================
  // LOAD FUNCTIONS
  // ============================================

  /**
   * Load user data (onboarding/budget data)
   */
  const loadUserData = useCallback(() => {
    try {
      const data = dataManager.loadUserData();
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
  const loadTransactions = useCallback(() => {
    try {
      const data = dataManager.loadTransactions();
      setTransactions(data);
      return data;
    } catch (err) {
      console.error('Error loading transactions:', err);
      setError(`Failed to load transactions: ${err.message}`);
      return [];
    }
  }, []);

  /**
   * Load gift data
   */
  const loadGiftData = useCallback(() => {
    try {
      const data = dataManager.loadGiftData();
      setGiftData(data);
      return data;
    } catch (err) {
      console.error('Error loading gift data:', err);
      setError(`Failed to load gift data: ${err.message}`);
      return null;
    }
  }, []);

  /**
   * Load net worth items
   */
  const loadNetWorthItems = useCallback(() => {
    try {
      const data = dataManager.loadNetWorthItems();
      setNetWorthItems(data);
      return data;
    } catch (err) {
      console.error('Error loading net worth items:', err);
      setError(`Failed to load net worth items: ${err.message}`);
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
  const saveUserDataFn = useCallback((data) => {
    try {
      dataManager.saveUserData(data);
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
  const saveTransactionsFn = useCallback((txns) => {
    try {
      dataManager.saveTransactions(txns);
      setTransactions(txns);
      return true;
    } catch (err) {
      console.error('Error saving transactions:', err);
      setError(`Failed to save transactions: ${err.message}`);
      return false;
    }
  }, []);

  /**
   * Save gift data and update state
   * @param {Object} data - Gift data to save
   * @returns {boolean} Success status
   */
  const saveGiftDataFn = useCallback((data) => {
    try {
      dataManager.saveGiftData(data);
      setGiftData(data);
      return true;
    } catch (err) {
      console.error('Error saving gift data:', err);
      setError(`Failed to save gift data: ${err.message}`);
      return false;
    }
  }, []);

  /**
   * Save net worth items and update state
   * @param {Array} items - Net worth items to save
   * @returns {boolean} Success status
   */
  const saveNetWorthItemsFn = useCallback((items) => {
    try {
      dataManager.saveNetWorthItems(items);
      setNetWorthItems(items);
      return true;
    } catch (err) {
      console.error('Error saving net worth items:', err);
      setError(`Failed to save net worth items: ${err.message}`);
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
  const updateTransactionFn = useCallback((id, updates) => {
    // Optimistic update
    const previousTransactions = [...transactions];
    const updatedTransactions = transactions.map(t =>
      t.id === id ? { ...t, ...updates } : t
    );
    setTransactions(updatedTransactions);

    try {
      dataManager.updateTransaction(id, updates);
      return true;
    } catch (err) {
      console.error('Error updating transaction:', err);
      setError(`Failed to update transaction: ${err.message}`);
      // Rollback on error
      setTransactions(previousTransactions);
      return false;
    }
  }, [transactions]);

  /**
   * Update net worth item value
   * @param {string} itemId - Item ID
   * @param {number} newValue - New value
   * @param {string} note - Optional note
   * @returns {boolean} Success status
   */
  const updateNetWorthItemValueFn = useCallback((itemId, newValue, note = '') => {
    // Optimistic update
    const previousItems = [...netWorthItems];
    const updatedItems = netWorthItems.map(item =>
      item.id === itemId ? { ...item, amount: newValue } : item
    );
    setNetWorthItems(updatedItems);

    try {
      dataManager.updateNetWorthItemValue(itemId, newValue, note);
      return true;
    } catch (err) {
      console.error('Error updating net worth item:', err);
      setError(`Failed to update net worth item: ${err.message}`);
      // Rollback on error
      setNetWorthItems(previousItems);
      return false;
    }
  }, [netWorthItems]);

  // ============================================
  // DELETE FUNCTIONS (with optimistic updates)
  // ============================================

  /**
   * Delete a transaction
   * @param {string} id - Transaction ID
   * @returns {boolean} Success status
   */
  const deleteTransactionFn = useCallback((id) => {
    // Optimistic delete
    const previousTransactions = [...transactions];
    const updatedTransactions = transactions.filter(t => t.id !== id);
    setTransactions(updatedTransactions);

    try {
      dataManager.deleteTransaction(id);
      return true;
    } catch (err) {
      console.error('Error deleting transaction:', err);
      setError(`Failed to delete transaction: ${err.message}`);
      // Rollback on error
      setTransactions(previousTransactions);
      return false;
    }
  }, [transactions]);

  /**
   * Delete a net worth item
   * @param {string} itemId - Item ID
   * @returns {boolean} Success status
   */
  const deleteNetWorthItemFn = useCallback((itemId) => {
    // Optimistic delete
    const previousItems = [...netWorthItems];
    const updatedItems = netWorthItems.filter(item => item.id !== itemId);
    setNetWorthItems(updatedItems);

    try {
      dataManager.deleteNetWorthItem(itemId);
      return true;
    } catch (err) {
      console.error('Error deleting net worth item:', err);
      setError(`Failed to delete net worth item: ${err.message}`);
      // Rollback on error
      setNetWorthItems(previousItems);
      return false;
    }
  }, [netWorthItems]);

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
  // INITIAL DATA LOAD
  // ============================================

  useEffect(() => {
    setIsLoading(true);

    // Load all data on mount
    loadUserData();
    loadTransactions();
    loadGiftData();
    loadNetWorthItems();

    setIsLoading(false);
  }, [loadUserData, loadTransactions, loadGiftData, loadNetWorthItems]);

  // ============================================
  // RETURN HOOK API
  // ============================================

  return {
    // Data state
    userData,
    transactions,
    giftData,
    netWorthItems,

    // UI state
    isLoading,
    error,
    clearError,

    // Save functions
    saveUserData: saveUserDataFn,
    saveTransactions: saveTransactionsFn,
    saveGiftData: saveGiftDataFn,
    saveNetWorthItems: saveNetWorthItemsFn,

    // Update functions
    updateTransaction: updateTransactionFn,
    updateNetWorthItemValue: updateNetWorthItemValueFn,

    // Delete functions
    deleteTransaction: deleteTransactionFn,
    deleteNetWorthItem: deleteNetWorthItemFn,

    // Reload functions (for manual refresh)
    reloadUserData: loadUserData,
    reloadTransactions: loadTransactions,
    reloadGiftData: loadGiftData,
    reloadNetWorthItems: loadNetWorthItems
  };
};
