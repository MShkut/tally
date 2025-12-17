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
