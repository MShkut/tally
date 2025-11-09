// API Service - Central API client for backend communication
// Replaces localStorage-based dataManager with backend API calls

const API_BASE = window.location.origin; // Backend runs on same origin in production

class APIService {
  constructor() {
    this.token = null;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
    this.pendingRequests = new Map(); // For request deduplication
    this.requestTimeout = 30000; // 30 second timeout
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
   * Cancel all pending requests
   */
  cancelPendingRequests() {
    for (const [key, controller] of this.pendingRequests.entries()) {
      controller.abort();
      this.pendingRequests.delete(key);
    }
  }

  /**
   * Retry logic with exponential backoff
   */
  async retryRequest(fn, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        // Don't retry on auth errors or user errors (400s)
        if (error.message === 'Session expired' || error.status >= 400 && error.status < 500) {
          throw error;
        }

        // Last attempt, throw error
        if (i === retries - 1) {
          throw error;
        }

        // Wait before retrying (exponential backoff)
        const waitTime = delay * Math.pow(2, i);
        console.log(`[API Retry] Attempt ${i + 1}/${retries} failed, retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  /**
   * Get user-friendly error message
   */
  getFriendlyErrorMessage(error) {
    if (error.name === 'AbortError') {
      return 'Request was cancelled';
    }
    if (error.message === 'Failed to fetch') {
      return 'Cannot connect to server. Please check your internet connection.';
    }
    if (error.message.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }
    if (error.message === 'Session expired') {
      return 'Your session has expired. Please log in again.';
    }
    // Return original message if no friendly version
    return error.message || 'An unexpected error occurred';
  }

  /**
   * Make authenticated API request with caching, timeout, retry, and deduplication
   */
  async request(endpoint, options = {}) {
    const url = `${API_BASE}/api${endpoint}`;
    const method = options.method || 'GET';
    const cacheKey = `${method}:${endpoint}`;
    const requestKey = `${method}:${endpoint}:${JSON.stringify(options.body || '')}`;

    // Check cache for GET requests
    if (method === 'GET' && !options.skipCache) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log(`[API Cache] Hit for ${endpoint}`);
        return cached.data;
      }
    }

    // Request deduplication - if same request is in-flight, return the same promise
    if (this.pendingRequests.has(requestKey)) {
      console.log(`[API Dedupe] Reusing pending request for ${endpoint}`);
      return this.pendingRequests.get(requestKey).promise;
    }

    // Create abort controller for cancellation and timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

    const config = {
      credentials: 'include', // Include cookies
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      signal: controller.signal,
      ...options
    };

    // Add authorization header if token exists
    if (this.token) {
      config.headers['Authorization'] = `Bearer ${this.token}`;
    }

    // Create the request function for retry logic
    const makeRequest = async () => {
      try {
        const response = await fetch(url, config);

        // Clear timeout since request completed
        clearTimeout(timeoutId);

        const data = await response.json();

        if (!data.success) {
          // Token expired - trigger re-auth
          if (data.expired) {
            this.token = null;
            window.location.href = '/login';
            const error = new Error('Session expired');
            error.status = 401;
            throw error;
          }
          const error = new Error(data.error || 'Request failed');
          error.status = response.status;
          throw error;
        }

        // Cache successful GET responses
        if (method === 'GET') {
          this.cache.set(cacheKey, {
            data: data.data,
            timestamp: Date.now()
          });
        } else {
          // Invalidate cache for mutations (POST, PUT, DELETE)
          const baseEndpoint = endpoint.split('?')[0].split('/')[1];
          this.clearCache(baseEndpoint);
        }

        return data.data;
      } catch (error) {
        clearTimeout(timeoutId);

        // Add friendly error message
        error.friendlyMessage = this.getFriendlyErrorMessage(error);

        console.error(`[API Error] ${endpoint}:`, error.friendlyMessage);
        throw error;
      }
    };

    // Store pending request
    const promise = this.retryRequest(makeRequest, 3, 1000);
    this.pendingRequests.set(requestKey, { controller, promise });

    try {
      const result = await promise;
      this.pendingRequests.delete(requestKey);
      return result;
    } catch (error) {
      this.pendingRequests.delete(requestKey);
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
   * Load all transactions with optional filters
   * @param {Object} options - Filter options
   * @param {number} options.limit - Maximum results to return
   * @param {number} options.offset - Number of results to skip
   * @param {string} options.search - Search term for description/merchant
   * @param {string} options.type - Filter by type (Income/Expense/Savings)
   * @param {string} options.category - Filter by category name
   * @param {string} options.dateFilter - Date filter (current-month)
   * @param {string} options.sortBy - Sort field (date/amount/description/category)
   * @param {string} options.sortOrder - Sort order (asc/desc)
   */
  async loadTransactions(options = {}) {
    const {
      limit = 1000,
      offset = 0,
      search = '',
      type = '',
      category = '',
      dateFilter = '',
      sortBy = 'date',
      sortOrder = 'desc'
    } = options;

    // Build query string
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });

    if (search) params.append('search', search);
    if (type) params.append('type', type);
    if (category) params.append('category', category);
    if (dateFilter) params.append('dateFilter', dateFilter);
    if (sortBy) params.append('sortBy', sortBy);
    if (sortOrder) params.append('sortOrder', sortOrder);

    return await this.request(`/transactions?${params.toString()}`);
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

  // ============================================
  // NET WORTH API METHODS
  // ============================================

  /**
   * Get all net worth accounts
   */
  async getNetworthAccounts() {
    return this.request('/api/networth/accounts', { method: 'GET', cache: true });
  }

  /**
   * Create net worth account
   */
  async createNetworthAccount(accountData) {
    const result = await this.request('/api/networth/accounts', {
      method: 'POST',
      body: JSON.stringify(accountData)
    });
    this.clearCache('/api/networth');
    return result;
  }

  /**
   * Get net worth account by ID
   */
  async getNetworthAccount(accountId) {
    return this.request(`/api/networth/accounts/${accountId}`, { method: 'GET', cache: true });
  }

  /**
   * Update net worth account
   */
  async updateNetworthAccount(accountId, updates) {
    const result = await this.request(`/api/networth/accounts/${accountId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    this.clearCache('/api/networth');
    return result;
  }

  /**
   * Delete net worth account
   */
  async deleteNetworthAccount(accountId) {
    const result = await this.request(`/api/networth/accounts/${accountId}`, { method: 'DELETE' });
    this.clearCache('/api/networth');
    return result;
  }

  /**
   * Get holdings for an account
   */
  async getAccountHoldings(accountId) {
    return this.request(`/api/networth/accounts/${accountId}/holdings`, { method: 'GET', cache: true });
  }

  /**
   * Create holding
   */
  async createHolding(accountId, holdingData) {
    const result = await this.request(`/api/networth/accounts/${accountId}/holdings`, {
      method: 'POST',
      body: JSON.stringify(holdingData)
    });
    this.clearCache('/api/networth');
    return result;
  }

  /**
   * Update holding
   */
  async updateHolding(holdingId, updates) {
    const result = await this.request(`/api/networth/holdings/${holdingId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    this.clearCache('/api/networth');
    return result;
  }

  /**
   * Delete holding
   */
  async deleteHolding(holdingId) {
    const result = await this.request(`/api/networth/holdings/${holdingId}`, { method: 'DELETE' });
    this.clearCache('/api/networth');
    return result;
  }

  /**
   * Get transactions for a holding
   */
  async getHoldingTransactions(holdingId) {
    return this.request(`/api/networth/holdings/${holdingId}/transactions`, { method: 'GET', cache: true });
  }

  /**
   * Create holding transaction (buy/sell)
   */
  async createHoldingTransaction(holdingId, transactionData) {
    const result = await this.request(`/api/networth/holdings/${holdingId}/transactions`, {
      method: 'POST',
      body: JSON.stringify(transactionData)
    });
    this.clearCache('/api/networth');
    return result;
  }

  /**
   * Update holding transaction
   */
  async updateHoldingTransaction(transactionId, updates) {
    const result = await this.request(`/api/networth/transactions/${transactionId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    this.clearCache('/api/networth');
    return result;
  }

  /**
   * Delete holding transaction
   */
  async deleteHoldingTransaction(transactionId) {
    const result = await this.request(`/api/networth/transactions/${transactionId}`, { method: 'DELETE' });
    this.clearCache('/api/networth');
    return result;
  }

  /**
   * Batch update prices
   */
  async batchUpdatePrices(updates) {
    const result = await this.request('/api/networth/prices/batch', {
      method: 'POST',
      body: JSON.stringify({ updates })
    });
    this.clearCache('/api/networth');
    return result;
  }

  /**
   * Get price history for holding
   */
  async getHoldingPrices(holdingId) {
    return this.request(`/api/networth/holdings/${holdingId}/prices`, { method: 'GET', cache: true });
  }

  /**
   * Create/update account snapshot
   */
  async createSnapshot(accountId, snapshotData) {
    const result = await this.request(`/api/networth/accounts/${accountId}/snapshots`, {
      method: 'POST',
      body: JSON.stringify(snapshotData)
    });
    this.clearCache('/api/networth');
    return result;
  }

  /**
   * Get snapshots for account
   */
  async getAccountSnapshots(accountId, startDate = null, endDate = null) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const url = `/api/networth/accounts/${accountId}/snapshots${params.toString() ? '?' + params.toString() : ''}`;
    return this.request(url, { method: 'GET', cache: true });
  }

  /**
   * Delete snapshot
   */
  async deleteSnapshot(snapshotId) {
    const result = await this.request(`/api/networth/snapshots/${snapshotId}`, { method: 'DELETE' });
    this.clearCache('/api/networth');
    return result;
  }

  /**
   * Get net worth summary
   */
  async getNetworthSummary() {
    return this.request('/api/networth/summary', { method: 'GET', cache: true });
  }

}


// Export singleton instance
export const apiService = new APIService();

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.apiService = apiService;
}
