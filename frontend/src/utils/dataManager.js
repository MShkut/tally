// frontend/src/utils/dataManager.js
// Data Manager - Handle localStorage or container API persistence

import { ContainerStorage } from './containerStorage';

const STORAGE_KEYS = {
  USER_DATA: 'financeTracker_userData',
  TRANSACTIONS: 'financeTracker_transactions',
  GIFT_DATA: 'financeTracker_giftData',
  NET_WORTH_ITEMS: 'financeTracker_netWorthItems',
  NET_WORTH_HISTORY: 'financeTracker_netWorthHistory',
  MERCHANT_MAPPINGS: 'merchantMappings',
  CATEGORY_MAPPINGS: 'tally_categoryMappings',
  APP_VERSION: 'financeTracker_version'
};

class DataManager {
  constructor() {
    this.currentVersion = '1.0.0';
    this.containerMode = false;
    this.containerData = null;
    this.initializeStorage();
  }

  async initializeStorage() {
    // Check if we're running in container mode
    await this.detectContainerMode();

    if (this.containerMode) {
      if (import.meta.env.DEV) {
        console.log('🐳 Running in container mode - data will load after authentication');
      }
      // Initialize empty container data - will be loaded after login
      this.containerData = {
        userData: {},
        transactions: [],
        netWorthItems: [],
        giftData: { people: [], gifts: [] },
        version: this.currentVersion
      };
    } else {
      if (import.meta.env.DEV) {
        console.log('💾 Running in localStorage mode');
      }
      // Check if we need to migrate data format
      const savedVersion = localStorage.getItem(STORAGE_KEYS.APP_VERSION);
      if (!savedVersion) {
        localStorage.setItem(STORAGE_KEYS.APP_VERSION, this.currentVersion);
      }

      // Migrate old net worth data to new format if needed
      this.migrateNetWorthData();
    }
  }

  async detectContainerMode() {
    try {
      const isHealthy = await ContainerStorage.healthCheck();
      this.containerMode = isHealthy;
    } catch (error) {
      this.containerMode = false;
    }
  }

  async loadFromContainer() {
    if (!this.containerMode) {
      if (import.meta.env.DEV) {
        console.log('Not in container mode, skipping container data load');
      }
      return;
    }

    try {
      this.containerData = await ContainerStorage.loadBudgetData();
      if (import.meta.env.DEV) {
        console.log('📦 Loaded data from container:', this.containerData);
      }
    } catch (error) {
      console.error('Failed to load from container:', error);
      this.containerData = {
        userData: {},
        transactions: [],
        netWorthItems: [],
        giftData: { people: [], gifts: [] },
        version: this.currentVersion
      };
    }
  }

  // Method to be called after authentication
  async syncFromContainer() {
    if (this.containerMode) {
      if (import.meta.env.DEV) {
        console.log('🔄 Syncing data from container after authentication...');
      }
      await this.loadFromContainer();
    }
  }

  async saveToContainer() {
    if (!this.containerMode) return;

    try {
      await ContainerStorage.saveBudgetData(this.containerData);
      if (import.meta.env.DEV) {
        console.log('💾 Saved data to container');
      }
    } catch (error) {
      console.error('Failed to save to container:', error);
      throw error;
    }
  }

  migrateNetWorthData() {
    const userData = this.loadUserData();
    if (!userData?.netWorth) return;
    
    const existingItems = localStorage.getItem(STORAGE_KEYS.NET_WORTH_ITEMS);
    if (existingItems) return; // Already migrated
    
    // Convert old format to new format
    const items = [];
    const timestamp = userData.netWorth.lastUpdated || new Date().toISOString();
    
    // Convert assets
    (userData.netWorth.assets || []).forEach(asset => {
      items.push({
        id: `asset-${Date.now()}-${Math.random()}`,
        name: asset.name,
        type: 'asset',
        currentValue: parseFloat(asset.amount) || 0,
        createdAt: timestamp,
        lastUpdated: timestamp,
        history: [{
          date: timestamp,
          value: parseFloat(asset.amount) || 0,
          source: 'migration',
          note: 'Migrated from old format'
        }]
      });
    });
    
    // Convert liabilities
    (userData.netWorth.liabilities || []).forEach(liability => {
      items.push({
        id: `liability-${Date.now()}-${Math.random()}`,
        name: liability.name,
        type: 'liability',
        currentValue: parseFloat(liability.amount) || 0,
        createdAt: timestamp,
        lastUpdated: timestamp,
        history: [{
          date: timestamp,
          value: parseFloat(liability.amount) || 0,
          source: 'migration',
          note: 'Migrated from old format'
        }]
      });
    });
    
    // Save migrated data
    localStorage.setItem(STORAGE_KEYS.NET_WORTH_ITEMS, JSON.stringify(items));
    
    // Create initial history entry
    this.updateNetWorthHistory();
  }

  // ==================== USER DATA ====================

  async saveUserData(data) {
    try {
      const userData = {
        ...data,
        lastUpdated: new Date().toISOString(),
        version: this.currentVersion
      };

      if (this.containerMode) {
        this.containerData.userData = userData;
        await this.saveToContainer();
      } else {
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
      }

      if (import.meta.env.DEV) {
        console.log('💾 User data saved:', userData);
      }
      return true;
    } catch (error) {
      console.error('❌ Failed to save user data:', error);
      return false;
    }
  }

  loadUserData() {
    try {
      if (this.containerMode) {
        return this.containerData?.userData || null;
      }

      const savedData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
      if (!savedData) return null;

      const userData = JSON.parse(savedData);
      if (import.meta.env.DEV) {
        console.log('📖 User data loaded:', userData);
      }
      return userData;
    } catch (error) {
      console.error('❌ Failed to load user data:', error);
      return null;
    }
  }

  clearUserData() {
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    localStorage.removeItem(STORAGE_KEYS.MERCHANT_MAPPINGS);
    localStorage.removeItem(STORAGE_KEYS.CATEGORY_MAPPINGS);
    
    // Clear dynamic custom category keys
    const contexts = ['expenses', 'savings', 'income', 'assets', 'liabilities'];
    contexts.forEach(context => {
      localStorage.removeItem(`customCategories_${context}`);
    });


    if (import.meta.env.DEV) {
      console.log('🗑️ User data and all category mappings cleared');
    }
  }

  // ==================== TRANSACTIONS ====================

  async saveTransactions(transactions) {
    try {
      if (this.containerMode) {
        this.containerData.transactions = transactions;
        await this.saveToContainer();
      } else {
        const transactionData = {
          transactions,
          lastUpdated: new Date().toISOString(),
          count: transactions.length
        };
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactionData));
      }

      if (import.meta.env.DEV) {
        console.log(`💾 ${transactions.length} transactions saved`);
      }
      return true;
    } catch (error) {
      console.error('❌ Failed to save transactions:', error);
      return false;
    }
  }

  loadTransactions() {
    try {
      if (this.containerMode) {
        return this.containerData?.transactions || [];
      }

      const savedData = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (!savedData) return [];

      const transactionData = JSON.parse(savedData);
      if (import.meta.env.DEV) {
        console.log(`📖 ${transactionData.count || 0} transactions loaded`);
      }
      return transactionData.transactions || [];
    } catch (error) {
      console.error('❌ Failed to load transactions:', error);
      return [];
    }
  }

  addTransaction(transaction) {
    const transactions = this.loadTransactions();
    const newTransaction = {
      ...transaction,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    transactions.push(newTransaction);
    this.saveTransactions(transactions);
    return newTransaction;
  }

  updateTransaction(id, updates) {
    const transactions = this.loadTransactions();
    const index = transactions.findIndex(t => t.id === id);
    if (index !== -1) {
      transactions[index] = { ...transactions[index], ...updates };
      this.saveTransactions(transactions);
      return transactions[index];
    }
    return null;
  }

  deleteTransaction(id) {
    const transactions = this.loadTransactions();
    const filtered = transactions.filter(t => t.id !== id);
    this.saveTransactions(filtered);
    return filtered.length < transactions.length;
  }

  saveCategoryMappings(mappings) {
  try {
    localStorage.setItem('tally_categoryMappings', JSON.stringify(mappings));
    return true;
  } catch (error) {
    console.error('Failed to save category mappings:', error);
    return false;
  }
}

  loadCategoryMappings() {
    try {
      const saved = localStorage.getItem('tally_categoryMappings');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Failed to load category mappings:', error);
      return {};
    }
  }

  // ==================== NET WORTH ====================

  loadNetWorthItems() {
    try {
      if (this.containerMode) {
        return this.containerData?.netWorthItems || [];
      }

      const savedData = localStorage.getItem(STORAGE_KEYS.NET_WORTH_ITEMS);
      if (!savedData) return [];
      return JSON.parse(savedData);
    } catch (error) {
      console.error('❌ Failed to load net worth items:', error);
      return [];
    }
  }

  async saveNetWorthItems(items) {
    try {
      if (this.containerMode) {
        this.containerData.netWorthItems = items;
        await this.saveToContainer();
      } else {
        localStorage.setItem(STORAGE_KEYS.NET_WORTH_ITEMS, JSON.stringify(items));
      }

      await this.updateNetWorthHistory();
      return true;
    } catch (error) {
      console.error('❌ Failed to save net worth items:', error);
      return false;
    }
  }

  addNetWorthItem(item) {
    const items = this.loadNetWorthItems();
    items.push(item);
    this.saveNetWorthItems(items);
    return item;
  }

  updateNetWorthItemValue(itemId, newValue, note = '') {
    const items = this.loadNetWorthItems();
    const index = items.findIndex(item => item.id === itemId);
    
    if (index !== -1) {
      const item = items[index];
      const historyEntry = {
        date: new Date().toISOString(),
        value: newValue,
        source: 'manual',
        note: note
      };
      
      item.currentValue = newValue;
      item.lastUpdated = new Date().toISOString();
      item.history = [...(item.history || []), historyEntry];
      
      items[index] = item;
      this.saveNetWorthItems(items);
      return item;
    }
    return null;
  }

  deleteNetWorthItem(itemId) {
    const items = this.loadNetWorthItems();
    const filtered = items.filter(item => item.id !== itemId);
    this.saveNetWorthItems(filtered);
    return filtered.length < items.length;
  }

  loadNetWorthData() {
    const items = this.loadNetWorthItems();
    const history = this.loadNetWorthHistory();
    
    const assets = items.filter(item => item.type === 'asset');
    const liabilities = items.filter(item => item.type === 'liability');
    
    const totalAssets = assets.reduce((sum, asset) => sum + asset.currentValue, 0);
    const totalLiabilities = liabilities.reduce((sum, liability) => sum + liability.currentValue, 0);
    const netWorth = totalAssets - totalLiabilities;
    
    return {
      assets,
      liabilities,
      totalAssets,
      totalLiabilities,
      netWorth,
      history
    };
  }

  loadNetWorthHistory() {
    try {
      if (this.containerMode) {
        return this.containerData?.netWorthHistory || [];
      }

      const savedData = localStorage.getItem(STORAGE_KEYS.NET_WORTH_HISTORY);
      if (!savedData) return [];
      return JSON.parse(savedData);
    } catch (error) {
      console.error('❌ Failed to load net worth history:', error);
      return [];
    }
  }

  async updateNetWorthHistory() {
    const items = this.loadNetWorthItems();
    const history = this.loadNetWorthHistory();

    const totalAssets = items
      .filter(item => item.type === 'asset')
      .reduce((sum, asset) => sum + asset.currentValue, 0);

    const totalLiabilities = items
      .filter(item => item.type === 'liability')
      .reduce((sum, liability) => sum + liability.currentValue, 0);

    const netWorth = totalAssets - totalLiabilities;

    const historyEntry = {
      date: new Date().toISOString(),
      totalAssets,
      totalLiabilities,
      netWorth,
      itemCount: items.length
    };

    // Add to history
    const updatedHistory = [...history, historyEntry];

    // Keep last 1000 entries (about 3 years of daily updates)
    if (updatedHistory.length > 1000) {
      updatedHistory.shift();
    }

    if (this.containerMode) {
      this.containerData.netWorthHistory = updatedHistory;
      await this.saveToContainer();
    } else {
      localStorage.setItem(STORAGE_KEYS.NET_WORTH_HISTORY, JSON.stringify(updatedHistory));
    }
  }

  // ==================== GIFT DATA ====================

  async saveGiftData(data) {
    try {
      const giftData = {
        ...data,
        lastUpdated: new Date().toISOString(),
        version: this.currentVersion
      };

      if (this.containerMode) {
        this.containerData.giftData = giftData;
        await this.saveToContainer();
      } else {
        localStorage.setItem(STORAGE_KEYS.GIFT_DATA, JSON.stringify(giftData));
      }

      if (import.meta.env.DEV) {
        console.log('💾 Gift data saved:', giftData);
      }
      return true;
    } catch (error) {
      console.error('❌ Failed to save gift data:', error);
      return false;
    }
  }

  loadGiftData() {
    try {
      if (this.containerMode) {
        return this.containerData?.giftData || null;
      }

      const savedData = localStorage.getItem(STORAGE_KEYS.GIFT_DATA);
      if (!savedData) return null;

      const giftData = JSON.parse(savedData);
      if (import.meta.env.DEV) {
        console.log('📖 Gift data loaded:', giftData);
      }
      return giftData;
    } catch (error) {
      console.error('❌ Failed to load gift data:', error);
      return null;
    }
  }

  clearGiftData() {
    localStorage.removeItem(STORAGE_KEYS.GIFT_DATA);
    if (import.meta.env.DEV) {
      console.log('🗑️ Gift data cleared');
    }
  }

  // ==================== HELPER METHODS ====================

  isOnboardingComplete() {
    const userData = this.loadUserData();
    return userData && userData.onboardingComplete === true;
  }

  getBudgetCategories() {
    const userData = this.loadUserData();
    if (!userData || !userData.expenses) return [];
    
    return userData.expenses.expenseCategories || [];
  }

  getMonthlyBudget() {
    const userData = this.loadUserData();
    if (!userData) return 0;
    
    const income = userData.income?.totalYearlyIncome || 0;
    const savings = userData.savingsAllocation?.monthlySavings || 0;
    return (income / 12) - savings;
  }

  exportData() {
    const userData = this.loadUserData();
    const transactions = this.loadTransactions();
    const netWorthData = this.loadNetWorthData();
    const giftData = this.loadGiftData();
    
    return {
      userData,
      transactions,
      netWorthData,
      giftData,
      exportedAt: new Date().toISOString(),
      version: this.currentVersion
    };
  }

  importData(data) {
    try {
      if (data.userData) this.saveUserData(data.userData);
      if (data.transactions) this.saveTransactions(data.transactions);
      if (data.netWorthData?.assets || data.netWorthData?.liabilities) {
        const items = [
          ...(data.netWorthData.assets || []),
          ...(data.netWorthData.liabilities || [])
        ];
        this.saveNetWorthItems(items);
      }
      if (data.giftData) this.saveGiftData(data.giftData);
      return true;
    } catch (error) {
      console.error('❌ Failed to import data:', error);
      return false;
    }
  }

  // ==================== RESET/CLEAR METHODS ====================

  resetAllData() {
    try {
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
      localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
      localStorage.removeItem(STORAGE_KEYS.GIFT_DATA);
      localStorage.removeItem(STORAGE_KEYS.NET_WORTH_ITEMS);
      localStorage.removeItem(STORAGE_KEYS.NET_WORTH_HISTORY);
      localStorage.removeItem(STORAGE_KEYS.MERCHANT_MAPPINGS);
      localStorage.removeItem(STORAGE_KEYS.CATEGORY_MAPPINGS);
      localStorage.removeItem(STORAGE_KEYS.APP_VERSION);
      
      // Clear dynamic custom category keys
      const contexts = ['expenses', 'savings', 'income', 'assets', 'liabilities'];
      contexts.forEach(context => {
        localStorage.removeItem(`customCategories_${context}`);
      });


      if (import.meta.env.DEV) {
        console.log('🗑️ All application data cleared');
      }
      return true;
    } catch (error) {
      console.error('❌ Failed to clear data:', error);
      return false;
    }
  }
}

export const dataManager = new DataManager();
