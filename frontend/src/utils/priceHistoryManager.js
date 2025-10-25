// frontend/src/utils/priceHistoryManager.js
// Price History Manager - Store and retrieve historical price data

import { alphaVantage } from './alphaVantageService';

const PRICE_HISTORY_STORAGE_KEY = 'financeTracker_priceHistory';

/**
 * Price History Manager
 *
 * Manages storage and retrieval of historical price data
 * Integrates with AlphaVantage API for fetching and backfilling prices
 *
 * Data structure:
 * {
 *   "AAPL": {
 *     "2024-01-15": 150.00,
 *     "2024-01-16": 152.00,
 *     ...
 *   },
 *   "BTC": {
 *     "2024-01-15": 66000.00,
 *     "2024-01-16": 67000.00,
 *     ...
 *   }
 * }
 */
export class PriceHistoryManager {
  constructor() {
    this.priceHistory = this.loadPriceHistory();
  }

  /**
   * Load price history from localStorage
   */
  loadPriceHistory() {
    try {
      const stored = localStorage.getItem(PRICE_HISTORY_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('[PRICE_HISTORY] Failed to load price history:', error);
      return {};
    }
  }

  /**
   * Save price history to localStorage
   */
  savePriceHistory() {
    try {
      localStorage.setItem(PRICE_HISTORY_STORAGE_KEY, JSON.stringify(this.priceHistory));
    } catch (error) {
      console.error('[PRICE_HISTORY] Failed to save price history:', error);
    }
  }

  /**
   * Get price for a ticker on a specific date
   *
   * @param {string} ticker - Stock ticker or 'BTC'
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {number|null} - Price on that date, or null if not found
   */
  getPriceOnDate(ticker, date) {
    if (!this.priceHistory[ticker]) {
      return null;
    }

    return this.priceHistory[ticker][date] || null;
  }

  /**
   * Get latest price for a ticker
   *
   * @param {string} ticker - Stock ticker or 'BTC'
   * @returns {number|null} - Latest price, or null if not found
   */
  getLatestPrice(ticker) {
    if (!this.priceHistory[ticker]) {
      return null;
    }

    const dates = Object.keys(this.priceHistory[ticker]).sort();
    if (dates.length === 0) {
      return null;
    }

    const latestDate = dates[dates.length - 1];
    return this.priceHistory[ticker][latestDate];
  }

  /**
   * Get price history for a ticker within a date range
   *
   * @param {string} ticker - Stock ticker or 'BTC'
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   * @returns {Object} - Price history { 'YYYY-MM-DD': price }
   */
  getPriceHistory(ticker, startDate = null, endDate = null) {
    if (!this.priceHistory[ticker]) {
      return {};
    }

    const prices = this.priceHistory[ticker];

    // If no date range specified, return all prices
    if (!startDate && !endDate) {
      return prices;
    }

    // Filter by date range
    const filtered = {};
    for (const [date, price] of Object.entries(prices)) {
      if (startDate && date < startDate) continue;
      if (endDate && date > endDate) continue;
      filtered[date] = price;
    }

    return filtered;
  }

  /**
   * Store price data for a ticker
   *
   * @param {string} ticker - Stock ticker or 'BTC'
   * @param {Object} prices - Price history { 'YYYY-MM-DD': price }
   */
  storePrices(ticker, prices) {
    if (!this.priceHistory[ticker]) {
      this.priceHistory[ticker] = {};
    }

    // Merge new prices with existing
    this.priceHistory[ticker] = {
      ...this.priceHistory[ticker],
      ...prices
    };

    this.savePriceHistory();

    const count = Object.keys(prices).length;
    console.log(`[PRICE_HISTORY] Stored ${count} prices for ${ticker}`);
  }

  /**
   * Store single price for a ticker on a specific date
   *
   * @param {string} ticker - Stock ticker or 'BTC'
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {number} price - Price value
   */
  storePrice(ticker, date, price) {
    if (!this.priceHistory[ticker]) {
      this.priceHistory[ticker] = {};
    }

    this.priceHistory[ticker][date] = price;
    this.savePriceHistory();
  }

  /**
   * Check if we have price data for a ticker
   *
   * @param {string} ticker - Stock ticker or 'BTC'
   * @returns {boolean} - True if we have any price data
   */
  hasPriceData(ticker) {
    return this.priceHistory[ticker] && Object.keys(this.priceHistory[ticker]).length > 0;
  }

  /**
   * Get date range for available price data
   *
   * @param {string} ticker - Stock ticker or 'BTC'
   * @returns {Object|null} - { startDate, endDate } or null if no data
   */
  getPriceDateRange(ticker) {
    if (!this.hasPriceData(ticker)) {
      return null;
    }

    const dates = Object.keys(this.priceHistory[ticker]).sort();
    return {
      startDate: dates[0],
      endDate: dates[dates.length - 1]
    };
  }

  /**
   * Backfill historical prices from AlphaVantage
   * Fetches all historical data for a ticker and stores it
   *
   * @param {string} ticker - Stock ticker or 'BTC'
   * @param {string} fromDate - Optional: only fetch from this date forward
   * @returns {Promise<void>}
   */
  async backfillPrices(ticker, fromDate = null) {
    try {
      console.log(`[PRICE_HISTORY] Backfilling prices for ${ticker}...`);

      // Check if this is Bitcoin
      const isBitcoin = ticker === 'BTC' || ticker === 'Bitcoin';

      let prices;

      if (isBitcoin) {
        // Fetch Bitcoin daily history
        prices = await alphaVantage.fetchBitcoinDailyHistory();
      } else {
        // Fetch stock daily history
        prices = await alphaVantage.fetchStockDailyHistory(ticker, 'full');
      }

      // Filter by fromDate if specified
      if (fromDate) {
        const filtered = {};
        for (const [date, price] of Object.entries(prices)) {
          if (date >= fromDate) {
            filtered[date] = price;
          }
        }
        prices = filtered;
      }

      // Store the prices
      this.storePrices(ticker, prices);

      const count = Object.keys(prices).length;
      console.log(`[PRICE_HISTORY] Backfilled ${count} prices for ${ticker}`);
    } catch (error) {
      console.error(`[PRICE_HISTORY] Failed to backfill prices for ${ticker}:`, error);
      throw error;
    }
  }

  /**
   * Update latest price for a ticker
   * Fetches current price and stores it
   *
   * @param {string} ticker - Stock ticker or 'BTC'
   * @returns {Promise<number>} - Latest price
   */
  async updateLatestPrice(ticker) {
    try {
      console.log(`[PRICE_HISTORY] Updating latest price for ${ticker}...`);

      const price = await alphaVantage.getLatestPrice(ticker);

      // Get today's date
      const today = new Date().toISOString().split('T')[0];

      // Store the price for today
      this.storePrice(ticker, today, price);

      console.log(`[PRICE_HISTORY] Updated ${ticker}: $${price.toFixed(2)}`);

      return price;
    } catch (error) {
      console.error(`[PRICE_HISTORY] Failed to update latest price for ${ticker}:`, error);
      throw error;
    }
  }

  /**
   * Ensure we have price history for a ticker from a specific date
   * Backfills if needed, otherwise just updates latest price
   *
   * @param {string} ticker - Stock ticker or 'BTC'
   * @param {string} fromDate - Date in YYYY-MM-DD format
   * @returns {Promise<void>}
   */
  async ensurePriceHistory(ticker, fromDate) {
    try {
      // Check if we already have data from this date
      const existing = this.getPriceDateRange(ticker);

      if (existing && existing.startDate <= fromDate) {
        // We have data, just update latest
        console.log(`[PRICE_HISTORY] Already have price history for ${ticker} from ${fromDate}`);
        await this.updateLatestPrice(ticker);
      } else {
        // Need to backfill
        console.log(`[PRICE_HISTORY] Need to backfill ${ticker} from ${fromDate}`);
        await this.backfillPrices(ticker, fromDate);
      }
    } catch (error) {
      console.error(`[PRICE_HISTORY] Failed to ensure price history for ${ticker}:`, error);
      throw error;
    }
  }

  /**
   * Clear all price history
   */
  clearAll() {
    this.priceHistory = {};
    this.savePriceHistory();
    console.log('[PRICE_HISTORY] Cleared all price history');
  }

  /**
   * Clear price history for a specific ticker
   *
   * @param {string} ticker - Stock ticker or 'BTC'
   */
  clearTicker(ticker) {
    delete this.priceHistory[ticker];
    this.savePriceHistory();
    console.log(`[PRICE_HISTORY] Cleared price history for ${ticker}`);
  }

  /**
   * Get summary of stored price data
   * For debugging and UI display
   *
   * @returns {Object} - Summary of all tickers and date ranges
   */
  getSummary() {
    const summary = {};

    for (const ticker of Object.keys(this.priceHistory)) {
      const range = this.getPriceDateRange(ticker);
      const count = Object.keys(this.priceHistory[ticker]).length;
      const latest = this.getLatestPrice(ticker);

      summary[ticker] = {
        count,
        startDate: range?.startDate || null,
        endDate: range?.endDate || null,
        latestPrice: latest
      };
    }

    return summary;
  }
}

// Export singleton instance
export const priceHistoryManager = new PriceHistoryManager();
