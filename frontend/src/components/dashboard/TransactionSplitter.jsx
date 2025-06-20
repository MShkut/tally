import React, { useState, useEffect } from 'react';
import normalizeMerchantName from '../../utils/transactionHelpers';
import { 
  Split, X, Plus, DollarSign, CheckCircle, AlertCircle
} from 'lucide-react';
import useTheme from '../../contexts/ThemeContext';

const TransactionSplitter = ({ transaction, categories, onSplit, onCancel }) => {
  const { isDarkMode } = useTheme();
  const [splitItems, setSplitItems] = useState([
    {
      id: 1,
      description: transaction.description,
      amount: Math.abs(transaction.amount),
      categoryId: transaction.category?.id || categories[0]?.id || '',
      percentage: 100
    }
  ]);
  
  const [remainingAmount, setRemainingAmount] = useState(0);
  const [isValid, setIsValid] = useState(true);

  const originalAmount = Math.abs(transaction.amount);

  useEffect(() => {
    const totalAllocated = splitItems.reduce((sum, item) => {
      return sum + (parseFloat(item.amount) || 0);
    }, 0);
    
    const remaining = originalAmount - totalAllocated;
    setRemainingAmount(remaining);
    setIsValid(Math.abs(remaining) < 0.01);
  }, [splitItems, originalAmount]);

  const handleAmountChange = (id, newAmount) => {
    setSplitItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, amount: newAmount } : item
      )
    );
  };

  const handleDescriptionChange = (id, newDescription) => {
    setSplitItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, description: newDescription } : item
      )
    );
  };

  const handleCategoryChange = (id, newCategoryId) => {
    setSplitItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, categoryId: newCategoryId } : item
      )
    );
  };

  const addSplitItem = () => {
    const newId = Math.max(...splitItems.map(item => item.id)) + 1;
    setSplitItems(prevItems => [
      ...prevItems,
      {
        id: newId,
        description: `${transaction.description} - Item ${newId}`,
        amount: remainingAmount > 0 ? remainingAmount.toFixed(2) : '0.00',
        categoryId: categories[0]?.id || '',
        percentage: remainingAmount > 0 ? (remainingAmount / originalAmount * 100) : 0
      }
    ]);
  };

  const removeSplitItem = (id) => {
    if (splitItems.length > 1) {
      setSplitItems(prevItems => prevItems.filter(item => item.id !== id));
    }
  };

  const autoDistribute = () => {
    const itemCount = splitItems.length;
    const amountPerItem = (originalAmount / itemCount).toFixed(2);
    const lastItemAmount = (originalAmount - (amountPerItem * (itemCount - 1))).toFixed(2);
    
    setSplitItems(prevItems =>
      prevItems.map((item, index) => ({
        ...item,
        amount: index === itemCount - 1 ? lastItemAmount : amountPerItem
      }))
    );
  };

  const handleSplit = () => {
    if (!isValid) return;

    const splitTransactions = splitItems.map((item, index) => ({
      id: `${transaction.id}-split-${index + 1}`,
      date: transaction.date,
      description: item.description,
      normalizedMerchant: normalizeMerchantName(item.description),
      amount: transaction.amount < 0 ? -parseFloat(item.amount) : parseFloat(item.amount),
      category: categories.find(c => c.id === item.categoryId),
      confidence: 1.0,
      confirmed: true,
      originalData: { 
        ...transaction.originalData, 
        splitFrom: transaction.id,
        splitIndex: index + 1,
        splitTotal: splitItems.length
      }
    }));

    onSplit(transaction.id, splitTransactions);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Split className="w-6 h-6 text-blue-500" />
            <h2 className={`text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              Split Transaction
            </h2>
          </div>
          <button 
            onClick={onCancel} 
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Original Transaction Info */}
        <div className={`rounded-lg p-4 mb-6 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            Original Transaction
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Date: </span>
              <span className={isDarkMode ? 'text-gray-100' : 'text-gray-900'}>
                {transaction.date}
              </span>
            </div>
            <div>
              <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Description: </span>
              <span className={isDarkMode ? 'text-gray-100' : 'text-gray-900'}>
                {transaction.description}
              </span>
            </div>
            <div>
              <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Amount: </span>
              <span className={`font-medium ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${Math.abs(transaction.amount).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Auto Split Button */}
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={autoDistribute}
            className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
          >
            Auto Split Evenly
          </button>
          <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Distributes amount equally across all items
          </span>
        </div>

        {/* Split Items */}
        <div className="space-y-4 mb-6">
          {splitItems.map((item) => (
            <div 
              key={item.id} 
              className={`border rounded-lg p-4 ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
                <div className="lg:col-span-4">
                  <label className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Description
                  </label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleDescriptionChange(item.id, e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg text-sm ${
                      isDarkMode 
                        ? 'border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400' 
                        : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="Item description"
                  />
                </div>
                <div className="lg:col-span-2">
                  <label className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Amount
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      value={item.amount}
                      onChange={(e) => handleAmountChange(item.id, e.target.value)}
                      className={`w-full pl-9 pr-3 py-2 border rounded-lg text-sm ${
                        isDarkMode 
                          ? 'border-gray-600 bg-gray-700 text-gray-100' 
                          : 'border-gray-300 bg-white text-gray-900'
                      }`}
                    />
                  </div>
                </div>
                <div className="lg:col-span-4">
                  <label className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Category
                  </label>
                  <select
                    value={item.categoryId}
                    onChange={(e) => handleCategoryChange(item.id, e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg text-sm ${
                      isDarkMode 
                        ? 'border-gray-600 bg-gray-700 text-gray-100' 
                        : 'border-gray-300 bg-white text-gray-900'
                    }`}
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name} ({category.type})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="lg:col-span-2">
                  <button
                    onClick={() => removeSplitItem(item.id)}
                    disabled={splitItems.length === 1}
                    className={`w-full p-2 rounded-lg transition-colors text-sm ${
                      splitItems.length === 1
                        ? isDarkMode 
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : isDarkMode 
                          ? 'bg-red-900/20 text-red-400 hover:bg-red-900/40' 
                          : 'bg-red-100 text-red-600 hover:bg-red-200'
                    }`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Split Item Button */}
        <button
          onClick={addSplitItem}
          className={`w-full px-4 py-2 border-2 border-dashed rounded-lg transition-colors flex items-center justify-center gap-2 ${
            isDarkMode 
              ? 'border-gray-600 text-gray-400 hover:border-gray-400 hover:text-gray-300' 
              : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700'
          }`}
        >
          <Plus className="w-4 h-4" />
          Add Split Item
        </button>

        {/* Validation Status */}
        <div className={`mt-6 p-4 rounded-lg border ${
          isValid 
            ? isDarkMode ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'
            : isDarkMode ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {isValid ? 
              <CheckCircle className="w-5 h-5 text-green-500" /> : 
              <AlertCircle className="w-5 h-5 text-red-500" />
            }
            <span className={`font-medium ${
              isValid 
                ? isDarkMode ? 'text-green-300' : 'text-green-800'
                : isDarkMode ? 'text-red-300' : 'text-red-800'
            }`}>
              {isValid ? 'Split Valid' : 'Split Invalid'}
            </span>
          </div>
          <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Remaining: <span className="font-medium">${remainingAmount.toFixed(2)}</span> of ${originalAmount.toFixed(2)}
            {!isValid && (
              <span className="block mt-1 text-red-500">
                Split amounts must equal the original transaction amount exactly.
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={onCancel}
            className={`px-6 py-2 border rounded-lg transition-colors ${
              isDarkMode 
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSplit}
            disabled={!isValid}
            className={`px-6 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              isValid 
                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                : isDarkMode 
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Split className="w-4 h-4" />
            Split Transaction
          </button>
        </div>
      </div>
    </div>
  );
};


export default TransactionSplitter;
