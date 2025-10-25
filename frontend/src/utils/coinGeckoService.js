// frontend/src/utils/coinGeckoService.js
// CoinGecko API service for fetching cryptocurrency prices
// Free tier: 10-50 calls/minute, no API key required

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
const STORAGE_KEY = 'tally_coingecko_cache';
const BASE_URL = 'https://api.coingecko.com/api/v3';

// Map common ticker symbols to CoinGecko IDs
const TICKER_TO_COINGECKO_ID = {
  'BTC': 'bitcoin',
  'BITCOIN': 'bitcoin',
  'ETH': 'ethereum',
  'ETHEREUM': 'ethereum',
  'USDT': 'tether',
  'BNB': 'binancecoin',
  'SOL': 'solana',
  'ADA': 'cardano',
  'XRP': 'ripple',
  'DOT': 'polkadot',
  'DOGE': 'dogecoin',
  'AVAX': 'avalanche-2',
  'MATIC': 'matic-network',
  'LINK': 'chainlink',
  'UNI': 'uniswap',
  'LTC': 'litecoin',
  'BCH': 'bitcoin-cash',
  'XLM': 'stellar',
  'ALGO': 'algorand',
  'ATOM': 'cosmos'
};

/**
 * CoinGecko API service for cryptocurrency price data
 * Free tier: 10-50 calls per minute
 * No API key required
 * Attribution required in UI: "Powered by CoinGecko"
 */
export class CoinGeckoService {
  constructor() {
    this.cache = this.loadCache();
  }

  /**
   * Load price cache from localStorage
   */
  loadCache() {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      return cached ? JSON.parse(cached) : {};
    } catch (error) {
      console.error('[COINGECKO] Failed to load cache:', error);
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
      console.error('[COINGECKO] Failed to save cache:', error);
    }
  }

  /**
   * Get cached price if still valid
   */
  getCachedPrice(coinId, currency) {
    const cacheKey = `${coinId}:${currency}`;
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
  setCachedPrice(coinId, currency, price) {
    const cacheKey = `${coinId}:${currency}`;
    this.cache[cacheKey] = {
      coinId,
      currency,
      price,
      timestamp: Date.now()
    };
    this.saveCache();
  }

  /**
   * Convert ticker symbol to CoinGecko ID
   * @param {string} ticker - Ticker symbol (e.g., 'BTC', 'ETH')
   * @returns {string} CoinGecko ID (e.g., 'bitcoin', 'ethereum')
   */
  tickerToCoinId(ticker) {
    const upperTicker = ticker.toUpperCase();
    return TICKER_TO_COINGECKO_ID[upperTicker] || ticker.toLowerCase();
  }

  /**
   * Get user's preferred currency from settings
   */
  getUserCurrency() {
    try {
      const settings = localStorage.getItem('financeTracker_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        return parsed.currency || 'USD';
      }
    } catch (error) {
      console.error('[COINGECKO] Failed to get user currency:', error);
    }
    return 'USD';
  }

  /**
   * Fetch current crypto price from CoinGecko
   * Uses /simple/price endpoint
   *
   * @param {string} ticker - Crypto ticker (e.g., 'BTC', 'ETH')
   * @param {string} currency - Target currency (e.g., 'USD', 'CAD')
   * @returns {Promise<number>} Current price
   */
  async fetchCryptoPrice(ticker, currency = null) {
    const targetCurrency = (currency || this.getUserCurrency()).toLowerCase();
    const coinId = this.tickerToCoinId(ticker);

    // Check cache first
    const cached = this.getCachedPrice(coinId, targetCurrency);
    if (cached) {
      console.log(`[COINGECKO] Using cached price for ${ticker} (${coinId})`);
      return cached.price;
    }

    console.log(`[COINGECKO] Fetching price for ${ticker} (${coinId}) in ${targetCurrency.toUpperCase()}...`);

    const url = `${BASE_URL}/simple/price?ids=${coinId}&vs_currencies=${targetCurrency}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (import.meta.env.DEV) {
        console.log('[COINGECKO] API response:', data);
      }

      // Check if we got valid data
      if (!data[coinId] || !data[coinId][targetCurrency]) {
        throw new Error(`No price data available for ${ticker} (${coinId})`);
      }

      const price = data[coinId][targetCurrency];

      // Cache the result
      this.setCachedPrice(coinId, targetCurrency, price);

      console.log(`[COINGECKO] ✅ Fetched ${ticker}: ${targetCurrency.toUpperCase()} ${price.toFixed(2)}`);

      return price;
    } catch (error) {
      console.error(`[COINGECKO] Failed to fetch price for ${ticker}:`, error);
      throw error;
    }
  }

  /**
   * Fetch historical crypto prices from CoinGecko
   * Uses /coins/{id}/market_chart endpoint
   * Returns daily prices for the specified number of days
   *
   * @param {string} ticker - Crypto ticker (e.g., 'BTC', 'ETH')
   * @param {number} days - Number of days of history (1-max, use 'max' for all)
   * @param {string} currency - Target currency (e.g., 'USD', 'CAD')
   * @returns {Promise<Object>} Price history { 'YYYY-MM-DD': price }
   */
  async fetchCryptoHistory(ticker, days = 365, currency = null) {
    const targetCurrency = (currency || this.getUserCurrency()).toLowerCase();
    const coinId = this.tickerToCoinId(ticker);

    console.log(`[COINGECKO] Fetching ${days} days of history for ${ticker} (${coinId}) in ${targetCurrency.toUpperCase()}...`);

    const url = `${BASE_URL}/coins/${coinId}/market_chart?vs_currency=${targetCurrency}&days=${days}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (import.meta.env.DEV) {
        console.log(`[COINGECKO] Received ${data.prices?.length || 0} price points`);
      }

      // Check if we got valid data
      if (!data.prices || !Array.isArray(data.prices)) {
        throw new Error(`No historical data available for ${ticker} (${coinId})`);
      }

      // Convert from CoinGecko format [timestamp, price] to our format { 'YYYY-MM-DD': price }
      const priceHistory = {};

      data.prices.forEach(([timestamp, price]) => {
        const date = new Date(timestamp).toISOString().split('T')[0];
        priceHistory[date] = price;
      });

      const dates = Object.keys(priceHistory).sort();
      console.log(`[COINGECKO] ✅ Fetched ${dates.length} daily prices for ${ticker} (${dates[0]} to ${dates[dates.length - 1]})`);

      return priceHistory;
    } catch (error) {
      console.error(`[COINGECKO] Failed to fetch history for ${ticker}:`, error);
      throw error;
    }
  }

  /**
   * Get latest price (alias for fetchCryptoPrice for consistency with alphaVantage)
   *
   * @param {string} ticker - Crypto ticker
   * @param {string} currency - Target currency
   * @returns {Promise<number>} Latest price
   */
  async getLatestPrice(ticker, currency = null) {
    return this.fetchCryptoPrice(ticker, currency);
  }

  /**
   * Clear all cached prices
   */
  clearCache() {
    this.cache = {};
    this.saveCache();
    console.log('[COINGECKO] Price cache cleared');
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
          coinId: cached.coinId,
          currency: cached.currency,
          price: cached.price,
          age: Math.round((Date.now() - cached.timestamp) / 1000) + 's'
        };
      })
    };
  }

  /**
   * Check if a ticker is supported
   * @param {string} ticker - Ticker symbol
   * @returns {boolean} True if ticker is in our mapping
   */
  isSupported(ticker) {
    const upperTicker = ticker.toUpperCase();
    return upperTicker in TICKER_TO_COINGECKO_ID;
  }

  /**
   * Get list of supported tickers
   * @returns {Array<string>} Array of supported ticker symbols
   */
  getSupportedTickers() {
    return Object.keys(TICKER_TO_COINGECKO_ID);
  }
}

// Export singleton instance
export const coinGecko = new CoinGeckoService();
