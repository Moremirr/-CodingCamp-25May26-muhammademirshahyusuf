/* js/validation.js — Validation layer (exported for testing) */

const CATEGORIES = ['Food', 'Transport', 'Fun'];
const MAX_NAME_LENGTH = 100;
const MIN_AMOUNT = 0.01;
const MAX_AMOUNT = 999999.99;

/**
 * Validates the add-transaction form fields.
 * @param {string} name     - Raw value from #item-name
 * @param {string} amount   - Raw value from #item-amount
 * @param {string} category - Raw value from #item-category
 * @returns {{ name: string|null, amount: string|null, category: string|null }}
 *   Each field is an error message string, or null if the field is valid.
 */
function validateForm(name, amount, category) {
  let nameError = null;
  let amountError = null;
  let categoryError = null;

  // ── Name validation ────────────────────────────────────────────────────────
  if (name.trim() === '') {
    nameError = 'Item name is required.';
  } else if (name.length > MAX_NAME_LENGTH) {
    nameError = 'Item name must be 100 characters or fewer.';
  }

  // ── Amount validation ──────────────────────────────────────────────────────
  if (amount === '' || amount.trim() === '') {
    amountError = 'Amount is required.';
  } else if (isNaN(amount)) {
    amountError = 'Amount must be a number.';
  } else {
    const numericAmount = Number(amount);
    if (numericAmount < MIN_AMOUNT) {
      amountError = 'Amount must be at least $0.01.';
    } else if (numericAmount > MAX_AMOUNT) {
      amountError = 'Amount must not exceed $999,999.99.';
    } else {
      // Check for more than 2 decimal places using the string representation
      const dotIndex = amount.indexOf('.');
      if (dotIndex !== -1 && amount.length - dotIndex - 1 > 2) {
        amountError = 'Amount may have at most two decimal places.';
      }
    }
  }

  // ── Category validation ────────────────────────────────────────────────────
  if (!CATEGORIES.includes(category)) {
    categoryError = 'Please select a category.';
  }

  return {
    name: nameError,
    amount: amountError,
    category: categoryError
  };
}

export { validateForm, CATEGORIES, MAX_NAME_LENGTH, MIN_AMOUNT, MAX_AMOUNT };
