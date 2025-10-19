// frontend/src/utils/categoryEnhancer.js
// Utility for enhancing categories with keywords and merchant mappings for smart categorization

import { isCreditCardPayment } from './transactionHelpers';

// Predefined keyword mappings for common category patterns
const CATEGORY_KEYWORD_PATTERNS = {
  // Food & Dining
  'groceries': ['grocery', 'supermarket', 'market', 'food', 'whole foods', 'trader joe', 'safeway', 'kroger', 'walmart', 'target', 'costco'],
  'dining': ['restaurant', 'cafe', 'coffee', 'pizza', 'burger', 'starbucks', 'mcdonald', 'chipotle', 'subway', 'takeout', 'delivery'],
  'fast food': ['mcdonald', 'burger king', 'wendy', 'taco bell', 'kfc', 'subway', 'pizza hut', 'domino', 'quick service'],
  
  // Transportation
  'gas': ['gas', 'fuel', 'station', 'shell', 'chevron', 'exxon', 'mobil', 'bp', 'arco', 'petroleum'],
  'parking': ['parking', 'meter', 'garage', 'lot', 'valet'],
  'uber': ['uber', 'lyft', 'rideshare', 'taxi', 'cab'],
  'public transport': ['metro', 'bus', 'train', 'transit', 'subway', 'mta', 'bart'],
  
  // Shopping
  'clothing': ['clothing', 'apparel', 'fashion', 'nike', 'adidas', 'gap', 'zara', 'h&m', 'uniqlo', 'nordstrom', 'macy'],
  'amazon': ['amazon', 'amzn', 'aws'],
  'electronics': ['best buy', 'apple', 'microsoft', 'electronics', 'computer', 'phone', 'tech'],
  
  // Utilities & Services
  'utilities': ['electric', 'power', 'gas company', 'water', 'sewer', 'utility', 'pge', 'edison'],
  'internet': ['internet', 'wifi', 'comcast', 'xfinity', 'verizon', 'att', 'spectrum', 'cox'],
  'phone': ['phone', 'mobile', 'cellular', 'verizon', 'att', 't-mobile', 'sprint'],
  'streaming': ['netflix', 'spotify', 'hulu', 'disney', 'amazon prime', 'youtube', 'apple music'],
  
  // Health & Fitness
  'gym': ['gym', 'fitness', 'planet fitness', 'la fitness', 'crossfit', 'yoga', 'pilates'],
  'medical': ['medical', 'doctor', 'hospital', 'pharmacy', 'cvs', 'walgreens', 'urgent care'],
  'dental': ['dental', 'dentist', 'orthodontist'],
  
  // Financial
  'bank': ['bank', 'atm', 'fee', 'maintenance', 'overdraft'],
  'insurance': ['insurance', 'premium', 'policy', 'allstate', 'geico', 'progressive', 'state farm'],
  
  // Housing
  'rent': ['rent', 'rental', 'lease', 'apartment', 'housing'],
  'mortgage': ['mortgage', 'loan payment', 'principal', 'interest'],
  'home improvement': ['home depot', 'lowes', 'hardware', 'improvement', 'repair'],
  
  // Entertainment
  'movies': ['movie', 'cinema', 'theater', 'amc', 'regal', 'film'],
  'entertainment': ['entertainment', 'concert', 'show', 'event', 'ticket']
};

// Generate keywords for a category based on its name and type
export const generateCategoryKeywords = (category) => {
  if (!category || !category.name) return [];
  
  const categoryName = category.name.toLowerCase();
  const keywords = new Set();
  
  // Add the category name itself as a keyword
  keywords.add(categoryName);
  
  // Check for pattern matches
  for (const [pattern, patternKeywords] of Object.entries(CATEGORY_KEYWORD_PATTERNS)) {
    if (categoryName.includes(pattern) || pattern.includes(categoryName)) {
      patternKeywords.forEach(keyword => keywords.add(keyword));
    }
  }
  
  // Add common variations of the category name
  const nameParts = categoryName.split(/[\s&-]+/);
  nameParts.forEach(part => {
    if (part.length > 2) { // Avoid very short words
      keywords.add(part);
    }
  });
  
  // Type-specific keywords
  if (category.type === 'Income') {
    keywords.add('salary');
    keywords.add('payroll'); 
    keywords.add('deposit');
    keywords.add('direct deposit');
  }
  
  return Array.from(keywords);
};

// Load user's learned merchant mappings from localStorage
export const loadMerchantMappings = () => {
  try {
    const stored = localStorage.getItem('merchantMappings');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Convert plain object back to Map
      return new Map(Object.entries(parsed));
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Failed to load merchant mappings:', error);
    }
  }
  return new Map();
};

// Save user's learned merchant mappings to localStorage
export const saveMerchantMappings = (mappings) => {
  try {
    // Convert Map to plain object for JSON storage
    const obj = Object.fromEntries(mappings);
    localStorage.setItem('merchantMappings', JSON.stringify(obj));
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Failed to save merchant mappings:', error);
    }
  }
};

// Learn a new merchant mapping when user manually categorizes
export const learnMerchantMapping = (merchantName, categoryId) => {
  if (!merchantName || !categoryId) return;
  
  const mappings = loadMerchantMappings();
  const normalizedMerchant = merchantName.toLowerCase().trim();
  
  // Store the mapping
  mappings.set(normalizedMerchant, categoryId);
  
  // Save back to localStorage
  saveMerchantMappings(mappings);
};

// Create the system "Ignore" category
export const createIgnoreCategory = () => ({
  id: 'system-ignore',
  name: 'Ignore',
  type: 'System',
  description: 'Credit card payments, transfers, and other transactions to ignore',
  keywords: ['payment thank you', 'autopay', 'online payment', 'credit card payment', 'transfer', 'balance payment'],
  merchantMappings: new Map(),
  isSystemCategory: true
});

// Check if a transaction should be auto-ignored
export const shouldAutoIgnore = (transaction) => {
  if (!transaction || !transaction.description) return false;
  
  // Use existing credit card payment detection
  if (isCreditCardPayment(transaction.description)) {
    return true;
  }
  
  // Additional auto-ignore patterns
  const description = transaction.description.toLowerCase();
  const autoIgnorePatterns = [
    'transfer',
    'zelle',
    'venmo',
    'paypal transfer',
    'internal transfer',
    'account transfer',
    'balance transfer'
  ];
  
  return autoIgnorePatterns.some(pattern => description.includes(pattern));
};

// Enhance a category with keywords and merchant mappings
export const enhanceCategory = (category) => {
  if (!category) return category;
  
  // Don't enhance if already enhanced
  if (category.keywords && category.merchantMappings) {
    return category;
  }
  
  const enhanced = {
    ...category,
    keywords: generateCategoryKeywords(category),
    merchantMappings: loadMerchantMappings()
  };
  
  return enhanced;
};

// Enhance all categories in a list and add the Ignore category
export const enhanceCategories = (categories) => {
  if (!categories || !Array.isArray(categories)) return [];
  
  const enhanced = categories.map(enhanceCategory);
  
  // Add the system Ignore category at the end
  enhanced.push(createIgnoreCategory());
  
  return enhanced;
};