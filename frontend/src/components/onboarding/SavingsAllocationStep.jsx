import React, { useState } from 'react';
import { 
  Shield, 
  Wallet, 
  ArrowLeft, 
  ArrowRight, 
  Target,
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
  Input,
  Checkbox
} from '../styled/StyledComponents';

// Goal Component using universal icon system
const SavingsGoal = ({ goal, onUpdate, onDelete, isDarkMode }) => {
  const handleNameChange = (e) => {
    onUpdate({ ...goal, name: e.target.value });
  };

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    onUpdate({ ...goal, amount: value });
  };

  const handleIconChange = (iconName) => {
    onUpdate({ ...goal, icon: iconName });
  };

  return (
    <div className={`p-4 rounded-lg border transition-colors ${
      isDarkMode 
        ? 'bg-gray-700 border-gray-600' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center space-x-4">
        <IconButton
          iconName={goal.icon || 'Target'}
          category={ICON_CATEGORIES.SAVINGS_GOALS}
          onIconChange={handleIconChange}
        />
        
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Goal name (e.g., Vacation, House Down Payment)"
            value={goal.name}
            onChange={handleNameChange}
          />
        </div>
        
        <div className="w-32">
          <Input
            type="text"
            placeholder="Monthly"
            value={goal.amount}
            onChange={handleAmountChange}
            icon={null}
            className="pl-8"
          />
          <span className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-sm ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>$</span>
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

const SavingsAllocationStep = ({ onNext, onBack, incomeData, savingsData }) => {
  const { isDarkMode, currentTheme } = useTheme();
  const [emergencyFund, setEmergencyFund] = useState({
    hasExisting: false,
    monthlyAmount: ''
  });
  const [savingsGoals, setSavingsGoals] = useState([]);

  // Calculate derived values from previous steps
  const totalIncome = incomeData?.totalYearlyIncome || 90000;
  const monthlySavings = savingsData?.monthlySavings || (totalIncome * 0.4) / 12;
  const estimatedMonthlyExpenses = (totalIncome * 0.5) / 12; // 50% of income for expenses
  const emergencyFundMin = estimatedMonthlyExpenses * 3; // 3 months of expenses
  const emergencyFundMax = estimatedMonthlyExpenses * 6; // 6 months of expenses

  const addSavingsGoal = () => {
    setSavingsGoals([...savingsGoals, { 
      id: Date.now(),
      name: '', 
      amount: '', 
      icon: 'Target'
    }]);
  };

  const updateSavingsGoal = (id, updatedGoal) => {
    setSavingsGoals(savingsGoals.map(goal => 
      goal.id === id ? updatedGoal : goal
    ));
  };

  const deleteSavingsGoal = (id) => {
    setSavingsGoals(savingsGoals.filter(goal => goal.id !== id));
  };

  // Calculate totals
  const totalAllocatedSavings = () => {
    const emergency = emergencyFund.hasExisting ? 0 : (parseFloat(emergencyFund.monthlyAmount) || 0);
    const goals = savingsGoals.reduce((sum, goal) => 
      sum + (parseFloat(goal.amount) || 0), 0
    );
    return emergency + goals;
  };

  const remainingAmount = monthlySavings - totalAllocatedSavings();
  const allocationPercentage = (totalAllocatedSavings() / monthlySavings) * 100;

  const handleNext = () => {
    if (onNext) {
      onNext({
        emergencyFund,
        savingsGoals,
        totalAllocated: totalAllocatedSavings(),
        remainingAmount
      });
    }
  };

  return (
    <Page>
      <ThemeToggle />
      <div className="max-w-4xl mx-auto p-6">
        <ProgressBar currentStep={3} />
        
        <div className="text-center mb-8">
          <Heading level={1}>Where are your savings going?</Heading>
          <Description>
            You have ${monthlySavings.toLocaleString()}/month to allocate toward your goals
          </Description>
        </div>

        <Card>
          {/* Summary Section */}
          <SummarySection 
            title="Savings Allocation" 
            icon={Wallet}
            className="mb-8"
          >
            <SummaryGrid cols={3}>
              <SummaryCard
                title="Available Monthly"
                value={monthlySavings}
                accent={true}
              />
              <SummaryCard
                title={remainingAmount >= 0 ? 'Unallocated' : 'Over Budget'}
                value={Math.abs(remainingAmount)}
                className={remainingAmount < 0 ? 'text-red-500' : ''}
              />
              <SummaryCard
                title="Allocated"
                value={`${allocationPercentage.toFixed(0)}%`}
                className={allocationPercentage > 100 ? 'text-red-500' : ''}
              />
            </SummaryGrid>
            
            <div className="mt-4">
              <div className={`w-full bg-gray-200 rounded-full h-2 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                <div 
                  className={`h-2 rounded-full transition-all ${
                    allocationPercentage <= 100 ? `bg-${currentTheme.primary}-500` : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(allocationPercentage, 100)}%` }}
                />
              </div>
            </div>

            {remainingAmount < 0 && (
              <Alert type="error" className="mt-3">
                ⚠️ Your allocations exceed available savings by ${Math.abs(remainingAmount).toLocaleString()}
              </Alert>
            )}
          </SummarySection>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Emergency Fund */}
            <div className="lg:col-span-1">
              <div className={`p-6 rounded-lg border-l-4 transition-colors ${
                emergencyFund.hasExisting 
                  ? isDarkMode
                    ? 'border-green-500 bg-green-900/20'
                    : 'border-green-500 bg-green-50'
                  : isDarkMode 
                    ? 'border-red-500 bg-gray-700' 
                    : 'border-red-500 bg-red-50'
              }`}>
                <div className="flex items-center mb-4">
                  <Shield className={`w-6 h-6 mr-3 ${
                    emergencyFund.hasExisting ? 'text-green-500' : 'text-red-500'
                  }`} />
                  <Heading level={3} size="text-lg">Emergency Fund</Heading>
                  {!emergencyFund.hasExisting && (
                    <span className="ml-2 px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                      PRIORITY
                    </span>
                  )}
                </div>
                
                {!emergencyFund.hasExisting && (
                  <Description className="mb-4">
                    3-6 months of expenses. Your financial safety net.
                  </Description>
                )}
                
                <div className={emergencyFund.hasExisting ? '' : 'mb-4'}>
                  <Checkbox
                    checked={emergencyFund.hasExisting}
                    onChange={(e) => setEmergencyFund(prev => ({ 
                      ...prev, 
                      hasExisting: e.target.checked,
                      monthlyAmount: e.target.checked ? '0' : prev.monthlyAmount
                    }))}
                    label="I already have an adequate emergency fund"
                  />
                </div>

                {!emergencyFund.hasExisting && (
                  <>
                    <Input
                      type="text"
                      placeholder="Monthly amount"
                      value={emergencyFund.monthlyAmount}
                      onChange={(e) => setEmergencyFund(prev => ({ 
                        ...prev, 
                        monthlyAmount: e.target.value.replace(/[^0-9.]/g, '') 
                      }))}
                      icon={null}
                      className="pl-8"
                    />
                    <span className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>$</span>
                    <Description className="mt-2">
                      Suggested: ${Math.round(emergencyFundMin).toLocaleString()} - ${Math.round(emergencyFundMax).toLocaleString()}
                    </Description>
                  </>
                )}
              </div>
            </div>

            {/* Savings Goals */}
            <div className="lg:col-span-2">
              <div className="flex items-center mb-4">
                <Target className={`w-6 h-6 text-${currentTheme.primary}-500 mr-3`} />
                <Heading level={3}>Savings Goals</Heading>
              </div>

              <div className="space-y-4">
                {savingsGoals.map((goal) => (
                  <SavingsGoal
                    key={goal.id}
                    goal={goal}
                    onUpdate={(updatedGoal) => updateSavingsGoal(goal.id, updatedGoal)}
                    onDelete={() => deleteSavingsGoal(goal.id)}
                    isDarkMode={isDarkMode}
                  />
                ))}
                
                <AddButton onClick={addSavingsGoal}>
                  <Plus className="w-5 h-5" />
                  <span>Add savings goal</span>
                </AddButton>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <SecondaryButton onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </SecondaryButton>
            <PrimaryButton
              onClick={handleNext}
              disabled={totalAllocatedSavings() === 0}
            >
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </PrimaryButton>
          </div>
        </Card>
      </div>
    </Page>
  );
};

export default SavingsAllocationStep;
