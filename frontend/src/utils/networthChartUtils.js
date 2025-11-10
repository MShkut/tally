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
 * Generate net worth chart data
 */
export async function generateNetworthChartData(startDate, endDate, chartView = 'currency') {
  try {
    const accounts = await apiService.getNetworthAccounts();

    if (!accounts.data || accounts.data.length === 0) {
      return [];
    }

    // Generate date range
    const dates = generateDateRange(startDate, endDate, 'day');
    const chartData = [];

    for (const date of dates) {
      const dataPoint = {
        date,
        value: 0
      };

      // Calculate net worth for this date
      let totalAssets = 0;
      let totalLiabilities = 0;

      for (const account of accounts.data) {
        let accountValue = 0;

        if (account.tracking_method === 'simple') {
          // Get most recent snapshot before/on this date
          const snapshots = await apiService.getAccountSnapshots(account.id, null, date);
          if (snapshots.data && snapshots.data.length > 0) {
            accountValue = snapshots.data[0].balance / 100; // Convert cents to base unit
          }
        } else {
          // Sum holdings (simplified - in real app, would calculate based on transactions and prices)
          const holdings = await apiService.getAccountHoldings(account.id);
          if (holdings.data) {
            for (const holding of holdings.data) {
              accountValue += (holding.current_value || 0) / 100;
            }
          }
        }

        if (account.type === 'asset') {
          totalAssets += accountValue;
        } else {
          totalLiabilities += accountValue;
        }
      }

      const netWorth = totalAssets - totalLiabilities;

      // Apply chart view
      switch (chartView) {
        case 'currency':
          dataPoint.value = netWorth;
          dataPoint.assets = totalAssets;
          dataPoint.liabilities = totalLiabilities;
          break;

        case 'btc':
        case 'gold':
          // For BTC/Gold view, we'd convert the net worth
          // This requires getting the price from holdings
          // Simplified for now
          dataPoint.value = netWorth;
          break;

        default:
          dataPoint.value = netWorth;
      }

      chartData.push(dataPoint);
    }

    return chartData;
  } catch (error) {
    console.error('Error generating chart data:', error);
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
