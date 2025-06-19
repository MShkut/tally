import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeToggle from '../shared/ThemeToggle';
import dataManager from '../../utils/dataManager';

const TransactionImport = ({ onNavigate }) => {
  const { isDarkMode } = useTheme();
  const [transactions, setTransactions] = useState([]);
  const [budgetCategories, setBudgetCategories] = useState([]);

  useEffect(() => {
    const loadedTransactions = dataManager.loadTransactions();
    const userData = dataManager.loadUserData();
    
    setTransactions(loadedTransactions);
    
    if (userData?.expenses?.expenseCategories) {
      setBudgetCategories(userData.expenses.expenseCategories);
    }
  }, []);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        
        const newTransactions = lines.slice(1).map((line, index) => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          return {
            id: Date.now() + index,
            date: values[0] || new Date().toISOString().split('T')[0],
            description: values[1] || 'Unknown Transaction',
            amount: parseFloat(values[2]) || 0,
            category: 'Uncategorized'
          };
        });

        const allTransactions = [...transactions, ...newTransactions];
        dataManager.saveTransactions(allTransactions);
        setTransactions(allTransactions);
        
        alert(`✅ Imported ${newTransactions.length} transactions!`);
      } catch (error) {
        alert('❌ Failed to import CSV. Please check format.');
      }
    };
    
    reader.readAsText(file);
  };

  const handleManualAdd = () => {
    const description = prompt('Transaction description:');
    const amount = prompt('Amount (negative for expenses):');
    
    if (description && amount) {
      const newTransaction = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        description,
        amount: parseFloat(amount),
        category: 'Uncategorized'
      };
      
      const updatedTransactions = [...transactions, newTransaction];
      dataManager.saveTransactions(updatedTransactions);
      setTransactions(updatedTransactions);
    }
  };

  const updateCategory = (transactionId, newCategory) => {
    const updatedTransactions = transactions.map(t => 
      t.id === transactionId ? { ...t, category: newCategory } : t
    );
    dataManager.saveTransactions(updatedTransactions);
    setTransactions(updatedTransactions);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <ThemeToggle />
      <div className="max-w-4xl mx-auto px-6 py-12">
        
        {/* Header */}
        <div className="mb-24">
          <h1 className={`text-5xl font-light leading-tight mb-4 ${
            isDarkMode ? 'text-white' : 'text-black'
          }`}>
            Import Your Transactions
          </h1>
          <p className={`text-xl font-light ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Upload bank transactions to track against your budget categories
          </p>
        </div>

        {/* CSV Upload */}
        <div className="mb-16">
          <label className={`block text-sm font-medium mb-6 uppercase tracking-wider ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Upload CSV File
          </label>
          <div className={`py-12 border-2 border-dashed text-center ${
            isDarkMode ? 'border-gray-600' : 'border-gray-300'
          }`}>
            <p className={`text-lg font-light mb-6 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              CSV format: Date, Description, Amount
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className={`block mx-auto text-lg font-light ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}
            />
          </div>
        </div>

        {/* Manual Add */}
        <div className="mb-16 text-center">
          <button
            onClick={handleManualAdd}
            className={`px-8 py-4 text-xl font-light border-b-2 transition-colors ${
              isDarkMode 
                ? 'text-gray-400 border-gray-600 hover:border-gray-400'
                : 'text-gray-600 border-gray-400 hover:border-gray-600'
            }`}
          >
            Add Transaction Manually
          </button>
        </div>

        {/* Transactions List */}
        {transactions.length > 0 && (
          <div className="mb-16">
            <h2 className={`text-2xl font-light mb-8 ${
              isDarkMode ? 'text-white' : 'text-black'
            }`}>
              Recent Transactions ({transactions.length})
            </h2>
            
            <div className="space-y-6">
              {transactions.slice(-10).reverse().map((transaction) => (
                <div key={transaction.id} className={`py-6 border-b ${
                  isDarkMode ? 'border-gray-800' : 'border-gray-200'
                }`}>
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
                    <div className="lg:col-span-2">
                      <div className={`text-lg font-light mb-2 ${
                        isDarkMode ? 'text-white' : 'text-black'
                      }`}>
                        {transaction.description}
                      </div>
                      <div className={`text-sm ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {transaction.date}
                      </div>
                    </div>
                    
                    <div>
                      <select
                        value={transaction.category}
                        onChange={(e) => updateCategory(transaction.id, e.target.value)}
                        className={`w-full px-0 py-3 border-0 border-b-2 bg-transparent transition-colors focus:outline-none ${
                          isDarkMode 
                            ? 'border-gray-700 text-white focus:border-white' 
                            : 'border-gray-300 text-black focus:border-black'
                        }`}
                      >
                        <option value="Uncategorized">Uncategorized</option>
                        {budgetCategories.map(category => (
                          <option key={category.id} value={category.name}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className={`text-xl font-light text-right ${
                      transaction.amount >= 0 
                        ? 'text-green-500' 
                        : isDarkMode ? 'text-white' : 'text-black'
                    }`}>
                      {transaction.amount >= 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => onNavigate('dashboard')}
            className={`text-lg font-light transition-colors border-b ${
              isDarkMode 
                ? 'text-gray-400 border-gray-700 hover:border-white pb-1'
                : 'text-gray-600 border-gray-300 hover:border-black pb-1'
            }`}
          >
            Back to Dashboard
          </button>
          
          {transactions.length > 0 && (
            <button
              onClick={() => onNavigate('dashboard')}
              className={`px-8 py-4 text-xl font-light border-b-2 transition-colors ${
                isDarkMode 
                  ? 'text-white border-white hover:border-gray-400'
                  : 'text-black border-black hover:border-gray-600'
              }`}
            >
              View Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionImport;
