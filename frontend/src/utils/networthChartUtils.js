// Net Worth Chart Data Generation Utilities
import { apiService } from './apiService';

/**
 * Generate date range for chart
 */
export function generateDateRange(startDate, endDate, interval = 'day') {
  const dates = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  let current = new Date(start);

  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);

    if (interval === 'day') {
      current.setDate(current.getDate() + 1);
    } else if (interval === 'week') {
      current.setDate(current.getDate() + 7);
    } else if (interval === 'month') {
      current.setMonth(current.getMonth() + 1);
    }
  }

  return dates;
}

/**
 * Get default date range (last 6 months)
 */
export function getDefaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - 6);

  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0]
  };
}

/**
 * Generate net worth chart data (fetch from backend)
 */
export async function generateNetworthChartData(startDate, endDate, chartView = 'currency') {
  try {
    // Fetch pre-calculated chart data from backend
    const result = await apiService.getNetworthChartData(startDate, endDate);
    return result.data || [];
  } catch (error) {
    console.error('Error fetching chart data:', error);
    return [];
  }
}

/**
 * Calculate holdings quantity over time
 */
export async function generateHoldingsChartData(holdingId, startDate, endDate) {
  try {
    const transactions = await apiService.getHoldingTransactions(holdingId);
    if (!transactions.data) return [];

    const dates = generateDateRange(startDate, endDate, 'day');
    const chartData = [];

    for (const date of dates) {
      let quantity = 0;

      // Sum all transactions up to this date
      for (const tx of transactions.data) {
        if (tx.date <= date) {
          if (tx.type === 'buy') {
            quantity += tx.quantity;
          } else {
            quantity -= tx.quantity;
          }
        }
      }

      chartData.push({
        date,
        quantity
      });
    }

    return chartData;
  } catch (error) {
    console.error('Error generating holdings chart:', error);
    return [];
  }
}

/**
 * Group accounts by category
 */
export function groupAccountsByCategory(accounts) {
  const grouped = {
    assets: {},
    liabilities: {}
  };

  for (const account of accounts) {
    const group = account.type === 'asset' ? 'assets' : 'liabilities';

    if (!grouped[group][account.category]) {
      grouped[group][account.category] = [];
    }

    grouped[group][account.category].push(account);
  }

  return grouped;
}

/**
 * Calculate total value for category
 */
export function calculateCategoryTotal(accounts, category, type) {
  return accounts
    .filter(a => a.category === category && a.type === type)
    .reduce((sum, a) => sum + (a.current_value || 0), 0);
}
