// EditAccountModal.jsx - Modal for editing net worth accounts and managing holdings
import React, { useState, useEffect } from 'react';
import { useTheme } from 'contexts/ThemeContext';
import { useNetworth } from 'hooks/useNetworth';
import { useBudget } from 'hooks/useBudget';
import { apiService } from 'utils/apiService';
import { Currency } from 'utils/currency';

export const EditAccountModal = ({ account, onClose }) => {
  const { isDarkMode } = useTheme();
  const { updateAccount, createSnapshot } = useNetworth();
  const { categories } = useBudget();

  const [activeTab, setActiveTab] = useState('details'); // details, holdings, balance
  const [formData, setFormData] = useState({
    name: account.name,
    category: account.category,
    linked_budget_category: account.linked_budget_category || '',
    notes: account.notes || ''
  });

  const [holdings, setHoldings] = useState([]);
  const [isLoadingHoldings, setIsLoadingHoldings] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Add Holding form
  const [showAddHolding, setShowAddHolding] = useState(false);
  const [newHolding, setNewHolding] = useState({
    name: '',
    ticker_symbol: '',
    asset_type: 'stock'
  });

  // Add Transaction form
  const [selectedHolding, setSelectedHolding] = useState(null);
  const [transaction, setTransaction] = useState({
    type: 'buy',
    date: new Date().toISOString().split('T')[0],
    quantity: '',
    price_per_unit: ''
  });

  // Update Balance form
  const [balanceUpdate, setBalanceUpdate] = useState({
    date: new Date().toISOString().split('T')[0],
    balance: ''
  });

  const assetCategories = [
    'Cash',
    'Chequing',
    'Savings',
    'Investments',
    'Retirement',
    'Real Estate',
    'Vehicles',
    'Crypto',
    'Precious Metals',
    'Other Assets'
  ];

  const liabilityCategories = [
    'Credit Card',
    'Loan',
    'Mortgage',
    'Student Loan',
    'Line of Credit',
    'Other Liabilities'
  ];

  const assetTypes = [
    'stock',
    'etf',
    'mutual_fund',
    'bond',
    'crypto',
    'precious_metal',
    'other'
  ];

  useEffect(() => {
    if (account.tracking_method === 'quantity_based' && activeTab === 'holdings') {
      loadHoldings();
    }
  }, [account, activeTab]);

  const loadHoldings = async () => {
    setIsLoadingHoldings(true);
    try {
      const data = await apiService.getAccountHoldings(account.id);
      setHoldings(data);
    } catch (error) {
      console.error('Error loading holdings:', error);
      setHoldings([]);
    } finally {
      setIsLoadingHoldings(false);
    }
  };

  const handleUpdateAccount = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Account name is required');
      return;
    }

    setIsSubmitting(true);

    try {
      await updateAccount(account.id, {
        name: formData.name.trim(),
        category: formData.category,
        linked_budget_category: formData.linked_budget_category || null,
        notes: formData.notes.trim() || null
      });

      onClose();
    } catch (err) {
      console.error('Error updating account:', err);
      setError(err.message || 'Failed to update account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddHolding = async (e) => {
    e.preventDefault();
    setError('');

    if (!newHolding.name.trim()) {
      setError('Holding name is required');
      return;
    }

    setIsSubmitting(true);

    try {
      await apiService.createHolding({
        account_id: account.id,
        name: newHolding.name.trim(),
        ticker_symbol: newHolding.ticker_symbol.trim() || null,
        asset_type: newHolding.asset_type
      });

      setNewHolding({
        name: '',
        ticker_symbol: '',
        asset_type: 'stock'
      });
      setShowAddHolding(false);
      await loadHoldings();
    } catch (err) {
      console.error('Error adding holding:', err);
      setError(err.message || 'Failed to add holding. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    setError('');

    if (!transaction.quantity || !transaction.price_per_unit) {
      setError('Quantity and price are required');
      return;
    }

    setIsSubmitting(true);

    try {
      await apiService.createHoldingTransaction({
        holding_id: selectedHolding.id,
        type: transaction.type,
        date: transaction.date,
        quantity: parseFloat(transaction.quantity),
        price_per_unit: parseFloat(transaction.price_per_unit)
      });

      setTransaction({
        type: 'buy',
        date: new Date().toISOString().split('T')[0],
        quantity: '',
        price_per_unit: ''
      });
      setSelectedHolding(null);
      await loadHoldings();
    } catch (err) {
      console.error('Error adding transaction:', err);
      setError(err.message || 'Failed to add transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateBalance = async (e) => {
    e.preventDefault();
    setError('');

    if (!balanceUpdate.balance) {
      setError('Balance is required');
      return;
    }

    setIsSubmitting(true);

    try {
      await apiService.createSnapshot({
        account_id: account.id,
        date: balanceUpdate.date,
        balance: parseFloat(balanceUpdate.balance),
        source: 'manual'
      });

      setBalanceUpdate({
        date: new Date().toISOString().split('T')[0],
        balance: ''
      });
      alert('Balance updated successfully');
    } catch (err) {
      console.error('Error updating balance:', err);
      setError(err.message || 'Failed to update balance. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableCategories = account.type === 'asset' ? assetCategories : liabilityCategories;

  const savingsCategories = categories.filter(c => c.context === 'savings').map(c => c.category);
  const expenseCategories = categories.filter(c => c.context === 'expenses').map(c => c.category);
  const linkableCategories = account.type === 'asset' ? savingsCategories : expenseCategories;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className={`max-w-4xl w-full rounded-lg shadow-xl my-8 ${
        isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
      }`}>
        <div className="p-6">
          <h2 className="text-2xl font-light mb-6">Edit Account: {account.name}</h2>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-700">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'details'
                  ? isDarkMode
                    ? 'border-b-2 border-blue-500 text-blue-400'
                    : 'border-b-2 border-blue-500 text-blue-600'
                  : isDarkMode
                    ? 'text-gray-400 hover:text-gray-300'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Account Details
            </button>

            {account.tracking_method === 'quantity_based' && (
              <button
                onClick={() => setActiveTab('holdings')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'holdings'
                    ? isDarkMode
                      ? 'border-b-2 border-blue-500 text-blue-400'
                      : 'border-b-2 border-blue-500 text-blue-600'
                    : isDarkMode
                      ? 'text-gray-400 hover:text-gray-300'
                      : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Holdings & Transactions
              </button>
            )}

            {account.tracking_method === 'simple' && (
              <button
                onClick={() => setActiveTab('balance')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'balance'
                    ? isDarkMode
                      ? 'border-b-2 border-blue-500 text-blue-400'
                      : 'border-b-2 border-blue-500 text-blue-600'
                    : isDarkMode
                      ? 'text-gray-400 hover:text-gray-300'
                      : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Update Balance
              </button>
            )}
          </div>

          {/* Account Details Tab */}
          {activeTab === 'details' && (
            <form onSubmit={handleUpdateAccount} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Account Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-2 rounded border ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-700 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={`w-full px-4 py-2 rounded border ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-700 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  {availableCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Link to Budget Category (optional)
                </label>
                <select
                  value={formData.linked_budget_category}
                  onChange={(e) => setFormData({ ...formData, linked_budget_category: e.target.value })}
                  className={`w-full px-4 py-2 rounded border ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-700 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="">None</option>
                  {linkableCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Notes (optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className={`w-full px-4 py-2 rounded border ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-700 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className={`flex-1 px-6 py-3 rounded font-medium transition-colors ${
                    isDarkMode
                      ? 'border border-gray-700 text-gray-300 hover:bg-gray-800'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 px-6 py-3 rounded font-medium transition-colors ${
                    isDarkMode
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {/* Holdings & Transactions Tab */}
          {activeTab === 'holdings' && (
            <div className="space-y-6">
              {isLoadingHoldings ? (
                <div className="text-center py-8">Loading holdings...</div>
              ) : (
                <>
                  {/* Holdings List */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">Holdings</h3>
                      <button
                        onClick={() => setShowAddHolding(!showAddHolding)}
                        className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                          isDarkMode
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                      >
                        + Add Holding
                      </button>
                    </div>

                    {/* Add Holding Form */}
                    {showAddHolding && (
                      <form onSubmit={handleAddHolding} className={`p-4 mb-4 rounded border ${
                        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <h4 className="font-medium mb-3">New Holding</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm mb-1">Name *</label>
                            <input
                              type="text"
                              value={newHolding.name}
                              onChange={(e) => setNewHolding({ ...newHolding, name: e.target.value })}
                              className={`w-full px-3 py-2 rounded border ${
                                isDarkMode
                                  ? 'bg-gray-900 border-gray-700 text-white'
                                  : 'bg-white border-gray-300 text-gray-900'
                              }`}
                              placeholder="e.g., Apple Inc."
                            />
                          </div>
                          <div>
                            <label className="block text-sm mb-1">Ticker Symbol</label>
                            <input
                              type="text"
                              value={newHolding.ticker_symbol}
                              onChange={(e) => setNewHolding({ ...newHolding, ticker_symbol: e.target.value.toUpperCase() })}
                              className={`w-full px-3 py-2 rounded border ${
                                isDarkMode
                                  ? 'bg-gray-900 border-gray-700 text-white'
                                  : 'bg-white border-gray-300 text-gray-900'
                              }`}
                              placeholder="e.g., AAPL"
                            />
                          </div>
                          <div>
                            <label className="block text-sm mb-1">Asset Type</label>
                            <select
                              value={newHolding.asset_type}
                              onChange={(e) => setNewHolding({ ...newHolding, asset_type: e.target.value })}
                              className={`w-full px-3 py-2 rounded border ${
                                isDarkMode
                                  ? 'bg-gray-900 border-gray-700 text-white'
                                  : 'bg-white border-gray-300 text-gray-900'
                              }`}
                            >
                              {assetTypes.map(type => (
                                <option key={type} value={type}>
                                  {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button
                            type="button"
                            onClick={() => setShowAddHolding(false)}
                            className={`px-4 py-2 rounded text-sm ${
                              isDarkMode
                                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                            }`}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`px-4 py-2 rounded text-sm font-medium ${
                              isDarkMode
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                            } disabled:opacity-50`}
                          >
                            Add
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Holdings Grid */}
                    {holdings.length === 0 ? (
                      <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        No holdings yet. Add your first holding to get started.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {holdings.map(holding => (
                          <div
                            key={holding.id}
                            className={`p-4 rounded border ${
                              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="font-medium">{holding.name}</div>
                                {holding.ticker_symbol && (
                                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {holding.ticker_symbol}
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="font-medium">{Currency.format(holding.current_value || 0)}</div>
                                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {holding.current_quantity || 0} @ {Currency.format(holding.current_price || 0)}
                                </div>
                              </div>
                            </div>

                            {selectedHolding?.id === holding.id ? (
                              <form onSubmit={handleAddTransaction} className="mt-3 pt-3 border-t border-gray-700">
                                <h5 className="text-sm font-medium mb-2">Add Transaction</h5>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-xs mb-1">Type</label>
                                    <select
                                      value={transaction.type}
                                      onChange={(e) => setTransaction({ ...transaction, type: e.target.value })}
                                      className={`w-full px-2 py-1 rounded border text-sm ${
                                        isDarkMode
                                          ? 'bg-gray-900 border-gray-700 text-white'
                                          : 'bg-white border-gray-300 text-gray-900'
                                      }`}
                                    >
                                      <option value="buy">Buy</option>
                                      <option value="sell">Sell</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-xs mb-1">Date</label>
                                    <input
                                      type="date"
                                      value={transaction.date}
                                      onChange={(e) => setTransaction({ ...transaction, date: e.target.value })}
                                      className={`w-full px-2 py-1 rounded border text-sm ${
                                        isDarkMode
                                          ? 'bg-gray-900 border-gray-700 text-white'
                                          : 'bg-white border-gray-300 text-gray-900'
                                      }`}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs mb-1">Quantity</label>
                                    <input
                                      type="number"
                                      step="0.00000001"
                                      value={transaction.quantity}
                                      onChange={(e) => setTransaction({ ...transaction, quantity: e.target.value })}
                                      className={`w-full px-2 py-1 rounded border text-sm ${
                                        isDarkMode
                                          ? 'bg-gray-900 border-gray-700 text-white'
                                          : 'bg-white border-gray-300 text-gray-900'
                                      }`}
                                      placeholder="0.00"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs mb-1">Price per Unit</label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={transaction.price_per_unit}
                                      onChange={(e) => setTransaction({ ...transaction, price_per_unit: e.target.value })}
                                      className={`w-full px-2 py-1 rounded border text-sm ${
                                        isDarkMode
                                          ? 'bg-gray-900 border-gray-700 text-white'
                                          : 'bg-white border-gray-300 text-gray-900'
                                      }`}
                                      placeholder="0.00"
                                    />
                                  </div>
                                </div>
                                <div className="flex gap-2 mt-2">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedHolding(null)}
                                    className={`px-3 py-1 rounded text-sm ${
                                      isDarkMode
                                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                        : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                                    }`}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`px-3 py-1 rounded text-sm font-medium ${
                                      isDarkMode
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                                    } disabled:opacity-50`}
                                  >
                                    Add
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <button
                                onClick={() => setSelectedHolding(holding)}
                                className={`text-sm mt-2 ${
                                  isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                                }`}
                              >
                                + Add Transaction
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                      {error}
                    </div>
                  )}

                  <div className="pt-4">
                    <button
                      onClick={onClose}
                      className={`w-full px-6 py-3 rounded font-medium transition-colors ${
                        isDarkMode
                          ? 'border border-gray-700 text-gray-300 hover:bg-gray-800'
                          : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Update Balance Tab */}
          {activeTab === 'balance' && (
            <form onSubmit={handleUpdateBalance} className="space-y-4">
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Update the balance for this account. This will create a new snapshot for tracking purposes.
              </p>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Date
                </label>
                <input
                  type="date"
                  value={balanceUpdate.date}
                  onChange={(e) => setBalanceUpdate({ ...balanceUpdate, date: e.target.value })}
                  className={`w-full px-4 py-2 rounded border ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-700 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  New Balance
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={balanceUpdate.balance}
                  onChange={(e) => setBalanceUpdate({ ...balanceUpdate, balance: e.target.value })}
                  className={`w-full px-4 py-2 rounded border ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-700 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="0.00"
                />
              </div>

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className={`flex-1 px-6 py-3 rounded font-medium transition-colors ${
                    isDarkMode
                      ? 'border border-gray-700 text-gray-300 hover:bg-gray-800'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 px-6 py-3 rounded font-medium transition-colors ${
                    isDarkMode
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isSubmitting ? 'Updating...' : 'Update Balance'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
