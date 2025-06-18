import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeToggle from '../shared/ThemeToggle';
import ProgressBar from '../shared/ProgressBar';
import NavigationButtons from '../shared/NavigationButtons';

// Net Worth Item Component
const NetWorthItem = ({ item, onUpdate, onDelete, isDarkMode, type }) => {
  const handleNameChange = (e) => {
    onUpdate({ ...item, name: e.target.value });
  };

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    onUpdate({ ...item, amount: value });
  };

  const placeholder = type === 'asset' 
    ? 'Asset name (e.g., Savings Account, 401k)' 
    : 'Debt name (e.g., Credit Card, Student Loan)';

  return (
    <div className={`py-6 border-b transition-colors ${
      isDarkMode ? 'border-gray-800' : 'border-gray-200'
    }`}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
        <div className="lg:col-span-8">
          <label className={`block text-sm font-medium mb-2 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {type === 'asset' ? 'Asset' : 'Liability'}
          </label>
          <input
            type="text"
            placeholder={placeholder}
            value={item.name}
            onChange={handleNameChange}
            className={`w-full bg-transparent border-0 border-b-2 pb-2 text-lg focus:outline-none transition-colors ${
              isDarkMode 
                ? 'border-gray-700 text-white placeholder-gray-500 focus:border-gray-500' 
                : 'border-gray-300 text-gray-900 placeholder-gray-400 focus:border-gray-500'
            }`}
          />
        </div>
        
        <div className="lg:col-span-3">
          <label className={`block text-sm font-medium mb-2 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {type === 'asset' ? 'Value' : 'Balance Owed'}
          </label>
          <div className="relative">
            <span className={`absolute left-0 top-2 text-lg ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              $
            </span>
            <input
              type="text"
              placeholder="0"
              value={item.amount}
              onChange={handleAmountChange}
              className={`w-full bg-transparent border-0 border-b-2 pb-2 pl-6 text-lg focus:outline-none transition-colors ${
                isDarkMode 
                  ? 'border-gray-700 text-white placeholder-gray-500 focus:border-gray-500' 
                  : 'border-gray-300 text-gray-900 placeholder-gray-400 focus:border-gray-500'
              }`}
            />
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <button
            onClick={onDelete}
            className={`w-full py-2 text-sm transition-colors border-b ${
              isDarkMode 
                ? 'text-gray-500 hover:text-gray-300 border-transparent hover:border-gray-600' 
                : 'text-gray-400 hover:text-gray-600 border-transparent hover:border-gray-400'
            }`}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};

const NetWorthStep = ({ onNext, onBack, incomeData, savingsData, allocationData, expensesData }) => {
  const { isDarkMode } = useTheme();
  
  // Auto-populate assets from savings goals if available
  const initialAssets = allocationData?.savingsGoals?.map((goal, index) => ({
    id: `goal-${index}`,
    name: goal.name || 'Savings Goal',
    amount: goal.amount ? (parseFloat(goal.amount) * 12).toString() : '0',
    fromGoal: true
  })) || [];

  const [assets, setAssets] = useState([
    ...initialAssets,
    { id: 1, name: 'Checking Account', amount: '5000', fromGoal: false },
    { id: 2, name: '401(k)', amount: '25000', fromGoal: false }
  ]);
  
  const [liabilities, setLiabilities] = useState([
    { id: 1, name: 'Credit Card', amount: '2500' },
    { id: 2, name: 'Student Loan', amount: '15000' }
  ]);

  const addAsset = () => {
    setAssets([...assets, { 
      id: Date.now(),
      name: '', 
      amount: '', 
      fromGoal: false
    }]);
  };

  const addLiability = () => {
    setLiabilities([...liabilities, { 
      id: Date.now(),
      name: '', 
      amount: ''
    }]);
  };

  const updateAsset = (id, updatedAsset) => {
    setAssets(assets.map(asset => 
      asset.id === id ? updatedAsset : asset
    ));
  };

  const updateLiability = (id, updatedLiability) => {
    setLiabilities(liabilities.map(liability => 
      liability.id === id ? updatedLiability : liability
    ));
  };

  const deleteAsset = (id) => {
    setAssets(assets.filter(asset => asset.id !== id));
  };

  const deleteLiability = (id) => {
    setLiabilities(liabilities.filter(liability => liability.id !== id));
  };

  // Calculate totals
  const totalAssets = assets.reduce((sum, asset) => 
    sum + (parseFloat(asset.amount) || 0), 0
  );

  const totalLiabilities = liabilities.reduce((sum, liability) => 
    sum + (parseFloat(liability.amount) || 0), 0
  );

  const netWorth = totalAssets - totalLiabilities;

  const handleNext = () => {
    if (onNext) {
      onNext({
        assets,
        liabilities,
        totalAssets,
        totalLiabilities,
        netWorth
      });
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <ThemeToggle />
      <div className="max-w-6xl mx-auto px-6 py-12">
        <ProgressBar currentStep={5} />
        
        <div className="mb-24">
          <h1 className={`text-5xl font-light leading-tight mb-4 ${
            isDarkMode ? 'text-white' : 'text-black'
          }`}>
            What's Your Current Net Worth?
          </h1>
          <p className={`text-xl font-light ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Add your assets and debts to see where you stand financially
          </p>
        </div>

        {/* Net Worth Summary */}
        <div className={`py-12 mb-16 border-t border-b ${
          isDarkMode ? 'border-gray-800' : 'border-gray-200'
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div>
              <div className={`text-3xl font-light mb-2 ${
                isDarkMode ? 'text-white' : 'text-black'
              }`}>
                ${totalAssets.toLocaleString()}
              </div>
              <div className={`text-lg font-light ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Total Assets
              </div>
            </div>
            
            <div>
              <div className={`text-3xl font-light mb-2 ${
                isDarkMode ? 'text-white' : 'text-black'
              }`}>
                ${totalLiabilities.toLocaleString()}
              </div>
              <div className={`text-lg font-light ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Total Liabilities
              </div>
            </div>
            
            <div>
              <div className={`text-4xl font-light mb-2 ${
                netWorth >= 0 
                  ? isDarkMode ? 'text-white' : 'text-black'
                  : 'text-gray-500'
              }`}>
                ${netWorth.toLocaleString()}
              </div>
              <div className={`text-lg font-light ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Net Worth
              </div>
              <div className={`text-sm mt-2 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-500'
              }`}>
                {netWorth >= 0 ? 'Positive net worth' : 'Room to grow'}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Assets */}
          <div>
            <h2 className={`text-2xl font-light mb-8 ${
              isDarkMode ? 'text-white' : 'text-black'
            }`}>
              Assets (What You Own)
            </h2>
            
            <div className="mb-8">
              {assets.map((asset) => (
                <div key={asset.id}>
                  <NetWorthItem
                    item={asset}
                    onUpdate={(updatedAsset) => updateAsset(asset.id, updatedAsset)}
                    onDelete={() => deleteAsset(asset.id)}
                    isDarkMode={isDarkMode}
                    type="asset"
                  />
                  {asset.fromGoal && (
                    <p className={`text-xs mt-2 ml-4 ${
                      isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                    }`}>
                      From your savings goals - update as needed
                    </p>
                  )}
                </div>
              ))}
            </div>
            
            <button
              onClick={addAsset}
              className={`w-full py-6 border-2 border-dashed transition-colors text-center ${
                isDarkMode 
                  ? 'border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300' 
                  : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700'
              }`}
            >
              <span className="text-lg font-light">Add asset</span>
            </button>
          </div>

          {/* Liabilities */}
          <div>
            <h2 className={`text-2xl font-light mb-8 ${
              isDarkMode ? 'text-white' : 'text-black'
            }`}>
              Liabilities (What You Owe)
            </h2>
            
            <div className="mb-8">
              {liabilities.map((liability) => (
                <NetWorthItem
                  key={liability.id}
                  item={liability}
                  onUpdate={(updatedLiability) => updateLiability(liability.id, updatedLiability)}
                  onDelete={() => deleteLiability(liability.id)}
                  isDarkMode={isDarkMode}
                  type="liability"
                />
              ))}
            </div>
            
            <button
              onClick={addLiability}
              className={`w-full py-6 border-2 border-dashed transition-colors text-center ${
                isDarkMode 
                  ? 'border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300' 
                  : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700'
              }`}
            >
              <span className="text-lg font-light">Add liability</span>
            </button>
          </div>
        </div>

        {/* Privacy & Next Steps */}
        <div className={`mt-16 p-8 border-l-4 ${
          isDarkMode 
            ? 'border-gray-700 bg-gray-900' 
            : 'border-gray-300 bg-gray-100'
        }`}>
          <h3 className={`text-xl font-light mb-4 ${
            isDarkMode ? 'text-white' : 'text-black'
          }`}>
            Your Privacy Matters
          </h3>
          <div className={`space-y-3 text-base font-light ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            <p>All your financial data stays on your device - we never see it</p>
            <p>Import bank transactions via CSV for automatic categorization</p>
            <p>Track progress toward your savings goals over time</p>
            <p>Get insights into spending patterns and budget optimization</p>
          </div>
        </div>

        <NavigationButtons
          onBack={onBack}
          onNext={handleNext}
          nextLabel="Complete Setup"
          className="mt-16"
        />
      </div>
    </div>
  );
};

export default NetWorthStep;
