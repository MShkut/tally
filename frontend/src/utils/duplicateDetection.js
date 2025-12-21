// frontend/src/utils/duplicateDetection.js
// Utility for detecting duplicate transactions during import

/**
 * Check if two dates are within a specified number of days of each other
 * @param {string} date1 - ISO date string
 * @param {string} date2 - ISO date string
 * @param {number} dayRange - Number of days (±) to consider as match
 * @returns {boolean} True if dates are within range
 */
const datesWithinRange = (date1, date2, dayRange = 3) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffMs = Math.abs(d1 - d2);
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= dayRange;
};

/**
 * Check if two amounts are equal (accounting for floating point)
 * @param {number} amount1 - First amount
 * @param {number} amount2 - Second amount
 * @returns {boolean} True if amounts match
 */
const amountsMatch = (amount1, amount2) => {
  return Math.abs(amount1 - amount2) < 0.01; // Within 1 cent
};

/**
 * Check if two subcategories match
 * @param {string} sub1 - First subcategory
 * @param {string} sub2 - Second subcategory
 * @returns {boolean} True if subcategories match
 */
const subcategoriesMatch = (sub1, sub2) => {
  const normalize = (str) => (str || '').toLowerCase().trim();
  return normalize(sub1) === normalize(sub2);
};

/**
 * Find potential duplicate transactions
 *
 * A transaction is considered a duplicate if:
 * - Date is within ±3 days
 * - Amount is exactly the same
 * - Subcategory is the same
 *
 * @param {Array} newTransactions - Transactions to be imported
 * @param {Array} existingTransactions - Already imported transactions
 * @param {number} dayRange - Number of days (±) to check for date match (default: 3)
 * @returns {Array} Array of duplicate matches with details
 */
export const findDuplicates = (newTransactions, existingTransactions, dayRange = 3) => {
  const duplicates = [];

  newTransactions.forEach((newTxn) => {
    existingTransactions.forEach((existingTxn) => {
      // Check all three criteria
      const dateMatches = datesWithinRange(newTxn.date, existingTxn.date, dayRange);
      const amountMatches = amountsMatch(newTxn.amount, existingTxn.amount);
      const subcatMatches = subcategoriesMatch(newTxn.sub_category, existingTxn.sub_category);

      if (dateMatches && amountMatches && subcatMatches) {
        duplicates.push({
          newTransaction: newTxn,
          existingTransaction: existingTxn,
          matchReasons: {
            date: true,
            amount: true,
            subcategory: true
          }
        });
      }
    });
  });

  return duplicates;
};

/**
 * Find duplicate transactions within the same batch (internal duplicates)
 *
 * Checks for duplicates among transactions being imported together.
 * Useful for catching when the same transaction is added multiple times
 * in a single import operation.
 *
 * @param {Array} transactions - Transactions to check for internal duplicates
 * @param {number} dayRange - Number of days (±) to check for date match (default: 3)
 * @returns {Array} Array of duplicate matches with details
 */
export const findDuplicatesInBatch = (transactions, dayRange = 3) => {
  const duplicates = [];
  const seen = new Set();

  for (let i = 0; i < transactions.length; i++) {
    for (let j = i + 1; j < transactions.length; j++) {
      const txn1 = transactions[i];
      const txn2 = transactions[j];

      // Skip if we've already marked this pair
      const pairKey = `${i}-${j}`;
      if (seen.has(pairKey)) continue;

      // Check all three criteria
      const dateMatches = datesWithinRange(txn1.date, txn2.date, dayRange);
      const amountMatches = amountsMatch(txn1.amount, txn2.amount);
      const subcatMatches = subcategoriesMatch(txn1.sub_category, txn2.sub_category);

      if (dateMatches && amountMatches && subcatMatches) {
        duplicates.push({
          newTransaction: txn2, // Mark the second one as the duplicate
          existingTransaction: txn1, // First one is considered "existing"
          matchReasons: {
            date: true,
            amount: true,
            subcategory: true
          }
        });
        seen.add(pairKey);
      }
    }
  }

  return duplicates;
};

/**
 * Remove duplicate transactions from a list
 * @param {Array} newTransactions - Transactions to be imported
 * @param {Array} duplicates - Array of duplicate matches from findDuplicates()
 * @returns {Array} Transactions with duplicates removed
 */
export const removeDuplicates = (newTransactions, duplicates) => {
  const duplicateIds = new Set(duplicates.map(d => d.newTransaction.id));
  return newTransactions.filter(txn => !duplicateIds.has(txn.id));
};

/**
 * Get summary statistics about duplicates
 * @param {Array} duplicates - Array of duplicate matches
 * @returns {Object} Summary with count and total amount
 */
export const getDuplicateSummary = (duplicates) => {
  const count = duplicates.length;
  const totalAmount = duplicates.reduce((sum, dup) => sum + Math.abs(dup.newTransaction.amount), 0);

  return {
    count,
    totalAmount,
    hasIncome: duplicates.some(d => d.newTransaction.amount > 0),
    hasExpenses: duplicates.some(d => d.newTransaction.amount < 0)
  };
};
