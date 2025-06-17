import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeToggle from '../shared/ThemeToggle';
import ProgressBar from '../shared/ProgressBar';
import { IconButton, ICON_CATEGORIES } from '../shared/IconSystem';
import { 
  Page, 
  Card, 
  Heading, 
  Description, 
  PrimaryButton, 
  SecondaryButton,
  SummaryCard,
  SummaryGrid,
  SummarySection,
  AddButton,
  Alert,
  Input
} from '../styled/StyledComponents';

// Net Worth Item Component
const NetWorthItem = ({ item, onUpdate, onDelete, isDarkMode, type }) => {
  const handleNameChange = (e) => {
    onUpdate({ ...item, name: e.target.value });
  };

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    onUpdate({ ...item, amount: value });
  };

  const handleIconChange = (iconName) => {
    onUpdate({ ...item, icon: iconName });
  };

  const iconCategory = type === 'asset' ? ICON_CATEGORIES.ASSETS : ICON_CATEGORIES.LIABILITIES;
  const placeholder = type === 'asset' 
    ? 'Asset name (e.g., Savings Account, 401k)' 
    : 'Debt name (e.g., Credit Card, Student Loan)';
  const amountPlaceholder = type === 'asset' ? 'Value' : 'Balance';

  return (
    <div className={`p-4 rounded-lg border transition-colors ${
      isDarkMode 
        ? 'bg-gray-700 border-gray-600' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center space-x-4">
        <IconButton
          iconName={item.icon || (type === 'asset' ? 'PiggyBank' : 'CreditCard')}
          category={iconCategory}
          onIconChange={handleIconChange}
        />
        
        <div className="flex-1">
          <Input
            type="text"
            placeholder={placeholder}
            value={item.name}
            onChange={handleNameChange}
          />
        </div>
        
        <div className="w-32">
          <Input
            type="text"
            placeholder={amountPlaceholder}
            value={item.amount}
            onChange={handleAmountChange}
            icon={DollarSign}
          />
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
  const { isDarkMode, currentTheme } = useTheme();
  
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
    <Page>
      <ThemeToggle />
      <div className="max-w-5xl mx-auto p-6">
        <ProgressBar currentStep={5} />
        
        <div className="text-center mb-8">
          <Heading level={1}>What's Your Current Net Worth?</Heading>
          <Description>
            Add your assets and debts to see where you stand financially
          </Description>
        </div>

        <Card>
          {/* Net Worth Summary */}
          <SummarySection 
            title="Your Net Worth"
            className={`p-6 rounded-lg border transition-colors mb-8 ${
              netWorth >= 0
                ? isDarkMode 
                  ? 'bg-green-900/20 border-green-800' 
                  : 'bg-green-50 border-green-200'
                : isDarkMode 
                  ? 'bg-red-900/20 border-red-800' 
                  : 'bg-red-50 border-red-200'
            }`}
          >
            <SummaryGrid cols={3}>
              <SummaryCard
                title="Assets"
                value={totalAssets}
                icon={TrendingUp}
                accent={true}
              />
              <SummaryCard
                title="Liabilities"
                value={totalLiabilities}
                icon={TrendingDown}
                className="text-red-500"
              />
              <SummaryCard
                title="Net Worth"
                value={netWorth}
                className={`text-4xl ${
                  netWorth >= 0 
                    ? isDarkMode ? 'text-green-400' : 'text-green-600'
                    : 'text-red-500'
                }`}
                subtitle={netWorth >= 0 ? '🎉 Positive net worth!' : '💪 Room to grow!'}
              />
            </SummaryGrid>
          </SummarySection>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Assets */}
            <div>
              <div className="flex items-center mb-6">
                <TrendingUp className={`w-6 h-6 text-${currentTheme.primary}-500 mr-3`} />
                <Heading level={3}>Assets (What You Own)</Heading>
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
                
                <AddButton onClick={addAsset}>
                  <Plus className="w-5 h-5" />
                  <span>Add asset</span>
                </AddButton>
              </div>
            </div>

            {/* Liabilities */}
            <div>
              <div className="flex items-center mb-6">
                <TrendingDown className="w-6 h-6 text-red-500 mr-3" />
                <Heading level={3}>Liabilities (What You Owe)</Heading>
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
                
                <AddButton onClick={addLiability}>
                  <Plus className="w-5 h-5" />
                  <span>Add liability</span>
                </AddButton>
              </div>
            </div>
          </div>

          {/* Privacy & Next Steps */}
          <Alert type="info" className="mt-8">
            <h4 className="font-semibold mb-3">🔒 Your Privacy Matters</h4>
            <div className="text-sm space-y-2">
              <p>• All your financial data stays on your device - we never see it</p>
              <p>• Import bank transactions via CSV for automatic categorization</p>
              <p>• Track progress toward your savings goals over time</p>
              <p>• Get insights into spending patterns and budget optimization</p>
            </div>
          </Alert>

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <SecondaryButton onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </SecondaryButton>
            <PrimaryButton 
              onClick={handleNext}
              className="px-8 py-4 text-lg font-semibold shadow-lg bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 transform hover:scale-105"
            >
              Complete Setup 🎉 <ArrowRight className="w-5 h-5 ml-2" />
            </PrimaryButton>
          </div>
        </Card>
      </div>
    </Page>
  );
};

export default NetWorthStep;
