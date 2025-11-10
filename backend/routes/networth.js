// Net Worth API Routes
const NetWorthAccount = require('../models/NetWorthAccount');
const NetWorthHolding = require('../models/NetWorthHolding');
const NetWorthTransaction = require('../models/NetWorthTransaction');
const NetWorthPriceUpdate = require('../models/NetWorthPriceUpdate');
const NetWorthSnapshot = require('../models/NetWorthSnapshot');

module.exports = function(app, authenticateToken) {

  // ============================================
  // ACCOUNTS
  // ============================================

  // GET /api/networth/accounts - List all accounts
  app.get('/api/networth/accounts', authenticateToken, (req, res) => {
    try {
      const accounts = NetWorthAccount.findByUser(req.userId);
      res.json({ success: true, data: accounts });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // POST /api/networth/accounts - Create account
  app.post('/api/networth/accounts', authenticateToken, (req, res) => {
    try {
      const account = NetWorthAccount.create(req.userId, req.body);

      // If creating with initial balance and simple tracking, create initial snapshot
      if (account.tracking_method === 'simple' && req.body.initial_balance !== undefined) {
        NetWorthSnapshot.upsert(
          account.id,
          new Date().toISOString().split('T')[0],
          req.body.initial_balance,
          'manual'
        );
      }

      res.json({ success: true, data: account });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // GET /api/networth/accounts/:id - Get account by ID
  app.get('/api/networth/accounts/:id', authenticateToken, (req, res) => {
    try {
      const account = NetWorthAccount.findById(req.userId, req.params.id);
      if (!account) {
        return res.status(404).json({ success: false, error: 'Account not found' });
      }

      // Get current balance/value
      let currentValue = 0;
      if (account.tracking_method === 'simple') {
        currentValue = NetWorthAccount.getCurrentBalance(req.userId, account.id);
      } else {
        // Sum all holdings
        const holdings = NetWorthHolding.findByAccount(account.id);
        for (const holding of holdings) {
          currentValue += NetWorthHolding.getCurrentValue(holding.id);
        }
      }

      res.json({ success: true, data: { ...account, current_value: currentValue } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // PUT /api/networth/accounts/:id - Update account
  app.put('/api/networth/accounts/:id', authenticateToken, (req, res) => {
    try {
      const account = NetWorthAccount.update(req.userId, req.params.id, req.body);
      res.json({ success: true, data: account });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // DELETE /api/networth/accounts/:id - Delete account
  app.delete('/api/networth/accounts/:id', authenticateToken, (req, res) => {
    try {
      NetWorthAccount.delete(req.userId, req.params.id);
      res.json({ success: true, data: { message: 'Account deleted' } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ============================================
  // HOLDINGS
  // ============================================

  // GET /api/networth/accounts/:accountId/holdings - List holdings for account
  app.get('/api/networth/accounts/:accountId/holdings', authenticateToken, (req, res) => {
    try {
      const holdings = NetWorthHolding.findByAccount(req.params.accountId);

      // Enrich with current quantity and value
      const enriched = holdings.map(holding => ({
        ...holding,
        current_quantity: NetWorthHolding.getCurrentQuantity(holding.id),
        current_price: NetWorthHolding.getMostRecentPrice(holding.id),
        current_value: NetWorthHolding.getCurrentValue(holding.id)
      }));

      res.json({ success: true, data: enriched });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // POST /api/networth/accounts/:accountId/holdings - Create holding
  app.post('/api/networth/accounts/:accountId/holdings', authenticateToken, (req, res) => {
    try {
      const holding = NetWorthHolding.create(req.params.accountId, req.body);
      res.json({ success: true, data: holding });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // PUT /api/networth/holdings/:id - Update holding
  app.put('/api/networth/holdings/:id', authenticateToken, (req, res) => {
    try {
      const holding = NetWorthHolding.update(req.params.id, req.body);
      res.json({ success: true, data: holding });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // DELETE /api/networth/holdings/:id - Delete holding
  app.delete('/api/networth/holdings/:id', authenticateToken, (req, res) => {
    try {
      NetWorthHolding.delete(req.params.id);
      res.json({ success: true, data: { message: 'Holding deleted' } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ============================================
  // TRANSACTIONS (Buy/Sell)
  // ============================================

  // GET /api/networth/holdings/:holdingId/transactions - List transactions
  app.get('/api/networth/holdings/:holdingId/transactions', authenticateToken, (req, res) => {
    try {
      const transactions = NetWorthTransaction.findByHolding(req.params.holdingId);
      res.json({ success: true, data: transactions });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // POST /api/networth/holdings/:holdingId/transactions - Create transaction
  app.post('/api/networth/holdings/:holdingId/transactions', authenticateToken, (req, res) => {
    try {
      const transaction = NetWorthTransaction.create(req.params.holdingId, req.body);
      res.json({ success: true, data: transaction });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // PUT /api/networth/transactions/:id - Update transaction
  app.put('/api/networth/transactions/:id', authenticateToken, (req, res) => {
    try {
      const transaction = NetWorthTransaction.update(req.params.id, req.body);
      res.json({ success: true, data: transaction });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // DELETE /api/networth/transactions/:id - Delete transaction
  app.delete('/api/networth/transactions/:id', authenticateToken, (req, res) => {
    try {
      NetWorthTransaction.delete(req.params.id);
      res.json({ success: true, data: { message: 'Transaction deleted' } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ============================================
  // PRICE UPDATES
  // ============================================

  // POST /api/networth/prices/batch - Batch update prices
  app.post('/api/networth/prices/batch', authenticateToken, (req, res) => {
    try {
      const { updates } = req.body; // Array of { holdingId, date, price_per_unit }
      const results = NetWorthPriceUpdate.batchUpsert(updates);
      res.json({ success: true, data: results });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // GET /api/networth/holdings/:holdingId/prices - List price updates
  app.get('/api/networth/holdings/:holdingId/prices', authenticateToken, (req, res) => {
    try {
      const prices = NetWorthPriceUpdate.findByHolding(req.params.holdingId);
      res.json({ success: true, data: prices });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ============================================
  // SNAPSHOTS (Simple Balance Tracking)
  // ============================================

  // POST /api/networth/accounts/:accountId/snapshots - Create/update snapshot
  app.post('/api/networth/accounts/:accountId/snapshots', authenticateToken, (req, res) => {
    try {
      const { date, balance, source } = req.body;
      const snapshot = NetWorthSnapshot.upsert(req.params.accountId, date, balance, source);
      res.json({ success: true, data: snapshot });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // GET /api/networth/accounts/:accountId/snapshots - List snapshots
  app.get('/api/networth/accounts/:accountId/snapshots', authenticateToken, (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const snapshots = NetWorthSnapshot.findByAccount(req.params.accountId, startDate, endDate);
      res.json({ success: true, data: snapshots });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // DELETE /api/networth/snapshots/:id - Delete snapshot
  app.delete('/api/networth/snapshots/:id', authenticateToken, (req, res) => {
    try {
      NetWorthSnapshot.deleteById(req.params.id);
      res.json({ success: true, data: { message: 'Snapshot deleted' } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ============================================
  // SUMMARY & CHART DATA
  // ============================================

  // GET /api/networth/summary - Get net worth summary
  app.get('/api/networth/summary', authenticateToken, (req, res) => {
    try {
      const accounts = NetWorthAccount.findByUser(req.userId);

      let totalAssets = 0;
      let totalLiabilities = 0;

      for (const account of accounts) {
        let value = 0;

        if (account.tracking_method === 'simple') {
          value = NetWorthAccount.getCurrentBalance(req.userId, account.id);
        } else {
          const holdings = NetWorthHolding.findByAccount(account.id);
          for (const holding of holdings) {
            value += NetWorthHolding.getCurrentValue(holding.id);
          }
        }

        if (account.type === 'asset') {
          totalAssets += value;
        } else {
          totalLiabilities += value;
        }
      }

      res.json({
        success: true,
        data: {
          assets: totalAssets,
          liabilities: totalLiabilities,
          netWorth: totalAssets - totalLiabilities
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // GET /api/networth/chart - Get historical chart data
  app.get('/api/networth/chart', authenticateToken, (req, res) => {
    try {
      // For now, just return current snapshot
      // In the future, this could return historical data points
      const accounts = NetWorthAccount.findByUser(req.userId);

      if (accounts.length === 0) {
        return res.json({ success: true, data: [] });
      }

      let totalAssets = 0;
      let totalLiabilities = 0;

      for (const account of accounts) {
        let value = 0;

        if (account.tracking_method === 'simple') {
          value = NetWorthAccount.getCurrentBalance(req.userId, account.id);
        } else {
          const holdings = NetWorthHolding.findByAccount(account.id);
          for (const holding of holdings) {
            value += NetWorthHolding.getCurrentValue(holding.id);
          }
        }

        if (account.type === 'asset') {
          totalAssets += value;
        } else {
          totalLiabilities += value;
        }
      }

      // Return a single data point for now (current value)
      const today = new Date().toISOString().split('T')[0];
      res.json({
        success: true,
        data: [{
          date: today,
          value: totalAssets - totalLiabilities,
          assets: totalAssets,
          liabilities: totalLiabilities
        }]
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

};
