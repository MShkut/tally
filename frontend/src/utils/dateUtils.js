// frontend/src/utils/dateUtils.js
// Centralized date formatting utilities to avoid timezone conversion issues

/**
 * Format a YYYY-MM-DD date string for display without timezone conversion
 *
 * Problem: new Date("2024-09-01").toLocaleDateString() interprets the date as UTC,
 * which can display as the previous day in timezones behind UTC.
 *
 * Solution: Parse the date components manually and create the date in local timezone.
 *
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} - Formatted date string
 */
export const formatDate = (dateString, options = {}) => {
  if (!dateString) return '';

  // Parse YYYY-MM-DD manually to avoid UTC interpretation
  const [year, month, day] = dateString.split('-').map(Number);

  // Create date in local timezone (not UTC)
  const date = new Date(year, month - 1, day);

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
