// frontend/src/components/gifts/AddPersonManually.jsx
import { useState } from 'react';

import { useTheme } from 'contexts/ThemeContext';
import { ThemeToggle } from 'components/shared/ThemeToggle';
import {
  FormGrid,
  FormField,
  StandardInput,
  FormSection,
  StandardFormLayout
} from 'components/shared/FormComponents';
import { Currency } from 'utils/currency';
import { HOLIDAYS } from 'constants/holidays';

export const AddPersonManually = ({ onAdd, onBack }) => {
  const { isDarkMode } = useTheme();
  const [person, setPerson] = useState({
    name: '',
    relationship: '',
    applicableHolidays: [],
    budgets: {},
    customOccasions: []
  });
  const [showOccasionSelector, setShowOccasionSelector] = useState(false);
  const [customOccasionName, setCustomOccasionName] = useState('');

  const handleFieldChange = (field, value) => {
    setPerson(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addOccasion = (occasionId) => {
    setPerson(prev => {
      if (prev.applicableHolidays.includes(occasionId)) return prev;

      return {
        ...prev,
        applicableHolidays: [...prev.applicableHolidays, occasionId]
      };
    });
    setShowOccasionSelector(false);
  };

  const addCustomOccasion = () => {
    if (!customOccasionName.trim()) return;

    const customId = `custom-${Date.now()}`;

    setPerson(prev => ({
      ...prev,
      customOccasions: [...(prev.customOccasions || []), { id: customId, name: customOccasionName.trim() }],
      applicableHolidays: [...prev.applicableHolidays, customId]
    }));

    setCustomOccasionName('');
    setShowOccasionSelector(false);
  };

  const removeOccasion = (occasionId) => {
    setPerson(prev => {
      const newHolidays = prev.applicableHolidays.filter(h => h !== occasionId);
      const newBudgets = { ...prev.budgets };
      delete newBudgets[occasionId];

      // Also remove from custom occasions if it's custom
      const newCustomOccasions = prev.customOccasions?.filter(co => co.id !== occasionId) || [];

      return {
        ...prev,
        applicableHolidays: newHolidays,
        budgets: newBudgets,
        customOccasions: newCustomOccasions
      };
    });
  };

  const handleBudgetChange = (holidayId, amount) => {
    setPerson(prev => ({
      ...prev,
      budgets: {
        ...prev.budgets,
        [holidayId]: amount
      }
    }));
  };

  // Helper to get occasion name (from HOLIDAYS or custom occasions)
  const getOccasionName = (occasionId) => {
    const standardHoliday = HOLIDAYS.find(h => h.id === occasionId);
    if (standardHoliday) return standardHoliday.name;

    const customOccasion = person.customOccasions?.find(co => co.id === occasionId);
    if (customOccasion) return customOccasion.name;

    return occasionId;
  };

  // Get available holidays to add (not already selected)
  const getAvailableHolidays = () => {
    return HOLIDAYS.filter(h => {
      if (h.id === 'other') return false;
      return !person.applicableHolidays.includes(h.id);
    });
  };

  const handleAdd = () => {
    if (!person.name.trim()) return;

    const newPerson = {
      ...person,
      id: `person-${Date.now()}-${Math.random()}`,
      createdAt: new Date().toISOString()
    };

    onAdd(newPerson);
  };

  const canAdd = person.name.trim().length > 0;

  const getTotalBudget = () => {
    return Object.values(person.budgets).reduce(
      (sum, amount) => sum + (parseFloat(amount) || 0), 0
    );
  };

  return (
    <>
      <ThemeToggle />
      <StandardFormLayout
        title="Add a Contact"
        subtitle="Add a new person to your gift list with optional budget and occasion information"
        onBack={onBack}
        onNext={handleAdd}
        canGoNext={canAdd}
        nextLabel="Add Contact"
        backLabel="Cancel"
      >

        {/* Personal Information */}
        <FormSection title="Personal Information">
          <FormGrid>
            <FormField span={6}>
              <StandardInput
                label="Name"
                value={person.name}
                onChange={(value) => handleFieldChange('name', value)}
                placeholder="John Doe"
                required
              />
            </FormField>
            <FormField span={6}>
              <StandardInput
                label="Relationship"
                value={person.relationship}
                onChange={(value) => handleFieldChange('relationship', value)}
                placeholder="Friend, sister, coworker, etc."
              />
            </FormField>
          </FormGrid>
        </FormSection>

        {/* Gift Occasions & Budgets (Optional) */}
        <FormSection title="Gift Occasions & Budgets (Optional)">
          {/* Selected Occasions List */}
          {person.applicableHolidays.length > 0 ? (
            <div className="space-y-6 mb-8">
              {person.applicableHolidays.map(occasionId => {
                const budget = person.budgets[occasionId] || 0;

                return (
                  <div
                    key={occasionId}
                    className={`p-6 border ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className={`text-lg font-light ${isDarkMode ? 'text-white' : 'text-black'}`}>
                          {getOccasionName(occasionId)}
                        </div>
                      </div>
                      <button
                        onClick={() => removeOccasion(occasionId)}
                        className={`text-sm font-light transition-colors ${
                          isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        Remove
                      </button>
                    </div>
                    <StandardInput
                      label="Budget"
                      type="currency"
                      value={person.budgets[occasionId] || ''}
                      onChange={(value) => handleBudgetChange(occasionId, value)}
                      prefix="$"
                      placeholder="0.00"
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={`text-center py-8 mb-8 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              No occasions added yet. Click "Add Occasion" below to set up gift budgets (optional).
            </div>
          )}

          {/* Add Occasion Button */}
          <div className="relative">
            <button
              onClick={() => setShowOccasionSelector(!showOccasionSelector)}
              className={`
                w-full py-4 border-2 border-dashed transition-colors text-center font-light
                ${isDarkMode
                  ? 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300'
                  : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700'
                }
              `}
            >
              + Add Occasion
            </button>

            {/* Occasion Selector Dropdown */}
            {showOccasionSelector && (
              <div className={`
                absolute top-full left-0 right-0 mt-2 p-4 border z-50
                ${isDarkMode
                  ? 'bg-black border-gray-800 shadow-2xl'
                  : 'bg-white border-gray-200 shadow-xl'
                }
              `}>
                <div className={`text-sm font-light mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Select an occasion:
                </div>

                {/* Standard Holidays */}
                {getAvailableHolidays().length > 0 ? (
                  <div className="space-y-2 mb-4">
                    {getAvailableHolidays().map(holiday => (
                      <button
                        key={holiday.id}
                        onClick={() => addOccasion(holiday.id)}
                        className={`
                          w-full text-left px-4 py-3 border transition-colors
                          ${isDarkMode
                            ? 'border-gray-800 text-white hover:border-gray-600'
                            : 'border-gray-200 text-black hover:border-gray-400'
                          }
                        `}
                      >
                        <div className="font-light">{holiday.name}</div>
                        {holiday.description && (
                          <div className={`text-xs font-light mt-1 ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-400'
                          }`}>
                            {holiday.description}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className={`text-sm font-light mb-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    All standard occasions have been added.
                  </div>
                )}

                {/* Custom Occasion Input */}
                <div className={`pt-4 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                  <div className={`text-sm font-light mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Or add a custom occasion:
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customOccasionName}
                      onChange={(e) => setCustomOccasionName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addCustomOccasion()}
                      placeholder="e.g., Graduation, Housewarming"
                      className={`
                        flex-1 px-4 py-2 border bg-transparent font-light
                        ${isDarkMode
                          ? 'border-gray-700 text-white placeholder-gray-500'
                          : 'border-gray-300 text-black placeholder-gray-400'
                        }
                      `}
                    />
                    <button
                      onClick={addCustomOccasion}
                      disabled={!customOccasionName.trim()}
                      className={`
                        px-6 py-2 font-light transition-colors
                        ${customOccasionName.trim()
                          ? isDarkMode
                            ? 'border border-white text-white hover:bg-white hover:text-black'
                            : 'border border-black text-black hover:bg-black hover:text-white'
                          : 'border border-gray-700 text-gray-500 cursor-not-allowed'
                        }
                      `}
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Total Budget Summary */}
          {person.applicableHolidays.length > 0 && (
            <div className={`
              mt-8 pt-8 border-t text-center
              ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}
            `}>
              <div className={`text-sm font-light mb-2 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>
                Total Annual Gift Budget
              </div>
              <div className={`text-3xl font-light ${
                isDarkMode ? 'text-white' : 'text-black'
              }`}>
                {Currency.format(getTotalBudget())}
              </div>
            </div>
          )}
        </FormSection>

      </StandardFormLayout>
    </>
  );
};
