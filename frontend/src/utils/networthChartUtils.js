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
 * Generate net worth chart data (optimized)
 */
export async function generateNetworthChartData(startDate, endDate, chartView = 'currency') {
  try {
    // Fetch all data upfront (single API call)
    const accounts = await apiService.getNetworthAccounts();

    if (!accounts.data || accounts.data.length === 0) {
      return [];
    }

    // Fetch all snapshots and holdings data upfront
    const accountDataMap = {};

    for (const account of accounts.data) {
      accountDataMap[account.id] = {
        account,
        snapshots: [],
        holdings: [],
        transactions: []
      };

      if (account.tracking_method === 'simple') {
        // Fetch all snapshots for this account
        const snapshots = await apiService.getAccountSnapshots(account.id);
        accountDataMap[account.id].snapshots = snapshots.data || [];
      } else {
        // Fetch holdings and their transactions
        const holdings = await apiService.getAccountHoldings(account.id);
        if (holdings.data) {
          accountDataMap[account.id].holdings = holdings.data;

          // Fetch transactions for each holding
          for (const holding of holdings.data) {
            const transactions = await apiService.getHoldingTransactions(holding.id);
            if (transactions.data) {
              accountDataMap[account.id].transactions.push(...transactions.data.map(t => ({
                ...t,
                holding_id: holding.id
              })));
            }
          }

          // Sort transactions by date
          accountDataMap[account.id].transactions.sort((a, b) => a.date.localeCompare(b.date));
        }
      }
    }

    // Generate date range
    const dates = generateDateRange(startDate, endDate, 'day');
    const chartData = [];

    // Calculate values for each date using cached data
    for (const date of dates) {
      let totalAssets = 0;
      let totalLiabilities = 0;

      for (const accountId in accountDataMap) {
        const { account, snapshots, holdings, transactions } = accountDataMap[accountId];
        let accountValue = 0;

        if (account.tracking_method === 'simple') {
          // Find most recent snapshot before/on this date
          const relevantSnapshot = snapshots
            .filter(s => s.date <= date)
            .sort((a, b) => b.date.localeCompare(a.date))[0];

          if (relevantSnapshot) {
            accountValue = relevantSnapshot.balance / 100;
          }
        } else {
          // Calculate holdings value at this date
          const holdingQuantities = {};

          // Calculate quantity for each holding based on transactions up to this date
          for (const tx of transactions) {
            if (tx.date <= date) {
              if (!holdingQuantities[tx.holding_id]) {
                holdingQuantities[tx.holding_id] = 0;
              }
              if (tx.type === 'buy') {
                holdingQuantities[tx.holding_id] += tx.quantity;
              } else if (tx.type === 'sell') {
                holdingQuantities[tx.holding_id] -= tx.quantity;
              }
            }
          }

          // Calculate value using latest known price for each holding
          for (const holding of holdings) {
            const quantity = holdingQuantities[holding.id] || 0;
            if (quantity > 0) {
              // Use current_price from holding (this should be the latest price)
              const price = holding.current_price || holding.cost_basis || 0;
              accountValue += (quantity * price) / 100;
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

      chartData.push({
        date,
        value: netWorth,
        assets: totalAssets,
        liabilities: totalLiabilities
      });
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
