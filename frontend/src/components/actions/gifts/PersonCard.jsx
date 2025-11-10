// frontend/src/components/gifts/PersonCard.jsx
import React from 'react';

import { useTheme } from 'contexts/ThemeContext';
import { Currency } from 'utils/currency';
import { HOLIDAYS } from 'constants/holidays';

export const PersonCard = ({ person, onEdit, onDelete, spent = 0 }) => {
  const { isDarkMode } = useTheme();

  // Calculate total budget for this person
  const totalBudget = Object.values(person.budgets || {}).reduce(
    (sum, amount) => sum + (parseFloat(amount) || 0), 0
  );

  const remaining = totalBudget - spent;
  const isOverBudget = remaining < 0;

  // Get applicable holidays
  const holidays = person.applicableHolidays || [];
  
  // Format birthday
  const formatBirthday = (birthday) => {
    if (!birthday) return null;
    const date = new Date(birthday);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  return (
    <div className={`
      p-8 border transition-all
      ${isDarkMode
        ? 'border-gray-800 hover:border-gray-600'
        : 'border-gray-200 hover:border-gray-400'
      }
    `}>
      {/* Header with actions */}
      <div className="flex justify-between items-start mb-6">
        <div>
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
        
        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => onEdit(person)}
            className={`
              text-sm font-light transition-colors
              ${isDarkMode 
                ? 'text-gray-500 hover:text-gray-300' 
                : 'text-gray-400 hover:text-gray-600'
              }
            `}
            title="Edit person"
          >
            Edit
          </button>
          <button
            onClick={() => {
              if (window.confirm(`Remove ${person.name} from your gift list?`)) {
                onDelete(person.id);
              }
            }}
            className={`
              text-sm font-light transition-colors
              ${isDarkMode 
                ? 'text-gray-500 hover:text-red-400' 
                : 'text-gray-400 hover:text-red-600'
              }
            `}
            title="Remove person"
          >
            Remove
          </button>
        </div>
      </div>
      
      {/* Birthday */}
      {person.birthday && (
        <div className={`text-sm font-light mb-4 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          🎂 {formatBirthday(person.birthday)}
        </div>
      )}
      
      {/* Budget info */}
      <div className={`py-4 border-t ${
        isDarkMode ? 'border-gray-800' : 'border-gray-200'
      }`}>
        <div className={`text-sm font-light mb-2 ${
          isDarkMode ? 'text-gray-500' : 'text-gray-400'
        }`}>
          Annual Gift Budget
        </div>
        <div className={`text-2xl font-light mb-2 ${
          isDarkMode ? 'text-white' : 'text-black'
        }`}>
          {Currency.format(totalBudget, { showCents: false })}
        </div>
        {spent > 0 && (
          <div className={`text-sm font-light ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Spent: {Currency.format(spent)} • Remaining: {Currency.format(Math.max(0, remaining))}
            {isOverBudget && (
              <span className={`ml-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                (Over by {Currency.format(Math.abs(remaining))})
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Holidays */}
      {holidays.length > 0 && (
        <div className={`pt-4 border-t ${
          isDarkMode ? 'border-gray-800' : 'border-gray-200'
        }`}>
          <div className={`text-sm font-light mb-2 ${
            isDarkMode ? 'text-gray-500' : 'text-gray-400'
          }`}>
            Gift Occasions
          </div>
          <div className="flex flex-wrap gap-2">
            {holidays.map(holiday => {
              // Get occasion name - check standard holidays first, then custom
              const getOccasionName = (id) => {
                const standardHoliday = HOLIDAYS.find(h => h.id === id);
                if (standardHoliday) return standardHoliday.name;

                const customOccasion = person.customOccasions?.find(co => co.id === id);
                if (customOccasion) return customOccasion.name;

                return id;
              };

              return (
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
              );
            })}
          </div>
        </div>
      )}
      
      {/* Quick actions */}
      <div className={`mt-6 pt-4 border-t ${
        isDarkMode ? 'border-gray-800' : 'border-gray-200'
      }`}>
        <button
          onClick={() => onEdit(person)}
          className={`
            w-full text-center text-sm font-light border-b border-transparent 
            hover:border-current pb-1 transition-colors
            ${isDarkMode 
              ? 'text-gray-400 hover:text-white' 
              : 'text-gray-600 hover:text-black'
            }
          `}
        >
          Set Gift Budgets
        </button>
      </div>
    </div>
  );
};
