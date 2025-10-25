// frontend/src/utils/currencyConversionService.js
// Currency conversion service using frankfurter.app (free, no API key needed)

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour cache for exchange rates
const STORAGE_KEY = 'tally_currency_rates_cache';
const BASE_URL = 'https://api.frankfurter.app';

// Map stock exchange suffixes to their native currencies
const EXCHANGE_CURRENCIES = {
  'TO': 'CAD',     // Toronto Stock Exchange
  'TSX': 'CAD',    // Toronto Stock Exchange
  'TSE': 'CAD',    // Toronto Stock Exchange
  'L': 'GBP',      // London Stock Exchange
  'LON': 'GBP',    // London Stock Exchange
  'PA': 'EUR',     // Euronext Paris
  'DE': 'EUR',     // XETRA (Germany)
  'F': 'EUR',      // Frankfurt Stock Exchange
  'HK': 'HKD',     // Hong Kong Stock Exchange
  'T': 'JPY',      // Tokyo Stock Exchange
  'AX': 'AUD',     // Australian Securities Exchange
  // Add more as needed
};

/**
 * Currency conversion service using frankfurter.app
 * Free tier: No API key required, updates daily
 * Rate limit: No strict limits for reasonable use
 */
export class CurrencyConversionService {
  constructor() {
    this.cache = this.loadCache();
  }

  /**
   * Load exchange rate cache from localStorage
   */
  loadCache() {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      return cached ? JSON.parse(cached) : {};
    } catch (error) {
      console.error('[CURRENCY] Failed to load cache:', error);
      return {};
    }
  }

  /**
   * Save exchange rate cache to localStorage
   */
  saveCache() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.cache));
    } catch (error) {
      console.error('[CURRENCY] Failed to save cache:', error);
    }
  }

  /**
   * Get cached exchange rate if still valid
   */
  getCachedRate(from, to) {
    const cacheKey = `${from}-${to}`;
    const cached = this.cache[cacheKey];

    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > CACHE_DURATION) {
      return null;
    }

    return cached.rate;
  }

  /**
   * Cache exchange rate
   */
  setCachedRate(from, to, rate) {
    const cacheKey = `${from}-${to}`;
    this.cache[cacheKey] = {
      from,
      to,
      rate,
      timestamp: Date.now()
    };
    this.saveCache();
  }

  /**
   * Detect stock's native currency from ticker symbol
   * @param {string} ticker - Stock ticker (e.g., 'VFV.TO', 'AAPL', 'HSBA.L')
   * @returns {string} Native currency code (e.g., 'CAD', 'USD', 'GBP')
   */
  detectStockCurrency(ticker) {
    if (!ticker) return 'USD';

    // Check if ticker has an exchange suffix
    const parts = ticker.split('.');
    if (parts.length > 1) {
      const exchange = parts[1].toUpperCase();
      return EXCHANGE_CURRENCIES[exchange] || 'USD';
    }

    // Default to USD for tickers without suffix (assume NYSE/NASDAQ)
    return 'USD';
  }

  /**
   * Fetch exchange rate from frankfurter.app
   * @param {string} from - Source currency code (e.g., 'CAD')
   * @param {string} to - Target currency code (e.g., 'USD')
   * @returns {Promise<number>} Exchange rate
   */
  async fetchExchangeRate(from, to) {
    // Same currency, no conversion needed
    if (from.toUpperCase() === to.toUpperCase()) {
      return 1.0;
    }

    const fromUpper = from.toUpperCase();
    const toUpper = to.toUpperCase();

    // Check cache first
    const cached = this.getCachedRate(fromUpper, toUpper);
    if (cached) {
      console.log(`[CURRENCY] Using cached rate ${fromUpper}→${toUpper}: ${cached}`);
      return cached;
    }

    console.log(`[CURRENCY] Fetching exchange rate ${fromUpper}→${toUpper}...`);

    const url = `${BASE_URL}/latest?from=${fromUpper}&to=${toUpper}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Currency API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.rates || !data.rates[toUpper]) {
        throw new Error(`No exchange rate available for ${fromUpper}→${toUpper}`);
      }

      const rate = data.rates[toUpper];

      // Cache the result
      this.setCachedRate(fromUpper, toUpper, rate);

      console.log(`[CURRENCY] ✅ Fetched rate ${fromUpper}→${toUpper}: ${rate}`);

      return rate;
    } catch (error) {
      console.error(`[CURRENCY] Failed to fetch exchange rate ${fromUpper}→${toUpper}:`, error);
      throw error;
    }
  }

  /**
   * Convert amount from one currency to another
   * @param {number} amount - Amount to convert
   * @param {string} from - Source currency code
   * @param {string} to - Target currency code
   * @returns {Promise<number>} Converted amount
   */
  async convert(amount, from, to) {
    const rate = await this.fetchExchangeRate(from, to);
    return amount * rate;
  }

  /**
   * Convert stock price to user's preferred currency
   * Automatically detects stock's native currency from ticker
   * @param {number} price - Stock price in native currency
   * @param {string} ticker - Stock ticker (e.g., 'VFV.TO', 'AAPL')
   * @param {string} targetCurrency - User's preferred currency
   * @returns {Promise<number>} Converted price
   */
  async convertStockPrice(price, ticker, targetCurrency) {
    const nativeCurrency = this.detectStockCurrency(ticker);

    if (nativeCurrency === targetCurrency.toUpperCase()) {
      // No conversion needed
      return price;
    }

    console.log(`[CURRENCY] Converting ${ticker} from ${nativeCurrency} to ${targetCurrency}`);
    return this.convert(price, nativeCurrency, targetCurrency);
  }

  /**
   * Clear all cached exchange rates
   */
  clearCache() {
    this.cache = {};
    this.saveCache();
    console.log('[CURRENCY] Exchange rate cache cleared');
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
          pair: `${cached.from}→${cached.to}`,
          rate: cached.rate,
          age: Math.round((Date.now() - cached.timestamp) / 1000) + 's'
        };
      })
    };
  }
}

// Export singleton instance
export const currencyConverter = new CurrencyConversionService();
