// frontend/src/components/dashboard/TransactionImport.jsx
import React, { useState, useEffect, useRef } from 'react';

import { useTheme } from 'contexts/ThemeContext';
import { ThemeToggle } from 'components/shared/ThemeToggle';
import { Currency } from 'utils/currency';
import { BurgerMenu } from 'components/shared/BurgerMenu';
import { EnhancedCSVUpload } from './EnhancedCSVUpload';
import { ReviewTransactions } from './ReviewTransactions';
import { normalizeMerchantName, suggestCategory } from 'utils/actions/import/transactionHelpers';
import { enhanceCategories, shouldAutoIgnore, learnMerchantMapping } from 'utils/actions/import/categoryEnhancer';
import { dataManager } from 'utils/dataManager';
import { 
  EmptyState, 
  SummaryCard, 
  FormSection, 
  FormGrid, 
  FormField, 
  StandardInput, 
  StandardSelect 
} from 'components/shared/FormComponents';
import { DatePicker } from 'components/shared/DatePicker';
import { handleMenuAction } from 'utils/navigationHandler';

const ManualTransactionForm = ({ categories, onAdd, formData, setFormData }) => {
  const { isDarkMode } = useTheme();
  const [errors, setErrors] = useState({});
  
  // Set default category when categories load and no category selected
  useEffect(() => {
    if (categories.length > 0 && !formData.categoryId) {
      setFormData(prev => ({ ...prev, categoryId: categories[0]?.id || '' }));
    }
  }, [categories, formData.categoryId, setFormData]);

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
    
    // Reset form after adding transaction
    setFormData({
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount: '',
      categoryId: categories[0]?.id || ''
    });
  };

  const categoryOptions = categories.map(cat => ({
    value: cat.id,
    label: cat.isSystemCategory ? cat.name : `${cat.name} (${cat.type})`
  }));

  return (
    <div className="space-y-6">
      {/* Horizontal form layout - copying ReviewTransactions approach */}
      <FormGrid>
        <FormField span={2} mobileSpan={2}>
          <div>
            <label className={`block text-base font-light mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Date *
            </label>
            <DatePicker
              value={formData.date}
              onChange={(isoDate) => setFormData(prev => ({ ...prev, date: isoDate }))}
              placeholder="Select date"
            />
          </div>
        </FormField>
        <FormField span={4} mobileSpan={4}>
          <StandardInput
            label="Description"
            value={formData.description}
            onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
            placeholder="Transaction description"
            error={errors.description}
            className="[&_label]:text-base [&_label]:font-light [&_input]:text-base [&_input]:font-light"
          />
        </FormField>
        <FormField span={3} mobileSpan={3}>
          <StandardInput
            label="Amount"
            type="currency"
            value={formData.amount}
            onChange={(value) => setFormData(prev => ({ ...prev, amount: value }))}
            prefix="$"
            placeholder="0.00"
            error={errors.amount}
            className="[&_label]:text-base [&_label]:font-light [&_input]:text-base [&_input]:font-light"
          />
        </FormField>
        <FormField span={3} mobileSpan={3}>
          <StandardSelect
            label="Category"
            value={formData.categoryId}
            onChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
            options={categoryOptions}
            error={errors.category}
            className="[&_label]:text-base [&_label]:font-light [&_button]:text-base [&_button]:font-light"
          />
        </FormField>
      </FormGrid>
      
      {/* Add transaction button - dashed box format like CSV import */}
      <button
        onClick={handleSubmit}
        disabled={!formData.description || !formData.amount}
        className={`
          w-full py-6 border-2 border-dashed transition-colors text-center
          ${formData.description && formData.amount
            ? isDarkMode 
              ? 'border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300' 
              : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700'
            : isDarkMode
              ? 'border-gray-700 text-gray-500 cursor-not-allowed'
              : 'border-gray-200 text-gray-400 cursor-not-allowed'
          }
        `}
      >
        <span className="text-xl font-light">
          Add Transaction
        </span>
      </button>
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
  
  // Preserve manual form data between view switches
  const [manualFormData, setManualFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    categoryId: ''
  });

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
    
    // Enhance categories with keywords and merchant mappings, add Ignore category
    const enhancedCategories = enhanceCategories(allCategories);
    setCategories(enhancedCategories);
  }, []);

  const handleCSVUpload = async (csvTransactions) => {
    setIsProcessing(true);
    try {
      // Process and categorize transactions
      const processedTransactions = csvTransactions.map(transaction => {
        let suggestedCategory = null;
        let confidence = 0;
        let needsReview = true;
        
        // Check if transaction should be auto-ignored
        if (shouldAutoIgnore(transaction)) {
          const ignoreCategory = categories.find(c => c.id === 'system-ignore');
          if (ignoreCategory) {
            suggestedCategory = ignoreCategory;
            confidence = 1.0;
            needsReview = false;
          }
        } else {
          // Use smart categorization for non-ignored transactions
          const suggestion = suggestCategory(transaction, categories);
          if (suggestion) {
            suggestedCategory = suggestion.category;
            confidence = suggestion.confidence;
            needsReview = confidence < 0.8;
          }
        }
        
        return {
          ...transaction,
          id: `${Date.now()}_${Math.random()}`,
          category: suggestedCategory,
          confidence: confidence,
          needsReview: needsReview,
          confirmed: false
        };
      });
      
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
    // Filter out ignored transactions - they should not be saved
    const transactionsToSave = finalTransactions.filter(t => 
      !t.category || t.category.id !== 'system-ignore'
    );
    
    const userData = dataManager.loadUserData();
    dataManager.saveUserData({
      ...userData,
      transactions: transactionsToSave
    });
    
    setTransactions(transactionsToSave);
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
          <>
            <ManualTransactionForm
              categories={categories}
              onAdd={handleManualAdd}
              formData={manualFormData}
              setFormData={setManualFormData}
            />
            
            {/* Navigation buttons for manual entry */}
            <div className="flex justify-between items-center mt-16">
              <button
                onClick={() => setActiveView('upload')}
                className={`text-lg font-light transition-colors ${
                  isDarkMode 
                    ? 'text-gray-400 hover:text-white border-b border-gray-700 hover:border-white pb-1' 
                    : 'text-gray-600 hover:text-black border-b border-gray-300 hover:border-black pb-1'
                }`}
              >
                Cancel
              </button>
              
              <button
                onClick={() => {
                  if (transactions.length > 0) {
                    setActiveView('review');
                  }
                }}
                disabled={transactions.length === 0}
                className={`text-xl font-light transition-all ${
                  transactions.length > 0
                    ? isDarkMode
                      ? 'text-white border-b-2 border-white hover:border-gray-400 pb-2'
                      : 'text-black border-b-2 border-black hover:border-gray-600 pb-2'
                    : 'text-gray-400 border-b-2 border-gray-400 cursor-not-allowed pb-2'
                }`}
              >
                Import {transactions.length > 0 ? `${transactions.length} Transaction${transactions.length > 1 ? 's' : ''}` : 'Transactions'}
              </button>
            </div>
          </>
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

            <ReviewTransactions
              transactions={transactions}
              categories={categories}
              stats={(() => {
                const nonIgnoredTransactions = transactions.filter(t => t.category?.id !== 'system-ignore');
                return {
                  totalImported: transactions.length,
                  categorized: nonIgnoredTransactions.filter(t => t.category && t.category.id && !t.needsReview).length,
                  needsReview: nonIgnoredTransactions.filter(t => t.needsReview || (t.confidence && t.confidence < 0.8)).length,
                  totalAmount: nonIgnoredTransactions.reduce((sum, t) => sum + Math.abs(t.amount || 0), 0)
                };
              })()}
              onCategoryChange={(transactionId, categoryId) => {
                setTransactions(prev => prev.map(t => {
                  if (t.id === transactionId) {
                    const newCategory = categories.find(c => c.id === categoryId);
                    
                    // Learn merchant mapping if not system category
                    if (newCategory && !newCategory.isSystemCategory && t.description) {
                      learnMerchantMapping(t.description, categoryId);
                    }
                    
                    return { ...t, category: newCategory };
                  }
                  return t;
                }));
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
