// frontend/src/components/gifts/PersonCard.jsx

import { useTheme } from 'contexts/ThemeContext';
import { Currency } from 'utils/currency';
import { HOLIDAYS } from 'constants/holidays';

export const PersonCard = ({ person, onViewDetails, spent = 0, assignedGifts = [] }) => {
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

  // Calculate spent per occasion
  const getOccasionSpent = (occasionId) => {
    const occasionGifts = assignedGifts.filter(gift =>
      gift.assignedTo?.some(a => a.occasionId === occasionId && a.personId === person.id)
    );
    return occasionGifts.reduce((sum, gift) => {
      const assignment = gift.assignedTo.find(a => a.occasionId === occasionId && a.personId === person.id);
      return sum + (assignment?.amount || 0);
    }, 0);
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
            Remaining
          </div>
          <div className={`text-xl font-light ${
            remaining < 0
              ? isDarkMode ? 'text-red-400' : 'text-red-600'
              : isDarkMode ? 'text-green-400' : 'text-green-600'
          }`}>
            {remaining < 0 ? '-' : ''}
            {Currency.format(Math.abs(remaining), { showCents: false })}
          </div>
        </div>
      </div>

      {/* Gift Occasions */}
      {holidays.length > 0 && (
        <div>
          <div className={`text-sm font-light mb-3 ${
            isDarkMode ? 'text-gray-500' : 'text-gray-400'
          }`}>
            Gift Occasions
          </div>
          <div className="space-y-2">
            {holidays.map(holiday => {
              const budget = person.budgets?.[holiday] || 0;
              const occasionSpent = getOccasionSpent(holiday);
              const occasionRemaining = budget - occasionSpent;

              return (
                <div
                  key={holiday}
                  className={`flex justify-between items-center text-sm font-light ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  <span>{getOccasionName(holiday)}</span>
                  <span className={`${
                    occasionRemaining < 0
                      ? isDarkMode ? 'text-red-400' : 'text-red-600'
                      : isDarkMode ? 'text-green-400' : 'text-green-600'
                  }`}>
                    {occasionRemaining < 0 ? '-' : ''}
                    {Currency.format(Math.abs(occasionRemaining), { showCents: false })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
