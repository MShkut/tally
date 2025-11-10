// useNetworth hook - Net worth data management and calculations
import { useState, useEffect, useCallback } from 'react';
import { apiService } from 'utils/apiService';

export const useNetworth = () => {
  const [accounts, setAccounts] = useState([]);
  const [summary, setSummary] = useState({ assets: 0, liabilities: 0, netWorth: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Load all accounts
   */
  const loadAccounts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await apiService.getNetworthAccounts();
      setAccounts(result.data || []);
      return result.data;
    } catch (err) {
      console.error('Error loading net worth accounts:', err);
      setError(err.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Load summary data
   */
  const loadSummary = useCallback(async () => {
    try {
      setError(null);
      const result = await apiService.getNetworthSummary();
      setSummary(result.data || { assets: 0, liabilities: 0, netWorth: 0 });
      return result.data;
    } catch (err) {
      console.error('Error loading net worth summary:', err);
      setError(err.message);
      return { assets: 0, liabilities: 0, netWorth: 0 };
    }
  }, []);

  /**
   * Create account
   */
  const createAccount = useCallback(async (accountData) => {
    try {
      setError(null);
      const result = await apiService.createNetworthAccount(accountData);
      await loadAccounts(); // Refresh list
      await loadSummary(); // Refresh summary
      return result.data;
    } catch (err) {
      console.error('Error creating account:', err);
      setError(err.message);
      throw err;
    }
  }, [loadAccounts, loadSummary]);

  /**
   * Update account
   */
  const updateAccount = useCallback(async (accountId, updates) => {
    try {
      setError(null);
      const result = await apiService.updateNetworthAccount(accountId, updates);
      await loadAccounts();
      await loadSummary();
      return result.data;
    } catch (err) {
      console.error('Error updating account:', err);
      setError(err.message);
      throw err;
    }
  }, [loadAccounts, loadSummary]);

  /**
   * Delete account
   */
  const deleteAccount = useCallback(async (accountId) => {
    try {
      setError(null);
      await apiService.deleteNetworthAccount(accountId);
      await loadAccounts();
      await loadSummary();
      return true;
    } catch (err) {
      console.error('Error deleting account:', err);
      setError(err.message);
      throw err;
    }
  }, [loadAccounts, loadSummary]);

  /**
   * Create snapshot
   */
  const createSnapshot = useCallback(async (accountId, snapshotData) => {
    try {
      setError(null);
      const result = await apiService.createSnapshot(accountId, snapshotData);
      await loadSummary(); // Refresh summary
      return result.data;
    } catch (err) {
      console.error('Error creating snapshot:', err);
      setError(err.message);
      throw err;
    }
  }, [loadSummary]);

  /**
   * Batch update prices
   */
  const batchUpdatePrices = useCallback(async (updates) => {
    try {
      setError(null);
      const result = await apiService.batchUpdatePrices(updates);
      await loadSummary(); // Refresh summary
      return result.data;
    } catch (err) {
      console.error('Error updating prices:', err);
      setError(err.message);
      throw err;
    }
  }, [loadSummary]);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-load on mount
  useEffect(() => {
    loadAccounts();
    loadSummary();
  }, [loadAccounts, loadSummary]);

  return {
    // State
    accounts,
    summary,
    isLoading,
    error,

    // Actions
    createAccount,
    updateAccount,
    deleteAccount,
    createSnapshot,
    batchUpdatePrices,
    clearError,

    // Reload functions
    reloadAccounts: loadAccounts,
    reloadSummary: loadSummary
  };
};
