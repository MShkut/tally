/**
 * useBudgetMath Hook - Centralized Budget Calculation Logic
 *
 * This custom React hook provides a unified API for all budget-related calculations
 * throughout the Tally application. It was created to fix inconsistent math across
 * components and ensure accurate currency handling.
 *
 * ## Architecture
 *
 * The hook delegates core calculations to two modules:
 * - `utils/budgetCalculations.js` - Pure budget math functions
 * - `utils/currency.js` - Currency-safe arithmetic (handles floating point precision)
 *
 * ## Key Features
 *
 * 1. **Income Calculations**
 *    - Monthly, yearly, and period-based income totals
 *    - Actual income from transactions
 *    - Multi-frequency support (monthly, biweekly, yearly, etc.)
 *
 * 2. **Expense Calculations**
 *    - Monthly and period expense totals
 *    - Actual expenses from categorized transactions
 *    - Category-based expense tracking
 *
 * 3. **Savings Calculations**
 *    - Monthly and period savings targets
 *    - Actual savings from transactions
 *    - Keyword-based savings detection
 *
 * 4. **Performance Metrics**
 *    - Planned vs. actual comparisons
 *    - Month and period views
 *    - Category-level spending analysis
 *
 * 5. **Transaction Filtering & Matching**
 *    - Period-based filtering (month or custom period)
 *    - Smart category matching (handles string and object formats)
 *    - Income source and savings goal matching
 *
 * ## Currency Precision
 *
 * All calculations use the Currency utility to avoid floating-point errors.
 * Never use raw JavaScript arithmetic (+ - * /) with money values.
 *
 * Example:
 * ```js
 * // ❌ WRONG - floating point errors
 * const total = 10.1 + 20.2; // 30.299999999999997
 *
 * // ✅ CORRECT - precise decimal arithmetic
 * const total = Currency.add(10.1, 20.2); // 30.3
 * ```
 *
 * ## Usage
 *
 * ```jsx
 * const Dashboard = () => {
 *   const {
 *     calculateMonthlyIncome,
 *     calculatePerformanceData,
 *     calculateCategoryTotals
 *   } = useBudgetMath();
 *
 *   const monthlyIncome = calculateMonthlyIncome(incomeSources);
 *   const performance = calculatePerformanceData(userData, transactions, 'month');
 * };
 * ```
 *
 * @returns {Object} Budget calculation API
 */

import { Currency } from 'utils/currency';
import {
  calculateTotalYearlyIncome,
  calculateTotalMonthlyExpenses,
  calculateTotalMonthlySavings,
  checkBudgetBalance,
  calculateAvailableForExpenses
} from 'utils/budgetCalculations';
import { parseDate, isInMonth } from 'utils/dateUtils';

export const useBudgetMath = () => {
  // ============================================
  // INCOME CALCULATIONS
  // ============================================

  /**
   * Calculate total monthly income from all sources
   * Uses Currency.toYearly + Currency.fromYearly for accuracy
   * @param {Array} incomeSources - Array of {name, amount, frequency}
   * @returns {number} Total monthly income
   */
  const calculateMonthlyIncome = (incomeSources = []) => {
    const yearlyTotal = calculateTotalYearlyIncome(incomeSources);
    return Currency.fromYearly(yearlyTotal, 'Monthly');
  };

  /**
   * Calculate total yearly income from all sources
   * Re-exports from budgetCalculations.js
   * @param {Array} incomeSources - Array of {name, amount, frequency}
   * @returns {number} Total yearly income
   */
  const calculateYearlyIncome = calculateTotalYearlyIncome;

  /**
   * Calculate prorated income for elapsed months in period
   * @param {Array} incomeSources - Array of {name, amount, frequency}
   * @param {number} monthsElapsed - Number of months elapsed
   * @returns {number} Total income for period
   */
  const calculatePeriodIncome = (incomeSources = [], monthsElapsed = 1) => {
    const monthlyTotal = calculateMonthlyIncome(incomeSources);
    return Currency.multiply(monthlyTotal, monthsElapsed);
  };

  /**
   * Calculate actual income from transactions
   * Matches transactions to income sources by category/description
   * @param {Array} transactions - Array of transaction objects
   * @param {Array} incomeSources - Array of income source objects
   * @returns {number} Total actual income from transactions
   */
  const calculateActualIncome = (transactions = [], incomeSources = []) => {
    return transactions
      .filter(t => Currency.isPositive(t.amount))
      .filter(t => matchesIncomeSource(t, incomeSources))
      .reduce((sum, t) => Currency.add(sum, t.amount), 0);
  };

  // ============================================
  // EXPENSE CALCULATIONS
  // ============================================

  /**
   * Calculate total monthly expenses from all categories
   * Re-exports from budgetCalculations.js
   * @param {Array} expenseCategories - Array of expense category objects
   * @returns {number} Total monthly expenses
   */
  const calculateMonthlyExpenses = calculateTotalMonthlyExpenses;

  /**
   * Calculate prorated expenses for elapsed months in period
   * @param {Array} expenseCategories - Array of expense category objects
   * @param {number} monthsElapsed - Number of months elapsed
   * @returns {number} Total expenses for period
   */
  const calculatePeriodExpenses = (expenseCategories = [], monthsElapsed = 1) => {
    const monthlyTotal = calculateMonthlyExpenses(expenseCategories);
    return Currency.multiply(monthlyTotal, monthsElapsed);
  };

  /**
   * Calculate actual expenses from transactions
   * Counts all transactions with main_category='expense' matched to expense categories
   * Handles both positive and negative amounts (takes absolute value)
   * @param {Array} transactions - Array of transaction objects
   * @param {Array} categories - Array of category objects with type='expense'
   * @returns {number} Total actual expenses from transactions
   */
  const calculateActualExpenses = (transactions = [], categories = []) => {
    const expenseCategories = categories.filter(c => c.type === 'expense');

    return transactions
      .filter(t => t.main_category && t.main_category.toLowerCase() === 'expense')
      .filter(t => matchesCategory(t, expenseCategories))
      .reduce((sum, t) => Currency.add(sum, Currency.abs(t.amount)), 0);
  };

  // ============================================
  // SAVINGS CALCULATIONS
  // ============================================

  /**
   * Calculate total monthly savings allocation
   * Re-exports from budgetCalculations.js
   * @param {Object} savingsAllocation - Savings allocation object
   * @returns {number} Total monthly savings
   */
  const calculateMonthlySavings = calculateTotalMonthlySavings;

  /**
   * Calculate prorated savings for elapsed months in period
   * @param {Object} savingsAllocation - Savings allocation object
   * @param {number} monthsElapsed - Number of months elapsed
   * @returns {number} Total savings for period
   */
  const calculatePeriodSavings = (savingsAllocation = {}, monthsElapsed = 1) => {
    const monthlyTotal = calculateMonthlySavings(savingsAllocation);
    return Currency.multiply(monthlyTotal, monthsElapsed);
  };

  /**
   * Calculate actual savings from transactions
   * Matches transactions to savings goals by category/description
   * @param {Array} transactions - Array of transaction objects
   * @param {Object} savingsAllocation - Savings allocation with savingsGoals array
   * @returns {number} Total actual savings from transactions
   */
  const calculateActualSavings = (transactions = [], savingsAllocation = {}) => {
    const savingsGoals = savingsAllocation.savingsGoals || [];
    const savingsKeywords = [
      'savings',
      'emergency fund',
      'investment',
      ...savingsGoals.map(g => g.name.toLowerCase())
    ];

    return transactions
      .filter(t => {
        const categoryName = typeof t.category === 'string'
          ? t.category.toLowerCase()
          : (t.category?.name || '').toLowerCase();

        const descriptionText = (t.description || '').toLowerCase();

        const isSavingsCategory = savingsKeywords.some(kw => categoryName.includes(kw));
        const isSavingsDescription = savingsKeywords.some(kw => descriptionText.includes(kw));

        return isSavingsCategory || isSavingsDescription;
      })
      .reduce((sum, t) => Currency.add(sum, Currency.abs(t.amount)), 0);
  };

  // ============================================
  // BUDGET HEALTH
  // ============================================

  /**
   * Check if budget is balanced (income = expenses + savings)
   * Re-exports from budgetCalculations.js
   * @param {Object} budgetData - Complete budget data
   * @returns {Object} Balance check result
   */
  const validateBudgetBalance = checkBudgetBalance;

  /**
   * Calculate available budget for expenses after savings
   * Re-exports from budgetCalculations.js
   * @param {number} monthlyIncome - Monthly income amount
   * @param {number} monthlySavings - Monthly savings amount
   * @returns {number} Available for expenses
   */
  const getAvailableForExpenses = calculateAvailableForExpenses;

  // ============================================
  // CATEGORY & TRANSACTION HELPERS
  // ============================================

  /**
   * Unified category matching for transactions
   * Handles both string and object category formats
   * @param {Object} transaction - Transaction with category field
   * @param {Array} categories - Array of category objects
   * @returns {boolean} True if transaction matches any category
   */
  const matchesCategory = (transaction, categories = []) => {
    if (!transaction.sub_category || !categories.length) return false;

    return categories.some(cat =>
      transaction.sub_category?.toLowerCase() === cat.name.toLowerCase()
    );
  };

  /**
   * Match transaction to income sources
   * @param {Object} transaction - Transaction object
   * @param {Array} incomeSources - Array of income source objects
   * @returns {boolean} True if transaction matches any income source
   */
  const matchesIncomeSource = (transaction, incomeSources = []) => {
    return incomeSources.some(source => {
      // Match by sub_category
      if (transaction.sub_category) {
        if (transaction.sub_category?.toLowerCase() === source.name.toLowerCase()) {
          return true;
        }
      }

      // Match by description keywords
      if (transaction.description) {
        const desc = transaction.description.toLowerCase();
        const sourceName = source.name.toLowerCase();

        if (desc.includes(sourceName)) return true;

        // Common income keywords
        if (sourceName.includes('salary') && desc.includes('payroll')) return true;
        if (sourceName.includes('freelance') && (desc.includes('contract') || desc.includes('freelance'))) return true;
      }

      return false;
    });
  };

  /**
   * Filter transactions by time period
   * @param {Array} transactions - All transactions
   * @param {string} viewMode - 'month' or 'period'
   * @param {string} selectedMonth - Selected month (format: "2024-5")
   * @param {Object} onboardingData - Onboarding data with period info
   * @returns {Array} Filtered transactions
   */
  const filterTransactionsByPeriod = (
    transactions = [],
    viewMode = 'month',
    selectedMonth = null,
    onboardingData = {}
  ) => {
    if (viewMode === 'period') {
      const periodStartDate = onboardingData?.period?.start_date;
      if (!periodStartDate) return transactions;

      const periodStart = parseDate(periodStartDate);
      if (!periodStart) return transactions;

      return transactions.filter(t => {
        const transactionDate = parseDate(t.date);
        return transactionDate && transactionDate >= periodStart;
      });
    } else {
      let targetMonth, targetYear;

      if (selectedMonth) {
        const [year, month] = selectedMonth.split('-').map(Number);
        targetMonth = month;
        targetYear = year;
      } else {
        const now = new Date();
        targetMonth = now.getMonth();
        targetYear = now.getFullYear();
      }

      return transactions.filter(t => {
        return isInMonth(t.date, targetMonth, targetYear);
      });
    }
  };

  /**
   * Calculate totals by category from transactions
   * @param {Array} transactions - Array of transaction objects
   * @param {Array} categories - Array of category objects
   * @returns {Array} Categories with spent amounts
   */
  const calculateCategoryTotals = (transactions = [], categories = []) => {
    return categories.map(category => {
      const spent = transactions
        .filter(t => matchesCategory(t, [category]))
        .filter(t => Currency.compare(t.amount, 0) < 0)
        .reduce((sum, t) => Currency.add(sum, Currency.abs(t.amount)), 0);

      return {
        ...category,
        spent
      };
    });
  };

  // ============================================
  // PERFORMANCE METRICS
  // ============================================

  /**
   * Calculate complete budget performance data
   * Returns planned vs actual for income, expenses, savings
   * @param {Object} onboardingData - Complete onboarding data
   * @param {Array} transactions - All transactions
   * @param {string} viewMode - 'month' or 'period'
   * @param {string} selectedMonth - Selected month (null = current)
   * @param {Array} categories - All categories
   * @returns {Object} Performance data {income, expenses, savings}
   */
  const calculatePerformanceData = (
    onboardingData = {},
    transactions = [],
    viewMode = 'month',
    selectedMonth = null,
    categories = []
  ) => {
    const filteredTransactions = filterTransactionsByPeriod(
      transactions,
      viewMode,
      selectedMonth,
      onboardingData
    );

    if (viewMode === 'month') {
      return {
        income: {
          planned: calculateMonthlyIncome(onboardingData?.income?.incomeSources),
          actual: calculateActualIncome(filteredTransactions, onboardingData?.income?.incomeSources)
        },
        expenses: {
          planned: calculateMonthlyExpenses(onboardingData?.expenses?.expenseCategories),
          actual: calculateActualExpenses(filteredTransactions, categories)
        },
        savings: {
          planned: calculateMonthlySavings(onboardingData?.savingsAllocation),
          actual: calculateActualSavings(filteredTransactions, onboardingData?.savingsAllocation)
        }
      };
    } else {
      // Use full period duration, not months elapsed
      const periodDuration = onboardingData?.period?.duration_months || 12;

      return {
        income: {
          planned: calculatePeriodIncome(onboardingData?.income?.incomeSources, periodDuration),
          actual: calculateActualIncome(filteredTransactions, onboardingData?.income?.incomeSources)
        },
        expenses: {
          planned: calculatePeriodExpenses(onboardingData?.expenses?.expenseCategories, periodDuration),
          actual: calculateActualExpenses(filteredTransactions, categories)
        },
        savings: {
          planned: calculatePeriodSavings(onboardingData?.savingsAllocation, periodDuration),
          actual: calculateActualSavings(filteredTransactions, onboardingData?.savingsAllocation)
        }
      };
    }
  };

  /**
   * Calculate months elapsed from period start date
   * @param {string|Date} periodStartDate - Period start date
   * @returns {number} Months elapsed (minimum 1)
   */
  const calculateMonthsElapsed = (periodStartDate) => {
    if (!periodStartDate) return 1;

    const periodStart = new Date(periodStartDate);
    const now = new Date();

    return Math.max(1,
      ((now.getFullYear() - periodStart.getFullYear()) * 12) +
      (now.getMonth() - periodStart.getMonth()) + 1
    );
  };

  // ============================================
  // NET WORTH
  // ============================================

  // ============================================
  // RETURN HOOK API
  // ============================================

  return {
    // Income
    calculateMonthlyIncome,
    calculateYearlyIncome,
    calculatePeriodIncome,
    calculateActualIncome,

    // Expenses
    calculateMonthlyExpenses,
    calculatePeriodExpenses,
    calculateActualExpenses,

    // Savings
    calculateMonthlySavings,
    calculatePeriodSavings,
    calculateActualSavings,

    // Budget Health
    validateBudgetBalance,
    getAvailableForExpenses,

    // Helpers
    matchesCategory,
    matchesIncomeSource,
    filterTransactionsByPeriod,
    calculateCategoryTotals,

    // Performance
    calculatePerformanceData,
    calculateMonthsElapsed
  };
};
