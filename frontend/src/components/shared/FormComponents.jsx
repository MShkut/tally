// frontend/src/components/shared/FormComponents.jsx
// Complete Form Standardization System with 12-Column Grid

import React from 'react';

import { useTheme } from 'contexts/ThemeContext';
import { Currency } from 'utils/currency';

// ==================== CORE GRID SYSTEM ====================

// 12-Column CSS Grid container with consistent spacing
export const FormGrid = ({ children, className = '' }) => {
  return (
    <div className={`grid grid-cols-12 gap-6 items-end py-6 ${className}`}>
      {children}
    </div>
  );
};

// Form field wrapper with column span control
export const FormField = ({ 
  span = 4, 
  children, 
  className = '',
  mobileSpan = 12 
}) => {
  return (
    <div className={`col-span-${mobileSpan} lg:col-span-${span} ${className}`}>
      {children}
    </div>
  );
};

// ==================== INPUT COMPONENTS ====================

// Standardized input field with consistent styling and fixed currency handling
export const StandardInput = ({ 
  label, 
  type = 'text', 
  value, 
  onChange, 
  placeholder = '', 
  prefix = null,
  suffix = null,
  error = null,
  required = false,
  className = '',
  ...props 
}) => {
  const { isDarkMode } = useTheme();

  const handleChange = (e) => {
    if (type === 'currency') {
      // Use centralized currency parsing
      const cleaned = Currency.parseInput(e.target.value);
      onChange(cleaned);
    } else {
      onChange(e.target.value);
    }
  };

  // Format currency value for display - keep it simple for typing
  const displayValue = type === 'currency' ? value : value;

  return (
    <div className={className}>
      {label && (
        <label className={`block text-2xl font-medium mb-2 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        {prefix && (
          <span className={`absolute left-0 top-3 text-2xl ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            {prefix}
          </span>
        )}
        <input
          type="text"
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          inputMode={type === 'currency' ? 'decimal' : undefined}
          className={`w-full bg-transparent border-0 border-b-2 pb-4 text-2xl font-medium focus:outline-none transition-colors ${
            prefix ? 'pl-6' : suffix ? 'pr-8' : 'px-0'
          } py-3 ${
            error
              ? 'border-red-500 text-red-500'
              : isDarkMode 
                ? 'border-gray-700 text-white placeholder-gray-500 focus:border-white' 
                : 'border-gray-300 text-black placeholder-gray-400 focus:border-black'
          }`}
          {...props}
        />
        {suffix && (
          <span className={`absolute right-0 top-3 text-2xl ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            {suffix}
          </span>
        )}
      </div>
      {error && (
        <div className="mt-2 text-red-500 text-sm font-light">
          {error}
        </div>
      )}
    </div>
  );
};

// Custom themed dropdown with perfect editorial integration
export const StandardSelect = ({ 
  label, 
  value, 
  onChange, 
  options = [], 
  required = false,
  className = '',
  ...props 
}) => {
  const { isDarkMode } = useTheme();
  const [isOpen, setIsOpen] = React.useState(false);
  
  const selectedOption = options.find(opt => opt.value === value);
  
  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className={`block text-sm font-medium mb-2 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      {/* Custom Select Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`w-full px-0 py-3 border-0 border-b-2 bg-transparent transition-colors focus:outline-none text-left flex items-center justify-between ${
          isDarkMode 
            ? 'border-gray-700 text-white focus:border-white' 
            : 'border-gray-300 text-black focus:border-black'
        }`}
        {...props}
      >
        <span className="text-lg font-light">
          {selectedOption ? selectedOption.label : 'Select...'}
        </span>
        <span className={`ml-2 transition-transform duration-200 ${
          isOpen ? 'rotate-180' : 'rotate-0'
        } ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          ▼
        </span>
      </button>
      
      {/* Custom Dropdown Menu */}
      {isOpen && (
        <div className={`absolute top-full left-0 right-0 mt-2 border shadow-lg z-50 ${
          isDarkMode 
            ? 'bg-black border-gray-700 shadow-gray-900' 
            : 'bg-white border-gray-200 shadow-gray-300'
        }`}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`w-full px-4 py-3 text-left text-lg font-light transition-colors duration-200 ${
                value === option.value
                  ? isDarkMode 
                    ? 'bg-gray-800 text-white' 
                    : 'bg-gray-100 text-black'
                  : isDarkMode 
                    ? 'text-gray-300 hover:bg-gray-900 hover:text-white' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-black'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ==================== ACTION COMPONENTS ====================

// Standardized remove button positioned in grid
export const RemoveButton = ({ onClick, children = 'Remove', className = '' }) => {
  const { isDarkMode } = useTheme();

  return (
    <div className={`col-span-12 lg:col-span-1 flex items-end ${className}`}>
      <button
        onClick={onClick}
        className={`w-full py-3 text-sm transition-colors text-center ${
          isDarkMode 
            ? 'text-gray-500 hover:text-gray-300' 
            : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        {children}
      </button>
    </div>
  );
};

// Dashed border add button with consistent styling
export const AddItemButton = ({ onClick, children, className = '' }) => {
  const { isDarkMode } = useTheme();

  return (
    <button
      onClick={onClick}
      className={`w-full py-6 border-2 border-dashed transition-colors text-center mb-8 ${
        isDarkMode 
          ? 'border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300' 
          : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700'
      } ${className}`}
    >
      <span className="text-lg font-light">{children}</span>
    </button>
  );
};

// ==================== LAYOUT COMPONENTS ====================

// Section separator with editorial styling
export const FormSection = ({ title, children, className = '' }) => {
  const { isDarkMode } = useTheme();

  return (
    <div className={`mb-16 ${className}`}>
      {title && (
        <h2 className={`text-2xl font-light mb-6 ${
          isDarkMode ? 'text-white' : 'text-black'
        }`}>
          {title}
        </h2>
      )}
      {children}
    </div>
  );
};

// Complete form layout with navigation
export const StandardFormLayout = ({ 
  title, 
  subtitle, 
  children, 
  onBack, 
  onNext, 
  canGoNext = true,
  nextLabel = 'Continue',
  backLabel = 'Back',
  showBack = true,
  nextLoading = false,
  className = ''
}) => {
  const { isDarkMode } = useTheme();

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'
    } ${className}`}>
      <div className="max-w-4xl mx-auto px-6 py-12">
        
        {/* Header */}
        <div className="mb-24">
          <h1 className={`text-5xl font-light leading-tight mb-4 ${
            isDarkMode ? 'text-white' : 'text-black'
          }`}>
            {title}
          </h1>
          {subtitle && (
            <p className={`text-xl font-light ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Content */}
        {children}

        {/* Navigation */}
        <div className="flex justify-between items-center mt-16">
          {showBack ? (
            <button
              onClick={onBack}
              className={`text-lg font-light transition-colors ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-white border-b border-gray-700 hover:border-white pb-1' 
                  : 'text-gray-600 hover:text-black border-b border-gray-300 hover:border-black pb-1'
              }`}
            >
              {backLabel}
            </button>
          ) : (
            <div />
          )}
          
          <button
            onClick={onNext}
            disabled={!canGoNext || nextLoading}
            className={`text-xl font-light transition-all ${
              canGoNext && !nextLoading
                ? isDarkMode
                  ? 'text-white border-b-2 border-white hover:border-gray-400 pb-2'
                  : 'text-black border-b-2 border-black hover:border-gray-600 pb-2'
                : isDarkMode
                  ? 'text-gray-600 cursor-not-allowed pb-2'
                  : 'text-gray-400 cursor-not-allowed pb-2'
            }`}
          >
            {nextLoading ? 'Processing...' : nextLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// Summary card with consistent styling and fixed currency formatting
// Summary card with consistent styling and fixed currency formatting
export const SummaryCard = ({ 
  title, 
  value, 
  subtitle = null,
  accent = false,
  className = '' 
}) => {
  const { isDarkMode } = useTheme();
  
  // Format value using centralized currency system - fix: use Currency.format instead of formatSummary
  const displayValue = typeof value === 'number' ? 
    Currency.format(value, { showCents: false }) : value;
  
  return (
    <div className={`text-center ${className}`}>
      <div className={`text-2xl font-light mb-2 ${
        accent
          ? isDarkMode ? 'text-white' : 'text-black'
          : isDarkMode ? 'text-white' : 'text-black'
      }`}>
        {displayValue}
      </div>
      <div className={`text-sm ${
        isDarkMode ? 'text-gray-400' : 'text-gray-600'
      }`}>
        {title}
      </div>
      {subtitle && (
        <div className={`text-base mt-2 ${
          isDarkMode ? 'text-gray-500' : 'text-gray-500'
        }`}>
          {subtitle}
        </div>
      )}
    </div>
  );
};

// ==================== STATE MANAGEMENT ====================

// Universal item manager for add/remove/update patterns
export const useItemManager = (initialItems = []) => {
  const [items, setItems] = React.useState(initialItems);

  const addItem = (newItem = {}) => {
    const item = {
      id: Date.now() + Math.random(),
      ...newItem
    };
    setItems([...items, item]);
    return item;
  };

  const updateItem = (id, updates) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const deleteItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const clearItems = () => {
    setItems([]);
  };

  return {
    items,
    setItems,
    addItem,
    updateItem,
    deleteItem,
    clearItems,
    hasItems: items.length > 0,
    itemCount: items.length
  };
};

// ==================== UTILITY COMPONENTS ====================

// Border separator for sections
export const SectionBorder = ({ className = '' }) => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className={`py-8 border-t border-b ${
      isDarkMode ? 'border-gray-800' : 'border-gray-200'
    } ${className}`} />
  );
};

// Validation helpers - Updated to use currency system
export const validation = {
  hasValidInput: (value, min = 0) => {
    if (!value || !value.toString().trim()) return false;
    const validation = Currency.validate(value);
    if (!validation.isValid) return false;
    return Currency.toCents(value) > Currency.toCents(min);
  },
  
  hasValidString: (value, minLength = 1) => {
    return value && value.toString().trim().length >= minLength;
  },
  
  isPositiveNumber: (value) => {
    return Currency.isPositive(value);
  },
  
  isValidCurrency: (value) => {
    return Currency.validate(value).isValid;
  },
  
  currencyError: (value) => {
    const result = Currency.validate(value);
    return result.error;
  }
};

// Currency formatting - Updated to use centralized system
export const formatCurrency = (amount) => {
  return Currency.format(amount);
};

// Additional components to add to FormComponents.jsx

// ==================== EMPTY STATE COMPONENTS ====================

// Generic empty state with title, and description
export const EmptyState = ({ 
  icon,
  title,
  description,
  className = ''
}) => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className={`text-center py-8 ${
      isDarkMode ? 'text-gray-500' : 'text-gray-400'
    } ${className}`}>
      <div className="mb-4 text-4xl opacity-50">{icon}</div>
      <div className="text-base font-light mb-2">{title}</div>
      {description && (
        <div className="text-sm font-light">
          {description}
        </div>
      )}
    </div>
  );
};

// ==================== MODAL COMPONENTS ====================

// Modal overlay wrapper with consistent styling
export const ModalOverlay = ({ children, onClose, zIndex = 50 }) => {
  return (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-50 z-${zIndex} transition-opacity duration-300`}
      onClick={onClose}
    >
      {children}
    </div>
  );
};

// Modal content container with editorial styling
export const ModalContent = ({ 
  children, 
  maxWidth = 'max-w-md',
  className = '' 
}) => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className={`${maxWidth} w-full p-8 transition-colors duration-300 ${
      isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'
    } ${className}`}>
      {children}
    </div>
  );
};

// Complete confirmation modal
export const ConfirmationModal = ({
  isOpen,
  title,
  description,
  details = [],
  warningText,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  confirmDanger = false
}) => {
  const { isDarkMode } = useTheme();
  
  if (!isOpen) return null;

  return (
    <ModalOverlay onClose={onCancel}>
      <div className="flex items-center justify-center min-h-screen p-4">
        <ModalContent maxWidth="max-w-md">
          <h1 className={`
            text-3xl font-light leading-tight mb-6
            ${isDarkMode ? 'text-white' : 'text-black'}
          `}>
            {title}
          </h1>
          
          {description && (
            <p className={`
              text-base font-light leading-relaxed mb-6
              ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}
            `}>
              {description}
            </p>
          )}
          
          {details.length > 0 && (
            <ul className={`
              text-base font-light mb-8 space-y-2 leading-relaxed
              ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}
            `}>
              {details.map((detail, index) => (
                <li key={index}>{detail}</li>
              ))}
            </ul>
          )}
          
          {warningText && (
            <p className="text-base font-light mb-8 text-red-500 leading-relaxed">
              {warningText}
            </p>
          )}
          
          <div className="flex justify-between items-center">
            <button
              onClick={onCancel}
              className={`
                text-lg font-light transition-colors border-b border-transparent hover:border-current pb-1
                ${isDarkMode 
                  ? 'text-gray-400 hover:text-white' 
                  : 'text-gray-600 hover:text-black'
                }
              `}
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`
                text-xl font-light border-b-2 pb-2 transition-all
                ${confirmDanger
                  ? 'text-red-500 border-red-500 hover:border-red-400 hover:text-red-400'
                  : isDarkMode
                    ? 'text-white border-white hover:border-gray-400'
                    : 'text-black border-black hover:border-gray-600'
                }
              `}
            >
              {confirmText}
            </button>
          </div>
        </ModalContent>
      </div>
    </ModalOverlay>
  );
};

// ==================== LIST ITEM COMPONENTS ====================

// Generic list item with consistent styling
export const ListItem = ({ 
  children, 
  className = '',
  noBorder = false 
}) => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className={`
      py-3 transition-colors
      ${noBorder ? '' : `border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}
      ${className}
    `}>
      {children}
    </div>
  );
};

// Transaction-style list item
export const TransactionListItem = ({ 
  title,
  subtitle,
  amount,
  category,
  isIncome = false,
  isExpense = false,
  className = ''
}) => {
  const { isDarkMode } = useTheme();
  
  const amountColor = isIncome 
    ? 'text-green-500' 
    : isExpense 
      ? 'text-red-500' 
      : isDarkMode ? 'text-white' : 'text-black';
  
  return (
    <ListItem className={`flex items-center justify-between ${className}`}>
      <div className="flex-1 min-w-0">
        <div className={`text-sm truncate ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          {title}
        </div>
        {subtitle && (
          <div className={`text-xs mt-1 ${
            isDarkMode ? 'text-gray-500' : 'text-gray-500'
          }`}>
            {subtitle}
          </div>
        )}
        {category && (
          <div className={`text-xs mt-1 ${
            isDarkMode ? 'text-gray-500' : 'text-gray-500'
          }`}>
            {category}
          </div>
        )}
      </div>
      <div className={`text-sm font-mono ml-4 ${amountColor}`}>
        {isIncome ? '+' : ''}${Math.abs(amount || 0).toFixed(2)}
      </div>
    </ListItem>
  );
};

// ==================== SECTION COMPONENTS ====================

// Section with title and optional empty state
export const DataSection = ({ 
  title,
  data = [],
  renderItem,
  emptyState,
  className = ''
}) => {
  const { isDarkMode } = useTheme();
  
  return (
    <section className={className}>
      <h2 className={`
        text-sm font-medium uppercase tracking-wider mb-6
        ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}
      `}>
        {title}
      </h2>
      
      {data.length === 0 ? (
        emptyState
      ) : (
        <div className="space-y-3">
          {data.map((item, index) => renderItem(item, index))}
        </div>
      )}
    </section>
  );
};
