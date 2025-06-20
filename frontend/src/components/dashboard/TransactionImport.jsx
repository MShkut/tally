import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeToggle from '../shared/ThemeToggle';
import { 
  FormGrid, 
  FormField, 
  StandardInput,
  StandardSelect,
  AddItemButton,
  FormSection,
  StandardFormLayout,
  SummaryCard,
  SectionBorder
} from '../shared/FormComponents';
import dataManager from '../../utils/dataManager';

// File upload component using FormComponents styling
const FileUploadSection = ({ onFileUpload, isProcessing }) => {
  const { isDarkMode } = useTheme();

  return (
    <FormSection title="Upload Transaction CSV">
      <div className={`py-12 border-2 border-dashed text-center transition-all ${
        isDarkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'
      } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className={`text-6xl mb-6 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
          📄
        </div>
        <h3 className={`text-lg font-light mb-4 ${isDarkMode ? 'text-white' : 'text-black'}`}>
          Upload Transaction CSV
        </h3>
        <p className={`text-base font-light mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          CSV format: Date, Description, Amount
        </p>
        <input
          type="file"
          accept=".csv"
          onChange={onFileUpload}
          className={`block mx-auto text-lg font-light ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}
          disabled={isProcessing}
        />
        {isProcessing && (
          <p className={`text-sm mt-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            Processing file...
          </p>
        )}
      </div>
    </FormSection>
  );
};

// Manual transaction entry using FormComponents
const ManualTransactionEntry = ({ onAddTransaction, budgetCategories }) => {
  const { isDarkMode } = useTheme();
  const [transactionData, setTransactionData] = useState({
    description: '',
    amount: '',
    category: 'Uncategorized'
  });

  const categoryOptions = [
    { value: 'Uncategorized', label: 'Uncategorized' },
    ...budgetCategories.map(cat => ({ value: cat.name, label: cat.name }))
  ];

  const handleSubmit = () => {
    if (transactionData.description && transactionData.amount) {
      onAddTransaction(transactionData);
      setTransactionData({ description: '', amount: '', category: 'Uncategorized' });
    }
  };

  const canSubmit = transactionData.description.trim() && transactionData.amount;

  return (
    <FormSection title="Add Transaction Manually">
      <FormGrid>
        <FormField span={6}>
          <StandardInput
            label="Description"
            value={transactionData.description}
            onChange={(value) => setTransactionData(prev => ({ ...prev, description: value }))}
            placeholder="Transaction description"
          />
        </FormField>
        <FormField span={3}>
          <StandardInput
            label="Amount"
            type="currency"
            value={transactionData.amount}
            onChange={(value) => setTransactionData(prev => ({ ...prev, amount: value }))}
            prefix="$"
            placeholder="0.00"
          />
        </FormField>
        <FormField span={3}>
          <StandardSelect
            label="Category"
            value={transactionData.category}
            onChange={(value) => setTransactionData(prev => ({ ...prev, category: value }))}
            options={categoryOptions}
          />
        </FormField>
      </FormGrid>
      
      <div className="text-center mt-6">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`px-8 py-3 text-lg font-light border-b-2 transition-all ${
            canSubmit
              ? isDarkMode
                ? 'text-white border-white hover:border-gray-400'
                : 'text-black border-black hover:border-gray-600'
              : isDarkMode
                ? 'text-gray-600 border-gray-600 cursor-not-allowed'
                : 'text-gray-400 border-gray-400 cursor-not-allowed'
          }`}
        >
          Add Transaction
        </button>
      </div>
    </FormSection>
  );
};

// Transaction list item component
const TransactionItem = ({ transaction, budgetCategories, onCategoryChange }) => {
  const { isDarkMode } = useTheme();
  
  const categoryOptions = [
    { value: 'Uncategorized', label: 'Uncategorized' },
    ...budgetCategories.map(cat => ({ value: cat.name, label: cat.name }))
  ];

  return (
    <div className={`py-6 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
      <FormGrid>
        <FormField span={4}>
          <div>
            <div className={`text-lg font-light mb-2 ${
              isDarkMode ? 'text-white' : 'text-black'
            }`}>
              {transaction.description}
            </div>
            <div className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {transaction.date}
            </div>
          </div>
        </FormField>
        
        <FormField span={4}>
          <StandardSelect
            label=""
            value={transaction.category}
            onChange={(value) => onCategoryChange(transaction.id, value)}
            options={categoryOptions}
          />
        </FormField>
        
        <FormField span={4}>
          <div className={`text-right text-xl font-light ${
            transaction.amount >= 0 
              ? 'text-green-500' 
              : isDarkMode ? 'text-white' : 'text-black'
          }`}>
            {transaction.amount >= 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
          </div>
        </FormField>
      </FormGrid>
    </div>
  );
};

const TransactionImport = ({ onNavigate }) => {
  const { isDarkMode } = useTheme();
  const [transactions, setTransactions] = useState([]);
  const [budgetCategories, setBudgetCategories] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const loadedTransactions = dataManager.loadTransactions();
    const userData = dataManager.loadUserData();
    
    setTransactions(loadedTransactions);
    
    if (userData?.expenses?.expenseCategories) {
      setBudgetCategories(userData.expenses.expenseCategories);
    }
  }, []);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        
        const newTransactions = lines.slice(1).map((line, index) => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          return {
            id: Date.now() + index,
            date: values[0] || new Date().toISOString().split('T')[0],
            description: values[1] || 'Unknown Transaction',
            amount: parseFloat(values[2]) || 0,
            category: 'Uncategorized'
          };
        });

        const allTransactions = [...transactions, ...newTransactions];
        dataManager.saveTransactions(allTransactions);
        setTransactions(allTransactions);
        
        alert(`✅ Imported ${newTransactions.length} transactions!`);
      } catch (error) {
        alert('❌ Failed to import CSV. Please check format.');
      } finally {
        setIsProcessing(false);
      }
    };
    
    reader.readAsText(file);
  };

  const handleManualAdd = (transactionData) => {
    const newTransaction = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      description: transactionData.description,
      amount: parseFloat(transactionData.amount),
      category: transactionData.category
    };
    
    const updatedTransactions = [...transactions, newTransaction];
    dataManager.saveTransactions(updatedTransactions);
    setTransactions(updatedTransactions);
  };

  const updateCategory = (transactionId, newCategory) => {
    const updatedTransactions = transactions.map(t => 
      t.id === transactionId ? { ...t, category: newCategory } : t
    );
    dataManager.saveTransactions(updatedTransactions);
    setTransactions(updatedTransactions);
  };

  const recentTransactions = transactions.slice(-10).reverse();

  return (
    <>
      <ThemeToggle />
      <StandardFormLayout
        title="Import Your Transactions"
        subtitle="Upload bank transactions to track against your budget categories"
        onBack={() => onNavigate('dashboard')}
        onNext={() => onNavigate('dashboard')}
        canGoNext={transactions.length > 0}
        nextLabel="View Dashboard"
        backLabel="Back to Dashboard"
        showBack={true}
      >
        
        {/* CSV Upload Section */}
        <FileUploadSection 
          onFileUpload={handleFileUpload}
          isProcessing={isProcessing}
        />

        {/* Manual Transaction Entry */}
        <ManualTransactionEntry 
          onAddTransaction={handleManualAdd}
          budgetCategories={budgetCategories}
        />

        {/* Transaction Summary */}
        {transactions.length > 0 && (
          <>
            <SectionBorder />
            <FormSection>
              <div className="text-center">
                <SummaryCard
                  title="Total Transactions"
                  value={`${transactions.length} transactions imported`}
                  subtitle="Ready for categorization and analysis"
                  accent={true}
                />
              </div>
            </FormSection>
          </>
        )}

        {/* Recent Transactions List */}
        {recentTransactions.length > 0 && (
          <FormSection title={`Recent Transactions (${transactions.length} total)`}>
            <div className="space-y-0">
              {recentTransactions.map((transaction) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                  budgetCategories={budgetCategories}
                  onCategoryChange={updateCategory}
                />
              ))}
            </div>
          </FormSection>
        )}

        {/* Help Section */}
        <div className={`mt-16 p-8 border-l-4 ${
          isDarkMode ? 'border-gray-700 bg-gray-900/20' : 'border-gray-300 bg-gray-100'
        }`}>
          <h3 className={`text-xl font-light mb-4 ${
            isDarkMode ? 'text-white' : 'text-black'
          }`}>
            Supported CSV Format
          </h3>
          <div className={`space-y-3 text-base font-light ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            <p>• Date, Description, Amount (standard bank export format)</p>
            <p>• Works with exports from major banks and credit cards</p>
            <p>• Negative amounts for expenses, positive for income</p>
            <p>• All data processed locally on your device</p>
          </div>
        </div>

      </StandardFormLayout>
    </>
  );
};

export default TransactionImport;
