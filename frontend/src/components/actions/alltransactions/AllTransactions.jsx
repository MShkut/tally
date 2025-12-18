import React from 'react';
// frontend/src/components/actions/alltransactions/AllTransactions.jsx
import { useState, useEffect, useMemo, useCallback } from 'react';

import { useTheme } from 'contexts/ThemeContext';
import { ThemeToggle } from 'components/shared/ThemeToggle';
import { Currency } from 'utils/currency';
import { formatDate } from 'utils/dateUtils';
import { BurgerMenu } from 'components/shared/BurgerMenu';
import { apiService } from 'utils/apiService';
import { useDebounce } from 'utils/debounce';
import { 
  FormSection, 
  FormGrid, 
  FormField, 
  StandardInput, 
  StandardSelect,
  EmptyState,
  ConfirmationModal
} from 'components/shared/FormComponents';
import { handleMenuAction } from 'utils/navigationHandler';

export const AllTransactions = ({ onNavigate }) => {
  const { isDarkMode } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300); // Debounce search for better performance
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Selection state for bulk actions
  const [selectedTransactions, setSelectedTransactions] = useState(new Set());
  const [showBulkDelete, setShowBulkDelete] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Handle menu actions using the standard navigation handler
  const handleMenuActionWrapper = (action) => {
    handleMenuAction(action, onNavigate, () => setMenuOpen(false), null);
  };

  // State for total count from backend
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Load categories once on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const userData = await apiService.loadUserData();

        // Build categories from user data - same logic as import page
        const allCategories = [];

        // Add income sources as categories
        if (userData?.income?.incomeSources) {
          const incomeCategories = userData.income.incomeSources.map(source => ({
            ...source,
            type: 'Income'
          }));
          allCategories.push(...incomeCategories);
        }

        // Add savings goals as categories
        if (userData?.savingsAllocation?.savingsGoals) {
          const savingsCategories = userData.savingsAllocation.savingsGoals.map(goal => ({
            ...goal,
            type: 'Savings'
          }));
          allCategories.push(...savingsCategories);
        }

        // Add expense categories
        if (userData?.expenses?.expenseCategories) {
          const expenseCategories = userData.expenses.expenseCategories.map(category => ({
            ...category,
            type: 'Expense'
          }));
          allCategories.push(...expenseCategories);
        }

        setCategories(allCategories);
      } catch (error) {
        console.error('[AllTransactions] Error loading categories:', error);
      }
    };

    loadCategories();
  }, []);

  // Load transactions with filters (backend does the filtering now)
  useEffect(() => {
    const loadTransactions = async () => {
      setIsLoading(true);
      try {
        const offset = (currentPage - 1) * itemsPerPage;
        const response = await apiService.loadTransactions({
          limit: itemsPerPage,
          offset,
          search: debouncedSearchTerm,
          type: typeFilter,
          category: categoryFilter,
          dateFilter,
          sortBy,
          sortOrder
        });

        setTransactions(response);
        setTotalTransactions(response.total || response.length);
      } catch (error) {
        console.error('[AllTransactions] Error loading transactions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTransactions();
  }, [debouncedSearchTerm, typeFilter, categoryFilter, dateFilter, sortBy, sortOrder, currentPage, itemsPerPage]);

  // Backend now does all filtering, sorting, and pagination
  // We just need to calculate totalPages from the backend total
  const totalPages = Math.ceil(totalTransactions / itemsPerPage);
  const paginatedTransactions = transactions; // Already paginated by backend

  const handleEdit = useCallback((transactionId) => {
    setEditingId(transactionId);
  }, []);

  const handleSave = useCallback(async (transactionId, updatedTransaction) => {
    try {
      // Update in local state
      const updatedTransactions = transactions.map(t =>
        t.id === transactionId ? { ...t, ...updatedTransaction } : t
      );
      setTransactions(updatedTransactions);

      // Update single transaction in backend
      await apiService.updateTransaction(transactionId, updatedTransaction);
      setEditingId(null);
    } catch (error) {
      console.error('[AllTransactions] Error saving transaction:', error);
    }
  }, [transactions]);

  const handleDelete = useCallback((transaction) => {
    setTransactionToDelete(transaction);
    setShowDeleteConfirm(true);
  }, []);

  const confirmDelete = async () => {
    try {
      if (transactionToDelete) {
        // Delete from backend
        await apiService.deleteTransaction(transactionToDelete.id);

        // Remove from local state
        const updatedTransactions = transactions.filter(t => t.id !== transactionToDelete.id);
        setTransactions(updatedTransactions);
      }
      setShowDeleteConfirm(false);
      setTransactionToDelete(null);
    } catch (error) {
      console.error('[AllTransactions] Error deleting transaction:', error);
    }
  };

  const handleBulkDelete = async () => {
    try {
      // Use bulk delete endpoint for performance
      const transactionIds = Array.from(selectedTransactions);
      await apiService.bulkDeleteTransactions(transactionIds);

      // Update local state
      const updatedTransactions = transactions.filter(t => !selectedTransactions.has(t.id));
      setTransactions(updatedTransactions);
      setSelectedTransactions(new Set());
      setShowBulkDelete(false);
    } catch (error) {
      console.error('[AllTransactions] Error bulk deleting transactions:', error);
    }
  };

  const toggleSelection = useCallback((transactionId) => {
    const newSelection = new Set(selectedTransactions);
    if (newSelection.has(transactionId)) {
      newSelection.delete(transactionId);
    } else {
      newSelection.add(transactionId);
    }
    setSelectedTransactions(newSelection);
  }, [selectedTransactions]);

  const selectAll = useCallback(() => {
    setSelectedTransactions(new Set(paginatedTransactions.map(t => t.id)));
  }, [paginatedTransactions]);

  const selectAllFiltered = useCallback(async () => {
    // Fetch all filtered transactions from backend (without pagination limit)
    try {
      const response = await apiService.loadTransactions({
        limit: 10000, // Get all filtered results
        offset: 0,
        search: debouncedSearchTerm,
        type: typeFilter,
        category: categoryFilter,
        dateFilter,
        sortBy,
        sortOrder
      });
      setSelectedTransactions(new Set(response.map(t => t.id)));
    } catch (error) {
      console.error('[AllTransactions] Error loading all filtered transactions:', error);
    }
  }, [debouncedSearchTerm, typeFilter, categoryFilter, dateFilter, sortBy, sortOrder]);

  const clearSelection = useCallback(() => {
    setSelectedTransactions(new Set());
  }, []);

  // Filter categories based on selected type
  const filteredCategories = typeFilter
    ? categories.filter(cat => cat.type === typeFilter)
    : categories;

  const typeOptions = [
    { value: '', label: 'All Types' },
    { value: 'Income', label: 'Income' },
    { value: 'Expense', label: 'Expense' },
    { value: 'Savings', label: 'Savings' }
  ];

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...filteredCategories.map(cat => ({
      value: cat.name,
      label: `${cat.name} (${cat.type})`
    }))
  ];

  return (
    <div className={`min-h-screen transition-colors ${
      isDarkMode ? 'bg-black text-white' : 'bg-white text-black'
    }`}>
      <BurgerMenu 
        isOpen={menuOpen} 
        onClose={() => setMenuOpen(false)}
        onAction={handleMenuActionWrapper}
        currentPage="alltransactions"
      />
      
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
      
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-light leading-tight mb-4">
            All Transactions
          </h1>
          <p className={`text-xl ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            View and edit all your imported transactions
          </p>
        </div>

        {/* Filters and Controls */}
        <FormSection title="Filters & Search">
          <FormGrid>
            <FormField span={4} mobileSpan={6}>
              <StandardInput
                label="Search Descriptions"
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search transactions..."
                className="[&_label]:text-base [&_label]:font-light [&_input]:text-base [&_input]:font-light"
              />
            </FormField>
            <FormField span={2} mobileSpan={3}>
              <StandardSelect
                label="Type"
                value={typeFilter}
                onChange={(value) => {
                  setTypeFilter(value);
                  setCategoryFilter(''); // Reset category when type changes
                }}
                options={typeOptions}
                className="[&_label]:text-base [&_label]:font-light [&_button]:text-base [&_button]:font-light"
              />
            </FormField>
            <FormField span={3} mobileSpan={6}>
              <StandardSelect
                label="Category"
                value={categoryFilter}
                onChange={setCategoryFilter}
                options={categoryOptions}
                disabled={!typeFilter}
                placeholder={typeFilter ? "Select category" : "Select type first"}
                className="[&_label]:text-base [&_label]:font-light [&_button]:text-base [&_button]:font-light"
              />
            </FormField>
            <FormField span={3} mobileSpan={3}>
              <StandardSelect
                label="Date Filter"
                value={dateFilter}
                onChange={setDateFilter}
                options={[
                  { value: '', label: 'All Time' },
                  { value: 'current-month', label: 'This Month' }
                ]}
                className="[&_label]:text-base [&_label]:font-light [&_button]:text-base [&_button]:font-light"
              />
            </FormField>
            <FormField span={2} mobileSpan={3}>
              <StandardSelect
                label="Sort By"
                value={sortBy}
                onChange={setSortBy}
                options={[
                  { value: 'date', label: 'Date' },
                  { value: 'amount', label: 'Amount' },
                  { value: 'description', label: 'Description' },
                  { value: 'category', label: 'Category' }
                ]}
                className="[&_label]:text-base [&_label]:font-light [&_button]:text-base [&_button]:font-light"
              />
            </FormField>
            <FormField span={2} mobileSpan={3}>
              <StandardSelect
                label="Order"
                value={sortOrder}
                onChange={setSortOrder}
                options={[
                  { value: 'desc', label: 'Newest First' },
                  { value: 'asc', label: 'Oldest First' }
                ]}
                className="[&_label]:text-base [&_label]:font-light [&_button]:text-base [&_button]:font-light"
              />
            </FormField>
          </FormGrid>
        </FormSection>

        {/* Bulk Actions */}
        {selectedTransactions.size > 0 && (
          <div className={`mb-8 p-4 rounded-lg border-2 ${
            isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-base ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {selectedTransactions.size} transaction{selectedTransactions.size !== 1 ? 's' : ''} selected
                {totalTransactions > paginatedTransactions.length && ` (of ${totalTransactions} filtered)`}
              </span>
              <div className="flex gap-4">
                {totalTransactions > paginatedTransactions.length && (
                  <button
                    onClick={selectAllFiltered}
                    className={`text-base font-light transition-colors ${
                      isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'
                    }`}
                  >
                    Select All {totalTransactions} Filtered
                  </button>
                )}
                <button
                  onClick={clearSelection}
                  className={`text-base font-light transition-colors ${
                    isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'
                  }`}
                >
                  Clear Selection
                </button>
                <button
                  onClick={() => setShowBulkDelete(true)}
                  className="text-base font-light text-red-500 hover:text-red-400 transition-colors"
                >
                  Delete Selected
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Transactions List */}
        {totalTransactions === 0 ? (
          <EmptyState
            title="No transactions found"
            description="Try adjusting your filters or import some transactions to get started"
            className="mt-12"
          />
        ) : (
          <>
            {/* Results Summary */}
            <div className={`mb-4 text-base ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalTransactions)} of {totalTransactions} transactions
            </div>

            <div className="space-y-4">
            {/* Header Row */}
            <div className={`grid grid-cols-12 gap-4 p-4 border-b-2 ${
              isDarkMode ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <div className="col-span-1 flex items-center">
                <button
                  onClick={selectedTransactions.size === paginatedTransactions.length ? clearSelection : selectAll}
                  className={`text-base font-light transition-colors ${
                    isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'
                  }`}
                  title="Select all on this page"
                >
                  {selectedTransactions.size === paginatedTransactions.length ? '☑' : '☐'}
                </button>
              </div>
              <div className="col-span-2 text-base font-light">Date</div>
              <div className="col-span-4 text-base font-light">Description</div>
              <div className="col-span-2 text-base font-light">Amount</div>
              <div className="col-span-2 text-base font-light">Category</div>
              <div className="col-span-1 text-base font-light">Actions</div>
            </div>

            {/* Transaction Rows */}
            {paginatedTransactions.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                categories={categories}
                isSelected={selectedTransactions.has(transaction.id)}
                isEditing={editingId === transaction.id}
                onToggleSelect={() => toggleSelection(transaction.id)}
                onEdit={() => handleEdit(transaction.id)}
                onSave={(updatedTransaction) => handleSave(transaction.id, updatedTransaction)}
                onCancel={() => setEditingId(null)}
                onDelete={() => handleDelete(transaction)}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className={`mt-8 flex items-center justify-between border-t-2 pt-6 ${
              isDarkMode ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 border-2 transition-colors ${
                    currentPage === 1
                      ? 'opacity-50 cursor-not-allowed'
                      : isDarkMode
                        ? 'border-white text-white hover:bg-white hover:text-black'
                        : 'border-black text-black hover:bg-black hover:text-white'
                  }`}
                >
                  Previous
                </button>
                <span className={`text-base ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 border-2 transition-colors ${
                    currentPage === totalPages
                      ? 'opacity-50 cursor-not-allowed'
                      : isDarkMode
                        ? 'border-white text-white hover:bg-white hover:text-black'
                        : 'border-black text-black hover:bg-black hover:text-white'
                  }`}
                >
                  Next
                </button>
              </div>

              <div className="flex items-center gap-2">
                <label className={`text-base ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Items per page:
                </label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1); // Reset to first page when changing items per page
                  }}
                  className={`px-3 py-1 border-2 bg-transparent ${
                    isDarkMode
                      ? 'border-gray-600 text-white'
                      : 'border-gray-300 text-black'
                  }`}
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={250}>250</option>
                </select>
              </div>
            </div>
          )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        title="Delete Transaction?"
        description="Are you sure you want to delete this transaction?"
        details={transactionToDelete ? [
          `Date: ${formatDate(transactionToDelete.date)}`,
          `Description: ${transactionToDelete.description}`,
          `Amount: ${Currency.format(transactionToDelete.amount)}`
        ] : []}
        warningText="This action cannot be undone."
        confirmText="Delete Transaction"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        confirmDanger={true}
      />

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showBulkDelete}
        title="Delete Selected Transactions?"
        description={`Are you sure you want to delete ${selectedTransactions.size} selected transaction${selectedTransactions.size !== 1 ? 's' : ''}?`}
        warningText="This action cannot be undone."
        confirmText="Delete All Selected"
        cancelText="Cancel"
        onConfirm={handleBulkDelete}
        onCancel={() => setShowBulkDelete(false)}
        confirmDanger={true}
      />
    </div>
  );
};

// Individual Transaction Row Component - Memoized for performance
const TransactionRow = React.memo(({
  transaction,
  categories,
  isSelected,
  isEditing,
  onToggleSelect,
  onEdit,
  onSave,
  onCancel,
  onDelete
}) => {
  const { isDarkMode } = useTheme();
  // Get category name from transaction (handle both string and object formats)
  const [editData, setEditData] = useState({
    date: transaction.date,
    description: transaction.description,
    amount: transaction.amount,
    categoryName: transaction.sub_category || 'Uncategorized'
  });

  useEffect(() => {
    if (isEditing) {
      setEditData({
        date: transaction.date,
        description: transaction.description,
        amount: transaction.amount,
        categoryName: transaction.sub_category || 'Uncategorized'
      });
    }
  }, [isEditing, transaction]);

  const handleSave = () => {
    // Backend expects main_category and sub_category
    const selectedCategory = categories.find(c => c.name === editData.categoryName);
    onSave({
      date: editData.date,
      description: editData.description,
      amount: parseFloat(editData.amount),
      main_category: selectedCategory?.type?.toLowerCase() || 'expense',
      sub_category: editData.categoryName
    });
  };

  const getAmountColor = (amount) => {
    if (amount > 0) return 'text-green-500';
    if (amount < 0) return 'text-red-500';
    return isDarkMode ? 'text-gray-400' : 'text-gray-600';
  };

  if (isEditing) {
    return (
      <div className={`grid grid-cols-12 gap-4 p-4 border rounded-lg ${
        isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-300 bg-gray-50'
      }`}>
        <div className="col-span-1 flex items-center">
          <button onClick={onToggleSelect} className="text-base">
            {isSelected ? '☑' : '☐'}
          </button>
        </div>
        <div className="col-span-2">
          <input
            type="date"
            value={editData.date}
            onChange={(e) => setEditData({ ...editData, date: e.target.value })}
            className={`w-full p-2 border rounded text-sm ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-black'
            }`}
          />
        </div>
        <div className="col-span-4">
          <input
            type="text"
            value={editData.description}
            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
            className={`w-full p-2 border rounded text-sm ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-black'
            }`}
          />
        </div>
        <div className="col-span-2">
          <input
            type="number"
            step="0.01"
            value={editData.amount}
            onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
            className={`w-full p-2 border rounded text-sm ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-black'
            }`}
          />
        </div>
        <div className="col-span-2">
          <select
            value={editData.categoryName}
            onChange={(e) => setEditData({ ...editData, categoryName: e.target.value })}
            className={`w-full p-2 border rounded text-sm ${
              isDarkMode
                ? 'bg-gray-800 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-black'
            }`}
          >
            <option value="">Select category</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.name}>
                {cat.name} ({cat.type})
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-1 flex gap-2">
          <button
            onClick={handleSave}
            className="text-green-500 hover:text-green-400 text-sm"
          >
            ✓
          </button>
          <button
            onClick={onCancel}
            className="text-red-500 hover:text-red-400 text-sm"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-12 gap-4 p-4 border-b ${
      isDarkMode ? 'border-gray-800' : 'border-gray-200'
    } hover:bg-opacity-50 transition-colors ${
      isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
    }`}>
      <div className="col-span-1 flex items-center">
        <button onClick={onToggleSelect} className="text-base">
          {isSelected ? '☑' : '☐'}
        </button>
      </div>
      <div className="col-span-2 text-sm font-mono">
        {formatDate(transaction.date)}
      </div>
      <div className="col-span-4 text-sm">
        {transaction.description}
      </div>
      <div className={`col-span-2 text-sm font-mono ${getAmountColor(transaction.amount)}`}>
        {Currency.format(transaction.amount)}
      </div>
      <div className="col-span-2 text-sm">
        {transaction.sub_category || 'Uncategorized'}
      </div>
      <div className="col-span-1 flex gap-2">
        <button
          onClick={onEdit}
          className={`text-sm transition-colors ${
            isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'
          }`}
        >
          ✎
        </button>
        <button
          onClick={onDelete}
          className="text-sm text-red-500 hover:text-red-400 transition-colors"
        >
          🗑
        </button>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better performance
  // Only re-render if these specific props change
  return (
    prevProps.transaction.id === nextProps.transaction.id &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isEditing === nextProps.isEditing &&
    prevProps.transaction.date === nextProps.transaction.date &&
    prevProps.transaction.description === nextProps.transaction.description &&
    prevProps.transaction.amount === nextProps.transaction.amount &&
    prevProps.transaction.sub_category === nextProps.transaction.sub_category
  );
});

// Helper component - matches Dashboard.jsx pattern
const BurgerIcon = () => (
  <div className="w-5 h-5 flex flex-col justify-between">
    <div className="w-full h-0.5 bg-current transition-all duration-300" />
    <div className="w-full h-0.5 bg-current transition-all duration-300" />
    <div className="w-full h-0.5 bg-current transition-all duration-300" />
  </div>
);