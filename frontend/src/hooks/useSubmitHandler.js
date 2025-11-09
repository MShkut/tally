import { useState, useCallback } from 'react';

/**
 * Hook to prevent double-click submissions
 * Returns [submitHandler, isSubmitting]
 *
 * @param {Function} onSubmit - Async function to execute on submit
 * @returns {[Function, boolean]} - [submitHandler, isSubmitting]
 *
 * @example
 * const [handleSubmit, isSubmitting] = useSubmitHandler(async (data) => {
 *   await apiService.saveData(data);
 * });
 *
 * <button onClick={() => handleSubmit(data)} disabled={isSubmitting}>
 *   {isSubmitting ? 'Saving...' : 'Save'}
 * </button>
 */
export function useSubmitHandler(onSubmit) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitHandler = useCallback(async (...args) => {
    // Prevent double submission
    if (isSubmitting) {
      console.warn('[Submit] Prevented double-click submission');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(...args);
    } catch (error) {
      // Error is already logged by apiService
      // Re-throw so component can handle it
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [onSubmit, isSubmitting]);

  return [submitHandler, isSubmitting];
}

/**
 * Hook for form submission with validation
 * Returns [submitHandler, isSubmitting, error]
 *
 * @param {Function} onSubmit - Async function to execute on submit
 * @param {Function} validate - Optional validation function (returns error string or null)
 * @returns {[Function, boolean, string|null]} - [submitHandler, isSubmitting, error]
 */
export function useFormSubmit(onSubmit, validate = null) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const submitHandler = useCallback(async (...args) => {
    // Prevent double submission
    if (isSubmitting) {
      console.warn('[Submit] Prevented double-click submission');
      return;
    }

    // Clear previous error
    setError(null);

    // Run validation if provided
    if (validate) {
      const validationError = validate(...args);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      await onSubmit(...args);
    } catch (err) {
      // Use friendly error message if available
      const errorMessage = err.friendlyMessage || err.message || 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [onSubmit, validate, isSubmitting]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return [submitHandler, isSubmitting, error, clearError];
}
