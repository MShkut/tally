import React, { useState, useEffect } from 'react';
import Plus from 'lucide-react/dist/esm/icons/plus';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';

import { normalizeMerchantName } from 'utils/transactionHelpers';
import { Currency } from 'utils/currency';
import { useTheme } from 'contexts/ThemeContext';

export const ManualTransactionEntry = ({ categories, onAddTransaction }) => {
  const { isDarkMode } = useTheme();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    categoryId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (categories.length > 0 && !formData.categoryId) {
      setFormData(prev => ({ ...prev, categoryId: categories[0].id }));
    }
  }, [categories, formData.categoryId]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.amount || formData.amount === '0') {
      newErrors.amount = 'Amount is required and cannot be zero';
    } else {
      // Use Currency validation for amount
      const amountValidation = Currency.validate(Math.abs(parseFloat(formData.amount) || 0));
      if (!amountValidation.isValid) {
        newErrors.amount = amountValidation.error;
      }
    }
    
    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }
    
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAmountChange = (e) => {
    const input = e.target.value;
    
    // Allow negative sign at the beginning
    if (input === '-') {
      setFormData(prev => ({ ...prev, amount: input }));
      return;
    }
    
    // Handle negative amounts
    const isNegative = input.startsWith('-');
    const absoluteInput = isNegative ? input.slice(1) : input;
    
    // Use Currency.parseInput for the absolute value
    const parsed = Currency.parseInput(absoluteInput);
    
    // Reconstruct with negative sign if needed
    const finalValue = isNegative && parsed ? `-${parsed}` : parsed;
    
    setFormData(prev => ({ ...prev, amount: finalValue }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const selectedCategory = categories.find(c => c.id === formData.categoryId);
      
      if (!selectedCategory) {
        setErrors({ categoryId: 'Selected category not found' });
        return;
      }

      // Parse amount using Currency utility
      const rawAmount = parseFloat(formData.amount);
      if (isNaN(rawAmount)) {
        setErrors({ amount: 'Invalid amount format' });
        return;
      }

      const transaction = {
        id: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        date: formData.date,
        description: formData.description.trim(),
        normalizedMerchant: normalizeMerchantName(formData.description.trim()),
        amount: rawAmount, // Keep the sign from user input
        category: selectedCategory,
        confidence: 1.0,
        confirmed: true,
        originalData: { 
          source: 'manual',
          createdAt: new Date().toISOString()
        }
      };
      
      if (typeof onAddTransaction === 'function') {
        onAddTransaction(transaction);
      } else {
        console.error('onAddTransaction is not a function:', typeof onAddTransaction);
        setErrors({ form: 'Error adding transaction. Please try again.' });
        return;
      }

      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: '',
        categoryId: categories[0]?.id || ''
      });
      setErrors({});
      
    } catch (error) {
      console.error('Error adding manual transaction:', error);
      setErrors({ form: 'Error adding transaction. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e, field) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      if (field === 'description') {
        document.querySelector('input[type="number"]')?.focus();
      } else if (field === 'amount') {
        document.querySelector('select')?.focus();
      } else if (field === 'category') {
        handleSubmit();
      }
    }
  };

  const isFormValid = formData.description.trim() && 
                     formData.amount && 
                     !isNaN(parseFloat(formData.amount)) && 
                     parseFloat(formData.amount) !== 0 &&
                     formData.categoryId &&
                     formData.date;

  if (categories.length === 0) {
    return (
      <div className={`border-b ${isDarkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'} p-6`}>
        <h3 className={`text-3xl font-light mb-6 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
          Add Manual Transaction
        </h3>
        <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <AlertCircle className="w-8 h-8 mx-auto mb-4" />
          <p className="text-lg font-light">No categories available. Please set up categories first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`border-b ${isDarkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'} p-6`}>
      <h3 className={`text-3xl font-light mb-6 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
        Add Manual Transaction
      </h3>
      
      {errors.form && (
        <div className={`mb-6 p-4 border-l-4 ${
          isDarkMode ? 'border-red-600 bg-red-900/10' : 'border-red-500 bg-red-50'
        }`}>
          <p className={`font-light ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>{errors.form}</p>
        </div>
      )}
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={`block text-lg font-light mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Date *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              className={`w-full py-3 border-0 border-b-2 bg-transparent text-lg font-light focus:outline-none transition-colors ${
                errors.date 
                  ? isDarkMode ? 'border-red-500' : 'border-red-500'
                  : isDarkMode ? 'border-gray-600 text-gray-100 focus:border-gray-400' : 'border-gray-300 text-gray-900 focus:border-gray-600'
              }`}
            />
            {errors.date && <p className={`text-sm mt-1 font-light ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{errors.date}</p>}
          </div>
          
          <div>
            <label className={`block text-lg font-light mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Amount * (use negative for expenses)
            </label>
            <input
              type="text"
              placeholder="0.00"
              value={formData.amount}
              onChange={handleAmountChange}
              onKeyPress={(e) => handleKeyPress(e, 'amount')}
              className={`w-full py-3 border-0 border-b-2 bg-transparent text-lg font-light focus:outline-none transition-colors ${
                errors.amount 
                  ? isDarkMode ? 'border-red-500' : 'border-red-500'
                  : isDarkMode ? 'border-gray-600 text-gray-100 focus:border-gray-400' : 'border-gray-300 text-gray-900 focus:border-gray-600'
              }`}
            />
            {errors.amount && <p className={`text-sm mt-1 font-light ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{errors.amount}</p>}
            <p className={`text-sm mt-2 font-light ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Positive for income, negative for expenses
            </p>
          </div>
        </div>
        
        <div>
          <label className={`block text-lg font-light mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Description *
          </label>
          <input
            type="text"
            placeholder="Transaction description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            onKeyPress={(e) => handleKeyPress(e, 'description')}
            className={`w-full py-3 border-0 border-b-2 bg-transparent text-lg font-light focus:outline-none transition-colors ${
              errors.description 
                ? isDarkMode ? 'border-red-500' : 'border-red-500'
                : isDarkMode ? 'border-gray-600 text-gray-100 focus:border-gray-400' : 'border-gray-300 text-gray-900 focus:border-gray-600'
            }`}
          />
          {errors.description && <p className={`text-sm mt-1 font-light ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{errors.description}</p>}
        </div>
        
        <div>
          <label className={`block text-lg font-light mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Category *
          </label>
          <select
            value={formData.categoryId}
            onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
            onKeyPress={(e) => handleKeyPress(e, 'category')}
            className={`w-full py-3 border-0 border-b-2 bg-transparent text-lg font-light focus:outline-none transition-colors ${
              errors.categoryId 
                ? isDarkMode ? 'border-red-500' : 'border-red-500'
                : isDarkMode ? 'border-gray-600 text-gray-100 focus:border-gray-400' : 'border-gray-300 text-gray-900 focus:border-gray-600'
            }`}
          >
            <option value="">Select a category...</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name} ({category.type})
              </option>
            ))}
          </select>
          {errors.categoryId && <p className={`text-sm mt-1 font-light ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{errors.categoryId}</p>}
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={!isFormValid || isSubmitting}
          className={`w-full py-3 text-lg font-light border-b-2 transition-colors flex items-center justify-center gap-3 ${
            isFormValid && !isSubmitting
              ? isDarkMode 
                ? 'border-gray-400 text-gray-100 hover:border-gray-300 hover:text-white' 
                : 'border-gray-600 text-gray-900 hover:border-gray-800'
              : isDarkMode 
                ? 'border-gray-700 text-gray-500 cursor-not-allowed' 
                : 'border-gray-300 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              Add Transaction
            </>
          )}
        </button>
        
        <div className={`text-sm font-light space-y-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <p>* Required fields</p>
          <p>Press Enter to move to next field or submit</p>
        </div>
      </div>
    </div>
  );
};
