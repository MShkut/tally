// frontend/src/components/gifts/PersonEdit.jsx
import React, { useState } from 'react';

import { useTheme } from 'contexts/ThemeContext';
import { ThemeToggle } from 'components/shared/ThemeToggle';
import { DatePicker } from 'components/shared/DatePicker';
import {
  FormGrid,
  FormField,
  StandardInput,
  FormSection,
  StandardFormLayout,
  useItemManager
} from 'components/shared/FormComponents';
import { apiService } from 'utils/apiService';
import { Currency } from 'utils/currency';
import { HOLIDAYS } from 'constants/holidays';

export const PersonEdit = ({ person, people, onSave, onBack, assignedGifts = [] }) => {
  const { isDarkMode } = useTheme();
  const [editedPerson, setEditedPerson] = useState({
    ...person,
    applicableHolidays: person.applicableHolidays || [],
    budgets: person.budgets || {},
    picture: person.picture || null,
    customOccasions: person.customOccasions || [] // Array of {id, name} for custom occasions
  });
  const [showOccasionSelector, setShowOccasionSelector] = useState(false);
  const [customOccasionName, setCustomOccasionName] = useState('');

  const handleFieldChange = (field, value) => {
    setEditedPerson(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addOccasion = (occasionId) => {
    setEditedPerson(prev => {
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

    setEditedPerson(prev => ({
      ...prev,
      customOccasions: [...(prev.customOccasions || []), { id: customId, name: customOccasionName.trim() }],
      applicableHolidays: [...prev.applicableHolidays, customId]
    }));

    setCustomOccasionName('');
    setShowOccasionSelector(false);
  };

  const removeOccasion = (occasionId) => {
    setEditedPerson(prev => {
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
    setEditedPerson(prev => ({
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

    const customOccasion = editedPerson.customOccasions?.find(co => co.id === occasionId);
    if (customOccasion) return customOccasion.name;

    return occasionId;
  };

  // Get available holidays to add (not already selected)
  const getAvailableHolidays = () => {
    return HOLIDAYS.filter(h => {
      if (h.id === 'other') return false;
      if (h.id === 'birthday' && !editedPerson.birthday) return false;
      return !editedPerson.applicableHolidays.includes(h.id);
    });
  };

  const handleSave = async () => {
    try {
      // Validation
      if (!editedPerson.name || editedPerson.name.trim() === '') {
        alert('Please enter a name');
        return;
      }

      if (editedPerson.applicableHolidays.length === 0) {
        const confirm = window.confirm('No occasions selected. Continue anyway?');
        if (!confirm) return;
      }

      // Validate that occasions with budgets are checked
      const budgetedOccasions = Object.keys(editedPerson.budgets || {});
      const uncheckedBudgets = budgetedOccasions.filter(
        occ => !editedPerson.applicableHolidays.includes(occ)
      );

      if (uncheckedBudgets.length > 0) {
        alert('Please check the occasions that have budgets assigned, or remove the budget amounts.');
        return;
      }

      // Update person in the people array
      const updatedPeople = people.map(p =>
        p.id === person.id ? editedPerson : p
      );

      // Save to API
      await apiService.saveGiftData({
        people: updatedPeople,
        gifts: [], // Will be populated from gift assignments
        lastUpdated: new Date().toISOString()
      });

      onSave(editedPerson);
    } catch (error) {
      console.error('[PersonEdit] Error saving person:', error);
      alert('Failed to save changes. Please try again.');
    }
  };

  const getTotalBudget = () => {
    return Object.values(editedPerson.budgets).reduce(
      (sum, amount) => sum + (parseFloat(amount) || 0), 0
    );
  };

  return (
    <>
      <ThemeToggle />
      <StandardFormLayout
        title={`Edit: ${person.name}`}
        subtitle="Update personal information and set gift budgets for each occasion"
        onBack={onBack}
        onNext={handleSave}
        canGoNext={true}
        nextLabel="Save Changes"
        backLabel="Cancel"
      >
        
        {/* Personal Information */}
        <FormSection title="Personal Information">
          <FormGrid>
            <FormField span={6}>
              <StandardInput
                label="Name"
                value={editedPerson.name}
                onChange={(value) => handleFieldChange('name', value)}
                required
              />
            </FormField>
            <FormField span={6}>
              <StandardInput
                label="Relationship"
                value={editedPerson.relationship || ''}
                onChange={(value) => handleFieldChange('relationship', value)}
                placeholder="Friend, sister, coworker, etc."
              />
            </FormField>
          </FormGrid>
          
          <FormGrid>
            <FormField span={4}>
              <label className={`block text-sm font-light mb-2 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Birthday
              </label>
              <DatePicker
                value={editedPerson.birthday || ''}
                onChange={(value) => handleFieldChange('birthday', value)}
                placeholder="Select birthday"
                useBudgetConstraints={false}
                align="right"
              />
            </FormField>
            <FormField span={8}>
              <StandardInput
                label="Notes"
                value={editedPerson.notes || ''}
                onChange={(value) => handleFieldChange('notes', value)}
                placeholder="Gift preferences, sizes, interests, etc."
              />
            </FormField>
          </FormGrid>
        </FormSection>

        {/* Holiday Selection and Budgets */}
        <FormSection title="Gift Occasions & Budgets">
          {/* Selected Occasions List */}
          {editedPerson.applicableHolidays.length > 0 ? (
            <div className="space-y-6 mb-8">
              {editedPerson.applicableHolidays.map(occasionId => {
                // Calculate spent for this occasion
                const occasionGifts = assignedGifts.filter(gift =>
                  gift.assignedTo?.some(a => a.occasionId === occasionId && a.personId === person.id)
                );
                const spent = occasionGifts.reduce((sum, gift) => {
                  const assignment = gift.assignedTo.find(a => a.occasionId === occasionId && a.personId === person.id);
                  return sum + (assignment?.amount || 0);
                }, 0);
                const budget = editedPerson.budgets[occasionId] || 0;
                const remaining = budget - spent;

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
                        {spent > 0 && (
                          <div className={`text-sm font-light mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Spent: {Currency.format(spent)} • Remaining: {Currency.format(Math.max(0, remaining))}
                            {remaining < 0 && (
                              <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                                {' '}(Over by {Currency.format(Math.abs(remaining))})
                              </span>
                            )}
                          </div>
                        )}
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
                      value={editedPerson.budgets[occasionId] || ''}
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
              No occasions added yet. Click "Add Occasion" below to get started.
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

          {/* Assigned Gifts */}
          {assignedGifts.length > 0 && (
            <div className={`mt-8 pt-8 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
              <div className={`text-lg font-light mb-4 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                Assigned Gifts
              </div>
              <div className="space-y-3">
                {assignedGifts.map(gift => {
                  const personAssignments = gift.assignedTo?.filter(a => a.personId === person.id) || [];
                  if (personAssignments.length === 0) return null;

                  return (
                    <div key={gift.id} className={`
                      p-4 border
                      ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}
                    `}>
                      <div className={`font-light ${isDarkMode ? 'text-white' : 'text-black'}`}>
                        {gift.description}
                      </div>
                      <div className={`text-sm font-light mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {personAssignments.map(a => {
                          const occasion = HOLIDAYS.find(h => h.id === a.occasionId);
                          return (
                            <div key={a.occasionId}>
                              {occasion?.name}: {Currency.format(a.amount)}
                            </div>
                          );
                        })}
                      </div>
                      <div className={`text-xs font-light mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        {new Date(gift.purchasedAt).toLocaleDateString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Total Budget Summary */}
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
        </FormSection>

      </StandardFormLayout>
    </>
  );
};
