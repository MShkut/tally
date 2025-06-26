// frontend/src/components/dashboard/ReviewTransactions.jsx
import React, { useState } from 'react';

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
} from '../shared/FormComponents';
import { TransactionHelpers } from 'utils/transactionHelpers';
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
  const [filter, setFilter] = useState('all'); // 'all', 'needs-review', 'income', 'expense'
  const [sortBy, setSortBy] = useState('confidence'); // 'confidence', 'date', 'amount'
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showSplitter, setShowSplitter] = useState(false);
  
  // Filter and sort transactions
  const filteredTransactions = transactions.filter(t => {
    if (filter === 'needs-review') return t.needsReview || t.confidence < 0.8;
    if (filter === 'income') return Currency.compare(t.amount, 0) > 0;
    if (filter === 'expense') return Currency.compare(t.amount, 0) < 0;
    return true;
  });

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (sortBy === 'confidence') return a.confidence - b.confidence;
    if (sortBy === 'date') return new Date(b.date) - new Date(a.date);
    if (sortBy === 'amount') return Currency.compare(Currency.abs(b.amount), Currency.abs(a.amount));
    return 0;
  });

  const filterOptions = [
    { value: 'all', label: 'All Transactions' },
    { value: 'needs-review', label: 'Needs Review' },
    { value: 'income', label: 'Income Only' },
    { value: 'expense', label: 'Expenses Only' }
  ];

  const sortOptions = [
    { value: 'confidence', label: 'Confidence (Low to High)' },
    { value: 'date', label: 'Date (Recent First)' },
    { value: 'amount', label: 'Amount (High to Low)' }
  ];

  const categoryOptions = categories.map(cat => ({
    value: cat.id,
    label: `${cat.name} (${cat.type})`
  }));

  const handleSplit = (transactionId) => {
    const transaction = transactions.find(t => t.id === transactionId);
    if (transaction) {
      setSelectedTransaction(transaction);
      setShowSplitter(true);
    }
  };

  const handleDelete = (transactionId) => {
    // Filter out the transaction
    onSplitTransaction(transactionId, []);
  };

  const handleSplitComplete = (splitTransactions) => {
    if (selectedTransaction) {
      onSplitTransaction(selectedTransaction.id, splitTransactions);
      setShowSplitter(false);
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
      <div className={`min-h-screen transition-colors duration-300 ${
        isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-12">
          
          {/* Header */}
          <div className="mb-24">
            <h1 className={`text-5xl font-light leading-tight mb-4 ${
              isDarkMode ? 'text-white' : 'text-black'
            }`}>
              Review & Categorize
            </h1>
            <p className={`text-xl font-light ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Confirm categories for your imported transactions. We've made suggestions based on your budget.
            </p>
          </div>
          
          {/* Import Summary */}
          <FormSection>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <SummaryCard
                title="Total Imported"
                value={stats.totalImported}
                subtitle="New transactions"
              />
              <SummaryCard
                title="Auto-Categorized"
                value={stats.categorized}
                subtitle="High confidence"
                accent={true}
              />
              <SummaryCard
                title="Need Review"
                value={stats.needsReview}
                subtitle="Low confidence"
              />
              <SummaryCard
                title="Split"
                value={stats.splits}
                subtitle="Transactions split"
              />
            </div>
          </FormSection>

          {/* Filters and Controls */}
          <FormSection>
            <FormGrid>
              <FormField span={6}>
                <StandardSelect
                  label="Filter Transactions"
                  value={filter}
                  onChange={setFilter}
                  options={filterOptions}
                  className="[&_label]:text-2xl [&_label]:font-medium [&_button]:text-xl [&_button]:font-medium"
                />
              </FormField>
              <FormField span={6}>
                <StandardSelect
                  label="Sort By"
                  value={sortBy}
                  onChange={setSortBy}
                  options={sortOptions}
                  className="[&_label]:text-2xl [&_label]:font-medium [&_button]:text-xl [&_button]:font-medium"
                />
              </FormField>
            </FormGrid>
          </FormSection>

          <SectionBorder />

          {/* Transaction List - Table-like layout */}
          <FormSection>
            <h2 className={`text-2xl font-light mb-8 ${
              isDarkMode ? 'text-white' : 'text-black'
            }`}>
              Transactions ({sortedTransactions.length})
            </h2>
            
            {sortedTransactions.length === 0 ? (
              <EmptyState
                title="No transactions match filter"
                description="Try adjusting your filter settings"
              />
            ) : (
              <div className="space-y-0">
                {/* Table Header */}
                <div className={`grid grid-cols-12 gap-4 pb-4 border-b ${
                  isDarkMode ? 'border-gray-800' : 'border-gray-200'
                }`}>
                  <div className={`col-span-1 text-sm font-medium ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    Date
                  </div>
                  <div className={`col-span-4 text-sm font-medium ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    Description
                  </div>
                  <div className={`col-span-2 text-sm font-medium text-right ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    Amount
                  </div>
                  <div className={`col-span-3 text-sm font-medium ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    Category
                  </div>
                  <div className={`col-span-2 text-sm font-medium text-right ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    Actions
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
                    onDelete={handleDelete}
                    getConfidenceIndicator={getConfidenceIndicator}
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
              onClick={onSave}
              className={`text-xl font-light transition-all ${
                isDarkMode
                  ? 'text-white border-b-2 border-white hover:border-gray-400 pb-2'
                  : 'text-black border-b-2 border-black hover:border-gray-600 pb-2'
              }`}
            >
              Save All Transactions
            </button>
          </div>

        </div>
      </div>

      {/* Split Transaction Inline */}
      {showSplitter && selectedTransaction && (
        <TransactionSplitter
          transaction={selectedTransaction}
          categories={categories}
          onComplete={handleSplitComplete}
          onCancel={() => {
            setShowSplitter(false);
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
  onDelete,
  getConfidenceIndicator
}) => {
  const { isDarkMode } = useTheme();
  const confidence = getConfidenceIndicator(transaction.confidence);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // Format date to be more compact
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleCategoryClick = (e) => {
    e.stopPropagation();
    setShowCategoryDropdown(!showCategoryDropdown);
  };

  const handleCategorySelect = (categoryId) => {
    onCategoryChange(transaction.id, categoryId);
    setShowCategoryDropdown(false);
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

      {/* Description - 4 columns, full text */}
      <div className={`col-span-4 text-base font-light ${
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
      <div className={`col-span-2 text-base font-mono text-right ${
        Currency.compare(transaction.amount, 0) >= 0 ? 'text-green-500' : 'text-red-500'
      }`}>
        {Currency.compare(transaction.amount, 0) >= 0 ? '+' : ''}
        {Currency.format(Currency.abs(transaction.amount))}
      </div>

      {/* Category - 3 columns, inline dropdown */}
      <div className="col-span-3 relative">
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
          <div className={`absolute top-full left-0 right-0 mt-2 border shadow-lg z-10 max-h-60 overflow-y-auto ${
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

      {/* Actions - 2 columns */}
      <div className="col-span-2 flex items-center justify-end gap-4">
        <button
          onClick={() => onSplit(transaction.id)}
          className={`
            text-base font-light border-b border-transparent hover:border-current pb-1
            ${isDarkMode 
              ? 'text-gray-400 hover:text-white' 
              : 'text-gray-600 hover:text-black'
            }
          `}
          title="Split this transaction"
        >
          Split
        </button>
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

// Transaction splitter component (editorial style, no modal)
const TransactionSplitter = ({ transaction, categories, onComplete, onCancel }) => {
  const { isDarkMode } = useTheme();
  const { 
    items: splits, 
    addItem, 
    updateItem, 
    deleteItem,
    hasItems
  } = useItemManager([
    {
      id: 1,
      description: transaction.description,
      amount: Currency.formatInput(Currency.abs(transaction.amount)),
      categoryId: transaction.category?.id || categories[0]?.id || ''
    }
  ]);

  const originalAmount = Currency.abs(transaction.amount);
  
  // Calculate total allocated using Currency system
  const totalAllocated = splits.reduce((sum, split) => {
    const splitAmount = Currency.parseCurrencyInput(split.amount) || '0';
    return Currency.add(sum, splitAmount);
  }, 0);
  
  const remaining = Currency.subtract(originalAmount, totalAllocated);
  const isValid = Currency.isEqual(remaining, 0);

  const categoryOptions = categories.map(cat => ({
    value: cat.id,
    label: `${cat.name} (${cat.type})`
  }));

  const handleAddSplit = () => {
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

    const splitTransactions = splits.map((split, index) => {
      const splitAmount = Currency.parseCurrencyInput(split.amount) || '0';
      const finalAmount = Currency.compare(transaction.amount, 0) < 0 ? 
        Currency.multiply(splitAmount, -1) : splitAmount;
        
      return {
        ...transaction,
        id: `${transaction.id}-split-${index + 1}`,
        description: split.description || transaction.description,
        amount: finalAmount,
        category: categories.find(c => c.id === split.categoryId),
        confidence: 1.0,
        needsReview: false,
        originalData: {
          ...transaction.originalData,
          splitFrom: transaction.id,
          splitIndex: index + 1,
          splitTotal: splits.length
        }
      };
    });

    onComplete(splitTransactions);
  };

  const autoDistribute = () => {
    const count = splits.length;
    const perItem = Currency.divide(originalAmount, count);
    const lastItemAmount = Currency.subtract(originalAmount, Currency.multiply(perItem, count - 1));
    
    splits.forEach((split, index) => {
      const amount = index === count - 1 ? lastItemAmount : perItem;
      updateItem(split.id, {
        ...split,
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
          title="Split Transaction"
          subtitle={`Original: ${transaction.description} - ${Currency.format(originalAmount)}`}
          onBack={onCancel}
          onNext={handleComplete}
          canGoNext={isValid}
          nextLabel="Apply Split"
          backLabel="Cancel"
        >
          
          {/* Split Controls */}
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

          {/* Split Items */}
          <FormSection>
            <div className="space-y-0">
              {splits.map((split) => (
                <SplitItem
                  key={split.id}
                  split={split}
                  categoryOptions={categoryOptions}
                  onUpdate={(updated) => updateItem(split.id, updated)}
                  onDelete={() => deleteItem(split.id)}
                  canDelete={splits.length > 1}
                />
              ))}
            </div>
            
            <div className="mt-8">
              <button
                onClick={handleAddSplit}
                className={`
                  w-full py-6 border-2 border-dashed transition-colors text-center
                  ${isDarkMode 
                    ? 'border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300' 
                    : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700'
                  }
                `}
              >
                <span className="text-xl font-light">Add Split Item</span>
              </button>
            </div>
          </FormSection>

          {/* Validation Status */}
          <FormSection>
            <div className={`
              text-center py-4 text-xl font-light
              ${isValid 
                ? 'text-green-500' 
                : 'text-red-500'
              }
            `}>
              {isValid 
                ? 'Split amounts match original transaction' 
                : `Split amounts must equal ${Currency.format(originalAmount)}`
              }
            </div>
          </FormSection>

        </StandardFormLayout>
      </div>
    </div>
  );
};

// Split item component
const SplitItem = ({ split, categoryOptions, onUpdate, onDelete, canDelete }) => {
  const { isDarkMode } = useTheme();

  const handleAmountChange = (value) => {
    // Use Currency.parseCurrencyInput to clean the input
    const cleanedValue = Currency.parseCurrencyInput(value);
    onUpdate({ ...split, amount: cleanedValue });
  };

  return (
    <div className={`py-8 border-b ${
      isDarkMode ? 'border-gray-800' : 'border-gray-200'
    }`}>
      <FormGrid>
        <FormField span={5}>
          <StandardInput
            label="Description"
            value={split.description}
            onChange={(value) => onUpdate({ ...split, description: value })}
            placeholder="What was this part for?"
            className="[&_label]:text-2xl [&_label]:font-medium [&_input]:text-2xl [&_input]:font-medium [&_input]:pb-4"
          />
        </FormField>
        <FormField span={2}>
          <StandardInput
            label="Amount"
            type="currency"
            value={split.amount}
            onChange={handleAmountChange}
            prefix="$"
            className="[&_label]:text-2xl [&_label]:font-medium [&_input]:text-2xl [&_input]:font-medium [&_input]:pb-4"
          />
        </FormField>
        <FormField span={4}>
          <StandardSelect
            label="Category"
            value={split.categoryId}
            onChange={(value) => onUpdate({ ...split, categoryId: value })}
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
                title="Remove this split"
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
