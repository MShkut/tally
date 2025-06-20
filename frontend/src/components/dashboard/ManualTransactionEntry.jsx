import React, { useState, useEffect } from 'react';
import Plus from 'lucide-react/dist/esm/icons/plus';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import normalizeMerchantName from '../../utils/transactionHelpers';
import useTheme from '../../contexts/ThemeContext';

const ManualTransactionEntry = ({ categories, onAddTransaction }) => {
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
    }
    
    if (isNaN(parseFloat(formData.amount))) {
      newErrors.amount = 'Amount must be a valid number';
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

      const transaction = {
        id: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        date: formData.date,
        description: formData.description.trim(),
        normalizedMerchant: normalizeMerchantName(formData.description.trim()),
        amount: parseFloat(formData.amount),
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
      <div className={`rounded-xl p-6 shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
          Add Manual Transaction
        </h3>
        <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p>No categories available. Please set up categories first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl p-6 shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
        Add Manual Transaction
      </h3>
      
      {errors.form && (
        <div className={`mb-4 p-3 border rounded-lg ${
          isDarkMode ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'
        }`}>
          <p className={`text-sm ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>{errors.form}</p>
        </div>
      )}
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Date *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg ${
                errors.date 
                  ? isDarkMode ? 'border-red-600' : 'border-red-300'
                  : isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'
              }`}
            />
            {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Amount * (use negative for expenses)
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              onKeyPress={(e) => handleKeyPress(e, 'amount')}
              className={`w-full px-3 py-2 border rounded-lg ${
                errors.amount 
                  ? isDarkMode ? 'border-red-600' : 'border-red-300'
                  : isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'
              }`}
            />
            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Positive for income, negative for expenses
            </p>
          </div>
        </div>
        
        <div>
          <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Description *
          </label>
          <input
            type="text"
            placeholder="Transaction description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            onKeyPress={(e) => handleKeyPress(e, 'description')}
            className={`w-full px-3 py-2 border rounded-lg ${
              errors.description 
                ? isDarkMode ? 'border-red-600' : 'border-red-300'
                : isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'
            }`}
          />
          {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
        </div>
        
        <div>
          <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Category *
          </label>
          <select
            value={formData.categoryId}
            onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
            onKeyPress={(e) => handleKeyPress(e, 'category')}
            className={`w-full px-3 py-2 border rounded-lg ${
              errors.categoryId 
                ? isDarkMode ? 'border-red-600' : 'border-red-300'
                : isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'
            }`}
          >
            <option value="">Select a category...</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name} ({category.type})
              </option>
            ))}
          </select>
          {errors.categoryId && <p className="text-red-500 text-xs mt-1">{errors.categoryId}</p>}
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={!isFormValid || isSubmitting}
          className={`w-full px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
            isFormValid && !isSubmitting
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : isDarkMode ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Add Transaction
            </>
          )}
        </button>
        
        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <p>* Required fields</p>
          <p>Press Enter to move to next field or submit</p>
        </div>
      </div>
    </div>
  );
};


export default ManualTransactionEntry;
