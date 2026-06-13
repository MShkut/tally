/**
 * API Service - Centralized Backend Communication Layer
 *
 * This singleton service handles all HTTP communication with the Tally backend API.
 * It provides a type-safe, cached, and resilient interface for data operations.
 *
 * ## Architecture
 *
 * - **Singleton Pattern**: Single instance shared across the application
 * - **Request Caching**: 5-minute cache for GET requests to reduce server load
 * - **Request Deduplication**: Prevents duplicate simultaneous requests
 * - **Retry Logic**: Automatic retry with exponential backoff for network errors
 * - **Timeout Handling**: 30-second timeout for all requests
 * - **Error Normalization**: Converts API errors to user-friendly messages
 *
 * ## Features
 *
 * 1. **Authentication**
 *    - JWT token management
 *    - Automatic token injection in requests
 *    - Session expiration handling
 *
 * 2. **User Data**
 *    - Load/save household configuration
 *    - Settings management
 *    - Data export/import
 *
 * 3. **Transactions**
 *    - CSV bulk import
 *    - CRUD operations
 *    - Advanced filtering and pagination
 *
 * 4. **Categories**
 *    - Merchant-to-category mappings
 *    - Custom category management
 *
 * 5. **Resilience**
 *    - Automatic retries (3 attempts with exponential backoff)
 *    - Request deduplication (prevents race conditions)
 *    - Request cancellation support
 *    - Network timeout protection
 *
 * ## Usage
 *
 * ```js
 * import { apiService } from 'utils/apiService';
 *
 * // Authentication
 * await apiService.login(password);
 *
 * // User Data
 * const userData = await apiService.getUserData();
 * await apiService.saveUserData(updatedData);
 *
 * // Transactions
 * const transactions = await apiService.getTransactions({ limit: 100 });
 * await apiService.bulkImportTransactions(csvData);
 * ```
 *
 * ## Error Handling
 *
 * The service throws errors for failed requests. Callers should wrap API calls
 * in try-catch blocks:
 *
 * ```js
 * try {
 *   await apiService.saveUserData(data);
 * } catch (error) {
 *   console.error('Save failed:', error.message);
 *   // error.message contains user-friendly error text
 * }
 * ```
 *
 * ## Performance Optimizations
 *
 * - **Caching**: GET requests are cached for 5 minutes
 * - **Deduplication**: Identical concurrent requests return the same Promise
 * - **Timeouts**: Long-running requests are automatically aborted
 *
 * @class APIService
 */

// Support for Electron desktop app
// In Electron local mode: uses http://localhost:3001
// In Electron remote mode: uses configured server URL
// In browser/Docker/Start9: uses same origin
// Use function instead of constant to avoid race condition with Electron config injection
function getAPIBase() {
  if (window.electronAPI?.isElectron) {
    return window.electronAPI.mode === 'local'
      ? 'http://localhost:3001'
      : window.electronAPI.serverUrl;
  }
  return window.location.origin;
}

class APIService {
  constructor() {
    this.token = null; // JWT authentication token
    this.cache = new Map(); // Response cache (key: URL, value: {data, timestamp})
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
    this.pendingRequests = new Map(); // Request deduplication map
    this.requestTimeout = 30000; // 30 second timeout for all requests
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
    const url = `${getAPIBase()}/api${endpoint}`;
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
    const response = await fetch(`${getAPIBase()}/api/auth/status`);
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
   * Change password for authenticated user
   */
  async changePassword(currentPassword, newPassword) {
    return await this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  }

  /**
   * Verify the authenticated user's account password (no state change).
   * Used by the export flow to confirm the password before using it to
   * encrypt the backup.
   */
  async verifyPassword(password) {
    const data = await this.request('/auth/verify-password', {
      method: 'POST',
      body: JSON.stringify({ password })
    });
    return data.valid;
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
   * Reset all data (destructive operation, requires password confirmation)
   */
  async resetAllData(password) {
    return await this.request('/data/reset', {
      method: 'POST',
      body: JSON.stringify({ password })
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
