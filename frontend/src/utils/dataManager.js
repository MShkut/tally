// frontend/src/utils/dataManager.js
// Data Manager - Handle localStorage persistence

const STORAGE_KEYS = {
  USER_DATA: 'financeTracker_userData',
  TRANSACTIONS: 'financeTracker_transactions',
  APP_VERSION: 'financeTracker_version'
};

class DataManager {
  constructor() {
    this.currentVersion = '1.0.0';
    this.initializeStorage();
  }

  initializeStorage() {
    // Check if we need to migrate data format
    const savedVersion = localStorage.getItem(STORAGE_KEYS.APP_VERSION);
    if (!savedVersion) {
      localStorage.setItem(STORAGE_KEYS.APP_VERSION, this.currentVersion);
    }
  }

  // ==================== USER DATA ====================
  
  saveUserData(data) {
    try {
      const userData = {
        ...data,
        lastUpdated: new Date().toISOString(),
        version: this.currentVersion
      };
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
      console.log('💾 User data saved:', userData);
      return true;
    } catch (error) {
      console.error('❌ Failed to save user data:', error);
      return false;
    }
  }

  loadUserData() {
    try {
      const savedData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
      if (!savedData) return null;
      
      const userData = JSON.parse(savedData);
      console.log('📖 User data loaded:', userData);
      return userData;
    } catch (error) {
      console.error('❌ Failed to load user data:', error);
      return null;
    }
  }

  clearUserData() {
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    console.log('🗑️ User data cleared');
  }

  // ==================== TRANSACTIONS ====================

  saveTransactions(transactions) {
    try {
      const transactionData = {
        transactions,
        lastUpdated: new Date().toISOString(),
        count: transactions.length
      };
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactionData));
      console.log(`💾 ${transactions.length} transactions saved`);
      return true;
    } catch (error) {
      console.error('❌ Failed to save transactions:', error);
      return false;
    }
  }

  loadTransactions() {
    try {
      const savedData = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (!savedData) return [];
      
      const transactionData = JSON.parse(savedData);
      console.log(`📖 ${transactionData.count || 0} transactions loaded`);
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
    
    return {
      userData,
      transactions,
      exportedAt: new Date().toISOString(),
      version: this.currentVersion
    };
  }

  importData(data) {
    try {
      if (data.userData) this.saveUserData(data.userData);
      if (data.transactions) this.saveTransactions(data.transactions);
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
      localStorage.removeItem(STORAGE_KEYS.APP_VERSION);
      console.log('🗑️ All application data cleared');
      return true;
    } catch (error) {
      console.error('❌ Failed to clear data:', error);
      return false;
    }
  }
}

export const dataManager = new DataManager();

