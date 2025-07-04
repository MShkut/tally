import { useState } from 'react';

export const useTransactionStore = () => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([
    { 
      id: 'salary', 
      name: 'Salary', 
      type: 'income', 
      color: 'bg-green-500',
      keywords: ['salary', 'payroll', 'wages', 'employment', 'pay stub'],
      merchantMappings: new Map()
    },
    { 
      id: 'freelance', 
      name: 'Freelance', 
      type: 'income', 
      color: 'bg-green-400',
      keywords: ['freelance', 'contract', 'consulting', 'commission', 'gig'],
      merchantMappings: new Map()
    },
    { 
      id: 'groceries', 
      name: 'Groceries', 
      type: 'expense', 
      color: 'bg-red-500',
      budget: 600,
      keywords: ['grocery', 'supermarket', 'walmart', 'target', 'costco', 'kroger', 'safeway'],
      merchantMappings: new Map()
    },
    { 
      id: 'dining', 
      name: 'Dining Out', 
      type: 'expense', 
      color: 'bg-red-400',
      budget: 300,
      keywords: ['restaurant', 'cafe', 'mcdonald', 'starbucks', 'food delivery', 'doordash', 'ubereats'],
      merchantMappings: new Map()
    },
    { 
      id: 'transportation', 
      name: 'Transportation', 
      type: 'expense', 
      color: 'bg-blue-500',
      budget: 200,
      keywords: ['uber', 'lyft', 'gas', 'fuel', 'parking', 'metro', 'transit', 'car payment'],
      merchantMappings: new Map()
    },
    { 
      id: 'utilities', 
      name: 'Utilities', 
      type: 'expense', 
      color: 'bg-orange-500',
      budget: 150,
      keywords: ['electric', 'gas company', 'water', 'internet', 'cable', 'phone bill'],
      merchantMappings: new Map()
    },
    { 
      id: 'entertainment', 
      name: 'Entertainment', 
      type: 'expense', 
      color: 'bg-purple-500',
      budget: 150,
      keywords: ['netflix', 'spotify', 'movie', 'theater', 'games', 'subscription'],
      merchantMappings: new Map()
    },
    { 
      id: 'emergency', 
      name: 'Emergency Fund', 
      type: 'savings', 
      color: 'bg-emerald-500',
      keywords: ['emergency', 'savings transfer', 'emergency fund'],
      merchantMappings: new Map()
    }
  ]);
  
  const [importHistory, setImportHistory] = useState([]);
  const [duplicateStrategy, setDuplicateStrategy] = useState('skip');

  return {
    transactions,
    setTransactions,
    categories,
    setCategories,
    importHistory,
    setImportHistory,
    duplicateStrategy,
    setDuplicateStrategy
  };
};

