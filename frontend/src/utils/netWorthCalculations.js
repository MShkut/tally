/**
 * Net Worth Calculations Utility
 *
 * Provides calculation functions for net worth dashboard:
 * - Total assets, liabilities, and net worth
 * - Category grouping and summaries
 * - Current value calculations
 * - Price refresh and backfill logic for AlphaVantage and CoinGecko integration
 */

import { finnhub } from './finnhubService';
import { alphaVantage } from './alphaVantageService';
import { currencyConverter } from './currencyConversionService';
import { getUserCurrency } from './currency';
import { dataManager } from './dataManager';

/**
 * Calculate current value for a single net worth item
 * @param {Object} item - Net worth item (asset or liability)
 * @returns {number} Current value
 */
export const calculateCurrentValue = (item) => {
  // Use the currentValue if it exists (manually updated or API updated)
  if (item.currentValue !== undefined && item.currentValue !== null) {
    return item.currentValue;
  }

  // Fallback to total cost if no current value set
  return item.totalCost || 0;
};

/**
 * Calculate total assets value
 * @param {Array} items - Array of all net worth items
 * @returns {number} Total assets value
 */
export const calculateTotalAssets = (items) => {
  if (!items || !Array.isArray(items)) return 0;

  return items
    .filter(item => item.type === 'asset')
    .reduce((sum, item) => sum + calculateCurrentValue(item), 0);
};

/**
 * Calculate total liabilities value
 * @param {Array} items - Array of all net worth items
 * @returns {number} Total liabilities value
 */
export const calculateTotalLiabilities = (items) => {
  if (!items || !Array.isArray(items)) return 0;

  return items
    .filter(item => item.type === 'liability')
    .reduce((sum, item) => sum + calculateCurrentValue(item), 0);
};

/**
 * Calculate net worth (assets - liabilities)
 * @param {Array} items - Array of all net worth items
 * @returns {number} Net worth value
 */
export const calculateNetWorth = (items) => {
  const totalAssets = calculateTotalAssets(items);
  const totalLiabilities = calculateTotalLiabilities(items);
  return totalAssets - totalLiabilities;
};

/**
 * Group items by category
 * @param {Array} items - Array of net worth items
 * @param {string} type - Filter by type ('asset' or 'liability')
 * @returns {Object} Object with category names as keys, arrays of items as values
 */
export const groupItemsByCategory = (items, type) => {
  if (!items || !Array.isArray(items)) return {};

  const filtered = type ? items.filter(item => item.type === type) : items;

  return filtered.reduce((groups, item) => {
    const category = item.category || 'Other';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {});
};

/**
 * Calculate category totals
 * @param {Array} items - Array of net worth items in a category
 * @returns {Object} Object with totalCost and currentValue
 */
export const calculateCategoryTotal = (items) => {
  if (!items || !Array.isArray(items)) {
    return { totalCost: 0, currentValue: 0 };
  }

  const totalCost = items.reduce((sum, item) => sum + (item.totalCost || 0), 0);
  const currentValue = items.reduce((sum, item) => sum + calculateCurrentValue(item), 0);

  return { totalCost, currentValue };
};

/**
 * Calculate profit/loss for an item or category
 * @param {number} totalCost - Original purchase cost
 * @param {number} currentValue - Current value
 * @returns {Object} Object with amount, percentage, and isProfit flag
 */
export const calculateProfitLoss = (totalCost, currentValue) => {
  const amount = currentValue - totalCost;
  const percentage = totalCost > 0 ? (amount / totalCost) * 100 : 0;

  return {
    amount,
    percentage,
    isProfit: amount >= 0
  };
};

/**
 * Get all unique categories for a type
 * @param {Array} items - Array of all net worth items
 * @param {string} type - Filter by type ('asset' or 'liability')
 * @returns {Array} Array of unique category names
 */
export const getCategories = (items, type) => {
  if (!items || !Array.isArray(items)) return [];

  const filtered = type ? items.filter(item => item.type === type) : items;
  const categories = [...new Set(filtered.map(item => item.category || 'Other'))];

  return categories.sort();
};

/**
 * Get category summary with totals
 * @param {Array} items - Array of all net worth items
 * @param {string} type - Filter by type ('asset' or 'liability')
 * @returns {Array} Array of category summaries with name, items, and totals
 */
export const getCategorySummaries = (items, type) => {
  const grouped = groupItemsByCategory(items, type);

  return Object.keys(grouped).map(category => {
    const categoryItems = grouped[category];
    const totals = calculateCategoryTotal(categoryItems);
    const profitLoss = calculateProfitLoss(totals.totalCost, totals.currentValue);

    return {
      category,
      items: categoryItems,
      count: categoryItems.length,
      totalCost: totals.totalCost,
      currentValue: totals.currentValue,
      profitLoss
    };
  }).sort((a, b) => {
    // Sort by current value (highest first)
    return b.currentValue - a.currentValue;
  });
};

/**
 * Get ticker symbol from net worth item
 * Handles both stock items with explicit name and crypto
 * @param {Object} item - Net worth item
 * @returns {string|null} Ticker symbol or null
 */
export const getTickerFromItem = (item) => {
  if (!item || !item.autoUpdate) {
    return null;
  }

  // For Bitcoin category, always use 'BTC'
  if (item.category === 'Bitcoin') {
    return 'BTC';
  }

  // For stocks and crypto, use the name as ticker (e.g., 'AAPL', 'ETH')
  // Also handle case where user manually enters 'BTC' or 'Bitcoin' as name
  if (item.name) {
    const upperName = item.name.toUpperCase();
    if (upperName === 'BTC' || upperName === 'BITCOIN') {
      return 'BTC';
    }
    return item.name.toUpperCase(); // Tickers are uppercase
  }

  return null;
};

/**
 * Determine if a ticker is a cryptocurrency
 * @param {string} ticker - Ticker symbol
 * @returns {boolean} True if crypto, false if stock
 */
export const isCryptoTicker = (ticker) => {
  if (!ticker) return false;

  // Use Finnhub's detection logic
  return finnhub.isCryptoSymbol(ticker);
};

/**
 * Check if we have complete price history for a ticker
 * Allows up to 10% missing dates to account for weekends/holidays
 * @param {Object} existingHistory - Existing price history { 'YYYY-MM-DD': price }
 * @param {Date} startDate - Required start date
 * @param {Date} endDate - Required end date (typically today)
 * @returns {boolean} True if we have sufficient historical data
 */
const checkIfHistoryComplete = (existingHistory, startDate, endDate) => {
  if (!existingHistory || Object.keys(existingHistory).length === 0) {
    return false;
  }

  // Calculate expected number of days (accounting for weekends ~= 70% of calendar days)
  const daysDiff = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
  const expectedDataPoints = Math.floor(daysDiff * 0.7); // Roughly 5 trading days per 7 calendar days

  const actualDataPoints = Object.keys(existingHistory).length;

  // Consider complete if we have at least 90% of expected data points
  const isComplete = actualDataPoints >= (expectedDataPoints * 0.9);

  if (import.meta.env.DEV) {
    console.log(`[PRICE_BACKFILL] History check: ${actualDataPoints}/${expectedDataPoints} points (${(actualDataPoints/expectedDataPoints*100).toFixed(1)}%) - ${isComplete ? 'COMPLETE' : 'INCOMPLETE'}`);
  }

  return isComplete;
};

/**
 * Helper function to fetch historical prices from Alpha Vantage
 * and filter to the requested date range
 * @param {string} ticker - Stock ticker symbol
 * @param {Date} startDate - Start date for history
 * @param {Date} endDate - End date for history
 * @returns {Promise<Object>} Price history object { 'YYYY-MM-DD': price }
 */
const fetchAlphaVantageHistory = async (ticker, startDate, endDate) => {
  // Fetch full history from Alpha Vantage
  const fullHistory = await alphaVantage.fetchStockDailyHistory(ticker, 'full');

  // Filter to requested date range
  const filteredHistory = {};
  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  for (const [date, price] of Object.entries(fullHistory)) {
    if (date >= startStr && date <= endStr) {
      filteredHistory[date] = price;
    }
  }

  return filteredHistory;
};

/**
 * Refresh prices for all auto-update items
 * Fetches latest prices and updates current values
 *
 * @param {Array} items - Array of all net worth items
 * @param {Function} onProgress - Optional callback for progress updates (ticker, current, total)
 * @returns {Promise<Object>} Results object with updated items and errors
 */
export const refreshAllPrices = async (items, onProgress = null) => {
  if (!items || !Array.isArray(items)) {
    return { updatedItems: [], errors: [] };
  }

  // Filter items that need price updates (autoUpdate enabled)
  const itemsToUpdate = items.filter(item =>
    item.type === 'asset' &&
    item.autoUpdate === true &&
    getTickerFromItem(item) !== null
  );

  if (itemsToUpdate.length === 0) {
    console.log('[PRICE_REFRESH] No items need price updates');
    return { updatedItems: [], errors: [] };
  }

  console.log(`[PRICE_REFRESH] Refreshing prices for ${itemsToUpdate.length} items...`);

  const results = {
    updatedItems: [],
    errors: []
  };

  // Group items by ticker to avoid duplicate API calls
  const itemsByTicker = {};
  for (const item of itemsToUpdate) {
    const ticker = getTickerFromItem(item);
    if (ticker) {
      if (!itemsByTicker[ticker]) {
        itemsByTicker[ticker] = [];
      }
      itemsByTicker[ticker].push(item);
    }
  }

  const tickers = Object.keys(itemsByTicker);
  let current = 0;

  // Fetch price for each unique ticker
  for (const ticker of tickers) {
    current++;

    if (onProgress) {
      onProgress(ticker, current, tickers.length);
    }

    try {
      console.log(`[PRICE_REFRESH] Fetching price for ${ticker} (${current}/${tickers.length})...`);

      // Determine which API to use based on stock type
      const isInternational = finnhub.isInternationalStock(ticker);
      const isCrypto = isCryptoTicker(ticker);

      let nativePrice;
      if (isCrypto) {
        // Use Finnhub for crypto
        console.log(`[PRICE_REFRESH] Using Finnhub for ${ticker} (crypto)...`);
        nativePrice = await finnhub.fetchPrice(ticker);
      } else if (isInternational) {
        // Use Alpha Vantage for international stocks (Finnhub free tier doesn't support them)
        console.log(`[PRICE_REFRESH] Using Alpha Vantage for ${ticker} (international stock)...`);
        const result = await alphaVantage.fetchPrice(ticker, 'stock');
        nativePrice = result.price;
      } else {
        // Use Finnhub for US stocks
        console.log(`[PRICE_REFRESH] Using Finnhub for ${ticker} (US stock)...`);
        nativePrice = await finnhub.fetchPrice(ticker);
      }

      // Convert to user's preferred currency if needed
      const userCurrency = getUserCurrency();

      let price;
      if (isCrypto) {
        // Crypto prices from Finnhub are in USD, convert if needed
        if (userCurrency.toUpperCase() !== 'USD') {
          price = await currencyConverter.convert(nativePrice, 'USD', userCurrency);
        } else {
          price = nativePrice;
        }
      } else {
        // Stock prices (US and international) may need conversion based on exchange
        // International stocks from Alpha Vantage are in native currency (CAD for .TO, GBP for .L, etc.)
        // US stocks from Finnhub are in USD
        price = await currencyConverter.convertStockPrice(nativePrice, ticker, userCurrency);
      }

      // Store price in history
      const today = new Date().toISOString().split('T')[0];
      await dataManager.updatePriceForTicker(ticker, today, price);

      // Update all items with this ticker
      for (const item of itemsByTicker[ticker]) {
        const updatedItem = {
          ...item,
          currentValue: price * (item.quantity || 1),
          lastUpdated: new Date().toISOString()
        };

        results.updatedItems.push(updatedItem);
      }

      console.log(`[PRICE_REFRESH] ✅ Updated ${ticker}: $${price.toFixed(2)}`);

    } catch (error) {
      console.error(`[PRICE_REFRESH] ❌ Failed to update ${ticker}:`, error);
      results.errors.push({
        ticker,
        error: error.message
      });
    }
  }

  console.log(`[PRICE_REFRESH] Complete: ${results.updatedItems.length} updated, ${results.errors.length} errors`);

  return results;
};

/**
 * Backfill historical prices for all auto-update items
 * Fetches full price history from purchase date to present
 *
 * @param {Array} items - Array of all net worth items
 * @param {Function} onProgress - Optional callback for progress updates (ticker, current, total)
 * @returns {Promise<Object>} Results object with backfilled tickers and errors
 */
export const backfillAllPrices = async (items, onProgress = null) => {
  if (!items || !Array.isArray(items)) {
    return { backfilledTickers: [], errors: [] };
  }

  // Filter items that need backfill (autoUpdate enabled)
  const itemsToBackfill = items.filter(item =>
    item.type === 'asset' &&
    item.autoUpdate === true &&
    getTickerFromItem(item) !== null
  );

  if (itemsToBackfill.length === 0) {
    console.log('[PRICE_BACKFILL] No items need price backfill');
    return { backfilledTickers: [], errors: [] };
  }

  console.log(`[PRICE_BACKFILL] Backfilling prices for ${itemsToBackfill.length} items...`);

  const results = {
    backfilledTickers: [],
    errors: []
  };

  // Group items by ticker
  const itemsByTicker = {};
  for (const item of itemsToBackfill) {
    const ticker = getTickerFromItem(item);
    if (ticker) {
      if (!itemsByTicker[ticker]) {
        itemsByTicker[ticker] = [];
      }
      itemsByTicker[ticker].push(item);
    }
  }

  const tickers = Object.keys(itemsByTicker);
  let current = 0;

  // Backfill each unique ticker
  for (const ticker of tickers) {
    current++;

    if (onProgress) {
      onProgress(ticker, current, tickers.length);
    }

    try {
      // Find earliest purchase date for this ticker
      const tickerItems = itemsByTicker[ticker];
      const earliestDate = tickerItems.reduce((earliest, item) => {
        const itemDate = item.purchaseDate;
        return (!earliest || itemDate < earliest) ? itemDate : earliest;
      }, null);

      if (!earliestDate) {
        console.log(`[PRICE_BACKFILL] No purchase date found for ${ticker}, skipping`);
        continue;
      }

      // Check if we already have complete historical data for this ticker
      const existingHistory = dataManager.getPriceHistoryForTicker(ticker);
      const earliestDateObj = new Date(earliestDate);
      const today = new Date();

      // Check if we need to fetch any data
      const hasCompleteHistory = checkIfHistoryComplete(existingHistory, earliestDateObj, today);

      if (hasCompleteHistory) {
        console.log(`[PRICE_BACKFILL] Skipping ${ticker} - complete history already exists`);
        results.backfilledTickers.push(ticker);
        continue;
      }

      console.log(`[PRICE_BACKFILL] Fetching history for ${ticker} from ${earliestDate} (${current}/${tickers.length})...`);

      // Determine which API to use based on stock type
      const isInternational = finnhub.isInternationalStock(ticker);
      const isCrypto = isCryptoTicker(ticker);

      let nativePriceHistory;
      if (isCrypto) {
        // Use Finnhub for crypto
        console.log(`[PRICE_BACKFILL] Using Finnhub for ${ticker} (crypto)...`);
        nativePriceHistory = await finnhub.fetchHistory(ticker, earliestDateObj, today);
      } else if (isInternational) {
        // Use Alpha Vantage for international stocks (Finnhub free tier doesn't support them)
        console.log(`[PRICE_BACKFILL] Using Alpha Vantage for ${ticker} (international stock)...`);
        nativePriceHistory = await fetchAlphaVantageHistory(ticker, earliestDateObj, today);
      } else {
        // Use Finnhub for US stocks
        console.log(`[PRICE_BACKFILL] Using Finnhub for ${ticker} (US stock)...`);
        nativePriceHistory = await finnhub.fetchHistory(ticker, earliestDateObj, today);
      }

      // Convert all historical prices to user's currency
      const userCurrency = getUserCurrency();
      let priceHistory = {};

      for (const [date, nativePrice] of Object.entries(nativePriceHistory)) {
        try {
          let convertedPrice;
          if (isCrypto || isInternational) {
            // Crypto and international stock prices from Finnhub/AlphaVantage are in USD
            if (userCurrency.toUpperCase() !== 'USD') {
              convertedPrice = await currencyConverter.convert(nativePrice, 'USD', userCurrency);
            } else {
              convertedPrice = nativePrice;
            }
          } else {
            // Stock prices may need conversion based on exchange
            convertedPrice = await currencyConverter.convertStockPrice(nativePrice, ticker, userCurrency);
          }
          priceHistory[date] = convertedPrice;
        } catch (error) {
          console.error(`[PRICE_BACKFILL] Failed to convert price for ${ticker} on ${date}:`, error);
          // Use native price as fallback
          priceHistory[date] = nativePrice;
        }
      }

      console.log(`[PRICE_BACKFILL] Converted ${Object.keys(priceHistory).length} prices to ${userCurrency}`);

      // Filter to only dates from earliest purchase forward
      const filteredHistory = {};
      for (const [date, price] of Object.entries(priceHistory)) {
        if (date >= earliestDate) {
          filteredHistory[date] = price;
        }
      }

      // Store in price history - merge with existing data
      const currentHistory = dataManager.getPriceHistoryForTicker(ticker);
      const mergedHistory = { ...currentHistory, ...filteredHistory };
      await dataManager.savePriceHistory({
        ...dataManager.loadPriceHistory(),
        [ticker]: mergedHistory
      });

      results.backfilledTickers.push(ticker);

      const count = Object.keys(filteredHistory).length;
      console.log(`[PRICE_BACKFILL] ✅ Backfilled ${count} prices for ${ticker}`);

    } catch (error) {
      console.error(`[PRICE_BACKFILL] ❌ Failed to backfill ${ticker}:`, error);
      results.errors.push({
        ticker,
        error: error.message
      });
    }
  }

  console.log(`[PRICE_BACKFILL] Complete: ${results.backfilledTickers.length} tickers backfilled, ${results.errors.length} errors`);

  return results;
};

/**
 * Update current values for items based on stored price history
 * Uses the most recent price from history to calculate current values
 *
 * @param {Array} items - Array of all net worth items
 * @returns {Array} Updated items with recalculated current values
 */
export const recalculateCurrentValues = (items) => {
  if (!items || !Array.isArray(items)) {
    return [];
  }

  return items.map(item => {
    // Only recalculate for auto-update items
    if (!item.autoUpdate || item.type !== 'asset') {
      return item;
    }

    const ticker = getTickerFromItem(item);
    if (!ticker) {
      return item;
    }

    // Get latest price from history
    const priceHistory = dataManager.getPriceHistoryForTicker(ticker);
    if (!priceHistory || Object.keys(priceHistory).length === 0) {
      return item;
    }

    const dates = Object.keys(priceHistory).sort();
    const latestDate = dates[dates.length - 1];
    const latestPrice = priceHistory[latestDate];

    // Calculate new current value
    const newCurrentValue = latestPrice * (item.quantity || 1);

    return {
      ...item,
      currentValue: newCurrentValue,
      lastUpdated: latestDate
    };
  });
};
