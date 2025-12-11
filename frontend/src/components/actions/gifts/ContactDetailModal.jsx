// frontend/src/components/gifts/ContactDetailModal.jsx

import { useTheme } from 'contexts/ThemeContext';
import { Currency } from 'utils/currency';
import { HOLIDAYS } from 'constants/holidays';

export const ContactDetailModal = ({ person, gifts, onClose }) => {
  const { isDarkMode } = useTheme();

  // Calculate spending per occasion
  const getSpendingByOccasion = (occasionId) => {
    const occasionGifts = gifts.filter(gift =>
      gift.assignedTo?.some(a => a.occasionId === occasionId && a.personId === person.id)
    );

    const spent = occasionGifts.reduce((sum, gift) => {
      const assignment = gift.assignedTo.find(a => a.occasionId === occasionId && a.personId === person.id);
      return sum + (assignment?.amount || 0);
    }, 0);

    return { gifts: occasionGifts, spent };
  };

  // Get occasion name
  const getOccasionName = (occasionId) => {
    const standardHoliday = HOLIDAYS.find(h => h.id === occasionId);
    if (standardHoliday) return standardHoliday.name;

    const customOccasion = person.customOccasions?.find(co => co.id === occasionId);
    if (customOccasion) return customOccasion.name;

    return occasionId;
  };

  // Calculate total budget
  const totalBudget = Object.values(person.budgets || {}).reduce(
    (sum, amount) => sum + (parseFloat(amount) || 0), 0
  );

  // Calculate total spent
  const totalSpent = (person.applicableHolidays || []).reduce((sum, occasionId) => {
    const { spent } = getSpendingByOccasion(occasionId);
    return sum + spent;
  }, 0);

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-8 pointer-events-none">
        <div
          className={`
            w-full max-w-3xl max-h-[80vh] overflow-y-auto pointer-events-auto
            border shadow-2xl
            ${isDarkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'}
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`
            sticky top-0 p-8 border-b z-10
            ${isDarkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'}
          `}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className={`text-3xl font-light mb-2 ${
                  isDarkMode ? 'text-white' : 'text-black'
                }`}>
                  {person.name}
                </h2>
                {person.relationship && (
                  <p className={`text-base font-light ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {person.relationship}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className={`
                  text-2xl font-light transition-colors
                  ${isDarkMode
                    ? 'text-gray-500 hover:text-white'
                    : 'text-gray-400 hover:text-black'
                  }
                `}
              >
                ×
              </button>
            </div>

            {/* Total Summary */}
            <div className={`
              flex justify-between items-center pt-4 border-t
              ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}
            `}>
              <div>
                <div className={`text-sm font-light ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  Annual Budget
                </div>
                <div className={`text-2xl font-light ${
                  isDarkMode ? 'text-white' : 'text-black'
                }`}>
                  {Currency.format(totalBudget, { showCents: false })}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-light ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  Total Spent
                </div>
                <div className={`text-2xl font-light ${
                  isDarkMode ? 'text-white' : 'text-black'
                }`}>
                  {Currency.format(totalSpent)}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-light ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  Remaining
                </div>
                <div className={`text-2xl font-light ${
                  totalBudget - totalSpent < 0
                    ? isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    : isDarkMode ? 'text-white' : 'text-black'
                }`}>
                  {Currency.format(Math.max(0, totalBudget - totalSpent))}
                  {totalBudget - totalSpent < 0 && (
                    <span className="text-sm ml-2">
                      (Over by {Currency.format(Math.abs(totalBudget - totalSpent))})
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Occasions List */}
          <div className="p-8 space-y-8">
            {person.applicableHolidays && person.applicableHolidays.length > 0 ? (
              person.applicableHolidays.map(occasionId => {
                const { gifts: occasionGifts, spent } = getSpendingByOccasion(occasionId);
                const budget = person.budgets?.[occasionId] || 0;
                const remaining = budget - spent;

                return (
                  <div
                    key={occasionId}
                    className={`
                      pb-8 border-b
                      ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}
                    `}
                  >
                    {/* Occasion Header */}
                    <div className="mb-4">
                      <h3 className={`text-xl font-light mb-3 ${
                        isDarkMode ? 'text-white' : 'text-black'
                      }`}>
                        {getOccasionName(occasionId)}
                      </h3>

                      <div className="flex gap-8">
                        <div>
                          <div className={`text-xs font-light ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-400'
                          }`}>
                            Budget
                          </div>
                          <div className={`text-lg font-light ${
                            isDarkMode ? 'text-white' : 'text-black'
                          }`}>
                            {Currency.format(budget)}
                          </div>
                        </div>
                        <div>
                          <div className={`text-xs font-light ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-400'
                          }`}>
                            Spent
                          </div>
                          <div className={`text-lg font-light ${
                            isDarkMode ? 'text-white' : 'text-black'
                          }`}>
                            {Currency.format(spent)}
                          </div>
                        </div>
                        <div>
                          <div className={`text-xs font-light ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-400'
                          }`}>
                            Remaining
                          </div>
                          <div className={`text-lg font-light ${
                            remaining < 0
                              ? isDarkMode ? 'text-gray-300' : 'text-gray-700'
                              : isDarkMode ? 'text-white' : 'text-black'
                          }`}>
                            {Currency.format(Math.max(0, remaining))}
                            {remaining < 0 && (
                              <span className="text-sm ml-1">
                                (Over by {Currency.format(Math.abs(remaining))})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Gifts/Transactions */}
                    {occasionGifts.length > 0 ? (
                      <div className="space-y-3 mt-6">
                        <div className={`text-sm font-light ${
                          isDarkMode ? 'text-gray-500' : 'text-gray-400'
                        }`}>
                          Gifts
                        </div>
                        {occasionGifts.map(gift => {
                          const assignment = gift.assignedTo.find(
                            a => a.occasionId === occasionId && a.personId === person.id
                          );

                          return (
                            <div
                              key={gift.id}
                              className={`
                                p-4 border
                                ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}
                              `}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className={`font-light mb-1 ${
                                    isDarkMode ? 'text-white' : 'text-black'
                                  }`}>
                                    {gift.description}
                                  </div>
                                  <div className={`text-xs font-light ${
                                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                                  }`}>
                                    {new Date(gift.purchasedAt).toLocaleDateString()}
                                  </div>
                                </div>
                                <div className={`text-lg font-light ${
                                  isDarkMode ? 'text-white' : 'text-black'
                                }`}>
                                  {Currency.format(assignment?.amount || 0)}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className={`text-sm font-light mt-4 ${
                        isDarkMode ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        No gifts assigned yet
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className={`text-center py-8 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>
                No occasions set for this person
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
