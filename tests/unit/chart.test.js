/**
 * Unit tests for the chart layer:
 *   buildChartData(txns)
 *
 * Requirements: 4.1
 *
 * Strategy: The function is defined inside an IIFE in app.js.
 * We replicate the same logic here as a testable ES module so we can
 * exercise every branch in isolation.
 */

import { describe, it, expect } from 'vitest';

// ─── Inline implementation (mirrors app.js chart layer exactly) ────────────

const CATEGORIES = ['Food', 'Transport', 'Fun'];
const CATEGORY_COLORS = {
  Food: '#f59e0b',
  Transport: '#3b82f6',
  Fun: '#10b981'
};

function buildChartData(txns) {
  const totals = {};
  for (const cat of CATEGORIES) {
    totals[cat] = 0;
  }
  for (const txn of txns) {
    if (totals[txn.category] !== undefined) {
      totals[txn.category] += txn.amount;
    }
  }

  const labels = [];
  const data = [];
  const colors = [];

  for (const cat of CATEGORIES) {
    if (totals[cat] > 0) {
      labels.push(cat);
      data.push(totals[cat]);
      colors.push(CATEGORY_COLORS[cat]);
    }
  }

  return { labels, data, colors };
}

// ─── Helpers ───────────────────────────────────────────────────────────────

const txn = (category, amount) => ({ id: String(Math.random()), name: 'Test', amount, category });

// ─── buildChartData ────────────────────────────────────────────────────────

describe('buildChartData', () => {
  it('returns empty arrays for an empty transaction list', () => {
    const result = buildChartData([]);
    expect(result).toEqual({ labels: [], data: [], colors: [] });
  });

  it('includes a single category with one transaction', () => {
    const result = buildChartData([txn('Food', 5.00)]);
    expect(result.labels).toEqual(['Food']);
    expect(result.data).toEqual([5.00]);
    expect(result.colors).toEqual([CATEGORY_COLORS.Food]);
  });

  it('aggregates multiple transactions in the same category', () => {
    const result = buildChartData([txn('Food', 3.00), txn('Food', 2.50)]);
    expect(result.labels).toEqual(['Food']);
    expect(result.data).toEqual([5.50]);
  });

  it('includes all three categories when each has transactions', () => {
    const txns = [txn('Food', 10), txn('Transport', 5), txn('Fun', 20)];
    const result = buildChartData(txns);
    expect(result.labels).toEqual(['Food', 'Transport', 'Fun']);
    expect(result.data).toEqual([10, 5, 20]);
    expect(result.colors).toEqual([
      CATEGORY_COLORS.Food,
      CATEGORY_COLORS.Transport,
      CATEGORY_COLORS.Fun
    ]);
  });

  it('preserves CATEGORIES canonical order regardless of insertion order', () => {
    // Insert in reverse order: Fun, Transport, Food
    const txns = [txn('Fun', 8), txn('Transport', 4), txn('Food', 2)];
    const result = buildChartData(txns);
    expect(result.labels).toEqual(['Food', 'Transport', 'Fun']);
  });

  it('excludes categories with zero total', () => {
    const result = buildChartData([txn('Transport', 7)]);
    expect(result.labels).not.toContain('Food');
    expect(result.labels).not.toContain('Fun');
    expect(result.labels).toContain('Transport');
  });

  it('excludes a category that had transactions summing to 0 (edge case)', () => {
    // Negative amounts are not valid per spec, but the function should still
    // exclude any category whose total is not > 0
    const result = buildChartData([txn('Food', 0)]);
    expect(result.labels).not.toContain('Food');
  });

  it('assigns the correct color for each included category', () => {
    const result = buildChartData([txn('Fun', 15)]);
    expect(result.colors).toEqual([CATEGORY_COLORS.Fun]);
  });

  it('labels, data, and colors arrays have the same length', () => {
    const txns = [txn('Food', 1), txn('Fun', 2)];
    const result = buildChartData(txns);
    expect(result.labels.length).toBe(result.data.length);
    expect(result.data.length).toBe(result.colors.length);
  });

  it('correctly sums amounts across many transactions in multiple categories', () => {
    const txns = [
      txn('Food', 1.00),
      txn('Food', 2.50),
      txn('Transport', 3.00),
      txn('Fun', 4.00),
      txn('Transport', 1.50),
    ];
    const result = buildChartData(txns);
    expect(result.labels).toEqual(['Food', 'Transport', 'Fun']);
    expect(result.data).toEqual([3.50, 4.50, 4.00]);
  });
});
