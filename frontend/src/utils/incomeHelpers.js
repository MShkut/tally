// frontend/src/utils/incomeHelpers.js
// Updated income calculation utilities using centralized currency system

import { Currency } from './currency';

export const FREQUENCY_MULTIPLIERS = {
  'Weekly': 52,
  'Bi-weekly': 26,
  'Monthly': 12,
  'Yearly': 1,
  'One-time': 0 // One-time income doesn't count toward recurring totals
};

export const FREQUENCY_DESCRIPTIONS = {
  'Weekly': 'Every week (52x per year)',
  'Bi-weekly': 'Every 2 weeks (26x per year)', 
  'Monthly': 'Every month (12x per year)',
  'Yearly': 'Once per year',
  'One-time': 'Single occurrence'
};

// Convert any frequency to yearly amount using currency system
export const convertToYearly = (amount, frequency) => {
  return Currency.toYearly(amount, frequency);
};

// Convert yearly to specific frequency using currency system
export const convertFromYearly = (yearlyAmount, targetFrequency) => {
  return Currency.fromYearly(yearlyAmount, targetFrequency);
};

// Calculate total yearly income from multiple sources using currency system
export const calculateTotalYearlyIncome = (incomeSources = []) => {
  return incomeSources.reduce((total, source) => {
    const yearlyAmount = Currency.toYearly(source.amount, source.frequency);
    return Currency.add(total, yearlyAmount);
  }, 0);
};

// Analyze income diversification with proper currency calculations
export const analyzeIncomeDistribution = (incomeSources = []) => {
  if (!incomeSources.length) return null;

  const totalYearly = calculateTotalYearlyIncome(incomeSources);
  if (Currency.compare(totalYearly, 0) === 0) return null;

  // Find primary source using currency comparisons
  const sourcesWithYearly = incomeSources.map(source => ({
    ...source,
    yearlyAmount: Currency.toYearly(source.amount, source.frequency)
  }));

  const primarySource = sourcesWithYearly.reduce((max, source) => 
    Currency.compare(source.yearlyAmount, max.yearlyAmount) > 0 ? source : max
  );

  // Calculate percentage using currency division
  const primaryPercentage = Math.round(
    (Currency.divide(primarySource.yearlyAmount, totalYearly)) * 100
  );

  return {
    totalSources: incomeSources.length,
    primarySource: primarySource.name,
    primaryPercentage,
    isDiversified: incomeSources.length > 1 && primaryPercentage < 80,
    totalYearly,
    monthlyAverage: Currency.fromYearly(totalYearly, 'Monthly')
  };
};

// Validate income source data with currency validation
export const validateIncomeSource = (source) => {
  const errors = [];
  
  if (!source.name || source.name.trim().length === 0) {
    errors.push('Income source name is required');
  }
  
  const validation = Currency.validate(source.amount);
  if (!validation.isValid) {
    errors.push(validation.error || 'Amount must be greater than 0');
  }
  
  if (!source.frequency || !FREQUENCY_MULTIPLIERS.hasOwnProperty(source.frequency)) {
    errors.push('Valid frequency is required');
  }
  
  return errors;
};

// Validate all income sources
export const validateAllIncomeSources = (incomeSources = []) => {
  const allErrors = [];
  
  incomeSources.forEach((source, index) => {
    const sourceErrors = validateIncomeSource(source);
    sourceErrors.forEach(error => {
      allErrors.push(`Income source ${index + 1}: ${error}`);
    });
  });
  
  return allErrors;
};

// Format income insights for display
export const formatIncomeInsights = (insights) => {
  if (!insights) return null;

  const messages = [];
  
  if (insights.isDiversified) {
    messages.push({
      type: 'success',
      text: 'Good income diversification reduces financial risk'
    });
  } else if (insights.totalSources === 1) {
    messages.push({
      type: 'warning', 
      text: 'Consider developing additional income sources for stability'
    });
  } else {
    messages.push({
      type: 'warning',
      text: 'Heavy reliance on one source - consider balancing income streams'
    });
  }

  return {
    primaryText: `Primary income source: ${insights.primarySource} (${insights.primaryPercentage}% of total)`,
    messages
  };
};
