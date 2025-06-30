// frontend/src/components/dashboard/ReviewTransactions.jsx
import React, { useState, useEffect } from 'react';

import { useTheme } from 'contexts/ThemeContext';
import { ThemeToggle } from 'components/shared/ThemeToggle';
import { 
  FormGrid, 
  FormField, 
  StandardInput,
  StandardSelect,
  FormSection,
  StandardFormLayout,
  SummaryCard,
  SectionBorder,
  EmptyState,
  useItemManager
} from 'components/shared/FormComponents';
import { TransactionHelpers } from 'utils/actions/import/transactionHelpers';
import { Currency } from 'utils/currency';


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
                <div className={`grid grid-cols-12 gap-4 pb-4 border-b ${
                  isDarkMode ? 'border-gray-800' : 'border-gray-200'
                }`}>
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
                  <div className={`col-span-3 text-lg font-medium ${
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
              onClick={transactions.length > 0 ? onSave : undefined}
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
        <TransactionActions
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

// Individual transaction review item - horizontal table-like layout
const TransactionReviewItem = ({ 
  transaction, 
  categories,
  categoryOptions, 
  onCategoryChange, 
  onSplit,
  onCombine,
  onEdit,
  onDelete,
  getConfidenceIndicator,
  openCategoryDropdown,
  setOpenCategoryDropdown,
  openActionsDropdown,
  setOpenActionsDropdown
}) => {
  const { isDarkMode } = useTheme();
  const confidence = getConfidenceIndicator(transaction.confidence);
  const showCategoryDropdown = openCategoryDropdown === transaction.id;
  const showActionsDropdown = openActionsDropdown === transaction.id;

  // Format date to be more compact
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleCategoryClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenCategoryDropdown(showCategoryDropdown ? null : transaction.id);
  };

  const handleCategorySelect = (categoryId) => {
    onCategoryChange(transaction.id, categoryId);
    setOpenCategoryDropdown(null);
  };

  const handleActionsClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenActionsDropdown(showActionsDropdown ? null : transaction.id);
  };

  const handleActionSelect = (action) => {
    if (action === 'split') {
      onSplit(transaction.id);
    } else if (action === 'combine') {
      onCombine(transaction.id);
    } else if (action === 'edit') {
      onEdit(transaction.id);
    }
    setOpenActionsDropdown(null);
  };

  return (
    <div className={`grid grid-cols-12 gap-4 py-6 border-b ${
      isDarkMode ? 'border-gray-800' : 'border-gray-200'
    }`}>
      {/* Date - 1 column */}
      <div className={`col-span-1 text-base font-light ${
        isDarkMode ? 'text-gray-400' : 'text-gray-600'
      }`}>
        {formatDate(transaction.date)}
      </div>

      {/* Description - 3 columns, full text */}
      <div className={`col-span-3 text-base font-light ${
        isDarkMode ? 'text-white' : 'text-black'
      }`}>
        <div className="truncate pr-4" title={transaction.description}>
          {transaction.description}
        </div>
        <div className={`text-sm font-light ${confidence.color}`}>
          {confidence.text} confidence
        </div>
      </div>

      {/* Amount - 2 columns */}
      <div className={`col-span-2 text-base font-mono text-left ${
        Currency.compare(transaction.amount, 0) >= 0 ? 'text-green-500' : 'text-red-500'
      }`}>
        {Currency.compare(transaction.amount, 0) >= 0 ? '+' : ''}
        {Currency.format(Currency.abs(transaction.amount))}
      </div>

      {/* Category - 3 columns, inline dropdown */}
      <div className="col-span-3 relative category-dropdown">
        <button
          onClick={handleCategoryClick}
          className={`w-full px-0 py-2 border-0 border-b-2 bg-transparent transition-colors focus:outline-none text-left text-base font-light ${
            isDarkMode 
              ? 'border-gray-700 text-white hover:border-white' 
              : 'border-gray-300 text-black hover:border-black'
          }`}
        >
          <span className="flex items-center justify-between">
            <span>{transaction.category?.name || 'Select category'}</span>
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              ▼
            </span>
          </span>
        </button>
        
        {showCategoryDropdown && (
          <div className={`absolute top-full left-0 right-0 mt-2 border shadow-lg z-50 max-h-80 overflow-y-auto ${
            isDarkMode 
              ? 'bg-black border-gray-700 shadow-gray-900' 
              : 'bg-white border-gray-200 shadow-gray-300'
          }`}>
            {categoryOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleCategorySelect(option.value)}
                className={`w-full px-4 py-3 text-left text-base font-light transition-colors duration-200 ${
                  transaction.category?.id === option.value
                    ? isDarkMode 
                      ? 'bg-gray-800 text-white' 
                      : 'bg-gray-100 text-black'
                    : isDarkMode 
                      ? 'text-gray-300 hover:bg-gray-900 hover:text-white' 
                      : 'text-gray-700 hover:bg-gray-50 hover:text-black'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Actions - 2 columns, dropdown */}
      <div className="col-span-2 relative actions-dropdown">
        <button
          onClick={handleActionsClick}
          className={`w-full px-0 py-2 border-0 border-b-2 bg-transparent transition-colors focus:outline-none text-left text-base font-light ${
            isDarkMode 
              ? 'border-gray-700 text-white hover:border-white' 
              : 'border-gray-300 text-black hover:border-black'
          }`}
        >
          <span className="flex items-center justify-between">
            <span>Actions</span>
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              ▼
            </span>
          </span>
        </button>
        
        {showActionsDropdown && (
          <div className={`absolute top-full left-0 right-0 mt-2 border shadow-lg z-50 ${
            isDarkMode 
              ? 'bg-black border-gray-700 shadow-gray-900' 
              : 'bg-white border-gray-200 shadow-gray-300'
          }`}>
            <button
              onClick={() => handleActionSelect('edit')}
              className={`w-full px-4 py-3 text-left text-base font-light transition-colors duration-200 ${
                isDarkMode 
                  ? 'text-gray-300 hover:bg-gray-900 hover:text-white' 
                  : 'text-gray-700 hover:bg-gray-50 hover:text-black'
              }`}
            >
              Edit Transaction
            </button>
            <button
              onClick={() => handleActionSelect('split')}
              className={`w-full px-4 py-3 text-left text-base font-light transition-colors duration-200 ${
                isDarkMode 
                  ? 'text-gray-300 hover:bg-gray-900 hover:text-white' 
                  : 'text-gray-700 hover:bg-gray-50 hover:text-black'
              }`}
            >
              Split Transaction
            </button>
            <button
              onClick={() => handleActionSelect('combine')}
              className={`w-full px-4 py-3 text-left text-base font-light transition-colors duration-200 ${
                isDarkMode 
                  ? 'text-gray-300 hover:bg-gray-900 hover:text-white' 
                  : 'text-gray-700 hover:bg-gray-50 hover:text-black'
              }`}
            >
              Combine Transaction
            </button>
          </div>
        )}
      </div>

      {/* Delete - 1 column */}
      <div className="col-span-1 flex items-center justify-center">
        <button
          onClick={() => onDelete(transaction.id)}
          className="text-2xl font-light text-gray-400 hover:text-red-500 transition-colors"
          title="Remove this transaction"
        >
          ×
        </button>
      </div>
    </div>
  );
};

// Transaction actions component (editorial style, no modal) - handles split, combine, and edit
const TransactionActions = ({ transaction, transactions, categories, actionType, onComplete, onCancel }) => {
  const { isDarkMode } = useTheme();
  
  // Get title and subtitle based on action type
  const getActionTitle = () => {
    switch (actionType) {
      case 'split': return 'Split Transaction';
      case 'combine': return 'Combine Transaction';
      case 'edit': return 'Edit Transaction';
      default: return 'Transaction Action';
    }
  };

  const getActionSubtitle = () => {
    switch (actionType) {
      case 'split': 
        return `Original: ${transaction.description} - ${Currency.format(Currency.abs(transaction.amount))}`;
      case 'combine': 
        return `Combine with other transactions to reduce this expense`;
      case 'edit': 
        return `Modify transaction details`;
      default: return '';
    }
  };

  // Initialize items based on action type
  const getInitialItems = () => {
    if (actionType === 'edit') {
      return [{
        id: 1,
        description: transaction.description,
        amount: Currency.formatInput(Currency.abs(transaction.amount)),
        categoryId: transaction.category?.id || categories[0]?.id || ''
      }];
    } else {
      // For split/combine, start with the original transaction
      return [{
        id: 1,
        description: transaction.description,
        amount: Currency.formatInput(Currency.abs(transaction.amount)),
        categoryId: transaction.category?.id || categories[0]?.id || ''
      }];
    }
  };

  const { 
    items: actionItems, 
    addItem, 
    updateItem, 
    deleteItem,
    hasItems
  } = useItemManager(getInitialItems());

  const originalAmount = Currency.abs(transaction.amount);
  
  // Calculate total allocated using Currency system
  const totalAllocated = actionItems.reduce((sum, item) => {
    const itemAmount = parseFloat(Currency.parseInput(item.amount)) || 0;
    return Currency.add(sum, itemAmount);
  }, 0);
  
  const remaining = Currency.subtract(originalAmount, totalAllocated);
  const isValid = actionType === 'edit' ? true : Currency.isEqual(remaining, 0);

  const categoryOptions = categories.map(cat => ({
    value: cat.id,
    label: cat.isSystemCategory ? cat.name : `${cat.name} (${cat.type})`
  }));

  const handleAddItem = () => {
    if (actionType === 'edit') return; // Don't allow adding items in edit mode
    
    const remainingFormatted = Currency.compare(remaining, 0) > 0 ? 
      Currency.formatInput(remaining) : '';
      
    addItem({
      description: '',
      amount: remainingFormatted,
      categoryId: categories[0]?.id || ''
    });
  };

  const handleComplete = () => {
    if (!isValid) return;

    if (actionType === 'edit') {
      // For edit, return single modified transaction
      const editedItem = actionItems[0];
      const editedAmount = parseFloat(Currency.parseInput(editedItem.amount)) || 0;
      const finalAmount = Currency.compare(transaction.amount, 0) < 0 ? 
        Currency.multiply(editedAmount, -1) : editedAmount;
        
      const editedTransaction = {
        ...transaction,
        description: editedItem.description || transaction.description,
        amount: finalAmount,
        category: categories.find(c => c.id === editedItem.categoryId),
        confidence: 1.0,
        needsReview: false
      };

      onComplete([editedTransaction]);
    } else {
      // For split/combine, return multiple transactions
      const resultTransactions = actionItems.map((item, index) => {
        const itemAmount = parseFloat(Currency.parseInput(item.amount)) || 0;
        const finalAmount = Currency.compare(transaction.amount, 0) < 0 ? 
          Currency.multiply(itemAmount, -1) : itemAmount;
          
        return {
          ...transaction,
          id: `${transaction.id}-${actionType}-${index + 1}`,
          description: item.description || transaction.description,
          amount: finalAmount,
          category: categories.find(c => c.id === item.categoryId),
          confidence: 1.0,
          needsReview: false,
          originalData: {
            ...transaction.originalData,
            actionType: actionType,
            actionFrom: transaction.id,
            actionIndex: index + 1,
            actionTotal: actionItems.length
          }
        };
      });

      onComplete(resultTransactions);
    }
  };

  const autoDistribute = () => {
    if (actionType === 'edit') return; // Don't allow auto-distribute in edit mode
    
    const count = actionItems.length;
    const perItem = Currency.divide(originalAmount, count);
    const lastItemAmount = Currency.subtract(originalAmount, Currency.multiply(perItem, count - 1));
    
    actionItems.forEach((item, index) => {
      const amount = index === count - 1 ? lastItemAmount : perItem;
      updateItem(item.id, {
        ...item,
        amount: Currency.formatInput(amount)
      });
    });
  };

  return (
    <div className={`
      fixed inset-0 z-50 overflow-y-auto
      ${isDarkMode ? 'bg-black' : 'bg-gray-50'}
    `}>
      <div className="min-h-screen">
        <ThemeToggle />
        <StandardFormLayout
          title={getActionTitle()}
          subtitle={getActionSubtitle()}
          onBack={onCancel}
          onNext={handleComplete}
          canGoNext={isValid}
          nextLabel={actionType === 'edit' ? 'Save Changes' : `Apply ${actionType.charAt(0).toUpperCase() + actionType.slice(1)}`}
          backLabel="Cancel"
        >
          
          {/* Action Controls */}
          {actionType !== 'edit' && (
            <FormSection>
              <div className="flex items-center gap-6">
                <button
                  onClick={autoDistribute}
                  className={`
                    text-lg font-light border-b border-transparent hover:border-current pb-1
                    ${isDarkMode 
                      ? 'text-gray-400 hover:text-white' 
                      : 'text-gray-600 hover:text-black'
                    }
                  `}
                >
                  Distribute Evenly
                </button>
                <div className={`text-lg font-light ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  Remaining: {Currency.format(remaining)}
                </div>
              </div>
            </FormSection>
          )}

          {/* Action Items */}
          <FormSection>
            <div className="space-y-0">
              {actionItems.map((item) => (
                <ActionItem
                  key={item.id}
                  item={item}
                  categoryOptions={categoryOptions}
                  onUpdate={(updated) => updateItem(item.id, updated)}
                  onDelete={() => deleteItem(item.id)}
                  canDelete={actionItems.length > 1 && actionType !== 'edit'}
                  actionType={actionType}
                />
              ))}
            </div>
            
            {actionType !== 'edit' && (
              <div className="mt-8">
                <button
                  onClick={handleAddItem}
                  className={`
                    w-full py-6 border-2 border-dashed transition-colors text-center
                    ${isDarkMode 
                      ? 'border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300' 
                      : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700'
                    }
                  `}
                >
                  <span className="text-xl font-light">
                    Add {actionType === 'split' ? 'Split' : 'Combine'} Item
                  </span>
                </button>
              </div>
            )}
          </FormSection>

          {/* Validation Status */}
          {actionType !== 'edit' && (
            <FormSection>
              <div className={`
                text-center py-4 text-xl font-light
                ${isValid 
                  ? 'text-green-500' 
                  : 'text-red-500'
                }
              `}>
                {isValid 
                  ? `${actionType.charAt(0).toUpperCase() + actionType.slice(1)} amounts match original transaction` 
                  : `${actionType.charAt(0).toUpperCase() + actionType.slice(1)} amounts must equal ${Currency.format(originalAmount)}`
                }
              </div>
            </FormSection>
          )}

        </StandardFormLayout>
      </div>
    </div>
  );
};

// Action item component (for split, combine, edit)
const ActionItem = ({ item, categoryOptions, onUpdate, onDelete, canDelete, actionType }) => {
  const { isDarkMode } = useTheme();

  const handleAmountChange = (value) => {
    // Use Currency.parseInput to clean the input
    const cleanedValue = Currency.parseInput(value);
    onUpdate({ ...item, amount: cleanedValue });
  };

  return (
    <div className={`py-8 border-b ${
      isDarkMode ? 'border-gray-800' : 'border-gray-200'
    }`}>
      <FormGrid>
        <FormField span={5}>
          <StandardInput
            label="Description"
            value={item.description}
            onChange={(value) => onUpdate({ ...item, description: value })}
            placeholder={actionType === 'edit' ? "Transaction description" : "What was this part for?"}
            className="[&_label]:text-2xl [&_label]:font-medium [&_input]:text-2xl [&_input]:font-medium [&_input]:pb-4"
          />
        </FormField>
        <FormField span={2}>
          <StandardInput
            label="Amount"
            type="currency"
            value={item.amount}
            onChange={handleAmountChange}
            prefix="$"
            className="[&_label]:text-2xl [&_label]:font-medium [&_input]:text-2xl [&_input]:font-medium [&_input]:pb-4"
          />
        </FormField>
        <FormField span={4}>
          <StandardSelect
            label="Category"
            value={item.categoryId}
            onChange={(value) => onUpdate({ ...item, categoryId: value })}
            options={categoryOptions}
            className="[&_label]:text-2xl [&_label]:font-medium [&_button]:text-xl [&_button]:font-medium"
          />
        </FormField>
        <FormField span={1}>
          {canDelete && (
            <div className="flex items-end h-full pb-4">
              <button
                onClick={onDelete}
                className="w-full text-center text-3xl font-light text-gray-400 hover:text-red-500 transition-colors"
                title={`Remove this ${actionType} item`}
              >
                ×
              </button>
            </div>
          )}
        </FormField>
      </FormGrid>
    </div>
  );
};
