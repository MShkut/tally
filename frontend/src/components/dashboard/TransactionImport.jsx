// frontend/src/components/dashboard/TransactionImport.jsx
import React, { useState, useEffect } from 'react';

import { useTheme } from 'contexts/ThemeContext';
import { ThemeToggle } from 'components/shared/ThemeToggle';
import { Currency } from 'utils/currency';
import { BurgerMenu } from './BurgerMenu';
import { EnhancedCSVUpload } from './EnhancedCSVUpload';
import { ReviewTransactions } from './ReviewTransactions';
import { ManualTransactionEntry } from './ManualTransactionEntry';
import { normalizeMerchantName, suggestCategory } from 'utils/transactionHelpers';
import { dataManager } from 'utils/dataManager';
import { 
  EmptyState, 
  SummaryCard, 
  FormSection, 
  FormGrid, 
  FormField, 
  StandardInput, 
  StandardSelect 
} from '../shared/FormComponents';
import { handleMenuAction } from 'utils/navigationHandler';

const ManualTransactionForm = ({ categories, onAdd }) => {
  const { isDarkMode } = useTheme();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    categoryId: categories[0]?.id || ''
  });
  const [errors, setErrors] = useState({});

  const handleSubmit = () => {
    // Clear previous errors
    setErrors({});
    
    // Validate inputs
    if (!formData.description.trim()) {
      setErrors({ description: 'Description is required' });
      return;
    }
    
    const validation = Currency.validate(formData.amount);
    if (!validation.isValid) {
      setErrors({ amount: validation.error });
      return;
    }
    
    const selectedCategory = categories.find(c => c.id === formData.categoryId);
    if (!selectedCategory) {
      setErrors({ category: 'Please select a category' });
      return;
    }
    
    // Create transaction object
    const transaction = {
      date: formData.date,
      description: formData.description.trim(),
      amount: parseFloat(formData.amount),
      category: selectedCategory
    };
    
    // Call the onAdd callback
    onAdd(transaction);
    
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
            error={errors.description}
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
            error={errors.amount}
            className="[&_label]:text-2xl [&_label]:font-medium [&_input]:text-2xl [&_input]:font-medium [&_input]:pb-4"
          />
        </FormField>
        <FormField span={4}>
          <StandardSelect
            label="Category"
            value={formData.categoryId}
            onChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
            options={categoryOptions}
            error={errors.category}
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

export const TransactionImport = ({ onNavigate }) => {
  const { isDarkMode } = useTheme();
  const [activeView, setActiveView] = useState('upload'); // 'upload', 'manual', 'review'
  const [uploadStep, setUploadStep] = useState('upload'); // 'upload', 'mapping'
  const [mappingData, setMappingData] = useState(null); // { count, fileName }
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStepChange = (step, data = null) => {
    setUploadStep(step);
    if (step === 'mapping' && data) {
      setMappingData(data);
    } else if (step === 'upload') {
      setMappingData(null);
    }
  };

  useEffect(() => {
    // Load existing transactions and categories
    const userData = dataManager.loadUserData();
    if (userData?.transactions) {
      setTransactions(userData.transactions);
    }
    
    // Load all categories from onboarding data in order: Income, Savings, Expenses
    const allCategories = [];
    
    // 1. Add income sources as categories (first)
    if (userData?.income?.incomeSources) {
      const incomeCategories = userData.income.incomeSources.map(source => ({
        ...source,
        type: 'Income'
      }));
      allCategories.push(...incomeCategories);
    }
    
    // 2. Add savings goals as categories (second)
    if (userData?.savingsAllocation?.savingsGoals) {
      const savingsCategories = userData.savingsAllocation.savingsGoals.map(goal => ({
        ...goal,
        type: 'Savings'
      }));
      allCategories.push(...savingsCategories);
    }
    
    // 3. Add expense categories (third)
    if (userData?.expenses?.expenseCategories) {
      const expenseCategories = userData.expenses.expenseCategories.map(category => ({
        ...category,
        type: 'Expense'
      }));
      allCategories.push(...expenseCategories);
    }
    
    setCategories(allCategories);
  }, []);

  const handleCSVUpload = async (csvTransactions) => {
    setIsProcessing(true);
    try {
      // Process and categorize transactions
      const processedTransactions = csvTransactions.map(transaction => ({
        ...transaction,
        id: `${Date.now()}_${Math.random()}`,
        category: suggestCategory(transaction, categories),
        confirmed: false
      }));
      
      setTransactions(processedTransactions);
      setActiveView('review');
    } catch (error) {
      console.error('Error processing CSV:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualAdd = (transaction) => {
    const newTransaction = {
      ...transaction,
      id: `${Date.now()}_${Math.random()}`,
      confirmed: true
    };
    
    const updatedTransactions = [...transactions, newTransaction];
    setTransactions(updatedTransactions);
    
    // Save to localStorage
    const userData = dataManager.loadUserData();
    dataManager.saveUserData({
      ...userData,
      transactions: updatedTransactions
    });
  };

  const handleTransactionsSave = (finalTransactions) => {
    const userData = dataManager.loadUserData();
    dataManager.saveUserData({
      ...userData,
      transactions: finalTransactions
    });
    
    setTransactions(finalTransactions);
    onNavigate('dashboard');
  };

  return (
    <div className={`min-h-screen transition-colors ${
      isDarkMode ? 'bg-black text-white' : 'bg-white text-black'
    }`}>
      <BurgerMenu onNavigate={onNavigate} currentPage="transactions" />
      <ThemeToggle />
      
      <div className="max-w-6xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-light leading-tight mb-4">
            {activeView === 'review' 
              ? 'Review & Categorize'
              : activeView === 'upload' && uploadStep === 'mapping' 
                ? 'Map CSV Columns' 
                : 'Import Transactions'
            }
          </h1>
          <p className={`text-xl ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {activeView === 'review'
              ? 'Review your imported transactions and ensure they\'re properly categorized before saving'
              : activeView === 'upload' && uploadStep === 'mapping' && mappingData
                ? `Found ${mappingData.count} transactions in ${mappingData.fileName}. Tell us which columns contain your data.`
                : 'Upload a CSV file or manually enter transactions to track your spending'
            }
          </p>
        </div>

        {/* View Toggle */}
        {activeView !== 'review' && (
          <div className="flex space-x-8 mb-12">
            <button
              onClick={() => setActiveView('upload')}
              className={`text-xl font-light border-b-2 pb-2 transition-all ${
                activeView === 'upload'
                  ? isDarkMode
                    ? 'text-white border-white'
                    : 'text-black border-black'
                  : isDarkMode
                    ? 'text-gray-400 border-transparent hover:border-gray-400'
                    : 'text-gray-600 border-transparent hover:border-gray-600'
              }`}
            >
              CSV Upload
            </button>
            {!(activeView === 'upload' && uploadStep === 'mapping') && (
              <button
                onClick={() => setActiveView('manual')}
                className={`text-xl font-light border-b-2 pb-2 transition-all ${
                  activeView === 'manual'
                    ? isDarkMode
                      ? 'text-white border-white'
                      : 'text-black border-black'
                    : isDarkMode
                      ? 'text-gray-400 border-transparent hover:border-gray-400'
                      : 'text-gray-600 border-transparent hover:border-gray-600'
                }`}
              >
                Manual Entry
              </button>
            )}
            {transactions.length > 0 && (
              <button
                onClick={() => setActiveView('review')}
                className={`text-xl font-light border-b-2 pb-2 transition-all ${
                  activeView === 'review'
                    ? isDarkMode
                      ? 'text-white border-white'
                      : 'text-black border-black'
                    : isDarkMode
                      ? 'text-gray-400 border-transparent hover:border-gray-400'
                      : 'text-gray-600 border-transparent hover:border-gray-600'
                }`}
              >
                Review ({transactions.length})
              </button>
            )}
          </div>
        )}

        {/* Content */}
        {activeView === 'upload' && (
          <EnhancedCSVUpload
            onComplete={handleCSVUpload}
            onBack={() => onNavigate('dashboard')}
            onStepChange={handleStepChange}
          />
        )}

        {activeView === 'manual' && (
          <ManualTransactionForm
            categories={categories}
            onAdd={handleManualAdd}
          />
        )}

        {(() => {
          console.log('=== RENDER DEBUG ===');
          console.log('activeView:', activeView);
          console.log('transactions:', transactions);
          console.log('transactions.length:', transactions.length);
          console.log('Should render review?', activeView === 'review' && transactions.length > 0);
          console.log('==================');
          return activeView === 'review' && transactions.length > 0;
        })() && (
          <>
            {/* Import Summary */}
            <FormSection>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                <SummaryCard
                  title="Total Imported"
                  value={transactions.length}
                  subtitle="New transactions"
                />
                <SummaryCard
                  title="Auto-Categorized"
                  value={transactions.filter(t => t.category && t.category.id).length}
                  subtitle="High confidence"
                  accent={true}
                />
                <SummaryCard
                  title="Need Review"
                  value={transactions.filter(t => t.needsReview || (t.confidence && t.confidence < 0.8)).length}
                  subtitle="Low confidence"
                />
                <SummaryCard
                  title="Total Amount"
                  value={Currency.format(transactions.reduce((sum, t) => sum + Math.abs(t.amount || 0), 0))}
                  subtitle="Transaction value"
                />
              </div>
            </FormSection>

            <ReviewTransactions
              transactions={transactions}
              categories={categories}
              stats={{
                totalImported: transactions.length,
                categorized: transactions.filter(t => t.category && t.category.id).length,
                needsReview: transactions.filter(t => t.needsReview || (t.confidence && t.confidence < 0.8)).length,
                totalAmount: transactions.reduce((sum, t) => sum + Math.abs(t.amount || 0), 0)
              }}
              onCategoryChange={(transactionId, categoryId) => {
                setTransactions(prev => prev.map(t => 
                  t.id === transactionId 
                    ? { ...t, category: categories.find(c => c.id === categoryId) }
                    : t
                ));
              }}
              onSplitTransaction={(transactionId, splits) => {
                // Handle transaction splitting if needed
                console.log('Split transaction:', transactionId, splits);
              }}
              onSave={handleTransactionsSave}
              onBack={() => setActiveView('upload')}
              onboardingData={dataManager.loadUserData()}
            />
          </>
        )}

      </div>
    </div>
  );
};
