// src/utils/incomeHelpers.js
// Centralized income calculation utilities

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

// Convert any frequency to yearly amount
export const convertToYearly = (amount, frequency) => {
  const num = parseFloat(amount) || 0;
  const multiplier = FREQUENCY_MULTIPLIERS[frequency] || 1;
  return num * multiplier;
};

// Convert yearly to specific frequency
export const convertFromYearly = (yearlyAmount, targetFrequency) => {
  const yearly = parseFloat(yearlyAmount) || 0;
  const multiplier = FREQUENCY_MULTIPLIERS[targetFrequency] || 1;
  return multiplier > 0 ? yearly / multiplier : 0;
};

// Calculate total yearly income from multiple sources
export const calculateTotalYearlyIncome = (incomeSources = []) => {
  return incomeSources.reduce((total, source) => {
    return total + convertToYearly(source.amount, source.frequency);
  }, 0);
};

// Analyze income diversification
export const analyzeIncomeDistribution = (incomeSources = []) => {
  if (!incomeSources.length) return null;

  const totalYearly = calculateTotalYearlyIncome(incomeSources);
  if (totalYearly === 0) return null;

  // Find primary source
  const sourcesWithYearly = incomeSources.map(source => ({
    ...source,
    yearlyAmount: convertToYearly(source.amount, source.frequency)
  }));

  const primarySource = sourcesWithYearly.reduce((max, source) => 
    source.yearlyAmount > max.yearlyAmount ? source : max
  );

  const primaryPercentage = Math.round((primarySource.yearlyAmount / totalYearly) * 100);

  return {
    totalSources: incomeSources.length,
    primarySource: primarySource.name,
    primaryPercentage,
    isDiversified: incomeSources.length > 1 && primaryPercentage < 80,
    totalYearly,
    monthlyAverage: totalYearly / 12
  };
};

// Validate income source data
export const validateIncomeSource = (source) => {
  const errors = [];
  
  if (!source.name || source.name.trim().length === 0) {
    errors.push('Income source name is required');
  }
  
  if (!source.amount || parseFloat(source.amount) <= 0) {
    errors.push('Amount must be greater than 0');
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
