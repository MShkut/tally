// frontend/src/components/overview/networth/ManualEntryForm.jsx
import React, { useState, useEffect } from 'react';
import { useTheme } from 'contexts/ThemeContext';
import { Currency } from 'utils/currency';
import { dataManager } from 'utils/dataManager';
import {
  FormGrid,
  FormField,
  StandardInput,
  StandardSelect
} from 'components/shared/FormComponents';
import { DatePicker } from 'components/shared/DatePicker';

// Predefined categories from plan
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

export const ManualEntryForm = ({ itemType, onSuccess }) => {
  const { isDarkMode } = useTheme();
  const [formData, setFormData] = useState({
    type: itemType, // 'asset' or 'liability'
    category: '',
    name: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchaseValue: '',
    quantity: '1',
    autoUpdate: false
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update type when prop changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      type: itemType,
      category: '',
      autoUpdate: false // Reset auto-update when type changes
    }));
  }, [itemType]);

  // Set default category when type changes
  useEffect(() => {
    if (!formData.category) {
      const categories = formData.type === 'asset' ? ASSET_CATEGORIES : LIABILITY_CATEGORIES;
      setFormData(prev => ({ ...prev, category: categories[0] }));
    }
  }, [formData.type, formData.category]);

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
      // Check if date is in the future
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

      const newItem = {
        id: `${formData.type}-${Date.now()}-${Math.random()}`,
        type: formData.type,
        category: formData.category,
        name: formData.name,
        purchaseDate: formData.purchaseDate,
        purchaseValue: purchaseValue,
        quantity: quantity,
        totalCost: totalCost,
        currentValue: totalCost, // Initially set to total cost
        lastUpdated: new Date().toISOString(),
        autoUpdate: formData.autoUpdate,
        ticker: formData.autoUpdate ? formData.name.toUpperCase() : null,
        notes: ''
      };

      dataManager.addNetWorthItem(newItem);

      // Reset form
      setFormData({
        type: itemType,
        category: formData.type === 'asset' ? ASSET_CATEGORIES[0] : LIABILITY_CATEGORIES[0],
        name: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        purchaseValue: '',
        quantity: '1',
        autoUpdate: false
      });
      setErrors({});

      if (onSuccess) {
        onSuccess(newItem);
      }
    } catch (error) {
      console.error('Failed to add net worth item:', error);
      setErrors({ submit: 'Failed to add item. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = formData.type === 'asset' ? ASSET_CATEGORIES : LIABILITY_CATEGORIES;
  const categoryOptions = categories.map(cat => ({ value: cat, label: cat }));

  return (
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
            placeholder={formData.autoUpdate ? 'e.g., AAPL, BTC' : formData.type === 'asset' ? 'e.g., Apple Stock, 123 Main St' : 'e.g., Chase Credit Card'}
            error={errors.name}
            helpText={formData.autoUpdate ? "This will be used as the ticker symbol" : ""}
          />
        </FormField>
      </FormGrid>

      {/* Date, Value, Quantity */}
      <FormGrid>
        <FormField span={formData.type === 'asset' ? 4 : 6} mobileSpan={12}>
          <div>
            <label className={`block text-base font-light mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {formData.type === 'asset' ? 'Purchase Date' : 'Origination Date'}
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

        <FormField span={formData.type === 'asset' ? 4 : 6} mobileSpan={formData.type === 'asset' ? 6 : 12}>
          <StandardInput
            label={formData.type === 'asset' ? 'Purchase Value' : 'Amount'}
            value={formData.purchaseValue}
            onChange={(value) => setFormData({ ...formData, purchaseValue: value })}
            placeholder="0.00"
            error={errors.purchaseValue}
            helpText={formData.type === 'asset' ? 'Cost basis / price per unit' : 'Total original amount'}
          />
        </FormField>

        {formData.type === 'asset' && (
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

      {/* Auto-Update - Only for Assets */}
      {formData.type === 'asset' && (
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
                Enable Auto-Update
              </label>
            </div>
            <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Automatically update prices for stocks and crypto. The Name field will be used as the ticker symbol.
            </p>
          </FormField>
        </FormGrid>
      )}

      {/* Submit Button and Error */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`px-8 py-3 rounded-lg text-base font-medium transition-colors ${
            isSubmitting
              ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
              : isDarkMode
              ? 'bg-white text-black hover:bg-gray-200'
              : 'bg-black text-white hover:bg-gray-800'
          }`}
        >
          {isSubmitting ? 'Adding...' : `Add ${formData.type === 'asset' ? 'Asset' : 'Liability'}`}
        </button>

        {errors.submit && (
          <p className="text-red-500 text-sm">{errors.submit}</p>
        )}
      </div>
    </form>
  );
};
