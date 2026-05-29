/**
 * Unit tests for the UI layer:
 *   formatCurrency, renderBalance, renderErrors, clearErrors,
 *   showStorageWarning, hideStorageWarning
 *
 * Requirements: 2.2, 3.1, 3.4, 3.5, 5.5, 5.6, 6.3
 *
 * Strategy: The UI functions are defined inside an IIFE in app.js.
 * We replicate the same logic here as a testable ES module so we can
 * exercise every branch in isolation with a jsdom DOM environment.
 */

import { describe, it, expect, beforeEach } from 'vitest';

// ─── Inline implementation (mirrors app.js UI layer exactly) ──────────────

function formatCurrency(amount) {
  return '$' + amount.toFixed(2);
}

function renderBalance(txns) {
  const total = txns.reduce(function (sum, t) { return sum + t.amount; }, 0);
  document.getElementById('balance-display').textContent = formatCurrency(total);
}

function renderErrors(errors) {
  document.getElementById('error-name').textContent = errors.name || '';
  document.getElementById('error-amount').textContent = errors.amount || '';
  document.getElementById('error-category').textContent = errors.category || '';
}

function clearErrors() {
  renderErrors({ name: null, amount: null, category: null });
}

function showStorageWarning(message) {
  document.getElementById('storage-warning-msg').textContent = message;
  document.getElementById('storage-warning').removeAttribute('hidden');
}

function hideStorageWarning() {
  document.getElementById('storage-warning').setAttribute('hidden', '');
}

// ─── DOM setup helper ─────────────────────────────────────────────────────

function setupDOM() {
  document.body.innerHTML = `
    <div id="storage-warning" hidden>
      <p id="storage-warning-msg"></p>
    </div>
    <p id="balance-display">$0.00</p>
    <span id="error-name"></span>
    <span id="error-amount"></span>
    <span id="error-category"></span>
  `;
}

// ─── formatCurrency ───────────────────────────────────────────────────────

describe('formatCurrency', () => {
  it('formats zero as $0.00', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('formats a whole number with two decimal places', () => {
    expect(formatCurrency(5)).toBe('$5.00');
  });

  it('formats a value with one decimal place', () => {
    expect(formatCurrency(4.5)).toBe('$4.50');
  });

  it('formats a value with two decimal places', () => {
    expect(formatCurrency(4.50)).toBe('$4.50');
  });

  it('formats the minimum valid amount', () => {
    expect(formatCurrency(0.01)).toBe('$0.01');
  });

  it('formats the maximum valid amount', () => {
    expect(formatCurrency(999999.99)).toBe('$999999.99');
  });

  it('rounds to two decimal places', () => {
    expect(formatCurrency(1.005)).toBe('$1.01');
  });

  it('returns a string starting with $', () => {
    expect(formatCurrency(12.34).startsWith('$')).toBe(true);
  });

  it('matches the pattern $X.XX', () => {
    expect(formatCurrency(42.5)).toMatch(/^\$\d+\.\d{2}$/);
  });
});

// ─── renderBalance ────────────────────────────────────────────────────────

describe('renderBalance', () => {
  beforeEach(setupDOM);

  it('shows $0.00 for an empty transactions array', () => {
    renderBalance([]);
    expect(document.getElementById('balance-display').textContent).toBe('$0.00');
  });

  it('shows the formatted amount for a single transaction', () => {
    renderBalance([{ amount: 4.50 }]);
    expect(document.getElementById('balance-display').textContent).toBe('$4.50');
  });

  it('sums multiple transactions correctly', () => {
    renderBalance([{ amount: 4.50 }, { amount: 2.00 }, { amount: 12.00 }]);
    expect(document.getElementById('balance-display').textContent).toBe('$18.50');
  });

  it('handles a single transaction with a whole number amount', () => {
    renderBalance([{ amount: 10 }]);
    expect(document.getElementById('balance-display').textContent).toBe('$10.00');
  });

  it('updates the DOM element textContent', () => {
    const el = document.getElementById('balance-display');
    el.textContent = '$99.99';
    renderBalance([{ amount: 5.00 }]);
    expect(el.textContent).toBe('$5.00');
  });
});

// ─── renderErrors ─────────────────────────────────────────────────────────

describe('renderErrors', () => {
  beforeEach(setupDOM);

  it('sets all error spans when all errors are provided', () => {
    renderErrors({
      name: 'Item name is required.',
      amount: 'Amount is required.',
      category: 'Please select a category.',
    });
    expect(document.getElementById('error-name').textContent).toBe('Item name is required.');
    expect(document.getElementById('error-amount').textContent).toBe('Amount is required.');
    expect(document.getElementById('error-category').textContent).toBe('Please select a category.');
  });

  it('clears a span when the corresponding error is null', () => {
    // Pre-populate
    document.getElementById('error-name').textContent = 'old error';
    renderErrors({ name: null, amount: null, category: null });
    expect(document.getElementById('error-name').textContent).toBe('');
  });

  it('sets only the name error when amount and category are null', () => {
    renderErrors({ name: 'Name error', amount: null, category: null });
    expect(document.getElementById('error-name').textContent).toBe('Name error');
    expect(document.getElementById('error-amount').textContent).toBe('');
    expect(document.getElementById('error-category').textContent).toBe('');
  });

  it('sets only the amount error when name and category are null', () => {
    renderErrors({ name: null, amount: 'Amount error', category: null });
    expect(document.getElementById('error-name').textContent).toBe('');
    expect(document.getElementById('error-amount').textContent).toBe('Amount error');
    expect(document.getElementById('error-category').textContent).toBe('');
  });

  it('sets only the category error when name and amount are null', () => {
    renderErrors({ name: null, amount: null, category: 'Category error' });
    expect(document.getElementById('error-name').textContent).toBe('');
    expect(document.getElementById('error-amount').textContent).toBe('');
    expect(document.getElementById('error-category').textContent).toBe('Category error');
  });
});

// ─── clearErrors ──────────────────────────────────────────────────────────

describe('clearErrors', () => {
  beforeEach(setupDOM);

  it('clears all error spans', () => {
    document.getElementById('error-name').textContent = 'Name error';
    document.getElementById('error-amount').textContent = 'Amount error';
    document.getElementById('error-category').textContent = 'Category error';

    clearErrors();

    expect(document.getElementById('error-name').textContent).toBe('');
    expect(document.getElementById('error-amount').textContent).toBe('');
    expect(document.getElementById('error-category').textContent).toBe('');
  });

  it('is a no-op when errors are already empty', () => {
    clearErrors();
    expect(document.getElementById('error-name').textContent).toBe('');
    expect(document.getElementById('error-amount').textContent).toBe('');
    expect(document.getElementById('error-category').textContent).toBe('');
  });
});

// ─── showStorageWarning ───────────────────────────────────────────────────

describe('showStorageWarning', () => {
  beforeEach(setupDOM);

  it('sets the warning message text', () => {
    showStorageWarning('Storage unavailable.');
    expect(document.getElementById('storage-warning-msg').textContent).toBe('Storage unavailable.');
  });

  it('removes the hidden attribute from #storage-warning', () => {
    const el = document.getElementById('storage-warning');
    expect(el.hasAttribute('hidden')).toBe(true);
    showStorageWarning('Some warning');
    expect(el.hasAttribute('hidden')).toBe(false);
  });

  it('updates the message when called multiple times', () => {
    showStorageWarning('First message');
    showStorageWarning('Second message');
    expect(document.getElementById('storage-warning-msg').textContent).toBe('Second message');
  });

  it('makes the banner visible even if already visible', () => {
    const el = document.getElementById('storage-warning');
    el.removeAttribute('hidden');
    showStorageWarning('Still visible');
    expect(el.hasAttribute('hidden')).toBe(false);
  });
});

// ─── hideStorageWarning ───────────────────────────────────────────────────

describe('hideStorageWarning', () => {
  beforeEach(setupDOM);

  it('adds the hidden attribute to #storage-warning', () => {
    const el = document.getElementById('storage-warning');
    el.removeAttribute('hidden');
    hideStorageWarning();
    expect(el.hasAttribute('hidden')).toBe(true);
  });

  it('is a no-op when the banner is already hidden', () => {
    const el = document.getElementById('storage-warning');
    expect(el.hasAttribute('hidden')).toBe(true);
    hideStorageWarning();
    expect(el.hasAttribute('hidden')).toBe(true);
  });

  it('hides the banner after showStorageWarning was called', () => {
    showStorageWarning('A warning');
    hideStorageWarning();
    expect(document.getElementById('storage-warning').hasAttribute('hidden')).toBe(true);
  });
});
