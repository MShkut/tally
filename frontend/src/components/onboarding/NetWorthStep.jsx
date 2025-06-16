import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  PiggyBank,
  Briefcase,
  Home,
  Target,
  Landmark,
  Car,
  CreditCard,
  Building,
  GraduationCap,
  Smartphone
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeToggle from '../shared/ThemeToggle';
import ProgressBar from '../shared/ProgressBar';

// Available icons for assets and liabilities
const assetIcons = [
  { name: 'PiggyBank', icon: PiggyBank, color: 'text-green-500' },
  { name: 'Briefcase', icon: Briefcase, color: 'text-blue-500' },
  { name: 'Home', icon: Home, color: 'text-orange-500' },
  { name: 'Target', icon: Target, color: 'text-purple-500' },
  { name: 'Landmark', icon: Landmark, color: 'text-gray-600' },
  { name: 'Car', icon: Car, color: 'text-red-500' }
];

const liabilityIcons = [
  { name: 'CreditCard', icon: CreditCard, color: 'text-red-500' },
  { name: 'Home', icon: Home, color: 'text-orange-500' },
  { name: 'Car', icon: Car, color: 'text-blue-500' },
  { name: 'Building', icon: Building, color: 'text-gray-600' },
  { name: 'GraduationCap', icon: GraduationCap, color: 'text-purple-500' },
  { name: 'Smartphone', icon: Smartphone, color: 'text-pink-500' }
];

// Net Worth Item Component
const NetWorthItem = ({ item, onUpdate, onDelete, isDarkMode, type }) => {
  const [showIconPicker, setShowIconPicker] = useState(false);
  
  const icons = type === 'asset' ? assetIcons : liabilityIcons;
  
  const getIconComponent = (iconName) => {
    const iconData = icons.find(item => item.name === iconName);
    return iconData ? iconData.icon : (type === 'asset' ? PiggyBank : CreditCard);
  };

  const getIconColor = (iconName) => {
    const iconData = icons.find(item => item.name === iconName);
    return iconData ? iconData.color : (type === 'asset' ? 'text-green-500' : 'text-red-500');
  };
  
  const IconComponent = getIconComponent(item.icon);

  const handleNameChange = (e) => {
    onUpdate({ ...item, name: e.target.value });
  };

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    onUpdate({ ...item, amount: value });
  };

  const handleIconChange = (iconName) => {
    onUpdate({ ...item, icon: iconName });
    setShowIconPicker(false);
  };

  return (
    <div className={`p-4 rounded-lg border transition-colors ${
      isDarkMode 
        ? 'bg-gray-700 border-gray-600' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0 relative">
          <button
            type="button"
            onClick={() => setShowIconPicker(!showIconPicker)}
            className={`p-2 rounded-lg border transition-colors hover:scale-105 ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-600 hover:bg-gray-700' 
                : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
            }`}
          >
            <IconComponent className={`w-5 h-5 ${getIconColor(item.icon)}`} />
          </button>
          
          {showIconPicker && (
            <div className={`absolute top-12 left-0 z-10 p-3 rounded-lg border shadow-lg ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-600' 
                : 'bg-white border-gray-200'
            }`} style={{ width: '180px' }}>
              <div className="grid grid-cols-3 gap-2">
                {icons.map((iconData) => {
                  const IconComp = iconData.icon;
                  return (
                    <button
                      key={iconData.name}
                      type="button"
                      onClick={() => handleIconChange(iconData.name)}
                      className={`p-2 rounded hover:bg-gray-100 transition-colors ${
                        item.icon === iconData.name 
                          ? isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100' 
                          : isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                      }`}
                    >
                      <IconComp className={`w-4 h-4 ${iconData.color}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <input
            type="text"
            placeholder={type === 'asset' ? 'Asset name (e.g., Savings Account, 401k)' : 'Debt name (e.g., Credit Card, Student Loan)'}
            value={item.name}
            onChange={handleNameChange}
            className={`w-full px-3 py-2 rounded-lg border transition-colors ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
          />
        </div>
        
        <div className="w-32">
          <div className="relative">
            <DollarSign className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <input
              type="text"
              placeholder={type === 'asset' ? 'Value' : 'Balance'}
              value={item.amount}
              onChange={handleAmountChange}
              className={`w-full pl-10 pr-3 py-2 rounded-lg border transition-colors ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
        </div>
        
        <button
          onClick={onDelete}
          className={`p-2 rounded-lg transition-colors ${
            isDarkMode 
              ? 'text-red-400 hover:bg-red-900/20' 
              : 'text-red-600 hover:bg-red-50'
          }`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
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
    amount: goal.amount ? (parseFloat(goal.amount) * 12).toString() : '0', // Convert monthly to annual
    icon: 'Target',
    fromGoal: true
  })) || [];

  const [assets, setAssets] = useState([
    ...initialAssets,
    { id: 1, name: 'Checking Account', amount: '5000', icon: 'PiggyBank', fromGoal: false },
    { id: 2, name: '401(k)', amount: '25000', icon: 'Briefcase', fromGoal: false }
  ]);
  
  const [liabilities, setLiabilities] = useState([
    { id: 1, name: 'Credit Card', amount: '2500', icon: 'CreditCard' },
    { id: 2, name: 'Student Loan', amount: '15000', icon: 'GraduationCap' }
  ]);

  const addAsset = () => {
    setAssets([...assets, { 
      id: Date.now(),
      name: '', 
      amount: '', 
      icon: 'PiggyBank',
      fromGoal: false
    }]);
  };

  const addLiability = () => {
    setLiabilities([...liabilities, { 
      id: Date.now(),
      name: '', 
      amount: '', 
      icon: 'CreditCard'
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
    <div className={`min-h-screen transition-colors ${isDarkMode ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-indigo-50 to-white'} p-6`}>
      <ThemeToggle />
      <div className="max-w-5xl mx-auto">
        <ProgressBar currentStep={5} isDarkMode={isDarkMode} />
        
        <div className="text-center mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            What's Your Current Net Worth?
          </h1>
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
            Add your assets and debts to see where you stand financially
          </p>
        </div>

        <div className={`rounded-xl p-8 shadow-lg mb-8 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
          {/* Net Worth Summary */}
          <div className={`p-6 rounded-lg border transition-colors mb-8 ${
            netWorth >= 0
              ? isDarkMode 
                ? 'bg-green-900/20 border-green-800' 
                : 'bg-green-50 border-green-200'
              : isDarkMode 
                ? 'bg-red-900/20 border-red-800' 
                : 'bg-red-50 border-red-200'
          }`}>
            <div className="text-center">
              <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Your Net Worth
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="w-6 h-6 text-green-500 mr-2" />
                    <span className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Assets
                    </span>
                  </div>
                  <div className={`text-3xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                    ${totalAssets.toLocaleString()}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingDown className="w-6 h-6 text-red-500 mr-2" />
                    <span className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Liabilities
                    </span>
                  </div>
                  <div className={`text-3xl font-bold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                    ${totalLiabilities.toLocaleString()}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <span className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Net Worth
                    </span>
                  </div>
                  <div className={`text-4xl font-bold ${
                    netWorth >= 0 
                      ? isDarkMode ? 'text-green-400' : 'text-green-600'
                      : isDarkMode ? 'text-red-400' : 'text-red-600'
                  }`}>
                    ${netWorth.toLocaleString()}
                  </div>
                  <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {netWorth >= 0 ? '🎉 Positive net worth!' : '💪 Room to grow!'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Assets */}
            <div>
              <div className="flex items-center mb-6">
                <TrendingUp className="w-6 h-6 text-green-500 mr-3" />
                <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Assets (What You Own)
                </h3>
              </div>
              
              <div className="space-y-4">
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
                      <p className={`text-xs mt-1 ml-4 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                        💡 From your savings goals - update as needed
                      </p>
                    )}
                  </div>
                ))}
                
                <button
                  onClick={addAsset}
                  className={`w-full p-4 border-2 border-dashed rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                    isDarkMode 
                      ? 'border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300' 
                      : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700'
                  }`}
                >
                  <Plus className="w-5 h-5" />
                  <span>Add asset</span>
                </button>
              </div>
            </div>

            {/* Liabilities */}
            <div>
              <div className="flex items-center mb-6">
                <TrendingDown className="w-6 h-6 text-red-500 mr-3" />
                <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Liabilities (What You Owe)
                </h3>
              </div>
              
              <div className="space-y-4">
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
                
                <button
                  onClick={addLiability}
                  className={`w-full p-4 border-2 border-dashed rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                    isDarkMode 
                      ? 'border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300' 
                      : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700'
                  }`}
                >
                  <Plus className="w-5 h-5" />
                  <span>Add liability</span>
                </button>
              </div>
            </div>
          </div>

          {/* Privacy & Next Steps */}
          <div className={`mt-8 p-6 rounded-lg border ${
            isDarkMode 
              ? 'bg-blue-900/20 border-blue-800' 
              : 'bg-blue-50 border-blue-200'
          }`}>
            <h4 className={`font-semibold mb-3 ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}>
              🔒 Your Privacy Matters
            </h4>
            <div className={`text-sm space-y-2 ${isDarkMode ? 'text-blue-200' : 'text-blue-700'}`}>
              <p>• All your financial data stays on your device - we never see it</p>
              <p>• Import bank transactions via CSV for automatic categorization</p>
              <p>• Track progress toward your savings goals over time</p>
              <p>• Get insights into spending patterns and budget optimization</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <button
              onClick={onBack}
              className={`flex items-center px-6 py-3 transition-colors ${
                isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </button>
            <button
              onClick={handleNext}
              className="flex items-center px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all transform hover:scale-105 font-semibold text-lg shadow-lg"
            >
              Complete Setup 🎉 <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetWorthStep;
