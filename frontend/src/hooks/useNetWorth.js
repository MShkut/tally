// frontend/src/hooks/useNetWorth.js
// Domain-specific hook for net worth tracking and calculations

import { useState, useEffect, useCallback } from 'react';
import { dataManager } from 'utils/dataManager';
import { Currency } from 'utils/currency';

/**
 * Custom hook for managing net worth items and calculations
 * Provides CRUD operations and automatic calculations
 *
 * @returns {Object} Net worth state and management functions
 */
export const useNetWorth = () => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // ============================================
  // LOAD DATA
  // ============================================

  const loadItems = useCallback(() => {
    try {
      const data = dataManager.loadNetWorthItems();
      setItems(data);
      return data;
    } catch (err) {
      console.error('Error loading net worth items:', err);
      setError(`Failed to load net worth items: ${err.message}`);
      return [];
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    loadItems();
    setIsLoading(false);
  }, [loadItems]);

  // ============================================
  // CALCULATIONS
  // ============================================

  /**
   * Calculate total assets
   * @returns {number} Total value of all asset items
   */
  const calculateTotalAssets = useCallback(() => {
    return items
      .filter(item => item.type === 'asset')
      .reduce((sum, item) => Currency.add(sum, item.amount || 0), 0);
  }, [items]);

  /**
   * Calculate total liabilities
   * @returns {number} Total value of all liability items
   */
  const calculateTotalLiabilities = useCallback(() => {
    return items
      .filter(item => item.type === 'liability')
      .reduce((sum, item) => Currency.add(sum, item.amount || 0), 0);
  }, [items]);

  /**
   * Calculate net worth (assets - liabilities)
   * @returns {number} Total net worth
   */
  const calculateNetWorth = useCallback(() => {
    const assets = calculateTotalAssets();
    const liabilities = calculateTotalLiabilities();
    return Currency.subtract(assets, liabilities);
  }, [calculateTotalAssets, calculateTotalLiabilities]);

  /**
   * Get calculated net worth data
   * @returns {Object} Net worth breakdown
   */
  const getNetWorthData = useCallback(() => {
    const totalAssets = calculateTotalAssets();
    const totalLiabilities = calculateTotalLiabilities();
    const netWorth = calculateNetWorth();

    return {
      totalAssets,
      totalLiabilities,
      netWorth,
      isPositive: Currency.compare(netWorth, 0) >= 0
    };
  }, [calculateTotalAssets, calculateTotalLiabilities, calculateNetWorth]);

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  /**
   * Add a new net worth item
   * @param {Object} item - Item to add
   * @returns {boolean} Success status
   */
  const addItem = useCallback((item) => {
    try {
      const newItem = {
        ...item,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };

      const updatedItems = [...items, newItem];
      dataManager.saveNetWorthItems(updatedItems);
      setItems(updatedItems);
      return true;
    } catch (err) {
      console.error('Error adding net worth item:', err);
      setError(`Failed to add item: ${err.message}`);
      return false;
    }
  }, [items]);

  /**
   * Update an existing net worth item
   * @param {string} itemId - Item ID
   * @param {Object} updates - Fields to update
   * @returns {boolean} Success status
   */
  const updateItem = useCallback((itemId, updates) => {
    // Optimistic update
    const previousItems = [...items];
    const updatedItems = items.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    );
    setItems(updatedItems);

    try {
      dataManager.saveNetWorthItems(updatedItems);
      return true;
    } catch (err) {
      console.error('Error updating net worth item:', err);
      setError(`Failed to update item: ${err.message}`);
      // Rollback on error
      setItems(previousItems);
      return false;
    }
  }, [items]);

  /**
   * Update item value and track history
   * @param {string} itemId - Item ID
   * @param {number} newValue - New value
   * @param {string} note - Optional note
   * @returns {boolean} Success status
   */
  const updateItemValue = useCallback((itemId, newValue, note = '') => {
    // Optimistic update
    const previousItems = [...items];
    const updatedItems = items.map(item =>
      item.id === itemId ? { ...item, amount: newValue } : item
    );
    setItems(updatedItems);

    try {
      dataManager.updateNetWorthItemValue(itemId, newValue, note);
      return true;
    } catch (err) {
      console.error('Error updating net worth item value:', err);
      setError(`Failed to update item value: ${err.message}`);
      // Rollback on error
      setItems(previousItems);
      return false;
    }
  }, [items]);

  /**
   * Delete a net worth item
   * @param {string} itemId - Item ID
   * @returns {boolean} Success status
   */
  const deleteItem = useCallback((itemId) => {
    // Optimistic delete
    const previousItems = [...items];
    const updatedItems = items.filter(item => item.id !== itemId);
    setItems(updatedItems);

    try {
      dataManager.deleteNetWorthItem(itemId);
      return true;
    } catch (err) {
      console.error('Error deleting net worth item:', err);
      setError(`Failed to delete item: ${err.message}`);
      // Rollback on error
      setItems(previousItems);
      return false;
    }
  }, [items]);

  // ============================================
  // FILTERING & SORTING
  // ============================================

  /**
   * Get items by type
   * @param {string} type - 'asset' or 'liability'
   * @returns {Array} Filtered items
   */
  const getItemsByType = useCallback((type) => {
    return items.filter(item => item.type === type);
  }, [items]);

  /**
   * Get assets
   * @returns {Array} All asset items
   */
  const getAssets = useCallback(() => {
    return getItemsByType('asset');
  }, [getItemsByType]);

  /**
   * Get liabilities
   * @returns {Array} All liability items
   */
  const getLiabilities = useCallback(() => {
    return getItemsByType('liability');
  }, [getItemsByType]);

  // ============================================
  // ERROR HANDLING
  // ============================================

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ============================================
  // RETURN HOOK API
  // ============================================

  return {
    // State
    items,
    isLoading,
    error,
    clearError,

    // Calculations
    calculateTotalAssets,
    calculateTotalLiabilities,
    calculateNetWorth,
    getNetWorthData,

    // CRUD
    addItem,
    updateItem,
    updateItemValue,
    deleteItem,

    // Filtering
    getAssets,
    getLiabilities,
    getItemsByType,

    // Reload
    reload: loadItems
  };
};
