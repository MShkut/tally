// frontend/src/components/overview/networth/EntryEditModal.jsx
import React, { useState, useEffect } from 'react';
import { useTheme } from 'contexts/ThemeContext';
import { Currency } from 'utils/currency';
import { dataManager } from 'utils/dataManager';
import {
  ModalContent,
  FormGrid,
  FormField,
  StandardInput,
  StandardSelect
} from 'components/shared/FormComponents';
import { DatePicker } from 'components/shared/DatePicker';

// Predefined categories
const ASSET_CATEGORIES = [
  'Stock',
  'Bitcoin',
  'Property',
  'Cash',
  'Retirement Accounts',
  'Bonds',
  'Other'
];

const LIABILITY_CATEGORIES = [
  'Mortgage',
  'Student Loans',
  'Auto Loans',
  'Credit Cards',
  'Personal Loans',
  'Other'
];

export const EntryEditModal = ({ isOpen, entry, onClose, onSuccess }) => {
  const { isDarkMode } = useTheme();
  const [formData, setFormData] = useState({
    category: '',
    name: '',
    purchaseDate: '',
    purchaseValue: '',
    quantity: '',
    currentValue: '',
    autoUpdate: false
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form when entry changes
  useEffect(() => {
    if (entry) {
      setFormData({
        category: entry.category || '',
        name: entry.name || '',
        purchaseDate: entry.purchaseDate || '',
        purchaseValue: entry.purchaseValue?.toString() || '',
        quantity: entry.quantity?.toString() || '',
        currentValue: entry.currentValue?.toString() || '',
        autoUpdate: entry.autoUpdate || false
      });
    }
  }, [entry]);

  if (!isOpen || !entry) return null;

  const categories = entry.type === 'asset' ? ASSET_CATEGORIES : LIABILITY_CATEGORIES;
  const categoryOptions = categories.map(cat => ({ value: cat, label: cat }));

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.purchaseDate) {
      newErrors.purchaseDate = 'Purchase date is required';
    } else {
      const purchaseDate = new Date(formData.purchaseDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (purchaseDate > today) {
        newErrors.purchaseDate = 'Date cannot be in the future';
      }
    }

    const purchaseValidation = Currency.validate(formData.purchaseValue);
    if (!purchaseValidation.isValid) {
      newErrors.purchaseValue = purchaseValidation.error || 'Invalid purchase value';
    } else if (parseFloat(formData.purchaseValue) <= 0) {
      newErrors.purchaseValue = 'Purchase value must be positive';
    }

    const quantityValidation = Currency.validate(formData.quantity);
    if (!quantityValidation.isValid) {
      newErrors.quantity = quantityValidation.error || 'Invalid quantity';
    } else if (parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = 'Quantity must be positive';
    }

    if (formData.currentValue) {
      const currentValidation = Currency.validate(formData.currentValue);
      if (!currentValidation.isValid) {
        newErrors.currentValue = currentValidation.error || 'Invalid current value';
      } else if (parseFloat(formData.currentValue) < 0) {
        newErrors.currentValue = 'Current value cannot be negative';
      }
    }

    if (formData.autoUpdate && !formData.name.trim()) {
      newErrors.name = 'Name/Ticker is required when auto-update is enabled';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const purchaseValue = parseFloat(formData.purchaseValue);
      const quantity = parseFloat(formData.quantity);
      const totalCost = purchaseValue * quantity;
      const currentValue = formData.currentValue
        ? parseFloat(formData.currentValue)
        : totalCost;

      const updates = {
        category: formData.category,
        name: formData.name,
        purchaseDate: formData.purchaseDate,
        purchaseValue: purchaseValue,
        quantity: quantity,
        totalCost: totalCost,
        currentValue: currentValue,
        autoUpdate: formData.autoUpdate,
        ticker: formData.autoUpdate ? formData.name.toUpperCase() : null,
        lastUpdated: new Date().toISOString()
      };

      dataManager.updateNetWorthItem(entry.id, updates);

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error) {
      console.error('Failed to update net worth item:', error);
      setErrors({ submit: 'Failed to update item. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto" onClick={onClose}>
      <div className="flex items-start justify-center min-h-screen p-4 py-8">
        <div onClick={(e) => e.stopPropagation()}>
          <ModalContent maxWidth="max-w-3xl">
          <h1 className={`text-3xl font-light leading-tight mb-8 ${
            isDarkMode ? 'text-white' : 'text-black'
          }`}>
            Edit {entry.type === 'asset' ? 'Asset' : 'Liability'}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Category and Name */}
            <FormGrid>
              <FormField span={6} mobileSpan={12}>
                <StandardSelect
                  label="Category"
                  value={formData.category}
                  onChange={(value) => setFormData({ ...formData, category: value })}
                  options={categoryOptions}
                  error={errors.category}
                />
              </FormField>

              <FormField span={6} mobileSpan={12}>
                <StandardInput
                  label={formData.autoUpdate ? "Name / Ticker Symbol" : "Name"}
                  value={formData.name}
                  onChange={(value) => setFormData({ ...formData, name: value })}
                  error={errors.name}
                />
              </FormField>
            </FormGrid>

            {/* Date, Value, Quantity */}
            <FormGrid>
              <FormField span={entry.type === 'asset' ? 4 : 6} mobileSpan={12}>
                <div>
                  <label className={`block text-base font-light mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {entry.type === 'asset' ? 'Purchase Date' : 'Origination Date'}
                  </label>
                  <DatePicker
                    value={formData.purchaseDate}
                    onChange={(isoDate) => setFormData({ ...formData, purchaseDate: isoDate })}
                    placeholder="Select date"
                    align="left"
                    className="w-full [&>button]:py-3 [&>button]:pb-4 [&>button]:text-base [&>button]:font-light"
                  />
                  {errors.purchaseDate && (
                    <p className="text-red-500 text-sm mt-1">{errors.purchaseDate}</p>
                  )}
                </div>
              </FormField>

              <FormField span={entry.type === 'asset' ? 4 : 6} mobileSpan={entry.type === 'asset' ? 6 : 12}>
                <StandardInput
                  label={entry.type === 'asset' ? 'Purchase Value' : 'Amount'}
                  value={formData.purchaseValue}
                  onChange={(value) => setFormData({ ...formData, purchaseValue: value })}
                  placeholder="0.00"
                  error={errors.purchaseValue}
                  helpText={entry.type === 'asset' ? 'Cost basis / price per unit' : 'Total original amount'}
                />
              </FormField>

              {entry.type === 'asset' && (
                <FormField span={4} mobileSpan={6}>
                  <StandardInput
                    label="Quantity"
                    value={formData.quantity}
                    onChange={(value) => setFormData({ ...formData, quantity: value })}
                    placeholder="1"
                    error={errors.quantity}
                    helpText="Number of shares/units"
                  />
                </FormField>
              )}
            </FormGrid>

            {/* Current Value / Balance */}
            <FormGrid>
              <FormField span={12}>
                <StandardInput
                  label={entry.type === 'asset' ? 'Current Value (Optional)' : 'Current Balance (Optional)'}
                  value={formData.currentValue}
                  onChange={(value) => setFormData({ ...formData, currentValue: value })}
                  placeholder={entry.type === 'asset' ? 'Leave empty to calculate from purchase value' : 'Leave empty to use original amount'}
                  error={errors.currentValue}
                  helpText={entry.type === 'asset' ? 'Total current value (overrides automatic calculation)' : 'Remaining balance owed'}
                />
              </FormField>
            </FormGrid>

            {/* Auto-Update */}
            {entry.type === 'asset' && (
              <FormGrid>
                <FormField span={12}>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="autoUpdate"
                      checked={formData.autoUpdate}
                      onChange={(e) => setFormData({ ...formData, autoUpdate: e.target.checked })}
                      className="w-5 h-5 rounded"
                    />
                    <label
                      htmlFor="autoUpdate"
                      className={`text-base ${isDarkMode ? 'text-white' : 'text-black'} cursor-pointer`}
                    >
                      Enable Auto-Update (AlphaVantage API)
                    </label>
                  </div>
                  <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Automatically update prices for stocks and crypto. The Name field will be used as the ticker symbol.
                  </p>
                </FormField>
              </FormGrid>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-4 pt-4">
              {errors.submit && (
                <p className="text-red-500 text-sm mr-auto">{errors.submit}</p>
              )}
              <button
                type="button"
                onClick={onClose}
                className={`px-6 py-3 rounded-lg text-base font-medium transition-colors ${
                  isDarkMode
                    ? 'bg-gray-800 text-white hover:bg-gray-700'
                    : 'bg-gray-200 text-black hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-3 rounded-lg text-base font-medium transition-colors ${
                  isSubmitting
                    ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                    : isDarkMode
                    ? 'bg-white text-black hover:bg-gray-200'
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </ModalContent>
        </div>
      </div>
    </div>
  );
};
