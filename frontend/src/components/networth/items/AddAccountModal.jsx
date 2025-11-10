// AddAccountModal.jsx - Modal for creating new net worth accounts
import React, { useState, useEffect } from 'react';
import { useTheme } from 'contexts/ThemeContext';
import { useNetworth } from 'hooks/useNetworth';
import { apiService } from 'utils/apiService';
import { Currency } from 'utils/currency';

export const AddAccountModal = ({ onClose }) => {
  const { isDarkMode } = useTheme();
  const { createAccount } = useNetworth();
  const [categories, setCategories] = useState([]);

  // Load categories from user data
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const userData = await apiService.loadUserData();
        const cats = [];

        // Add savings categories
        if (userData?.savingsAllocation?.savingsGoals) {
          userData.savingsAllocation.savingsGoals.forEach(goal => {
            cats.push({
              category: goal.name,
              context: 'savings'
            });
          });
        }

        // Add expense categories
        if (userData?.expenses?.expenseCategories) {
          userData.expenses.expenseCategories.forEach(cat => {
            cats.push({
              category: cat.name,
              context: 'expenses'
            });
          });
        }

        setCategories(cats);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };

    loadCategories();
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    type: 'asset',
    category: 'Cash',
    tracking_method: 'simple',
    initial_balance: '',
    linked_budget_category: '',
    linked_budget_context: '',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const assetCategories = [
    'Cash',
    'Chequing',
    'Savings',
    'Investments',
    'Retirement',
    'Real Estate',
    'Vehicles',
    'Crypto',
    'Precious Metals',
    'Other Assets'
  ];

  const liabilityCategories = [
    'Credit Card',
    'Loan',
    'Mortgage',
    'Student Loan',
    'Line of Credit',
    'Other Liabilities'
  ];

  const handleChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };

      // Reset category when type changes
      if (field === 'type') {
        updated.category = value === 'asset' ? 'Cash' : 'Credit Card';
        updated.linked_budget_category = '';
        updated.linked_budget_context = '';
      }

      // Clear initial balance if switching to quantity-based
      if (field === 'tracking_method' && value === 'quantity_based') {
        updated.initial_balance = '';
      }

      // Set linked context based on type
      if (field === 'linked_budget_category' && value) {
        updated.linked_budget_context = updated.type === 'asset' ? 'savings' : 'expenses';
      } else if (field === 'linked_budget_category' && !value) {
        updated.linked_budget_context = '';
      }

      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name.trim()) {
      setError('Account name is required');
      return;
    }

    if (formData.tracking_method === 'simple' && formData.initial_balance && isNaN(parseFloat(formData.initial_balance))) {
      setError('Initial balance must be a valid number');
      return;
    }

    setIsSubmitting(true);

    try {
      const accountData = {
        name: formData.name.trim(),
        type: formData.type,
        category: formData.category,
        tracking_method: formData.tracking_method,
        linked_budget_category: formData.linked_budget_category || null,
        linked_budget_context: formData.linked_budget_context || null,
        notes: formData.notes.trim() || null
      };

      const newAccount = await createAccount(accountData);

      // Create initial snapshot if simple tracking with balance
      if (formData.tracking_method === 'simple' && formData.initial_balance) {
        const balance = parseFloat(formData.initial_balance);
        await createAccount.createSnapshot({
          account_id: newAccount.id,
          date: new Date().toISOString().split('T')[0],
          balance: balance,
          source: 'manual'
        });
      }

      onClose();
    } catch (err) {
      console.error('Error creating account:', err);
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableCategories = formData.type === 'asset' ? assetCategories : liabilityCategories;

  // Get budget categories for linking
  const savingsCategories = categories.filter(c => c.context === 'savings').map(c => c.category);
  const expenseCategories = categories.filter(c => c.context === 'expenses').map(c => c.category);
  const linkableCategories = formData.type === 'asset' ? savingsCategories : expenseCategories;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`max-w-2xl w-full rounded-lg shadow-xl ${
        isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
      }`}>
        <div className="p-6">
          <h2 className="text-2xl font-light mb-6">Add Net Worth Account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Account Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`w-full px-4 py-2 rounded border ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="e.g., TD Chequing, RBC TFSA, etc."
                autoFocus
              />
            </div>

            {/* Type */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Type *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleChange('type', 'asset')}
                  className={`px-4 py-3 rounded border font-medium transition-colors ${
                    formData.type === 'asset'
                      ? isDarkMode
                        ? 'bg-green-900 border-green-700 text-green-200'
                        : 'bg-green-100 border-green-500 text-green-700'
                      : isDarkMode
                        ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  💰 Asset
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('type', 'liability')}
                  className={`px-4 py-3 rounded border font-medium transition-colors ${
                    formData.type === 'liability'
                      ? isDarkMode
                        ? 'bg-red-900 border-red-700 text-red-200'
                        : 'bg-red-100 border-red-500 text-red-700'
                      : isDarkMode
                        ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  💳 Liability
                </button>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className={`w-full px-4 py-2 rounded border ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Tracking Method */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Tracking Method *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleChange('tracking_method', 'simple')}
                  className={`px-4 py-3 rounded border text-left transition-colors ${
                    formData.tracking_method === 'simple'
                      ? isDarkMode
                        ? 'bg-blue-900 border-blue-700 text-blue-200'
                        : 'bg-blue-100 border-blue-500 text-blue-700'
                      : isDarkMode
                        ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">Simple Balance</div>
                  <div className="text-xs mt-1 opacity-75">
                    Track total balance only
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('tracking_method', 'quantity_based')}
                  className={`px-4 py-3 rounded border text-left transition-colors ${
                    formData.tracking_method === 'quantity_based'
                      ? isDarkMode
                        ? 'bg-blue-900 border-blue-700 text-blue-200'
                        : 'bg-blue-100 border-blue-500 text-blue-700'
                      : isDarkMode
                        ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">Quantity-Based</div>
                  <div className="text-xs mt-1 opacity-75">
                    Track individual holdings
                  </div>
                </button>
              </div>
            </div>

            {/* Initial Balance (Simple tracking only) */}
            {formData.tracking_method === 'simple' && (
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Initial Balance (optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.initial_balance}
                  onChange={(e) => handleChange('initial_balance', e.target.value)}
                  className={`w-full px-4 py-2 rounded border ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-700 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="0.00"
                />
              </div>
            )}

            {/* Budget Category Linking */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Link to Budget Category (optional)
              </label>
              <select
                value={formData.linked_budget_category}
                onChange={(e) => handleChange('linked_budget_category', e.target.value)}
                className={`w-full px-4 py-2 rounded border ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="">None</option>
                {linkableCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {formData.type === 'asset'
                  ? 'Transactions in this savings category will automatically update this account'
                  : 'Transactions in this expense category will automatically update this account'}
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Notes (optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={3}
                className={`w-full px-4 py-2 rounded border ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="Additional details about this account..."
              />
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className={`flex-1 px-6 py-3 rounded font-medium transition-colors ${
                  isDarkMode
                    ? 'border border-gray-700 text-gray-300 hover:bg-gray-800'
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex-1 px-6 py-3 rounded font-medium transition-colors ${
                  isDarkMode
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isSubmitting ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
