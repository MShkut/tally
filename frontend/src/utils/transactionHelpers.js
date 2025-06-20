// Helper Functions for Transaction Processing
export normalizeMerchantName = (description) => {
  return description
    .replace(/\s+\d{4,}.*$/, '')
    .replace(/\s+#\d+/, '')
    .replace(/\*+$/, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .toLowerCase();
};

export const isCreditCardPayment = (description) => {
  const paymentKeywords = [
    'payment thank you', 'autopay', 'online payment',
    'card payment', 'credit card payment', 'balance payment'
  ];
  const desc = description.toLowerCase();
  return paymentKeywords.some(keyword => desc.includes(keyword));
};

export const isSplitWorthy = (transaction) => {
  const description = transaction.description.toLowerCase();
  const amount = Math.abs(transaction.amount);
  
  const splitKeywords = [
    'amazon', 'walmart', 'target', 'costco', 'sam\'s club',
    'grocery', 'supermarket', 'department store', 'wholesale'
  ];
  
  const hasKeyword = splitKeywords.some(keyword => description.includes(keyword));
  const isLargeAmount = amount > 100;
  const hasNumbers = /\d+\s*(items?|pcs?|pieces?)/.test(description);
  
  return hasKeyword || (isLargeAmount && !transaction.category?.id?.includes('rent'));
};

export const calculateConfidence = (description, category) => {
  if (!category || !category.keywords || !description) return 0;
  
  const normalizedMerchant = normalizeMerchantName(description);
  
  if (category.merchantMappings && category.merchantMappings.has(normalizedMerchant)) {
    return 1.0;
  }
  
  const desc = description.toLowerCase();
  const matches = category.keywords.filter(keyword => 
    desc.includes(keyword.toLowerCase())
  ).length;
  return Math.min(matches * 0.3, 0.9);
};

export default transactionHelper;
