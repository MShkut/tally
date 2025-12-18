// frontend/src/components/actions/import/ViewTransactions.jsx
import { useState, useMemo } from 'react';

import { useTheme } from 'contexts/ThemeContext';
import { Currency } from 'utils/currency';
import { formatDate } from 'utils/dateUtils';

export const ViewTransactions = ({ transactions, categories }) => {
  const { isDarkMode } = useTheme();
  const [filterType, setFilterType] = useState('all'); // 'all', 'Income', 'Expense', 'Savings'
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date-desc'); // 'date-asc', 'date-desc', 'amount-asc', 'amount-desc'

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Filter by type (main_category)
    if (filterType !== 'all') {
      filtered = filtered.filter(t =>
        t.main_category && t.main_category.toLowerCase() === filterType.toLowerCase()
      );
    }

    // Filter by category (sub_category)
    if (filterCategory !== 'all') {
      filtered = filtered.filter(t => t.sub_category === filterCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.description?.toLowerCase().includes(query) ||
        t.sub_category?.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-asc':
          return new Date(a.date) - new Date(b.date);
        case 'date-desc':
          return new Date(b.date) - new Date(a.date);
        case 'amount-asc':
          return a.amount - b.amount;
        case 'amount-desc':
          return b.amount - a.amount;
        default:
          return 0;
      }
    });

    return filtered;
  }, [transactions, filterType, filterCategory, searchQuery, sortBy, categories]);

  // Calculate summary stats
  const summary = useMemo(() => {
    const totalIncome = filteredTransactions
      .filter(t => t.main_category?.toLowerCase() === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = filteredTransactions
      .filter(t => t.main_category?.toLowerCase() === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalSavings = filteredTransactions
      .filter(t => t.main_category?.toLowerCase() === 'savings')
      .reduce((sum, t) => sum + t.amount, 0);

    return { totalIncome, totalExpenses, totalSavings, count: filteredTransactions.length };
  }, [filteredTransactions]);

  // Get unique categories for filter
  const availableCategories = useMemo(() => {
    return categories.filter(c => {
      if (filterType === 'all') return true;
      return c.type === filterType;
    });
  }, [categories, filterType]);

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className={`p-6 rounded-lg border ${
          isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}>
          <div className={`text-sm font-light mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Total Transactions
          </div>
          <div className={`text-2xl font-light ${isDarkMode ? 'text-white' : 'text-black'}`}>
            {summary.count}
          </div>
        </div>

        <div className={`p-6 rounded-lg border ${
          isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}>
          <div className={`text-sm font-light mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Total Income
          </div>
          <div className={`text-2xl font-light ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
            {Currency.format(summary.totalIncome)}
          </div>
        </div>

        <div className={`p-6 rounded-lg border ${
          isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}>
          <div className={`text-sm font-light mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Total Expenses
          </div>
          <div className={`text-2xl font-light ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
            {Currency.format(summary.totalExpenses)}
          </div>
        </div>

        <div className={`p-6 rounded-lg border ${
          isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}>
          <div className={`text-sm font-light mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Total Savings
          </div>
          <div className={`text-2xl font-light ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
            {Currency.format(summary.totalSavings)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <input
          type="text"
          placeholder="Search transactions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`px-4 py-2 rounded-lg font-light transition-colors ${
            isDarkMode
              ? 'bg-gray-900 border border-gray-800 text-white placeholder-gray-600 focus:border-gray-700'
              : 'bg-white border border-gray-300 text-black placeholder-gray-400 focus:border-gray-400'
          } focus:outline-none`}
        />

        {/* Type Filter */}
        <select
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value);
            setFilterCategory('all'); // Reset category filter when type changes
          }}
          className={`px-4 py-2 rounded-lg font-light transition-colors ${
            isDarkMode
              ? 'bg-gray-900 border border-gray-800 text-white focus:border-gray-700'
              : 'bg-white border border-gray-300 text-black focus:border-gray-400'
          } focus:outline-none`}
        >
          <option value="all">All Types</option>
          <option value="Income">Income</option>
          <option value="Expense">Expense</option>
          <option value="Savings">Savings</option>
        </select>

        {/* Category Filter */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className={`px-4 py-2 rounded-lg font-light transition-colors ${
            isDarkMode
              ? 'bg-gray-900 border border-gray-800 text-white focus:border-gray-700'
              : 'bg-white border border-gray-300 text-black focus:border-gray-400'
          } focus:outline-none`}
        >
          <option value="all">All Categories</option>
          {availableCategories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className={`px-4 py-2 rounded-lg font-light transition-colors ${
            isDarkMode
              ? 'bg-gray-900 border border-gray-800 text-white focus:border-gray-700'
              : 'bg-white border border-gray-300 text-black focus:border-gray-400'
          } focus:outline-none`}
        >
          <option value="date-desc">Newest First</option>
          <option value="date-asc">Oldest First</option>
          <option value="amount-desc">Highest Amount</option>
          <option value="amount-asc">Lowest Amount</option>
        </select>
      </div>

      {/* Transactions Table */}
      <div className={`rounded-lg border overflow-hidden ${
        isDarkMode ? 'border-gray-800' : 'border-gray-200'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}>
              <tr>
                <th className={`px-6 py-4 text-left text-sm font-light ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Date
                </th>
                <th className={`px-6 py-4 text-left text-sm font-light ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Description
                </th>
                <th className={`px-6 py-4 text-left text-sm font-light ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Category
                </th>
                <th className={`px-6 py-4 text-left text-sm font-light ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Type
                </th>
                <th className={`px-6 py-4 text-right text-sm font-light ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className={isDarkMode ? 'bg-black' : 'bg-white'}>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="5" className={`px-6 py-12 text-center text-base font-light ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    No transactions found
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction, index) => {
                  const categoryType = getCategoryType(transaction.categoryId);
                  const typeColor = categoryType === 'Income'
                    ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                    : categoryType === 'Expense'
                    ? (isDarkMode ? 'text-red-400' : 'text-red-600')
                    : (isDarkMode ? 'text-blue-400' : 'text-blue-600');

                  return (
                    <tr
                      key={transaction.id || index}
                      className={`border-t ${
                        isDarkMode ? 'border-gray-800 hover:bg-gray-900' : 'border-gray-200 hover:bg-gray-50'
                      } transition-colors`}
                    >
                      <td className={`px-6 py-4 text-sm font-light ${isDarkMode ? 'text-white' : 'text-black'}`}>
                        {formatDate(transaction.date)}
                      </td>
                      <td className={`px-6 py-4 text-sm font-light ${isDarkMode ? 'text-white' : 'text-black'}`}>
                        {transaction.description}
                      </td>
                      <td className={`px-6 py-4 text-sm font-light ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {getCategoryName(transaction.categoryId)}
                      </td>
                      <td className={`px-6 py-4 text-sm font-light ${typeColor}`}>
                        {categoryType}
                      </td>
                      <td className={`px-6 py-4 text-right text-sm font-light ${typeColor}`}>
                        {Currency.format(transaction.amount)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
