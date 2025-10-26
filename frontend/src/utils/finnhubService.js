// frontend/src/utils/finnhubService.js
// Finnhub API service for fetching stock and crypto prices
// Free tier: 60 API calls/minute, no daily limit
// API key required (free tier available)

import { dataManager } from './dataManager';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
const STORAGE_KEY = 'tally_finnhub_cache';
const BASE_URL = 'https://finnhub.io/api/v1';

/**
 * Finnhub API service for stock and cryptocurrency price data
 * Free tier: 60 calls per minute, no daily limit
 * Supports: US stocks, international stocks, crypto
 * Requires API key (get free key at finnhub.io)
 */
export class FinnhubService {
  constructor() {
    this.cache = this.loadCache();
  }

  /**
   * Get API key from settings
   * Uses dataManager to work in both dev and Start9 container modes
   */
  getApiKey() {
    try {
      const settings = dataManager.loadSettings();
      return settings?.finnhubApiKey || null;
    } catch (error) {
      console.error('[FINNHUB] Failed to get API key:', error);
      return null;
    }
  }

  /**
   * Check if API key is configured
   */
  hasApiKey() {
    return !!this.getApiKey();
  }

  /**
   * Load price cache from localStorage
   */
  loadCache() {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      return cached ? JSON.parse(cached) : {};
    } catch (error) {
      console.error('[FINNHUB] Failed to load cache:', error);
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
      console.error('[FINNHUB] Failed to save cache:', error);
    }
  }

  /**
   * Get cached price if still valid
   */
  getCachedPrice(symbol, type) {
    const cacheKey = `${symbol}:${type}`;
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
    const cacheKey = `${symbol}:${type}`;
    this.cache[cacheKey] = {
      symbol,
      type,
      price,
      timestamp: Date.now()
    };
    this.saveCache();
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
      console.error('[FINNHUB] Failed to get user currency:', error);
    }
    return 'USD';
  }

  /**
   * Determine if symbol is crypto or stock
   * Finnhub crypto symbols: BINANCE:BTCUSDT, COINBASE:BTCUSD, etc.
   * @param {string} symbol - Symbol to check
   * @returns {boolean} True if crypto
   */
  isCryptoSymbol(symbol) {
    if (!symbol) return false;
    const upperSymbol = symbol.toUpperCase();

    // Check if it's already in exchange:pair format
    if (upperSymbol.includes(':')) {
      return upperSymbol.includes('BINANCE:') ||
             upperSymbol.includes('COINBASE:') ||
             upperSymbol.includes('KRAKEN:');
    }

    // Check if it's a common crypto ticker
    const cryptoTickers = ['BTC', 'BITCOIN', 'ETH', 'ETHEREUM', 'USDT', 'BNB', 'SOL', 'ADA', 'XRP', 'DOT', 'DOGE', 'AVAX', 'MATIC', 'LINK', 'UNI', 'LTC', 'BCH', 'XLM', 'ALGO', 'ATOM'];
    return cryptoTickers.includes(upperSymbol);
  }

  /**
   * Check if symbol is an international stock (not US)
   * Finnhub free tier only supports US stocks, not international
   * @param {string} symbol - Ticker symbol
   * @returns {boolean}
   */
  isInternationalStock(symbol) {
    if (!symbol) return false;
    const upperSymbol = symbol.toUpperCase();

    // Check for common international exchange suffixes
    const internationalSuffixes = [
      '.TO',   // Toronto Stock Exchange (Canada)
      '.V',    // TSX Venture Exchange (Canada)
      '.L',    // London Stock Exchange (UK)
      '.LON',  // London Stock Exchange (UK)
      '.DE',   // Deutsche Börse (Germany)
      '.F',    // Frankfurt Stock Exchange (Germany)
      '.PA',   // Euronext Paris (France)
      '.AS',   // Euronext Amsterdam (Netherlands)
      '.HK',   // Hong Kong Stock Exchange
      '.T',    // Tokyo Stock Exchange (Japan)
      '.AX',   // Australian Securities Exchange
      '.NZ',   // New Zealand Stock Exchange
      '.SW',   // SIX Swiss Exchange
      '.ST',   // Stockholm Stock Exchange (Sweden)
      '.CO',   // Copenhagen Stock Exchange (Denmark)
      '.OL',   // Oslo Stock Exchange (Norway)
      '.HE',   // Helsinki Stock Exchange (Finland)
      '.IC',   // Iceland Stock Exchange
      '.MI',   // Borsa Italiana (Italy)
      '.MC',   // Bolsa de Madrid (Spain)
      '.LS',   // Euronext Lisbon (Portugal)
    ];

    return internationalSuffixes.some(suffix => upperSymbol.endsWith(suffix));
  }

  /**
   * Convert ticker to Finnhub format
   * Stocks: AAPL, VFV.TO (as-is)
   * Crypto: BTC → BINANCE:BTCUSDT
   * @param {string} ticker - Original ticker
   * @param {string} currency - Target currency (USD, CAD, etc.)
   * @returns {string} Finnhub-formatted symbol
   */
  formatSymbol(ticker, currency = 'USD') {
    if (!ticker) return '';

    const upperTicker = ticker.toUpperCase();

    // Already in exchange:pair format
    if (upperTicker.includes(':')) {
      return upperTicker;
    }

    // Convert crypto tickers to Binance format
    const cryptoMap = {
      'BTC': 'BTCUSDT',
      'BITCOIN': 'BTCUSDT',
      'ETH': 'ETHUSDT',
      'ETHEREUM': 'ETHUSDT',
      'USDT': 'USDTUSDT',
      'BNB': 'BNBUSDT',
      'SOL': 'SOLUSDT',
      'ADA': 'ADAUSDT',
      'XRP': 'XRPUSDT',
      'DOT': 'DOTUSDT',
      'DOGE': 'DOGEUSDT',
      'AVAX': 'AVAXUSDT',
      'MATIC': 'MATICUSDT',
      'LINK': 'LINKUSDT',
      'UNI': 'UNIUSDT',
      'LTC': 'LTCUSDT',
      'BCH': 'BCHUSDT',
      'XLM': 'XLMUSDT',
      'ALGO': 'ALGOUSDT',
      'ATOM': 'ATOMUSDT'
    };

    if (cryptoMap[upperTicker]) {
      return `BINANCE:${cryptoMap[upperTicker]}`;
    }

    // Return stock ticker as-is
    return ticker;
  }

  /**
   * Fetch current price using quote endpoint
   * Works for both stocks and crypto
   *
   * @param {string} symbol - Stock or crypto symbol
   * @returns {Promise<number>} Current price
   */
  async fetchPrice(symbol) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Finnhub API key not configured');
    }

    console.log('[FINNHUB] DEBUG - API Key retrieved:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NULL');

    const isCrypto = this.isCryptoSymbol(symbol);
    const formattedSymbol = this.formatSymbol(symbol);

    // Check cache first
    const cached = this.getCachedPrice(formattedSymbol, isCrypto ? 'crypto' : 'stock');
    if (cached) {
      console.log(`[FINNHUB] Using cached price for ${symbol} (${formattedSymbol})`);
      return cached.price;
    }

    console.log(`[FINNHUB] Fetching price for ${symbol} (${formattedSymbol})...`);

    const url = `${BASE_URL}/quote?symbol=${encodeURIComponent(formattedSymbol)}&token=${apiKey}`;
    console.log('[FINNHUB] DEBUG - Full URL:', url);

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Finnhub API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (import.meta.env.DEV) {
        console.log('[FINNHUB] API response:', data);
      }

      // Finnhub quote response: { c: currentPrice, h: high, l: low, o: open, pc: previousClose, t: timestamp }
      if (!data.c || data.c === 0) {
        throw new Error(`No price data available for ${symbol} (${formattedSymbol})`);
      }

      const price = data.c; // c = current price

      // Cache the result
      this.setCachedPrice(formattedSymbol, isCrypto ? 'crypto' : 'stock', price);

      console.log(`[FINNHUB] ✅ Fetched ${symbol}: $${price.toFixed(2)}`);

      return price;
    } catch (error) {
      console.error(`[FINNHUB] Failed to fetch price for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Fetch historical candle data
   * Returns daily prices for the specified date range
   *
   * @param {string} symbol - Stock or crypto symbol
   * @param {Date} fromDate - Start date
   * @param {Date} toDate - End date (defaults to now)
   * @returns {Promise<Object>} Price history { 'YYYY-MM-DD': closePrice }
   */
  async fetchHistory(symbol, fromDate, toDate = new Date()) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Finnhub API key not configured');
    }

    const formattedSymbol = this.formatSymbol(symbol);

    // Convert dates to Unix timestamps
    const from = Math.floor(fromDate.getTime() / 1000);
    const to = Math.floor(toDate.getTime() / 1000);

    console.log(`[FINNHUB] Fetching history for ${symbol} (${formattedSymbol}) from ${fromDate.toISOString().split('T')[0]} to ${toDate.toISOString().split('T')[0]}...`);

    const url = `${BASE_URL}/stock/candle?symbol=${encodeURIComponent(formattedSymbol)}&resolution=D&from=${from}&to=${to}&token=${apiKey}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Finnhub API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (import.meta.env.DEV) {
        console.log(`[FINNHUB] Received ${data.c?.length || 0} candles`);
      }

      // Finnhub candle response: { c: [closes], h: [highs], l: [lows], o: [opens], t: [timestamps], v: [volumes], s: status }
      if (data.s === 'no_data' || !data.c || data.c.length === 0) {
        throw new Error(`No historical data available for ${symbol} (${formattedSymbol})`);
      }

      // Convert to our format: { 'YYYY-MM-DD': closePrice }
      const priceHistory = {};

      data.t.forEach((timestamp, index) => {
        const date = new Date(timestamp * 1000).toISOString().split('T')[0];
        priceHistory[date] = data.c[index]; // c = close prices
      });

      const dates = Object.keys(priceHistory).sort();
      console.log(`[FINNHUB] ✅ Fetched ${dates.length} daily prices for ${symbol} (${dates[0]} to ${dates[dates.length - 1]})`);

      return priceHistory;
    } catch (error) {
      console.error(`[FINNHUB] Failed to fetch history for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Get latest price (alias for fetchPrice for consistency)
   */
  async getLatestPrice(symbol) {
    return this.fetchPrice(symbol);
  }

  /**
   * Clear all cached prices
   */
  clearCache() {
    this.cache = {};
    this.saveCache();
    console.log('[FINNHUB] Price cache cleared');
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
export const finnhub = new FinnhubService();
