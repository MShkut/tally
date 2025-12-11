// frontend/src/components/actions/gifts/GiftAssignment.jsx
import { useState } from 'react';

import { useTheme } from 'contexts/ThemeContext';
import { ThemeToggle } from 'components/shared/ThemeToggle';
import { StandardFormLayout } from 'components/shared/FormComponents';
import { Currency } from 'utils/currency';
import { HOLIDAYS, getHolidayName } from 'constants/holidays';

/**
 * Component for assigning gifts from expenses to people and occasions
 */
export const GiftAssignment = ({ gift, people, onSave, onBack, onSkip }) => {
  const { isDarkMode } = useTheme();

  // Initialize assignments from existing gift data or empty
  const [assignments, setAssignments] = useState(
    gift.assignedTo || []
  );

  // Track which people are selected
  const [selectedPeople, setSelectedPeople] = useState(
    new Set(assignments.map(a => a.personId))
  );

  const handleTogglePerson = (personId) => {
    const newSelected = new Set(selectedPeople);

    if (newSelected.has(personId)) {
      // Remove person and their assignments
      newSelected.delete(personId);
      setAssignments(prev => prev.filter(a => a.personId !== personId));
    } else {
      // Add person
      newSelected.add(personId);
    }

    setSelectedPeople(newSelected);
  };

  const handleToggleOccasion = (personId, occasionId) => {
    const person = people.find(p => p.id === personId);
    if (!person) return;

    // Check if person has this occasion in their applicable holidays
    if (!person.applicableHolidays?.includes(occasionId)) {
      alert(`${person.name} doesn't have ${getHolidayName(occasionId)} in their occasions list. Please add it first.`);
      return;
    }

    setAssignments(prev => {
      const existing = prev.find(a => a.personId === personId && a.occasionId === occasionId);

      if (existing) {
        // Remove this assignment
        return prev.filter(a => !(a.personId === personId && a.occasionId === occasionId));
      } else {
        // Add new assignment with even split
        const peopleCount = selectedPeople.size;
        const evenSplit = gift.cost / peopleCount;

        return [...prev, {
          personId,
          occasionId,
          amount: evenSplit
        }];
      }
    });
  };

  const handleAmountChange = (personId, occasionId, amount) => {
    setAssignments(prev => {
      return prev.map(a => {
        if (a.personId === personId && a.occasionId === occasionId) {
          return { ...a, amount: parseFloat(amount) || 0 };
        }
        return a;
      });
    });
  };

  const handleSave = () => {
    // Validate that total assigned doesn't exceed gift cost
    const totalAssigned = assignments.reduce((sum, a) => sum + (a.amount || 0), 0);

    if (totalAssigned > gift.cost) {
      alert(`Total assigned (${Currency.format(totalAssigned)}) exceeds gift cost (${Currency.format(gift.cost)})`);
      return;
    }

    onSave(gift.id, assignments);
  };

  const handleEvenSplit = () => {
    if (assignments.length === 0) {
      alert('Please select at least one person and occasion first.');
      return;
    }

    const evenAmount = gift.cost / assignments.length;

    setAssignments(prev => prev.map(a => ({
      ...a,
      amount: evenAmount
    })));
  };

  const totalAssigned = assignments.reduce((sum, a) => sum + (a.amount || 0), 0);
  const remaining = gift.cost - totalAssigned;

  return (
    <>
      <ThemeToggle />
      <StandardFormLayout
        title="Assign Gift"
        subtitle={`${gift.description} • ${Currency.format(gift.cost)}`}
        onBack={onBack}
        onNext={handleSave}
        canGoNext={assignments.length > 0}
        nextLabel="Save Assignment"
        backLabel="Back"
      >
        {/* Gift Info */}
        <div className={`mb-8 p-4 border ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className={`font-light mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
            {gift.description}
          </div>
          <div className={`text-sm font-light ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Cost: {Currency.format(gift.cost)}
          </div>
          {gift.purchasedAt && (
            <div className={`text-xs font-light ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Purchased: {new Date(gift.purchasedAt).toLocaleDateString()}
            </div>
          )}
        </div>

        {/* Assignment Summary */}
        <div className={`mb-6 p-4 border ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="flex justify-between items-center mb-2">
            <div className={`text-sm font-light ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Total Assigned
            </div>
            <div className={`font-light ${isDarkMode ? 'text-white' : 'text-black'}`}>
              {Currency.format(totalAssigned)}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className={`text-sm font-light ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Remaining
            </div>
            <div className={`font-light ${
              remaining < 0
                ? (isDarkMode ? 'text-gray-300' : 'text-gray-700')
                : (isDarkMode ? 'text-white' : 'text-black')
            }`}>
              {Currency.format(remaining)}
              {remaining < 0 && ' (Over)'}
            </div>
          </div>

          {assignments.length > 0 && (
            <button
              onClick={handleEvenSplit}
              className={`
                mt-4 w-full text-sm font-light border-b border-transparent
                hover:border-current pb-1 transition-colors
                ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}
              `}
            >
              Split Evenly
            </button>
          )}
        </div>

        {/* People Selection */}
        <div className="space-y-6">
          {people.length === 0 ? (
            <div className={`text-center py-8 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              No people added yet. Please add people first.
            </div>
          ) : (
            people.map(person => {
              const isSelected = selectedPeople.has(person.id);
              const personAssignments = assignments.filter(a => a.personId === person.id);

              return (
                <div
                  key={person.id}
                  className={`
                    border transition-all
                    ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}
                    ${isSelected ? (isDarkMode ? 'border-gray-600' : 'border-gray-400') : ''}
                  `}
                >
                  {/* Person Header */}
                  <div
                    className={`
                      p-4 cursor-pointer transition-colors
                      ${isDarkMode ? 'hover:bg-gray-900' : 'hover:bg-gray-50'}
                    `}
                    onClick={() => handleTogglePerson(person.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleTogglePerson(person.id)}
                          className="w-5 h-5"
                          onClick={(e) => e.stopPropagation()}
                        />
                        {person.picture && (
                          <img
                            src={person.picture}
                            alt={person.name}
                            className="w-10 h-10 object-cover border"
                            style={{
                              borderColor: isDarkMode ? '#374151' : '#e5e7eb'
                            }}
                          />
                        )}
                        <div>
                          <div className={`font-light ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            {person.name}
                          </div>
                          {person.relationship && (
                            <div className={`text-xs font-light ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                              {person.relationship}
                            </div>
                          )}
                        </div>
                      </div>

                      {personAssignments.length > 0 && (
                        <div className={`text-sm font-light ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {Currency.format(personAssignments.reduce((sum, a) => sum + (a.amount || 0), 0))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Occasions (if person is selected) */}
                  {isSelected && (
                    <div className={`
                      px-4 pb-4 border-t
                      ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}
                    `}>
                      <div className={`text-sm font-light mb-3 mt-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Select Occasion(s)
                      </div>

                      {person.applicableHolidays && person.applicableHolidays.length > 0 ? (
                        <div className="space-y-3">
                          {person.applicableHolidays.map(occasionId => {
                            const assignment = personAssignments.find(a => a.occasionId === occasionId);
                            const isOccasionSelected = !!assignment;

                            // Get occasion name - check standard holidays first, then custom
                            const getOccasionName = (id) => {
                              const standardHoliday = HOLIDAYS.find(h => h.id === id);
                              if (standardHoliday) return standardHoliday.name;

                              const customOccasion = person.customOccasions?.find(co => co.id === id);
                              if (customOccasion) return customOccasion.name;

                              return id;
                            };

                            return (
                              <div key={occasionId} className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={isOccasionSelected}
                                  onChange={() => handleToggleOccasion(person.id, occasionId)}
                                  className="w-4 h-4"
                                />
                                <div className="flex-1">
                                  <div className={`text-sm font-light ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                    {getOccasionName(occasionId)}
                                  </div>
                                </div>
                                {isOccasionSelected && (
                                  <div className="flex items-center">
                                    <span className={`text-sm font-light mr-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                      $
                                    </span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={assignment.amount || 0}
                                      onChange={(e) => handleAmountChange(person.id, occasionId, e.target.value)}
                                      className={`
                                        w-24 px-2 py-1 border bg-transparent font-light text-right
                                        ${isDarkMode
                                          ? 'border-gray-700 text-white'
                                          : 'border-gray-300 text-black'
                                        }
                                      `}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className={`text-sm font-light ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          No occasions set for this person. Please edit their profile to add occasions.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Skip button */}
        {onSkip && (
          <div className="mt-8 text-center">
            <button
              onClick={onSkip}
              className={`
                text-sm font-light border-b border-transparent
                hover:border-current pb-1 transition-colors
                ${isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}
              `}
            >
              Skip This Gift
            </button>
          </div>
        )}
      </StandardFormLayout>
    </>
  );
};
