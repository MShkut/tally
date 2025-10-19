// frontend/src/hooks/useGifts.js
// Domain-specific hook for gift budget management

import { useState, useEffect, useCallback } from 'react';
import { dataManager } from 'utils/dataManager';
import { Currency } from 'utils/currency';

/**
 * Custom hook for managing gift budgets and tracking
 * Provides CRUD operations and budget calculations
 *
 * @returns {Object} Gift data state and management functions
 */
export const useGifts = () => {
  const [giftData, setGiftData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // ============================================
  // LOAD DATA
  // ============================================

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

  useEffect(() => {
    setIsLoading(true);
    loadGiftData();
    setIsLoading(false);
  }, [loadGiftData]);

  // ============================================
  // CALCULATIONS
  // ============================================

  /**
   * Calculate total annual gift budget
   * @returns {number} Total budget for all people
   */
  const calculateTotalBudget = useCallback(() => {
    if (!giftData?.people) return 0;

    return giftData.people.reduce((sum, person) => {
      const annualBudget = person.annualBudget || 0;
      return Currency.add(sum, annualBudget);
    }, 0);
  }, [giftData]);

  /**
   * Calculate total spent across all people
   * @returns {number} Total amount spent
   */
  const calculateTotalSpent = useCallback(() => {
    if (!giftData?.people) return 0;

    return giftData.people.reduce((sum, person) => {
      const spent = person.spent || 0;
      return Currency.add(sum, spent);
    }, 0);
  }, [giftData]);

  /**
   * Calculate remaining budget
   * @returns {number} Total budget minus total spent
   */
  const calculateRemainingBudget = useCallback(() => {
    const total = calculateTotalBudget();
    const spent = calculateTotalSpent();
    return Currency.subtract(total, spent);
  }, [calculateTotalBudget, calculateTotalSpent]);

  /**
   * Get budget summary
   * @returns {Object} Budget breakdown
   */
  const getBudgetSummary = useCallback(() => {
    const totalBudget = calculateTotalBudget();
    const totalSpent = calculateTotalSpent();
    const remaining = calculateRemainingBudget();

    return {
      totalBudget,
      totalSpent,
      remaining,
      isOverBudget: Currency.compare(remaining, 0) < 0,
      percentageUsed: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
    };
  }, [calculateTotalBudget, calculateTotalSpent, calculateRemainingBudget]);

  // ============================================
  // PERSON MANAGEMENT
  // ============================================

  /**
   * Add a new person to gift list
   * @param {Object} person - Person data
   * @returns {boolean} Success status
   */
  const addPerson = useCallback((person) => {
    try {
      const newPerson = {
        ...person,
        id: Date.now().toString(),
        spent: 0,
        gifts: []
      };

      const people = giftData?.people || [];
      const updatedPeople = [...people, newPerson];

      const updatedData = {
        ...giftData,
        people: updatedPeople
      };

      dataManager.saveGiftData(updatedData);
      setGiftData(updatedData);
      return true;
    } catch (err) {
      console.error('Error adding person:', err);
      setError(`Failed to add person: ${err.message}`);
      return false;
    }
  }, [giftData]);

  /**
   * Update a person's information
   * @param {string} personId - Person ID
   * @param {Object} updates - Fields to update
   * @returns {boolean} Success status
   */
  const updatePerson = useCallback((personId, updates) => {
    // Optimistic update
    const previousData = { ...giftData };
    const updatedPeople = giftData.people.map(person =>
      person.id === personId ? { ...person, ...updates } : person
    );

    const updatedData = {
      ...giftData,
      people: updatedPeople
    };
    setGiftData(updatedData);

    try {
      dataManager.saveGiftData(updatedData);
      return true;
    } catch (err) {
      console.error('Error updating person:', err);
      setError(`Failed to update person: ${err.message}`);
      // Rollback on error
      setGiftData(previousData);
      return false;
    }
  }, [giftData]);

  /**
   * Delete a person from gift list
   * @param {string} personId - Person ID
   * @returns {boolean} Success status
   */
  const deletePerson = useCallback((personId) => {
    // Optimistic delete
    const previousData = { ...giftData };
    const updatedPeople = giftData.people.filter(person => person.id !== personId);

    const updatedData = {
      ...giftData,
      people: updatedPeople
    };
    setGiftData(updatedData);

    try {
      dataManager.saveGiftData(updatedData);
      return true;
    } catch (err) {
      console.error('Error deleting person:', err);
      setError(`Failed to delete person: ${err.message}`);
      // Rollback on error
      setGiftData(previousData);
      return false;
    }
  }, [giftData]);

  // ============================================
  // GIFT MANAGEMENT
  // ============================================

  /**
   * Add a gift for a person
   * @param {string} personId - Person ID
   * @param {Object} gift - Gift data
   * @returns {boolean} Success status
   */
  const addGift = useCallback((personId, gift) => {
    try {
      const newGift = {
        ...gift,
        id: Date.now().toString(),
        purchasedAt: new Date().toISOString()
      };

      const updatedPeople = giftData.people.map(person => {
        if (person.id === personId) {
          const gifts = person.gifts || [];
          const updatedGifts = [...gifts, newGift];
          const spent = updatedGifts.reduce((sum, g) => Currency.add(sum, g.cost || 0), 0);

          return {
            ...person,
            gifts: updatedGifts,
            spent
          };
        }
        return person;
      });

      const updatedData = {
        ...giftData,
        people: updatedPeople
      };

      dataManager.saveGiftData(updatedData);
      setGiftData(updatedData);
      return true;
    } catch (err) {
      console.error('Error adding gift:', err);
      setError(`Failed to add gift: ${err.message}`);
      return false;
    }
  }, [giftData]);

  /**
   * Delete a gift
   * @param {string} personId - Person ID
   * @param {string} giftId - Gift ID
   * @returns {boolean} Success status
   */
  const deleteGift = useCallback((personId, giftId) => {
    try {
      const updatedPeople = giftData.people.map(person => {
        if (person.id === personId) {
          const updatedGifts = person.gifts.filter(g => g.id !== giftId);
          const spent = updatedGifts.reduce((sum, g) => Currency.add(sum, g.cost || 0), 0);

          return {
            ...person,
            gifts: updatedGifts,
            spent
          };
        }
        return person;
      });

      const updatedData = {
        ...giftData,
        people: updatedPeople
      };

      dataManager.saveGiftData(updatedData);
      setGiftData(updatedData);
      return true;
    } catch (err) {
      console.error('Error deleting gift:', err);
      setError(`Failed to delete gift: ${err.message}`);
      return false;
    }
  }, [giftData]);

  // ============================================
  // QUERIES
  // ============================================

  /**
   * Get a person by ID
   * @param {string} personId - Person ID
   * @returns {Object|null} Person data
   */
  const getPerson = useCallback((personId) => {
    if (!giftData?.people) return null;
    return giftData.people.find(person => person.id === personId) || null;
  }, [giftData]);

  /**
   * Get all people
   * @returns {Array} All people
   */
  const getAllPeople = useCallback(() => {
    return giftData?.people || [];
  }, [giftData]);

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
    giftData,
    people: giftData?.people || [],
    isLoading,
    error,
    clearError,

    // Calculations
    calculateTotalBudget,
    calculateTotalSpent,
    calculateRemainingBudget,
    getBudgetSummary,

    // Person CRUD
    addPerson,
    updatePerson,
    deletePerson,

    // Gift CRUD
    addGift,
    deleteGift,

    // Queries
    getPerson,
    getAllPeople,

    // Reload
    reload: loadGiftData
  };
};
