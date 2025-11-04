// API Service - Central API client for backend communication
// Replaces localStorage-based dataManager with backend API calls

const API_BASE = window.location.origin; // Backend runs on same origin in production

class APIService {
  constructor() {
    this.token = null;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
  }

  /**
   * Clear cache for a specific endpoint or all cache
   */
  clearCache(endpoint = null) {
    if (endpoint) {
      // Clear specific endpoint cache
      for (const key of this.cache.keys()) {
        if (key.includes(endpoint)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.cache.clear();
    }
  }

  /**
   * Make authenticated API request with caching
   */
  async request(endpoint, options = {}) {
    const url = `${API_BASE}/api${endpoint}`;
    const method = options.method || 'GET';
    const cacheKey = `${method}:${endpoint}`;

    // Check cache for GET requests
    if (method === 'GET' && !options.skipCache) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log(`[API Cache] Hit for ${endpoint}`);
        return cached.data;
      }
    }

    const config = {
      credentials: 'include', // Include cookies
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    // Add authorization header if token exists
    if (this.token) {
      config.headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!data.success) {
        // Token expired - trigger re-auth
        if (data.expired) {
          this.token = null;
          window.location.href = '/login';
          throw new Error('Session expired');
        }
        throw new Error(data.error || 'Request failed');
      }

      // Cache successful GET responses
      if (method === 'GET') {
        this.cache.set(cacheKey, {
          data: data.data,
          timestamp: Date.now()
        });
      } else {
        // Invalidate cache for mutations (POST, PUT, DELETE)
        // Clear related endpoint caches
        const baseEndpoint = endpoint.split('?')[0].split('/')[1]; // Get base resource
        this.clearCache(baseEndpoint);
      }

      return data.data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // ==================== AUTHENTICATION ====================

  /**
   * Check if user is registered
   */
  async checkRegistrationStatus() {
    const response = await fetch(`${API_BASE}/api/auth/status`);
    const data = await response.json();
    return data.data.registered;
  }

  /**
   * Register new user
   */
  async register(householdName, password) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ householdName, password })
    });
    this.token = data.token;
    return data.user;
  }

  /**
   * Login user
   */
  async login(password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password })
    });
    this.token = data.token;
    return data.user;
  }

  /**
   * Logout user
   */
  async logout() {
    await this.request('/auth/logout', { method: 'POST' });
    this.token = null;
  }

  /**
   * Get current user
   */
  async getCurrentUser() {
    return await this.request('/auth/me');
  }

  // ==================== USER DATA ====================

  /**
   * Load user data (household, income, expenses, savings)
   */
  async loadUserData() {
    return await this.request('/user');
  }

  /**
   * Save user data
   */
  async saveUserData(data) {
    return await this.request('/user', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // ==================== SETTINGS ====================

  /**
   * Load settings
   */
  async loadSettings() {
    return await this.request('/settings');
  }

  /**
   * Save settings
   */
  async saveSettings(settings) {
    return await this.request('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  }

  // ==================== TRANSACTIONS ====================

  /**
   * Load all transactions
   */
  async loadTransactions(limit = 1000, offset = 0) {
    return await this.request(`/transactions?limit=${limit}&offset=${offset}`);
  }

  /**
   * Save transactions (bulk import)
   */
  async saveTransactions(transactions) {
    return await this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify({ transactions })
    });
  }

  /**
   * Update single transaction
   */
  async updateTransaction(id, transaction) {
    return await this.request(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(transaction)
    });
  }

  /**
   * Delete transaction
   */
  async deleteTransaction(id) {
    return await this.request(`/transactions/${id}`, {
      method: 'DELETE'
    });
  }

  /**
   * Bulk delete multiple transactions
   */
  async bulkDeleteTransactions(transactionIds) {
    return await this.request('/transactions/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ transactionIds })
    });
  }

  // ==================== GIFT DATA ====================

  /**
   * Load gift data
   */
  async loadGiftData() {
    return await this.request('/gifts');
  }

  /**
   * Save gift data
   */
  async saveGiftData(data) {
    return await this.request('/gifts', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // ==================== CATEGORY MAPPINGS ====================

  /**
   * Load category mappings
   */
  async loadCategoryMappings() {
    return await this.request('/categories/mappings');
  }

  /**
   * Save category mappings
   */
  async saveCategoryMappings(mappings) {
    return await this.request('/categories/mappings', {
      method: 'PUT',
      body: JSON.stringify(mappings)
    });
  }

  /**
   * Load custom categories for context
   */
  async loadCustomCategories(context) {
    return await this.request(`/categories/custom/${context}`);
  }

  /**
   * Save custom categories for context
   */
  async saveCustomCategories(context, categories) {
    return await this.request(`/categories/custom/${context}`, {
      method: 'PUT',
      body: JSON.stringify(categories)
    });
  }

  // ==================== DATA MANAGEMENT ====================

  /**
   * Export all data
   */
  async exportData() {
    return await this.request('/data/export');
  }

  /**
   * Import data (replaces all existing data)
   */
  async importData(data) {
    return await this.request('/data/import', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * Reset all data (destructive operation)
   */
  async resetAllData() {
    return await this.request('/data/reset', {
      method: 'POST'
    });
  }

  // ==================== HELPER METHODS ====================

  /**
   * Check if onboarding is complete
   */
  async isOnboardingComplete() {
    try {
      const userData = await this.loadUserData();
      return userData && userData.onboardingComplete === true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get budget categories
   */
  async getBudgetCategories() {
    const userData = await this.loadUserData();
    if (!userData || !userData.expenses) return [];
    return userData.expenses.expenseCategories || [];
  }

  /**
   * Get monthly budget
   */
  async getMonthlyBudget() {
    const userData = await this.loadUserData();
    if (!userData) return 0;

    const income = userData.income?.totalYearlyIncome || 0;
    const savings = userData.savingsAllocation?.monthlySavings || 0;
    return (income / 12) - savings;
  }

}

// Export singleton instance
export const apiService = new APIService();

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.apiService = apiService;
}
