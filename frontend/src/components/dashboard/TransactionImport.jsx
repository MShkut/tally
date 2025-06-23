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
  EmptyState,
  useItemManager,
  validation,
  formatCurrency
} from '../shared/FormComponents';
import { dataManager } from "utils/dataManager";
import { TransactionHelpers } from 'utils/transactionHelpers';
import { BurgerMenu } from 'components/dashboard/BurgerMenu';
import { EnhancedCSVUpload } from 'components/dashboard/EnhancedCSVUpload';
import { ReviewTransactions } from 'components/dashboard/ReviewTransactions';

// Main component with enhanced flow
export const TransactionImport = ({ onNavigate }) => {
  const { isDarkMode } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [onboardingData, setOnboardingData] = useState(null);
  const [view, setView] = useState('overview'); // 'overview', 'csv-upload', 'review'
  const [importMethod, setImportMethod] = useState(null); // 'csv' or 'manual'
  
  // Transaction state
  const [allTransactions, setAllTransactions] = useState([]);
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // Import statistics
  const [importStats, setImportStats] = useState({
    totalImported: 0,
    categorized: 0,
    needsReview: 0,
    splits: 0
  });

  useEffect(() => {
    // Load saved data
    const userData = dataManager.loadUserData();
    const savedTransactions = dataManager.loadTransactions();
    
    setOnboardingData(userData);
    setAllTransactions(savedTransactions);
    
    // Build categories from user's budget
    if (userData?.expenses?.expenseCategories) {
      const expenseCategories = userData.expenses.expenseCategories.map(cat => ({
        id: cat.name.toLowerCase().replace(/\s+/g, '-'),
        name: cat.name,
        type: 'expense',
        budget: parseFloat(cat.amount) || 0
      }));
      
      const incomeCategories = userData.income?.incomeSources?.map(source => ({
        id: source.name.toLowerCase().replace(/\s+/g, '-'),
        name: source.name,
        type: 'income',
        expected: source.amount
      })) || [];
      
      const savingsCategories = userData.savingsAllocation?.savingsGoals?.map(goal => ({
        id: goal.name.toLowerCase().replace(/\s+/g, '-'),
        name: goal.name,
        type: 'savings',
        target: parseFloat(goal.amount) || 0
      })) || [];
      
      setCategories([
        { id: 'uncategorized', name: 'Uncategorized', type: 'unknown' },
        ...incomeCategories,
        ...expenseCategories,
        ...savingsCategories
      ]);
    }
  }, []);

  const handleMenuAction = (actionId) => {
    setMenuOpen(false);
    switch (actionId) {
      case 'dashboard':
        onNavigate('dashboard');
        break;
      case 'import':
        break; // Already here
      case 'start-next-period':
        onNavigate('onboarding');
        break;
      case 'export':
        const exportData = dataManager.exportData();
        console.log('Export data:', exportData);
        // TODO: Implement actual export download
        break;
      case 'reset-data':
        dataManager.resetAllData();
        onNavigate('onboarding');
        break;
      default:
        console.log(`Action ${actionId} not implemented`);
    }
  };

  const handleCSVUpload = (csvData, columnMapping) => {
    // Transform CSV data to transactions
    const newTransactions = csvData.map((row, index) => {
      const amount = parseFloat(row[columnMapping.amount]) || 0;
      const description = row[columnMapping.description] || 'Unknown Transaction';
      
      // Auto-categorize
      const suggestedCategory = TransactionHelpers.suggestCategory(
        { description, amount }, 
        categories
      );
      
      return {
        id: `import-${Date.now()}-${index}`,
        date: row[columnMapping.date] || new Date().toISOString().split('T')[0],
        description,
        normalizedMerchant: TransactionHelpers.normalizeMerchantName(description),
        amount,
        category: suggestedCategory?.category || categories[0], // Default to uncategorized
        confidence: suggestedCategory?.confidence || 0,
        needsReview: (suggestedCategory?.confidence || 0) < 0.8,
        source: 'csv',
        originalData: row
      };
    });
    
    setPendingTransactions(newTransactions);
    setImportStats({
      totalImported: newTransactions.length,
      categorized: newTransactions.filter(t => t.category.id !== 'uncategorized').length,
      needsReview: newTransactions.filter(t => t.needsReview).length,
      splits: 0
    });
    setView('review');
  };

  const handleManualAdd = (transaction) => {
    const newTransaction = {
      ...transaction,
      id: `manual-${Date.now()}`,
      source: 'manual',
      needsReview: false,
      confidence: 1.0
    };
    
    setPendingTransactions([...pendingTransactions, newTransaction]);
    setImportStats(prev => ({
      ...prev,
      totalImported: prev.totalImported + 1,
      categorized: prev.categorized + 1
    }));
  };

  const handleCategoryChange = (transactionId, categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;
    
    setPendingTransactions(prev => prev.map(t => 
      t.id === transactionId 
        ? { ...t, category, needsReview: false, confidence: 1.0 }
        : t
    ));
    
    // Update stats
    const updated = pendingTransactions.map(t => 
      t.id === transactionId 
        ? { ...t, category, needsReview: false }
        : t
    );
    setImportStats({
      ...importStats,
      categorized: updated.filter(t => t.category.id !== 'uncategorized').length,
      needsReview: updated.filter(t => t.needsReview).length
    });
  };

  const handleSplitTransaction = (transactionId, splitTransactions) => {
    // Replace original with splits
    const otherTransactions = pendingTransactions.filter(t => t.id !== transactionId);
    setPendingTransactions([...otherTransactions, ...splitTransactions]);
    
    setImportStats(prev => ({
      ...prev,
      totalImported: prev.totalImported + splitTransactions.length - 1,
      splits: prev.splits + 1
    }));
  };

  const handleSaveTransactions = () => {
    // Combine with existing transactions
    const updatedTransactions = [...allTransactions, ...pendingTransactions];
    dataManager.saveTransactions(updatedTransactions);
    
    // Clear pending and return to dashboard
    setPendingTransactions([]);
    onNavigate('dashboard');
  };

  // Render different views
  if (view === 'csv-upload') {
    return <EnhancedCSVUpload onComplete={handleCSVUpload} onBack={() => setView('overview')} />;
  }

  if (view === 'review') {
    return (
      <ReviewTransactions
        transactions={pendingTransactions}
        categories={categories}
        stats={importStats}
        onCategoryChange={handleCategoryChange}
        onSplitTransaction={handleSplitTransaction}
        onSave={handleSaveTransactions}
        onBack={() => setView('overview')}
        onboardingData={onboardingData}
      />
    );
  }

  // Overview/Main view
  return (
    <>
      <BurgerMenu 
        isOpen={menuOpen} 
        onClose={() => setMenuOpen(false)}
        onAction={handleMenuAction}
        currentPage="import"
      />
      
      <ThemeToggle />
      
      {/* Fixed burger menu button */}
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

      <StandardFormLayout
        title="Import Transactions"
        subtitle="Add transactions to track against your budget. Import from your bank or add them manually."
        onBack={() => onNavigate('dashboard')}
        onNext={() => onNavigate('dashboard')}
        canGoNext={allTransactions.length > 0}
        nextLabel="Back to Dashboard"
        backLabel="Dashboard"
        className="ml-16"
      >
        
        {/* Summary of existing transactions */}
        {allTransactions.length > 0 && (
          <FormSection>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <SummaryCard
                title="Total Transactions"
                value={allTransactions.length}
                subtitle="Already imported"
              />
              <SummaryCard
                title="This Month"
                value={getThisMonthCount(allTransactions)}
                subtitle="Current month transactions"
              />
              <SummaryCard
                title="Categorized"
                value={`${getCategorizedPercentage(allTransactions)}%`}
                subtitle="Fully categorized"
                accent={true}
              />
            </div>
          </FormSection>
        )}

        {/* Import Methods */}
        <FormSection title="Choose Import Method">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* CSV Import */}
            <button
              onClick={() => setView('csv-upload')}
              className={`
                p-12 border-2 transition-all text-center group
                ${isDarkMode 
                  ? 'border-gray-700 hover:border-white' 
                  : 'border-gray-300 hover:border-black'
                }
              `}
            >
              <h3 className={`text-3xl font-light mb-4 ${
                isDarkMode ? 'text-white' : 'text-black'
              }`}>
                Import CSV File
              </h3>
              <p className={`text-xl font-light ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Upload bank or credit card statements
              </p>
            </button>

            {/* Manual Entry */}
            <div className={`
              p-12 border transition-all
              ${isDarkMode 
                ? 'border-gray-700' 
                : 'border-gray-300'
              }
            `}>
              <h3 className={`text-3xl font-light mb-8 text-center ${
                isDarkMode ? 'text-white' : 'text-black'
              }`}>
                Add Manually
              </h3>
              <ManualTransactionForm 
                categories={categories}
                onAdd={handleManualAdd}
              />
            </div>
          </div>
        </FormSection>

        {/* Recent Transactions */}
        {allTransactions.length > 0 && (
          <>
            <SectionBorder />
            <DataSection
              title="Recent Transactions"
              data={allTransactions.slice(-5).reverse()}
              renderItem={(transaction) => (
                <TransactionListItem
                  key={transaction.id}
                  title={transaction.description}
                  subtitle={transaction.date}
                  amount={transaction.amount}
                  category={transaction.category?.name}
                  isIncome={transaction.amount > 0}
                  isExpense={transaction.amount < 0}
                />
              )}
              emptyState={
                <EmptyState
                  title="No transactions yet"
                  description="Import a CSV or add manually to get started"
                />
              }
            />
          </>
        )}

      </StandardFormLayout>
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

// Simplified manual transaction form
const ManualTransactionForm = ({ categories, onAdd }) => {
  const { isDarkMode } = useTheme();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    categoryId: categories[0]?.id || ''
  });

  const handleSubmit = () => {
    if (!formData.description || !formData.amount) return;
    
    const category = categories.find(c => c.id === formData.categoryId);
    onAdd({
      date: formData.date,
      description: formData.description,
      amount: parseFloat(formData.amount),
      category,
      normalizedMerchant: TransactionHelpers.normalizeMerchantName(formData.description)
    });
    
    // Reset form
    setFormData({
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount: '',
      categoryId: categories[0]?.id || ''
    });
  };

  const categoryOptions = categories.map(cat => ({
    value: cat.id,
    label: `${cat.name} (${cat.type})`
  }));

  return (
    <div className="space-y-6">
      <FormGrid>
        <FormField span={12}>
          <StandardInput
            label="Description"
            value={formData.description}
            onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
            placeholder="Coffee Shop, Grocery Store, etc."
            className="[&_label]:text-2xl [&_label]:font-medium [&_input]:text-2xl [&_input]:font-medium [&_input]:pb-4"
          />
        </FormField>
      </FormGrid>
      
      <FormGrid>
        <FormField span={4}>
          <StandardInput
            label="Date"
            type="date"
            value={formData.date}
            onChange={(value) => setFormData(prev => ({ ...prev, date: value }))}
            className="[&_label]:text-2xl [&_label]:font-medium [&_input]:text-2xl [&_input]:font-medium [&_input]:pb-4"
          />
        </FormField>
        <FormField span={4}>
          <StandardInput
            label="Amount"
            type="currency"
            value={formData.amount}
            onChange={(value) => setFormData(prev => ({ ...prev, amount: value }))}
            prefix="$"
            placeholder="0.00"
            className="[&_label]:text-2xl [&_label]:font-medium [&_input]:text-2xl [&_input]:font-medium [&_input]:pb-4"
          />
        </FormField>
        <FormField span={4}>
          <StandardSelect
            label="Category"
            value={formData.categoryId}
            onChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
            options={categoryOptions}
            className="[&_label]:text-2xl [&_label]:font-medium [&_button]:text-2xl [&_button]:font-medium [&_button]:pb-4"
          />
        </FormField>
      </FormGrid>
      
      <div className="text-center">
        <button
          onClick={handleSubmit}
          disabled={!formData.description || !formData.amount}
          className={`
            text-xl font-light border-b-2 pb-2 transition-all
            ${formData.description && formData.amount
              ? isDarkMode
                ? 'text-white border-white hover:border-gray-400'
                : 'text-black border-black hover:border-gray-600'
              : 'text-gray-400 border-gray-400 cursor-not-allowed'
            }
          `}
        >
          Add Transaction
        </button>
      </div>
    </div>
  );
};

// Helper functions
function getThisMonthCount(transactions) {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  
  return transactions.filter(t => {
    const date = new Date(t.date);
    return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
  }).length;
}

function getCategorizedPercentage(transactions) {
  if (transactions.length === 0) return 0;
  const categorized = transactions.filter(t => 
    t.category && t.category.id !== 'uncategorized'
  ).length;
  return Math.round((categorized / transactions.length) * 100);
}
