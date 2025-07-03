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

const ManualTransactionForm = ({ categories, formData, onUpdate, onAdd, showAddButton = true }) => {
  const { isDarkMode } = useTheme();
  const [errors, setErrors] = useState({});
  
  // Set default category when categories load and no category selected
  useEffect(() => {
    if (categories.length > 0 && !formData.categoryId) {
      onUpdate({ ...formData, categoryId: categories[0]?.id || '' });
    }
  }, [categories, formData.categoryId, onUpdate]);

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
    
    // Call the onAdd callback to create new form
    onAdd();
  };

  // Get unique types for the type dropdown
  const typeOptions = [
    { value: 'Income', label: 'Income' },
    { value: 'Expense', label: 'Expense' },
    { value: 'Savings', label: 'Savings' }
  ];

  // Filter categories based on selected type
  const selectedType = formData.categoryId ? categories.find(c => c.id === formData.categoryId)?.type : formData.type;
  const categoryOptions = categories
    .filter(cat => !cat.isSystemCategory || cat.id !== 'system-ignore') // Exclude ignore category for manual entry
    .filter(cat => !formData.type || cat.type === formData.type) // Filter by selected type
    .map(cat => ({
      value: cat.id,
      label: cat.name
    }));

  return (
    <div className="space-y-6">
      {/* Horizontal form layout - 16 column grid with custom proportions */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(16, 1fr)', gap: '1rem'}}>
        <div className="col-span-2">
          <div>
            <label className={`block text-base font-light mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Date
            </label>
            <DatePicker
              value={formData.date}
              onChange={(isoDate) => onUpdate({ ...formData, date: isoDate })}
              placeholder="Select date"
              className="w-full [&>button]:py-3 [&>button]:pb-4 [&>button]:text-base [&>button]:font-light"
            />
          </div>
        </div>
        <div className="col-span-4">
          <StandardInput
            label="Description"
            value={formData.description}
            onChange={(value) => onUpdate({ ...formData, description: value })}
            placeholder="Transaction description"
            error={errors.description}
            className="[&_label]:text-base [&_label]:font-light [&_input]:text-base [&_input]:font-light"
          />
        </div>
        <div className="col-span-3">
          <StandardInput
            label="Amount"
            type="currency"
            value={formData.amount}
            onChange={(value) => onUpdate({ ...formData, amount: value })}
            prefix="$"
            placeholder="0.00"
            error={errors.amount}
            className="[&_label]:text-base [&_label]:font-light [&_input]:text-base [&_input]:font-light"
          />
        </div>
        <div className="col-span-3">
          <StandardSelect
            label="Type"
            value={formData.type || ''}
            onChange={(value) => onUpdate({ ...formData, type: value, categoryId: '' })} // Clear category when type changes
            options={typeOptions}
            placeholder="Select type"
            className="[&_label]:text-base [&_label]:font-light [&_button]:text-base [&_button]:font-light"
          />
        </div>
        <div className="col-span-4">
          <StandardSelect
            label="Category"
            value={formData.categoryId}
            onChange={(value) => onUpdate({ ...formData, categoryId: value })}
            options={categoryOptions}
            error={errors.category}
            disabled={!formData.type}
            placeholder={formData.type ? "Select category" : "Select type first"}
            className="[&_label]:text-base [&_label]:font-light [&_button]:text-base [&_button]:font-light"
          />
        </div>
      </div>
      
      {/* Add transaction button - dashed box format like CSV import */}
      {showAddButton && (
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
      )}
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
  
  // Burger menu state
  const [menuOpen, setMenuOpen] = useState(false);

  // Handle menu actions using the standard navigation handler
  const handleMenuActionWrapper = (action) => {
    handleMenuAction(action, onNavigate, () => setMenuOpen(false), null);
  };
  
  // Manual entry state - array of transaction forms
  const [manualTransactions, setManualTransactions] = useState([{
    id: Date.now(),
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    type: '',
    categoryId: ''
  }]);
  
  // Success feedback for manual entries
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleStepChange = (step, data = null) => {
    setUploadStep(step);
    if (step === 'mapping' && data) {
      setMappingData(data);
    } else if (step === 'upload') {
      setMappingData(null);
    }
  };

  useEffect(() => {
    // Don't load any existing transactions - import page should start clean
    // const userData = dataManager.loadUserData();
    // if (userData?.transactions) {
    //   setTransactions(userData.transactions);
    // }
    
    // Load categories only
    const userData = dataManager.loadUserData();
    
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

  const handleAddNewForm = () => {
    // Add a new empty form to the manual transactions array
    setManualTransactions(prev => [...prev, {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount: '',
      type: '',
      categoryId: ''
    }]);
  };

  const handleUpdateManualTransaction = (index, formData) => {
    setManualTransactions(prev => prev.map((item, i) => 
      i === index ? formData : item
    ));
  };

  const handleImportManualTransactions = () => {
    // Validate and convert manual transaction forms to transactions
    const validTransactions = [];
    
    for (const formData of manualTransactions) {
      if (formData.description.trim() && formData.amount) {
        const validation = Currency.validate(formData.amount);
        if (validation.isValid) {
          const selectedCategory = categories.find(c => c.id === formData.categoryId);
          if (selectedCategory) {
            validTransactions.push({
              id: `manual_${Date.now()}_${Math.random()}`,
              date: formData.date,
              description: formData.description.trim(),
              amount: parseFloat(formData.amount),
              category: selectedCategory,
              confirmed: true,
              isManualEntry: true
            });
          }
        }
      }
    }
    
    if (validTransactions.length > 0) {
      // Save to localStorage immediately using dedicated transaction storage
      const existingTransactions = dataManager.loadTransactions() || [];
      const allTransactions = [...existingTransactions, ...validTransactions];
      dataManager.saveTransactions(allTransactions);
      
      // Show success notification and return to upload page
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
        setActiveView('upload');
        // Reset manual transactions
        setManualTransactions([{
          id: Date.now(),
          date: new Date().toISOString().split('T')[0],
          description: '',
          amount: '',
          type: '',
          categoryId: ''
        }]);
      }, 2000);
    }
  };

  const handleTransactionsSave = (finalTransactions) => {
    // Filter out ignored transactions - they should not be saved
    const transactionsToSave = finalTransactions.filter(t => 
      !t.category || t.category.id !== 'system-ignore'
    );
    
    // Save transactions using the dedicated transaction storage
    dataManager.saveTransactions(transactionsToSave);
    
    // Reset all import state to clean slate
    setTransactions([]);
    setActiveView('upload');
    setUploadStep('upload');
    setMappingData(null);
    setIsProcessing(false);
    
    // Use setTimeout to ensure state updates before navigation
    setTimeout(() => {
      onNavigate('dashboard');
    }, 0);
  };

  return (
    <div className={`min-h-screen transition-colors ${
      isDarkMode ? 'bg-black text-white' : 'bg-white text-black'
    }`}>
      <BurgerMenu 
        isOpen={menuOpen} 
        onClose={() => setMenuOpen(false)}
        onAction={handleMenuActionWrapper}
        currentPage="transactions"
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
            {/* Stacked Manual Transaction Forms */}
            <div className="space-y-8">
              {manualTransactions.map((formData, index) => (
                <div key={formData.id} className="space-y-6">
                  <ManualTransactionForm
                    categories={categories}
                    formData={formData}
                    onUpdate={(updatedData) => handleUpdateManualTransaction(index, updatedData)}
                    onAdd={handleAddNewForm}
                    showAddButton={index === manualTransactions.length - 1} // Only show on last form
                  />
                </div>
              ))}
            </div>
            
            {/* Success message - floating notification style */}
            {showSuccessMessage && (
              <div className="fixed top-8 right-8 z-50">
                <div className={`p-4 rounded-lg border-2 shadow-lg ${
                  isDarkMode 
                    ? 'bg-green-900 border-green-700 text-green-300' 
                    : 'bg-green-50 border-green-200 text-green-700'
                }`}>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-light">
                      {manualTransactions.filter(t => t.description && t.amount).length} transaction{manualTransactions.filter(t => t.description && t.amount).length !== 1 ? 's' : ''} imported successfully!
                    </span>
                  </div>
                </div>
              </div>
            )}
            
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
                onClick={handleImportManualTransactions}
                disabled={!manualTransactions.some(t => t.description && t.amount)}
                className={`text-xl font-light transition-all ${
                  manualTransactions.some(t => t.description && t.amount)
                    ? isDarkMode
                      ? 'text-white border-b-2 border-white hover:border-gray-400 pb-2'
                      : 'text-black border-b-2 border-black hover:border-gray-600 pb-2'
                    : 'text-gray-400 border-b-2 border-gray-400 cursor-not-allowed pb-2'
                }`}
              >
                Import Transactions
              </button>
            </div>
          </>
        )}

        {activeView === 'review' && (
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
                setTransactions(prev => {
                  let updatedTransactions;
                  
                  if (splits.length === 0) {
                    // Delete the transaction when empty array is passed
                    updatedTransactions = prev.filter(t => t.id !== transactionId);
                  } else {
                    // Replace with split transactions (for future splitting functionality)
                    updatedTransactions = prev.map(t => 
                      t.id === transactionId 
                        ? splits  // Replace with split transactions
                        : t
                    ).flat();
                  }
                  
                  // Auto-save deletions to localStorage immediately
                  if (splits.length === 0) {
                    const userData = dataManager.loadUserData();
                    const existingTransactions = userData.transactions || [];
                    
                    // Filter out ignored transactions and save to localStorage
                    const transactionsToSave = updatedTransactions.filter(t => 
                      !t.category || t.category.id !== 'system-ignore'
                    );
                    
                    dataManager.saveUserData({
                      ...userData,
                      transactions: transactionsToSave
                    });
                  }
                  
                  return updatedTransactions;
                });
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

// Helper component - matches Dashboard.jsx pattern
const BurgerIcon = () => (
  <div className="w-5 h-5 flex flex-col justify-between">
    <div className="w-full h-0.5 bg-current transition-all duration-300" />
    <div className="w-full h-0.5 bg-current transition-all duration-300" />
    <div className="w-full h-0.5 bg-current transition-all duration-300" />
  </div>
);
