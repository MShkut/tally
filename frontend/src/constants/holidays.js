// frontend/src/constants/holidays.js
// Centralized holiday/occasion definitions for gift management

export const HOLIDAYS = [
  {
    id: 'birthday',
    name: 'Birthday',
    type: 'personal',
    description: 'Personal birthday'
  },
  {
    id: 'christmas',
    name: 'Christmas',
    type: 'fixed',
    date: 'Dec 25',
    description: 'December 25th'
  },
  {
    id: 'mothers-day',
    name: "Mother's Day",
    type: 'calculated',
    date: '2nd Sunday in May',
    description: '2nd Sunday in May'
  },
  {
    id: 'fathers-day',
    name: "Father's Day",
    type: 'calculated',
    date: '3rd Sunday in June',
    description: '3rd Sunday in June'
  },
  {
    id: 'valentines',
    name: "Valentine's Day",
    type: 'fixed',
    date: 'Feb 14',
    description: 'February 14th'
  },
  {
    id: 'anniversary',
    name: 'Anniversary',
    type: 'personal',
    description: 'Personal anniversary'
  },
  {
    id: 'other',
    name: 'Other',
    type: 'custom',
    description: 'Custom occasion'
  }
];

/**
 * Get holiday by ID
 * @param {string} id - Holiday ID
 * @returns {Object|null} Holiday object or null
 */
export const getHolidayById = (id) => {
  return HOLIDAYS.find(h => h.id === id) || null;
};

/**
 * Get holiday name by ID
 * @param {string} id - Holiday ID
 * @returns {string} Holiday name
 */
export const getHolidayName = (id) => {
  const holiday = getHolidayById(id);
  return holiday ? holiday.name : id;
};

/**
 * Format holiday display name with optional date
 * @param {string} id - Holiday ID
 * @param {boolean} includeDate - Include date in display
 * @returns {string} Formatted holiday name
 */
export const formatHolidayDisplay = (id, includeDate = false) => {
  const holiday = getHolidayById(id);
  if (!holiday) return id;

  if (includeDate && holiday.date) {
    return `${holiday.name} (${holiday.date})`;
  }

  return holiday.name;
};
