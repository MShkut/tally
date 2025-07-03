// frontend/src/components/actions/alltransactions/AllTransactions.jsx
import React, { useState, useEffect, useMemo } from 'react';

import { useTheme } from 'contexts/ThemeContext';
import { ThemeToggle } from 'components/shared/ThemeToggle';
import { Currency } from 'utils/currency';
import { BurgerMenu } from 'components/shared/BurgerMenu';
import { dataManager } from 'utils/dataManager';
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
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Selection state for bulk actions
  const [selectedTransactions, setSelectedTransactions] = useState(new Set());
  const [showBulkDelete, setShowBulkDelete] = useState(false);

  // Handle menu actions using the standard navigation handler
  const handleMenuActionWrapper = (action) => {
    handleMenuAction(action, onNavigate, () => setMenuOpen(false), null);
  };

  useEffect(() => {
    // Load transactions and categories
    const loadedTransactions = dataManager.loadTransactions();
    setTransactions(loadedTransactions);
    
    const userData = dataManager.loadUserData();
    
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
  }, []);

  // Filtered and sorted transactions
  const processedTransactions = useMemo(() => {
    let filtered = transactions.filter(transaction => {
      // Search filter
      if (searchTerm && !transaction.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Category filter
      if (categoryFilter && transaction.category?.name !== categoryFilter) {
        return false;
      }
      
      // Date filter (current month if selected)
      if (dateFilter === 'current-month') {
        const now = new Date();
        const transDate = new Date(transaction.date);
        if (transDate.getMonth() !== now.getMonth() || transDate.getFullYear() !== now.getFullYear()) {
          return false;
        }
      }
      
      return true;
    });
    
    // Sort transactions
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'date':
          aVal = new Date(a.date);
          bVal = new Date(b.date);
          break;
        case 'amount':
          aVal = Math.abs(a.amount || 0);
          bVal = Math.abs(b.amount || 0);
          break;
        case 'description':
          aVal = a.description?.toLowerCase() || '';
          bVal = b.description?.toLowerCase() || '';
          break;
        case 'category':
          aVal = a.category?.name?.toLowerCase() || '';
          bVal = b.category?.name?.toLowerCase() || '';
          break;
        default:
          return 0;
      }
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    return filtered;
  }, [transactions, searchTerm, categoryFilter, dateFilter, sortBy, sortOrder]);

  const handleEdit = (transactionId) => {
    setEditingId(transactionId);
  };

  const handleSave = (transactionId, updatedTransaction) => {
    const updatedTransactions = transactions.map(t => 
      t.id === transactionId ? { ...t, ...updatedTransaction } : t
    );
    setTransactions(updatedTransactions);
    dataManager.saveTransactions(updatedTransactions);
    setEditingId(null);
  };

  const handleDelete = (transaction) => {
    setTransactionToDelete(transaction);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (transactionToDelete) {
      const updatedTransactions = transactions.filter(t => t.id !== transactionToDelete.id);
      setTransactions(updatedTransactions);
      dataManager.saveTransactions(updatedTransactions);
    }
    setShowDeleteConfirm(false);
    setTransactionToDelete(null);
  };

  const handleBulkDelete = () => {
    const updatedTransactions = transactions.filter(t => !selectedTransactions.has(t.id));
    setTransactions(updatedTransactions);
    dataManager.saveTransactions(updatedTransactions);
    setSelectedTransactions(new Set());
    setShowBulkDelete(false);
  };

  const toggleSelection = (transactionId) => {
    const newSelection = new Set(selectedTransactions);
    if (newSelection.has(transactionId)) {
      newSelection.delete(transactionId);
    } else {
      newSelection.add(transactionId);
    }
    setSelectedTransactions(newSelection);
  };

  const selectAll = () => {
    setSelectedTransactions(new Set(processedTransactions.map(t => t.id)));
  };

  const clearSelection = () => {
    setSelectedTransactions(new Set());
  };

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...categories.map(cat => ({
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
            <FormField span={3} mobileSpan={6}>
              <StandardInput
                label="Search Descriptions"
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search transactions..."
                className="[&_label]:text-base [&_label]:font-light [&_input]:text-base [&_input]:font-light"
              />
            </FormField>
            <FormField span={3} mobileSpan={6}>
              <StandardSelect
                label="Category"
                value={categoryFilter}
                onChange={setCategoryFilter}
                options={categoryOptions}
                className="[&_label]:text-base [&_label]:font-light [&_button]:text-base [&_button]:font-light"
              />
            </FormField>
            <FormField span={2} mobileSpan={4}>
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
            <FormField span={2} mobileSpan={4}>
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
            <FormField span={2} mobileSpan={4}>
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
              </span>
              <div className="flex gap-4">
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
        {processedTransactions.length === 0 ? (
          <EmptyState
            title="No transactions found"
            description="Try adjusting your filters or import some transactions to get started"
            className="mt-12"
          />
        ) : (
          <div className="space-y-4">
            {/* Header Row */}
            <div className={`grid grid-cols-12 gap-4 p-4 border-b-2 ${
              isDarkMode ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <div className="col-span-1 flex items-center">
                <button
                  onClick={selectedTransactions.size === processedTransactions.length ? clearSelection : selectAll}
                  className={`text-base font-light transition-colors ${
                    isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'
                  }`}
                >
                  {selectedTransactions.size === processedTransactions.length ? '☑' : '☐'}
                </button>
              </div>
              <div className="col-span-2 text-base font-light">Date</div>
              <div className="col-span-4 text-base font-light">Description</div>
              <div className="col-span-2 text-base font-light">Amount</div>
              <div className="col-span-2 text-base font-light">Category</div>
              <div className="col-span-1 text-base font-light">Actions</div>
            </div>

            {/* Transaction Rows */}
            {processedTransactions.map((transaction) => (
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
        )}

        {/* Summary */}
        {processedTransactions.length > 0 && (
          <div className={`mt-8 p-4 border-t-2 ${
            isDarkMode ? 'border-gray-800' : 'border-gray-200'
          }`}>
            <div className="flex justify-between items-center">
              <span className={`text-base ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Showing {processedTransactions.length} of {transactions.length} transactions
              </span>
              <span className={`text-base font-mono ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Total: {Currency.format(processedTransactions.reduce((sum, t) => sum + (t.amount || 0), 0))}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        title="Delete Transaction?"
        description="Are you sure you want to delete this transaction?"
        details={transactionToDelete ? [
          `Date: ${new Date(transactionToDelete.date).toLocaleDateString()}`,
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

// Individual Transaction Row Component
const TransactionRow = ({ 
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
  const [editData, setEditData] = useState({
    date: transaction.date,
    description: transaction.description,
    amount: transaction.amount,
    categoryId: transaction.category?.id || ''
  });

  useEffect(() => {
    if (isEditing) {
      setEditData({
        date: transaction.date,
        description: transaction.description,
        amount: transaction.amount,
        categoryId: transaction.category?.id || ''
      });
    }
  }, [isEditing, transaction]);

  const handleSave = () => {
    const selectedCategory = categories.find(c => c.id === editData.categoryId);
    onSave({
      date: editData.date,
      description: editData.description,
      amount: parseFloat(editData.amount),
      category: selectedCategory
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
            value={editData.categoryId}
            onChange={(e) => setEditData({ ...editData, categoryId: e.target.value })}
            className={`w-full p-2 border rounded text-sm ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-black'
            }`}
          >
            <option value="">Select category</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
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
        {new Date(transaction.date).toLocaleDateString()}
      </div>
      <div className="col-span-4 text-sm">
        {transaction.description}
      </div>
      <div className={`col-span-2 text-sm font-mono ${getAmountColor(transaction.amount)}`}>
        {Currency.format(transaction.amount)}
      </div>
      <div className="col-span-2 text-sm">
        {transaction.category?.name || 'Uncategorized'}
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
};

// Helper component - matches Dashboard.jsx pattern
const BurgerIcon = () => (
  <div className="w-5 h-5 flex flex-col justify-between">
    <div className="w-full h-0.5 bg-current transition-all duration-300" />
    <div className="w-full h-0.5 bg-current transition-all duration-300" />
    <div className="w-full h-0.5 bg-current transition-all duration-300" />
  </div>
);