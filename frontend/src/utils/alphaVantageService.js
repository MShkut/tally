// frontend/src/utils/alphaVantageService.js
// AlphaVantage API service for fetching stock and crypto prices

import { dataManager } from './dataManager';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
const STORAGE_KEY = 'tally_alphavantage_cache';

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
   * Get stored API key from settings
   * Uses dataManager to work in both dev and Start9 container modes
   */
  getApiKey() {
    try {
      const settings = dataManager.loadSettings();
      return settings?.alphaVantageApiKey || null;
    } catch (error) {
      console.error('[ALPHAVANTAGE] Failed to get API key:', error);
      return null;
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

    console.log('[ALPHAVANTAGE] DEBUG - API Key retrieved:', apiKey ? `${apiKey.substring(0, 8)}...` : 'NULL');

    // Check cache first
    const cached = this.getCachedPrice(symbol, 'stock');
    if (cached) {
      console.log(`[ALPHAVANTAGE] Using cached stock price for ${symbol}`);
      return cached.price;
    }

    console.log(`[ALPHAVANTAGE] Fetching stock price for ${symbol}...`);

    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
    console.log('[ALPHAVANTAGE] DEBUG - Full URL:', url);

    try {
      const response = await fetch(url);
      const data = await response.json();

      console.log('[ALPHAVANTAGE] DEBUG - API Response:', data);

      // Check for API errors
      if (data['Error Message']) {
        throw new Error(`Invalid stock symbol: ${symbol}`);
      }

      if (data['Note']) {
        throw new Error('API rate limit exceeded. Please try again later.');
      }

      // Check for Information message (rate limit warning)
      if (data['Information']) {
        console.warn('[ALPHAVANTAGE] Rate limit warning:', data['Information']);
        throw new Error('Alpha Vantage API rate limit reached (25 requests/day on free tier). Please wait until tomorrow or upgrade your API key.');
      }

      const quote = data['Global Quote'];
      if (!quote || !quote['05. price']) {
        console.log('[ALPHAVANTAGE] DEBUG - Quote data missing. Full response:', JSON.stringify(data, null, 2));
        throw new Error(`No price data available for ${symbol}. Alpha Vantage may not support this ticker.`);
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
   * NOTE: Crypto price fetching removed from AlphaVantage service
   * AlphaVantage no longer supports cryptocurrency in free tier
   * Use CoinGecko service instead (coinGeckoService.js)
   */

  /**
   * Fetch price for stocks only
   * For crypto, use CoinGecko service instead
   * Returns { price, timestamp }
   */
  async fetchPrice(symbol, type) {
    try {
      if (type !== 'stock') {
        throw new Error(`AlphaVantage only supports stocks. For crypto, use CoinGecko service.`);
      }

      const price = await this.fetchStockPrice(symbol);

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

  /**
   * Fetch daily historical stock prices
   * Returns full price history for charting
   * Uses TIME_SERIES_DAILY endpoint
   *
   * @param {string} symbol - Stock ticker (e.g., 'AAPL')
   * @param {string} outputsize - 'compact' (100 days) or 'full' (20+ years)
   * @returns {Object} - Price history { 'YYYY-MM-DD': closePrice }
   */
  async fetchStockDailyHistory(symbol, outputsize = 'full') {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('AlphaVantage API key not configured');
    }

    console.log(`[ALPHAVANTAGE] Fetching daily history for ${symbol}...`);

    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=${outputsize}&apikey=${apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      // Check for API errors
      if (data['Error Message']) {
        throw new Error(`Invalid stock symbol: ${symbol}`);
      }

      if (data['Note']) {
        const message = data['Note'];
        if (message.includes('premium') || message.includes('upgrade')) {
          throw new Error(`This stock requires a premium Alpha Vantage subscription. Symbol: ${symbol}`);
        }
        throw new Error('API rate limit exceeded (25 calls/day on free tier). Please try again later.');
      }

      if (data['Information']) {
        throw new Error(`API limit: ${data['Information']}`);
      }

      const timeSeries = data['Time Series (Daily)'];
      if (!timeSeries) {
        console.error('[ALPHAVANTAGE] API response:', data);
        throw new Error(`No historical data available for ${symbol}. This may be due to: 1) API rate limit reached, 2) Stock not supported on free tier, or 3) Invalid symbol.`);
      }

      // Convert to our format: { 'YYYY-MM-DD': closePrice }
      const priceHistory = {};
      for (const [date, values] of Object.entries(timeSeries)) {
        priceHistory[date] = parseFloat(values['4. close']);
      }

      const dates = Object.keys(priceHistory).sort();
      console.log(`[ALPHAVANTAGE] Fetched ${dates.length} daily prices for ${symbol} (${dates[0]} to ${dates[dates.length - 1]})`);

      return priceHistory;
    } catch (error) {
      console.error(`[ALPHAVANTAGE] Failed to fetch daily history for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Fetch intraday stock prices for current day
   * Returns prices at 5-minute intervals
   * Uses TIME_SERIES_INTRADAY endpoint
   *
   * @param {string} symbol - Stock ticker (e.g., 'AAPL')
   * @returns {Object} - Intraday prices { 'YYYY-MM-DD HH:MM:SS': closePrice }
   */
  async fetchStockIntradayHistory(symbol) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('AlphaVantage API key not configured');
    }

    console.log(`[ALPHAVANTAGE] Fetching intraday data for ${symbol}...`);

    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&apikey=${apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      // Check for API errors
      if (data['Error Message']) {
        throw new Error(`Invalid stock symbol: ${symbol}`);
      }

      if (data['Note']) {
        const message = data['Note'];
        if (message.includes('premium') || message.includes('upgrade')) {
          throw new Error(`Intraday data requires premium subscription. Symbol: ${symbol}`);
        }
        throw new Error('API rate limit exceeded (25 calls/day on free tier). Please try again later.');
      }

      if (data['Information']) {
        throw new Error(`API limit: ${data['Information']}`);
      }

      const timeSeries = data['Time Series (5min)'];
      if (!timeSeries) {
        console.error('[ALPHAVANTAGE] Intraday API response:', data);
        throw new Error(`No intraday data available for ${symbol}. May not be supported on free tier or rate limit reached.`);
      }

      // Convert to our format: { 'YYYY-MM-DD HH:MM:SS': closePrice }
      const intradayPrices = {};
      for (const [datetime, values] of Object.entries(timeSeries)) {
        intradayPrices[datetime] = parseFloat(values['4. close']);
      }

      const times = Object.keys(intradayPrices).sort();
      console.log(`[ALPHAVANTAGE] Fetched ${times.length} intraday prices for ${symbol}`);

      return intradayPrices;
    } catch (error) {
      console.error(`[ALPHAVANTAGE] Failed to fetch intraday data for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * NOTE: Bitcoin/crypto methods removed
   * AlphaVantage no longer supports cryptocurrency in free tier
   * Use CoinGecko service instead (coinGeckoService.js)
   * - coinGecko.fetchCryptoHistory() for historical data
   * - coinGecko.fetchCryptoPrice() for current price
   */

  /**
   * Get latest price from intraday or daily data (stocks only)
   * Prioritizes intraday (more current) with fallback to daily
   *
   * @param {string} symbol - Stock ticker
   * @returns {number} - Latest price
   */
  async getLatestPrice(symbol) {
    try {
      // For stocks, try intraday first, then fallback to daily
      try {
        const intradayPrices = await this.fetchStockIntradayHistory(symbol);
        const times = Object.keys(intradayPrices).sort();
        return intradayPrices[times[times.length - 1]];
      } catch (error) {
        // Fallback to daily price if intraday fails
        console.log(`[ALPHAVANTAGE] Intraday failed, falling back to daily for ${symbol}`);
        const dailyPrices = await this.fetchStockDailyHistory(symbol, 'compact');
        const dates = Object.keys(dailyPrices).sort();
        return dailyPrices[dates[dates.length - 1]];
      }
    } catch (error) {
      console.error(`[ALPHAVANTAGE] Failed to get latest price for ${symbol}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const alphaVantage = new AlphaVantageService();
