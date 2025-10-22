// frontend/src/utils/alphaVantageService.js
// AlphaVantage API service for fetching stock and crypto prices

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
const STORAGE_KEY = 'tally_alphavantage_cache';
const API_KEY_STORAGE = 'tally_alphavantage_apikey';

/**
 * AlphaVantage API service
 * Free tier: 25 API calls per day
 * Price caching to minimize API usage
 */
export class AlphaVantageService {
  constructor() {
    this.cache = this.loadCache();
  }

  /**
   * Get stored API key
   */
  getApiKey() {
    return localStorage.getItem(API_KEY_STORAGE);
  }

  /**
   * Set API key
   */
  setApiKey(apiKey) {
    if (!apiKey || apiKey.trim() === '') {
      localStorage.removeItem(API_KEY_STORAGE);
    } else {
      localStorage.setItem(API_KEY_STORAGE, apiKey.trim());
    }
  }

  /**
   * Check if API key is configured
   */
  hasApiKey() {
    const key = this.getApiKey();
    return key && key.trim().length > 0;
  }

  /**
   * Load price cache from localStorage
   */
  loadCache() {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      return cached ? JSON.parse(cached) : {};
    } catch (error) {
      console.error('[ALPHAVANTAGE] Failed to load cache:', error);
      return {};
    }
  }

  /**
   * Save price cache to localStorage
   */
  saveCache() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.cache));
    } catch (error) {
      console.error('[ALPHAVANTAGE] Failed to save cache:', error);
    }
  }

  /**
   * Get cached price if still valid
   */
  getCachedPrice(symbol, type) {
    const cacheKey = `${type}:${symbol}`;
    const cached = this.cache[cacheKey];

    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > CACHE_DURATION) {
      return null;
    }

    return cached;
  }

  /**
   * Cache price data
   */
  setCachedPrice(symbol, type, price) {
    const cacheKey = `${type}:${symbol}`;
    this.cache[cacheKey] = {
      symbol,
      type,
      price,
      timestamp: Date.now()
    };
    this.saveCache();
  }

  /**
   * Fetch stock price from AlphaVantage
   * Uses GLOBAL_QUOTE endpoint
   */
  async fetchStockPrice(symbol) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('AlphaVantage API key not configured');
    }

    // Check cache first
    const cached = this.getCachedPrice(symbol, 'stock');
    if (cached) {
      console.log(`[ALPHAVANTAGE] Using cached stock price for ${symbol}`);
      return cached.price;
    }

    console.log(`[ALPHAVANTAGE] Fetching stock price for ${symbol}...`);

    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      // Check for API errors
      if (data['Error Message']) {
        throw new Error(`Invalid stock symbol: ${symbol}`);
      }

      if (data['Note']) {
        throw new Error('API rate limit exceeded. Please try again later.');
      }

      const quote = data['Global Quote'];
      if (!quote || !quote['05. price']) {
        throw new Error(`No price data available for ${symbol}`);
      }

      const price = parseFloat(quote['05. price']);

      // Cache the result
      this.setCachedPrice(symbol, 'stock', price);

      return price;
    } catch (error) {
      console.error(`[ALPHAVANTAGE] Failed to fetch stock price for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Fetch crypto price from AlphaVantage
   * Uses CURRENCY_EXCHANGE_RATE endpoint
   */
  async fetchCryptoPrice(symbol, currency = 'USD') {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('AlphaVantage API key not configured');
    }

    // Check cache first
    const cached = this.getCachedPrice(symbol, 'crypto');
    if (cached) {
      console.log(`[ALPHAVANTAGE] Using cached crypto price for ${symbol}`);
      return cached.price;
    }

    console.log(`[ALPHAVANTAGE] Fetching crypto price for ${symbol}...`);

    const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${symbol}&to_currency=${currency}&apikey=${apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      // Check for API errors
      if (data['Error Message']) {
        throw new Error(`Invalid crypto symbol: ${symbol}`);
      }

      if (data['Note']) {
        throw new Error('API rate limit exceeded. Please try again later.');
      }

      const exchangeRate = data['Realtime Currency Exchange Rate'];
      if (!exchangeRate || !exchangeRate['5. Exchange Rate']) {
        throw new Error(`No price data available for ${symbol}`);
      }

      const price = parseFloat(exchangeRate['5. Exchange Rate']);

      // Cache the result
      this.setCachedPrice(symbol, 'crypto', price);

      return price;
    } catch (error) {
      console.error(`[ALPHAVANTAGE] Failed to fetch crypto price for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Fetch price for any item type
   * Returns { price, timestamp }
   */
  async fetchPrice(symbol, type) {
    try {
      let price;

      if (type === 'stock') {
        price = await this.fetchStockPrice(symbol);
      } else if (type === 'crypto') {
        price = await this.fetchCryptoPrice(symbol);
      } else {
        throw new Error(`Unsupported item type: ${type}`);
      }

      return {
        price,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error(`[ALPHAVANTAGE] Failed to fetch price for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Clear all cached prices
   */
  clearCache() {
    this.cache = {};
    this.saveCache();
    console.log('[ALPHAVANTAGE] Price cache cleared');
  }

  /**
   * Get cache info for debugging
   */
  getCacheInfo() {
    const keys = Object.keys(this.cache);
    return {
      count: keys.length,
      items: keys.map(key => {
        const cached = this.cache[key];
        return {
          symbol: cached.symbol,
          type: cached.type,
          price: cached.price,
          age: Math.round((Date.now() - cached.timestamp) / 1000) + 's'
        };
      })
    };
  }
}

// Export singleton instance
export const alphaVantage = new AlphaVantageService();
