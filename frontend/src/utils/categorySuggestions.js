// frontend/src/utils/categorySuggestions.js
// Contextual category suggestions for smart autocomplete - ALL CATEGORIES

export const EXPENSE_SUGGESTIONS = [
  {
    name: 'Gifts',
    keywords: [
      'birthday', 'birthdays', 'birthday gift', 'birthday present',
      'christmas', 'christmas gift', 'holiday gift', 'holidays',
      'valentines', 'valentine', 'valentines day',
      'mothers day', 'fathers day', 'parent gift',
      'anniversary', 'wedding gift', 'wedding present',
      'present', 'presents', 'gift giving'
    ],
    hint: 'Track individual recipients in Gift Management',
    special: 'gift-management',
    commonFrequencies: ['Monthly', 'Yearly']
  },
  {
    name: 'Housing',
    keywords: ['rent', 'mortgage', 'property tax', 'home', 'apartment'],
    commonFrequencies: ['Monthly']
  },
  {
    name: 'Groceries',
    keywords: ['food', 'grocery', 'supermarket', 'food shopping'],
    commonFrequencies: ['Weekly', 'Bi-weekly', 'Monthly']
  },
  {
    name: 'Transportation',
    keywords: ['gas', 'fuel', 'transit', 'uber', 'lyft', 'car', 'parking', 'metro', 'bus'],
    commonFrequencies: ['Monthly']
  },
  {
    name: 'Insurance',
    keywords: ['insurance', 'health insurance', 'car insurance', 'life insurance'],
    commonFrequencies: ['Monthly', 'Yearly']
  },
  {
    name: 'Utilities',
    keywords: ['electric', 'gas', 'water', 'internet', 'cable', 'phone', 'utilities'],
    commonFrequencies: ['Monthly']
  },
  {
    name: 'Dining Out',
    keywords: ['restaurant', 'restaurants', 'eating out', 'takeout', 'delivery', 'coffee'],
    commonFrequencies: ['Monthly']
  },
  {
    name: 'Entertainment',
    keywords: ['netflix', 'spotify', 'movies', 'streaming', 'games', 'subscription'],
    commonFrequencies: ['Monthly']
  },
  {
    name: 'Healthcare',
    keywords: ['doctor', 'medical', 'prescription', 'dentist', 'health'],
    commonFrequencies: ['Monthly', 'One-time']
  },
  {
    name: 'Personal Care',
    keywords: ['haircut', 'salon', 'gym', 'fitness', 'beauty'],
    commonFrequencies: ['Monthly']
  },
  {
    name: 'Clothing',
    keywords: ['clothes', 'apparel', 'shoes', 'wardrobe'],
    commonFrequencies: ['Monthly', 'Yearly']
  },
  {
    name: 'Education',
    keywords: ['tuition', 'books', 'courses', 'training', 'school'],
    commonFrequencies: ['Yearly', 'One-time']
  },
  {
    name: 'Subscriptions',
    keywords: ['subscription', 'membership', 'service'],
    commonFrequencies: ['Monthly', 'Yearly']
  },
  {
    name: 'Debt Payments',
    keywords: ['credit card', 'loan', 'student loan', 'debt'],
    hint: 'Automatically tracks debt reduction',
    special: 'debt-tracking',
    commonFrequencies: ['Monthly']
  }
];

export const SAVINGS_SUGGESTIONS = [
  {
    name: 'Emergency Fund',
    keywords: ['emergency', 'rainy day', 'safety net'],
    hint: 'Recommended: 3-6 months of expenses',
    commonFrequencies: ['Monthly']
  },
  {
    name: 'Vacation',
    keywords: ['vacation', 'travel', 'trip', 'holiday'],
    commonFrequencies: ['Monthly', 'One-time']
  },
  {
    name: 'Down Payment',
    keywords: ['house', 'home', 'property', 'down payment'],
    commonFrequencies: ['Monthly']
  },
  {
    name: 'Retirement',
    keywords: ['retirement', '401k', 'ira', 'pension'],
    commonFrequencies: ['Monthly', 'Bi-weekly']
  },
  {
    name: 'Investment',
    keywords: ['investment', 'stocks', 'bonds', 'portfolio'],
    commonFrequencies: ['Monthly', 'One-time']
  },
  {
    name: 'New Car',
    keywords: ['car', 'vehicle', 'auto'],
    commonFrequencies: ['Monthly']
  },
  {
    name: 'Wedding',
    keywords: ['wedding', 'marriage', 'ceremony'],
    commonFrequencies: ['Monthly']
  },
  {
    name: 'Education',
    keywords: ['education', 'college', 'tuition', 'school'],
    commonFrequencies: ['Monthly']
  },
  {
    name: 'Home Improvement',
    keywords: ['renovation', 'remodel', 'home improvement'],
    commonFrequencies: ['Monthly', 'One-time']
  }
];

export const INCOME_SUGGESTIONS = [
  {
    name: 'Salary',
    keywords: ['salary', 'wages', 'paycheck', 'employment'],
    commonFrequencies: ['Bi-weekly', 'Monthly']
  },
  {
    name: 'Freelance Income',
    keywords: ['freelance', 'contract', 'consulting', 'gig'],
    commonFrequencies: ['Monthly', 'One-time']
  },
  {
    name: 'Investment Income',
    keywords: ['dividend', 'interest', 'capital gains', 'investment'],
    commonFrequencies: ['Yearly', 'One-time']
  },
  {
    name: 'Rental Income',
    keywords: ['rent', 'rental', 'property income', 'tenant'],
    commonFrequencies: ['Monthly']
  },
  {
    name: 'Business Income',
    keywords: ['business', 'self-employed', 'revenue'],
    commonFrequencies: ['Monthly']
  },
  {
    name: 'Side Hustle',
    keywords: ['side hustle', 'side job', 'extra income'],
    commonFrequencies: ['Weekly', 'Monthly']
  },
  {
    name: 'Bonus',
    keywords: ['bonus', 'commission', 'incentive'],
    commonFrequencies: ['Yearly', 'One-time']
  }
];

// ==================== NEW: NET WORTH SUGGESTIONS ====================

export const ASSET_SUGGESTIONS = [
  {
    name: 'Checking Account',
    keywords: ['checking', 'bank', 'account', 'cash'],
    hint: 'Primary checking account balance'
  },
  {
    name: 'Savings Account',
    keywords: ['savings', 'emergency fund', 'cash reserves'],
    hint: 'High-yield savings or emergency fund'
  },
  {
    name: 'Investment Account',
    keywords: ['brokerage', 'stocks', 'bonds', 'mutual funds', 'etf'],
    hint: 'Taxable investment accounts'
  },
  {
    name: '401(k)',
    keywords: ['401k', 'retirement', 'employer', 'workplace'],
    hint: 'Employer-sponsored retirement account'
  },
  {
    name: 'IRA',
    keywords: ['ira', 'roth', 'traditional', 'retirement'],
    hint: 'Individual Retirement Account'
  },
  {
    name: 'Home Value',
    keywords: ['house', 'home', 'property', 'real estate', 'condo'],
    hint: 'Current market value of primary residence'
  },
  {
    name: 'Vehicle',
    keywords: ['car', 'truck', 'motorcycle', 'auto', 'vehicle'],
    hint: 'Current value of vehicles owned'
  },
  {
    name: 'Cryptocurrency',
    keywords: ['crypto', 'bitcoin', 'ethereum', 'digital'],
    hint: 'Digital currency holdings'
  },
  {
    name: 'Cash',
    keywords: ['cash', 'physical', 'wallet'],
    hint: 'Physical cash on hand'
  },
  {
    name: 'Other Assets',
    keywords: ['other', 'misc', 'miscellaneous'],
    hint: 'Art, collectibles, business equity, etc.'
  }
];

export const LIABILITY_SUGGESTIONS = [
  {
    name: 'Mortgage',
    keywords: ['mortgage', 'home loan', 'house payment'],
    hint: 'Outstanding mortgage balance'
  },
  {
    name: 'Auto Loan',
    keywords: ['car loan', 'auto loan', 'vehicle loan'],
    hint: 'Outstanding auto loan balance'
  },
  {
    name: 'Student Loans',
    keywords: ['student', 'education', 'college', 'university'],
    hint: 'Federal and private student loans'
  },
  {
    name: 'Credit Card',
    keywords: ['credit card', 'visa', 'mastercard', 'amex'],
    hint: 'Total credit card balances'
  },
  {
    name: 'Personal Loan',
    keywords: ['personal loan', 'unsecured', 'signature'],
    hint: 'Personal or signature loans'
  },
  {
    name: 'Home Equity Loan',
    keywords: ['heloc', 'home equity', 'second mortgage'],
    hint: 'Home equity line of credit'
  },
  {
    name: 'Medical Debt',
    keywords: ['medical', 'hospital', 'doctor', 'healthcare'],
    hint: 'Outstanding medical bills'
  },
  {
    name: 'Tax Debt',
    keywords: ['tax', 'irs', 'taxes owed'],
    hint: 'Outstanding tax obligations'
  },
  {
    name: 'Other Debt',
    keywords: ['other', 'misc', 'miscellaneous'],
    hint: 'Any other outstanding debts'
  }
];

// ==================== UPDATED: UNIFIED HELPER FUNCTION ====================

// Helper function to get suggestions by context - NOW INCLUDES NET WORTH
export const getSuggestionsByContext = (context) => {
  switch (context) {
    case 'expenses':
      return EXPENSE_SUGGESTIONS;
    case 'savings':
      return SAVINGS_SUGGESTIONS;
    case 'income':
      return INCOME_SUGGESTIONS;
    case 'assets':           // ← NEW: Net worth assets
      return ASSET_SUGGESTIONS;
    case 'liabilities':      // ← NEW: Net worth liabilities  
      return LIABILITY_SUGGESTIONS;
    default:
      return [];
  }
};

// Store custom categories for future use - WORKS FOR ALL CONTEXTS
export const saveCustomCategory = (context, category) => {
  const storageKey = `customCategories_${context}`;
  const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
  
  if (!existing.find(c => c.name.toLowerCase() === category.name.toLowerCase())) {
    existing.push({
      name: category.name,
      frequency: category.frequency,
      custom: true
    });
    localStorage.setItem(storageKey, JSON.stringify(existing));
  }
};

// Load custom categories along with defaults - WORKS FOR ALL CONTEXTS
export const loadCategoriesWithCustom = (context) => {
  const defaults = getSuggestionsByContext(context);
  const storageKey = `customCategories_${context}`;
  const custom = JSON.parse(localStorage.getItem(storageKey) || '[]');
  
  return [...defaults, ...custom];
};
