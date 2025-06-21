import React from 'react';

import { useTheme } from 'contexts/ThemeContext';
import { ThemeToggle } from 'components/shared/ThemeToggle';
import { FrequencySelector } from 'components/shared/FrequencySelector';
import { 
  FormGrid, 
  FormField, 
  StandardInput,
  RemoveButton,
  AddItemButton,
  FormSection,
  StandardFormLayout,
  SummaryCard,
  SectionBorder,
  useItemManager,
  validation,
  formatCurrency
} from '../shared/FormComponents';
import { editorial } from 'utils/editorialStyles';
import { 
  convertToYearly,
  calculateTotalYearlyIncome,
  analyzeIncomeDistribution,
  validateAllIncomeSources,
  formatIncomeInsights
} from 'utils/incomeHelpers';

// Income Source component using shared utilities
export const IncomeSource = ({ source, onUpdate, onDelete }) => {
  const yearlyAmount = convertToYearly(source.amount, source.frequency);
  const showYearlyEquivalent = source.amount && source.frequency !== 'Yearly';

  return (
    <FormGrid>
      {/* Frequency selector: 3 columns */}
      <FormField span={3}>
        <FrequencySelector
          frequency={source.frequency}
          onChange={(value) => onUpdate({ ...source, frequency: value })}
          allowOneTime={false} // Income should be recurring
        />
      </FormField>
      
      {/* Income source name: 6 columns */}
      <FormField span={6}>
        <StandardInput
          label="Income Source"
          value={source.name}
          onChange={(value) => onUpdate({ ...source, name: value })}
          placeholder="Salary, consulting, freelance, investments"
          required
        />
      </FormField>
      
      {/* Amount: 2 columns */}
      <FormField span={2}>
        <StandardInput
          label="Amount"
          type="currency"
          value={source.amount}
          onChange={(value) => onUpdate({ ...source, amount: value })}
          prefix="$"
          required
        />
      </FormField>
      
      {/* Remove button: 1 column */}
      <RemoveButton 
        onClick={onDelete}
        children="Remove"
      />
      
      {/* Yearly equivalent display - spans full width if shown */}
      {showYearlyEquivalent && (
        <FormField span={12}>
          <div className={`${editorial.typography.caption} italic -mt-4`}>
            ≈ {formatCurrency(yearlyAmount)} per year
          </div>
        </FormField>
      )}
    </FormGrid>
  );
};

export const IncomeStep = ({ onNext, onBack }) => {
  // Use professional item manager for income sources
  const { 
    items: incomeSources, 
    addItem, 
    updateItem, 
    deleteItem,
    hasItems 
  } = useItemManager();

  const addIncomeSource = () => {
    addItem({
      name: '', 
      amount: '', 
      frequency: 'Monthly' // Default to most common - matches FrequencySelector
    });
  };

  // Enhanced financial calculations
  const convertToYearly = (amount, frequency) => {
    const num = parseFloat(amount) || 0;
    const multipliers = {
      'Weekly': 52,
      'Bi-weekly': 26,
      'Monthly': 12,
      'Yearly': 1
    };
    return num * (multipliers[frequency] || 1);
  };

  const totalYearlyIncome = incomeSources.reduce((total, source) => {
    return total + convertToYearly(source.amount, source.frequency);
  }, 0);

  const monthlyIncome = totalYearlyIncome / 12;

  // Enhanced validation with better error messages
  const validateSources = () => {
    const errors = [];
    
    incomeSources.forEach((source, index) => {
      if (!validation.hasValidString(source.name)) {
        errors.push(`Income source ${index + 1}: Name is required`);
      }
      if (!validation.isPositiveNumber(source.amount)) {
        errors.push(`Income source ${index + 1}: Amount must be greater than 0`);
      }
    });
    
    return errors;
  };

  const validationErrors = validateSources();
  const canContinue = totalYearlyIncome > 0 && validationErrors.length === 0;

  // Income distribution analysis for insights
  const getIncomeInsights = () => {
    if (!hasItems) return null;
    
    const totalSources = incomeSources.length;
    const primarySource = incomeSources.reduce((max, source) => {
      const sourceYearly = convertToYearly(source.amount, source.frequency);
      const maxYearly = convertToYearly(max.amount, max.frequency);
      return sourceYearly > maxYearly ? source : max;
    }, incomeSources[0]);
    
    const primaryPercentage = totalYearlyIncome > 0 
      ? Math.round((convertToYearly(primarySource.amount, primarySource.frequency) / totalYearlyIncome) * 100)
      : 0;
    
    return {
      totalSources,
      primarySource: primarySource.name,
      primaryPercentage,
      isDiversified: totalSources > 1 && primaryPercentage < 80
    };
  };

  const insights = getIncomeInsights();

  const handleNext = () => {
    if (onNext && canContinue) {
      onNext({ 
        incomeSources, 
        totalYearlyIncome, 
        monthlyIncome,
        insights 
      });
    }
  };

  return (
    <>
      <ThemeToggle />
      <StandardFormLayout
        title="Your Income Sources"
        subtitle="Start by entering all sources of regular income. This forms the foundation of your financial plan."
        onBack={onBack}
        onNext={handleNext}
        canGoNext={canContinue}
        nextLabel="Continue to Savings"
        showBack={true}
      >
        
        {/* Income Sources Section */}
        <FormSection>
          {hasItems ? (
            <div className="space-y-0 mb-8">
              {incomeSources.map((source) => (
                <IncomeSource
                  key={source.id}
                  source={source}
                  onUpdate={(updatedSource) => updateItem(source.id, updatedSource)}
                  onDelete={() => deleteItem(source.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">💰</div>
              <div className="text-lg font-light mb-2">No income sources yet</div>
              <div className="text-base">Add your first income source to get started</div>
            </div>
          )}

          <AddItemButton 
            onClick={addIncomeSource}
            children={!hasItems ? 'Add your first income source' : 'Add another income source'}
          />
        </FormSection>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <FormSection>
            <div className="border-l-4 border-red-500 pl-6 py-4 bg-red-50 dark:bg-red-900/10">
              <h3 className="text-lg font-medium text-red-700 dark:text-red-400 mb-2">
                Please fix these issues:
              </h3>
              <ul className="space-y-1 text-sm text-red-600 dark:text-red-300">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          </FormSection>
        )}

        {/* Summary Section */}
        {totalYearlyIncome > 0 && (
          <>
            <SectionBorder />
            <FormSection>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <SummaryCard
                  title="Total Yearly Income"
                  value={totalYearlyIncome}
                  accent={true}
                />
                <SummaryCard
                  title="Monthly Income"
                  value={monthlyIncome}
                  subtitle="Available for budgeting"
                />
                <SummaryCard
                  title="Income Sources"
                  value={`${incomeSources.length} source${incomeSources.length === 1 ? '' : 's'}`}
                  subtitle={insights?.isDiversified ? 'Well diversified' : 'Consider diversifying'}
                />
              </div>
            </FormSection>

            {/* Income Insights */}
            {insights && (
              <FormSection>
                <div className="border-l-4 border-gray-300 pl-6 py-4 bg-gray-50 dark:bg-gray-900/20">
                  <h3 className="text-lg font-light mb-3 text-black dark:text-white">
                    Income Analysis
                  </h3>
                  <div className="space-y-2 text-base font-light text-gray-600 dark:text-gray-400">
                    <p>
                      Primary income source: <strong>{insights.primarySource}</strong> ({insights.primaryPercentage}% of total)
                    </p>
                    {insights.isDiversified ? (
                      <p className="text-green-600 dark:text-green-400">
                        ✓ Good income diversification reduces financial risk
                      </p>
                    ) : insights.totalSources === 1 ? (
                      <p className="text-yellow-600 dark:text-yellow-400">
                        ⚠ Consider developing additional income sources for stability
                      </p>
                    ) : (
                      <p className="text-yellow-600 dark:text-yellow-400">
                        ⚠ Heavy reliance on one source - consider balancing income streams
                      </p>
                    )}
                  </div>
                </div>
              </FormSection>
            )}
          </>
        )}

        {/* Getting Started Guide */}
        {!hasItems && (
          <div className="border-l-4 border-gray-300 pl-6 py-6 bg-gray-50 dark:bg-gray-900/20">
            <h3 className="text-xl font-light mb-4 text-black dark:text-white">
              Include All Income Sources
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-base font-light text-gray-600 dark:text-gray-400">
              <div>
                <h4 className="font-medium mb-2 text-black dark:text-white">Employment Income</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Salary or wages</li>
                  <li>• Commission payments</li>
                  <li>• Tips and bonuses</li>
                  <li>• Overtime pay</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-black dark:text-white">Other Income</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Freelance or consulting</li>
                  <li>• Investment returns</li>
                  <li>• Rental income</li>
                  <li>• Side business profits</li>
                </ul>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-500">
              Include only regular, recurring income. One-time payments like gifts or windfalls can be handled later.
            </p>
          </div>
        )}

      </StandardFormLayout>
    </>
  );
}
