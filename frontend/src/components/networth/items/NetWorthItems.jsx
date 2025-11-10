// NetWorthItems.jsx - View and manage all net worth accounts and holdings
import React, { useState, useEffect } from 'react';
import { ThemeToggle } from 'components/shared/ThemeToggle';
import { useTheme } from 'contexts/ThemeContext';
import { useNetworth } from 'hooks/useNetworth';
import { BurgerMenu } from 'components/shared/BurgerMenu';
import { handleMenuAction } from 'utils/navigationHandler';
import { AccountCard } from './AccountCard';
import { EditAccountModal } from './EditAccountModal';

export const NetWorthItems = ({ onNavigate, onLogout }) => {
  const { isDarkMode } = useTheme();
  const { accounts, deleteAccount } = useNetworth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [deletingAccount, setDeletingAccount] = useState(null);
  const [filter, setFilter] = useState('all'); // all, assets, liabilities
  const [search, setSearch] = useState('');

  // Handle menu state changes to prevent layout shift
  useEffect(() => {
    if (menuOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.paddingRight = '';
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.paddingRight = '';
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const handleMenuActionWrapper = (actionId) => {
    handleMenuAction(actionId, onNavigate, () => setMenuOpen(false));
  };

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
    <>
      <BurgerMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onAction={handleMenuActionWrapper}
        currentPage="networth-items"
        onLogout={onLogout}
      />

      <div className={`min-h-screen transition-colors duration-300 ${
        isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'
      }`}>

        {/* Fixed Controls */}
        <button
          onClick={() => setMenuOpen(true)}
          className={`
            fixed top-8 left-8 z-40 p-2 transition-colors duration-200
            ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}
          `}
          aria-label="Open menu"
        >
          <BurgerIcon />
        </button>

        <ThemeToggle />

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-6 py-12">

          {/* Header */}
          <div className="mb-16 ml-16">
            <h1 className={`text-6xl font-light leading-tight mb-4 ${
              isDarkMode ? 'text-white' : 'text-black'
            }`}>
              Net Worth Items
            </h1>
            <p className={`text-2xl font-light ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Manage your accounts and holdings
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <input
              type="text"
              placeholder="Search accounts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`flex-1 px-4 py-3 rounded border font-light ${
                isDarkMode
                  ? 'bg-black border-gray-800 text-white placeholder-gray-600'
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
              }`}
            />

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className={`px-4 py-3 rounded border font-light ${
                isDarkMode
                  ? 'bg-black border-gray-800 text-white'
                  : 'bg-white border-gray-200 text-gray-900'
              }`}
            >
              <option value="all">All Items</option>
              <option value="assets">Assets Only</option>
              <option value="liabilities">Liabilities Only</option>
            </select>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className={`p-6 rounded border ${
              isDarkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'
            }`}>
              <div className={`text-sm font-light mb-1 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Total Assets
              </div>
              <div className="text-2xl font-light text-green-500">
                {assets.length}
              </div>
            </div>

            <div className={`p-6 rounded border ${
              isDarkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'
            }`}>
              <div className={`text-sm font-light mb-1 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Total Liabilities
              </div>
              <div className="text-2xl font-light text-red-500">
                {liabilities.length}
              </div>
            </div>

            <div className={`p-6 rounded border ${
              isDarkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'
            }`}>
              <div className={`text-sm font-light mb-1 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Total Accounts
              </div>
              <div className={`text-2xl font-light ${
                isDarkMode ? 'text-white' : 'text-black'
              }`}>
                {accounts.length}
              </div>
            </div>
          </div>

          {/* Accounts List */}
          {filteredAccounts.length === 0 ? (
            <div className={`text-center py-16 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <p className="text-lg font-light mb-4">
                {search || filter !== 'all'
                  ? 'No accounts match your filters'
                  : 'No net worth accounts yet'}
              </p>
              <p className="text-sm font-light">
                {search || filter !== 'all'
                  ? 'Try adjusting your search or filter'
                  : 'Import net worth data from the Actions menu to get started tracking your net worth'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAccounts.map(account => (
                <AccountCard
                  key={account.id}
                  account={account}
                  onEdit={() => setEditingAccount(account)}
                  onDelete={() => setDeletingAccount(account)}
                />
              ))}
            </div>
          )}

          <div className="h-24"></div>
        </div>
      </div>

      {/* Modals */}
      {editingAccount && (
        <EditAccountModal
          account={editingAccount}
          onClose={() => setEditingAccount(null)}
        />
      )}

      {deletingAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`max-w-md w-full rounded-lg shadow-xl p-6 ${
            isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
          }`}>
            <h2 className="text-xl font-medium mb-4">Delete Account?</h2>
            <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Are you sure you want to delete "{deletingAccount.name}"? This action cannot be undone and will remove all associated data.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingAccount(null)}
                className={`flex-1 px-4 py-2 rounded font-medium transition-colors ${
                  isDarkMode
                    ? 'border border-gray-700 text-gray-300 hover:bg-gray-800'
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 rounded font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Helper components
const BurgerIcon = () => (
  <div className="w-5 h-5 flex flex-col justify-between">
    <div className="w-full h-0.5 bg-current transition-all duration-300" />
    <div className="w-full h-0.5 bg-current transition-all duration-300" />
    <div className="w-full h-0.5 bg-current transition-all duration-300" />
  </div>
);
