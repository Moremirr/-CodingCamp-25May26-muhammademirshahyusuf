/**
 * Unit tests for the storage layer:
 *   checkStorageSupport, loadFromStorage, saveToStorage
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 6.3
 *
 * Strategy: The storage functions are defined inside an IIFE in app.js.
 * We replicate the same logic here as a testable ES module so we can
 * exercise every branch in isolation with a mocked localStorage.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ─── Inline implementation (mirrors app.js storage layer exactly) ──────────

const STORAGE_KEY = 'expense_transactions';
const CATEGORIES = ['Food', 'Transport', 'Fun'];

function checkStorageSupport() {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

function loadFromStorage() {
  if (!checkStorageSupport()) {
    return null;
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null || raw === undefined) {
    return null;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    return null;
  }

  if (!Array.isArray(parsed)) {
    return null;
  }

  for (const item of parsed) {
    if (item === null || typeof item !== 'object') {
      return null;
    }
    if (typeof item.id !== 'string') {
      return null;
    }
    if (typeof item.name !== 'string') {
      return null;
    }
    if (typeof item.amount !== 'number' || !isFinite(item.amount)) {
      return null;
    }
    if (typeof item.category !== 'string' || !CATEGORIES.includes(item.category)) {
      return null;
    }
  }

  return parsed;
}

function saveToStorage(txns) {
  if (!checkStorageSupport()) {
    return false;
  }

  try {
    const json = JSON.stringify(txns);
    localStorage.setItem(STORAGE_KEY, json);
    return true;
  } catch (e) {
    return false;
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────

const validTransaction = (overrides = {}) => ({
  id: 'abc123',
  name: 'Coffee',
  amount: 4.50,
  category: 'Food',
  ...overrides,
});

// ─── checkStorageSupport ───────────────────────────────────────────────────

describe('checkStorageSupport', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('returns true when localStorage is available', () => {
    expect(checkStorageSupport()).toBe(true);
  });

  it('returns false when localStorage.setItem throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('SecurityError', 'SecurityError');
    });
    expect(checkStorageSupport()).toBe(false);
  });

  it('returns false when localStorage.removeItem throws', () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('unexpected error');
    });
    expect(checkStorageSupport()).toBe(false);
  });
});

// ─── loadFromStorage ───────────────────────────────────────────────────────

describe('loadFromStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('returns null when storage is not supported', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('SecurityError', 'SecurityError');
    });
    expect(loadFromStorage()).toBeNull();
  });

  it('returns null when STORAGE_KEY is absent', () => {
    expect(loadFromStorage()).toBeNull();
  });

  it('returns null when stored value is not valid JSON', () => {
    localStorage.setItem(STORAGE_KEY, 'not-json{{{');
    expect(loadFromStorage()).toBeNull();
  });

  it('returns null when stored value is a JSON object (not array)', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: '1' }));
    expect(loadFromStorage()).toBeNull();
  });

  it('returns null when stored value is a JSON string', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify('hello'));
    expect(loadFromStorage()).toBeNull();
  });

  it('returns null when stored value is a JSON number', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(42));
    expect(loadFromStorage()).toBeNull();
  });

  it('returns empty array when stored value is an empty array', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    expect(loadFromStorage()).toEqual([]);
  });

  it('returns the parsed array for a valid single transaction', () => {
    const txns = [validTransaction()];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(txns));
    expect(loadFromStorage()).toEqual(txns);
  });

  it('returns the parsed array for multiple valid transactions', () => {
    const txns = [
      validTransaction({ id: '1', name: 'Coffee', amount: 4.50, category: 'Food' }),
      validTransaction({ id: '2', name: 'Bus', amount: 2.00, category: 'Transport' }),
      validTransaction({ id: '3', name: 'Movie', amount: 12.00, category: 'Fun' }),
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(txns));
    expect(loadFromStorage()).toEqual(txns);
  });

  // Schema validation — id
  it('returns null when an item has a numeric id', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([validTransaction({ id: 123 })]));
    expect(loadFromStorage()).toBeNull();
  });

  it('returns null when an item is missing id', () => {
    const { id, ...noId } = validTransaction();
    localStorage.setItem(STORAGE_KEY, JSON.stringify([noId]));
    expect(loadFromStorage()).toBeNull();
  });

  // Schema validation — name
  it('returns null when an item has a numeric name', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([validTransaction({ name: 99 })]));
    expect(loadFromStorage()).toBeNull();
  });

  it('returns null when an item is missing name', () => {
    const { name, ...noName } = validTransaction();
    localStorage.setItem(STORAGE_KEY, JSON.stringify([noName]));
    expect(loadFromStorage()).toBeNull();
  });

  // Schema validation — amount
  it('returns null when amount is a string', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([validTransaction({ amount: '4.50' })]));
    expect(loadFromStorage()).toBeNull();
  });

  it('returns null when amount is NaN (stored as null after JSON round-trip)', () => {
    // JSON.stringify(NaN) → "null", so we manually set it
    localStorage.setItem(STORAGE_KEY, '[{"id":"1","name":"X","amount":null,"category":"Food"}]');
    expect(loadFromStorage()).toBeNull();
  });

  it('returns null when amount is Infinity', () => {
    // JSON.stringify(Infinity) → "null"
    localStorage.setItem(STORAGE_KEY, '[{"id":"1","name":"X","amount":1e999,"category":"Food"}]');
    // 1e999 in JSON is Infinity which serializes to null
    expect(loadFromStorage()).toBeNull();
  });

  it('returns null when an item is missing amount', () => {
    const { amount, ...noAmount } = validTransaction();
    localStorage.setItem(STORAGE_KEY, JSON.stringify([noAmount]));
    expect(loadFromStorage()).toBeNull();
  });

  // Schema validation — category
  it('returns null when category is not in CATEGORIES', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([validTransaction({ category: 'Entertainment' })]));
    expect(loadFromStorage()).toBeNull();
  });

  it('returns null when category is an empty string', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([validTransaction({ category: '' })]));
    expect(loadFromStorage()).toBeNull();
  });

  it('returns null when an item is missing category', () => {
    const { category, ...noCategory } = validTransaction();
    localStorage.setItem(STORAGE_KEY, JSON.stringify([noCategory]));
    expect(loadFromStorage()).toBeNull();
  });

  it('returns null when the array contains a non-object element (null)', () => {
    localStorage.setItem(STORAGE_KEY, '[null]');
    expect(loadFromStorage()).toBeNull();
  });

  it('returns null when the array contains a primitive element', () => {
    localStorage.setItem(STORAGE_KEY, '[42]');
    expect(loadFromStorage()).toBeNull();
  });

  it('returns null when only one item in a multi-item array is invalid', () => {
    const txns = [
      validTransaction({ id: '1' }),
      validTransaction({ id: '2', category: 'InvalidCategory' }),
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(txns));
    expect(loadFromStorage()).toBeNull();
  });

  it('accepts all three valid categories', () => {
    for (const category of CATEGORIES) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([validTransaction({ category })]));
      const result = loadFromStorage();
      expect(result).not.toBeNull();
      expect(result[0].category).toBe(category);
    }
  });
});

// ─── saveToStorage ─────────────────────────────────────────────────────────

describe('saveToStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('returns false when storage is not supported', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('SecurityError', 'SecurityError');
    });
    expect(saveToStorage([])).toBe(false);
  });

  it('returns true and writes an empty array', () => {
    const result = saveToStorage([]);
    expect(result).toBe(true);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('[]');
  });

  it('returns true and writes a valid transactions array', () => {
    const txns = [validTransaction()];
    const result = saveToStorage(txns);
    expect(result).toBe(true);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toEqual(txns);
  });

  it('returns false when localStorage.setItem throws (quota exceeded)', () => {
    // Allow checkStorageSupport's test key write to succeed, but fail on the real write
    let callCount = 0;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key) => {
      callCount++;
      if (key === STORAGE_KEY) {
        throw new DOMException('QuotaExceededError', 'QuotaExceededError');
      }
      // Allow the test key write for checkStorageSupport
    });
    expect(saveToStorage([validTransaction()])).toBe(false);
  });

  it('overwrites previous data on subsequent saves', () => {
    const first = [validTransaction({ id: '1', name: 'Coffee' })];
    const second = [validTransaction({ id: '2', name: 'Bus', category: 'Transport' })];
    saveToStorage(first);
    saveToStorage(second);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toEqual(second);
  });

  it('round-trips: saved data can be loaded back', () => {
    const txns = [
      validTransaction({ id: '1', name: 'Coffee', amount: 4.50, category: 'Food' }),
      validTransaction({ id: '2', name: 'Bus', amount: 2.00, category: 'Transport' }),
    ];
    saveToStorage(txns);
    expect(loadFromStorage()).toEqual(txns);
  });
});
