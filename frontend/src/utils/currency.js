// frontend/src/utils/currency.js
// Centralized Currency Handling - Fixes floating point precision issues

/**
 * Centralized currency utilities to handle formatting, parsing, and calculations
 * All currency values are stored as cents (integers) internally to avoid floating point issues
 */

// ==================== CORE CURRENCY FUNCTIONS ====================

/**
 * Convert dollar amount to cents (integer storage)
 * @param {string|number} amount - Dollar amount as string or number
 * @returns {number} - Amount in cents as integer
 */
export const toCents = (amount) => {
  if (amount === '' || amount === null || amount === undefined) return 0;
  
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return 0;
  
  // Round to avoid floating point precision issues
  return Math.round(num * 100);
};

/**
 * Convert cents to dollar amount
 * @param {number} cents - Amount in cents
 * @returns {number} - Amount in dollars
 */
export const fromCents = (cents) => {
  if (typeof cents !== 'number' || isNaN(cents)) return 0;
  return cents / 100;
};

/**
 * Format currency for display - always 2 decimal places
 * @param {string|number} amount - Amount in dollars
 * @param {object} options - Formatting options
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (amount, options = {}) => {
  const {
    showCents = true,
    symbol = '$',
    locale = 'en-US'
  } = options;
  
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return `${symbol}0.00`;
  
  // Convert to cents and back to eliminate floating point errors
  const cents = toCents(num);
  const cleanAmount = fromCents(cents);
  
  if (showCents) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(cleanAmount);
  } else {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(cleanAmount);
  }
};

/**
 * Format currency for input fields - removes symbols, keeps decimals
 * @param {string|number} amount - Amount to format
 * @returns {string} - Clean number string for inputs
 */
export const formatCurrencyInput = (amount) => {
  if (amount === '' || amount === null || amount === undefined) return '';
  
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '';
  
  // Convert to cents and back to clean up precision
  const cents = toCents(num);
  const cleanAmount = fromCents(cents);
  
  return cleanAmount.toFixed(2);
};

/**
 * Parse user input for currency - handles various input formats
 * @param {string} input - User input string
 * @returns {string} - Clean decimal string
 */
export const parseCurrencyInput = (input) => {
  if (!input || typeof input !== 'string') return '';
  
  // Remove everything except numbers and decimal point
  let cleaned = input.replace(/[^0-9.]/g, '');
  
  // Handle multiple decimal points - keep only the first one
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('');
  }
  
  // Limit to 2 decimal places
  if (parts.length === 2 && parts[1].length > 2) {
    cleaned = parts[0] + '.' + parts[1].substring(0, 2);
  }
  
  return cleaned;
};

// ==================== CALCULATION FUNCTIONS ====================

/**
 * Add currency amounts with precision
 * @param {...(string|number)} amounts - Amounts to add
 * @returns {number} - Sum in dollars
 */
export const addCurrency = (...amounts) => {
  const totalCents = amounts.reduce((sum, amount) => {
    return sum + toCents(amount);
  }, 0);
  
  return fromCents(totalCents);
};

/**
 * Subtract currency amounts with precision
 * @param {string|number} minuend - Amount to subtract from
 * @param {...(string|number)} subtrahends - Amounts to subtract
 * @returns {number} - Difference in dollars
 */
export const subtractCurrency = (minuend, ...subtrahends) => {
  const minuendCents = toCents(minuend);
  const subtrahendsCents = subtrahends.reduce((sum, amount) => {
    return sum + toCents(amount);
  }, 0);
  
  return fromCents(minuendCents - subtrahendsCents);
};

/**
 * Multiply currency amount
 * @param {string|number} amount - Amount to multiply
 * @param {number} multiplier - Multiplier
 * @returns {number} - Product in dollars
 */
export const multiplyCurrency = (amount, multiplier) => {
  const cents = toCents(amount);
  const resultCents = Math.round(cents * multiplier);
  return fromCents(resultCents);
};

/**
 * Divide currency amount
 * @param {string|number} amount - Amount to divide
 * @param {number} divisor - Divisor
 * @returns {number} - Quotient in dollars
 */
export const divideCurrency = (amount, divisor) => {
  if (divisor === 0) return 0;
  const cents = toCents(amount);
  const resultCents = Math.round(cents / divisor);
  return fromCents(resultCents);
};

/**
 * Compare currency amounts with tolerance for floating point errors
 * @param {string|number} amount1 - First amount
 * @param {string|number} amount2 - Second amount
 * @returns {number} - -1 if amount1 < amount2, 0 if equal, 1 if amount1 > amount2
 */
export const compareCurrency = (amount1, amount2) => {
  const cents1 = toCents(amount1);
  const cents2 = toCents(amount2);
  
  if (cents1 < cents2) return -1;
  if (cents1 > cents2) return 1;
  return 0;
};

/**
 * Check if currency amounts are equal (within precision tolerance)
 * @param {string|number} amount1 - First amount
 * @param {string|number} amount2 - Second amount
 * @returns {boolean} - True if amounts are equal
 */
export const isEqualCurrency = (amount1, amount2) => {
  return compareCurrency(amount1, amount2) === 0;
};

/**
 * Check if amount is positive
 * @param {string|number} amount - Amount to check
 * @returns {boolean} - True if positive
 */
export const isPositiveCurrency = (amount) => {
  return toCents(amount) > 0;
};

/**
 * Get absolute value of currency amount
 * @param {string|number} amount - Amount
 * @returns {number} - Absolute value in dollars
 */
export const absCurrency = (amount) => {
  const cents = Math.abs(toCents(amount));
  return fromCents(cents);
};

// ==================== VALIDATION FUNCTIONS ====================

/**
 * Validate currency input
 * @param {string} input - Input to validate
 * @returns {object} - Validation result with isValid and error
 */
export const validateCurrencyInput = (input) => {
  if (!input || input === '') {
    return { isValid: false, error: 'Amount is required' };
  }
  
  const parsed = parseCurrencyInput(input);
  const num = parseFloat(parsed);
  
  if (isNaN(num)) {
    return { isValid: false, error: 'Please enter a valid amount' };
  }
  
  if (num < 0) {
    return { isValid: false, error: 'Amount cannot be negative' };
  }
  
  if (num > 999999999.99) {
    return { isValid: false, error: 'Amount is too large' };
  }
  
  return { isValid: true, error: null };
};

/**
 * Check if budget is balanced (within 1 cent tolerance)
 * @param {number} totalIncome - Total income
 * @param {number} totalExpenses - Total expenses
 * @param {number} totalSavings - Total savings
 * @returns {object} - Balance check result
 */
export const checkBudgetBalance = (totalIncome, totalExpenses, totalSavings) => {
  const incomeCents = toCents(totalIncome);
  const expensesCents = toCents(totalExpenses);
  const savingsCents = toCents(totalSavings);
  
  const usedCents = expensesCents + savingsCents;
  const differenceCents = incomeCents - usedCents;
  const difference = fromCents(Math.abs(differenceCents));
  
  const isBalanced = Math.abs(differenceCents) <= 1; // Within 1 cent
  const isOverBudget = differenceCents < 0;
  const isUnderBudget = differenceCents > 0;
  
  return {
    isBalanced,
    isOverBudget,
    isUnderBudget,
    difference,
    remaining: fromCents(differenceCents)
  };
};

// ==================== FREQUENCY CONVERSION ====================

/**
 * Convert amount based on frequency to yearly amount
 * @param {string|number} amount - Amount
 * @param {string} frequency - Frequency (Weekly, Bi-weekly, Monthly, Yearly)
 * @returns {number} - Yearly amount
 */
export const convertToYearly = (amount, frequency) => {
  const multipliers = {
    'Weekly': 52,
    'Bi-weekly': 26,
    'Monthly': 12,
    'Yearly': 1,
    'One-time': 0
  };
  
  const cents = toCents(amount);
  const multiplier = multipliers[frequency] || 1;
  const yearlyCents = cents * multiplier;
  
  return fromCents(yearlyCents);
};

/**
 * Convert yearly amount to specific frequency
 * @param {string|number} yearlyAmount - Yearly amount
 * @param {string} targetFrequency - Target frequency
 * @returns {number} - Amount in target frequency
 */
export const convertFromYearly = (yearlyAmount, targetFrequency) => {
  const multipliers = {
    'Weekly': 52,
    'Bi-weekly': 26,
    'Monthly': 12,
    'Yearly': 1,
    'One-time': 0
  };
  
  const yearlyCents = toCents(yearlyAmount);
  const multiplier = multipliers[targetFrequency] || 1;
  
  if (multiplier === 0) return 0;
  
  const resultCents = Math.round(yearlyCents / multiplier);
  return fromCents(resultCents);
};

// ==================== LEGACY COMPATIBILITY ====================

/**
 * Legacy formatCurrency function for backwards compatibility
 * @deprecated Use formatCurrency instead
 */
export const formatCurrencyLegacy = (amount) => {
  console.warn('formatCurrencyLegacy is deprecated. Use formatCurrency instead.');
  return formatCurrency(amount);
};

// ==================== EXPORTS ====================

// Main currency object for easy importing
export const Currency = {
  // Core functions
  toCents,
  fromCents,
  format: formatCurrency,
  formatInput: formatCurrencyInput,
  parseInput: parseCurrencyInput,
  
  // Calculations
  add: addCurrency,
  subtract: subtractCurrency,
  multiply: multiplyCurrency,
  divide: divideCurrency,
  compare: compareCurrency,
  isEqual: isEqualCurrency,
  isPositive: isPositiveCurrency,
  abs: absCurrency,
  
  // Validation
  validate: validateCurrencyInput,
  checkBalance: checkBudgetBalance,
  
  // Frequency conversion
  toYearly: convertToYearly,
  fromYearly: convertFromYearly
};

// Default export for convenience
export default Currency;
