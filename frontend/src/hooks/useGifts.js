// frontend/src/hooks/useGifts.js
// Domain-specific hook for gift budget management

import { useState, useEffect, useCallback } from 'react';

import { apiService } from 'utils/apiService';
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

  const loadGiftData = useCallback(async () => {
    try {
      const data = await apiService.loadGiftData();
      setGiftData(data);
      return data;
    } catch (err) {
      console.error('Error loading gift data:', err);
      setError(`Failed to load gift data: ${err.message}`);
      return null;
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await loadGiftData();
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
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
      // Sum all per-occasion budgets for this person
      const budgets = person.budgets || {};
      const personTotal = Object.values(budgets).reduce(
        (personSum, amount) => Currency.add(personSum, amount || 0),
        0
      );
      return Currency.add(sum, personTotal);
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
  const addPerson = useCallback(async (person) => {
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

      await apiService.saveGiftData(updatedData);
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
  const updatePerson = useCallback(async (personId, updates) => {
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
      await apiService.saveGiftData(updatedData);
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
  const deletePerson = useCallback(async (personId) => {
    // Optimistic delete
    const previousData = { ...giftData };
    const updatedPeople = giftData.people.filter(person => person.id !== personId);

    const updatedData = {
      ...giftData,
      people: updatedPeople
    };
    setGiftData(updatedData);

    try {
      await apiService.saveGiftData(updatedData);
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
  // GIFT MANAGEMENT (from expenses)
  // ============================================

  /**
   * Add a gift from an expense
   * @param {Object} gift - Gift data from expense
   * @returns {Object} Result with success status and message
   */
  const addGiftFromExpense = useCallback(async (gift) => {
    try {
      const gifts = giftData?.gifts || [];

      // Check if gift already exists by expenseId
      const existingGift = gifts.find(g => g.expenseId === gift.expenseId);
      if (existingGift) {
        return {
          success: false,
          skipped: true,
          message: 'Gift already imported'
        };
      }

      const newGift = {
        id: gift.id || Date.now().toString(),
        expenseId: gift.expenseId,
        description: gift.description,
        cost: gift.cost,
        purchasedAt: gift.purchasedAt || new Date().toISOString(),
        assignedTo: [] // Will be assigned later
      };

      const updatedGifts = [...gifts, newGift];

      const updatedData = {
        ...giftData,
        gifts: updatedGifts
      };

      await apiService.saveGiftData(updatedData);
      setGiftData(updatedData);
      return {
        success: true,
        skipped: false,
        message: 'Gift imported successfully'
      };
    } catch (err) {
      console.error('Error adding gift:', err);
      setError(`Failed to add gift: ${err.message}`);
      return {
        success: false,
        skipped: false,
        message: err.message
      };
    }
  }, [giftData]);

  /**
   * Assign gift to person(s) and occasion(s)
   * @param {string} giftId - Gift ID
   * @param {Array} assignments - Array of {personId, occasionId, amount}
   * @returns {boolean} Success status
   */
  const assignGift = useCallback(async (giftId, assignments) => {
    try {
      const gifts = giftData?.gifts || [];
      const updatedGifts = gifts.map(gift => {
        if (gift.id === giftId) {
          return {
            ...gift,
            assignedTo: assignments
          };
        }
        return gift;
      });

      const updatedData = {
        ...giftData,
        gifts: updatedGifts
      };

      await apiService.saveGiftData(updatedData);
      setGiftData(updatedData);
      return true;
    } catch (err) {
      console.error('Error assigning gift:', err);
      setError(`Failed to assign gift: ${err.message}`);
      return false;
    }
  }, [giftData]);

  /**
   * Delete a gift
   * @param {string} giftId - Gift ID
   * @returns {boolean} Success status
   */
  const deleteGift = useCallback(async (giftId) => {
    try {
      const gifts = giftData?.gifts || [];
      const updatedGifts = gifts.filter(g => g.id !== giftId);

      const updatedData = {
        ...giftData,
        gifts: updatedGifts
      };

      await apiService.saveGiftData(updatedData);
      setGiftData(updatedData);
      return true;
    } catch (err) {
      console.error('Error deleting gift:', err);
      setError(`Failed to delete gift: ${err.message}`);
      return false;
    }
  }, [giftData]);

  /**
   * Get gifts assigned to a person
   * @param {string} personId - Person ID
   * @param {string} occasionId - Optional occasion filter
   * @returns {Array} Gifts assigned to the person
   */
  const getGiftsForPerson = useCallback((personId, occasionId = null) => {
    const gifts = giftData?.gifts || [];
    return gifts.filter(gift => {
      if (!gift.assignedTo || gift.assignedTo.length === 0) return false;

      return gift.assignedTo.some(assignment => {
        if (occasionId) {
          return assignment.personId === personId && assignment.occasionId === occasionId;
        }
        return assignment.personId === personId;
      });
    });
  }, [giftData]);

  /**
   * Get unassigned gifts
   * @returns {Array} Gifts not assigned to anyone
   */
  const getUnassignedGifts = useCallback(() => {
    const gifts = giftData?.gifts || [];
    return gifts.filter(gift => !gift.assignedTo || gift.assignedTo.length === 0);
  }, [giftData]);

  /**
   * Calculate spent amount for a person
   * @param {string} personId - Person ID
   * @param {string} occasionId - Optional occasion filter
   * @returns {number} Total spent on gifts for person
   */
  const calculateSpentForPerson = useCallback((personId, occasionId = null) => {
    const gifts = getGiftsForPerson(personId, occasionId);

    return gifts.reduce((sum, gift) => {
      const assignments = gift.assignedTo.filter(a => {
        if (occasionId) {
          return a.personId === personId && a.occasionId === occasionId;
        }
        return a.personId === personId;
      });

      const personAmount = assignments.reduce((total, a) => Currency.add(total, a.amount || 0), 0);
      return Currency.add(sum, personAmount);
    }, 0);
  }, [getGiftsForPerson]);

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
    gifts: giftData?.gifts || [],
    isLoading,
    error,
    clearError,

    // Calculations
    calculateTotalBudget,
    calculateTotalSpent,
    calculateRemainingBudget,
    getBudgetSummary,
    calculateSpentForPerson,

    // Person CRUD
    addPerson,
    updatePerson,
    deletePerson,

    // Gift CRUD (new flow)
    addGiftFromExpense,
    assignGift,
    deleteGift,
    getGiftsForPerson,
    getUnassignedGifts,

    // Queries
    getPerson,
    getAllPeople,

    // Reload
    reload: loadGiftData
  };
};
