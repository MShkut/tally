// frontend/src/components/gifts/PersonCard.jsx
import React from 'react';

import { useTheme } from 'contexts/ThemeContext';
import { Currency } from 'utils/currency';
import { HOLIDAYS } from 'constants/holidays';

export const PersonCard = ({ person, onViewDetails, spent = 0 }) => {
  const { isDarkMode } = useTheme();

  // Calculate total budget for this person
  const totalBudget = Object.values(person.budgets || {}).reduce(
    (sum, amount) => sum + (parseFloat(amount) || 0), 0
  );

  const remaining = totalBudget - spent;
  const isOverBudget = remaining < 0;

  // Get applicable holidays
  const holidays = person.applicableHolidays || [];

  // Get occasion name - check standard holidays first, then custom
  const getOccasionName = (id) => {
    const standardHoliday = HOLIDAYS.find(h => h.id === id);
    if (standardHoliday) return standardHoliday.name;

    const customOccasion = person.customOccasions?.find(co => co.id === id);
    if (customOccasion) return customOccasion.name;

    return id;
  };

  return (
    <div
      onClick={() => onViewDetails(person)}
      className={`
        p-8 border transition-all cursor-pointer
        ${isDarkMode
          ? 'border-gray-800 hover:border-gray-600'
          : 'border-gray-200 hover:border-gray-400'
        }
      `}
    >
      {/* Header with name and relationship */}
      <div className="mb-6">
        <h3 className={`text-2xl font-light mb-2 ${
          isDarkMode ? 'text-white' : 'text-black'
        }`}>
          {person.name}
        </h3>
        {person.relationship && (
          <p className={`text-sm font-light ${
            isDarkMode ? 'text-gray-500' : 'text-gray-400'
          }`}>
            {person.relationship}
          </p>
        )}
      </div>

      {/* Budget vs Actual */}
      <div className={`flex justify-between items-center py-4 mb-6 border-y ${
        isDarkMode ? 'border-gray-800' : 'border-gray-200'
      }`}>
        <div>
          <div className={`text-xs font-light mb-1 ${
            isDarkMode ? 'text-gray-500' : 'text-gray-400'
          }`}>
            Budgeted
          </div>
          <div className={`text-xl font-light ${
            isDarkMode ? 'text-white' : 'text-black'
          }`}>
            {Currency.format(totalBudget, { showCents: false })}
          </div>
        </div>
        <div className="text-right">
          <div className={`text-xs font-light mb-1 ${
            isDarkMode ? 'text-gray-500' : 'text-gray-400'
          }`}>
            Actual Spent
          </div>
          <div className={`text-xl font-light ${
            isDarkMode ? 'text-white' : 'text-black'
          }`}>
            {Currency.format(spent)}
          </div>
        </div>
      </div>

      {/* Gift Occasions */}
      {holidays.length > 0 && (
        <div className="mb-6">
          <div className={`text-sm font-light mb-2 ${
            isDarkMode ? 'text-gray-500' : 'text-gray-400'
          }`}>
            Gift Occasions
          </div>
          <div className="flex flex-wrap gap-2">
            {holidays.map(holiday => (
              <span
                key={holiday}
                className={`
                  text-xs font-light px-2 py-1 border
                  ${isDarkMode
                    ? 'border-gray-700 text-gray-400'
                    : 'border-gray-300 text-gray-600'
                  }
                `}
              >
                {getOccasionName(holiday)}
              </span>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
