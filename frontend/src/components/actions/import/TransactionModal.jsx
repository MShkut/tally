import React, { useState } from 'react';
import { useTheme } from 'contexts/ThemeContext';
import { 
  FormGrid, 
  FormField, 
  StandardInput,
  StandardSelect,
  FormSection,
  useItemManager
} from 'components/shared/FormComponents';
import { DatePicker } from 'components/shared/DatePicker';
import { Currency } from 'utils/currency';

// Transaction actions component (floating modal style) - handles split, combine, and edit
export const TransactionModal = ({ transaction, transactions, categories, actionType, onComplete, onCancel }) => {
  const { isDarkMode } = useTheme();
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  
  // Get title and subtitle based on action type
  const getActionTitle = () => {
    switch (actionType) {
      case 'split': return 'Split Transaction';
      case 'combine': return 'Combine Transaction';
      case 'edit': return 'Edit Transaction';
      default: return 'Transaction Action';
    }
  };

  const getActionSubtitle = () => {
    switch (actionType) {
      case 'split': 
        return `Original: ${transaction.description} - ${Currency.format(Currency.abs(transaction.amount))}`;
      case 'combine': 
        return `Combine with other transactions to reduce this expense`;
      case 'edit': 
        return `Modify transaction details`;
      default: return '';
    }
  };

  // Initialize items based on action type
  const getInitialItems = () => {
    if (actionType === 'edit') {
      return [{
        id: 1,
        date: transaction.date,
        description: transaction.description,
        amount: Currency.formatInput(Currency.abs(transaction.amount))
      }];
    } else {
      // For split/combine, start with the original transaction
      return [{
        id: 1,
        description: transaction.description,
        amount: Currency.formatInput(Currency.abs(transaction.amount)),
        categoryId: transaction.category?.id || categories[0]?.id || ''
      }];
    }
  };

  const { 
    items: actionItems, 
    addItem, 
    updateItem, 
    deleteItem,
    hasItems
  } = useItemManager(getInitialItems());

  const originalAmount = Currency.abs(transaction.amount);
  
  // Calculate total allocated using Currency system
  const totalAllocated = actionItems.reduce((sum, item) => {
    const itemAmount = parseFloat(Currency.parseInput(item.amount)) || 0;
    return Currency.add(sum, itemAmount);
  }, 0);
  
  const remaining = Currency.subtract(originalAmount, totalAllocated);
  const isValid = actionType === 'edit' ? true : Currency.isEqual(remaining, 0);

  const categoryOptions = categories.map(cat => ({
    value: cat.id,
    label: cat.isSystemCategory ? cat.name : `${cat.name} (${cat.type})`
  }));

  const handleAddItem = () => {
    if (actionType === 'edit') return; // Don't allow adding items in edit mode
    
    const remainingFormatted = Currency.compare(remaining, 0) > 0 ? 
      Currency.formatInput(remaining) : '';
      
    addItem({
      description: '',
      amount: remainingFormatted,
      categoryId: categories[0]?.id || ''
    });
  };

  const handleComplete = () => {
    if (actionType === 'combine' && selectedTransactions.length === 0) return;
    if (actionType !== 'combine' && !isValid) return;

    if (actionType === 'edit') {
      // For edit, return single modified transaction
      const editedItem = actionItems[0];
      const editedAmount = parseFloat(Currency.parseInput(editedItem.amount)) || 0;
      const finalAmount = Currency.compare(transaction.amount, 0) < 0 ? 
        Currency.multiply(editedAmount, -1) : editedAmount;
        
      const editedTransaction = {
        ...transaction,
        date: editedItem.date || transaction.date,
        description: editedItem.description || transaction.description,
        amount: finalAmount,
        confidence: 1.0,
        needsReview: false
      };

      onComplete([editedTransaction]);
    } else if (actionType === 'combine') {
      // For combine, merge the selected transactions into one
      const allTransactions = [transaction, ...selectedTransactions];
      const totalAmount = allTransactions.reduce((sum, t) => Currency.add(sum, t.amount), 0);
      const descriptions = allTransactions.map(t => t.description).join(' + ');
      
      const combinedTransaction = {
        ...transaction,
        description: descriptions,
        amount: totalAmount,
        confidence: 1.0,
        needsReview: false,
        originalData: {
          ...transaction.originalData,
          actionType: 'combine',
          combinedTransactions: allTransactions.map(t => t.id),
          combinedCount: allTransactions.length
        }
      };

      onComplete([combinedTransaction]);
    } else {
      // For split, return multiple transactions
      const resultTransactions = actionItems.map((item, index) => {
        const itemAmount = parseFloat(Currency.parseInput(item.amount)) || 0;
        const finalAmount = Currency.compare(transaction.amount, 0) < 0 ? 
          Currency.multiply(itemAmount, -1) : itemAmount;
          
        return {
          ...transaction,
          id: `${transaction.id}-${actionType}-${index + 1}`,
          description: item.description || transaction.description,
          amount: finalAmount,
          category: categories.find(c => c.id === item.categoryId),
          confidence: 1.0,
          needsReview: false,
          originalData: {
            ...transaction.originalData,
            actionType: actionType,
            actionFrom: transaction.id,
            actionIndex: index + 1,
            actionTotal: actionItems.length
          }
        };
      });

      onComplete(resultTransactions);
    }
  };

  const autoDistribute = () => {
    if (actionType === 'edit') return; // Don't allow auto-distribute in edit mode
    
    const count = actionItems.length;
    const perItem = Currency.divide(originalAmount, count);
    const lastItemAmount = Currency.subtract(originalAmount, Currency.multiply(perItem, count - 1));
    
    actionItems.forEach((item, index) => {
      const amount = index === count - 1 ? lastItemAmount : perItem;
      updateItem(item.id, {
        ...item,
        amount: Currency.formatInput(amount)
      });
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className={`
        w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4
        ${isDarkMode ? 'bg-black border border-gray-700' : 'bg-white border border-gray-200'}
        shadow-2xl
      `}>
        {/* Modal Header */}
        <div className={`px-8 py-6 border-b ${
          isDarkMode ? 'border-gray-800' : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-3xl font-medium ${
                isDarkMode ? 'text-white' : 'text-black'
              }`}>
                {getActionTitle()}
              </h2>
              <p className={`text-lg font-light mt-2 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {getActionSubtitle()}
              </p>
            </div>
            <button
              onClick={onCancel}
              className={`text-2xl font-light transition-colors ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-white' 
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              ×
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="px-8 py-6">
          {actionType === 'combine' ? (
            <CombineContent 
              transaction={transaction}
              transactions={transactions}
              selectedTransactions={selectedTransactions}
              setSelectedTransactions={setSelectedTransactions}
              isDarkMode={isDarkMode}
            />
          ) : (
            <>
              {/* Action Items */}
              <FormSection>
                <div className="space-y-12">
                  {actionItems.map((item) => (
                    <ActionItem
                      key={item.id}
                      item={item}
                      categoryOptions={categoryOptions}
                      onUpdate={(updated) => updateItem(item.id, updated)}
                      onDelete={() => deleteItem(item.id)}
                      canDelete={actionItems.length > 1 && actionType !== 'edit'}
                      actionType={actionType}
                    />
                  ))}
                </div>
                
                {actionType !== 'edit' && (
                  <div className="mt-8">
                    <button
                      onClick={handleAddItem}
                      className={`
                        w-full py-6 border-2 border-dashed transition-colors text-center
                        ${isDarkMode 
                          ? 'border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300' 
                          : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700'
                        }
                      `}
                    >
                      <span className="text-xl font-light">
                        Add {actionType === 'split' ? 'Split' : 'Combine'} Item
                      </span>
                    </button>
                  </div>
                )}
              </FormSection>
            </>
          )}

          {/* Validation Status */}
          {actionType !== 'edit' && actionType !== 'combine' && (
            <FormSection>
              <div className={`
                text-center py-4 text-xl font-light
                ${isValid 
                  ? 'text-green-500' 
                  : 'text-red-500'
                }
              `}>
                {isValid 
                  ? `${actionType.charAt(0).toUpperCase() + actionType.slice(1)} amounts match original transaction` 
                  : Currency.compare(remaining, 0) > 0
                    ? `${Currency.format(remaining)} under - add more to split items`
                    : `${Currency.format(Currency.abs(remaining))} over - reduce split item amounts`
                }
              </div>
            </FormSection>
          )}
          {actionType === 'combine' && (
            <FormSection>
              <div className={`text-center py-4 text-xl font-light ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {selectedTransactions.length === 0 
                  ? 'Select transactions to combine with this expense'
                  : `${selectedTransactions.length + 1} transactions selected for combine`
                }
              </div>
            </FormSection>
          )}
        </div>

        {/* Modal Footer */}
        <div className={`px-8 py-6 border-t ${
          isDarkMode ? 'border-gray-800' : 'border-gray-200'
        }`}>
          <div className="flex justify-between items-center">
            <button
              onClick={onCancel}
              className={`text-lg font-light transition-colors ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-white border-b border-gray-700 hover:border-white pb-1' 
                  : 'text-gray-600 hover:text-black border-b border-gray-300 hover:border-black pb-1'
              }`}
            >
              Cancel
            </button>
            
            <button
              onClick={handleComplete}
              disabled={actionType === 'combine' ? selectedTransactions.length === 0 : !isValid}
              className={`text-xl font-light transition-all pb-2 ${
                (actionType === 'combine' ? selectedTransactions.length === 0 : !isValid)
                  ? 'text-gray-400 border-b-2 border-gray-400 cursor-not-allowed'
                  : isDarkMode
                    ? 'text-white border-b-2 border-white hover:border-gray-400'
                    : 'text-black border-b-2 border-black hover:border-gray-600'
              }`}
            >
              {actionType === 'edit' ? 'Save Changes' : `Apply ${actionType.charAt(0).toUpperCase() + actionType.slice(1)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Action item component (for split, combine, edit)
const ActionItem = ({ item, categoryOptions, onUpdate, onDelete, canDelete, actionType }) => {
  const { isDarkMode } = useTheme();

  const handleAmountChange = (value) => {
    // Use Currency.parseInput to clean the input
    const cleanedValue = Currency.parseInput(value);
    onUpdate({ ...item, amount: cleanedValue });
  };

  const handleDateChange = (value) => {
    onUpdate({ ...item, date: value });
  };

  const borderClass = actionType === 'edit' || actionType === 'split' ? '' : `border-b ${
    isDarkMode ? 'border-gray-800' : 'border-gray-200'
  }`;

  return (
    <div className={`py-8 ${borderClass}`}>
      <FormGrid className="gap-8">
        {actionType === 'edit' ? (
          // Edit mode: Date, Description, Amount only
          <>
            <FormField span={2} mobileSpan={2}>
              <div>
                <label className={`block text-2xl font-medium mb-3 ${
                  isDarkMode ? 'text-white' : 'text-black'
                }`}>
                  Date
                </label>
                <div className="relative">
                  <style>{`
                    .date-picker-centered .absolute {
                      left: 100% !important;
                      top: -140px !important;
                      transform: none !important;
                      margin-left: 16px !important;
                      margin-top: 0 !important;
                    }
                  `}</style>
                  <DatePicker
                    value={item.date}
                    onChange={(isoDate) => onUpdate({ ...item, date: isoDate })}
                    placeholder="Select date"
                    className="date-picker-centered"
                  />
                </div>
              </div>
            </FormField>
            <FormField span={7} mobileSpan={7}>
              <StandardInput
                label="Description"
                value={item.description}
                onChange={(value) => onUpdate({ ...item, description: value })}
                placeholder="Transaction description"
                className="[&_label]:text-2xl [&_label]:font-medium [&_input]:text-2xl [&_input]:font-medium [&_input]:pb-4"
              />
            </FormField>
            <FormField span={3} mobileSpan={3}>
              <StandardInput
                label="Amount"
                type="currency"
                value={item.amount}
                onChange={handleAmountChange}
                prefix="$"
                className="[&_label]:text-2xl [&_label]:font-medium [&_input]:text-2xl [&_input]:font-medium [&_input]:pb-4"
              />
            </FormField>
          </>
        ) : (
          // Split/Combine mode: Description, Amount, Category, Delete (no borders for split)
          <>
            <FormField span={6} mobileSpan={6}>
              <StandardInput
                label="Description"
                value={item.description}
                onChange={(value) => onUpdate({ ...item, description: value })}
                placeholder="What was this part for?"
                className="[&_label]:text-2xl [&_label]:font-medium [&_input]:text-2xl [&_input]:font-medium [&_input]:pb-4"
              />
            </FormField>
            <FormField span={2} mobileSpan={2}>
              <StandardInput
                label="Amount"
                type="currency"
                value={item.amount}
                onChange={handleAmountChange}
                prefix="$"
                className="[&_label]:text-2xl [&_label]:font-medium [&_input]:text-2xl [&_input]:font-medium [&_input]:pb-4"
              />
            </FormField>
            <FormField span={3} mobileSpan={3}>
              <StandardSelect
                label="Category"
                value={item.categoryId}
                onChange={(value) => onUpdate({ ...item, categoryId: value })}
                options={categoryOptions}
                className="[&_label]:text-2xl [&_label]:font-medium [&_button]:text-xl [&_button]:font-medium"
              />
            </FormField>
            <FormField span={1} mobileSpan={1}>
              {canDelete && (
                <div className="flex items-end h-full pb-4">
                  <button
                    onClick={onDelete}
                    className="w-full text-center text-3xl font-light text-gray-400 hover:text-red-500 transition-colors"
                    title={`Remove this ${actionType} item`}
                  >
                    ×
                  </button>
                </div>
              )}
            </FormField>
          </>
        )}
      </FormGrid>
    </div>
  );
};

// Combine content component - shows main transaction and selectable list
const CombineContent = ({ transaction, transactions, selectedTransactions, setSelectedTransactions, isDarkMode }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter out the current transaction and filter by search term
  const availableTransactions = transactions.filter(t => 
    t.id !== transaction.id && 
    (t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
     Currency.format(t.amount).includes(searchTerm))
  );
  
  const toggleTransaction = (t) => {
    if (selectedTransactions.find(st => st.id === t.id)) {
      setSelectedTransactions(selectedTransactions.filter(st => st.id !== t.id));
    } else {
      setSelectedTransactions([...selectedTransactions, t]);
    }
  };
  
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  return (
    <>
      {/* Main Transaction */}
      <FormSection>
        <div className={`text-lg font-medium mb-4 ${
          isDarkMode ? 'text-white' : 'text-black'
        }`}>
          Main Expense:
        </div>
        <div className={`p-4 border-b-2 ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className={`col-span-1 text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {formatDate(transaction.date)}
            </div>
            <div className={`col-span-8 ${
              isDarkMode ? 'text-white' : 'text-black'
            }`}>
              {transaction.description}
            </div>
            <div className={`col-span-3 text-right font-mono ${
              Currency.compare(transaction.amount, 0) >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {Currency.compare(transaction.amount, 0) >= 0 ? '+' : ''}
              {Currency.format(Currency.abs(transaction.amount))}
            </div>
          </div>
        </div>
      </FormSection>
      
      {/* Search */}
      <FormSection>
        <div className={`text-lg font-medium mb-4 ${
          isDarkMode ? 'text-white' : 'text-black'
        }`}>
          Select transactions to combine:
        </div>
        <input
          type="text"
          placeholder="Search transactions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full py-2 border-0 border-b-2 bg-transparent text-base font-light focus:outline-none transition-colors ${
            isDarkMode 
              ? 'border-gray-600 text-white placeholder-gray-400 hover:border-gray-400' 
              : 'border-gray-300 text-black placeholder-gray-500 hover:border-gray-600'
          }`}
        />
      </FormSection>
      
      {/* Transaction List */}
      <FormSection>
        <div className={`max-h-96 overflow-y-auto border-b ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          {availableTransactions.length === 0 ? (
            <div className={`p-8 text-center ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {searchTerm ? 'No transactions match your search' : 'No other transactions available'}
            </div>
          ) : (
            availableTransactions.map((t) => {
              const isSelected = selectedTransactions.find(st => st.id === t.id);
              return (
                <div
                  key={t.id}
                  onClick={() => toggleTransaction(t)}
                  className={`p-4 border-b cursor-pointer transition-colors ${
                    isDarkMode ? 'border-gray-700' : 'border-gray-200'
                  } ${
                    isSelected
                      ? isDarkMode ? 'bg-gray-800' : 'bg-blue-50'
                      : isDarkMode ? 'hover:bg-gray-900' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-1">
                      <div className={`w-4 h-4 border-2 transition-colors ${
                        isSelected
                          ? isDarkMode 
                            ? 'border-white bg-white' 
                            : 'border-black bg-black'
                          : isDarkMode 
                            ? 'border-gray-600 bg-transparent' 
                            : 'border-gray-400 bg-transparent'
                      }`}>
                      </div>
                    </div>
                    <div className={`col-span-1 text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {formatDate(t.date)}
                    </div>
                    <div className={`col-span-7 ${
                      isDarkMode ? 'text-white' : 'text-black'
                    }`}>
                      {t.description}
                    </div>
                    <div className={`col-span-3 text-right font-mono ${
                      Currency.compare(t.amount, 0) >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {Currency.compare(t.amount, 0) >= 0 ? '+' : ''}
                      {Currency.format(Currency.abs(t.amount))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </FormSection>
      
      {/* Selected Summary */}
      {selectedTransactions.length > 0 && (
        <FormSection>
          <div className={`text-lg font-medium mb-4 ${
            isDarkMode ? 'text-white' : 'text-black'
          }`}>
            Selected for combine ({selectedTransactions.length}):
          </div>
          <div className="space-y-2">
            {selectedTransactions.map((t) => (
              <div key={t.id} className={`p-3 border-b ${
                isDarkMode ? 'border-gray-800' : 'border-gray-200'
              }`}>
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className={`col-span-1 text-sm ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {formatDate(t.date)}
                  </div>
                  <div className={`col-span-8 ${
                    isDarkMode ? 'text-white' : 'text-black'
                  }`}>
                    {t.description}
                  </div>
                  <div className={`col-span-2 text-right font-mono ${
                    Currency.compare(t.amount, 0) >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {Currency.compare(t.amount, 0) >= 0 ? '+' : ''}
                    {Currency.format(Currency.abs(t.amount))}
                  </div>
                  <div className="col-span-1 text-right">
                    <button
                      onClick={() => toggleTransaction(t)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Total calculation */}
          <div className={`mt-4 pt-4 border-t text-right ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className={`text-lg font-medium ${
              isDarkMode ? 'text-white' : 'text-black'
            }`}>
              Combined Total: {Currency.format(
                [transaction, ...selectedTransactions].reduce((sum, t) => Currency.add(sum, t.amount), 0)
              )}
            </div>
          </div>
        </FormSection>
      )}
    </>
  );
};