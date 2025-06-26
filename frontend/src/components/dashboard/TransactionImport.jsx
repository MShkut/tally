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
import { EmptyState, SummaryCard, FormSection } from '../shared/FormComponents';
import { handleMenuAction } from 'utils/navigationHandler';
import { Currency } from 'utils/currency';

// Replace the ManualTransactionForm component (around line 290):
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
