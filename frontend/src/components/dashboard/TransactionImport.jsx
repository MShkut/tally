// frontend/src/components/dashboard/TransactionImport.jsx
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
  DataSection,
  TransactionListItem,
  EmptyState
} from '../shared/FormComponents';
import { dataManager } from "utils/dataManager";

import { CSVUpload } from 'components/dashboard/CSVUpload';

// Simplified manual transaction entry
export const ManualTransactionEntry = ({ onAddTransaction, budgetCategories }) => {
  const [data, setData] = useState({ description: '', amount: '', category: 'Uncategorized' });
  
  const categoryOptions = [
    { value: 'Uncategorized', label: 'Uncategorized' },
    ...budgetCategories.map(cat => ({ value: cat.name, label: cat.name }))
  ];

  const handleSubmit = () => {
    if (data.description && data.amount) {
      onAddTransaction({
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        ...data,
        amount: parseFloat(data.amount),
        source: 'manual'
      });
      setData({ description: '', amount: '', category: 'Uncategorized' });
    }
  };

  const canSubmit = data.description.trim() && data.amount;

  return (
    <FormSection title="Add Transaction Manually">
      <FormGrid>
        <FormField span={6}>
          <StandardInput
            label="Description"
            value={data.description}
            onChange={(value) => setData(prev => ({ ...prev, description: value }))}
            placeholder="Transaction description"
          />
        </FormField>
        <FormField span={3}>
          <StandardInput
            label="Amount"
            type="currency"
            value={data.amount}
            onChange={(value) => setData(prev => ({ ...prev, amount: value }))}
            prefix="$"
          />
        </FormField>
        <FormField span={3}>
          <StandardSelect
            label="Category"
            value={data.category}
            onChange={(value) => setData(prev => ({ ...prev, category: value }))}
            options={categoryOptions}
          />
        </FormField>
      </FormGrid>
      
      <div className="text-center mt-6">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`px-8 py-3 text-lg font-light border-b-2 transition-all ${
            canSubmit ? 'text-black border-black hover:border-gray-600' : 'text-gray-400 border-gray-400'
          }`}
        >
          Add Transaction
        </button>
      </div>
    </FormSection>
  );
};

// Simplified transaction categorization
export const TransactionCategorization = ({ transactions, budgetCategories, onCategoryChange }) => {
  const [filter, setFilter] = useState('all');
  
  const categoryOptions = [
    { value: 'Uncategorized', label: 'Uncategorized' },
    ...budgetCategories.map(cat => ({ value: cat.name, label: cat.name }))
  ];

  const filterOptions = [
    { value: 'all', label: 'All Transactions' },
    { value: 'uncategorized', label: 'Uncategorized Only' },
    { value: 'income', label: 'Income Only' },
    { value: 'expenses', label: 'Expenses Only' }
  ];

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'uncategorized') return t.category === 'Uncategorized';
    if (filter === 'income') return t.amount > 0;
    if (filter === 'expenses') return t.amount < 0;
    return true;
  });

  const categorizedCount = transactions.filter(t => t.category !== 'Uncategorized').length;
  const progress = transactions.length ? Math.round((categorizedCount / transactions.length) * 100) : 0;

  const renderTransaction = (transaction) => (
    <div key={transaction.id} className="py-4 border-b border-gray-200">
      <FormGrid>
        <FormField span={6}>
          <div>
            <div className="text-base font-light mb-1">{transaction.description}</div>
            <div className="text-sm text-gray-500">{transaction.date}</div>
          </div>
        </FormField>
        <FormField span={3}>
          <StandardSelect
            value={transaction.category}
            onChange={(value) => onCategoryChange(transaction.id, value)}
            options={categoryOptions}
          />
        </FormField>
        <FormField span={3}>
          <div className={`text-right text-lg font-mono ${
            transaction.amount >= 0 ? 'text-green-500' : 'text-red-500'
          }`}>
            {transaction.amount >= 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
          </div>
        </FormField>
      </FormGrid>
    </div>
  );

  return (
    <FormSection title="Review & Categorize Transactions">
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
          <SummaryCard
            title="Categorization Progress"
            value={`${categorizedCount}/${transactions.length} (${progress}%)`}
            subtitle={progress === 100 ? 'Complete!' : 'In progress'}
          />
        </FormField>
      </FormGrid>

      <div className="mt-6">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map(renderTransaction)
        ) : (
          <EmptyState
            title="No transactions match filter"
            description="Try adjusting your filter settings"
          />
        )}
      </div>
    </FormSection>
  );
};

// Main component
export const TransactionImport = ({ onNavigate }) => {
  const [view, setView] = useState('main'); // 'main', 'csv-import'
  const [transactions, setTransactions] = useState([]);
  const [budgetCategories, setBudgetCategories] = useState([]);

  useEffect(() => {
    setTransactions(dataManager.loadTransactions());
    const userData = dataManager.loadUserData();
    if (userData?.expenses?.expenseCategories) {
      setBudgetCategories(userData.expenses.expenseCategories);
    }
  }, []);

  const handleCSVImport = (importedTransactions) => {
    if (importedTransactions) {
      const updatedTransactions = [...transactions, ...importedTransactions];
      dataManager.saveTransactions(updatedTransactions);
      setTransactions(updatedTransactions);
    }
    setView('main');
  };

  if (view === 'csv-import') {
    return (
      <CSVUpload
        onImportComplete={handleCSVImport}
        onCancel={() => setView('main')}
      />
    );
  }

  const handleManualAdd = (transaction) => {
    const updatedTransactions = [...transactions, transaction];
    dataManager.saveTransactions(updatedTransactions);
    setTransactions(updatedTransactions);
  };

  const handleCategoryChange = (transactionId, newCategory) => {
    const updatedTransactions = transactions.map(t => 
      t.id === transactionId ? { ...t, category: newCategory } : t
    );
    dataManager.saveTransactions(updatedTransactions);
    setTransactions(updatedTransactions);
  };

  return (
    <>
      <ThemeToggle />
      <StandardFormLayout
        title="Import Your Transactions"
        subtitle="Upload bank transactions or add them manually to track against your budget"
        onBack={() => onNavigate('dashboard')}
        onNext={() => onNavigate('dashboard')}
        canGoNext={transactions.length > 0}
        nextLabel="View Dashboard"
        backLabel="Back to Dashboard"
      >
        
        {/* Import Options */}
        <FormSection title="Import Methods">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <button
              onClick={() => setView('csv-import')}
              className="p-8 border-2 border-dashed border-gray-300 hover:border-gray-400 text-center transition-colors"
            >
              <div className="text-4xl mb-4">📄</div>
              <h3 className="text-lg font-medium mb-2">Upload CSV File</h3>
              <p className="text-sm text-gray-600">Import from bank or credit card</p>
            </button>
            <div className="p-8 border border-gray-200">
              <div className="text-4xl mb-4 text-center">✏️</div>
              <h3 className="text-lg font-medium mb-4 text-center">Add Manually</h3>
              <ManualTransactionEntry 
                onAddTransaction={handleManualAdd}
                budgetCategories={budgetCategories}
              />
            </div>
          </div>
        </FormSection>

        {/* Transaction Summary */}
        {transactions.length > 0 && (
          <>
            <SectionBorder />
            <FormSection>
              <SummaryCard
                title="Total Transactions"
                value={`${transactions.length} transactions imported`}
                subtitle="Ready for categorization and analysis"
                accent={true}
              />
            </FormSection>
          </>
        )}

        {/* Transaction List */}
        {transactions.length > 0 && (
          <TransactionCategorization
            transactions={transactions.slice(-20).reverse()}
            budgetCategories={budgetCategories}
            onCategoryChange={handleCategoryChange}
          />
        )}

        {/* Help */}
        <div className="mt-16 p-8 border-l-4 border-gray-300 bg-gray-100">
          <h3 className="text-xl font-light mb-4">CSV Format Support</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• Standard bank export format (Date, Description, Amount)</p>
            <p>• Works with major banks and credit cards</p>
            <p>• Column mapping saves your preferences</p>
            <p>• All data processed locally on your device</p>
          </div>
        </div>

      </StandardFormLayout>
    </>
  );
}
