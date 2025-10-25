// frontend/src/utils/chartDataGenerator.js
// Generate chart data for Net Worth visualizations

import { dataManager } from './dataManager';

/**
 * Get all dates between start and end (inclusive)
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Array<string>} Array of date strings in YYYY-MM-DD format
 */
const getDateRange = (startDate, endDate) => {
  const dates = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
};

/**
 * Get price for a ticker on a specific date
 * Falls back to most recent available price if exact date not found
 * @param {string} ticker - Stock ticker or 'BTC'
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {Object} priceHistory - Price history object
 * @returns {number|null} Price or null if not available
 */
const getPriceOnDate = (ticker, date, priceHistory) => {
  if (!priceHistory[ticker]) {
    return null;
  }

  // Try exact date first
  if (priceHistory[ticker][date]) {
    return priceHistory[ticker][date];
  }

  // Find most recent price before this date
  const availableDates = Object.keys(priceHistory[ticker]).sort();
  let mostRecentPrice = null;

  for (const availableDate of availableDates) {
    if (availableDate <= date) {
      mostRecentPrice = priceHistory[ticker][availableDate];
    } else {
      break;
    }
  }

  return mostRecentPrice;
};

/**
 * Calculate total asset value in USD on a specific date
 * @param {Array} items - Net worth items
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {Object} priceHistory - Price history object
 * @returns {number} Total value in USD
 */
const calculateAssetValueOnDate = (items, date, priceHistory) => {
  let total = 0;

  for (const item of items) {
    // Only include assets
    if (item.type !== 'asset') continue;

    // Only include items purchased on or before this date
    if (item.purchaseDate > date) continue;

    // Get price on this date
    let price = item.purchaseValue; // Default to purchase price

    if (item.autoUpdate) {
      const ticker = getTickerFromItem(item);
      if (ticker) {
        const historicalPrice = getPriceOnDate(ticker, date, priceHistory);
        if (historicalPrice !== null) {
          price = historicalPrice;
        }
      }
    }

    // Calculate value (price × quantity)
    const quantity = item.quantity || 1;
    total += price * quantity;
  }

  return total;
};

/**
 * Calculate total liability value on a specific date
 * For now, uses current value since liabilities don't have historical prices
 * @param {Array} items - Net worth items
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {number} Total liability value
 */
const calculateLiabilityValueOnDate = (items, date) => {
  let total = 0;

  for (const item of items) {
    // Only include liabilities
    if (item.type !== 'liability') continue;

    // Only include items originated on or before this date
    if (item.purchaseDate > date) continue;

    // Use current value (we don't have historical liability data yet)
    total += item.currentValue || item.purchaseValue || 0;
  }

  return total;
};

/**
 * Extract ticker symbol from item
 * @param {Object} item - Net worth item
 * @returns {string|null} Ticker symbol or null
 */
const getTickerFromItem = (item) => {
  if (!item.autoUpdate) return null;

  // Bitcoin category always uses BTC ticker
  if (item.category === 'Bitcoin') {
    return 'BTC';
  }

  // For stocks, use the name as ticker
  if (item.category === 'Stock' && item.name) {
    return item.name.toUpperCase().trim();
  }

  return null;
};

/**
 * Calculate total BTC holdings on a specific date
 * Only counts actual Bitcoin assets, not BTC equivalent
 * @param {Array} items - Net worth items
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {number} Total BTC amount
 */
const calculateBTCHoldingsOnDate = (items, date) => {
  let totalBTC = 0;

  for (const item of items) {
    // Only include Bitcoin assets
    if (item.type !== 'asset' || item.category !== 'Bitcoin') continue;

    // Only include items purchased on or before this date
    if (item.purchaseDate > date) continue;

    // Add quantity (BTC amount)
    totalBTC += item.quantity || 0;
  }

  return totalBTC;
};

/**
 * Generate data for Fiat Total chart
 * Shows total asset value in USD over time
 * @param {Array} items - Net worth items
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Array} Chart data points [{date, value}]
 */
export const generateFiatTotalChartData = (items, startDate, endDate) => {
  if (!items || items.length === 0) {
    return [];
  }

  const priceHistory = dataManager.loadPriceHistory();
  const dates = getDateRange(startDate, endDate);
  const chartData = [];

  for (const date of dates) {
    const assetValue = calculateAssetValueOnDate(items, date, priceHistory);
    const liabilityValue = calculateLiabilityValueOnDate(items, date);
    const netWorth = assetValue - liabilityValue;

    chartData.push({
      date,
      value: netWorth,
      assets: assetValue,
      liabilities: liabilityValue
    });
  }

  return chartData;
};

/**
 * Generate data for BTC Equivalent chart
 * Shows total portfolio value expressed in BTC
 * @param {Array} items - Net worth items
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Array} Chart data points [{date, btcEquivalent}]
 */
export const generateBTCEquivalentChartData = (items, startDate, endDate) => {
  if (!items || items.length === 0) {
    return [];
  }

  const priceHistory = dataManager.loadPriceHistory();
  const dates = getDateRange(startDate, endDate);
  const chartData = [];

  for (const date of dates) {
    const assetValue = calculateAssetValueOnDate(items, date, priceHistory);
    const liabilityValue = calculateLiabilityValueOnDate(items, date);
    const netWorth = assetValue - liabilityValue;

    // Get BTC price on this date
    const btcPrice = getPriceOnDate('BTC', date, priceHistory);

    if (btcPrice && btcPrice > 0) {
      const btcEquivalent = netWorth / btcPrice;

      chartData.push({
        date,
        btcEquivalent,
        usdValue: netWorth,
        btcPrice
      });
    }
  }

  return chartData;
};

/**
 * Generate data for BTC Holdings chart
 * Shows actual Bitcoin owned over time
 * @param {Array} items - Net worth items
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Array} Chart data points [{date, btcAmount}]
 */
export const generateBTCHoldingsChartData = (items, startDate, endDate) => {
  if (!items || items.length === 0) {
    return [];
  }

  const dates = getDateRange(startDate, endDate);
  const chartData = [];

  for (const date of dates) {
    const btcAmount = calculateBTCHoldingsOnDate(items, date);

    chartData.push({
      date,
      btcAmount
    });
  }

  return chartData;
};

/**
 * Get earliest purchase date from items
 * @param {Array} items - Net worth items
 * @returns {Date|null} Earliest date or null
 */
export const getEarliestPurchaseDate = (items) => {
  if (!items || items.length === 0) return null;

  let earliest = null;

  for (const item of items) {
    if (item.purchaseDate) {
      const purchaseDate = new Date(item.purchaseDate);
      if (!earliest || purchaseDate < earliest) {
        earliest = purchaseDate;
      }
    }
  }

  return earliest;
};

/**
 * Get default date range for charts (all time)
 * @param {Array} items - Net worth items
 * @returns {Object} {startDate, endDate}
 */
export const getDefaultDateRange = (items) => {
  const earliest = getEarliestPurchaseDate(items);
  const today = new Date();

  return {
    startDate: earliest || today,
    endDate: today
  };
};
