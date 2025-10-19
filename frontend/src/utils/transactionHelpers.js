// frontend/src/utils/transactionHelpers.js
// Helper Functions for Transaction Processing

import { Currency } from 'utils/currency';

export const normalizeMerchantName = (description) => {
  return description
    .replace(/\s+\d{4,}.*$/, '')
    .replace(/\s+#\d+/, '')
    .replace(/\*+$/, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .toLowerCase();
};

export const isCreditCardPayment = (description) => {
  if (!description) return false;
  
  const paymentKeywords = [
    'payment thank you', 'autopay', 'online payment',
    'card payment', 'credit card payment', 'balance payment'
  ];
  const desc = description.toLowerCase();
  return paymentKeywords.some(keyword => desc.includes(keyword));
};

export const isSplitWorthy = (transaction) => {
  if (!transaction || !transaction.description) return false;
  
  const description = transaction.description.toLowerCase();
  const amount = Currency.abs(transaction.amount || 0);
  
  const splitKeywords = [
    'amazon', 'walmart', 'target', 'costco', 'sam\'s club',
    'grocery', 'supermarket', 'department store', 'wholesale'
  ];
  
  const hasKeyword = splitKeywords.some(keyword => description.includes(keyword));
  const isLargeAmount = Currency.compare(amount, 100) > 0;
  const hasNumbers = /\d+\s*(items?|pcs?|pieces?)/.test(description);
  
  return hasKeyword || (isLargeAmount && !transaction.category?.id?.includes('rent'));
};

export const calculateConfidence = (description, category) => {
  if (!category || !category.keywords || !description) return 0;
  
  const normalizedMerchant = normalizeMerchantName(description);
  
  // Check for exact merchant mapping first
  if (category.merchantMappings && category.merchantMappings.has(normalizedMerchant)) {
    return 1.0;
  }
  
  // Calculate confidence based on keyword matches
  const desc = description.toLowerCase();
  const matches = category.keywords.filter(keyword => 
    desc.includes(keyword.toLowerCase())
  ).length;
  
  return Math.min(matches * 0.3, 0.9);
};

// Helper function for transaction categorization
export const suggestCategory = (transaction, categories) => {
  if (!transaction || !categories || categories.length === 0) return null;
  
  let bestMatch = null;
  let highestConfidence = 0;
  
  categories.forEach(category => {
    const confidence = calculateConfidence(transaction.description, category);
    if (confidence > highestConfidence) {
      highestConfidence = confidence;
      bestMatch = { category, confidence };
    }
  });
  
  return bestMatch;
};

// Export all functions as a collection for easier imports
export const TransactionHelpers = {
  normalizeMerchantName,
  isCreditCardPayment,
  isSplitWorthy,
  calculateConfidence,
  suggestCategory
};
