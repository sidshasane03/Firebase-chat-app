/**
 * Create a debounced function that delays execution until after the specified wait time
 * @param {Function} callback - Function to execute
 * @param {number} delay - Delay in milliseconds (default: 2500ms = 2.5 seconds)
 * @returns {Function} Debounced function
 */
export function createDebounce(callback, delay = 2500) {
  let timeoutId;

  const debounced = () => {
    // Clear previous timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Set new timeout
    timeoutId = setTimeout(() => {
      callback();
    }, delay);
  };

  // Function to cancel the debounce
  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };

  return debounced;
}
