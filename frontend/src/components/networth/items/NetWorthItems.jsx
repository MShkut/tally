// NetWorthItems.jsx - View and manage all net worth accounts and holdings
import React, { useState } from 'react';
import { useTheme } from 'contexts/ThemeContext';
import { useNetworth } from 'hooks/useNetworth';
import { AccountCard } from './AccountCard';
import { AddAccountModal } from './AddAccountModal';
import { EditAccountModal } from './EditAccountModal';
import { ConfirmationModal } from 'components/shared/ConfirmationModal';

export const NetWorthItems = () => {
  const { isDarkMode } = useTheme();
  const { accounts, deleteAccount } = useNetworth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [deletingAccount, setDeletingAccount] = useState(null);
  const [filter, setFilter] = useState('all'); // all, assets, liabilities
  const [search, setSearch] = useState('');

  const assets = accounts.filter(a => a.type === 'asset');
  const liabilities = accounts.filter(a => a.type === 'liability');

  const filteredAccounts = accounts.filter(account => {
    // Filter by type
    if (filter === 'assets' && account.type !== 'asset') return false;
    if (filter === 'liabilities' && account.type !== 'liability') return false;

    // Filter by search
    if (search && !account.name.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }

    return true;
  });

  const handleDelete = async () => {
    if (!deletingAccount) return;

    try {
      await deleteAccount(deletingAccount.id);
      setDeletingAccount(null);
    } catch (error) {
      alert('Failed to delete account. Please try again.');
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-light mb-4">Net Worth Items</h1>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Search accounts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`flex-1 px-4 py-2 rounded border ${
                isDarkMode
                  ? 'bg-gray-900 border-gray-800 text-white placeholder-gray-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              }`}
            />

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className={`px-4 py-2 rounded border ${
                isDarkMode
                  ? 'bg-gray-900 border-gray-800 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="all">All Items</option>
              <option value="assets">Assets Only</option>
              <option value="liabilities">Liabilities Only</option>
            </select>

            <button
              onClick={() => setShowAddModal(true)}
              className={`px-6 py-2 rounded font-medium whitespace-nowrap transition-colors ${
                isDarkMode
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              + Add Account
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className={`p-4 rounded-lg border ${
            isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
          }`}>
            <div className={`text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Total Assets
            </div>
            <div className="text-2xl font-medium text-green-500">
              {assets.length}
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${
            isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
          }`}>
            <div className={`text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Total Liabilities
            </div>
            <div className="text-2xl font-medium text-red-500">
              {liabilities.length}
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${
            isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
          }`}>
            <div className={`text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Total Accounts
            </div>
            <div className="text-2xl font-medium">
              {accounts.length}
            </div>
          </div>
        </div>

        {/* Accounts List */}
        {filteredAccounts.length === 0 ? (
          <div className={`text-center py-16 ${
            isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
          } rounded-lg`}>
            <div className={`text-lg mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {search || filter !== 'all'
                ? 'No accounts match your filters'
                : 'No net worth items yet'}
            </div>
            <p className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {search || filter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Add your first account to start tracking your net worth'}
            </p>
            {!search && filter === 'all' && (
              <button
                onClick={() => setShowAddModal(true)}
                className={`px-6 py-2 rounded font-medium transition-colors ${
                  isDarkMode
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                Add Your First Account
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Assets */}
            {(filter === 'all' || filter === 'assets') && assets.filter(a =>
              !search || a.name.toLowerCase().includes(search.toLowerCase())
            ).length > 0 && (
              <>
                <h2 className="text-xl font-medium mt-8 mb-4">Assets</h2>
                {assets
                  .filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase()))
                  .map(account => (
                    <AccountCard
                      key={account.id}
                      account={account}
                      onEdit={() => setEditingAccount(account)}
                      onDelete={() => setDeletingAccount(account)}
                    />
                  ))}
              </>
            )}

            {/* Liabilities */}
            {(filter === 'all' || filter === 'liabilities') && liabilities.filter(a =>
              !search || a.name.toLowerCase().includes(search.toLowerCase())
            ).length > 0 && (
              <>
                <h2 className="text-xl font-medium mt-8 mb-4">Liabilities</h2>
                {liabilities
                  .filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase()))
                  .map(account => (
                    <AccountCard
                      key={account.id}
                      account={account}
                      onEdit={() => setEditingAccount(account)}
                      onDelete={() => setDeletingAccount(account)}
                    />
                  ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddAccountModal onClose={() => setShowAddModal(false)} />
      )}

      {editingAccount && (
        <EditAccountModal
          account={editingAccount}
          onClose={() => setEditingAccount(null)}
        />
      )}

      {deletingAccount && (
        <ConfirmationModal
          title="Delete Account"
          message={`Are you sure you want to delete "${deletingAccount.name}"? This will also delete all associated holdings, transactions, and snapshots. This action cannot be undone.`}
          confirmLabel="Delete Account"
          confirmStyle="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeletingAccount(null)}
        />
      )}
    </div>
  );
};
