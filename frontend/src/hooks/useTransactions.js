// frontend/src/hooks/useTransactions.js
// Domain-specific hook for transaction management

import { useState, useEffect, useCallback } from 'react';
import { dataManager } from 'utils/dataManager';
import { Currency } from 'utils/currency';

/**
 * Custom hook for managing transactions
 * Provides CRUD operations, filtering, and summary calculations
 *
 * @returns {Object} Transaction state and management functions
 */
export const useTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // ============================================
  // LOAD DATA
  // ============================================

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

  useEffect(() => {
    setIsLoading(true);
    loadTransactions();
    setIsLoading(false);
  }, [loadTransactions]);

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  /**
   * Add a new transaction
   * @param {Object} transaction - Transaction to add
   * @returns {boolean} Success status
   */
  const addTransaction = useCallback((transaction) => {
    try {
      const newTransaction = {
        ...transaction,
        id: transaction.id || Date.now().toString(),
        importedAt: transaction.importedAt || new Date().toISOString()
      };

      const updatedTransactions = [...transactions, newTransaction];
      dataManager.saveTransactions(updatedTransactions);
      setTransactions(updatedTransactions);
      return true;
    } catch (err) {
      console.error('Error adding transaction:', err);
      setError(`Failed to add transaction: ${err.message}`);
      return false;
    }
  }, [transactions]);

  /**
   * Add multiple transactions at once (bulk import)
   * @param {Array} newTransactions - Transactions to add
   * @returns {boolean} Success status
   */
  const addTransactions = useCallback((newTransactions) => {
    try {
      const timestampedTransactions = newTransactions.map((txn, index) => ({
        ...txn,
        id: txn.id || `${Date.now()}-${index}`,
        importedAt: txn.importedAt || new Date().toISOString()
      }));

      const updatedTransactions = [...transactions, ...timestampedTransactions];
      dataManager.saveTransactions(updatedTransactions);
      setTransactions(updatedTransactions);
      return true;
    } catch (err) {
      console.error('Error adding transactions:', err);
      setError(`Failed to add transactions: ${err.message}`);
      return false;
    }
  }, [transactions]);

  /**
   * Update a transaction
   * @param {string} id - Transaction ID
   * @param {Object} updates - Fields to update
   * @returns {boolean} Success status
   */
  const updateTransaction = useCallback((id, updates) => {
    // Optimistic update
    const previousTransactions = [...transactions];
    const updatedTransactions = transactions.map(txn =>
      txn.id === id ? { ...txn, ...updates } : txn
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
   * Delete a transaction
   * @param {string} id - Transaction ID
   * @returns {boolean} Success status
   */
  const deleteTransaction = useCallback((id) => {
    // Optimistic delete
    const previousTransactions = [...transactions];
    const updatedTransactions = transactions.filter(txn => txn.id !== id);
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
   * Delete multiple transactions
   * @param {Array<string>} ids - Transaction IDs to delete
   * @returns {boolean} Success status
   */
  const deleteTransactions = useCallback((ids) => {
    // Optimistic delete
    const previousTransactions = [...transactions];
    const idsSet = new Set(ids);
    const updatedTransactions = transactions.filter(txn => !idsSet.has(txn.id));
    setTransactions(updatedTransactions);

    try {
      dataManager.saveTransactions(updatedTransactions);
      return true;
    } catch (err) {
      console.error('Error deleting transactions:', err);
      setError(`Failed to delete transactions: ${err.message}`);
      // Rollback on error
      setTransactions(previousTransactions);
      return false;
    }
  }, [transactions]);

  // ============================================
  // FILTERING
  // ============================================

  /**
   * Filter transactions by date range
   * @param {Date|string} startDate - Start date
   * @param {Date|string} endDate - End date
   * @returns {Array} Filtered transactions
   */
  const filterByDateRange = useCallback((startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    return transactions.filter(txn => {
      const txnDate = new Date(txn.date);
      return txnDate >= start && txnDate <= end;
    });
  }, [transactions]);

  /**
   * Filter transactions by category
   * @param {string} category - Category name
   * @returns {Array} Filtered transactions
   */
  const filterByCategory = useCallback((category) => {
    return transactions.filter(txn =>
      txn.category?.toLowerCase() === category.toLowerCase()
    );
  }, [transactions]);

  /**
   * Filter transactions by minimum amount
   * @param {number} minAmount - Minimum amount
   * @returns {Array} Filtered transactions
   */
  const filterByMinAmount = useCallback((minAmount) => {
    return transactions.filter(txn => {
      const amount = Math.abs(txn.amount || 0);
      return Currency.compare(amount, minAmount) >= 0;
    });
  }, [transactions]);

  /**
   * Filter transactions by type (income vs expense)
   * @param {string} type - 'income' or 'expense'
   * @returns {Array} Filtered transactions
   */
  const filterByType = useCallback((type) => {
    return transactions.filter(txn => {
      const amount = txn.amount || 0;
      if (type === 'income') {
        return Currency.compare(amount, 0) > 0;
      } else if (type === 'expense') {
        return Currency.compare(amount, 0) < 0;
      }
      return true;
    });
  }, [transactions]);

  /**
   * Advanced filter with multiple criteria
   * @param {Object} filters - Filter criteria
   * @returns {Array} Filtered transactions
   */
  const filterTransactions = useCallback((filters = {}) => {
    let filtered = [...transactions];

    if (filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);
      filtered = filtered.filter(txn => {
        const txnDate = new Date(txn.date);
        return txnDate >= start && txnDate <= end;
      });
    }

    if (filters.category) {
      filtered = filtered.filter(txn =>
        txn.category?.toLowerCase() === filters.category.toLowerCase()
      );
    }

    if (filters.minAmount !== undefined) {
      filtered = filtered.filter(txn => {
        const amount = Math.abs(txn.amount || 0);
        return Currency.compare(amount, filters.minAmount) >= 0;
      });
    }

    if (filters.maxAmount !== undefined) {
      filtered = filtered.filter(txn => {
        const amount = Math.abs(txn.amount || 0);
        return Currency.compare(amount, filters.maxAmount) <= 0;
      });
    }

    if (filters.type) {
      const amount = filters.type === 'income' ? 0 : 0;
      filtered = filtered.filter(txn => {
        const txnAmount = txn.amount || 0;
        if (filters.type === 'income') {
          return Currency.compare(txnAmount, 0) > 0;
        } else if (filters.type === 'expense') {
          return Currency.compare(txnAmount, 0) < 0;
        }
        return true;
      });
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(txn =>
        txn.description?.toLowerCase().includes(searchLower) ||
        txn.category?.toLowerCase().includes(searchLower) ||
        txn.merchant?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [transactions]);

  // ============================================
  // CALCULATIONS
  // ============================================

  /**
   * Calculate total for filtered transactions
   * @param {Array} txns - Transactions to sum
   * @returns {number} Total amount
   */
  const calculateTotal = useCallback((txns = transactions) => {
    return txns.reduce((sum, txn) =>
      Currency.add(sum, txn.amount || 0), 0
    );
  }, [transactions]);

  /**
   * Calculate income total
   * @param {Array} txns - Transactions to analyze
   * @returns {number} Total income
   */
  const calculateIncome = useCallback((txns = transactions) => {
    return txns
      .filter(txn => Currency.compare(txn.amount || 0, 0) > 0)
      .reduce((sum, txn) => Currency.add(sum, txn.amount), 0);
  }, [transactions]);

  /**
   * Calculate expense total
   * @param {Array} txns - Transactions to analyze
   * @returns {number} Total expenses (positive number)
   */
  const calculateExpenses = useCallback((txns = transactions) => {
    return txns
      .filter(txn => Currency.compare(txn.amount || 0, 0) < 0)
      .reduce((sum, txn) => Currency.add(sum, Math.abs(txn.amount)), 0);
  }, [transactions]);

  /**
   * Get summary statistics
   * @param {Array} txns - Transactions to analyze
   * @returns {Object} Summary stats
   */
  const getSummary = useCallback((txns = transactions) => {
    const income = calculateIncome(txns);
    const expenses = calculateExpenses(txns);
    const net = Currency.subtract(income, expenses);

    return {
      totalTransactions: txns.length,
      income,
      expenses,
      net,
      averageTransaction: txns.length > 0
        ? Currency.divide(calculateTotal(txns), txns.length)
        : 0
    };
  }, [transactions, calculateIncome, calculateExpenses, calculateTotal]);

  /**
   * Group transactions by category
   * @param {Array} txns - Transactions to group
   * @returns {Object} Transactions grouped by category
   */
  const groupByCategory = useCallback((txns = transactions) => {
    const grouped = {};

    txns.forEach(txn => {
      const category = txn.category || 'Uncategorized';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(txn);
    });

    return grouped;
  }, [transactions]);

  /**
   * Get category totals
   * @param {Array} txns - Transactions to analyze
   * @returns {Object} Category totals
   */
  const getCategoryTotals = useCallback((txns = transactions) => {
    const grouped = groupByCategory(txns);
    const totals = {};

    Object.keys(grouped).forEach(category => {
      totals[category] = calculateTotal(grouped[category]);
    });

    return totals;
  }, [transactions, groupByCategory, calculateTotal]);

  // ============================================
  // QUERIES
  // ============================================

  /**
   * Get transaction by ID
   * @param {string} id - Transaction ID
   * @returns {Object|null} Transaction
   */
  const getTransaction = useCallback((id) => {
    return transactions.find(txn => txn.id === id) || null;
  }, [transactions]);

  /**
   * Get all transactions
   * @returns {Array} All transactions
   */
  const getAllTransactions = useCallback(() => {
    return [...transactions];
  }, [transactions]);

  /**
   * Get recent transactions
   * @param {number} count - Number of transactions to return
   * @returns {Array} Recent transactions
   */
  const getRecentTransactions = useCallback((count = 10) => {
    return [...transactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, count);
  }, [transactions]);

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
    transactions,
    isLoading,
    error,
    clearError,

    // CRUD
    addTransaction,
    addTransactions,
    updateTransaction,
    deleteTransaction,
    deleteTransactions,

    // Filtering
    filterByDateRange,
    filterByCategory,
    filterByMinAmount,
    filterByType,
    filterTransactions,

    // Calculations
    calculateTotal,
    calculateIncome,
    calculateExpenses,
    getSummary,
    groupByCategory,
    getCategoryTotals,

    // Queries
    getTransaction,
    getAllTransactions,
    getRecentTransactions,

    // Reload
    reload: loadTransactions
  };
};
