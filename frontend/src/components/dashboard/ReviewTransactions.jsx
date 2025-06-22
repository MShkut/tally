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
    if (filter === 'income') return t.amount > 0;
    if (filter === 'expense') return t.amount < 0;
    return true;
  });

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (sortBy === 'confidence') return a.confidence - b.confidence;
    if (sortBy === 'date') return new Date(b.date) - new Date(a.date);
    if (sortBy === 'amount') return Math.abs(b.amount) - Math.abs(a.amount);
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
      <StandardFormLayout
        title="Review & Categorize"
        subtitle="Confirm categories for your imported transactions. We've made suggestions based on your budget."
        onBack={onBack}
        onNext={onSave}
        canGoNext={true}
        nextLabel="Save All Transactions"
        backLabel="Back to Import"
      >
        
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
              />
            </FormField>
            <FormField span={6}>
              <StandardSelect
                label="Sort By"
                value={sortBy}
                onChange={setSortBy}
                options={sortOptions}
              />
            </FormField>
          </FormGrid>
        </FormSection>

        <SectionBorder />

        {/* Transaction List */}
        <FormSection title={`Transactions (${sortedTransactions.length})`}>
          {sortedTransactions.length === 0 ? (
            <EmptyState
              title="No transactions match filter"
              description="Try adjusting your filter settings"
            />
          ) : (
            <div className="space-y-0">
              {sortedTransactions.map((transaction) => (
                <TransactionReviewItem
                  key={transaction.id}
                  transaction={transaction}
                  categories={categories}
                  categoryOptions={categoryOptions}
                  onCategoryChange={onCategoryChange}
                  onSplit={handleSplit}
                  getConfidenceIndicator={getConfidenceIndicator}
                />
              ))}
            </div>
          )}
        </FormSection>

      </StandardFormLayout>

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

// Individual transaction review item
const TransactionReviewItem = ({ 
  transaction, 
  categories,
  categoryOptions, 
  onCategoryChange, 
  onSplit,
  getConfidenceIndicator
}) => {
  const { isDarkMode } = useTheme();
  const confidence = getConfidenceIndicator(transaction.confidence);
  const isSplitWorthy = TransactionHelpers.isSplitWorthy(transaction);

  return (
    <div className={`py-6 border-b ${
      isDarkMode ? 'border-gray-800' : 'border-gray-200'
    }`}>
      <FormGrid>
        {/* Date and Description */}
        <FormField span={5}>
          <div>
            <div className={`text-base font-light mb-1 ${
              isDarkMode ? 'text-white' : 'text-black'
            }`}>
              {transaction.description}
            </div>
            <div className={`text-sm font-light ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`}>
              {transaction.date}
            </div>
          </div>
        </FormField>

        {/* Amount */}
        <FormField span={2}>
          <div className={`text-base font-mono ${
            transaction.amount >= 0 ? 'text-green-500' : 'text-red-500'
          }`}>
            {transaction.amount >= 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
          </div>
        </FormField>

        {/* Category Selection */}
        <FormField span={3}>
          <StandardSelect
            value={transaction.category?.id || ''}
            onChange={(value) => onCategoryChange(transaction.id, value)}
            options={categoryOptions}
          />
        </FormField>

        {/* Confidence & Actions */}
        <FormField span={2}>
          <div className="flex items-center gap-4">
            <div className={`text-sm font-light ${confidence.color}`}>
              {confidence.text}
            </div>
            {isSplitWorthy && (
              <button
                onClick={() => onSplit(transaction.id)}
                className={`
                  text-sm font-light border-b border-transparent hover:border-current pb-1
                  ${isDarkMode 
                    ? 'text-gray-400 hover:text-white' 
                    : 'text-gray-600 hover:text-black'
                  }
                `}
                title="Split this transaction"
              >
                Split
              </button>
            )}
          </div>
        </FormField>
      </FormGrid>
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
      amount: Math.abs(transaction.amount).toFixed(2),
      categoryId: transaction.category?.id || categories[0]?.id || ''
    }
  ]);

  const originalAmount = Math.abs(transaction.amount);
  const totalAllocated = splits.reduce((sum, split) => 
    sum + (parseFloat(split.amount) || 0), 0
  );
  const remaining = originalAmount - totalAllocated;
  const isValid = Math.abs(remaining) < 0.01;

  const categoryOptions = categories.map(cat => ({
    value: cat.id,
    label: `${cat.name} (${cat.type})`
  }));

  const handleAddSplit = () => {
    addItem({
      description: '',
      amount: remaining > 0 ? remaining.toFixed(2) : '',
      categoryId: categories[0]?.id || ''
    });
  };

  const handleComplete = () => {
    if (!isValid) return;

    const splitTransactions = splits.map((split, index) => ({
      ...transaction,
      id: `${transaction.id}-split-${index + 1}`,
      description: split.description || transaction.description,
      amount: transaction.amount < 0 ? -parseFloat(split.amount) : parseFloat(split.amount),
      category: categories.find(c => c.id === split.categoryId),
      confidence: 1.0,
      needsReview: false,
      originalData: {
        ...transaction.originalData,
        splitFrom: transaction.id,
        splitIndex: index + 1,
        splitTotal: splits.length
      }
    }));

    onComplete(splitTransactions);
  };

  const autoDistribute = () => {
    const count = splits.length;
    const perItem = (originalAmount / count).toFixed(2);
    const lastItem = (originalAmount - (perItem * (count - 1))).toFixed(2);
    
    splits.forEach((split, index) => {
      updateItem(split.id, {
        ...split,
        amount: index === count - 1 ? lastItem : perItem
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
          subtitle={`Original: ${transaction.description} - $${originalAmount.toFixed(2)}`}
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
                  text-sm font-light border-b border-transparent hover:border-current pb-1
                  ${isDarkMode 
                    ? 'text-gray-400 hover:text-white' 
                    : 'text-gray-600 hover:text-black'
                  }
                `}
              >
                Distribute Evenly
              </button>
              <div className={`text-sm font-light ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>
                Remaining: ${remaining.toFixed(2)}
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
                <span className="text-lg font-light">Add Split Item</span>
              </button>
            </div>
          </FormSection>

          {/* Validation Status */}
          <FormSection>
            <div className={`
              text-center py-4 text-base font-light
              ${isValid 
                ? 'text-green-500' 
                : 'text-red-500'
              }
            `}>
              {isValid 
                ? 'Split amounts match original transaction' 
                : `Split amounts must equal $${originalAmount.toFixed(2)}`
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

  return (
    <div className={`py-6 border-b ${
      isDarkMode ? 'border-gray-800' : 'border-gray-200'
    }`}>
      <FormGrid>
        <FormField span={5}>
          <StandardInput
            label="Description"
            value={split.description}
            onChange={(value) => onUpdate({ ...split, description: value })}
            placeholder="What was this part for?"
          />
        </FormField>
        <FormField span={2}>
          <StandardInput
            label="Amount"
            type="currency"
            value={split.amount}
            onChange={(value) => onUpdate({ ...split, amount: value })}
            prefix="$"
          />
        </FormField>
        <FormField span={4}>
          <StandardSelect
            label="Category"
            value={split.categoryId}
            onChange={(value) => onUpdate({ ...split, categoryId: value })}
            options={categoryOptions}
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
