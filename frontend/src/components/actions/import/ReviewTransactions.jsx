// frontend/src/components/dashboard/ReviewTransactions.jsx
import React, { useState, useEffect } from 'react';

import { useTheme } from 'contexts/ThemeContext';
import { ThemeToggle } from 'components/shared/ThemeToggle';
import { 
  FormSection,
  EmptyState
} from 'components/shared/FormComponents';
import { TransactionHelpers } from 'utils/transactionHelpers';
import { Currency } from 'utils/currency';
import { TransactionReviewItem } from './TransactionReviewItem';
import { TransactionModal } from './TransactionModal';


export const ReviewTransactions = ({ 
  transactions, 
  categories, 
  stats,
  onCategoryChange, 
  onSplitTransaction,
  onSave,
  onBack,
  onboardingData
}) => {
  const { isDarkMode } = useTheme();
  const [sortBy, setSortBy] = useState('date'); // 'date', 'amount', 'category'
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc', 'desc'
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showTransactionActions, setShowTransactionActions] = useState(false);
  const [actionType, setActionType] = useState(null); // 'split', 'combine', 'edit'
  const [openCategoryDropdown, setOpenCategoryDropdown] = useState(null); // Track which dropdown is open
  const [openActionsDropdown, setOpenActionsDropdown] = useState(null); // Track which actions dropdown is open
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Don't close if clicking on a category button or dropdown
      if (event.target.closest('.category-dropdown')) {
        return;
      }
      setOpenCategoryDropdown(null);
    };
    
    if (openCategoryDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openCategoryDropdown]);

  // Close actions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Don't close if clicking on an actions button or dropdown
      if (event.target.closest('.actions-dropdown')) {
        return;
      }
      setOpenActionsDropdown(null);
    };
    
    if (openActionsDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openActionsDropdown]);
  
  // Sort transactions
  const sortedTransactions = [...transactions].sort((a, b) => {
    let comparison = 0;
    
    if (sortBy === 'date') {
      comparison = new Date(a.date) - new Date(b.date);
    } else if (sortBy === 'amount') {
      comparison = Currency.compare(Currency.abs(a.amount), Currency.abs(b.amount));
    } else if (sortBy === 'type') {
      const aType = a.category?.type || 'Uncategorized';
      const bType = b.category?.type || 'Uncategorized';
      comparison = aType.localeCompare(bType);
    } else if (sortBy === 'category') {
      const aCategory = a.category?.name || 'Uncategorized';
      const bCategory = b.category?.name || 'Uncategorized';
      comparison = aCategory.localeCompare(bCategory);
    }
    
    return sortDirection === 'desc' ? -comparison : comparison;
  });

  // Handle column header clicks for sorting
  const handleSort = (column) => {
    if (sortBy === column) {
      // Same column - toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column - set default direction
      setSortBy(column);
      setSortDirection(column === 'date' ? 'desc' : 'asc'); // Date defaults to desc (newest first)
    }
  };

  // Get sort indicator for column header
  const getSortIndicator = (column) => {
    if (sortBy !== column) return ' ▲▼';
    return sortDirection === 'asc' ? ' ▲' : ' ▼';
  };

  const categoryOptions = categories.map(cat => ({
    value: cat.id,
    label: cat.isSystemCategory ? cat.name : `${cat.name} (${cat.type})`
  }));

  const handleSplit = (transactionId) => {
    const transaction = transactions.find(t => t.id === transactionId);
    if (transaction) {
      setSelectedTransaction(transaction);
      setActionType('split');
      setShowTransactionActions(true);
      setOpenActionsDropdown(null);
    }
  };

  const handleCombine = (transactionId) => {
    const transaction = transactions.find(t => t.id === transactionId);
    if (transaction) {
      setSelectedTransaction(transaction);
      setActionType('combine');
      setShowTransactionActions(true);
      setOpenActionsDropdown(null);
    }
  };

  const handleEdit = (transactionId) => {
    const transaction = transactions.find(t => t.id === transactionId);
    if (transaction) {
      setSelectedTransaction(transaction);
      setActionType('edit');
      setShowTransactionActions(true);
      setOpenActionsDropdown(null);
    }
  };

  const handleDelete = (transactionId) => {
    // Filter out the transaction
    onSplitTransaction(transactionId, []);
  };

  const handleTransactionActionComplete = (resultTransactions) => {
    if (selectedTransaction) {
      onSplitTransaction(selectedTransaction.id, resultTransactions);
      setShowTransactionActions(false);
      setActionType(null);
      setSelectedTransaction(null);
    }
  };

  const getConfidenceIndicator = (confidence) => {
    if (confidence >= 0.8) return { text: 'High', color: 'text-green-500' };
    if (confidence >= 0.5) return { text: 'Medium', color: 'text-yellow-500' };
    return { text: 'Low', color: 'text-red-500' };
  };

  return (
    <>
      <ThemeToggle />
      <div>


          {/* Transaction List - Table-like layout */}
          <FormSection>
            {sortedTransactions.length === 0 ? (
              <EmptyState
                title="No transactions to review"
                description="Import some transactions to get started"
              />
            ) : (
              <div className="space-y-0">
                {/* Table Header */}
                <div className={`pb-4 border-b ${
                  isDarkMode ? 'border-gray-800' : 'border-gray-200'
                }`} style={{display: 'grid', gridTemplateColumns: 'repeat(16, 1fr)', gap: '1rem'}}>
                  <button
                    onClick={() => handleSort('date')}
                    className={`col-span-1 text-lg font-medium text-left transition-colors whitespace-nowrap ${
                      isDarkMode 
                        ? 'text-gray-500 hover:text-white' 
                        : 'text-gray-400 hover:text-black'
                    }`}
                  >
                    Date{getSortIndicator('date')}
                  </button>
                  <div className={`col-span-5 text-lg font-medium ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    Description
                  </div>
                  <button
                    onClick={() => handleSort('amount')}
                    className={`col-span-2 text-lg font-medium text-left transition-colors whitespace-nowrap ${
                      isDarkMode 
                        ? 'text-gray-500 hover:text-white' 
                        : 'text-gray-400 hover:text-black'
                    }`}
                  >
                    Amount{getSortIndicator('amount')}
                  </button>
                  <button
                    onClick={() => handleSort('type')}
                    className={`col-span-2 text-lg font-medium text-left transition-colors ${
                      isDarkMode 
                        ? 'text-gray-500 hover:text-white' 
                        : 'text-gray-400 hover:text-black'
                    }`}
                  >
                    Type{getSortIndicator('type')}
                  </button>
                  <button
                    onClick={() => handleSort('category')}
                    className={`col-span-3 text-lg font-medium text-left transition-colors ${
                      isDarkMode 
                        ? 'text-gray-500 hover:text-white' 
                        : 'text-gray-400 hover:text-black'
                    }`}
                  >
                    Category{getSortIndicator('category')}
                  </button>
                  <div className={`col-span-2 text-lg font-medium text-left ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    Actions
                  </div>
                  <div className={`col-span-1 text-lg font-medium text-center ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    
                  </div>
                </div>
                
                {/* Transaction Rows */}
                {sortedTransactions.map((transaction) => (
                  <TransactionReviewItem
                    key={transaction.id}
                    transaction={transaction}
                    categories={categories}
                    categoryOptions={categoryOptions}
                    onCategoryChange={onCategoryChange}
                    onSplit={handleSplit}
                    onCombine={handleCombine}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    getConfidenceIndicator={getConfidenceIndicator}
                    openCategoryDropdown={openCategoryDropdown}
                    setOpenCategoryDropdown={setOpenCategoryDropdown}
                    openActionsDropdown={openActionsDropdown}
                    setOpenActionsDropdown={setOpenActionsDropdown}
                  />
                ))}
              </div>
            )}
          </FormSection>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-16">
            <button
              onClick={onBack}
              className={`text-lg font-light transition-colors ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-white border-b border-gray-700 hover:border-white pb-1' 
                  : 'text-gray-600 hover:text-black border-b border-gray-300 hover:border-black pb-1'
              }`}
            >
              Back to Import
            </button>
            
            <button
              onClick={transactions.length > 0 ? () => onSave(transactions) : undefined}
              disabled={transactions.length === 0}
              className={`text-xl font-light transition-all pb-2 ${
                transactions.length === 0
                  ? 'text-gray-400 border-b-2 border-gray-400 cursor-not-allowed'
                  : isDarkMode
                    ? 'text-white border-b-2 border-white hover:border-gray-400'
                    : 'text-black border-b-2 border-black hover:border-gray-600'
              }`}
            >
              Save All Transactions
            </button>
          </div>
        </div>

      {/* Transaction Actions Modal */}
      {showTransactionActions && selectedTransaction && (
        <TransactionModal
          transaction={selectedTransaction}
          transactions={transactions}
          categories={categories}
          actionType={actionType}
          onComplete={handleTransactionActionComplete}
          onCancel={() => {
            setShowTransactionActions(false);
            setActionType(null);
            setSelectedTransaction(null);
          }}
        />
      )}
    </>
  );
};

