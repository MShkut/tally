// frontend/src/utils/budgetCalculations.js
// Fixed budget calculations using centralized currency system

import { Currency } from './currency';

/**
 * Calculate total income from multiple sources with proper currency handling
 * @param {Array} incomeSources - Array of income source objects
 * @returns {number} - Total yearly income
 */
export const calculateTotalYearlyIncome = (incomeSources = []) => {
  return incomeSources.reduce((total, source) => {
    const yearlyAmount = Currency.toYearly(source.amount, source.frequency);
    return Currency.add(total, yearlyAmount);
  }, 0);
};

/**
 * Calculate total expenses with proper currency handling
 * @param {Array} expenseCategories - Array of expense category objects
 * @returns {number} - Total monthly expenses
 */
export const calculateTotalMonthlyExpenses = (expenseCategories = []) => {
  return expenseCategories.reduce((total, category) => {
    const monthlyAmount = Currency.fromYearly(
      Currency.toYearly(category.amount, category.frequency || 'Monthly'),
      'Monthly'
    );
    return Currency.add(total, monthlyAmount);
  }, 0);
};

/**
 * Calculate total savings allocation with proper currency handling
 * @param {Object} savingsAllocation - Savings allocation object
 * @returns {number} - Total monthly savings
 */
export const calculateTotalMonthlySavings = (savingsAllocation = {}) => {
  let total = 0;
  
  // Emergency fund contribution
  if (!savingsAllocation.emergencyFund?.hasExisting && savingsAllocation.emergencyFund?.monthlyAmount) {
    total = Currency.add(total, savingsAllocation.emergencyFund.monthlyAmount);
  }
  
  // Savings goals
  if (savingsAllocation.savingsGoals) {
    const goalsTotal = savingsAllocation.savingsGoals.reduce((sum, goal) => {
      return Currency.add(sum, goal.amount || 0);
    }, 0);
    total = Currency.add(total, goalsTotal);
  }
  
  return total;
};

/**
 * Check if budget is balanced with proper tolerance
 * @param {Object} budgetData - Complete budget data
 * @returns {Object} - Balance check result
 */
export const checkBudgetBalance = (budgetData) => {
  const { income, expenses, savingsAllocation } = budgetData;
  
  const totalIncome = calculateTotalYearlyIncome(income?.incomeSources || []);
  const monthlyIncome = Currency.fromYearly(totalIncome, 'Monthly');
  
  const totalExpenses = calculateTotalMonthlyExpenses(expenses?.expenseCategories || []);
  const totalSavings = calculateTotalMonthlySavings(savingsAllocation || {});
  
  return Currency.checkBalance(monthlyIncome, totalExpenses, totalSavings);
};

/**
 * Calculate available budget for expenses after savings
 * @param {number} monthlyIncome - Monthly income
 * @param {number} monthlySavings - Monthly savings allocation
 * @returns {number} - Available for expenses
 */
export const calculateAvailableForExpenses = (monthlyIncome, monthlySavings) => {
  return Currency.subtract(monthlyIncome, monthlySavings);
};

/**
 * Calculate expense category budget validation
 * @param {Array} expenseCategories - Expense categories
 * @param {number} availableBudget - Available budget
 * @returns {Object} - Validation results
 */
export const validateExpenseBudget = (expenseCategories = [], availableBudget = 0) => {
  const totalExpenses = calculateTotalMonthlyExpenses(expenseCategories);
  const remaining = Currency.subtract(availableBudget, totalExpenses);
  
  const results = {
    totalExpenses,
    availableBudget,
    remaining,
    isOverBudget: Currency.compare(remaining, 0) < 0,
    isBalanced: Currency.isEqual(remaining, 0),
    categories: []
  };
  
  // Validate individual categories
  results.categories = expenseCategories.map(category => {
    const monthlyAmount = Currency.fromYearly(
      Currency.toYearly(category.amount, category.frequency || 'Monthly'),
      'Monthly'
    );
    
    return {
      ...category,
      monthlyAmount,
      isValid: Currency.isPositive(monthlyAmount),
      isOverAvailable: Currency.compare(monthlyAmount, availableBudget) > 0
    };
  });
  
  return results;
};

/**
 * Calculate savings allocation validation
 * @param {Object} savingsAllocation - Savings allocation data
 * @param {number} availableForSavings - Available amount for savings
 * @returns {Object} - Validation results
 */
export const validateSavingsAllocation = (savingsAllocation = {}, availableForSavings = 0) => {
  const totalAllocated = calculateTotalMonthlySavings(savingsAllocation);
  const remaining = Currency.subtract(availableForSavings, totalAllocated);
  
  return {
    totalAllocated,
    availableForSavings,
    remaining,
    isOverAllocated: Currency.compare(remaining, 0) < 0,
    isBalanced: Currency.isEqual(remaining, 0),
    savingsRate: availableForSavings > 0 ? 
      Currency.formatPercentage((totalAllocated / availableForSavings) * 100) : '0%'
  };
};

/**
 * Calculate net worth with proper currency handling
 * @param {Object} netWorthData - Net worth data
 * @returns {Object} - Calculated net worth
 */
export const calculateNetWorth = (netWorthData = {}) => {
  const { assets = [], liabilities = [] } = netWorthData;
  
  const totalAssets = assets.reduce((sum, asset) => {
    return Currency.add(sum, asset.amount || 0);
  }, 0);
  
  const totalLiabilities = liabilities.reduce((sum, liability) => {
    return Currency.add(sum, liability.amount || 0);
  }, 0);
  
  const netWorth = Currency.subtract(totalAssets, totalLiabilities);
  
  return {
    totalAssets,
    totalLiabilities,
    netWorth,
    isPositive: Currency.compare(netWorth, 0) >= 0
  };
};

/**
 * Calculate budget performance metrics
 * @param {Object} budgetData - Budget data
 * @param {Array} transactions - Transaction data
 * @param {string} timeframe - 'month' or 'period'
 * @returns {Object} - Performance metrics
 */
export const calculateBudgetPerformance = (budgetData, transactions = [], timeframe = 'month') => {
  // This would integrate with the existing performance calculation
  // but use the new currency system for all calculations
  
  const performance = {
    income: { planned: 0, actual: 0 },
    expenses: { planned: 0, actual: 0 },
    savings: { planned: 0, actual: 0 }
  };
  
  // Calculate planned amounts using currency system
  if (budgetData?.income?.incomeSources) {
    const yearlyIncome = calculateTotalYearlyIncome(budgetData.income.incomeSources);
    performance.income.planned = timeframe === 'month' ? 
      Currency.fromYearly(yearlyIncome, 'Monthly') : yearlyIncome;
  }
  
  if (budgetData?.expenses?.expenseCategories) {
    performance.expenses.planned = calculateTotalMonthlyExpenses(budgetData.expenses.expenseCategories);
    if (timeframe === 'period') {
      // Multiply by period length
      const periodMonths = budgetData?.period?.duration_months || 1;
      performance.expenses.planned = Currency.multiply(performance.expenses.planned, periodMonths);
    }
  }
  
  if (budgetData?.savingsAllocation) {
    performance.savings.planned = calculateTotalMonthlySavings(budgetData.savingsAllocation);
    if (timeframe === 'period') {
      const periodMonths = budgetData?.period?.duration_months || 1;
      performance.savings.planned = Currency.multiply(performance.savings.planned, periodMonths);
    }
  }
  
  // Calculate actual amounts from transactions
  performance.income.actual = transactions
    .filter(t => Currency.isPositive(t.amount))
    .reduce((sum, t) => Currency.add(sum, t.amount), 0);
    
  performance.expenses.actual = transactions
    .filter(t => Currency.compare(t.amount, 0) < 0)
    .reduce((sum, t) => Currency.add(sum, Currency.abs(t.amount)), 0);
    
  // Savings calculation would depend on categorization
  // This is a simplified version
  performance.savings.actual = transactions
    .filter(t => t.category && 
      (t.category.type === 'savings' || 
       (typeof t.category === 'string' && t.category.toLowerCase().includes('savings'))))
    .reduce((sum, t) => Currency.add(sum, Currency.abs(t.amount)), 0);
  
  return performance;
};