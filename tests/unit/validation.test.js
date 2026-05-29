import { describe, it, expect } from 'vitest';
import { validateForm } from '../../js/validation.js';

// ─── Helper: a fully valid set of inputs ─────────────────────────────────────
const VALID_NAME     = 'Coffee';
const VALID_AMOUNT   = '4.50';
const VALID_CATEGORY = 'Food';

describe('validateForm', () => {

  // ── Return shape ────────────────────────────────────────────────────────────
  it('returns an object with name, amount, and category keys', () => {
    const result = validateForm(VALID_NAME, VALID_AMOUNT, VALID_CATEGORY);
    expect(result).toHaveProperty('name');
    expect(result).toHaveProperty('amount');
    expect(result).toHaveProperty('category');
  });

  it('returns all nulls for fully valid inputs', () => {
    const result = validateForm(VALID_NAME, VALID_AMOUNT, VALID_CATEGORY);
    expect(result).toEqual({ name: null, amount: null, category: null });
  });

  // ── Name validation ─────────────────────────────────────────────────────────
  describe('name field', () => {
    it('errors on empty string', () => {
      const { name } = validateForm('', VALID_AMOUNT, VALID_CATEGORY);
      expect(name).toBe('Item name is required.');
    });

    it('errors on whitespace-only string', () => {
      const { name } = validateForm('   ', VALID_AMOUNT, VALID_CATEGORY);
      expect(name).toBe('Item name is required.');
    });

    it('errors on tab-only string', () => {
      const { name } = validateForm('\t', VALID_AMOUNT, VALID_CATEGORY);
      expect(name).toBe('Item name is required.');
    });

    it('errors when name is exactly 101 characters', () => {
      const longName = 'a'.repeat(101);
      const { name } = validateForm(longName, VALID_AMOUNT, VALID_CATEGORY);
      expect(name).toBe('Item name must be 100 characters or fewer.');
    });

    it('errors when name exceeds 100 characters', () => {
      const longName = 'x'.repeat(200);
      const { name } = validateForm(longName, VALID_AMOUNT, VALID_CATEGORY);
      expect(name).toBe('Item name must be 100 characters or fewer.');
    });

    it('accepts a name of exactly 100 characters', () => {
      const maxName = 'a'.repeat(100);
      const { name } = validateForm(maxName, VALID_AMOUNT, VALID_CATEGORY);
      expect(name).toBeNull();
    });

    it('accepts a single-character name', () => {
      const { name } = validateForm('A', VALID_AMOUNT, VALID_CATEGORY);
      expect(name).toBeNull();
    });

    it('accepts a name with leading/trailing spaces (not empty after trim)', () => {
      const { name } = validateForm('  Coffee  ', VALID_AMOUNT, VALID_CATEGORY);
      expect(name).toBeNull();
    });
  });

  // ── Amount validation ───────────────────────────────────────────────────────
  describe('amount field', () => {
    it('errors on empty string', () => {
      const { amount } = validateForm(VALID_NAME, '', VALID_CATEGORY);
      expect(amount).toBe('Amount is required.');
    });

    it('errors on whitespace-only string', () => {
      const { amount } = validateForm(VALID_NAME, '   ', VALID_CATEGORY);
      expect(amount).toBe('Amount is required.');
    });

    it('errors on non-numeric string', () => {
      const { amount } = validateForm(VALID_NAME, 'abc', VALID_CATEGORY);
      expect(amount).toBe('Amount must be a number.');
    });

    it('errors on mixed alphanumeric string', () => {
      const { amount } = validateForm(VALID_NAME, '12abc', VALID_CATEGORY);
      expect(amount).toBe('Amount must be a number.');
    });

    it('errors when amount is below minimum (0.001)', () => {
      const { amount } = validateForm(VALID_NAME, '0.001', VALID_CATEGORY);
      expect(amount).toBe('Amount must be at least $0.01.');
    });

    it('errors when amount is zero', () => {
      const { amount } = validateForm(VALID_NAME, '0', VALID_CATEGORY);
      expect(amount).toBe('Amount must be at least $0.01.');
    });

    it('errors when amount is negative', () => {
      const { amount } = validateForm(VALID_NAME, '-1', VALID_CATEGORY);
      expect(amount).toBe('Amount must be at least $0.01.');
    });

    it('errors when amount exceeds maximum (1000000)', () => {
      const { amount } = validateForm(VALID_NAME, '1000000', VALID_CATEGORY);
      expect(amount).toBe('Amount must not exceed $999,999.99.');
    });

    it('errors when amount is exactly 1000000', () => {
      const { amount } = validateForm(VALID_NAME, '1000000.00', VALID_CATEGORY);
      expect(amount).toBe('Amount must not exceed $999,999.99.');
    });

    it('errors when amount has 3 decimal places', () => {
      const { amount } = validateForm(VALID_NAME, '1.123', VALID_CATEGORY);
      expect(amount).toBe('Amount may have at most two decimal places.');
    });

    it('errors when amount has many decimal places', () => {
      const { amount } = validateForm(VALID_NAME, '1.12345', VALID_CATEGORY);
      expect(amount).toBe('Amount may have at most two decimal places.');
    });

    it('accepts minimum valid amount (0.01)', () => {
      const { amount } = validateForm(VALID_NAME, '0.01', VALID_CATEGORY);
      expect(amount).toBeNull();
    });

    it('accepts maximum valid amount (999999.99)', () => {
      const { amount } = validateForm(VALID_NAME, '999999.99', VALID_CATEGORY);
      expect(amount).toBeNull();
    });

    it('accepts an integer amount', () => {
      const { amount } = validateForm(VALID_NAME, '100', VALID_CATEGORY);
      expect(amount).toBeNull();
    });

    it('accepts an amount with exactly 1 decimal place', () => {
      const { amount } = validateForm(VALID_NAME, '4.5', VALID_CATEGORY);
      expect(amount).toBeNull();
    });

    it('accepts an amount with exactly 2 decimal places', () => {
      const { amount } = validateForm(VALID_NAME, '4.50', VALID_CATEGORY);
      expect(amount).toBeNull();
    });
  });

  // ── Category validation ─────────────────────────────────────────────────────
  describe('category field', () => {
    it('errors on empty string (no selection)', () => {
      const { category } = validateForm(VALID_NAME, VALID_AMOUNT, '');
      expect(category).toBe('Please select a category.');
    });

    it('errors on an unknown category', () => {
      const { category } = validateForm(VALID_NAME, VALID_AMOUNT, 'Entertainment');
      expect(category).toBe('Please select a category.');
    });

    it('errors on lowercase category name', () => {
      const { category } = validateForm(VALID_NAME, VALID_AMOUNT, 'food');
      expect(category).toBe('Please select a category.');
    });

    it('accepts "Food"', () => {
      const { category } = validateForm(VALID_NAME, VALID_AMOUNT, 'Food');
      expect(category).toBeNull();
    });

    it('accepts "Transport"', () => {
      const { category } = validateForm(VALID_NAME, VALID_AMOUNT, 'Transport');
      expect(category).toBeNull();
    });

    it('accepts "Fun"', () => {
      const { category } = validateForm(VALID_NAME, VALID_AMOUNT, 'Fun');
      expect(category).toBeNull();
    });
  });

  // ── Multiple errors at once ─────────────────────────────────────────────────
  describe('multiple invalid fields', () => {
    it('returns errors for all three fields when all are invalid', () => {
      const result = validateForm('', '', '');
      expect(result.name).toBe('Item name is required.');
      expect(result.amount).toBe('Amount is required.');
      expect(result.category).toBe('Please select a category.');
    });

    it('returns errors for name and category when amount is valid', () => {
      const result = validateForm('', VALID_AMOUNT, '');
      expect(result.name).toBe('Item name is required.');
      expect(result.amount).toBeNull();
      expect(result.category).toBe('Please select a category.');
    });
  });
});
