import React, { useState, useEffect } from 'react';
import { useTheme } from 'contexts/ThemeContext';
import { Currency } from 'utils/currency';

// Individual transaction review item - horizontal table-like layout
export const TransactionReviewItem = ({ 
  transaction, 
  categories,
  categoryOptions, 
  onCategoryChange, 
  onSplit,
  onCombine,
  onEdit,
  onDelete,
  getConfidenceIndicator,
  openCategoryDropdown,
  setOpenCategoryDropdown,
  openActionsDropdown,
  setOpenActionsDropdown
}) => {
  const { isDarkMode } = useTheme();
  const confidence = getConfidenceIndicator(transaction.confidence);
  const showCategoryDropdown = openCategoryDropdown === transaction.id;
  const showActionsDropdown = openActionsDropdown === transaction.id;
  
  // State for two-step category selection
  const [selectedType, setSelectedType] = useState(transaction.category?.type || '');
  const [openTypeDropdown, setOpenTypeDropdown] = useState(false);
  
  // Category types (match actual data casing)
  const categoryTypes = ['Income', 'Expense', 'Savings', 'Ignore'];

  // Format date to be more compact
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleTypeClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenTypeDropdown(!openTypeDropdown);
    setOpenCategoryDropdown(null); // Close category dropdown
  };
  
  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setOpenTypeDropdown(false);
    // Clear category selection when type changes
    if (transaction.category?.type !== type) {
      onCategoryChange(transaction.id, null);
    }
  };

  const handleCategoryClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (selectedType) {
      setOpenCategoryDropdown(showCategoryDropdown ? null : transaction.id);
    }
    setOpenTypeDropdown(false); // Close type dropdown
  };

  const handleCategorySelect = (categoryId) => {
    onCategoryChange(transaction.id, categoryId);
    setOpenCategoryDropdown(null);
  };
  
  // Filter categories by selected type
  const filteredCategories = selectedType 
    ? categories.filter(cat => cat.type === selectedType)
    : [];
    
  // For Ignore type, we need to find or create the ignore category
  const handleIgnoreSelection = () => {
    if (selectedType === 'Ignore') {
      // Find existing ignore category or use a placeholder
      const ignoreCategory = categories.find(cat => cat.type === 'System' && cat.name === 'Ignore');
      if (ignoreCategory) {
        onCategoryChange(transaction.id, ignoreCategory.id);
      }
    }
  };
  
  // Auto-select ignore category when Ignore type is selected
  React.useEffect(() => {
    if (selectedType === 'Ignore') {
      handleIgnoreSelection();
    }
  }, [selectedType]);

  const handleActionsClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenActionsDropdown(showActionsDropdown ? null : transaction.id);
  };

  const handleActionSelect = (action) => {
    if (action === 'split') {
      onSplit(transaction.id);
    } else if (action === 'combine') {
      onCombine(transaction.id);
    } else if (action === 'edit') {
      onEdit(transaction.id);
    }
    setOpenActionsDropdown(null);
  };

  return (
    <div className={`py-6 border-b ${
      isDarkMode ? 'border-gray-800' : 'border-gray-200'
    }`} style={{display: 'grid', gridTemplateColumns: 'repeat(16, 1fr)', gap: '1rem'}}>
      {/* Date - 1 column */}
      <div className={`col-span-1 text-base font-light ${
        isDarkMode ? 'text-gray-400' : 'text-gray-600'
      }`}>
        {formatDate(transaction.date)}
      </div>

      {/* Description - 5 columns, full text */}
      <div className={`col-span-5 text-base font-light ${
        isDarkMode ? 'text-white' : 'text-black'
      }`}>
        <div className="truncate pr-4" title={transaction.description}>
          {transaction.description}
        </div>
        <div className={`text-sm font-light ${confidence.color}`}>
          {confidence.text} confidence
        </div>
      </div>

      {/* Amount - 2 columns */}
      <div className={`col-span-2 text-base font-mono text-left ${
        Currency.compare(transaction.amount, 0) >= 0 ? 'text-green-500' : 'text-red-500'
      }`}>
        {Currency.compare(transaction.amount, 0) >= 0 ? '+' : ''}
        {Currency.format(Currency.abs(transaction.amount))}
      </div>

      {/* Type - 2 columns */}
      <div className="col-span-2 relative category-dropdown">
        <button
          onClick={handleTypeClick}
          className={`w-full px-0 py-2 border-0 border-b-2 bg-transparent transition-colors focus:outline-none text-left text-base font-light ${
            isDarkMode 
              ? 'border-gray-700 text-white hover:border-white' 
              : 'border-gray-300 text-black hover:border-black'
          }`}
        >
          <span className="flex items-center justify-between">
            <span className="capitalize">{selectedType || 'Type'}</span>
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              ▼
            </span>
          </span>
        </button>
        
        {openTypeDropdown && (
          <div className={`absolute top-full left-0 right-0 mt-2 border shadow-lg z-50 ${
            isDarkMode 
              ? 'bg-black border-gray-700 shadow-gray-900' 
              : 'bg-white border-gray-200 shadow-gray-300'
          }`}>
            {categoryTypes.map((type) => (
              <button
                key={type}
                onClick={() => handleTypeSelect(type)}
                className={`w-full px-4 py-3 text-left text-base font-light transition-colors duration-200 capitalize ${
                  selectedType === type
                    ? isDarkMode 
                      ? 'bg-gray-800 text-white' 
                      : 'bg-gray-100 text-black'
                    : isDarkMode 
                      ? 'text-gray-300 hover:bg-gray-900 hover:text-white' 
                      : 'text-gray-700 hover:bg-gray-50 hover:text-black'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Category - 3 columns */}
      <div className="col-span-3 relative category-dropdown">
        <button
          onClick={handleCategoryClick}
          disabled={!selectedType}
          className={`w-full px-0 py-2 border-0 border-b-2 bg-transparent transition-colors focus:outline-none text-left text-base font-light ${
            !selectedType
              ? 'text-gray-400 border-gray-400 cursor-not-allowed'
              : isDarkMode 
                ? 'border-gray-700 text-white hover:border-white' 
                : 'border-gray-300 text-black hover:border-black'
          }`}
        >
          <span className="flex items-center justify-between">
            <span>{transaction.category?.name || (selectedType ? 'Select category' : 'Select type first')}</span>
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              ▼
            </span>
          </span>
        </button>
        
        {showCategoryDropdown && selectedType && (
          <div className={`absolute top-full left-0 right-0 mt-2 border shadow-lg z-50 max-h-80 overflow-y-auto ${
            isDarkMode 
              ? 'bg-black border-gray-700 shadow-gray-900' 
              : 'bg-white border-gray-200 shadow-gray-300'
          }`}>
            {filteredCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category.id)}
                className={`w-full px-4 py-3 text-left text-base font-light transition-colors duration-200 ${
                  transaction.category?.id === category.id
                    ? isDarkMode 
                      ? 'bg-gray-800 text-white' 
                      : 'bg-gray-100 text-black'
                    : isDarkMode 
                      ? 'text-gray-300 hover:bg-gray-900 hover:text-white' 
                      : 'text-gray-700 hover:bg-gray-50 hover:text-black'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Actions - 2 columns, dropdown */}
      <div className="col-span-2 relative actions-dropdown">
        <button
          onClick={handleActionsClick}
          className={`w-full px-0 py-2 border-0 border-b-2 bg-transparent transition-colors focus:outline-none text-left text-base font-light ${
            isDarkMode 
              ? 'border-gray-700 text-white hover:border-white' 
              : 'border-gray-300 text-black hover:border-black'
          }`}
        >
          <span className="flex items-center justify-between">
            <span>Actions</span>
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              ▼
            </span>
          </span>
        </button>
        
        {showActionsDropdown && (
          <div className={`absolute top-full left-0 right-0 mt-2 border shadow-lg z-50 ${
            isDarkMode 
              ? 'bg-black border-gray-700 shadow-gray-900' 
              : 'bg-white border-gray-200 shadow-gray-300'
          }`}>
            <button
              onClick={() => handleActionSelect('edit')}
              className={`w-full px-4 py-3 text-left text-base font-light transition-colors duration-200 ${
                isDarkMode 
                  ? 'text-gray-300 hover:bg-gray-900 hover:text-white' 
                  : 'text-gray-700 hover:bg-gray-50 hover:text-black'
              }`}
            >
              Edit
            </button>
            <button
              onClick={() => handleActionSelect('split')}
              className={`w-full px-4 py-3 text-left text-base font-light transition-colors duration-200 ${
                isDarkMode 
                  ? 'text-gray-300 hover:bg-gray-900 hover:text-white' 
                  : 'text-gray-700 hover:bg-gray-50 hover:text-black'
              }`}
            >
              Split
            </button>
            <button
              onClick={() => handleActionSelect('combine')}
              className={`w-full px-4 py-3 text-left text-base font-light transition-colors duration-200 ${
                isDarkMode 
                  ? 'text-gray-300 hover:bg-gray-900 hover:text-white' 
                  : 'text-gray-700 hover:bg-gray-50 hover:text-black'
              }`}
            >
              Combine
            </button>
          </div>
        )}
      </div>

      {/* Delete - 1 column */}
      <div className="col-span-1 flex items-center justify-center">
        <button
          onClick={() => onDelete(transaction.id)}
          className="text-2xl font-light text-gray-400 hover:text-red-500 transition-colors"
          title="Remove this transaction"
        >
          ×
        </button>
      </div>
    </div>
  );
};