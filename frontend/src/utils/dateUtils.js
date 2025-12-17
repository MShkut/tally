// frontend/src/utils/dateUtils.js
// Centralized date formatting utilities to avoid timezone conversion issues

/**
 * Format a date string for display without timezone conversion
 *
 * Problem: new Date("2024-09-01").toLocaleDateString() interprets the date as UTC,
 * which can display as the previous day in timezones behind UTC.
 *
 * Solution: Parse the date components manually and create the date in local timezone.
 *
 * @param {string} dateString - Date in YYYY-MM-DD format or ISO format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} - Formatted date string
 */
export const formatDate = (dateString, options = {}) => {
  if (!dateString) return '';

  let date;

  // Handle different date formats
  if (typeof dateString === 'string') {
    // Remove time component if present (e.g., "2024-09-01T00:00:00Z" -> "2024-09-01")
    const dateOnly = dateString.split('T')[0];

    // Parse YYYY-MM-DD manually to avoid UTC interpretation
    const parts = dateOnly.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts.map(Number);
      // Validate parsed values
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        // Create date in local timezone (not UTC)
        date = new Date(year, month - 1, day);
      }
    }
  }

  // Fallback: if parsing failed, try standard Date constructor
  if (!date || isNaN(date.getTime())) {
    date = new Date(dateString);
  }

  // Final validation
  if (isNaN(date.getTime())) {
    console.error('[dateUtils] Invalid date:', dateString);
    return 'Invalid Date';
  }

  // Default to short format if no options provided
  const defaultOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options
  };

  return date.toLocaleDateString('en-US', defaultOptions);
};

/**
 * Format date for short display (e.g., "Sep 1")
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string} - Short formatted date
 */
export const formatDateShort = (dateString) => {
  return formatDate(dateString, { month: 'short', day: 'numeric' });
};

/**
 * Format date for long display (e.g., "September 1, 2024")
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string} - Long formatted date
 */
export const formatDateLong = (dateString) => {
  return formatDate(dateString, { month: 'long', day: 'numeric', year: 'numeric' });
};

/**
 * Get today's date in YYYY-MM-DD format
 * @returns {string} - Today's date
 */
export const getTodayISO = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parse YYYY-MM-DD date string to Date object in local timezone
 * Avoids UTC interpretation that causes off-by-one day errors
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {Date|null} - Date object or null if invalid
 */
export const parseDate = (dateString) => {
  if (!dateString) return null;

  // Remove time component if present
  const dateOnly = String(dateString).split('T')[0];

  // Parse YYYY-MM-DD manually
  const parts = dateOnly.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts.map(Number);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      // Create date at noon to avoid any timezone boundary issues
      return new Date(year, month - 1, day, 12, 0, 0);
    }
  }

  return null;
};

/**
 * Get year and month from YYYY-MM-DD date string
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {Object} - {year, month} or null
 */
export const getYearMonth = (dateString) => {
  const date = parseDate(dateString);
  if (!date) return null;

  return {
    year: date.getFullYear(),
    month: date.getMonth() // 0-indexed
  };
};

/**
 * Compare two date strings (YYYY-MM-DD format)
 * @param {string} date1 - First date
 * @param {string} date2 - Second date
 * @returns {number} - Negative if date1 < date2, 0 if equal, positive if date1 > date2
 */
export const compareDates = (date1, date2) => {
  const d1 = parseDate(date1);
  const d2 = parseDate(date2);

  if (!d1 || !d2) return 0;

  return d1.getTime() - d2.getTime();
};

/**
 * Check if date is in given month/year
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @param {number} month - Month (0-11)
 * @param {number} year - Year
 * @returns {boolean}
 */
export const isInMonth = (dateString, month, year) => {
  const ym = getYearMonth(dateString);
  if (!ym) return false;

  return ym.year === year && ym.month === month;
};
